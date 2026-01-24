import React from 'react';
import { Info } from 'lucide-react';

interface HelpTooltipProps {
  children: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ children }) => {
  return (
    <div className="group relative inline-block">
      <Info className="w-4 h-4 text-sky-400 cursor-help" />
      <div className="invisible group-hover:visible absolute z-10 w-64 p-3 mt-2 text-sm bg-slate-800 text-white rounded-lg shadow-lg -left-28 border border-slate-700">
        {children}
      </div>
    </div>
  );
};
