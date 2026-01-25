# ClusterVisualization Bug Fixes

## Bugs Fixed

### 1. **Node count changes not updating visualization**
**Problem**: When nodes were added or removed from the cluster, the visualization did not update to show the new nodes or remove old ones.

**Root Cause**: The `useTopologyTracker` hook was updating refs during the render phase, which caused timing issues. When the topology changed, the refs were updated immediately, causing subsequent renders to think no change occurred.

**Solution**: Moved ref updates to a `useEffect` hook that runs after the render. Added a `topologyChangeFlag` state that increments when topology changes, providing a reliable way to track changes across renders.

### 2. **New leader not centered when elected**
**Problem**: When a new leader was elected, it was not repositioned to the center of the visualization.

**Root Cause**: Same as bug #1 - the topology change detection was not working correctly due to ref timing issues.

**Solution**: Same fix as bug #1 - proper topology change detection now triggers position recalculation.

## Code Changes

### `useTopologyTracker` Hook (ClusterVisualization.tsx:114-145)

**Before**:
```typescript
const useTopologyTracker = (etcdNodes: Map<string, EtcdNodeType>) => {
    const prevLeaderIdRef = useRef<string | null>(null)
    const prevNodeCountRef = useRef<number>(0)

    const topology = useMemo(() => {
        const leader = Array.from(etcdNodes.values()).find((n) => n.status === 'leader')
        return {
            leaderId: leader?.id || null,
            nodeCount: etcdNodes.size,
        }
    }, [etcdNodes])

    const hasTopologyChanged =
        topology.leaderId !== prevLeaderIdRef.current ||
        topology.nodeCount !== prevNodeCountRef.current

    // Update refs after checking (DURING RENDER - BAD!)
    if (hasTopologyChanged) {
        prevLeaderIdRef.current = topology.leaderId
        prevNodeCountRef.current = topology.nodeCount
    }

    return { topology, hasTopologyChanged }
}
```

**After**:
```typescript
const useTopologyTracker = (etcdNodes: Map<string, EtcdNodeType>) => {
    const prevLeaderIdRef = useRef<string | null>(null)
    const prevNodeCountRef = useRef<number>(0)
    const [topologyChangeFlag, setTopologyChangeFlag] = React.useState(0)

    // Calculate current topology (no useMemo, etcdNodes is always a new Map)
    const leader = Array.from(etcdNodes.values()).find((n) => n.status === 'leader')
    const currentLeaderId = leader?.id || null
    const currentNodeCount = etcdNodes.size

    // Check if topology changed
    const hasTopologyChanged =
        currentLeaderId !== prevLeaderIdRef.current ||
        currentNodeCount !== prevNodeCountRef.current

    // Update refs in useEffect AFTER detecting change
    useEffect(() => {
        if (hasTopologyChanged) {
            prevLeaderIdRef.current = currentLeaderId
            prevNodeCountRef.current = currentNodeCount
            // Increment flag to force dependent effects to re-run
            setTopologyChangeFlag((prev) => prev + 1)
        }
    }, [currentLeaderId, currentNodeCount, hasTopologyChanged])

    return {
        topology: { leaderId: currentLeaderId, nodeCount: currentNodeCount },
        hasTopologyChanged,
        topologyChangeFlag,
    }
}
```

### Key Improvements:

1. **Removed `useMemo`**: Since `etcdNodes` is a new Map object on every Zustand state update, `useMemo` was recalculating every time anyway. Direct calculation is clearer.

2. **Moved ref updates to `useEffect`**: Refs are now updated AFTER the render completes, ensuring proper timing and preventing race conditions.

3. **Added `topologyChangeFlag`**: A numeric state that increments when topology changes. This provides a reliable dependency for effects that need to respond to topology changes.

4. **Proper effect dependencies**: Effects that depend on topology changes now use `topologyChangeFlag` in their dependency arrays, ensuring they run exactly when needed.

## Test Updates

Updated all tests to work with the new async behavior:
- Tests now check `topologyChangeFlag` instead of `hasTopologyChanged` after the initial render
- Tests verify that the flag increments when topology changes
- Tests verify that the flag stays constant when only node data changes (not topology)

## Behavior After Fixes

### When Node Count Changes:
1. New nodes added/removed from Zustand store
2. Component re-renders with new `etcdNodes` Map
3. `useTopologyTracker` detects node count change
4. `useEffect` runs, updates refs, increments `topologyChangeFlag`
5. Node position effect runs due to `topologyChangeFlag` change
6. Nodes are repositioned with new layout
7. FitView effect runs to center the new layout

### When Leader Changes:
1. Leader status changes in Zustand store
2. Component re-renders with updated `etcdNodes` Map
3. `useTopologyTracker` detects leader ID change
4. `useEffect` runs, updates refs, increments `topologyChangeFlag`
5. Node position effect runs, places new leader in center
6. FitView effect runs to center the visualization

### When Only Data Changes (heartbeat, term, commitIndex):
1. Node data updated in Zustand store
2. Component re-renders with new `etcdNodes` Map
3. `useTopologyTracker` detects NO topology change (same leader, same count)
4. No `useEffect` runs, refs stay the same, `topologyChangeFlag` unchanged
5. Node position effect still runs (due to `etcdNodes` dependency)
6. Effect sees no topology change, only updates node data
7. **Node positions preserved** - this is the desired behavior!

## Files Changed

- `app/etcd/components/cluster/ClusterVisualization.tsx` - Fixed `useTopologyTracker` hook and updated effect dependencies
- `app/etcd/components/cluster/useTopologyTracker.test.tsx` - Updated tests to match new async behavior
- `app/etcd/components/cluster/ClusterVisualization.test.tsx` - Helper function tests (no changes needed)
- `app/etcd/components/cluster/BUGFIXES.md` - This document
- `app/etcd/components/cluster/README.test.md` - Test documentation

## Testing

All 24 tests passing:
- 13 tests for helper functions (calculateNodePositions, updateNodeData, createReplicationEdges)
- 11 tests for useTopologyTracker hook

Run tests with:
```bash
bun test:run
```

## Next Steps

Test the fixes manually:
1. Load the etcd visualization page
2. Try adding nodes - they should appear
3. Try removing nodes - they should disappear
4. Trigger an election - new leader should move to center
5. Watch heartbeats - nodes should NOT jump around
