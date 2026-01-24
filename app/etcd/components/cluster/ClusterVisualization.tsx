'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEtcdStore } from '../../store/etcdStore';
import { ClusterNode } from './ClusterNode';
import { MessageVisualization } from './MessageVisualization';
import { Button } from '@/components/ui/button';
import { LearningGuide } from '../LearningGuide';
import { HelpTooltip } from '../HelpTooltip';

const nodeTypes = {
  clusterNode: ClusterNode,
};

const LEARNING_CONCEPTS = [
  {
    title: 'Log Entries',
    description: 'All proposed operations, including uncommitted ones. Can be ahead of commits during replication.',
  },
  {
    title: 'Commit Index',
    description: 'Operations replicated to majority and safe to apply. All nodes eventually reach same commit index.',
  },
  {
    title: 'Replicating State',
    description: 'Followers turn purple when receiving log entries. They commit once majority confirms the entry.',
  },
];

const LEARNING_STEPS = [
  {
    action: 'Observe the initial cluster',
    learn: 'One node is the leader (blue), others are followers (gray)',
  },
  {
    action: 'Click "Add Key (Replicate)" and watch counters',
    learn: 'Log count increases first, then Commit follows after majority - this is the 2-phase commit',
  },
  {
    action: 'Partition a follower, then add keys',
    learn: 'Partitioned node keeps its old logs - when restored, it receives missed entries via catch-up',
  },
  {
    action: 'Click "Trigger Election" on any node',
    learn: 'Watch the Raft election: candidate requests votes, collects majority, becomes leader',
  },
  {
    action: 'Partition the leader node',
    learn: 'Cluster automatically elects new leader from healthy nodes after 2s timeout',
  },
  {
    action: 'Restore the partitioned node',
    learn: 'Watch it catch up - Leader sends all missed log entries (catch-up messages), then syncs commit index',
  },
  {
    action: 'Watch message labels',
    learn: 'Vote? = vote request, Yes/No = vote response, Log = log entry, HB = heartbeat, OK = success response',
  },
];

