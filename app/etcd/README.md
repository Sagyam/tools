# Interactive etcd Educational App

A comprehensive educational platform for learning about etcd, the distributed key-value store that powers Kubernetes and cloud-native systems.

## Features

### 1. Cluster & Raft Visualization (`/etcd/cluster`)
- Interactive visualization of etcd cluster nodes
- Real-time display of leader, followers, and candidates
- Leader election simulation (click any node to trigger failover)
- Animated log replication from leader to followers
- Heartbeat monitoring
- Current term and commit index tracking

### 2. Key-Value Namespace Tree (`/etcd/tree`)
- Hierarchical tree visualization of key-value pairs
- Add, update, and delete keys with instant visual updates
- Tree layout computed using D3 hierarchy algorithms
- Path-based key organization (e.g., `/config/app/name`)
- Sample data loader for quick exploration

### 3. Watch API Interactive Demo (`/etcd/watch`)
- Real-time key watching and event notifications
- PUT and DELETE event tracking
- Live event stream with timestamps
- Interactive controls to trigger watch events
- Previous value tracking

### 4. TTL & Lease Management (`/etcd/ttl`)
- Create keys with time-to-live (TTL)
- Visual countdown animations
- Automatic key expiration
- Lease revocation
- Multiple keys per lease support
- Expiration warnings and animations

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Flow** - Interactive diagrams
- **Zustand** - State management
- **D3 (d3-hierarchy, d3-force)** - Layout algorithms

## Project Structure

```
app/etcd/
├── components/
│   ├── cluster/
│   │   ├── ClusterNode.tsx          # Individual cluster node component
│   │   └── ClusterVisualization.tsx # Main cluster visualization
│   ├── tree/
│   │   └── TreeVisualization.tsx    # Key-value tree diagram
│   ├── watch/
│   │   └── WatchDemo.tsx            # Watch API demo
│   └── ttl/
│       └── LeaseCountdown.tsx       # TTL/Lease management
├── store/
│   └── etcdStore.ts                 # Zustand state management
├── types/
│   └── index.ts                     # TypeScript type definitions
├── utils/
│   └── treeUtils.ts                 # Tree layout utilities
├── cluster/
│   └── page.tsx                     # Cluster page route
├── tree/
│   └── page.tsx                     # Tree page route
├── watch/
│   └── page.tsx                     # Watch page route
├── ttl/
│   └── page.tsx                     # TTL page route
├── page.tsx                         # Main landing page
├── todo.md                          # Original requirements
└── README.md                        # This file
```

## Usage

### Starting the App

Navigate to `/etcd` in your browser to see the main landing page with all modules.

### Cluster & Raft Visualization
1. Choose cluster size (3, 5, or 7 nodes)
2. Click any node to trigger leader election
3. Click "Add Key" to simulate log replication
4. Watch animated arrows showing replication flow

### Key-Value Tree
1. Enter a key path (e.g., `/config/db/host`)
2. Enter a value (e.g., `localhost`)
3. Click "Add Key" to create the entry
4. Use "Load Sample Data" for quick exploration
5. Click trash icon to delete keys

### Watch API
1. Enter a key to watch (e.g., `/config/app/status`)
2. Click "Start Watching"
3. Update the key value to see PUT events
4. Delete the key to see DELETE events
5. All events appear in real-time with previous values

### TTL & Lease
1. Enter a key, value, and TTL in seconds
2. Click "Create" to create a key with lease
3. Watch the countdown progress bar
4. Keys automatically expire and disappear
5. Manually revoke leases to delete keys immediately

## State Management

The app uses Zustand for centralized state management. The store (`etcdStore.ts`) handles:

- **Cluster State**: Nodes, terms, logs, leader election
- **Key-Value Store**: CRUD operations on keys
- **Leases**: TTL management and automatic expiration
- **Watch API**: Event notifications and subscriptions

All modules share the same state, so actions in one module (e.g., adding a key in the tree view) are reflected in other modules (e.g., watch events, TTL tracking).

## Key Concepts Demonstrated

### Raft Consensus
- Leader election with term tracking
- Log replication from leader to followers
- Heartbeat mechanism
- Failure detection and recovery

### Distributed Key-Value Store
- Hierarchical namespace organization
- Atomic operations
- Versioning and revision tracking
- Watch subscriptions

### Lease & TTL
- Time-based key expiration
- Lease-based resource management
- Automatic cleanup
- Grace periods

## Customization

### Adding New Modules
1. Create component in `components/<module-name>/`
2. Add page route in `<module-name>/page.tsx`
3. Update main landing page to include new module
4. Extend etcdStore if new state management needed

### Modifying Visualizations
- React Flow nodes and edges are fully customizable
- Layout algorithms can be swapped (D3 has many options)
- Colors, animations, and styles use Tailwind classes

## Performance Notes

- D3 is only used for layout calculations, not DOM manipulation
- React Flow handles all rendering for optimal performance
- Zustand provides efficient re-renders via selectors
- Animations use CSS transitions for GPU acceleration

## Educational Value

This app is designed to help developers understand:

1. How distributed consensus works (Raft algorithm)
2. The structure and organization of etcd's key-value store
3. Real-time data synchronization patterns
4. TTL-based resource management
5. Event-driven architectures with watch APIs

Each module includes interactive elements and visual feedback to reinforce learning through hands-on exploration.
