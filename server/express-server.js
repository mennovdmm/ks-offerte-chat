const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// HARDCODED LANGFLOW CREDENTIALS (proven to work)
const LANGFLOW_API_URL = 'https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07';
const LANGFLOW_API_KEY = 'sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve React build files (when deployed)
app.use(express.static(path.join(__dirname, '../build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ks-mobile-chat-api',
    port: PORT
  });
});

// Simple health check for root
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ks-mobile-chat-api',
    port: PORT
  });
});

// CRITICAL: Correct endpoint matching frontend calls
app.post('/api/chat', async (req, res) => {
  console.log('🚀 MOBILE API: /api/chat endpoint called');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { message, sessionId, uploadedFiles, currentUser } = req.body;
    
    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Typ een bericht om te beginnen.'
      });
    }

    console.log('📤 Calling Langflow API...');
    console.log('🔗 URL:', LANGFLOW_API_URL);
    
    // EXACT working Langflow payload structure from VPS
    const langflowPayload = {
      input_value: JSON.stringify({
        messages: message ? [{ content: message, role: 'user' }] : [],
        sessionId: sessionId || 'default',
        uploadedFiles: uploadedFiles || [],
        currentUser: currentUser || null
      }),
      input_type: "chat",
      output_type: "chat",
      session_id: sessionId || 'default'
    };

    // Call Langflow API with hardcoded credentials
    const langflowResponse = await fetch(LANGFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LANGFLOW_API_KEY
      },
      body: JSON.stringify(langflowPayload),
      signal: AbortSignal.timeout(60000) // 1 minute timeout
    });

    if (!langflowResponse.ok) {
      console.error('❌ Langflow API error:', langflowResponse.status);
      throw new Error(`Langflow API error: ${langflowResponse.status}`);
    }

    const langflowData = await langflowResponse.json();
    console.log('✅ Langflow response received');

    // Extract message from Langflow response structure - EXACT working path
    let aiMessage = '';
    if (langflowData.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message) {
      aiMessage = langflowData.outputs[0].outputs[0].messages[0].message;
    } else {
      aiMessage = 'AI response extraction failed';
    }
    
    // Bulletproof response format for frontend compatibility - EXACT working structure
    const responseData = {
      success: true,
      messageLength: aiMessage.length,
      hasError: false,
      isBackgroundTask: false,
      messageParts: [{text: aiMessage || 'No message', type: 'text'}],
      message: aiMessage,
      text: aiMessage,
      content: aiMessage
    };
    
    console.log('✅ Sending response:', { success: true, messageLength: aiMessage.length });
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    const errorMessage = `Er is een fout opgetreden: ${error.message}`;
    res.status(500).json({
      success: false,
      hasError: true,
      messageParts: [{text: errorMessage, type: 'text'}],
      message: errorMessage,
      text: errorMessage,
      content: errorMessage
    });
  }
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MOBILE API: Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🌐 Langflow URL: ${LANGFLOW_API_URL}`);
});

module.exports = app;