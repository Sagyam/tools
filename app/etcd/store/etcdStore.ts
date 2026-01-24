import { create } from 'zustand';
import { EtcdNode, KeyValue, Lease, WatchEvent, LogEntry, RaftMessage } from '../types';

// Constants
const DEFAULT_REPLICATION_SPEED = 1000; // milliseconds
const DEFAULT_TERM = 1;
const ELECTION_TIMEOUT_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 1000;
const HEARTBEAT_TIMEOUT_MS = 5000;

/**
 * Replication speed mapping based on cluster size
 * More nodes = faster replication to keep visualization smooth
 */
const REPLICATION_SPEED_MAP: Record<number, number> = {
  3: 1200,
  5: 1000,
  7: 800,
  9: 700,
  11: 600,
  13: 500,
  15: 400,
};

/**
 * Get appropriate replication speed for cluster size
 */
const getReplicationSpeed = (nodeCount: number): number => {
  return REPLICATION_SPEED_MAP[nodeCount] || 1000;
};

interface EtcdStore {
  // Cluster state
  nodes: Map<string, EtcdNode>;
  currentTerm: number;
  logs: LogEntry[];
  messages: RaftMessage[];
  partitionedNodes: Set<string>;
  replicationSpeed: number; // milliseconds delay for visualization

  // Key-Value store
  keyValues: Map<string, KeyValue>;

  // Leases
  leases: Map<string, Lease>;

  // Watch events
  watchEvents: WatchEvent[];
  watchers: Map<string, Set<(event: WatchEvent) => void>>;

  // Actions - Cluster
  initializeCluster: (nodeCount: number) => void;
  startElection: (nodeId: string) => Promise<void>;
  simulateHeartbeat: (nodeId: string) => void;
  addLogEntry: (entry: LogEntry) => void;
  replicateLog: (fromNodeId: string, toNodeId: string) => void;
  sendMessage: (message: RaftMessage) => void;
  clearMessage: (messageId: string) => void;
  togglePartition: (nodeId: string) => Promise<void>;
  setReplicationSpeed: (speed: number) => void;
  putWithReplication: (key: string, value: string, leaseId?: string) => Promise<void>;

