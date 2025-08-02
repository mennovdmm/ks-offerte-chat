import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, UploadedFile, AppState, User, SavedSession } from './types';
import ChatInterface from './components/ChatInterface';
import TopBar from './components/TopBar';
import LoginForm from './components/LoginForm';
import SessionSidebar from './components/SessionSidebar';

// Session management functions with user-specific storage
const CURRENT_USER_STORAGE_KEY = 'ks-offerte-current-user';

const getCurrentUser = (): User | null => {
  try {
    const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading current user:', error);
  }
  return null;
};

const saveCurrentUser = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving current user:', error);
  }
};

const getUserSessionsKey = (userEmail: string): string => {
  return `ks-offerte-sessions-${userEmail}`;
};

const loadSavedSessions = (userEmail?: string): SavedSession[] => {
  if (!userEmail) return [];
  
  try {
    const userSessionsKey = getUserSessionsKey(userEmail);
    const saved = localStorage.getItem(userSessionsKey);
    if (saved) {
      const sessions = JSON.parse(saved);
      // Convert date strings back to Date objects for sessions AND messages
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading saved sessions:', error);
  }
  return [];
};

const saveSessions = (sessions: SavedSession[], userEmail?: string) => {
  if (!userEmail) return;
  
  try {
    const userSessionsKey = getUserSessionsKey(userEmail);
    localStorage.setItem(userSessionsKey, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

const generateSessionName = (sessions: SavedSession[]): string => {
  const numbers = sessions
    .map(s => s.name.match(/^Offerte (\d+)$/)?.[1])
    .filter(n => n !== undefined)
    .map(n => parseInt(n as string))
    .sort((a, b) => b - a);
  
  const nextNumber = numbers.length > 0 ? numbers[0] + 1 : 1;
  return `Offerte ${nextNumber}`;
};

function App() {
  // Add error logging
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 GLOBAL ERROR:', event.error);
      console.error('🚨 ERROR MESSAGE:', event.message);
      console.error('🚨 ERROR FILENAME:', event.filename);
      console.error('🚨 ERROR LINENO:', event.lineno);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const [state, setState] = useState<AppState>(() => {
    const currentUser = getCurrentUser();
    const savedSessions = loadSavedSessions(currentUser?.email);
    return {
      messages: [],
      sessionId: uuidv4(),
      uploadedFiles: [],
      offertePreview: '',
      isLoading: false,
      error: null,
      currentUser,
      streamingMessage: null,
      isStreaming: false,
      cancelPolling: undefined,
      savedSessions,
      currentSessionName: generateSessionName(savedSessions),
    };
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-save session when messages change
  useEffect(() => {
    if (state.messages.length > 0 && state.currentUser) {
      const saveTimer = setTimeout(() => {
        // Only save if there are messages (don't save empty sessions)
        if (state.messages.length === 0) return;
        
        const sessionToSave: SavedSession = {
          id: state.sessionId,
          name: state.currentSessionName,
          messages: state.messages,
          uploadedFiles: state.uploadedFiles,
          offertePreview: state.offertePreview,
          pdfUrl: pdfUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const savedSessions = loadSavedSessions(state.currentUser?.email);
        const existingIndex = savedSessions.findIndex(s => s.id === state.sessionId);
        
        if (existingIndex >= 0) {
          // Update existing session
          savedSessions[existingIndex] = { ...sessionToSave, createdAt: savedSessions[existingIndex].createdAt };
        } else {
          // Add new session
          savedSessions.push(sessionToSave);
        }
        
        // Sort by most recent first
        savedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        saveSessions(savedSessions, state.currentUser?.email);
        
        setState(prev => ({
          ...prev,
          savedSessions
        }));
      }, 2000); // Save 2 seconds after last change
      
      return () => clearTimeout(saveTimer);
    }
  }, [state.messages, state.offertePreview, state.sessionId, state.currentSessionName, state.uploadedFiles, pdfUrl, state.currentUser]);

  const handleLogin = (user: User) => {
    // Save user to localStorage
    saveCurrentUser(user);
    
    // Load user-specific sessions
    const userSessions = loadSavedSessions(user.email);
    
    setState(prev => ({
      ...prev,
      currentUser: user,
      savedSessions: userSessions,
      currentSessionName: generateSessionName(userSessions),
    }));
  };

  const handleLogout = () => {
    // Clear user from localStorage
    saveCurrentUser(null);
    
    setState({
      messages: [],
      sessionId: uuidv4(),
      uploadedFiles: [],
      offertePreview: '',
      isLoading: false,
      error: null,
      currentUser: null,
      streamingMessage: null,
      isStreaming: false,
      cancelPolling: undefined,
      savedSessions: [],
      currentSessionName: generateSessionName([]),
    });
    setPdfUrl(null);
  };

  const startNewOfferte = () => {
    // Save current session before starting new one
    saveCurrentSession();
    
    // Generate completely new session ID - Langflow will treat this as a fresh session
    const newSessionId = uuidv4();
    
    console.log('OLD session ID:', state.sessionId);
    console.log('NEW session ID:', newSessionId);
    
    // Reset frontend state
    setState(prev => {
      const updatedSavedSessions = loadSavedSessions(prev.currentUser?.email);
      return {
        ...prev,
        messages: [],
        sessionId: newSessionId,
        uploadedFiles: [],
        offertePreview: '',
        isLoading: false,
        error: null,
        streamingMessage: null,
        isStreaming: false,
        cancelPolling: undefined,
        savedSessions: updatedSavedSessions,
        currentSessionName: generateSessionName(updatedSavedSessions),
      };
    });
    setPdfUrl(null);
    
    console.log('Started new offerte with session:', newSessionId);
  };

  const saveCurrentSession = () => {
    // Only save if there are messages (don't save empty sessions)
    if (state.messages.length === 0) return;
    
    const sessionToSave: SavedSession = {
      id: state.sessionId,
      name: state.currentSessionName,
      messages: state.messages,
      uploadedFiles: state.uploadedFiles,
      offertePreview: state.offertePreview,
      pdfUrl: pdfUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const savedSessions = loadSavedSessions(state.currentUser?.email);
    const existingIndex = savedSessions.findIndex(s => s.id === state.sessionId);
    
    if (existingIndex >= 0) {
      // Update existing session
      savedSessions[existingIndex] = { ...sessionToSave, createdAt: savedSessions[existingIndex].createdAt };
    } else {
      // Add new session
      savedSessions.push(sessionToSave);
    }
    
    // Sort by most recent first
    savedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    saveSessions(savedSessions, state.currentUser?.email);
    
    setState(prev => ({
      ...prev,
      savedSessions
    }));
  };

  const loadSession = (sessionId: string) => {
    // Save current session first
    saveCurrentSession();
    
    const savedSessions = loadSavedSessions(state.currentUser?.email);
    const sessionToLoad = savedSessions.find(s => s.id === sessionId);
    
    if (sessionToLoad) {
      setState(prev => ({
        ...prev,
        messages: sessionToLoad.messages,
        sessionId: sessionToLoad.id,
        uploadedFiles: sessionToLoad.uploadedFiles,
        offertePreview: sessionToLoad.offertePreview,
        currentSessionName: sessionToLoad.name,
        isLoading: false,
        error: null,
        streamingMessage: null,
        isStreaming: false,
        cancelPolling: undefined,
      }));
      setPdfUrl(sessionToLoad.pdfUrl);
    }
  };

  const updateSessionName = (sessionId: string, newName: string) => {
    const savedSessions = loadSavedSessions(state.currentUser?.email);
    const sessionIndex = savedSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      savedSessions[sessionIndex].name = newName;
      savedSessions[sessionIndex].updatedAt = new Date();
      saveSessions(savedSessions, state.currentUser?.email);
      
      setState(prev => ({
        ...prev,
        savedSessions,
        currentSessionName: sessionId === state.sessionId ? newName : prev.currentSessionName
      }));
    }
  };

  const deleteSession = (sessionId: string) => {
    const savedSessions = loadSavedSessions(state.currentUser?.email).filter(s => s.id !== sessionId);
    saveSessions(savedSessions, state.currentUser?.email);
    
    setState(prev => ({
      ...prev,
      savedSessions
    }));
  };

  const pollForResult = async (taskId: string, loadingMessageId: string) => {
    console.log('🔄 FRONTEND: Starting polling for task:', taskId);
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5s intervals)
    let isPolling = true;
    
    // Update message every 10 seconds to show progress
    const progressMessages = [
      "Working on it. Hold on...",
      "Still working on your request...",
      "Processing your question thoroughly...",
      "Almost there, please wait...",
      "Finalizing your response..."
    ];
    
    const poll = async () => {
      if (!isPolling) return; // Stop polling if cancelled
      
      attempts++;
      console.log(`🔄 POLLING attempt ${attempts}/${maxAttempts} for task:`, taskId);
      
      try {
        const response = await fetch(`/.netlify/functions/check-task?taskId=${taskId}`);
        const result = await response.json();
        
        if (result.status === 'completed') {
          console.log('✅ POLLING: Task completed!', result.result);
          
          if (result.result.success) {
            // Replace loading message with actual result
            const finalMessage: ChatMessage = {
              id: loadingMessageId,
              content: result.result.message,
              sender: 'ai',
              timestamp: new Date(),
            };

            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === loadingMessageId ? finalMessage : msg
              ),
              isLoading: false,
              cancelPolling: undefined,
            }));

            // Handle PDF URL if provided
            if (result.result.pdfUrl) {
              setPdfUrl(result.result.pdfUrl);
            }
          } else {
            // Handle error result
            const errorMessage = result.result.error || 'Er is een fout opgetreden tijdens de verwerking.';
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === loadingMessageId 
                  ? { ...msg, content: `❌ ${errorMessage}` }
                  : msg
              ),
              isLoading: false,
              error: null,
              cancelPolling: undefined,
            }));
          }
          return;
        }
        
        if (result.status === 'processing') {
          console.log('⏳ POLLING: Task still processing...');
          
          // Update progress message every 2 attempts (10 seconds)
          if (attempts % 2 === 0 && attempts > 0) {
            const messageIndex = Math.min(Math.floor(attempts / 2) - 1, progressMessages.length - 1);
            if (messageIndex >= 0 && messageIndex < progressMessages.length) {
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                  msg.id === loadingMessageId 
                    ? { ...msg, content: progressMessages[messageIndex] }
                    : msg
                ),
              }));
            }
          }
          
          if (attempts < maxAttempts && isPolling) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            console.error('❌ POLLING: Max attempts reached, trying emergency fallback');
            
            // Emergency fallback: try to get a response directly from langflow-chat
            try {
              console.log('🚨 EMERGENCY: Attempting direct fallback call');
              const emergencyResponse = await fetch('/api/langflow-stream', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: 'Je antwoord kwam niet door, kan je het nog even geven?',
                  sessionId: state.sessionId,
                  uploadedFiles: [],
                  currentUser: state.currentUser
                }),
              });
              
              if (emergencyResponse.ok) {
                const emergencyData = await emergencyResponse.json();
                console.log('✅ EMERGENCY: Got fallback response');
                
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(msg => 
                    msg.id === loadingMessageId 
                      ? { ...msg, content: emergencyData.message || 'Sorry, er is een probleem opgetreden. Probeer je vraag opnieuw te stellen.' }
                      : msg
                  ),
                  isLoading: false,
                  error: null,
                  cancelPolling: undefined,
                }));
                return;
              }
            } catch (emergencyError) {
              console.error('❌ EMERGENCY: Fallback also failed:', emergencyError);
            }
            
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === loadingMessageId 
                  ? { ...msg, content: 'De verwerking duurt langer dan verwacht. Probeer je vraag opnieuw te stellen of vraag: "Je antwoord kwam niet door, kan je het nog even geven?"' }
                  : msg
              ),
              isLoading: false,
              error: 'Timeout: De verwerking duurde te lang.',
              cancelPolling: undefined,
            }));
          }
        }
      } catch (error) {
        console.error('❌ POLLING ERROR:', error);
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === loadingMessageId 
              ? { ...msg, content: 'Er is een fout opgetreden bij het ophalen van het resultaat.' }
              : msg
          ),
          isLoading: false,
          error: 'Fout bij het controleren van de taakstatus.',
          cancelPolling: undefined,
        }));
      }
    };
    
    // Add cancel function to the loading message
    const cancelPolling = () => {
      isPolling = false;
      console.log('🚫 POLLING: Cancelled by user');
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === loadingMessageId 
            ? { ...msg, content: 'Verwerking geannuleerd.' }
            : msg
        ),
        isLoading: false,
        error: null,
      }));
    };
    
    // Store cancel function in state so we can access it from components
    setState(prev => ({
      ...prev,
      cancelPolling: cancelPolling
    }));
    
    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  const simulateStreaming = (fullMessage: string) => {
    console.log('🎯 STREAMING: Function called with message length:', fullMessage.length);
    return new Promise<void>((resolve) => {
      setState(prev => ({
        ...prev,
        isStreaming: true,
        streamingMessage: '',
        isLoading: false,
      }));

      let currentIndex = 0;
      // PERFORMANCE FIX: Use requestAnimationFrame instead of setInterval for better performance
      // Source: React Performance docs 2024
      const streamChunk = () => {
        if (currentIndex < fullMessage.length) {
          // PERFORMANCE FIX: Larger chunk sizes for better performance with long text
          const chunkSize = Math.min(50, fullMessage.length - currentIndex); // 50 chars at once
          const nextChunk = fullMessage.slice(0, currentIndex + chunkSize);
          
          setState(prev => ({
            ...prev,
            streamingMessage: nextChunk,
          }));
          currentIndex = nextChunk.length;
          
          // PERFORMANCE FIX: Use requestAnimationFrame for smooth animation
          requestAnimationFrame(() => {
            setTimeout(streamChunk, 50); // Slower but more stable
          });
        } else {
          // Complete the streaming and add to messages
          const aiMessage: ChatMessage = {
            id: uuidv4(),
            content: fullMessage,
            sender: 'ai',
            timestamp: new Date(),
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
            streamingMessage: null,
            isStreaming: false,
          }));
          
          resolve();
        }
      };
      
      streamChunk();
    });
  };

  const sendMessage = async (content: string, files?: UploadedFile[]) => {
    console.log('🚀 FRONTEND: sendMessage called with content:', JSON.stringify(content), 'files:', files);
    
    // Don't send empty messages
    if (!content.trim() && (!files || files.length === 0)) {
      console.log('❌ FRONTEND: Empty message blocked');
      return;
    }

    // For first message in a session, add user context
    let enhancedContent = content;
    if (state.messages.length === 0 && state.currentUser) {
      enhancedContent = `Hallo, ik ben ${state.currentUser.name} (${state.currentUser.email}). ${content}`;
      console.log('👋 FRONTEND: Enhanced first message with user context');
    }
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Use regular function with streaming response - show immediate "thinking" message
      console.log('🚀 FRONTEND: Sending message length:', enhancedContent.length);
      
      // ALWAYS show immediate streaming feedback for any message
      console.log('🌊 FRONTEND: Starting immediate streaming feedback for all messages');
      
      setState(prev => ({
        ...prev,
        isStreaming: true,
        streamingMessage: "Even denken...",
        isLoading: false,
      }));
      
      // Show different thinking messages based on length
      if (enhancedContent.length > 500) {
        console.log('📊 FRONTEND: Long message detected');
        // Simulate typing the thinking message for long content
        await simulateStreaming("Ik analyseer je data en haal actuele marktinformatie op. Dit kan even duren vanwege de omvang van je data...");
      } else {
        // For short messages, show brief thinking animation
        await simulateStreaming("Ik denk hierover na...");
      }

      const endpoint = '/api/langflow-stream';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: enhancedContent,
          sessionId: state.sessionId,
          uploadedFiles: files || [],
          currentUser: state.currentUser
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle response - could be streaming or background task
      const data = await response.json();
      
      console.log('📥 FRONTEND: Received response data:', {
        success: data.success,
        messageLength: data.message?.length || 0,
        hasError: !!data.error,
        isBackgroundTask: data.isBackgroundTask,
        messageParts: data.message ? [data.message.substring(0, 100), '...', data.message.substring(data.message.length - 100)] : null
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      
      // Check if this is a background task
      if (data.isBackgroundTask) {
        console.log('📥 FRONTEND: Received background task:', data.taskId);
        
        // Show loading message and start polling
        const loadingMessage: ChatMessage = {
          id: uuidv4(),
          content: "Working on it. Hold on...",
          sender: 'ai',
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, loadingMessage],
          isLoading: true, // Keep loading indicator for background tasks
          cancelPolling: () => {
            console.log('🛑 FRONTEND: Cancelling polling for task:', data.taskId);
          },
        }));

        // Start polling for results
        await pollForResult(data.taskId, loadingMessage.id);
        return;
      }
      
      console.log('🌊 FRONTEND: Got streaming response, starting animation');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      // Handle PDF URL if provided
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }
      
      // For long messages, we already showed a thinking message, so add a separator
      if (enhancedContent.length > 500) {
        console.log('📊 FRONTEND: Adding separator for long message response');
        await simulateStreaming("\n\n---\n\n" + data.message);
      } else {
        // Start streaming animation for the response
        await simulateStreaming(data.message);
      }
      
      return; // Streaming completed successfully
      
    } catch (error) {
      console.error('❌ FRONTEND: Streaming error:', error);
      
      // Show error message with streaming animation to provide feedback
      let errorMessage = 'Er is een fout opgetreden. Probeer het opnieuw.';
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = 'De server heeft een timeout. Langflow heeft te lang geduurd. Probeer het opnieuw of vraag: "Herhaal je laatste antwoord"';
        } else if (error.message.includes('504')) {
          errorMessage = 'Timeout - de AI neemt te lang om te reageren. Probeer een kortere vraag of: "Herhaal je laatste antwoord"';
        }
      }
      
      // Show error with streaming animation
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        streamingMessage: null,
        error: null, // Clear error so we can show the message
      }));
      
      // Animate the error message
      await simulateStreaming(`❌ ${errorMessage}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendMessageOld = async (content: string, files?: File[]) => {
    // Old non-streaming implementation kept as fallback
    if (!content.trim()) {
      console.log('❌ FRONTEND: Empty message blocked');
      return;
    }

    // For first message in a session, add user context
    let enhancedContent = content;
    if (state.messages.length === 0 && state.currentUser) {
      enhancedContent = `Hallo, ik ben ${state.currentUser.name} (${state.currentUser.email}). ${content}`;
      console.log('👋 FRONTEND: Enhanced first message with user context');
    }
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Create an AbortController for timeout handling (60 seconds for long documents)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const payload = {
        sessionId: state.sessionId,
        message: enhancedContent, // Send enhanced content with user context
        uploadedFiles: files || [],
        currentUser: state.currentUser,
      };
      
      console.log('📤 FRONTEND: Sending payload:', JSON.stringify(payload, null, 2));

      // Call Langflow API
      const response = await fetch('/api/langflow-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      console.log('📥 FRONTEND: Received data:', JSON.stringify(data, null, 2));
      
      // Handle background task
      if (data.isBackgroundTask && data.taskId) {
        console.log('🏃‍♂️ FRONTEND: Background task started, polling for result...');
        
        // Add immediate working message
        const loadingMessage: ChatMessage = {
          id: uuidv4(),
          content: "Working on it. Hold on...",
          sender: 'ai',
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, loadingMessage],
          isLoading: true,
        }));

        // Update to longer message after 3 seconds
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, content: "Je vraag wordt verwerkt op de achtergrond. Dit kan even duren..." }
                : msg
            ),
          }));
        }, 3000);

        // Start polling for result
        pollForResult(data.taskId, loadingMessage.id);
        return;
      }
      
      const aiMessageContent = data.message || 'Ik begrijp je vraag. Laten we verder gaan met je offerte.';
      console.log('✅ FRONTEND: Extracted aiMessageContent length:', aiMessageContent.length);
      
      // Check message length - if too long, skip streaming to prevent crashes
      if (aiMessageContent.length > 4000) {
        console.log('⚠️ Large message detected, skipping streaming to prevent crash');
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          content: aiMessageContent,
          sender: 'ai',
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          isLoading: false,
          streamingMessage: null,
          isStreaming: false,
        }));
      } else {
        // Start streaming animation for smaller messages
        console.log('🎬 FRONTEND: Starting streaming animation for message length:', aiMessageContent.length);
        await simulateStreaming(aiMessageContent);
        console.log('✅ FRONTEND: Streaming animation completed');
      }

      // Check if PDF URL is provided
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }

    } catch (error) {
      console.error('Frontend sendMessage error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Non-Error caught:', typeof error, error);
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        streamingMessage: null,
        error: 'Er is een fout opgetreden. Probeer het opnieuw.',
      }));
    }
  };

  const openPDF = () => {
    if (pdfUrl) {
      // More robust PDF opening that preserves session
      try {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error opening PDF:', error);
        // Fallback to window.open
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Show login form if user is not authenticated
  if (!state.currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-ks-light-green relative">
      {/* Top Bar */}
      <TopBar 
        onNewOfferte={startNewOfferte} 
        currentUser={state.currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Main Content - Mobile Responsive */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Session Sidebar - Hidden on mobile, overlay when open */}
        <div className={`
          fixed md:relative top-0 left-0 h-full z-50 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:block
        `}>
          <SessionSidebar
            sessions={state.savedSessions}
            currentSessionId={state.sessionId}
            currentSessionName={state.currentSessionName}
            onLoadSession={(sessionId) => {
              loadSession(sessionId);
              setIsSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            onUpdateSessionName={updateSessionName}
            onDeleteSession={deleteSession}
          />
        </div>
        
        {/* Chat Interface - Full width on mobile */}
        <div className="flex-1 flex flex-col w-full md:w-auto">
          <ChatInterface
            messages={state.messages}
            isLoading={state.isLoading}
            error={state.error}
            onSendMessage={sendMessage}
            streamingMessage={state.streamingMessage}
            isStreaming={state.isStreaming}
            onCancel={state.cancelPolling}
          />
        </div>
      </div>
      
      {/* Bottom Bar - Mobile Responsive */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="text-xs md:text-sm text-gray-600 order-2 sm:order-1">
          {state.currentSessionName} • {state.messages.length} bericht{state.messages.length !== 1 ? 'en' : ''}
        </div>
        <button
          onClick={openPDF}
          disabled={!pdfUrl}
          className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base touch-manipulation order-1 sm:order-2 ${
            pdfUrl
              ? 'bg-ks-green text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={pdfUrl ? 'Open PDF van deze offerte' : 'Nog geen PDF beschikbaar'}
        >
          {pdfUrl ? '📄 Open PDF' : 'PDF niet beschikbaar'}
        </button>
      </div>
    </div>
  );
}

export default App;
