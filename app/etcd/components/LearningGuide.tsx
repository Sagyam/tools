import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Step {
  action: string;
  learn: string;
}

interface Concept {
  title: string;
  description: string;
}

interface LearningGuideProps {
  steps: Step[];
  concepts?: Concept[];
}

export const LearningGuide: React.FC<LearningGuideProps> = ({ steps, concepts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <div className="p-4 space-y-4">
          {concepts && concepts.length > 0 && (
            <div className="space-y-3 pb-4 border-b border-sky-500/20">
              <div className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
                Key Concepts
              </div>
              {concepts.map((concept, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm font-semibold text-slate-200">{concept.title}</div>
                  <div className="text-xs text-secondary">{concept.description}</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
              Interactive Steps
            </div>
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
        </div>
      )}
    </div>
  );
};
