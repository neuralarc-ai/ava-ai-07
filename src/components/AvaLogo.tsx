
import React from 'react';

const AvaLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-ava-neon-green flex items-center justify-center text-ava-dark font-bold">
        A
      </div>
      <div className="font-bold text-xl text-ava-light">
        Ava <span className="text-ava-neon-green">AI</span>
      </div>
    </div>
  );
};

export default AvaLogo;
