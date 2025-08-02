import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, UploadedFile } from '../types';
import ChatMessageComponent from './ChatMessage';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string, files?: UploadedFile[]) => void;
  streamingMessage?: string | null;
  isStreaming?: boolean;
  onCancel?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  streamingMessage,
  isStreaming,
  onCancel,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area - Mobile Responsive with WhatsApp-style bottom alignment */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-gray-100 flex flex-col">
        {/* Spacer to push messages to bottom when few messages */}
        <div className="flex-1 min-h-0">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-4 md:mt-8 px-4">
              <h3 className="text-base md:text-lg font-medium mb-2">Welkom bij K&S Offerte Chat</h3>
              <p className="text-sm md:text-base">Begin een gesprek om je offerte op te bouwen.</p>
              <p className="italic mt-2 text-sm md:text-base">"Ik wil een offerte maken voor Mauvestraat 43"</p>
            </div>
          )}
        </div>
        
        {/* Messages container - always at bottom */}
        <div className="space-y-3 md:space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
        
        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <StreamingMessage content={streamingMessage} />
        )}
        
        {/* Loading Indicator (only when not streaming) */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 bg-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-ks-green rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-ks-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-ks-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="text-red-500 hover:text-red-700 text-sm underline ml-2"
                    title="Stop verwerking"
                  >
                    Annuleren
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="flex justify-center">
              <div className="max-w-xs lg:max-w-md px-4 py-2 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatInterface;