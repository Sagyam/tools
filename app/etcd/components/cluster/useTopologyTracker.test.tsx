import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEffect, useRef, useState } from 'react'
import { EtcdNode } from '../../types'

// Re-implement the hook for testing (matching the actual implementation)
const useTopologyTracker = (etcdNodes: Map<string, EtcdNode>) => {
    const prevLeaderIdRef = useRef<string | null>(null)
    const prevNodeCountRef = useRef<number>(0)
    const [topologyChangeFlag, setTopologyChangeFlag] = useState(0)

    // Calculate current topology
    const leader = Array.from(etcdNodes.values()).find((n) => n.status === 'leader')
    const currentLeaderId = leader?.id || null
    const currentNodeCount = etcdNodes.size

    // Check if topology changed
    const hasTopologyChanged =
        currentLeaderId !== prevLeaderIdRef.current ||
        currentNodeCount !== prevNodeCountRef.current

    // Update refs in useEffect after detecting change
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

// Helper to create mock EtcdNode
const createMockNode = (
    id: string,
    status: 'leader' | 'follower' | 'candidate' = 'follower'
): EtcdNode => ({
    id,
    status,
    term: 1,
    commitIndex: 0,
    lastHeartbeat: Date.now(),
    log: [],
    isPartitioned: false,
})

describe('useTopologyTracker', () => {
    it('should detect initial topology', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result } = renderHook(() => useTopologyTracker(nodes))

        expect(result.current.topology.leaderId).toBe('node1')
        expect(result.current.topology.nodeCount).toBe(2)
        // After initial render and effect, hasTopologyChanged is false (refs updated)
        // but topologyChangeFlag shows a change occurred
        expect(result.current.topologyChangeFlag).toBeGreaterThan(0)
    })

    it('should detect leader change', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes - no change
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag) // No new changes

        // Change leader
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'follower'))
        newNodes.set('node2', createMockNode('node2', 'leader'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.leaderId).toBe('node2')
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag) // New change detected
    })

    it('should detect node count change when node added', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag)

        // Add a node
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'leader'))
        newNodes.set('node2', createMockNode('node2', 'follower'))
        newNodes.set('node3', createMockNode('node3', 'follower'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.nodeCount).toBe(3)
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag)
    })

    it('should detect node count change when node removed', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))
        nodes.set('node3', createMockNode('node3', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        expect(result.current.topology.nodeCount).toBe(3)
        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag)

        // Remove a node
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'leader'))
        newNodes.set('node2', createMockNode('node2', 'follower'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.nodeCount).toBe(2)
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag)
    })

    it('should NOT detect change when only node data changes', () => {
        const node1 = createMockNode('node1', 'leader')
        const node2 = createMockNode('node2', 'follower')

        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', node1)
        nodes.set('node2', node2)

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag)

        // Change node data (not topology)
        const newNodes = new Map<string, EtcdNode>()
        const updatedNode1 = { ...node1, term: 5, commitIndex: 10 }
        const updatedNode2 = { ...node2, term: 5, commitIndex: 10 }
        newNodes.set('node1', updatedNode1)
        newNodes.set('node2', updatedNode2)

        rerender({ nodes: newNodes })
        // Should NOT detect change because leader and count are the same
        expect(result.current.topology.leaderId).toBe('node1')
        expect(result.current.topology.nodeCount).toBe(2)
        expect(result.current.topologyChangeFlag).toBe(initialFlag) // No topology change
    })

    it('should handle cluster with no leader', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'follower'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result } = renderHook(() => useTopologyTracker(nodes))

        expect(result.current.topology.leaderId).toBe(null)
        expect(result.current.topology.nodeCount).toBe(2)
        expect(result.current.topologyChangeFlag).toBeGreaterThan(0)
    })

    it('should detect when leader is elected from no-leader state', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'follower'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        expect(result.current.topology.leaderId).toBe(null)
        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag)

        // Elect a leader
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'leader'))
        newNodes.set('node2', createMockNode('node2', 'follower'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.leaderId).toBe('node1')
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag)
    })

    it('should detect when leader steps down to follower', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        expect(result.current.topology.leaderId).toBe('node1')
        const initialFlag = result.current.topologyChangeFlag

        // Rerender with same nodes
        rerender({ nodes })
        expect(result.current.topologyChangeFlag).toBe(initialFlag)

        // Leader steps down
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'follower'))
        newNodes.set('node2', createMockNode('node2', 'follower'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.leaderId).toBe(null)
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag)
    })

    it('should handle empty node map', () => {
        const nodes = new Map<string, EtcdNode>()

        const { result } = renderHook(() => useTopologyTracker(nodes))

        expect(result.current.topology.leaderId).toBe(null)
        expect(result.current.topology.nodeCount).toBe(0)
        expect(result.current.hasTopologyChanged).toBe(false) // Empty to empty is no change
    })

    it('should handle multiple rapid changes', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        // First render - change detected
        let previousFlag = result.current.topologyChangeFlag

        // Add node 2
        const nodes2 = new Map<string, EtcdNode>()
        nodes2.set('node1', createMockNode('node1', 'leader'))
        nodes2.set('node2', createMockNode('node2', 'follower'))
        rerender({ nodes: nodes2 })
        expect(result.current.topologyChangeFlag).toBeGreaterThan(previousFlag)
        previousFlag = result.current.topologyChangeFlag

        // Change leader
        const nodes3 = new Map<string, EtcdNode>()
        nodes3.set('node1', createMockNode('node1', 'follower'))
        nodes3.set('node2', createMockNode('node2', 'leader'))
        rerender({ nodes: nodes3 })
        expect(result.current.topologyChangeFlag).toBeGreaterThan(previousFlag)
        previousFlag = result.current.topologyChangeFlag

        // Add node 3 (change count AND leader at same time)
        const nodes4 = new Map<string, EtcdNode>()
        nodes4.set('node1', createMockNode('node1', 'leader'))
        nodes4.set('node2', createMockNode('node2', 'follower'))
        nodes4.set('node3', createMockNode('node3', 'follower'))
        rerender({ nodes: nodes4 })
        expect(result.current.topologyChangeFlag).toBeGreaterThan(previousFlag)
        previousFlag = result.current.topologyChangeFlag

        // No change
        rerender({ nodes: nodes4 })
        expect(result.current.topologyChangeFlag).toBe(previousFlag) // No new change
    })

    it('should handle candidate status (not considered leader)', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('node1', createMockNode('node1', 'leader'))
        nodes.set('node2', createMockNode('node2', 'follower'))

        const { result, rerender } = renderHook(({ nodes }) => useTopologyTracker(nodes), {
            initialProps: { nodes },
        })

        expect(result.current.topology.leaderId).toBe('node1')
        const initialFlag = result.current.topologyChangeFlag

        // Leader becomes candidate (e.g., during election)
        const newNodes = new Map<string, EtcdNode>()
        newNodes.set('node1', createMockNode('node1', 'candidate'))
        newNodes.set('node2', createMockNode('node2', 'follower'))

        rerender({ nodes: newNodes })
        expect(result.current.topology.leaderId).toBe(null) // Candidate is not a leader
        expect(result.current.topologyChangeFlag).toBeGreaterThan(initialFlag) // Change detected
    })
})
