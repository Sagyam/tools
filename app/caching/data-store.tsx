import { DataStoreProps } from '@/app/caching/types'
import { FC, useEffect, useState } from 'react'

export const DataStore: FC<DataStoreProps> = ({
    title,
    data,
    icon,
    highlightKey,
    type,
    cacheTimers,
    showTimers = false,
}) => {
    const [currentTime, setCurrentTime] = useState(Date.now())

    // Update current time every second when showing timers
    useEffect(() => {
        if (!showTimers) return

        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)

        return () => clearInterval(interval)
    }, [showTimers])

    const getTimeStatus = (key: string) => {
        if (!cacheTimers || !cacheTimers[key]) return null

        const ageInSeconds = Math.floor((currentTime - cacheTimers[key]) / 1000)
        const refreshThreshold = 5 // 5 seconds

        if (ageInSeconds >= refreshThreshold) {
            return { age: ageInSeconds, status: 'stale', color: 'text-red-400' }
        } else if (ageInSeconds >= refreshThreshold - 2) {
            return {
                age: ageInSeconds,
                status: 'aging',
                color: 'text-yellow-400',
            }
        } else {
            return {
                age: ageInSeconds,
                status: 'fresh',
                color: 'text-green-400',
            }
        }
    }

    return (
        <div className="bg-primary border border-primary-foreground rounded-lg p-4 flex-1">
            <div className="flex items-center mb-3">
                {icon}
                <h3 className="font-bold ml-2 text-lg">{title}</h3>
                {showTimers && (
                    <span className="ml-auto text-xs text-slate-400">
                        Live Cache Age
                    </span>
                )}
            </div>
            <div className="bg-primary rounded p-3 min-h-[100px] font-mono text-sm text-secondary space-y-1 overflow-y-auto max-h-[150px]">
                {Object.keys(data).length === 0 ? (
                    <span className="text-slate-500 italic">empty</span>
                ) : (
                    Object.entries(data).map(([key, value]) => {
                        const timeStatus = showTimers
                            ? getTimeStatus(key)
                            : null

                        return (
                            <div
                                key={key}
                                className={`p-1 rounded transition-colors duration-1000 ${
                                    highlightKey === key
                                        ? type === 'hit'
                                            ? 'bg-green-300 text-green-600'
                                            : 'bg-red-300 text-red-600'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-blue-500">
                                            {key}:
                                        </span>{' '}
                                        "{value}"
                                    </div>
                                    {timeStatus && (
                                        <div
                                            className={`text-xs ${timeStatus.color} ml-2 flex flex-col items-end`}
                                        >
                                            <span className="text-[10px]">
                                                {timeStatus.status ===
                                                    'fresh' && '🟢'}
                                                {timeStatus.status ===
                                                    'aging' && '🟡'}
                                                {timeStatus.status ===
                                                    'stale' && '🔴'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            {showTimers && (
                <div className="mt-2 text-xs text-slate-500">
                    <div>
                        🟢 Fresh (0-2s) • 🟡 Aging (3-4s) • 🔴 Stale (5s+)
                    </div>
                    <div className="mt-1">Refresh triggers at 5s age</div>
                </div>
            )}
        </div>
    )
}
