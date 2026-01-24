import React from 'react';
import { RaftMessage } from '../../types';

interface MessageVisualizationProps {
  message: RaftMessage;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
}

export const MessageVisualization: React.FC<MessageVisualizationProps> = ({
  message,
  sourcePos,
  targetPos,
}) => {
  // Position message above the target node
  // Add 100 to x and y to account for node width/height (nodes are centered)
  const messageX = targetPos.x + 100;
  const messageY = targetPos.y - 20; // Position above the node

  const getMessageColor = () => {
    switch (message.type) {
      case 'RequestVote':
        return 'bg-amber-500 border-amber-400';
      case 'VoteResponse':
        return message.voteGranted
          ? 'bg-green-500 border-green-400'
          : 'bg-red-500 border-red-400';
      case 'AppendEntries':
        return 'bg-blue-500 border-blue-400';
      case 'AppendEntriesResponse':
        return message.success
          ? 'bg-cyan-500 border-cyan-400'
          : 'bg-red-500 border-red-400';
      default:
        return 'bg-slate-500 border-slate-400';
    }
  };

  const getMessageLabel = () => {
    switch (message.type) {
      case 'RequestVote':
        return 'Vote?';
      case 'VoteResponse':
        return message.voteGranted ? 'Yes' : 'No';
      case 'AppendEntries':
        return message.entries && message.entries.length > 0 ? 'Log' : 'HB';
      case 'AppendEntriesResponse':
        return message.success ? 'OK' : 'Fail';
      default:
        return '?';
    }
  };

  return (
    <div
      className={`absolute pointer-events-none animate-bounce`}
      style={{
        left: messageX,
        top: messageY,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
      }}
    >
      <div
        className={`
          px-3 py-1.5 rounded-full border-2 shadow-lg
          text-white text-xs font-bold whitespace-nowrap
          ${getMessageColor()}
        `}
      >
        {getMessageLabel()}
      </div>
      <div className="text-[10px] text-center text-white bg-black/50 rounded px-1 mt-1">
        {message.type}
      </div>
    </div>
  );
};
