import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-whatsapp-bg">
        <div className="flex flex-col justify-end min-h-full">
          <div className="px-4 py-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="message-bubble message-ai mx-auto">
                  <p className="text-sm">
                    👋 Hallo! Ik help je graag met je offerte.
                  </p>
                  <p className="text-sm mt-2">
                    Begin met bijvoorbeeld: <em>"Ik wil een offerte voor Mauvestraat 43"</em>
                  </p>
                </div>
              </div>
            )}
            
            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="message-bubble message-ai">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Aan het typen...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatInterface;