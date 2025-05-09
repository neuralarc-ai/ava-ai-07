import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export interface Message {
  id: string;
  sender: 'ava' | 'sam' | 'user' | 'lab_expert';
  message: string;
  timestamp: Date;
  isNew?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
  whoIsTyping?: 'ava' | 'sam' | 'lab_expert';
  animateTyping?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages,
  isTyping = false,
  whoIsTyping = 'ava',
  animateTyping = true
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update visible messages with animation
  useEffect(() => {
    const newMessages = messages.filter(msg => !visibleMessages.find(vm => vm.id === msg.id));
    
    if (newMessages.length > 0) {
      // Add new messages one by one with a slight delay
      let delay = 0;
      newMessages.forEach((msg) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg]);
        }, delay);
        delay += 100; // 100ms delay between each message
      });
    }
  }, [messages]);

  // Scroll to bottom when messages change or typing status changes
  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, isTyping]);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto mb-2">
      <div className="flex-grow space-y-4">
        {visibleMessages.map((msg) => (
          <ChatMessage 
            key={msg.id}
            sender={msg.sender}
            message={msg.message}
            animateTyping={animateTyping && msg.isNew}
            isNew={msg.isNew}
          />
        ))}

        {isTyping && (
          <div className="flex justify-start">
              <TypingIndicator sender={whoIsTyping} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