  // Actions - Key-Value
  put: (key: string, value: string, leaseId?: string) => void;
  getKey: (key: string) => KeyValue | undefined;
  deleteKey: (key: string) => void;

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

const createInitialNode = (id: string, isLeader = false): EtcdNode => ({
  id,
  status: isLeader ? 'leader' : 'follower',
  term: DEFAULT_TERM,
  commitIndex: 0,
  lastHeartbeat: Date.now(),
  votesReceived: 0,
  log: [],
  isPartitioned: false,
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate majority quorum size for Raft consensus
 * @param totalNodes - Total number of nodes in the cluster
 * @returns Minimum number of nodes needed for majority
 */
const calculateMajority = (totalNodes: number): number => Math.floor(totalNodes / 2) + 1;

export const useEtcdStore = create<EtcdStore>((set, get) => ({
  nodes: new Map(),
  currentTerm: DEFAULT_TERM,
  logs: [],
  messages: [],
  partitionedNodes: new Set(),
  replicationSpeed: DEFAULT_REPLICATION_SPEED,
  keyValues: new Map(),
  leases: new Map(),
  watchEvents: [],
  watchers: new Map(),

  // Initialize cluster with specified number of nodes
  initializeCluster: (nodeCount: number): void => {
    const nodes = new Map<string, EtcdNode>();
    for (let i = 0; i < nodeCount; i++) {
      const id = `node-${i + 1}`;
      nodes.set(id, createInitialNode(id, i === 0));
    }
    const replicationSpeed = getReplicationSpeed(nodeCount);
    set({ nodes, currentTerm: DEFAULT_TERM, logs: [], replicationSpeed });
  },

  /**
   * Start election process following the Raft consensus algorithm
   * @param nodeId - The ID of the node initiating the election
   *
   * Process:
   * 1. Node becomes a candidate and increments term
   * 2. Votes for itself
   * 3. Sends RequestVote RPCs to all other nodes
   * 4. Waits for responses
   * 5. Becomes leader if it receives votes from a majority
   */
  startElection: async (nodeId: string): Promise<void> => {
    const nodes = new Map(get().nodes);
    const candidate = nodes.get(nodeId);
    if (!candidate || candidate.isPartitioned) return;

    const currentTerm = get().currentTerm + 1;
    const speed = get().replicationSpeed;

    // Step 1: Become candidate
    candidate.status = 'candidate';
    candidate.term = currentTerm;
    candidate.votedFor = nodeId;
    candidate.votesReceived = 1; // Vote for self
    set({ nodes: new Map(nodes), currentTerm });

    await sleep(speed * 0.5);

    // Step 2: Send RequestVote RPCs to all other nodes
    const otherNodes = Array.from(nodes.values()).filter(
      n => n.id !== nodeId && !n.isPartitioned
    );

    for (const node of otherNodes) {
      const voteRequest: RaftMessage = {
        id: `vote-req-${Date.now()}-${Math.random()}`,
        type: 'RequestVote',
        from: nodeId,
        to: node.id,
        term: currentTerm,
        candidateId: nodeId,
        timestamp: Date.now(),
      };
      get().sendMessage(voteRequest);
      await sleep(speed * 0.3);
    }

    await sleep(speed * 0.5);

    // Step 3: Process votes
    let votesGranted = 1; // Self vote
    for (const node of otherNodes) {
      const updatedNodes = new Map(get().nodes);
      const voter = updatedNodes.get(node.id);

      if (voter && !voter.votedFor && voter.term <= currentTerm) {
        voter.votedFor = nodeId;
        voter.term = currentTerm;
        votesGranted++;

        const voteResponse: RaftMessage = {
          id: `vote-resp-${Date.now()}-${Math.random()}`,
          type: 'VoteResponse',
          from: node.id,
          to: nodeId,
          term: currentTerm,
          voteGranted: true,
          timestamp: Date.now(),
        };
        get().sendMessage(voteResponse);
        set({ nodes: new Map(updatedNodes) });
        await sleep(speed * 0.3);
      }
    }

    await sleep(speed * 0.5);

    // Step 4: Become leader if majority
    const totalNodes = Array.from(get().nodes.values()).filter(n => !n.isPartitioned).length;
    const majority = calculateMajority(totalNodes);

    const finalNodes = new Map(get().nodes);
    const finalCandidate = finalNodes.get(nodeId);

    if (finalCandidate && votesGranted >= majority) {
      // Set all nodes to follower first
      finalNodes.forEach((node) => {
        if (node.status === 'leader' || node.status === 'candidate') {
          node.status = 'follower';
        }
        node.votedFor = undefined;
        node.votesReceived = 0;
      });

      // Become leader
      finalCandidate.status = 'leader';
      finalCandidate.votesReceived = votesGranted;
      set({ nodes: new Map(finalNodes) });

      // Clear vote messages after election
      setTimeout(() => {
        const currentMessages = get().messages.filter(
          m => !m.type.includes('Vote')
        );
        set({ messages: currentMessages });
      }, speed);
    } else {
      // Failed to get majority, revert to follower
      if (finalCandidate) {
        finalCandidate.status = 'follower';
        finalCandidate.votesReceived = 0;
      }
      set({ nodes: new Map(finalNodes) });
    }
  },

  // Simulate heartbeat from a node
  simulateHeartbeat: (nodeId: string): void => {
    const nodes = new Map(get().nodes);
    const node = nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      set({ nodes });
    }
  },

  // Add a log entry
  addLogEntry: (entry: LogEntry): void => {
    const logs = [...get().logs, entry];
    set({ logs });
  },

  // Simulate log replication
  replicateLog: (fromNodeId: string, toNodeId: string): void => {
    const nodes = new Map(get().nodes);
    const fromNode = nodes.get(fromNodeId);
    const toNode = nodes.get(toNodeId);

    if (fromNode && toNode) {
      toNode.commitIndex = fromNode.commitIndex;
      set({ nodes });
    }
  },

  // Put a key-value pair
  put: (key: string, value: string, leaseId?: string): void => {
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
  getKey: (key: string): KeyValue | undefined => {
    return get().keyValues.get(key);
  },

  // Delete a key
  deleteKey: (key: string): void => {
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

  /**
   * Grant a new lease for time-based key expiration
   *
   * @param ttl - Time-to-live in seconds
   * @returns The lease ID
   *
   * Keys attached to the lease will be automatically deleted when the lease expires
   */
  grantLease: (ttl: number): string => {
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
  attachLease: (key: string, leaseId: string): void => {
    const kv = get().keyValues.get(key);
    if (kv) {
      get().put(key, kv.value, leaseId);
    }
  },

  // Revoke a lease
  revokeLease: (leaseId: string): void => {
    const lease = get().leases.get(leaseId);
    if (!lease) return;

    // Delete all keys associated with this lease
    lease.keys.forEach(key => {
      get().deleteKey(key);
    });

    const leases = new Map(get().leases);
    leases.delete(leaseId);
    set({ leases });
  },

  /**
   * Watch a key for changes and receive real-time notifications
   *
   * @param key - The key to watch
   * @param callback - Function called when the key changes
   * @returns Unwatch function to stop watching the key
   */
  watch: (key: string, callback: (event: WatchEvent) => void): (() => void) => {
    const watchers = new Map(get().watchers);
    if (!watchers.has(key)) {
      watchers.set(key, new Set());
    }
    const keyWatchers = watchers.get(key);
    if (keyWatchers) {
      keyWatchers.add(callback);
    }
    set({ watchers });

    // Return unwatch function
    return () => get().unwatch(key, callback);
  },

  // Unwatch a key
  unwatch: (key: string, callback: (event: WatchEvent) => void): void => {
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

  // Send a Raft message (for visualization)
  sendMessage: (message: RaftMessage): void => {
    const messages = [...get().messages, message];
    set({ messages });

    // Auto-clear message after animation
    setTimeout(() => {
      get().clearMessage(message.id);
    }, get().replicationSpeed);
  },

  // Clear a message
  clearMessage: (messageId: string): void => {
    const messages = get().messages.filter(m => m.id !== messageId);
    set({ messages });
  },

  /**
   * Toggle network partition for a node to simulate network failures
   *
   * @param nodeId - The ID of the node to partition or restore
   *
   * When partitioning:
   * - Node is isolated from the cluster
   * - If it's the leader, it steps down and triggers a new election
   *
   * When restoring:
   * - Node rejoins the cluster
   * - Receives all missed log entries from the current leader (catch-up)
   * - Syncs its commit index with the leader
   */
  togglePartition: async (nodeId: string): Promise<void> => {
    const nodes = new Map(get().nodes);
    const partitionedNodes = new Set(get().partitionedNodes);
    const node = nodes.get(nodeId);

    if (node) {
      const wasPartitioned = node.isPartitioned;
      node.isPartitioned = !node.isPartitioned;
      const wasLeader = node.status === 'leader';

      if (node.isPartitioned) {
        partitionedNodes.add(nodeId);
        // If leader is partitioned, it loses leadership
        if (node.status === 'leader') {
          node.status = 'follower';
        }
      } else {
        partitionedNodes.delete(nodeId);

        // Node came back online - need to catch up!
        if (wasPartitioned) {
          const leader = Array.from(nodes.values()).find(
            n => n.status === 'leader' && !n.isPartitioned
          );

          if (leader && leader.log) {
            const speed = get().replicationSpeed;

            // Wait a moment for UI to update
            await sleep(speed * 0.5);

            // Send all missing log entries from leader to restored node
            const restoredNode = nodes.get(nodeId);
            const restoredLog = restoredNode?.log || [];
            const leaderLog = leader.log || [];

            // Find entries the restored node is missing
            const missingEntries = leaderLog.slice(restoredLog.length);

            if (missingEntries.length > 0) {
              // Send catch-up AppendEntries
              for (const entry of missingEntries) {
                const catchUpMessage: RaftMessage = {
                  id: `catchup-${Date.now()}-${Math.random()}`,
                  type: 'AppendEntries',
                  from: leader.id,
                  to: nodeId,
                  term: leader.term,
                  entries: [entry],
                  leaderCommit: leader.commitIndex,
                  timestamp: Date.now(),
                };

                get().sendMessage(catchUpMessage);
                await sleep(speed * 0.5);

                // Append to restored node's log
                const updatedNodes = new Map(get().nodes);
                const updatedRestoredNode = updatedNodes.get(nodeId);
                if (updatedRestoredNode) {
                  updatedRestoredNode.log = [...(updatedRestoredNode.log || []), entry];
                  updatedRestoredNode.commitIndex = leader.commitIndex;
                  set({ nodes: new Map(updatedNodes) });
                }

                await sleep(speed * 0.5);
              }
            } else {
              // Just sync commit index if logs match
              const updatedNodes = new Map(get().nodes);
              const updatedRestoredNode = updatedNodes.get(nodeId);
              if (updatedRestoredNode) {
                updatedRestoredNode.commitIndex = leader.commitIndex;
                set({ nodes: new Map(updatedNodes) });
              }
            }
          }
        }
      }

      set({ nodes: new Map(nodes), partitionedNodes });

      // If leader was partitioned, trigger automatic election from a healthy follower
      if (wasLeader && node.isPartitioned) {
        const healthyFollowers = Array.from(nodes.values()).filter(
          n => !n.isPartitioned && n.id !== nodeId
        );

        if (healthyFollowers.length > 0) {
          // Trigger election after a short delay to simulate timeout
          setTimeout(() => {
            const randomFollower = healthyFollowers[
              Math.floor(Math.random() * healthyFollowers.length)
            ];
            get().startElection(randomFollower.id);
          }, ELECTION_TIMEOUT_MS);
        }
      }
    }
  },

  // Set replication speed (for visualization)
  setReplicationSpeed: (speed: number): void => {
    set({ replicationSpeed: speed });
  },

  /**
   * Put a key-value pair with visible log replication across the cluster
   * Demonstrates the Raft replication process with visual feedback
   *
   * @param key - The key to store
   * @param value - The value to store
   * @param leaseId - Optional lease ID for TTL
   *
   * Process:
   * 1. Leader appends entry to its log (uncommitted)
   * 2. Leader sends AppendEntries RPCs to all followers
   * 3. Followers append to their logs and acknowledge
   * 4. Once majority acknowledges, leader commits the entry
   * 5. Entry is applied to the key-value store
   */
  putWithReplication: async (key: string, value: string, leaseId?: string): Promise<void> => {
    const leader = Array.from(get().nodes.values()).find(n => n.status === 'leader');
    if (!leader || leader.isPartitioned) return;

    const speed = get().replicationSpeed;
    const now = Date.now();

    // Step 1: Leader adds to its log (uncommitted)
    const logEntry: LogEntry = {
      term: leader.term,
      index: get().logs.length + 1,
      key,
      value,
      timestamp: now,
    };

    const nodes = new Map(get().nodes);
    const leaderNode = nodes.get(leader.id);
    if (leaderNode) {
      leaderNode.log = [...(leaderNode.log || []), logEntry];
      // Leader does NOT commit yet - needs majority first
    }

    get().addLogEntry(logEntry);
    set({ nodes: new Map(nodes) });

    await sleep(speed);

    // Step 2: Replicate to followers
    const followers = Array.from(get().nodes.values()).filter(
      n => n.status === 'follower' && !n.isPartitioned
    );

    // Set followers to replicating state (only actual followers, not partitioned or other states)
    const replicatingNodes = new Map(get().nodes);
    followers.forEach(follower => {
      const node = replicatingNodes.get(follower.id);
      if (node && node.status === 'follower') {
        node.status = 'replicating';
      }
    });
    set({ nodes: new Map(replicatingNodes) });

    await sleep(speed * 0.3);

    let successfulReplications = 0;

    for (const follower of followers) {
      const appendEntries: RaftMessage = {
        id: `append-${Date.now()}-${Math.random()}`,
        type: 'AppendEntries',
        from: leader.id,
        to: follower.id,
        term: leader.term,
        entries: [logEntry],
        leaderCommit: leader.commitIndex, // Current commit, not the new entry yet
        timestamp: Date.now(),
      };

      get().sendMessage(appendEntries);
      await sleep(speed * 0.5);

      // Follower receives and appends
      const updatedNodes = new Map(get().nodes);
      const followerNode = updatedNodes.get(follower.id);
      if (followerNode) {
        followerNode.log = [...(followerNode.log || []), logEntry];
        successfulReplications++;

        const response: RaftMessage = {
          id: `append-resp-${Date.now()}-${Math.random()}`,
          type: 'AppendEntriesResponse',
          from: follower.id,
          to: leader.id,
          term: leader.term,
          success: true,
          matchIndex: logEntry.index,
          timestamp: Date.now(),
        };

        get().sendMessage(response);
        set({ nodes: new Map(updatedNodes) });
      }

      await sleep(speed * 0.5);
    }

    // Step 3: Commit once majority has replicated
    const replicatedCount = successfulReplications + 1; // Including leader
    const totalNodes = Array.from(get().nodes.values()).filter(n => !n.isPartitioned).length;
    const majority = calculateMajority(totalNodes);

    if (replicatedCount >= majority) {
      await sleep(speed * 0.3);

      // Commit on ALL nodes that have the entry (leader + all healthy followers)
      const finalNodes = new Map(get().nodes);

      // Leader commits
      const commitLeader = finalNodes.get(leader.id);
      if (commitLeader) {
        commitLeader.commitIndex = logEntry.index;
      }

      // ALL healthy followers commit (not just ones we sent to)
      // Also revert replicating state back to follower
      Array.from(finalNodes.values())
        .filter(n => (n.status === 'follower' || n.status === 'replicating') && !n.isPartitioned)
        .forEach(followerNode => {
          if (followerNode.log && followerNode.log.length >= logEntry.index) {
            followerNode.commitIndex = logEntry.index;
          }
          // Revert replicating back to follower
          if (followerNode.status === 'replicating') {
            followerNode.status = 'follower';
          }
        });

      set({ nodes: new Map(finalNodes) });

      // Actually apply the change to KV store (DIRECTLY without calling put())
      const keyValues = new Map(get().keyValues);
      const existing = keyValues.get(key);

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
    }

    // Clear append messages
    setTimeout(() => {
      const currentMessages = get().messages.filter(
        m => !m.type.includes('Append')
      );
      set({ messages: currentMessages });
    }, speed);
  },

  // Reset all state
  reset: (): void => {
    set({
      nodes: new Map(),
      currentTerm: DEFAULT_TERM,
      logs: [],
      messages: [],
      partitionedNodes: new Set(),
      replicationSpeed: DEFAULT_REPLICATION_SPEED,
      keyValues: new Map(),
      leases: new Map(),
      watchEvents: [],
      watchers: new Map(),
    });
  },
}));
