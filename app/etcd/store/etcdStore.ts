import { create } from 'zustand';
import { EtcdNode, KeyValue, Lease, WatchEvent, LogEntry } from '../types';

interface EtcdStore {
  // Cluster state
  nodes: Map<string, EtcdNode>;
  currentTerm: number;
  logs: LogEntry[];

  // Key-Value store
  keyValues: Map<string, KeyValue>;

  // Leases
  leases: Map<string, Lease>;

  // Watch events
  watchEvents: WatchEvent[];
  watchers: Map<string, Set<(event: WatchEvent) => void>>;

  // Actions - Cluster
  initializeCluster: (nodeCount: number) => void;
  electLeader: (nodeId: string) => void;
  simulateHeartbeat: (nodeId: string) => void;
  addLogEntry: (entry: LogEntry) => void;
  replicateLog: (fromNodeId: string, toNodeId: string) => void;

  // Actions - Key-Value
  put: (key: string, value: string, leaseId?: string) => void;
  get: (key: string) => KeyValue | undefined;
  delete: (key: string) => void;

  // Actions - Leases
  grantLease: (ttl: number) => string;
  attachLease: (key: string, leaseId: string) => void;
  revokeLease: (leaseId: string) => void;

  // Actions - Watch
  watch: (key: string, callback: (event: WatchEvent) => void) => () => void;
  unwatch: (key: string, callback: (event: WatchEvent) => void) => void;

  // Utilities
  reset: () => void;
}

const createInitialNode = (id: string, isLeader: boolean = false): EtcdNode => ({
  id,
  status: isLeader ? 'leader' : 'follower',
  term: 1,
  commitIndex: 0,
  lastHeartbeat: Date.now(),
});

