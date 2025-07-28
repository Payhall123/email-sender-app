// Cloudflare Worker for Email Sending
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle WebSocket upgrade for real-time communication
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, url, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleWebSocket(request, env) {
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'send-emails') {
        await handleEmailSending(server, data, env);
      } else if (data.type === 'authenticate') {
        await handleAuthentication(server, data, env);
      }
    } catch (error) {
      server.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function handleAPI(request, url, env, corsHeaders) {
  const response = { headers: corsHeaders };
  
  if (url.pathname === '/api/send-email' && request.method === 'POST') {
    try {
      const body = await request.json();
      const result = await sendEmail(body, env);
      return Response.json(result, response);
    } catch (error) {
      return Response.json(
        { error: error.message }, 
        { ...response, status: 500 }
      );
    }
  }

  return Response.json({ error: 'Not Found' }, { ...response, status: 404 });
}

async function sendEmail(emailData, env) {
  const { recipients, subject, message, senderName, smtpConfig } = emailData;
  
  // Use Cloudflare's Email Routing or integrate with external SMTP
  // For now, we'll simulate the response
  return {
    success: true,
    message: `Email sent to ${recipients.length} recipients`,
    totalSent: recipients.length,
    totalFailed: 0
  };
}

async function handleEmailSending(websocket, data, env) {
  const { recipients, subject, message, smtpConfig } = data;
  
  // Simulate sending emails with progress updates
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    // Send progress update
    websocket.send(JSON.stringify({
      type: 'email-sending',
      recipient: recipient,
      progress: {
        current: i + 1,
        total: recipients.length
      }
    }));

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send success notification
    websocket.send(JSON.stringify({
      type: 'email-sent',
      result: {
        recipient: recipient,
        messageId: `msg-${Date.now()}-${i}`,
        status: 'sent'
      }
    }));
  }

  // Send completion message
  websocket.send(JSON.stringify({
    type: 'send-complete',
    summary: {
      success: true,
      totalSent: recipients.length,
      totalFailed: 0,
      message: `Successfully sent ${recipients.length} emails`
    }
  }));
}

async function handleAuthentication(websocket, data, env) {
  const { accessKey } = data;
  
  // Simple authentication check (you should use KV storage for production)
  if (accessKey && accessKey.length > 10) {
    websocket.send(JSON.stringify({
      type: 'auth-success',
      message: 'Authentication successful'
    }));
  } else {
    websocket.send(JSON.stringify({
      type: 'auth-error',
      message: 'Invalid access key'
    }));
  }
}
