'use client'

import React from 'react'
import { useEtcdStore } from '../../store/etcdStore'

export const ClusterStatusBar: React.FC = () => {
    const { currentTerm, nodes, logs, messages } = useEtcdStore()

    const leaderNode = Array.from(nodes.values()).find(
        (n) => n.status === 'leader'
    )

    return (
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{currentTerm}</span>
                </div>

                <div className="hidden sm:block h-4 w-px bg-border" />

                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Leader:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                        {leaderNode?.id || 'None'}
                    </span>
                </div>

                <div className="hidden sm:block h-4 w-px bg-border" />

                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Commits:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{logs.length}</span>
                </div>

                {messages.length > 0 && (
                    <>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Active Messages:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                                {messages.length}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
