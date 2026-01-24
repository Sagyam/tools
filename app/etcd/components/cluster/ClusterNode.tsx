import React from 'react';
import { Handle, Position } from 'reactflow';
import { EtcdNode } from '../../types';
import { Wifi, WifiOff, Activity } from 'lucide-react';

interface ClusterNodeProps {
  data: {
    node: EtcdNode;
    onFailover: (nodeId: string) => void;
    onTogglePartition: (nodeId: string) => void;
  };
}

export const ClusterNode: React.FC<ClusterNodeProps> = ({ data }) => {
  const { node, onFailover, onTogglePartition } = data;

  const getStatusColor = () => {
    if (node.isPartitioned) {
      return 'bg-red-800 border-red-600';
    }
    switch (node.status) {
      case 'leader':
        return 'bg-sky-600 border-sky-500';
      case 'follower':
        return 'bg-slate-600 border-slate-500';
      case 'candidate':
        return 'bg-amber-600 border-amber-500';
      case 'replicating':
        return 'bg-purple-600 border-purple-500';
      default:
        return 'bg-slate-600 border-slate-500';
    }
  };

  const timeSinceHeartbeat = Date.now() - node.lastHeartbeat;
  const isHealthy = timeSinceHeartbeat < 5000;

  return (
    <div
      className={`
        px-6 py-4 rounded-lg border-2 shadow-lg
        transition-all duration-300
        ${getStatusColor()}
        ${!isHealthy && !node.isPartitioned ? 'opacity-50 animate-pulse' : ''}
        ${node.isPartitioned ? 'opacity-60' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex flex-col items-center gap-2 text-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{node.id}</span>
          {isHealthy && !node.isPartitioned && (
            <div title="Heartbeat active">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePartition(node.id);
            }}
            className="hover:scale-110 transition-transform"
            title={node.isPartitioned ? 'Restore network' : 'Simulate network partition'}
          >
            {node.isPartitioned ? (
              <WifiOff className="w-4 h-4 text-red-300" />
            ) : (
              <Wifi className="w-4 h-4 text-green-300" />
            )}
          </button>
        </div>

        <div className="text-xs space-y-1 text-center w-full">
          <div className="font-semibold uppercase tracking-wide">{node.status}</div>
          <div className="flex justify-between gap-4">
            <span>Term: {node.term}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
            <div className="bg-white/10 rounded px-2 py-1" title="Log entries (may be uncommitted)">
              <div className="opacity-70">Log</div>
              <div className="font-bold">{node.log?.length || 0}</div>
            </div>
            <div className="bg-white/10 rounded px-2 py-1" title="Committed entries (safe to apply)">
              <div className="opacity-70">Commit</div>
              <div className="font-bold text-green-300">{node.commitIndex}</div>
            </div>
          </div>
          {node.log && node.log.length > node.commitIndex && (
            <div className="text-[10px] text-amber-200">
              {node.log.length - node.commitIndex} uncommitted
            </div>
          )}
          {node.status === 'candidate' && node.votesReceived !== undefined && (
            <div className="text-xs font-bold text-amber-200 mt-1">
              Votes: {node.votesReceived}
            </div>
          )}
          {node.votedFor && node.status === 'follower' && (
            <div className="text-[10px] opacity-80">Voted: {node.votedFor}</div>
          )}
        </div>

        {node.isPartitioned && (
          <div className="text-xs font-bold text-red-300 animate-pulse">
            PARTITIONED
          </div>
        )}

        {!isHealthy && !node.isPartitioned && (
          <div className="text-xs font-bold animate-pulse">
            No Heartbeat
          </div>
        )}

        <button
          onClick={() => onFailover(node.id)}
          className="mt-2 px-3 py-1 text-[10px] bg-white/20 hover:bg-white/30 rounded transition-colors"
        >
          Trigger Election
        </button>
      </div>
    </div>
  );
};
