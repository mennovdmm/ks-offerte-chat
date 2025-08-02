// Function to clean HTML content and convert to proper markdown
function cleanHtmlToMarkdown(content) {
  if (!content || typeof content !== 'string') return content;
  
  console.log('🧹 CLEANING HTML - Input length:', content.length);
  console.log('🧹 First 300 chars:', content.substring(0, 300));
  
  let cleaned = content
    // Convert standalone HTML lists to markdown (not inside table cells)
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '')
    .replace(/<ul>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<ol>/g, '')
    .replace(/<\/ol>/g, '')
    
    // Convert HTML table rows to markdown table format
    .replace(/<tr><td>/g, '| ')
    .replace(/<\/td><td>/g, ' | ')
    .replace(/<\/td><\/tr>/g, ' |')
    .replace(/<tr[^>]*><td[^>]*>/g, '| ')
    .replace(/<\/td><td[^>]*>/g, ' | ')
    .replace(/<\/td><\/tr>/g, ' |')
    
    // Clean up any remaining table tags
    .replace(/<table[^>]*>/g, '')
    .replace(/<\/table>/g, '')
    .replace(/<thead[^>]*>/g, '')
    .replace(/<\/thead>/g, '')
    .replace(/<tbody[^>]*>/g, '')
    .replace(/<\/tbody>/g, '')
    .replace(/<th[^>]*>/g, '')
    .replace(/<\/th>/g, ' | ')
    
    // Convert other HTML formatting
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<b>/g, '**')
    .replace(/<\/b>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<i>/g, '*')
    .replace(/<\/i>/g, '*')
    
    // Remove any remaining HTML tags completely
    .replace(/<[^>]*>/g, '')
    
    // Clean up extra whitespace and newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  console.log('✅ CLEANED - Output length:', cleaned.length);
  console.log('✅ First 300 chars:', cleaned.substring(0, 300));
  return cleaned;
}

