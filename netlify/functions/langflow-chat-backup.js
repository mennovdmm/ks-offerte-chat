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
    const { messages, sessionId, uploadedFiles } = JSON.parse(event.body);

    // Prepare the payload for Langflow API
    const langflowPayload = {
      input_value: JSON.stringify({
        messages: messages,
        sessionId: sessionId,
        uploadedFiles: uploadedFiles || []
      }),
      output_type: 'chat',
      input_type: 'chat'
    };

    // Call Langflow API
    const response = await fetch(process.env.LANGFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LANGFLOW_API_KEY
      },
      body: JSON.stringify(langflowPayload)
    });

    if (!response.ok) {
      console.error('Langflow API error:', response.status, response.statusText);
      throw new Error(`Langflow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Langflow response:', data);

    // Extract the relevant information from Langflow response
    // The exact structure depends on your Langflow setup
    let aiMessage = 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.';
    let offertePreview = '';
    let pdfUrl = null;

    // Parse Langflow response based on your flow structure
    if (data.outputs && data.outputs.length > 0) {
      const output = data.outputs[0];
      
      // Extract AI message
      if (output.outputs && output.outputs.length > 0) {
        const chatOutput = output.outputs.find(o => o.type === 'chat' || o.message);
        if (chatOutput && chatOutput.message) {
          aiMessage = chatOutput.message;
        }
      }

      // Extract offerte preview if available
      if (output.offertePreview) {
        offertePreview = output.offertePreview;
      }

      // Extract PDF URL if available
      if (output.pdfUrl) {
        pdfUrl = output.pdfUrl;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: aiMessage,
        offertePreview: offertePreview,
        pdfUrl: pdfUrl,
        success: true
      }),
    };

  } catch (error) {
    console.error('Error calling Langflow API:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Er is een fout opgetreden bij het verwerken van je bericht.',
        success: false
      }),
    };
  }
};