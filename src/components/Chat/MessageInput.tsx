
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  placeholder = "Type your message...", 
  disabled = false,
  className
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset the textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize the textarea based on content
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "flex items-end border border-gray-200 rounded-xl bg-white p-2 shadow-sm", 
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none max-h-32 py-2 px-3 text-gray-700"
        style={{ minHeight: '40px' }}
        rows={1}
      />
      <Button 
        type="submit" 
        size="sm"
        disabled={!message.trim() || disabled}
        className="bg-ava-neon-green text-gray-800 hover:bg-ava-neon-green-light ml-2"
      >
        <SendHorizonal className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default MessageInput;
