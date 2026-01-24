'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useEtcdStore } from '../../store/etcdStore'
import { RefreshCcw } from 'lucide-react'

interface ClusterControlsProps {
    onAddKey: () => void
    isReplicating: boolean
}

export const ClusterControls: React.FC<ClusterControlsProps> = ({
    onAddKey,
    isReplicating,
}) => {
    const { initializeCluster, nodes } = useEtcdStore()
    const currentSize = nodes.size
    const majority = Math.floor(currentSize / 2) + 1

    return (
        <div className="space-y-4">
            {/* Cluster Configuration Section */}
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                    CLUSTER CONFIGURATION
                </h3>
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                        Cluster Size:
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {[3, 5, 7, 9, 11, 13, 15].map((count) => (
                            <Button
                                key={count}
                                onClick={() => initializeCluster(count)}
                                variant={
                                    count === currentSize
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                className={
                                    count === currentSize
                                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                                        : ''
                                }
                            >
                                {count}
                                {count === currentSize && ' ✓'}
                            </Button>
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Odd numbers ensure quorum. Current: {currentSize} nodes,
                        Majority: {majority}
                    </div>
                </div>
            </div>

            {/* Interactive Demonstrations Section */}
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                    INTERACTIVE DEMONSTRATIONS
                </h3>
                <div className="space-y-3">
                    {/* Replication Demo Card */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg hover:border-sky-500 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-foreground">
                                    <RefreshCcw size={16} />
                                </span>
                                <span className="font-medium text-sm text-foreground">
                                    Replicate Key
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Watch log replication in action - nodes turn
                                purple during 2-phase commit
                            </p>
                        </div>
                        <Button
                            onClick={onAddKey}
                            className="bg-sky-600 hover:bg-sky-500 text-white shrink-0 w-full sm:w-auto"
                            disabled={isReplicating}
                            size="sm"
                        >
                            {isReplicating ? 'Replicating...' : 'Try It'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
