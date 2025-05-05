
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export interface Message {
  id: string;
  sender: 'ava' | 'sam' | 'user';
  message: string;
  timestamp: Date;
  isNew?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
  whoIsTyping?: 'ava' | 'sam';
  animateTyping?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages,
  isTyping = false,
  whoIsTyping = 'ava',
  animateTyping = true
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto mb-2">
      <div className="flex-grow">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={msg.id}
            sender={msg.sender}
            message={msg.message}
            animateTyping={animateTyping}
            isNew={msg.isNew || false}
          />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex flex-row items-start max-w-[80%]">
              <TypingIndicator sender={whoIsTyping} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
