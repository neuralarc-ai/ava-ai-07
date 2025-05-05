
import React from 'react';

interface AvatarProps {
  type: 'ava' | 'sam' | 'user';
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ type, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const getAvatarContent = () => {
    switch (type) {
      case 'ava':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-ava-neon-green flex items-center justify-center text-ava-dark font-bold`}>
            A
          </div>
        );
      case 'sam':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-bold`}>
            S
          </div>
        );
      case 'user':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-700 flex items-center justify-center text-white font-bold`}>
            U
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-shrink-0">
      {getAvatarContent()}
    </div>
  );
};

export default Avatar;
