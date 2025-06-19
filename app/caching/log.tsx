'use client'

import { LogPanelProps } from '@/app/caching/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useEffect, useRef } from 'react'

export const LogPanel: FC<LogPanelProps> = ({ logs }) => {
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (logs.length < 2) return

        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <ScrollArea className="bg-primary border border-primary rounded-lg p-4 h-[400px]">
            <h3 className="font-bold mb-2">Operation Log</h3>
            <div className="bg-black rounded p-3 h-[95%] font-mono text-xs space-y-2 overflow-y-auto">
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`flex items-start ${log.status === 'hit' ? 'text-green-400' : log.status === 'miss' ? 'text-red-400' : 'text-slate-400'}`}
                    >
                        <span className="w-16 shrink-0">{log.time}</span>
                        <span className="mr-2 shrink-0">{log.icon}</span>
                        <span ref={logEndRef}>{log.message}</span>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
