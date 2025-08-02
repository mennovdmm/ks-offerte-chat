const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build (React app lives in /var/www/ai.dehuisraad.com)
// This is just the API server

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ks-streaming-api',
    port: PORT
  });
});

// Simple health check for root
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ks-streaming-api',
    port: PORT
  });
});

// Main Langflow streaming endpoint with EXACT response format from briefing  
// Route: /langflow-stream (nginx proxies /api/ to this server)
app.post('/langflow-stream', async (req, res) => {
  console.log('🚀 VPS EXPRESS: /api/langflow-stream endpoint called');
  console.log('🚀 VPS EXPRESS: Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { message, sessionId, uploadedFiles, currentUser } = req.body;
    
    console.log('📥 VPS: Received message:', message?.substring(0, 100));
    console.log('📥 VPS: Session ID:', sessionId);
    console.log('📥 VPS: User:', currentUser?.name);

    // Don't send empty messages
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Empty message',
        message: 'Typ een bericht om te beginnen.'
      });
    }

    // Prepare Langflow payload
    const langflowPayload = {
      input_value: message,
      output_type: 'chat',
      input_type: 'chat',
      session_id: sessionId,
      user_name: currentUser?.name || '',
      user_email: currentUser?.email || '',
      tweaks: {
        currentUser: currentUser ? JSON.stringify(currentUser) : "",
        userName: currentUser?.name || "",
        userEmail: currentUser?.email || "",
        uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : ""
      }
    };

    console.log('🚀 VPS: Calling Langflow API...');
    
    // Call Langflow with extended timeout
    const langflowResponse = await fetch(process.env.LANGFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LANGFLOW_API_KEY
      },
      body: JSON.stringify(langflowPayload),
      signal: AbortSignal.timeout(300000) // 5 minute timeout - NO LIMITS!
    });

    if (!langflowResponse.ok) {
      throw new Error(`Langflow API error: ${langflowResponse.status}`);
    }

    const langflowData = await langflowResponse.json();
    console.log('✅ VPS: Got Langflow response');

    // Parse response and extract AI message
    let aiMessage = 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.';
    let pdfUrl = null;

    if (langflowData.outputs && langflowData.outputs.length > 0) {
      const output = langflowData.outputs[0];
      
      if (output.outputs && output.outputs.length > 0) {
        // Extract PDF URLs
        for (const outputItem of output.outputs) {
          if (outputItem.component_display_name && 
              outputItem.component_display_name.toLowerCase().includes('pdf')) {
            if (outputItem.outputs && outputItem.outputs.length > 0) {
              for (const pdfOutput of outputItem.outputs) {
                if (typeof pdfOutput === 'string' && pdfOutput.includes('http')) {
                  pdfUrl = pdfOutput;
                  console.log('📄 VPS: Found PDF URL:', pdfUrl);
                  break;
                }
              }
            }
          }
        }
        
        // Extract AI messages
        for (const outputItem of output.outputs) {
          if (outputItem.component_display_name && 
              (outputItem.component_display_name.toLowerCase().includes('pdf') ||
               outputItem.component_display_name.toLowerCase().includes('file') ||
               outputItem.component_display_name.toLowerCase().includes('tool'))) {
            continue;
          }
          
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

    // BULLETPROOF RESPONSE - Frontend kan dit NIET kapot maken
    const responseData = {
      "success": true,
      "messageLength": aiMessage ? aiMessage.length : 0,
      "hasError": false,
      "isBackgroundTask": false,
      // TRIPLE BACKUP: Altijd array, geen null mogelijk
      "messageParts": Array.isArray([{text: aiMessage || 'No message', type: 'text'}]) ? 
        [{text: aiMessage || 'No message', type: 'text'}] : 
        [{text: 'Fallback message', type: 'text'}],
      // EXTRA FALLBACK FIELDS voor frontend compatibility
      "message": aiMessage || 'Default message',
      "text": aiMessage || 'Default text',
      "content": aiMessage || 'Default content',
      "pdfUrl": pdfUrl || null,
      "streaming": true
    };
    
    console.log('🎯 VPS: Sending response:', {
      success: responseData.success,
      messageLength: responseData.messageLength,
      hasMessageParts: !!responseData.messageParts,
      hasPdf: !!responseData.pdfUrl
    });

    res.json(responseData);
    
  } catch (error) {
    console.error('❌ VPS EXPRESS: Error:', error);
    
    const errorMessage = `Er is een fout opgetreden: ${error.message}`;
    const errorResponse = {
      success: false,
      hasError: true,
      messageLength: errorMessage.length,
      isBackgroundTask: false,
      // BULLETPROOF ERROR RESPONSE - Altijd array
      messageParts: [{text: errorMessage, type: 'text'}],
      // MULTIPLE FALLBACK FIELDS
      message: errorMessage,
      text: errorMessage,
      content: errorMessage,
      error: 'Internal server error',
      pdfUrl: null
    };
    
    res.status(500).json(errorResponse);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VPS EXPRESS: Server running on port ${PORT}`);
  console.log(`🚀 VPS EXPRESS: Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 VPS EXPRESS: Langflow endpoint: http://localhost:${PORT}/langflow-stream`);
  console.log(`🌐 VPS EXPRESS: Public endpoint: https://ai.dehuisraad.com/api/langflow-stream`);
  console.log(`🔥 VPS EXPRESS: NO TIMEOUT LIMITS - 300 second processing time!`);
});

module.exports = app;