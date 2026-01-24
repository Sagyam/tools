# etcd Learning Flow

## Recommended Learning Path

### 1. Cluster & Raft (Start Here)
**Concept**: Distributed consensus and leader election

**Steps**:
1. Observe the initial cluster - one leader (blue), multiple followers (gray)
2. Click any follower node → triggers leader election, watch term number increase
3. Click "Add Key" → see leader replicate data to followers via animated arrows
4. Try different cluster sizes → understand fault tolerance tradeoffs

**Key Learnings**:
- Only the leader handles writes
- Raft uses terms to prevent conflicts
- Log replication ensures consistency
- Larger clusters = more fault tolerance, slower consensus

---

### 2. Key-Value Tree
**Concept**: Hierarchical data organization

**Steps**:
1. Click "Load Sample Data" → see hierarchical structure
2. Add key like `/config/db/host` → path notation creates nested structure
3. Observe colors → blue = actual values, gray = path segments
4. Delete keys → watch tree update in real-time

**Key Learnings**:
- Keys use path notation with `/`
- Automatically creates nested structure
- Efficient namespace organization
- Similar to file system paths

---

### 3. Watch API
**Concept**: Reactive data monitoring

**Steps**:
1. Click "Start Watching" on a key → subscribe to changes
2. Update the key → PUT event fires with new value
3. Delete the key → DELETE event shows previous value
4. Try watching different keys → each watch is independent

**Key Learnings**:
- Watch API enables reactive applications
- Events fire instantly on changes
- Useful for configuration updates, service discovery
- Each key can have multiple watchers

---

### 4. TTL & Leases
**Concept**: Automatic key expiration

**Steps**:
1. Create key with short TTL (10 seconds) → lease created
2. Watch progress bar countdown → visual time remaining
3. Wait for expiration or click "Revoke" → key auto-deleted
4. Create multiple keys → can share one lease

**Key Learnings**:
- Leases provide time-to-live (TTL) for keys
- Useful for sessions, distributed locks, cache
- Multiple keys can share one lease
- Automatic cleanup prevents stale data

---

## Interactive Features

### Help Tooltips
- Hover over info icons for quick explanations
- Located next to key controls and inputs
- Concise, context-specific help

### Learning Guides
- Each tab has collapsible step-by-step guide
- Click to expand/collapse
- Follow numbered steps for best experience

### Visual Hints
- In-canvas notes explain interactions
- Color-coded elements show different states
- Progress bars and animations for feedback

---

## Real-World Use Cases

**Cluster & Raft**: Understand how Kubernetes, etcd clusters maintain consistency

**Key-Value Tree**: Learn configuration management patterns used in production

**Watch API**: See how service mesh control planes react to changes

**TTL & Leases**: Understand distributed locking and session management

---

## Tips for Best Learning

1. **Go in order** - each tab builds on previous concepts
2. **Experiment freely** - all changes are local, nothing breaks
3. **Read the hints** - learning guides show recommended actions
4. **Try edge cases** - what happens with many nodes? Long TTLs?
5. **Connect to real-world** - think about where you'd use each feature
