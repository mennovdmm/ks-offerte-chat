// Background function for long-running Langflow requests (up to 15 minutes)

function cleanHtmlToMarkdown(content) {
  if (!content || typeof content !== 'string') return content;
  
  console.log('🧹 CLEANING HTML - Input length:', content.length);
  
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
  return cleaned;
}

// Netlify Background Function for long-running Langflow requests
export default async (req, context) => {
  console.log('🏃‍♂️ BACKGROUND-TASK: Function started');
  console.log('📋 BACKGROUND-TASK: Context available:', !!context);
  console.log('📋 BACKGROUND-TASK: Blobs available:', !!(context && context.blobs));
  let requestBody = null;
  
  try {
    // Handle empty or invalid request body
    const bodyText = await req.text();
    console.log('📥 BACKGROUND: Raw request body:', bodyText.substring(0, 200));
    
    if (!bodyText || bodyText.trim() === '') {
      throw new Error('Empty request body');
    }
    
    requestBody = JSON.parse(bodyText);
    const { sessionId, message, uploadedFiles, currentUser, taskId } = requestBody;
    
    console.log('🏃‍♂️ BACKGROUND FUNCTION: Starting long-running Langflow request');
    console.log('Task ID:', taskId);
    console.log('Session ID:', sessionId);
    console.log('Message:', message);

    // Prepare the payload for Langflow API - enhanced format with user context
    const langflowPayload = {
      input_value: message,
      output_type: 'chat',
      input_type: 'chat',
      session_id: sessionId,
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

    console.log('🚀 BACKGROUND: Calling Langflow API (can take up to 15 minutes)...');
    
    // Retry mechanism for Langflow API calls (especially for PDF generation)
    let response = null;
    let lastError = null;
    const maxRetries = 2; // Try up to 3 times total
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`🔄 BACKGROUND: API attempt ${attempt}/${maxRetries + 1}`);
        
        response = await fetch(process.env.LANGFLOW_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.LANGFLOW_API_KEY
          },
          body: JSON.stringify(langflowPayload)
        });
        
        // If successful, break out of retry loop
        if (response.ok) {
          console.log(`✅ BACKGROUND: API successful on attempt ${attempt}`);
          break;
        }
        
        // If 504 and we have retries left, wait and try again
        if (response.status === 504 && attempt <= maxRetries) {
          console.log(`⏰ BACKGROUND: 504 timeout on attempt ${attempt}, retrying in 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          continue;
        }
        
        // For other errors or final retry, handle normally
        lastError = new Error(`Attempt ${attempt}: HTTP ${response.status}`);
        if (attempt === maxRetries + 1) {
          throw lastError;
        }
        
      } catch (fetchError) {
        lastError = fetchError;
        if (attempt === maxRetries + 1) {
          throw fetchError;
        }
        console.log(`❌ BACKGROUND: Network error on attempt ${attempt}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
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
    console.log('✅ BACKGROUND: Langflow API responded successfully');

    // Extract the AI message
    let aiMessage = 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.';
    let pdfUrl = null;

    // Parse Langflow response - same logic as main function
    if (data.outputs && data.outputs.length > 0) {
      const output = data.outputs[0];
      
      if (output.outputs && output.outputs.length > 0) {
        // Extract PDF URLs from tool outputs
        for (const outputItem of output.outputs) {
          if (outputItem.component_display_name && 
              outputItem.component_display_name.toLowerCase().includes('pdf')) {
            if (outputItem.outputs && outputItem.outputs.length > 0) {
              for (const pdfOutput of outputItem.outputs) {
                if (typeof pdfOutput === 'string' && pdfOutput.includes('http')) {
                  pdfUrl = pdfOutput;
                  console.log('📄 BACKGROUND: Found PDF URL:', pdfUrl);
                  break;
                }
              }
            }
          }
        }
        
        // Extract chat messages
        for (const outputItem of output.outputs) {
          // Skip tool outputs for message extraction
          if (outputItem.component_display_name && 
              (outputItem.component_display_name.toLowerCase().includes('pdf') ||
               outputItem.component_display_name.toLowerCase().includes('file') ||
               outputItem.component_display_name.toLowerCase().includes('tool'))) {
            continue;
          }
          
          // Process chat/text messages
          if (outputItem.messages && outputItem.messages.length > 0) {
            const firstMessage = outputItem.messages[0];
            if (firstMessage.message && typeof firstMessage.message === 'string') {
              aiMessage = cleanHtmlToMarkdown(firstMessage.message);
              break;
            }
          }
          
          // Backup: Check all possible locations for the message
          if (outputItem.outputs && outputItem.outputs.length > 0 && 
              (!outputItem.component_display_name || 
               !outputItem.component_display_name.toLowerCase().includes('pdf'))) {
            for (const subOutput of outputItem.outputs) {
              if (subOutput.message && typeof subOutput.message === 'string') {
                aiMessage = cleanHtmlToMarkdown(subOutput.message);
                break;
              } else if (subOutput.text && typeof subOutput.text === 'string') {
                aiMessage = cleanHtmlToMarkdown(subOutput.text);
                break;
              } else if (typeof subOutput === 'string' && !subOutput.includes('http')) {
                aiMessage = cleanHtmlToMarkdown(subOutput);
                break;
              } else if (subOutput.data && typeof subOutput.data === 'string' && !subOutput.data.includes('http')) {
                aiMessage = cleanHtmlToMarkdown(subOutput.data);
                break;
              }
            }
          }
          
          if (aiMessage !== 'Ik heb je bericht ontvangen. Laten we verder gaan met je offerte.') {
            break;
          }
        }
      }
    }

    const result = {
      message: aiMessage,
      pdfUrl: pdfUrl,
      success: true,
      taskId: taskId,
      completedAt: new Date().toISOString()
    };

    console.log('💾 BACKGROUND: Storing result');
    console.log('Context.blobs available:', !!context.blobs);
    console.log('Context.blobs.set available:', !!(context.blobs && context.blobs.set));
    
    // Store result in Netlify Blobs (production only)
    try {
      if (context.blobs && context.blobs.set) {
        console.log('📦 BACKGROUND: Using Netlify Blobs to store result');
        await context.blobs.set(`result-${taskId}`, JSON.stringify(result));
        console.log('✅ BACKGROUND: Result stored in Netlify Blobs');
      } else {
        console.error('❌ BACKGROUND: Netlify Blobs not available - this should not happen in production');
        // In production, we must have blobs available
        throw new Error('Netlify Blobs not available in production environment');
      }
    } catch (storageError) {
      console.error('❌ BACKGROUND: Failed to store result:', storageError);
      // Even if storage fails, return success to prevent hanging
    }
    
    console.log('✅ BACKGROUND: Task completed successfully');
    return new Response('Background task completed', { status: 200 });

  } catch (error) {
    console.error('❌ BACKGROUND ERROR:', error);
    
    let errorTaskId = 'unknown';
    
    // Use the requestBody we already parsed
    if (requestBody && requestBody.taskId) {
      errorTaskId = requestBody.taskId;
    } else {
      console.error('No taskId available for error handling');
    }
    
    const errorResult = {
      success: false,
      error: `Background task failed: ${error.message}`,
      taskId: errorTaskId,
      completedAt: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };
    
    // Store error result
    try {
      if (context.blobs && context.blobs.set) {
        await context.blobs.set(`result-${errorTaskId}`, JSON.stringify(errorResult));
        console.log('💾 BACKGROUND: Error result stored in blobs');
      } else {
        console.error('❌ BACKGROUND: Cannot store error result - Netlify Blobs not available');
      }
    } catch (blobError) {
      console.error('❌ BACKGROUND: Failed to store error result in blobs:', blobError);
    }
    
    return new Response('Background task failed', { status: 500 });
  }
};