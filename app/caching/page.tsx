'use client'

import { DataStore } from '@/app/caching/data-store'
import { LogPanel } from '@/app/caching/log'
import { STRATEGIES } from '@/app/caching/strategies'
import {
    DataObject,
    HighlightState,
    LogEntry,
    LogStatus,
    StrategyKey,
} from '@/app/caching/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    AppWindow,
    CheckCircle,
    Database,
    Info,
    Layers,
    XCircle,
} from 'lucide-react'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'

// Simulate API latency
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

// The Main App Component
const CachingStrategies: FC = () => {
    const [strategy, setStrategy] = useState<StrategyKey>('cache-aside')
    const [cache, setCache] = useState<DataObject>({
        user1: 'Alice',
        item5: 'Laptop',
    })
    const [db, setDb] = useState<DataObject>({
        user1: 'Alice',
        user2: 'Bob',
        item5: 'Laptop',
        item10: 'Mouse',
    })
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [key, setKey] = useState<string>('user2')
    const [value, setValue] = useState<string>('Bob')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [highlight, setHighlight] = useState<HighlightState>({
        key: null,
        type: null,
    })

    const writeBackQueue = useRef<Map<string, string>>(new Map())

    const addLog = (message: string, status: LogStatus = 'info') => {
        const iconMap = {
            hit: <CheckCircle className="w-4 h-4 text-green-500" />,
            miss: <XCircle className="w-4 h-4 text-red-500" />,
            info: <Info className="w-4 h-4 text-sky-500" />,
        }
        const time = new Date().toLocaleTimeString('en-US', { hour12: false })
        setLogs((prev) => [
            ...prev,
            { time, message, status, icon: iconMap[status] },
        ])
    }

    const handleRead = useCallback(async () => {
        setIsLoading(true)
        addLog(`--- Initiating READ for key: "${key}" ---`)

        const clearHighlight = () =>
            setTimeout(() => setHighlight({ key: null, type: null }), 1500)

        switch (strategy) {
            case 'cache-aside':
                addLog('App: Checking cache...')
                await sleep(500)
                if (cache[key] !== undefined) {
                    addLog(
                        `Cache HIT for key: "${key}". Returning data from cache.`,
                        'hit'
                    )
                    setHighlight({ key, type: 'hit' })
                } else {
                    addLog(`Cache MISS for key: "${key}".`, 'miss')
                    setHighlight({ key, type: 'miss' })
                    await sleep(500)
                    addLog('App: Reading from database...')
                    await sleep(1000)
                    const dbValue = db[key]
                    if (dbValue !== undefined) {
                        addLog(
                            `App: Found data in DB. Updating cache with key: "${key}".`
                        )
                        setCache((c) => ({ ...c, [key]: dbValue }))
                    } else {
                        addLog(`App: Key "${key}" not found in DB.`)
                    }
                }
                break

            case 'read-through':
                addLog(`App: Querying cache for key: "${key}"`)
                await sleep(500)
                if (cache[key] !== undefined) {
                    addLog(
                        `Cache HIT for key: "${key}". Cache returns data.`,
                        'hit'
                    )
                    setHighlight({ key, type: 'hit' })
                } else {
                    addLog(
                        `Cache MISS for key: "${key}". Cache library now takes over.`,
                        'miss'
                    )
                    setHighlight({ key, type: 'miss' })
                    await sleep(500)
                    addLog('Cache: Fetching from database...')
                    await sleep(1000)
                    const dbValue = db[key]
                    if (dbValue !== undefined) {
                        addLog(
                            `Cache: Found data in DB. Populating cache & returning to app.`
                        )
                        setCache((c) => ({ ...c, [key]: dbValue }))
                    } else {
                        addLog(`Cache: Key "${key}" not found in DB.`)
                    }
                }
                break

            case 'write-through':
            case 'write-back':
            case 'write-around':
                // For these strategies, read is like cache-aside
                addLog(
                    'App: Checking cache (using Cache-Aside pattern for read)...'
                )
                await sleep(500)
                if (cache[key] !== undefined) {
                    addLog(`Cache HIT for key: "${key}".`, 'hit')
                    setHighlight({ key, type: 'hit' })
                } else {
                    addLog(`Cache MISS for key: "${key}".`, 'miss')
                    setHighlight({ key, type: 'miss' })
                    await sleep(500)
                    addLog('App: Reading from database...')
                    await sleep(1000)
                    const dbValue = db[key]
                    if (dbValue !== undefined) {
                        addLog(`App: Found data. Updating cache.`)
                        setCache((c) => ({ ...c, [key]: dbValue }))
                    } else {
                        addLog(`App: Key "${key}" not found in DB.`)
                    }
                }
                break
        }
        addLog(`--- READ operation for key: "${key}" complete ---`)
        clearHighlight()
        setIsLoading(false)
    }, [key, cache, db, strategy])

    const handleWrite = useCallback(async () => {
        setIsLoading(true)
        addLog(
            `--- Initiating WRITE for key: "${key}" with value: "${value}" ---`
        )

        switch (strategy) {
            case 'cache-aside':
                addLog('App: Writing directly to database...')
                await sleep(1000)
                setDb((d) => ({ ...d, [key]: value }))
                addLog('App: Write to DB complete.')
                await sleep(500)
                addLog(`App: Invalidating cache for key: "${key}".`)
                setCache((c) => {
                    const newCache = { ...c }
                    delete newCache[key]
                    return newCache
                })
                break

            case 'write-through':
            case 'read-through': // Using write-through for this demo
                addLog('App: Writing to cache...')
                await sleep(500)
                setCache((c) => ({ ...c, [key]: value }))
                addLog(
                    'Cache: Acknowledged. Writing to database simultaneously...'
                )
                await sleep(1000)
                setDb((d) => ({ ...d, [key]: value }))
                addLog('DB: Acknowledged. Write operation complete.')
                break

            case 'write-back':
                addLog('App: Writing to cache...')
                await sleep(500)
                setCache((c) => ({ ...c, [key]: value }))
                addLog('Cache: Acknowledged. App can proceed. Write is fast!')
                addLog(
                    `Cache: Queuing write for key: "${key}" to be written to DB later.`
                )
                writeBackQueue.current.set(key, value)
                // Simulate async write
                setTimeout(() => {
                    if (writeBackQueue.current.has(key)) {
                        const bufferedValue = writeBackQueue.current.get(key)
                        addLog(
                            `(Async) Cache: Writing buffered data for key "${key}" to database...`
                        )
                        setDb((d) => ({ ...d, [key]: bufferedValue! }))
                        writeBackQueue.current.delete(key)
                        setTimeout(
                            () =>
                                addLog(
                                    `(Async) DB: Write complete for key "${key}".`
                                ),
                            500
                        )
                    }
                }, 3000)
                break

            case 'write-around':
                addLog('App: Writing directly to database (bypassing cache)...')
                await sleep(1000)
                setDb((d) => ({ ...d, [key]: value }))
                addLog(
                    'DB: Acknowledged. Write operation complete. Cache is unaffected.'
                )
                break
        }

        addLog(`--- WRITE operation for key: "${key}" complete ---`)
        setIsLoading(false)
    }, [key, value, strategy])

    const resetSimulation = useCallback(() => {
        setCache({ user1: 'Alice', item5: 'Laptop' })
        setDb({
            user1: 'Alice',
            user2: 'Bob',
            item5: 'Laptop',
            item10: 'Mouse',
        })
        setLogs([])
        setKey('user2')
        setValue('Bob')
        setIsLoading(false)
        writeBackQueue.current.clear()
        addLog('Simulation reset to initial state.')
    }, [])

    useEffect(() => {
        resetSimulation()
    }, [strategy, resetSimulation])

    useEffect(() => {
        // check if url has a query parameter for strategy
        const urlParams = new URLSearchParams(window.location.search)
        const urlStrategy: StrategyKey =
            (urlParams.get('strategy') as StrategyKey) || 'cache-aside'
        setStrategy(urlStrategy)
    }, [])

    return (
        <div className="bg-primary container mx-auto p-4 space-y-4">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl text-primary font-bold tracking-tight">
                        Interactive Caching Strategies
                    </h1>
                    <p className="mt-2 text-lg text-secondary">
                        Visualize how different caching patterns work in
                        real-time.
                    </p>
                </header>

                <div className="bg-primary flex justify-center mb-8">
                    <div className="flex flex-wrap gap-2 rounded-lg p-1 border-primary border-2 ">
                        {(Object.keys(STRATEGIES) as StrategyKey[]).map((s) => (
                            <Button
                                key={s}
                                onClick={() => setStrategy(s)}
                                className={`px-4 py-2 flex-1 text-sm rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900
                                ${
                                    strategy === s
                                        ? 'text-white bg-sky-600 shadow-md'
                                        : 'hover:bg-slate-700/50'
                                }`}
                            >
                                {STRATEGIES[s].name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="bg-primary border border-primary rounded-xl p-6">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-semibold text-sky-400">
                            {STRATEGIES[strategy].name}
                        </h2>
                        <p className="mt-1 max-w-3xl mx-auto text-secondary-foreground">
                            {STRATEGIES[strategy].description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Left Side: Controls & Visualization */}
                        <div className="space-y-6">
                            <div className="bg-primary border border-primary-foreground rounded-lg p-4">
                                <h3 className="font-bold mb-3">Controls</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="key-input"
                                            className="text-sm font-medium "
                                        >
                                            Key
                                        </Label>
                                        <Input
                                            id="key-input"
                                            type="text"
                                            value={key}
                                            onChange={(e) =>
                                                setKey(e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="w-full border rounded-md px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="value-input"
                                            className="text-sm font-medium"
                                        >
                                            Value (for Write)
                                        </Label>
                                        <Input
                                            id="value-input"
                                            type="text"
                                            value={value}
                                            onChange={(e) =>
                                                setValue(e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="w-full border rounded-md px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleRead}
                                        disabled={isLoading || !key}
                                        className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        {isLoading ? 'Running...' : 'Read Data'}
                                    </Button>
                                    <Button
                                        onClick={handleWrite}
                                        disabled={isLoading || !key || !value}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        {isLoading
                                            ? 'Running...'
                                            : 'Write Data'}
                                    </Button>
                                    <Button
                                        onClick={resetSimulation}
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <DataStore
                                title="Application"
                                icon={<AppWindow className="w-6 h-6" />}
                                data={{ 'Current Op': `key: "${key}"` }}
                            />
                            <div className="flex flex-col sm:flex-row gap-6">
                                <DataStore
                                    title="Cache"
                                    data={cache}
                                    icon={
                                        <Layers className="w-6 h-6 text-sky-400" />
                                    }
                                    highlightKey={highlight.key}
                                    type={highlight.type}
                                />
                                <DataStore
                                    title="Database"
                                    data={db}
                                    icon={
                                        <Database className="w-6 h-6 text-amber-400" />
                                    }
                                />
                            </div>
                        </div>

                        {/* Right Side: Logs */}

                        <LogPanel logs={logs} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CachingStrategies
