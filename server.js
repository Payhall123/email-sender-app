// Load environment variables
require("dotenv").config();

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const nodemailer = require("nodemailer");
const fs = require("fs");
const crypto = require("crypto");

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0"; // Bind to localhost in dev, all interfaces in production
const port = parseInt(process.env.PORT) || 10000; // Use Render's default port

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Access key management functions
function loadAccessKeys() {
  try {
    const data = fs.readFileSync("access_keys.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading access keys:", error);
    return {};
  }
}

function saveAccessKeys(keys) {
  try {
    fs.writeFileSync("access_keys.json", JSON.stringify(keys, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving access keys:", error);
    return false;
  }
}

function validateAccessKey(accessKey, browserFingerprint) {
  const keys = loadAccessKeys();

  if (!keys[accessKey]) {
    return { valid: false, message: "Invalid access key" };
  }

  const keyData = keys[accessKey];

  // Check if this browser fingerprint already exists
  const existingFingerprint = keyData.browserFingerprints.find(
    (fp) => fp.fingerprint === browserFingerprint
  );

  if (existingFingerprint) {
    // Update last used time for existing browser
    existingFingerprint.lastUsed = new Date().toISOString();
    keyData.lastUsed = new Date().toISOString();
    saveAccessKeys(keys);
    return { valid: true, message: "Access granted - recognized browser" };
  }

  // Check if we can add a new browser
  if (keyData.browserFingerprints.length >= keyData.maxDevices) {
    return {
      valid: false,
      message: `Maximum device limit (${keyData.maxDevices}) reached for this access key`,
    };
  }

  // Add new browser fingerprint
  keyData.browserFingerprints.push({
    fingerprint: browserFingerprint,
    addedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  });

  keyData.usedDevices = keyData.browserFingerprints.length;
  keyData.lastUsed = new Date().toISOString();

  saveAccessKeys(keys);

  return {
    valid: true,
    message: `Access granted - new browser registered (${keyData.usedDevices}/${keyData.maxDevices})`,
  };
}

// Create SMTP transporter with dynamic credentials from modal
function createTransporter(smtpConfig) {
  console.log("Creating SMTP transporter with config:", {
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.user
      ? smtpConfig.user.substring(0, 10) + "..."
      : "NOT_SET",
    secure: smtpConfig.secure,
    provider: smtpConfig.provider || "custom",
  });

  const portNum = parseInt(smtpConfig.port);
  const isSecurePort = portNum === 465;

  // Base configuration
  const config = {
    host: smtpConfig.host,
    port: portNum,
    secure: isSecurePort, // true for SSL (port 465), false for STARTTLS (port 587)
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    debug: true, // Enable debug logs
    logger: true, // Enable logger
  };

  // Provider-specific configurations
  const provider = detectProvider(smtpConfig.host);

  switch (provider) {
    case "sendgrid":
      // SendGrid specific configuration
      config.auth = {
        user: "apikey",
        pass: smtpConfig.password, // This should be the SendGrid API key
      };
      config.tls = {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
      };
      break;

    case "aws-ses":
      // AWS SES specific configuration
      config.tls = {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
      };
      config.requireTLS = true;
      break;

    case "gmail":
      // Gmail specific configuration
      config.tls = {
        rejectUnauthorized: false, // Gmail can be lenient
        minVersion: "TLSv1",
      };
      config.requireTLS = !isSecurePort;
      break;

    case "outlook":
    case "hotmail":
      // Outlook/Hotmail specific configuration
      config.tls = {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      };
      config.requireTLS = true;
      break;

    default:
      // Generic SMTP configuration
      config.tls = {
        rejectUnauthorized: false,
        minVersion: "TLSv1",
        maxVersion: "TLSv1.3",
      };
      config.requireTLS = !isSecurePort;
  }

  return nodemailer.createTransporter(config);
}

// Detect SMTP provider based on host
function detectProvider(host) {
  const hostLower = host.toLowerCase();

  if (hostLower.includes("sendgrid")) return "sendgrid";
  if (hostLower.includes("amazonses") || hostLower.includes("ses."))
    return "aws-ses";
  if (hostLower.includes("gmail")) return "gmail";
  if (hostLower.includes("outlook") || hostLower.includes("hotmail"))
    return "outlook";
  if (hostLower.includes("live.com")) return "hotmail";

  return "custom";
}

// SMTP email sending function
async function sendEmail(mailOptions, smtpConfig) {
  const transporter = createTransporter(smtpConfig);

  // Determine the from address based on provider and configuration
  let fromEmail;
  let fromName = mailOptions.senderName || "Email Sender";

  // Use custom from email if provided and allowed by the provider
  if (mailOptions.fromEmail && isCustomFromAllowed(smtpConfig.host)) {
    fromEmail = mailOptions.fromEmail;
  } else {
    // Fall back to authenticated email address
    fromEmail = smtpConfig.user;
  }

  // For some providers like SendGrid, we need to use the authenticated domain
  const provider = detectProvider(smtpConfig.host);
  if (provider === "sendgrid" && mailOptions.fromEmail) {
    // Extract domain from the authenticated email for SendGrid
    const authDomain = smtpConfig.user.split("@")[1];
    const customEmailDomain = mailOptions.fromEmail.split("@")[1];

    // Only allow custom from email if it's from the same domain as the authenticated email
    if (authDomain === customEmailDomain) {
      fromEmail = mailOptions.fromEmail;
    } else {
      fromEmail = smtpConfig.user;
      console.warn(
        `SendGrid: Custom from email domain (${customEmailDomain}) doesn't match authenticated domain (${authDomain}). Using authenticated email.`
      );
    }
  }

  const mailOptionsWithFrom = {
    from: `${fromName} <${fromEmail}>`,
    to: mailOptions.to,
    subject: mailOptions.subject,
    text: mailOptions.isHtml ? undefined : mailOptions.message,
    html: mailOptions.isHtml ? mailOptions.message : undefined,
    // Add reply-to if custom from email is different from authenticated email
    replyTo:
      mailOptions.fromEmail && mailOptions.fromEmail !== fromEmail
        ? mailOptions.fromEmail
        : undefined,
  };

  console.log(
    `Sending email from: ${mailOptionsWithFrom.from} to: ${mailOptionsWithFrom.to}`
  );
  if (mailOptionsWithFrom.replyTo) {
    console.log(`Reply-To: ${mailOptionsWithFrom.replyTo}`);
  }

  const info = await transporter.sendMail(mailOptionsWithFrom);
  console.log("Message sent: %s", info.messageId);

  return {
    messageId: info.messageId,
    service: `${smtpConfig.host}:${smtpConfig.port}`,
    fromUsed: mailOptionsWithFrom.from,
  };
}

// Check if custom from email is allowed by the provider
function isCustomFromAllowed(host) {
  const provider = detectProvider(host);

  switch (provider) {
    case "sendgrid":
      return true; // SendGrid allows custom from if domain is verified
    case "aws-ses":
      return true; // AWS SES allows custom from if email/domain is verified
    case "gmail":
      return false; // Gmail requires using the authenticated email
    case "outlook":
    case "hotmail":
      return false; // Outlook requires using the authenticated email
    default:
      return true; // Most generic SMTP servers allow custom from
  }
}

// Email retry function for failed emails
async function sendEmailWithRetry(mailOptions, smtpConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await sendEmail(mailOptions, smtpConfig);
      return info;
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed for ${mailOptions.to}:`,
        error.message
      );
      console.log("Full error details:", JSON.stringify(error, null, 2));

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait between retries
      const delay = 2000 * attempt;
      console.log(
        `Waiting ${delay}ms before retry ${attempt + 1}... (${smtpConfig.host})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

let shouldStop = false;

async function handleEmailSending(ws, request) {
  const {
    recipients,
    subject,
    message,
    senderName = "Email Sender App",
    isHtml = false,
    smtpConfig,
    urlConfig, // Added for dynamic URL personalization
  } = request;

  // Reset stop flag
  shouldStop = false;

  // Validate SMTP configuration from modal
  if (
    !smtpConfig ||
    !smtpConfig.host ||
    !smtpConfig.user ||
    !smtpConfig.password
  ) {
    ws.send(
      JSON.stringify({
        type: "error",
        message:
          "SMTP configuration is incomplete. Please configure SMTP settings first.",
      })
    );
    return;
  }

  // Validate input
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Recipients array is required and cannot be empty",
      })
    );
    return;
  }

  if (!subject || !message) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Subject and message are required",
      })
    );
    return;
  }

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = recipients.filter(
    (email) => !emailRegex.test(email.trim())
  );

  if (invalidEmails.length > 0) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: `Invalid email addresses: ${invalidEmails.join(", ")}`,
      })
    );
    return;
  }

  try {
    const results = [];
    const failed = [];
    let processed = 0;

    console.log(
      `📧 Processing ${recipients.length} emails via ${smtpConfig.host}:${smtpConfig.port}`
    );

    ws.send(
      JSON.stringify({
        type: "smtp-connected",
        message: `Connected to ${smtpConfig.host}:${smtpConfig.port} for ${recipients.length} emails`,
        smtpUsed: `${smtpConfig.host}:${smtpConfig.port}`,
      })
    );

    // Send emails individually
    for (const recipient of recipients) {
      try {
        if (shouldStop) {
          console.log("Stopping email send process.");
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Email sending stopped by user.",
            })
          );
          break;
        }

        // Create personalized message with dynamic URL if urlConfig is provided
        let personalizedMessage = message;
        let personalizedURL = null;

        if (urlConfig && urlConfig.baseUrl) {
          // Create personalized URL with email in hash fragment
          personalizedURL = `${urlConfig.baseUrl}?email=${recipient.trim()}`;

          // Replace placeholders in the message
          personalizedMessage = message
            .replace(/\{email\}/gi, recipient.trim())
            .replace(/\{url\}/gi, personalizedURL)
            .replace(/\{recipient\}/gi, recipient.trim());
        }

        const mailOptions = {
          to: recipient.trim(),
          subject: subject,
          message: personalizedMessage,
          senderName: senderName,
          isHtml: isHtml,
          fromEmail: smtpConfig.fromEmail, // Pass custom from email if provided
        };

        console.log(
          `Sending email to ${recipient.trim()} via ${smtpConfig.host}:${
            smtpConfig.port
          }`
        );
        if (personalizedURL) {
          console.log(`  🔗 Personalized URL: ${personalizedURL}`);
        }

        // Send progress update
        ws.send(
          JSON.stringify({
            type: "email-sending",
            recipient: recipient.trim(),
            progress: {
              current: processed + 1,
              total: recipients.length,
            },
            smtpUsed: `${smtpConfig.host}:${smtpConfig.port}`,
            personalizedURL: personalizedURL,
          })
        );

        const info = await sendEmailWithRetry(mailOptions, smtpConfig);
        console.log(
          `Email sent successfully to ${recipient.trim()}, messageId: ${
            info.messageId
          }`
        );

        const result = {
          recipient: recipient.trim(),
          messageId: info.messageId,
          status: "sent",
          smtpUsed: `${smtpConfig.host}:${smtpConfig.port}`,
          personalizedURL: personalizedURL,
        };

        results.push(result);

        // Send individual success notification
        ws.send(
          JSON.stringify({
            type: "email-sent",
            result: result,
            progress: {
              current: processed + 1,
              total: recipients.length,
              sent: results.length,
              failed: failed.length,
            },
          })
        );

        // Short delay between emails for SMTP sending
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 300)
        );
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);

        const failedResult = {
          recipient: recipient.trim(),
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          smtpUsed: `${smtpConfig.host}:${smtpConfig.port}`,
        };

        failed.push(failedResult);

        // Send individual failure notification
        ws.send(
          JSON.stringify({
            type: "email-failed",
            result: failedResult,
            progress: {
              current: processed + 1,
              total: recipients.length,
              sent: results.length,
              failed: failed.length,
            },
          })
        );

        // Stop on authentication error
        if (error.message.includes("Authentication Credentials Invalid")) {
          console.log("Stopping due to authentication error.");
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Stopping due to authentication error.",
            })
          );
          break;
        }
      }
      processed++;
    }

    // Send final summary
    ws.send(
      JSON.stringify({
        type: "send-complete",
        summary: {
          success: true,
          message: `Successfully sent ${results.length} emails via ${smtpConfig.host}:${smtpConfig.port}`,
          results,
          failed,
          totalSent: results.length,
          totalFailed: failed.length,
          loadBalanced: false,
          smtpAccountsUsed: 1,
          service: `${smtpConfig.host}:${smtpConfig.port}`,
        },
      })
    );
  } catch (error) {
    console.error("SMTP email sending error:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send emails via SMTP",
      })
    );
  }
}
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", async (data) => {
      try {
        const request = JSON.parse(data.toString());

        // Validate access key for authenticated actions
        if (request.type === "authenticate") {
          const { accessKey, browserFingerprint } = request;

          if (!accessKey) {
            ws.send(
              JSON.stringify({
                type: "auth-error",
                message: "Access key is required",
              })
            );
            return;
          }

          const validation = validateAccessKey(accessKey, browserFingerprint);

          if (validation.valid) {
            ws.send(
              JSON.stringify({
                type: "auth-success",
                message: validation.message,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "auth-error",
                message: validation.message,
              })
            );
          }
          return;
        }

        if (request.type === "send-emails") {
          // Validate access key before processing emails
          const { accessKey, browserFingerprint } = request;

          if (!accessKey) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Access key is required to send emails",
              })
            );
            return;
          }

          const validation = validateAccessKey(accessKey, browserFingerprint);

          if (!validation.valid) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: validation.message,
              })
            );
            return;
          }

          await handleEmailSending(ws, request);
        } else if (request.type === "stop-sending") {
          shouldStop = true;
          console.log("Stop command received");
          ws.send(
            JSON.stringify({
              type: "stopped",
              message: "Email sending stopped",
            })
          );
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid request format",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send connection confirmation
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket connection established",
      })
    );
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
  });
});
