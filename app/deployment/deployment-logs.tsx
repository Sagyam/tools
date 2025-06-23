import { Log } from '@/app/deployment/deployment-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Terminal, Trash2 } from 'lucide-react'
import React, { useEffect, useRef } from 'react'

export interface DeploymentLogsProps {
    logs: Log[]
    clearLogs: () => void
}

const DeploymentLogs = ({ logs, clearLogs }: DeploymentLogsProps) => {
    const logsEndRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (logs.length < 2) return

        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <Card className="bg-primary my-4 p-8">
            <CardTitle className="font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    <Terminal />
                    Deployment Logs
                </span>
                <Button
                    variant="secondary"
                    size="icon"
                    className="size-8"
                    onClick={clearLogs}
                    title="Clear logs"
                >
                    <Trash2 size={16} />
                </Button>
            </CardTitle>

            <CardContent className="bg-black rounded p-3 h-48 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                    <div className="text-gray-500">
                        No logs yet. Start a deployment to see activity...
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="mb-1">
                            <span className="text-gray-400">
                                [{log.timestamp}]
                            </span>
                            <span className={`ml-2 ${log.color}`}>
                                {log.icon} {log.message}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </CardContent>
        </Card>
    )
}

export default DeploymentLogs
