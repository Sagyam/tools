'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { buildTreeFromKeys, calculateTreeLayout } from '../../utils/treeUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LearningGuide } from '../LearningGuide';
import { HelpTooltip } from '../HelpTooltip';

const LEARNING_STEPS = [
  {
    action: 'Click "Load Sample Data"',
    learn: 'See how keys are organized in a hierarchical tree structure',
  },
  {
    action: 'Add a new key like "/config/db/name"',
    learn: 'Keys use path notation - creates nested structure automatically',
  },
  {
    action: 'Observe the tree layout',
    learn: 'Blue nodes = actual values, Gray nodes = path segments',
  },
  {
    action: 'Delete keys from the list',
    learn: 'Tree updates in real-time as keys are removed',
  },
];

interface TreeNodeData {
  label: string;
  fullPath: string;
  value?: string;
  isLeaf: boolean;
}

export const TreeVisualization: React.FC = () => {
  const { keyValues, put, deleteKey } = useEtcdStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const treeData = buildTreeFromKeys(keyValues);
    const layout = calculateTreeLayout(treeData, 1200, 800);

    const flowNodes: Node<TreeNodeData>[] = [];
    const flowEdges: Edge[] = [];

    layout.each((node) => {
      const nodeData = node.data;

      flowNodes.push({
        id: nodeData.fullPath,
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          label: nodeData.name,
          fullPath: nodeData.fullPath,
          value: nodeData.value,
          isLeaf: nodeData.isLeaf,
        },
        style: {
          background: nodeData.isLeaf ? '#0ea5e9' : '#64748b',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: nodeData.isLeaf ? '2px solid #0284c7' : '2px solid #475569',
        },
      });

      if (node.parent) {
        flowEdges.push({
          id: `${node.parent.data.fullPath}-${nodeData.fullPath}`,
          source: node.parent.data.fullPath,
          target: nodeData.fullPath,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [keyValues, setNodes, setEdges]);

  const handleAddKey = useCallback(() => {
    if (!newKey || !newValue) return;
    const key = newKey.startsWith('/') ? newKey : `/${newKey}`;
    put(key, newValue);
    setNewKey('');
    setNewValue('');
  }, [newKey, newValue, put]);

  const handleAddSampleData = useCallback(() => {
    put('/config/app/name', 'MyApp');
    put('/config/app/version', '1.0.0');
    put('/config/db/host', 'localhost');
    put('/config/db/port', '5432');
    put('/services/api/url', 'https://api.example.com');
    put('/services/api/timeout', '30');
    put('/services/cache/enabled', 'true');
  }, [put]);

  const keyCount = keyValues.size;

  return (
    <div className="space-y-4">
      <LearningGuide steps={LEARNING_STEPS} />

      <div className="p-4 bg-primary border border-primary-foreground rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="key">Key Path</Label>
              <HelpTooltip>
                <div className="space-y-1">
                  <div className="font-semibold">Path Format</div>
                  <div>Use / to create hierarchy</div>
                  <div>Example: /config/db/host</div>
                </div>
              </HelpTooltip>
            </div>
            <Input
              id="key"
              placeholder="/config/app/name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
            />
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              onClick={handleAddKey}
              className="w-full bg-sky-600 hover:bg-sky-500"
              disabled={!newKey || !newValue}
            >
              Add Key
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddSampleData} variant="outline">
            Load Sample Data
          </Button>
          <Button
            onClick={() => {
              Array.from(keyValues.keys()).forEach(deleteKey);
            }}
            variant="outline"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-4 bg-primary border border-primary-foreground rounded-lg">
        <div className="text-secondary text-sm">Total Keys</div>
        <div className="text-2xl font-bold">{keyCount}</div>
      </div>

      <div className="w-full h-[600px] border border-primary-foreground rounded-lg relative">
        {keyCount === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">No keys yet</div>
              <div className="text-sm">Add a key-value pair or load sample data to get started</div>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute top-4 left-4 z-10 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs border border-slate-700 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-500 rounded"></div>
                <span>Leaf nodes (actual values)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded"></div>
                <span>Path segments</span>
              </div>
            </div>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  const isLeaf = (node.data as TreeNodeData).isLeaf;
                  return isLeaf ? '#0ea5e9' : '#64748b';
                }}
              />
            </ReactFlow>
          </>
        )}
      </div>

      {keyCount > 0 && (
        <div className="space-y-2">
          <Label>Current Keys</Label>
          <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-primary border border-primary-foreground rounded-lg">
            {Array.from(keyValues.entries()).map(([key, kv]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 bg-primary border border-primary-foreground rounded hover:bg-slate-700/50"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold">{key}</div>
                  <div className="text-xs text-secondary">{kv.value}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteKey(key)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
