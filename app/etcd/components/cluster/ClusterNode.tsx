import React from 'react';
import { Handle, Position } from 'reactflow';
import { EtcdNode } from '../../types';

interface ClusterNodeProps {
  data: {
    node: EtcdNode;
    onFailover: (nodeId: string) => void;
  };
}

export const ClusterNode: React.FC<ClusterNodeProps> = ({ data }) => {
  const { node, onFailover } = data;

  const getStatusColor = () => {
    switch (node.status) {
      case 'leader':
        return 'bg-sky-600 border-sky-500';
      case 'follower':
        return 'bg-slate-600 border-slate-500';
      case 'candidate':
        return 'bg-amber-600 border-amber-500';
      default:
        return 'bg-slate-600 border-slate-500';
    }
  };

  const timeSinceHeartbeat = Date.now() - node.lastHeartbeat;
  const isHealthy = timeSinceHeartbeat < 5000;

  return (
    <div
      className={`
        px-6 py-4 rounded-lg border-2 shadow-lg cursor-pointer
        transition-all duration-300 hover:scale-105
        ${getStatusColor()}
        ${!isHealthy ? 'opacity-50 animate-pulse' : ''}
      `}
      onClick={() => onFailover(node.id)}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex flex-col items-center gap-2 text-white">
        <span className="font-bold text-lg">{node.id}</span>

        <div className="text-xs space-y-1 text-center">
          <div className="font-semibold uppercase">{node.status}</div>
          <div>Term: {node.term}</div>
          <div>Commit: {node.commitIndex}</div>
        </div>

        {!isHealthy && (
          <div className="text-xs font-bold animate-pulse">
            No Heartbeat
          </div>
        )}
      </div>
    </div>
  );
};
