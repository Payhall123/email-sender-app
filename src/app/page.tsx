"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import {
  Mail,
  Plus,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

interface EmailFormData {
  senderName: string;
  subject: string;
  message: string;
  isHtml: boolean;
  dynamicUrl: string;
}

interface EmailResult {
  recipient: string;
  messageId?: string;
  status: string;
  error?: string;
}

interface SendResponse {
  success: boolean;
  message: string;
  results: EmailResult[];
  failed: EmailResult[];
  totalSent: number;
  totalFailed: number;
  smtpUsed: string;
}

export default function Home() {
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendResult, setSendResult] = useState<SendResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [processingStats, setProcessingStats] = useState<{
    batchesProcessed: number;
    totalBatches: number;
    emailsPerSecond: number;
    estimatedTimeRemaining: number;
  } | null>(null);
  const [currentSocket, setCurrentSocket] = useState<WebSocket | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(3);

  // Authentication states
  const [accessKey, setAccessKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authError, setAuthError] = useState("");
  const [browserFingerprint, setBrowserFingerprint] = useState("");

  // SMTP Configuration states
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    user: "",
    password: "",
    secure: false,
    fromEmail: "", // Custom from email address
    provider: "custom", // Provider type for preset configurations
  });
  const [showPassword, setShowPassword] = useState(false);

  // Generate browser fingerprint
  const generateBrowserFingerprint = () => {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return btoa(`${userAgent}-${language}-${screen}-${timezone}`);
  };

  // Authentication function
  const authenticateUser = async () => {
    if (!accessKey.trim()) {
      setAuthError("Please enter an access key");
      return;
    }

    const fingerprint = generateBrowserFingerprint();
    setBrowserFingerprint(fingerprint);

    const socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }/ws`
    );

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "authenticate",
          accessKey: accessKey.trim(),
          browserFingerprint: fingerprint,
        })
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "auth-success") {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthError("");
        toast.success(message.message);
        socket.close();
      } else if (message.type === "auth-error") {
        setAuthError(message.message);
        socket.close();
      }
    };

    socket.onerror = () => {
      setAuthError("Failed to connect to authentication server");
      socket.close();
    };
  };

  // SMTP Provider presets
  const smtpPresets = {
    gmail: {
      host: "smtp.gmail.com",
      port: "587",
      secure: false,
      provider: "gmail",
    },
    outlook: {
      host: "smtp-mail.outlook.com",
      port: "587",
      secure: false,
      provider: "outlook",
    },
    sendgrid: {
      host: "smtp.sendgrid.net",
      port: "587",
      secure: false,
      provider: "sendgrid",
    },
    "aws-ses": {
      host: "email-smtp.us-east-1.amazonaws.com",
      port: "587",
      secure: false,
      provider: "aws-ses",
    },
    custom: {
      host: "",
      port: "587",
      secure: false,
      provider: "custom",
    },
  };

  // Apply SMTP preset
  const applySmtpPreset = (presetName: string) => {
    const preset = smtpPresets[presetName as keyof typeof smtpPresets];
    if (preset) {
      setSmtpConfig((prev) => ({
        ...prev,
        host: preset.host,
        port: preset.port,
        secure: preset.secure,
        provider: preset.provider,
      }));
    }
  };

  // Update SMTP config
  const updateSmtpConfig = (field: string, value: string | boolean) => {
    setSmtpConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    defaultValues: {
      senderName: "",
      subject: "",
      message: "",
      isHtml: false,
      dynamicUrl: "",
    },
  });

  const addRecipient = () => {
    if (currentEmail.trim()) {
      // Handle bulk email input (comma, semicolon, space, or newline separated)
      const emailsToAdd = currentEmail
        .split(/[,;\s\n]+/) // Split by comma, semicolon, space, or newline
        .map((email) => email.trim())
        .filter((email) => email !== "");

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails: string[] = [];
      const invalidEmails: string[] = [];

      emailsToAdd.forEach((email) => {
        if (emailRegex.test(email)) {
          if (!recipients.includes(email) && !validEmails.includes(email)) {
            validEmails.push(email);
          }
        } else {
          invalidEmails.push(email);
        }
      });

      if (validEmails.length > 0) {
        setRecipients([
          ...recipients.filter((email) => email !== ""),
          ...validEmails,
        ]);
        setCurrentEmail("");

        // Show success message for bulk add
        if (validEmails.length > 1) {
          alert(`Successfully added ${validEmails.length} email addresses`);
        }
      }

      if (invalidEmails.length > 0) {
        alert(`Invalid email addresses found: ${invalidEmails.join(", ")}`);
      }
    } else {
      setRecipients([...recipients, ""]);
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Check if the pasted text contains multiple emails
    const emails = pastedText
      .split(/[,;\s\n]+/)
      .map((email) => email.trim())
      .filter((email) => email !== "");

    if (emails.length > 1) {
      // Bulk paste detected
      setCurrentEmail(pastedText);
      // Auto-trigger add after a short delay to allow the input to update
      setTimeout(() => {
        addRecipient();
      }, 100);
    } else {
      // Single email paste - use default behavior
      setCurrentEmail(pastedText.trim());
    }
  };

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients.length === 0 ? [""] : newRecipients);
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const connectWebSocket = () => {
    // Use proper WebSocket URL for both development and production
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // In development, connect to localhost:3000, in production use current host
    const isDev =
      window.location.hostname === "localhost" &&
      window.location.port === "3000";
    const wsHost = isDev ? "localhost:3000" : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
    const socket = new WebSocket(wsUrl);
    const connectionTimeout: NodeJS.Timeout = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        toast.error(
          "Failed to connect to email server. Please check your internet connection."
        );
        setIsLoading(false);
        socket.close();
      }
    }, 5000);

    socket.onopen = () => {
      console.log("WebSocket connected");
      clearTimeout(connectionTimeout);
      toast.success("Connected to the email server");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "connected":
            toast.success("High-Performance Email Server Connected");
            break;
          case "bulk-start":
            toast.success(
              `🚀 Starting bulk email sending for ${message.totalEmails} recipients`
            );
            toast(`⚡ Estimated completion: ${message.estimatedTime} seconds`, {
              icon: "⚡",
              duration: 3000,
            });
            break;
          case "batch-processing":
            toast(`🔄 ${message.message}`, {
              icon: "🔄",
              duration: 1500,
            });
            if (message.progress) {
              setProcessingStats({
                batchesProcessed: message.progress.currentBatch,
                totalBatches: message.progress.totalBatches,
                emailsPerSecond: 0,
                estimatedTimeRemaining: 0,
              });
            }
            break;
          case "warning":
            toast.error(`⚠️ ${message.message}`, {
              duration: 5000,
            });
            break;
          case "smtp-connected":
            toast.success(`Connected to SMTP: ${message.smtpUsed}`);
            break;
          case "email-sending":
            toast(`📤 Sending to ${message.recipient}`, {
              icon: "📤",
              duration: 1000,
            });
            break;
          case "email-sent":
            // Real-time removal of sent emails from the list
            if (message.removeFromList) {
              setRecipients((prevRecipients) =>
                prevRecipients.filter(
                  (email) => email.trim() !== message.result.recipient
                )
              );
              setSentEmails((prev) => [...prev, message.result.recipient]);
            }
            toast.success(`✅ ${message.result.recipient}`, {
              duration: 2000,
            });
            break;
          case "email-failed":
            toast.error(`❌ Failed: ${message.result.recipient}`, {
              duration: 3000,
            });
            break;
          case "send-complete":
            const summary = message.summary;
            if (summary.totalFailed === 0) {
              toast.success(
                `🎉 All ${summary.totalSent} emails sent successfully in ${summary.totalTime}s!`
              );
              toast(`⚡ Speed: ${summary.emailsPerSecond} emails/second`, {
                icon: "⚡",
                duration: 5000,
              });
              // Reset form on complete success
              reset();
              setRecipients([""]);
            } else {
              toast.error(
                `⚠️ ${summary.totalSent} sent, ${summary.totalFailed} failed`
              );
            }
            setSendResult(summary);
            setShowResult(true);
            setIsLoading(false);
            setProcessingStats(null);
            setSentEmails([]);
            socket.close();
            break;
          case "error":
            toast.error(`Error: ${message.message}`);
            setIsLoading(false);
            setProcessingStats(null);
            socket.close();
            break;
          default:
            console.log("Unexpected message: ", message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        toast.error("Error processing server response");
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      clearTimeout(connectionTimeout);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      clearTimeout(connectionTimeout);
      toast.error("WebSocket connection error");
      setIsLoading(false);
    };

    return socket;
  };

  const stopSending = () => {
    if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
      setIsStopping(true);
      toast.error("🛑 Stopping email sending...", { duration: 2000 });

      // Send stop command to server
      currentSocket.send(
        JSON.stringify({
          type: "stop-sending",
        })
      );

      // Close the connection
      currentSocket.close();

      // Reset states
      setTimeout(() => {
        setIsLoading(false);
        setIsStopping(false);
        setProcessingStats(null);
        setCurrentSocket(null);
        toast.success("Email sending stopped");
      }, 1000);
    }
  };

  const onSubmit: SubmitHandler<EmailFormData> = (data) => {
    const validRecipients = recipients.filter((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email.trim() && emailRegex.test(email.trim());
    });

    if (validRecipients.length === 0) {
      toast.error("Please add at least one valid email recipient");
      return;
    }

    if (!isAuthenticated || !accessKey) {
      toast.error("Please authenticate with your access key first");
      return;
    }

    setIsLoading(true);
    setIsStopping(false);
    setSendResult(null);
    setShowResult(false);

    const socket = connectWebSocket();
    setCurrentSocket(socket);

    // Wait for WebSocket to connect before sending the message
    socket.addEventListener("open", () => {
      // Prepare URL configuration if provided
      const urlConfig = data.dynamicUrl ? { baseUrl: data.dynamicUrl } : null;

      socket.send(
        JSON.stringify({
          type: "send-emails",
          recipients: validRecipients,
          subject: data.subject,
          message: data.message,
          senderName: data.senderName,
          isHtml: data.isHtml,
          accessKey: accessKey,
          browserFingerprint: browserFingerprint,
          smtpConfig: smtpConfig,
          urlConfig: urlConfig,
          delaySeconds: delaySeconds,
        })
      );
    });
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <Key className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Access Key Required
              </h2>
            </div>

            <p className="text-gray-600 mb-6">
              Please enter your access key to use this email sender application.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="accessKey"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Access Key
                </label>
                <input
                  type="text"
                  id="accessKey"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter your access key"
                  className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      authenticateUser();
                    }
                  }}
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              <button
                onClick={authenticateUser}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Authenticate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  SMTP Configuration
                </h2>
              </div>
              <button
                onClick={() => setShowSmtpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-600 mb-6">
                Configure your SMTP server settings for sending emails.
              </p>

              <div className="space-y-4">
                {/* Provider Presets */}
                <div>
                  <label
                    htmlFor="smtpPreset"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Provider
                  </label>
                  <select
                    id="smtpPreset"
                    value={smtpConfig.provider}
                    onChange={(e) => {
                      applySmtpPreset(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook/Hotmail</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="aws-ses">AWS SES</option>
                    <option value="custom">Custom SMTP</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a preset to auto-fill SMTP settings for popular
                    providers.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="smtpHost"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    id="smtpHost"
                    value={smtpConfig.host}
                    onChange={(e) => updateSmtpConfig("host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="smtpPort"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    id="smtpPort"
                    value={smtpConfig.port}
                    onChange={(e) => updateSmtpConfig("port", e.target.value)}
                    placeholder="587"
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="smtpUser"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    SMTP Username
                    {smtpConfig.provider === "sendgrid" && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Use &apos;apikey&apos;)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="smtpUser"
                    value={smtpConfig.user}
                    onChange={(e) => updateSmtpConfig("user", e.target.value)}
                    placeholder={
                      smtpConfig.provider === "sendgrid"
                        ? "apikey"
                        : "your-email@gmail.com"
                    }
                    className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="smtpPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    SMTP Password
                    {smtpConfig.provider === "sendgrid" && (
                      <span className="text-xs text-gray-500 ml-2">
                        (SendGrid API Key)
                      </span>
                    )}
                    {smtpConfig.provider === "aws-ses" && (
                      <span className="text-xs text-gray-500 ml-2">
                        (AWS Access Key Secret)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="smtpPassword"
                      value={smtpConfig.password}
                      onChange={(e) =>
                        updateSmtpConfig("password", e.target.value)
                      }
                      placeholder={
                        smtpConfig.provider === "sendgrid"
                          ? "SG.xxxxxxxxxxxx..."
                          : smtpConfig.provider === "aws-ses"
                          ? "Your AWS Secret Access Key"
                          : "Your app password or SMTP password"
                      }
                      className="w-full px-3 text-black py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom From Email */}
                <div>
                  <label
                    htmlFor="fromEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Custom From Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="fromEmail"
                    value={smtpConfig.fromEmail}
                    onChange={(e) =>
                      updateSmtpConfig("fromEmail", e.target.value)
                    }
                    placeholder="Custom sender email address"
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {smtpConfig.provider === "gmail" ||
                    smtpConfig.provider === "outlook"
                      ? "⚠️ Gmail and Outlook require using the authenticated email address."
                      : smtpConfig.provider === "sendgrid"
                      ? "✅ SendGrid allows custom from emails if the domain is verified."
                      : smtpConfig.provider === "aws-ses"
                      ? "✅ AWS SES allows custom from emails if the email/domain is verified."
                      : "✅ Most SMTP servers allow custom from email addresses."}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={smtpConfig.secure}
                    onChange={(e) =>
                      updateSmtpConfig("secure", e.target.checked)
                    }
                    className="h-4 w-4 text-black text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="smtpSecure"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Use SSL/TLS (port 465)
                  </label>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Buttons */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSmtpModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSmtpModal(false);
                    toast.success("SMTP configuration saved!");
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Email Sender
                </h1>
              </div>
            
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  Delay
                </h1>
                <select
                  className="ml-4 px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                >
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowSmtpModal(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                SMTP Settings
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Sender Name */}
              <div>
                <label
                  htmlFor="senderName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sender Name
                </label>
                <input
                  type="text"
                  id="senderName"
                  {...register("senderName")}
                  placeholder="Enter sender name (e.g., Your Company, Your Name)"
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.senderName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.senderName.message}
                  </p>
                )}
              </div>

              {/* Recipients Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  💡 Tip: You can paste multiple emails separated by commas,
                  semicolons, spaces, or new lines
                </p>
                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecipient(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Quick add email input */}
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="email"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      onPaste={handleEmailPaste}
                      placeholder="Type email and press + to add (supports bulk paste)"
                      className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRecipient();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  {...register("subject")}
                  placeholder="Enter email subject"
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Dynamic URL */}
              <div>
                <label
                  htmlFor="dynamicUrl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Landing Page URL (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  🔗 Enter your landing page URL. Each recipient&apos;s email
                  will be automatically added to the URL as a hash fragment
                  (e.g., yoursite.com#recipient@email.com)
                </p>
                <input
                  type="url"
                  id="dynamicUrl"
                  {...register("dynamicUrl")}
                  placeholder="https://yoursite.com/landing-page (recipient emails will be appended as #email)"
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Use{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {"{"}url{"}"}
                  </code>{" "}
                  in your message to insert the personalized URL for each
                  recipient
                </p>
                {errors.dynamicUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dynamicUrl.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  {...register("message")}
                  rows={8}
                  placeholder="Enter your email message"
                  className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* HTML Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHtml"
                  {...register("isHtml")}
                  className="h-4 w-4 text-black text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isHtml"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Send as HTML
                </label>
              </div>

              {/* Send/Stop Buttons */}
              <div className="flex justify-end space-x-3">
                {isLoading && (
                  <button
                    type="button"
                    onClick={stopSending}
                    disabled={isStopping}
                    className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isStopping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Stop Sending
                      </>
                    )}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Emails
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Real-time Processing Stats */}
            {isLoading && processingStats && (
              <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center mb-3">
                  <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                  <h3 className="text-lg font-semibold text-blue-900">
                    High-Speed Bulk Processing
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-blue-800 font-semibold">
                      Batch Progress
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {processingStats.batchesProcessed} /{" "}
                      {processingStats.totalBatches}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-blue-800 font-semibold">
                      Remaining Recipients
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {recipients.filter((email) => email.trim() !== "").length}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-blue-800 font-semibold">
                      Sent Successfully
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {sentEmails.length}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (processingStats.batchesProcessed /
                            processingStats.totalBatches) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Processing at high speed with parallel batch sending...
                  </p>
                </div>
              </div>
            )}

            {/* Results Section */}
            {showResult && sendResult && (
              <div className="mt-8 p-6 border rounded-lg bg-gray-50">
                <div className="flex items-center mb-4">
                  {sendResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send Results
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-green-800 font-semibold">
                      Successfully Sent
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {sendResult.totalSent || 0}
                    </div>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg">
                    <div className="text-red-800 font-semibold">Failed</div>
                    <div className="text-2xl font-bold text-red-900">
                      {sendResult.totalFailed || 0}
                    </div>
                  </div>
                </div>

                {sendResult.smtpUsed && (
                  <p className="text-sm text-gray-600 mb-4">
                    SMTP Used: {sendResult.smtpUsed}
                  </p>
                )}

                {sendResult.results && sendResult.results.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Successful Sends:
                    </h4>
                    <div className="space-y-1">
                      {sendResult.results.map((result, index) => (
                        <div
                          key={index}
                          className="text-sm text-green-700 bg-green-50 p-2 rounded"
                        >
                          ✓ {result.recipient}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sendResult.failed && sendResult.failed.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">
                      Failed Sends:
                    </h4>
                    <div className="space-y-1">
                      {sendResult.failed.map((result, index) => (
                        <div
                          key={index}
                          className="text-sm text-red-700 bg-red-50 p-2 rounded"
                        >
                          ✗ {result.recipient}: {result.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
