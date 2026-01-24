import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Step {
  action: string;
  learn: string;
}

interface LearningGuideProps {
  steps: Step[];
}

export const LearningGuide: React.FC<LearningGuideProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-primary border border-sky-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between bg-sky-600/10 hover:bg-sky-600/20 transition-colors"
      >
        <span className="text-sm font-semibold text-sky-400">Learning Guide</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-sky-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-sky-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-sm font-medium">{step.action}</div>
                <div className="text-xs text-secondary">{step.learn}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
