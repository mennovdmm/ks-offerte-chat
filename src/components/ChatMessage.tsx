import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types';
import { Copy, File } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-4xl px-4 py-3 rounded-lg relative group ${
        isUser 
          ? 'bg-ks-green text-white' 
          : 'bg-white text-gray-800 shadow-sm border border-gray-100'
      }`}>
        {/* Message Content */}
        <div className="break-words">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-3
              prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2  
              prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1
              prose-p:my-2 prose-p:leading-relaxed
              prose-ul:my-2 prose-li:my-1
              prose-ol:my-2 prose-ol:pl-4
              prose-strong:font-semibold prose-strong:text-gray-900
              prose-em:italic
              prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-table:text-sm prose-table:my-4
              prose-th:bg-gray-50 prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-gray-200
              prose-td:p-2 prose-td:border prose-td:border-gray-200
              prose-blockquote:border-l-4 prose-blockquote:border-ks-green prose-blockquote:pl-4 prose-blockquote:italic
              prose-hr:my-4 prose-hr:border-gray-200"
            >
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* File Attachments */}
        {message.files && message.files.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.files.map((file) => (
              <div key={file.id} className="flex items-center space-x-2 text-sm opacity-90">
                <File className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Timestamp and Copy Button */}
        <div className={`flex items-center justify-between mt-1 text-xs ${
          isUser ? 'text-green-100' : 'text-gray-500'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          <button
            onClick={() => copyToClipboard(message.content)}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
              isUser ? 'hover:bg-green-600' : 'hover:bg-gray-200'
            }`}
            title="Kopieer bericht"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;