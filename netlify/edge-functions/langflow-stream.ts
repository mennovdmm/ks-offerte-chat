// Netlify Edge Function for streaming Langflow responses
// No timeout limits - perfect for long-running AI tasks

export default async (request: Request, context: any) => {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, sessionId, uploadedFiles, currentUser } = await request.json();
    
    console.log('🌊 EDGE: Starting Langflow stream for message:', message.substring(0, 100));
    
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

    console.log('🚀 EDGE: Calling Langflow API...');
    
    // Get environment variables (Edge Functions use Deno.env)
    const langflowApiUrl = Deno.env.get('LANGFLOW_API_URL');
    const langflowApiKey = Deno.env.get('LANGFLOW_API_KEY');
    
    console.log('🔑 EDGE: Environment check:', {
      hasUrl: !!langflowApiUrl,
      hasKey: !!langflowApiKey,
      urlPrefix: langflowApiUrl?.substring(0, 30)
    });

    if (!langflowApiUrl || !langflowApiKey) {
      throw new Error('Missing LANGFLOW_API_URL or LANGFLOW_API_KEY environment variables');
    }

    // Call Langflow - no timeout limit in Edge Functions!
    const response = await fetch(langflowApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': langflowApiKey
      },
      body: JSON.stringify(langflowPayload)
    });

    if (!response.ok) {
      throw new Error(`Langflow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ EDGE: Got Langflow response');

    // Parse response
    let aiMessage = 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.';
    let pdfUrl = null;

    if (data.outputs && data.outputs.length > 0) {
      const output = data.outputs[0];
      
      if (output.outputs && output.outputs.length > 0) {
        // Extract PDF URLs
        for (const outputItem of output.outputs) {
          if (outputItem.component_display_name && 
              outputItem.component_display_name.toLowerCase().includes('pdf')) {
            if (outputItem.outputs && outputItem.outputs.length > 0) {
              for (const pdfOutput of outputItem.outputs) {
                if (typeof pdfOutput === 'string' && pdfOutput.includes('http')) {
                  pdfUrl = pdfOutput;
                  console.log('📄 EDGE: Found PDF URL:', pdfUrl);
                  break;
                }
              }
            }
          }
        }
        
        // Extract messages
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
              // Clean HTML to markdown
              aiMessage = firstMessage.message
                .replace(/<br\s*\/?>/g, '\n')
                .replace(/<p[^>]*>/g, '\n')
                .replace(/<\/p>/g, '\n')
                .replace(/<strong>/g, '**')
                .replace(/<\/strong>/g, '**')
                .replace(/<[^>]*>/g, '')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();
              break;
            }
          }
        }
      }
    }

    // Return JSON response with streaming flag
    return new Response(JSON.stringify({
      message: aiMessage,
      pdfUrl: pdfUrl,
      success: true,
      streaming: true
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ EDGE ERROR:', error);
    
    return new Response(JSON.stringify({
      error: `Edge function error: ${error.message}`,
      success: false
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};

export const config = {
  path: "/api/langflow-stream"
};