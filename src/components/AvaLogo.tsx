
import React from 'react';

const AvaLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-ava-neon-green flex items-center justify-center text-white font-bold">
        A
      </div>
      <div className="font-bold text-xl text-gray-800">
        Ava <span className="text-ava-neon-green">AI</span>
      </div>
    </div>
  );
};

export default AvaLogo;
