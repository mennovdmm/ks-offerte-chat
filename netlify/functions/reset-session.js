exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { sessionId } = JSON.parse(event.body);

    // Call Langflow API to reset/clear the session
    // This tells Langflow to forget all context for this sessionId
    const response = await fetch(process.env.LANGFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LANGFLOW_API_KEY
      },
      body: JSON.stringify({
        input_value: "", // Empty input to avoid triggering responses
        output_type: 'chat',
        input_type: 'chat',
        session_id: sessionId,
        tweaks: {
          currentUser: "",
          uploadedFiles: ""
        }
      })
    });

    console.log('Session reset response status:', response.status);
    
    if (!response.ok) {
      console.error('Langflow session reset error:', response.status, response.statusText);
      // Don't throw error - session reset is best effort
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Session reset successfully',
        sessionId: sessionId
      }),
    };

  } catch (error) {
    console.error('Error resetting session:', error);
    
    return {
      statusCode: 200, // Return 200 even on error - session reset is best effort
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Session reset failed but continuing with new session',
        error: error.message
      }),
    };
  }
};