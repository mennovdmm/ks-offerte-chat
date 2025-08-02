const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import the langflow handler function
const { handler: langflowHandler } = require('./langflow-chat-for-vps');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ks-streaming-api'
  });
});

// Main Langflow streaming endpoint
app.post('/api/langflow-stream', async (req, res) => {
  console.log('🚀 EXPRESS: /api/langflow-stream endpoint called');
  console.log('🚀 EXPRESS: Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Convert Express request to Netlify function format
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers,
      queryStringParameters: req.query
    };
    
    const context = {
      callbackWaitsForEmptyEventLoop: false
    };
    
    console.log('🔄 EXPRESS: Calling langflow handler...');
    
    // Call the langflow handler
    const result = await langflowHandler(event, context);
    
    console.log('✅ EXPRESS: Handler response:', {
      statusCode: result.statusCode,
      hasBody: !!result.body,
      bodyLength: result.body ? result.body.length : 0
    });
    
    // Send response
    res.status(result.statusCode);
    
    // Set headers
    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.set(key, result.headers[key]);
      });
    }
    
    // Send body
    if (result.body) {
      if (result.headers && result.headers['Content-Type'] === 'application/json') {
        res.json(JSON.parse(result.body));
      } else {
        res.send(result.body);
      }
    } else {
      res.end();
    }
    
  } catch (error) {
    console.error('❌ EXPRESS: Error in langflow endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      success: false
    });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ EXPRESS: Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    success: false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EXPRESS: Server running on port ${PORT}`);
  console.log(`🚀 EXPRESS: Health check: http://localhost:${PORT}/api/health`);
  console.log(`🚀 EXPRESS: Langflow endpoint: http://localhost:${PORT}/api/langflow-stream`);
});

module.exports = app;