import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ApiResponse } from './types';
import TopBar from './components/TopBar';
import ChatInterface from './components/ChatInterface';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // API call (uses proxy in production, localhost in development)
      const apiUrl = process.env.NODE_ENV === 'production' ? '/api/chat' : 'http://localhost:3001/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: 'temp-session',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: data.message || 'Sorry, ik kon geen antwoord genereren.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-whatsapp-bg">
      <TopBar />
      <ChatInterface 
        messages={messages} 
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
