import React from 'react';
import { useViewport, Node } from 'reactflow';
import { RaftMessage } from '../../types';

interface MessageVisualizationProps {
  message: RaftMessage;
  sourceNode: Node;
  targetNode: Node;
}

export const MessageVisualization: React.FC<MessageVisualizationProps> = ({
  message,
  sourceNode,
  targetNode,
}) => {
  const viewport = useViewport();

  // Transform node position to screen coordinates
  const targetPos = targetNode.position;

  // Apply viewport transform (zoom and pan)
  const screenX = targetPos.x * viewport.zoom + viewport.x + 100 * viewport.zoom;
  const screenY = targetPos.y * viewport.zoom + viewport.y - 20 * viewport.zoom;

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
        left: screenX,
        top: screenY,
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