// Handle streaming requests
async function handleStreamingRequest(event, context, timeoutDuration = 45000) {
  try {
    const requestBody = JSON.parse(event.body);
    console.log('🌊 STREAMING: Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Handle both old format (messages array) and new format (message string)
    let message;
    if (requestBody.message) {
      message = requestBody.message;
    } else if (requestBody.messages && requestBody.messages.length > 0) {
      message = requestBody.messages[requestBody.messages.length - 1].content;
    }
    
    const { sessionId, uploadedFiles, currentUser } = requestBody;
    
    console.log('🌊 STREAMING: Starting streaming request');
    console.log('🌊 STREAMING: Extracted message:', message ? message.substring(0, 100) : 'NO MESSAGE');
    console.log('🌊 STREAMING: Session ID:', sessionId);
    console.log('🌊 STREAMING: Current User:', currentUser?.name || 'NO USER');
    
    // Don't send empty messages to Langflow - it triggers auto-responses
    if (!message || message.trim() === '') {
      console.log('❌ STREAMING: Empty message received, returning error');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Empty message',
          message: 'Typ een bericht om te beginnen.',
          success: false
        }),
      };
    }
    
    // Don't enhance message in streaming - frontend already does this
    let enhancedMessage = message;
    
    const langflowPayload = {
      input_value: enhancedMessage,
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
    
    console.log('🚀 STREAMING: Calling Langflow API...');
    
    const response = await fetch(process.env.LANGFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LANGFLOW_API_KEY
      },
      body: JSON.stringify(langflowPayload),
      signal: AbortSignal.timeout(timeoutDuration) // Dynamic timeout based on message length
    });
    
    if (!response.ok) {
      throw new Error(`Langflow API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ STREAMING: Got Langflow response');
    
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
                  console.log('📄 STREAMING: Found PDF URL:', pdfUrl);
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
              aiMessage = cleanHtmlToMarkdown(firstMessage.message);
              break;
            }
          }
        }
      }
    }
    
    // Send complete response immediately - frontend will handle streaming animation
    console.log('🌊 STREAMING: Sending complete response for frontend streaming');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: aiMessage,
        pdfUrl: pdfUrl,
        success: true,
        streaming: true // Flag to indicate this should be streamed on frontend
      }),
    };
    
  } catch (error) {
    console.error('❌ STREAMING ERROR:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: `Er is een fout opgetreden: ${error.message}`,
        success: false
      }),
    };
  }
}

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

  // Check if streaming is requested - default to streaming for VPS
  let streaming = true; // Default to streaming for VPS deployment
  try {
    const requestBody = JSON.parse(event.body);
    // Only disable streaming if explicitly set to false
    if (requestBody.streaming === false) {
      streaming = false;
    }
  } catch (parseError) {
    console.error('Error parsing request body for streaming check:', parseError);
  }
  
  // Check message length to decide on timeout - increase all timeouts
  let timeoutDuration = 45000; // Default 45s (was 25s)
  try {
    const requestBody = JSON.parse(event.body);
    const messageLength = (requestBody.message || '').length;
    
    if (messageLength > 500) {
      timeoutDuration = 90000; // 90s for long messages (was 60s)
      console.log('📊 HANDLER: Long message detected, using 90s timeout');
    } else {
      console.log('⚡ HANDLER: Short message, using 45s timeout');
    }
  } catch (e) {
    console.error('Error checking message length:', e);
  }
  
  // If streaming is requested, use streaming
  if (streaming) {
    console.log('🌊 HANDLER: Streaming request detected, delegating to streaming handler');
    return handleStreamingRequest(event, context, timeoutDuration);
  }

  try {
    const requestBody = JSON.parse(event.body);
    console.log('🔍 NON-STREAMING: Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Handle both old format (messages array) and new format (message string)
    let message;
    if (requestBody.message) {
      message = requestBody.message;
    } else if (requestBody.messages && requestBody.messages.length > 0) {
      message = requestBody.messages[requestBody.messages.length - 1].content; // Get the last message content
    }
    
    const { sessionId, uploadedFiles, currentUser } = requestBody;
    
    console.log('🔍 NON-STREAMING: Extracted message:', message ? message.substring(0, 100) : 'NO MESSAGE');
    console.log('🔍 NON-STREAMING: Session ID:', sessionId);
    console.log('🔍 NON-STREAMING: Current User:', currentUser?.name || 'NO USER');
    
    // Don't send empty messages to Langflow - it triggers auto-responses
    if (!message || message.trim() === '') {
      console.log('Empty message received, not sending to Langflow');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Typ een bericht om te beginnen.',
          success: true
        }),
      };
    }

    // Prepare the payload for Langflow API - enhanced format with user context
    const langflowPayload = {
      input_value: message, // Just the message text
      output_type: 'chat',
      input_type: 'chat',
      session_id: sessionId, // Add session_id at top level
      // Add user context directly at top level for better recognition
      user_name: currentUser?.name || '',
      user_email: currentUser?.email || '',
      tweaks: {
        currentUser: currentUser ? JSON.stringify(currentUser) : "",
        userName: currentUser?.name || "",
        userEmail: currentUser?.email || "",
        uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : ""
      }
    };

    console.log('Sending to Langflow:', JSON.stringify(langflowPayload, null, 2));
    console.log('🔍 DEBUG: User context being sent:', {
      user_name: langflowPayload.user_name,
      user_email: langflowPayload.user_email,
      currentUser: langflowPayload.tweaks.currentUser
    });

    // For short messages, try fast processing first
    console.log('⚡ SHORT MESSAGE: Trying fast processing first');
    let response;
    
    try {
      response = await fetch(process.env.LANGFLOW_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.LANGFLOW_API_KEY
        },
        body: JSON.stringify(langflowPayload),
        signal: AbortSignal.timeout(timeoutDuration) // Dynamic timeout
      });
      console.log('✅ LANGFLOW API responded successfully');
    } catch (timeoutError) {
      if (timeoutError.name === 'TimeoutError') {
        console.log('⏰ TIMEOUT: Short message took too long, switching to background...');
        throw timeoutError;
      } else {
        throw timeoutError;
      }
    }

    if (!response.ok) {
      console.error('Langflow API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Langflow error response:', errorText);
      
      // Handle specific error cases with user-friendly messages
      let userMessage = `Langflow API error: ${response.status}`;
      if (response.status === 504) {
        userMessage = 'De Langflow server heeft een timeout. Dit gebeurt soms bij PDF generatie. Probeer het opnieuw of vraag om een tekstversie.';
      } else if (response.status === 502 || response.status === 503) {
        userMessage = 'De Langflow server is tijdelijk niet beschikbaar. Probeer het over een minuut opnieuw.';
      } else if (response.status === 500) {
        userMessage = 'Er is een interne fout opgetreden in Langflow. Dit kan door een probleem met PDF generatie komen.';
      }
      
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log('Langflow response:', data);
    console.log('🔍 RAW RESPONSE - Type:', typeof data);
    console.log('🔍 RAW RESPONSE - Keys:', Object.keys(data));

    // Extract the relevant information from Langflow response
    let aiMessage = 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.';
    let offertePreview = '';
    let pdfUrl = null;

    console.log('Full Langflow response:', JSON.stringify(data, null, 2));

    // Parse Langflow response - filter only chat outputs, ignore tool calls
    if (data.outputs && data.outputs.length > 0) {
      console.log('Found outputs, length:', data.outputs.length);
      const output = data.outputs[0];
      console.log('First output component:', output.component_display_name || 'Unknown');
      
      if (output.outputs && output.outputs.length > 0) {
        console.log('Found nested outputs, length:', output.outputs.length);
        
        // First pass: Extract PDF URLs from tool outputs (don't process for chat)
        for (const outputItem of output.outputs) {
          if (outputItem.component_display_name && 
              outputItem.component_display_name.toLowerCase().includes('pdf')) {
            console.log('📄 FOUND PDF output:', outputItem.component_display_name);
            // Try to extract PDF URL from various possible locations
            if (outputItem.outputs && outputItem.outputs.length > 0) {
              for (const pdfOutput of outputItem.outputs) {
                if (typeof pdfOutput === 'string' && pdfOutput.includes('http')) {
                  pdfUrl = pdfOutput;
                  console.log('📄 EXTRACTED PDF URL:', pdfUrl);
                  break;
                }
              }
            }
          }
        }
        
        // Second pass: Filter only chat/text outputs for messages
        for (const outputItem of output.outputs) {
          console.log('Checking output item - Component:', outputItem.component_display_name || 'Unknown');
          console.log('Output item type:', outputItem.type || 'Unknown');
          
          // Skip non-chat outputs (like PDF tools, file generation, etc.) for message extraction
          if (outputItem.component_display_name && 
              (outputItem.component_display_name.toLowerCase().includes('pdf') ||
               outputItem.component_display_name.toLowerCase().includes('file') ||
               outputItem.component_display_name.toLowerCase().includes('tool'))) {
            console.log('🚫 SKIPPING tool output for chat:', outputItem.component_display_name);
            continue;
          }
          
          // Only process chat/text messages
          if (outputItem.messages && outputItem.messages.length > 0) {
            const firstMessage = outputItem.messages[0];
            console.log('Found message in messages array:', firstMessage);
            
            if (firstMessage.message && typeof firstMessage.message === 'string') {
              aiMessage = cleanHtmlToMarkdown(firstMessage.message);
              console.log('SUCCESS! Found AI message:', aiMessage.substring(0, 100) + '...');
              break;
            }
          }
          
          // Backup: Kijk naar alle mogelijke locaties waar het bericht kan staan (alleen voor chat outputs)
          if (outputItem.outputs && outputItem.outputs.length > 0 && 
              (!outputItem.component_display_name || 
               !outputItem.component_display_name.toLowerCase().includes('pdf'))) {
            for (const subOutput of outputItem.outputs) {
              console.log('Checking sub-output for chat message:', JSON.stringify(subOutput, null, 2));
              
              // Probeer verschillende velden (alleen voor tekst, niet voor tool outputs)
              if (subOutput.message && typeof subOutput.message === 'string') {
                aiMessage = cleanHtmlToMarkdown(subOutput.message);
                console.log('Found message in subOutput.message:', aiMessage);
                break;
              } else if (subOutput.text && typeof subOutput.text === 'string') {
                aiMessage = cleanHtmlToMarkdown(subOutput.text);
                console.log('Found message in subOutput.text:', aiMessage);
                break;
              } else if (typeof subOutput === 'string' && !subOutput.includes('http')) {
                // Don't treat URLs as chat messages
                aiMessage = cleanHtmlToMarkdown(subOutput);
                console.log('Found message as string:', aiMessage);
                break;
              } else if (subOutput.data && typeof subOutput.data === 'string' && !subOutput.data.includes('http')) {
                aiMessage = cleanHtmlToMarkdown(subOutput.data);
                console.log('Found message in subOutput.data:', aiMessage);
                break;
              }
            }
          }
          
          // Stop als we een bericht hebben gevonden
          if (aiMessage !== 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.') {
            break;
          }
        }
      }
    }

    console.log('Final aiMessage:', aiMessage);

    const responseData = {
      message: aiMessage,
      offertePreview: offertePreview,
      pdfUrl: pdfUrl,
      success: true
    };
    
    console.log('🚀 BACKEND RESPONSE:', JSON.stringify(responseData, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error('❌ ERROR calling Langflow API:', error);
    console.error('❌ ERROR name:', error.name);
    console.error('❌ ERROR message:', error.message);
    console.error('❌ ERROR stack:', error.stack);
    
    // Handle timeout errors specifically
    let errorMessage = 'Er is een fout opgetreden bij het verwerken van je bericht.';
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('⏰ REQUEST TIMEOUT: Langflow request timed out after 25 seconds');
      errorMessage = 'De aanvraag duurde te lang (>25 sec). Probeer het opnieuw met een korter bericht.';
    }
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
        success: false,
        debugInfo: {
          errorName: error.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
          wasTimeout: error.name === 'TimeoutError' || error.name === 'AbortError'
        }
      }),
    };
  }
};