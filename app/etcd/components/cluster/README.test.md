# ClusterVisualization Tests

This directory contains comprehensive tests for the ClusterVisualization component and its helper functions.

## Running Tests

```bash
# Run tests in watch mode
bun test

# Run tests once
bun test:run

# Run tests with UI
bun test:ui
```

## Test Coverage

### 1. Helper Functions Tests (`ClusterVisualization.test.tsx`)

#### `calculateNodePositions`
- ✅ Places leader in the center (400, 300)
- ✅ Places followers in a circle around leader at radius 220
- ✅ Handles cluster with no leader (all nodes in circle)
- ✅ Handles single follower correctly
- ✅ Maintains consistent circular positioning for multiple followers
- ✅ Ensures followers are evenly spaced around the circle

#### `updateNodeData`
- ✅ Updates node data without changing positions
- ✅ Preserves nodes that are not in etcdNodes map
- ✅ Correctly attaches event handlers (onFailover, onTogglePartition)

#### `createReplicationEdges`
- ✅ Creates edges from leader to all followers
- ✅ Returns empty array when there is no leader
- ✅ Returns empty array when leader has no followers
- ✅ Does not create edges to candidates

### 2. Hook Tests (`useTopologyTracker.test.tsx`)

#### `useTopologyTracker`
- ✅ Detects initial topology
- ✅ Detects leader change
- ✅ Detects node count change when node added
- ✅ Detects node count change when node removed
- ✅ Does NOT detect change when only node data changes (term, commitIndex, etc.)
- ✅ Handles cluster with no leader
- ✅ Detects when leader is elected from no-leader state
- ✅ Detects when leader steps down to follower
- ✅ Handles empty node map
- ✅ Handles multiple rapid changes
- ✅ Treats candidate status as non-leader

## What the Tests Catch

### Critical Bugs Prevented:
1. **Position Reset Bug**: Tests ensure that node positions are only recalculated when topology changes, not on every state update
2. **Leader Detection**: Tests verify that leader changes are correctly detected
3. **Node Count Changes**: Tests ensure adding/removing nodes triggers topology change
4. **Data-Only Updates**: Tests verify that updating node data (term, commitIndex) without topology change doesn't reset positions

### Edge Cases Covered:
- Empty cluster
- Cluster with no leader
- Single node cluster
- Leader stepping down
- Candidate nodes (not considered leader)
- Rapid successive changes
- Node removal and addition

## How to Use These Tests During Development

1. **Before making changes**: Run `bun test` to ensure current implementation passes
2. **While making changes**: Keep tests running in watch mode to get immediate feedback
3. **After making changes**: Ensure all tests still pass
4. **When adding features**: Add corresponding tests to cover new functionality

## Test Structure

Tests use:
- **Vitest** as the test runner
- **@testing-library/react** for React component testing
- **@testing-library/react-hooks** for testing custom hooks

Mock data is created using the `createMockNode` helper function to ensure consistency.

## Common Test Patterns

### Testing Helper Functions
```typescript
const nodes = new Map<string, EtcdNode>()
nodes.set('node1', createMockNode('node1', 'leader'))
const result = calculateNodePositions(nodes)
expect(result[0].position).toEqual({ x: 400, y: 300 })
```

### Testing the Hook
```typescript
const { result, rerender } = renderHook(
  ({ nodes }) => useTopologyTracker(nodes),
  { initialProps: { nodes } }
)
expect(result.current.hasTopologyChanged).toBe(true)
```

## Future Test Additions

Consider adding tests for:
- Integration tests with ReactFlow
- Tests for message visualization
- Tests for heartbeat mechanism
- Tests for partition/restore functionality
- Performance tests for large clusters (100+ nodes)