export const useEtcdStore = create<EtcdStore>((set, get) => ({
  nodes: new Map(),
  currentTerm: 1,
  logs: [],
  keyValues: new Map(),
  leases: new Map(),
  watchEvents: [],
  watchers: new Map(),

  // Initialize cluster with specified number of nodes
  initializeCluster: (nodeCount: number) => {
    const nodes = new Map<string, EtcdNode>();
    for (let i = 0; i < nodeCount; i++) {
      const id = `node-${i + 1}`;
      nodes.set(id, createInitialNode(id, i === 0));
    }
    set({ nodes, currentTerm: 1, logs: [] });
  },

  // Elect a new leader
  electLeader: (nodeId: string) => {
    const nodes = new Map(get().nodes);
    const currentTerm = get().currentTerm + 1;

    // Set all nodes to follower
    nodes.forEach((node) => {
      node.status = 'follower';
      node.term = currentTerm;
    });

    // Elect the new leader
    const newLeader = nodes.get(nodeId);
    if (newLeader) {
      newLeader.status = 'leader';
      newLeader.term = currentTerm;
    }

    set({ nodes, currentTerm });
  },

  // Simulate heartbeat from a node
  simulateHeartbeat: (nodeId: string) => {
    const nodes = new Map(get().nodes);
    const node = nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      set({ nodes });
    }
  },

  // Add a log entry
  addLogEntry: (entry: LogEntry) => {
    const logs = [...get().logs, entry];
    set({ logs });
  },

  // Simulate log replication
  replicateLog: (fromNodeId: string, toNodeId: string) => {
    const nodes = new Map(get().nodes);
    const fromNode = nodes.get(fromNodeId);
    const toNode = nodes.get(toNodeId);

    if (fromNode && toNode) {
      toNode.commitIndex = fromNode.commitIndex;
      set({ nodes });
    }
  },

  // Put a key-value pair
  put: (key: string, value: string, leaseId?: string) => {
    const keyValues = new Map(get().keyValues);
    const existing = keyValues.get(key);
    const now = Date.now();

    const kv: KeyValue = {
      key,
      value,
      version: (existing?.version || 0) + 1,
      createRevision: existing?.createRevision || now,
      modRevision: now,
      lease: leaseId,
    };

    // If there's a lease, attach TTL
    if (leaseId) {
      const lease = get().leases.get(leaseId);
      if (lease) {
        kv.ttl = lease.ttl;
        kv.expiresAt = lease.grantedAt + lease.ttl * 1000;

        // Add key to lease
        const leases = new Map(get().leases);
        const updatedLease = leases.get(leaseId);
        if (updatedLease && !updatedLease.keys.includes(key)) {
          updatedLease.keys.push(key);
          set({ leases });
        }
      }
    }

    keyValues.set(key, kv);

    // Add log entry
    const leader = Array.from(get().nodes.values()).find(n => n.status === 'leader');
    if (leader) {
      const logEntry: LogEntry = {
        term: leader.term,
        index: get().logs.length + 1,
        key,
        value,
        timestamp: now,
      };
      get().addLogEntry(logEntry);

      // Update leader commit index
      const nodes = new Map(get().nodes);
      const leaderNode = nodes.get(leader.id);
      if (leaderNode) {
        leaderNode.commitIndex = logEntry.index;
      }
      set({ nodes });
    }

    // Trigger watch events
    const event: WatchEvent = {
      type: 'PUT',
      key,
      value,
      prevValue: existing?.value,
      timestamp: now,
    };

    const watchEvents = [...get().watchEvents, event];
    set({ keyValues, watchEvents });

    // Notify watchers
    const watchers = get().watchers.get(key);
    if (watchers) {
      watchers.forEach(callback => callback(event));
    }
  },

  // Get a key-value pair
  get: (key: string) => {
    return get().keyValues.get(key);
  },

  // Delete a key
  delete: (key: string) => {
    const keyValues = new Map(get().keyValues);
    const existing = keyValues.get(key);

    if (existing) {
      keyValues.delete(key);

      const event: WatchEvent = {
        type: 'DELETE',
        key,
        prevValue: existing.value,
        timestamp: Date.now(),
      };

      const watchEvents = [...get().watchEvents, event];
      set({ keyValues, watchEvents });

      // Notify watchers
      const watchers = get().watchers.get(key);
      if (watchers) {
        watchers.forEach(callback => callback(event));
      }
    }
  },

  // Grant a new lease
  grantLease: (ttl: number) => {
    const leaseId = `lease-${Date.now()}`;
    const lease: Lease = {
      id: leaseId,
      ttl,
      grantedAt: Date.now(),
      keys: [],
    };

    const leases = new Map(get().leases);
    leases.set(leaseId, lease);
    set({ leases });

    // Auto-revoke after TTL
    setTimeout(() => {
      get().revokeLease(leaseId);
    }, ttl * 1000);

    return leaseId;
  },

  // Attach a lease to a key
  attachLease: (key: string, leaseId: string) => {
    const kv = get().keyValues.get(key);
    if (kv) {
      get().put(key, kv.value, leaseId);
    }
  },

  // Revoke a lease
  revokeLease: (leaseId: string) => {
    const lease = get().leases.get(leaseId);
    if (!lease) return;

    // Delete all keys associated with this lease
    lease.keys.forEach(key => {
      get().delete(key);
    });

    const leases = new Map(get().leases);
    leases.delete(leaseId);
    set({ leases });
  },

  // Watch a key for changes
  watch: (key: string, callback: (event: WatchEvent) => void) => {
    const watchers = new Map(get().watchers);
    if (!watchers.has(key)) {
      watchers.set(key, new Set());
    }
    watchers.get(key)!.add(callback);
    set({ watchers });

    // Return unwatch function
    return () => get().unwatch(key, callback);
  },

  // Unwatch a key
  unwatch: (key: string, callback: (event: WatchEvent) => void) => {
    const watchers = new Map(get().watchers);
    const keyWatchers = watchers.get(key);
    if (keyWatchers) {
      keyWatchers.delete(callback);
      if (keyWatchers.size === 0) {
        watchers.delete(key);
      }
      set({ watchers });
    }
  },

  // Reset all state
  reset: () => {
    set({
      nodes: new Map(),
      currentTerm: 1,
      logs: [],
      keyValues: new Map(),
      leases: new Map(),
      watchEvents: [],
      watchers: new Map(),
    });
  },
}));