export const ClusterVisualization: React.FC = () => {
  const {
    nodes: etcdNodes,
    currentTerm,
    logs,
    messages,
    initializeCluster,
    startElection,
    simulateHeartbeat,
    putWithReplication,
    togglePartition,
  } = useEtcdStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isReplicating, setIsReplicating] = React.useState(false);

  useEffect(() => {
    if (etcdNodes.size === 0) {
      initializeCluster(5);
    }
  }, []);

  const handleFailover = useCallback(
    async (nodeId: string) => {
      await startElection(nodeId);
    },
    [startElection]
  );

  const handleTogglePartition = useCallback(
    async (nodeId: string) => {
      await togglePartition(nodeId);
    },
    [togglePartition]
  );

  useEffect(() => {
    const nodeArray = Array.from(etcdNodes.values());
    const flowNodes: Node[] = nodeArray.map((node, index) => {
      const angle = (index * 2 * Math.PI) / nodeArray.length;
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      return {
        id: node.id,
        type: 'clusterNode',
        position: { x, y },
        data: {
          node,
          onFailover: handleFailover,
          onTogglePartition: handleTogglePartition,
        },
      };
    });

    setNodes(flowNodes);
  }, [etcdNodes, handleFailover, handleTogglePartition, setNodes]);

  useEffect(() => {
    const leader = Array.from(etcdNodes.values()).find(n => n.status === 'leader');
    if (!leader) {
      setEdges([]);
      return;
    }

    const replicationEdges: Edge[] = Array.from(etcdNodes.values())
      .filter(n => n.status === 'follower')
      .map(follower => ({
        id: `${leader.id}-${follower.id}`,
        source: leader.id,
        target: follower.id,
        animated: true,
        style: { stroke: '#0ea5e9', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#0ea5e9',
        },
      }));

    setEdges(replicationEdges);
  }, [etcdNodes, setEdges]);

  useEffect(() => {
    const leader = Array.from(etcdNodes.values()).find(
      n => n.status === 'leader' && !n.isPartitioned
    );
    if (!leader) return;

    const interval = setInterval(() => {
      // Leader sends heartbeat to itself
      simulateHeartbeat(leader.id);

      // Leader sends heartbeat to all non-partitioned followers (simulating Raft heartbeat)
      Array.from(etcdNodes.values())
        .filter(n => n.status === 'follower' && !n.isPartitioned)
        .forEach(follower => {
          simulateHeartbeat(follower.id);

          // Optionally send visual heartbeat message (less frequently to avoid clutter)
          if (Math.random() < 0.1) {
            const heartbeat: import('../../types').RaftMessage = {
              id: `heartbeat-${Date.now()}-${Math.random()}`,
              type: 'AppendEntries',
              from: leader.id,
              to: follower.id,
              term: leader.term,
              entries: [],
              leaderCommit: leader.commitIndex,
              timestamp: Date.now(),
            };
            useEtcdStore.getState().sendMessage(heartbeat);
          }
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [etcdNodes, simulateHeartbeat]);

  const handleAddKey = useCallback(async () => {
    setIsReplicating(true);
    const timestamp = Date.now();
    await putWithReplication(`/config/key-${timestamp}`, `value-${timestamp}`);
    setIsReplicating(false);
  }, [putWithReplication]);

  const leaderNode = useMemo(
    () => Array.from(etcdNodes.values()).find(n => n.status === 'leader'),
    [etcdNodes]
  );

  return (
    <div className="space-y-4">
      <LearningGuide steps={LEARNING_STEPS} concepts={LEARNING_CONCEPTS} />

      <div className="space-y-4 p-4 bg-primary border border-primary-foreground rounded-lg">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">Cluster Size:</span>
            <Button onClick={() => initializeCluster(3)} variant="outline" size="sm">
              3 Nodes
            </Button>
            <Button onClick={() => initializeCluster(5)} variant="outline" size="sm">
              5 Nodes
            </Button>
            <Button onClick={() => initializeCluster(7)} variant="outline" size="sm">
              7 Nodes
            </Button>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Cluster Size</div>
                <div>Raft requires odd numbers for quorum</div>
                <div>Larger = more fault tolerant, slower consensus</div>
              </div>
            </HelpTooltip>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            onClick={handleAddKey}
            className="bg-sky-600 hover:bg-sky-500"
            disabled={isReplicating}
          >
            {isReplicating ? 'Replicating...' : 'Add Key (Replicate)'}
          </Button>
          <HelpTooltip>
            <div className="space-y-1">
              <div className="font-semibold">Log Replication</div>
              <div>1. Leader appends to log</div>
              <div>2. Sends AppendEntries to followers</div>
              <div>3. Commits after majority acknowledges</div>
              <div>Watch the messages fly!</div>
            </div>
          </HelpTooltip>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-primary border border-primary-foreground rounded-lg text-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Current Term</span>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Election Term</div>
                <div>Increments with each election</div>
                <div>Prevents conflicts between leaders</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="text-2xl font-bold">{currentTerm}</div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Current Leader</span>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Leader Node</div>
                <div>Only the leader handles writes</div>
                <div>Click "Trigger Election" to start election</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="text-2xl font-bold text-sky-400">
            {leaderNode?.id || 'None'}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Total Commits</span>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Committed Entries</div>
                <div>Entries that have been safely replicated</div>
                <div>to a majority of nodes</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="text-2xl font-bold text-green-400">{logs.length}</div>
        </div>
      </div>

      <div className="w-full h-[600px] border border-primary-foreground rounded-lg relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs border border-slate-700 space-y-1">
          <div className="font-semibold">Interactive Controls:</div>
          <div>Click "Trigger Election" on nodes to start election</div>
          <div>Click WiFi icon to partition/restore network</div>
          <div>Use "Add Key" to see log replication</div>
          <div>Watch nodes turn purple during replication</div>
        </div>

        <div className="absolute top-4 right-4 z-10 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs border border-slate-700 space-y-1">
          <div className="font-semibold">Legend:</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-600 rounded"></div>
            <span>Leader</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded"></div>
            <span>Replicating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-600 rounded"></div>
            <span>Candidate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-600 rounded"></div>
            <span>Follower</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-800 rounded"></div>
            <span>Partitioned</span>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs border border-slate-700">
            Active messages: {messages.length}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const nodeData = etcdNodes.get(node.id);
              if (!nodeData) return '#64748b';
              if (nodeData.isPartitioned) return '#991b1b';
              switch (nodeData.status) {
                case 'leader':
                  return '#0ea5e9';
                case 'replicating':
                  return '#9333ea';
                case 'follower':
                  return '#64748b';
                case 'candidate':
                  return '#f59e0b';
                default:
                  return '#64748b';
              }
            }}
          />
        </ReactFlow>

        {messages.map((message) => {
          const sourceNode = nodes.find((n) => n.id === message.from);
          const targetNode = nodes.find((n) => n.id === message.to);
          if (!sourceNode || !targetNode) return null;

          return (
            <MessageVisualization
              key={message.id}
              message={message}
              sourcePos={sourceNode.position}
              targetPos={targetNode.position}
            />
          );
        })}
      </div>
    </div>
  );
};
