import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { UploadedFile } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatInputProps {
  onSendMessage: (content: string, files?: UploadedFile[]) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px height
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFiles.length > 0) {
      onSendMessage(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
      // Reset textarea height after clearing
      setTimeout(autoResize, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`Bestand ${file.name} is te groot. Maximum grootte is 10MB.`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        const uploadedFile: UploadedFile = {
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
        };

        newFiles.push(uploadedFile);
        
        if (newFiles.length === files.length) {
          setSelectedFiles(prev => [...prev, ...newFiles]);
        }
      };
      
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(files => files.filter(f => f.id !== fileId));
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
                <span>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input Form - Mobile Responsive */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3 p-3 md:p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="text-gray-500 hover:text-ks-green disabled:opacity-50 self-end mb-1 p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
          title="Bestand toevoegen"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type een bericht..."
            disabled={disabled}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-ks-green focus:border-transparent disabled:opacity-50 text-base leading-relaxed touch-manipulation"
            rows={2}
            style={{ 
              minHeight: '60px',
              maxHeight: '160px',
              resize: 'none',
              overflow: 'auto',
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
          className="bg-ks-green text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end mb-1 touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;