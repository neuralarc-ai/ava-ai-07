
import React from 'react';

export type AnalysisStage = 'reading' | 'analyzing' | 'discussing' | 'finalizing' | 'complete';

interface ProgressBarProps {
  stage: AnalysisStage;
}

const stages: { stage: AnalysisStage; label: string }[] = [
  { stage: 'reading', label: 'Reading' },
  { stage: 'analyzing', label: 'Analyzing' },
  { stage: 'discussing', label: 'Discussing' },
  { stage: 'finalizing', label: 'Finalizing' },
  { stage: 'complete', label: 'Results Ready' }
];

const ProgressBar: React.FC<ProgressBarProps> = ({ stage }) => {
  // Get the current stage index
  const currentStageIndex = stages.findIndex(s => s.stage === stage);
  
  return (
    <div className="w-full py-4">
      <div className="flex justify-between mb-2">
        {stages.map((s, index) => (
          <div 
            key={s.stage}
            className={`text-xs ${index <= currentStageIndex ? 'text-ava-neon-green-dark' : 'text-gray-400'}`}
          >
            {s.label}
          </div>
        ))}
      </div>
      
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-ava-neon-green h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStageIndex + 1) / stages.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
