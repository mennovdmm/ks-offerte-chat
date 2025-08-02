import React from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingMessageProps {
  content: string;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-4xl px-4 py-3 rounded-lg relative group bg-white text-gray-800 shadow-sm border border-gray-100">
        {/* Streaming Content */}
        <div className="break-words">
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
              {content}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Typing indicator */}
        <div className="flex items-center mt-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-ks-green rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-ks-green rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-ks-green rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-xs text-gray-500 ml-2">Aan het typen...</span>
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;