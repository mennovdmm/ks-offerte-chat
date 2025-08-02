import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="safe-bottom bg-white border-t border-gray-200 p-3">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Typ je bericht..."
            disabled={disabled}
            rows={1}
            className="mobile-input w-full px-4 py-3 resize-none focus:ring-2 focus:ring-whatsapp-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="touch-button bg-whatsapp-green text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-whatsapp-dark active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;