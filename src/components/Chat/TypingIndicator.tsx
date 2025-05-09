import React from 'react';
import Avatar from '../Avatar';

interface TypingIndicatorProps {
  sender: 'ava' | 'sam' | 'lab_expert';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ sender }) => {
  // Display name based on sender
  const senderName = sender === 'ava' ? 'Ava AI' : sender === 'lab_expert' ? 'Lab Expert' : 'Sam';
  const senderRole = sender === 'ava' ? '(Blood Analysis Expert)' : sender === 'lab_expert' ? '(Lab Expert)' : '(Lab Assistant)';
  
  // Message styling based on sender
  const messageBgClass = sender === 'ava' ? 'bg-ava-muted' : 'bg-blue-50';

  return (
    <div className="flex flex-row items-start max-w-[80%]">
      <Avatar type={sender} size="md" />
      
      <div className="ml-3">
        <div className="text-xs text-gray-500 mb-1">
          {senderName} <span className="text-gray-400 text-xs">{senderRole}</span>
        </div>
        
        <div className={`${messageBgClass} px-4 py-3 rounded-xl shadow-sm`}>
          <div className="typing-indicator">
            <span className="animate-blink"></span>
            <span className="animate-blink"></span>
            <span className="animate-blink"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
