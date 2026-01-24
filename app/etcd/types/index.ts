// Core etcd types for our educational app

export type NodeStatus = 'leader' | 'follower' | 'candidate';

export interface EtcdNode {
  id: string;
  status: NodeStatus;
  term: number;
  commitIndex: number;
  lastHeartbeat: number;
  votedFor?: string;
}

export interface LogEntry {
  term: number;
  index: number;
  key: string;
  value: string;
  timestamp: number;
}

export interface KeyValue {
  key: string;
  value: string;
  version: number;
  createRevision: number;
  modRevision: number;
  lease?: string;
  ttl?: number;
  expiresAt?: number;
}

export interface Lease {
  id: string;
  ttl: number;
  grantedAt: number;
  keys: string[];
}

export interface WatchEvent {
  type: 'PUT' | 'DELETE';
  key: string;
  value?: string;
  prevValue?: string;
  timestamp: number;
}

export interface TreeNode {
  name: string;
  fullPath: string;
  value?: string;
  children?: TreeNode[];
  isLeaf: boolean;
}

export interface ClusterState {
  nodes: Map<string, EtcdNode>;
  logs: LogEntry[];
  currentTerm: number;
}
