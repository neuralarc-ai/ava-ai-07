import React, { useState, useEffect } from 'react';
import Avatar from '../Avatar';
import { TypeAnimation } from 'react-type-animation';

interface ChatMessageProps {
  sender: 'ava' | 'sam' | 'user' | 'lab_expert';
  message: string;
  animateTyping?: boolean;
  typingSpeed?: number;
  isNew?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  sender, 
  message, 
  animateTyping = false,
  typingSpeed = 30,
  isNew = false
}) => {
  const [showTyping, setShowTyping] = useState(animateTyping && isNew);
  
  // Message styling based on sender
  const messageBgClass = 
    sender === 'user' ? 'bg-gray-100' : 
    sender === 'ava' ? 'bg-ava-muted' : 'bg-blue-50';

  const alignmentClass = sender === 'user' ? 'justify-end' : 'justify-start';
  
  // Display name and role based on sender
  const senderName = 
    sender === 'user' ? 'You' : 
    sender === 'ava' ? 'Ava AI' : 
    sender === 'lab_expert' ? 'Lab Expert' : 'Sam';
    
  const senderRole =
    sender === 'user' ? '' :
    sender === 'ava' ? '(Blood Analysis Expert)' :
    sender === 'lab_expert' ? '(Lab Expert)' : '(Lab Assistant)';
  
  useEffect(() => {
    if (animateTyping && isNew) {
      // Hide typing indicator after animation completes
      const timeout = setTimeout(() => {
        setShowTyping(false);
      }, message.length * typingSpeed + 500);
      
      return () => clearTimeout(timeout);
    }
  }, [animateTyping, isNew, message, typingSpeed]);

  return (
    <div className={`flex ${alignmentClass} mb-4 animate-slide-up`}>
      <div className={`flex ${sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
        <Avatar type={sender} size="md" />
        
        <div className={`mx-2 ${sender === 'user' ? 'mr-3' : 'ml-3'}`}>
          <div className="text-xs text-gray-500 mb-1">
            {senderName} {senderRole && <span className="text-gray-400 text-xs">{senderRole}</span>}
          </div>
          
          <div className={`${messageBgClass} px-4 py-2 rounded-xl shadow-sm`}>
            {showTyping ? (
              <div className="min-h-6 flex items-center">
                <div className="typing-indicator">
                  <span className="animate-blink"></span>
                  <span className="animate-blink"></span>
                  <span className="animate-blink"></span>
                </div>
              </div>
            ) : animateTyping && isNew ? (
              <TypeAnimation
                sequence={[message]}
                speed={1}
                cursor={false}
              />
            ) : (
              <div>{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
