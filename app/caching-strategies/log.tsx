import { LogPanelProps } from '@/app/caching-strategies/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useEffect, useRef } from 'react'

export const LogPanel: FC<LogPanelProps> = ({ logs }) => {
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <ScrollArea className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-[650px] sm:h-32 md:h-32">
            <h3 className="font-bold mb-2 text-slate-300">Operation Log</h3>
            <div className="bg-black rounded p-3 h-[95%] font-mono text-xs text-slate-400 space-y-2 overflow-y-auto">
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`flex items-start ${log.status === 'hit' ? 'text-green-400' : log.status === 'miss' ? 'text-red-400' : 'text-slate-400'}`}
                    >
                        <span className="w-16 shrink-0">{log.time}</span>
                        <span className="mr-2 mt-0.5 shrink-0">{log.icon}</span>
                        <span>{log.message}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </ScrollArea>
    )
}
