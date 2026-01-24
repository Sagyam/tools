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
import { Button } from '@/components/ui/button';
import { LearningGuide } from '../LearningGuide';
import { HelpTooltip } from '../HelpTooltip';

const nodeTypes = {
  clusterNode: ClusterNode,
};

const LEARNING_STEPS = [
  {
    action: 'Observe the initial cluster',
    learn: 'One node is the leader (blue), others are followers (gray)',
  },
  {
    action: 'Click any follower node',
    learn: 'Triggers leader election - watch the term number increase',
  },
  {
    action: 'Click "Add Key" button',
    learn: 'Leader replicates data to followers via animated arrows',
  },
  {
    action: 'Try different cluster sizes',
    learn: 'Larger clusters provide better fault tolerance',
  },
];

export const ClusterVisualization: React.FC = () => {
  const {
    nodes: etcdNodes,
    currentTerm,
    logs,
    initializeCluster,
    electLeader,
    simulateHeartbeat,
    put,
  } = useEtcdStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (etcdNodes.size === 0) {
      initializeCluster(5);
    }
  }, []);

  const handleFailover = useCallback(
    (nodeId: string) => {
      electLeader(nodeId);
    },
    [electLeader]
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
        },
      };
    });

    setNodes(flowNodes);
  }, [etcdNodes, handleFailover, setNodes]);

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
    const leader = Array.from(etcdNodes.values()).find(n => n.status === 'leader');
    if (!leader) return;

    const interval = setInterval(() => {
      // Leader sends heartbeat to itself
      simulateHeartbeat(leader.id);

      // Leader sends heartbeat to all followers (simulating Raft heartbeat)
      Array.from(etcdNodes.values())
        .filter(n => n.status === 'follower')
        .forEach(follower => {
          simulateHeartbeat(follower.id);
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [etcdNodes, simulateHeartbeat]);

  const handleAddKey = useCallback(() => {
    const timestamp = Date.now();
    put(`/config/key-${timestamp}`, `value-${timestamp}`);
  }, [put]);

  const leaderNode = useMemo(
    () => Array.from(etcdNodes.values()).find(n => n.status === 'leader'),
    [etcdNodes]
  );

  return (
    <div className="space-y-4">
      <LearningGuide steps={LEARNING_STEPS} />

      <div className="flex flex-wrap gap-2 p-4 bg-primary border border-primary-foreground rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">Cluster Size:</span>
          <Button onClick={() => initializeCluster(3)} variant="outline">
            3 Nodes
          </Button>
          <Button onClick={() => initializeCluster(5)} variant="outline">
            5 Nodes
          </Button>
          <Button onClick={() => initializeCluster(7)} variant="outline">
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
        <div className="flex items-center gap-2">
          <Button onClick={handleAddKey} className="bg-sky-600 hover:bg-sky-500">
            Add Key (Trigger Replication)
          </Button>
          <HelpTooltip>
            <div className="space-y-1">
              <div className="font-semibold">Log Replication</div>
              <div>Leader writes to log first</div>
              <div>Then replicates to followers</div>
              <div>Watch the animated arrows</div>
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
                <div>Click any follower to trigger failover</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="text-2xl font-bold text-sky-400">
            {leaderNode?.id || 'None'}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Log Entries</span>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Replicated Log</div>
                <div>All writes are logged</div>
                <div>Replicated to all nodes</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="text-2xl font-bold">{logs.length}</div>
        </div>
      </div>

      <div className="w-full h-[600px] border border-primary-foreground rounded-lg relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs border border-slate-700">
          Click any node to trigger leader election
        </div>
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
              switch (nodeData.status) {
                case 'leader':
                  return '#0ea5e9';
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
      </div>
    </div>
  );
};
