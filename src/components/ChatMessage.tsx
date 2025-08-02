import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`message-bubble ${isUser ? 'message-user' : 'message-ai'}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div className={`text-xs mt-1 ${isUser ? 'text-green-700' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;