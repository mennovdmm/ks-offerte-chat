// Function to check the status of a background task

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { taskId } = event.queryStringParameters || {};
    
    if (!taskId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Missing taskId parameter'
        }),
      };
    }

    console.log('🔍 CHECKING TASK:', taskId);
    console.log('📋 CHECK-TASK: Function called for taskId:', taskId);

    // Check if result is available (Netlify Blobs in production, file system in local dev)
    let result = null;
    let resultData = null;
    
    if (context.blobs && context.blobs.get) {
      // Production - use Netlify Blobs
      result = await context.blobs.get(`result-${taskId}`);
      if (result) {
        resultData = JSON.parse(result);
        await context.blobs.delete(`result-${taskId}`);
      }
    } else {
      // Local development - use file system
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '.tmp-results', `result-${taskId}.json`);
      
      if (fs.existsSync(filePath)) {
        result = fs.readFileSync(filePath, 'utf8');
        resultData = JSON.parse(result);
        fs.unlinkSync(filePath); // Clean up
      }
    }
    
    if (result && resultData) {
      console.log('✅ TASK COMPLETED:', taskId);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          result: resultData
        }),
      };
    } else {
      console.log('⏳ TASK STILL PROCESSING:', taskId);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'processing',
          message: 'Task is still being processed...'
        }),
      };
    }

  } catch (error) {
    console.error('❌ ERROR checking task status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Er is een fout opgetreden bij het controleren van de taakstatus.'
      }),
    };
  }
};