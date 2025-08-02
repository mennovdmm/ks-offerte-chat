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

// Main chat endpoint - CLEAN AND SIMPLE
app.post('/api/chat', async (req, res) => {
  console.log('🚀 MOBILE API: /api/chat endpoint called');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { message, sessionId } = req.body;
    
    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Typ een bericht om te beginnen.'
      });
    }

    console.log('📤 Calling Langflow API...');
    console.log('🔗 URL:', LANGFLOW_API_URL);
    
    // Prepare Langflow payload
    const langflowPayload = {
      input_value: message,
      output_type: 'chat',
      input_type: 'chat',
      session_id: sessionId || 'default-session'
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

    // Extract AI message from Langflow response
    let aiMessage = 'Bedankt voor je bericht. Hoe kan ik je verder helpen?';
    
    if (langflowData.outputs && langflowData.outputs.length > 0) {
      const output = langflowData.outputs[0];
      
      if (output.outputs && output.outputs.length > 0) {
        for (const outputItem of output.outputs) {
          if (outputItem.messages && outputItem.messages.length > 0) {
            const firstMessage = outputItem.messages[0];
            if (firstMessage.message && typeof firstMessage.message === 'string') {
              aiMessage = firstMessage.message;
              break;
            }
          }
        }
      }
    }

    // Return clean response
    const response = {
      success: true,
      message: aiMessage
    };
    
    console.log('✅ Sending response:', { success: true, messageLength: aiMessage.length });
    res.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    const errorMessage = `Er is een fout opgetreden: ${error.message}`;
    res.status(500).json({
      success: false,
      message: errorMessage
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