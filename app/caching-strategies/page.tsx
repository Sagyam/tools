'use client'

import {
    AppWindow,
    CheckCircle,
    Database,
    Info,
    Layers,
    XCircle,
} from 'lucide-react'
import React, {
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

// --- Type Definitions ---
type DataObject = { [key: string]: string }

type StrategyKey =
    | 'cache-aside'
    | 'read-through'
    | 'write-through'
    | 'write-back'
    | 'write-around'

type LogStatus = 'info' | 'hit' | 'miss'

type LogEntry = {
    time: string
    message: string
    status: LogStatus
    icon: ReactNode
}

type HighlightState = {
    key: string | null
    type: 'hit' | 'miss' | null
}

type StrategyInfo = {
    name: string
    description: string
}

// --- Helper Functions & Data ---

// Simulate API latency
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

// --- Strategy Definitions ---
const STRATEGIES: Record<StrategyKey, StrategyInfo> = {
    'cache-aside': {
        name: 'Cache-Aside (Lazy Loading)',
        description:
            "The application is responsible for managing the cache. It looks for an entry in the cache. If it's a miss, the application reads the data from the database and adds the data to the cache.",
    },
    'read-through': {
        name: 'Read-Through',
        description:
            'The application treats the cache as the main data source. The cache library itself handles fetching data from the database on a cache miss. The application logic is simplified.',
    },
    'write-through': {
        name: 'Write-Through',
        description:
            'Data is written to the cache and the database simultaneously. This provides strong data consistency but at the cost of higher write latency, as the operation only completes when both writes succeed.',
    },
    'write-back': {
        name: 'Write-Back (Write-Behind)',
        description:
            'The application writes data to the cache, which acknowledges the write immediately. The cache then asynchronously writes the data to the database after a delay. This is very fast for writes but risks data loss if the cache fails.',
    },
    'write-around': {
        name: 'Write-Around',
        description:
            'Data is written directly to the database, bypassing the cache entirely. Only data that is read is then added to the cache. This is useful for workloads with few re-reads of recently written data (e.g., logging).',
    },
}

// --- Main Components ---

interface DataStoreProps {
    title: string
    data: DataObject
    icon: ReactNode
    highlightKey?: string | null
    type?: 'hit' | 'miss' | null
}

const DataStore: FC<DataStoreProps> = ({
    title,
    data,
    icon,
    highlightKey,
    type,
}) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex-1">
        <div className="flex items-center mb-3 text-slate-300">
            {icon}
            <h3 className="font-bold ml-2 text-lg">{title}</h3>
        </div>
        <div className="bg-slate-900 rounded p-3 min-h-[100px] font-mono text-sm text-slate-400 space-y-1 overflow-y-auto max-h-[150px]">
            {Object.keys(data).length === 0 ? (
                <span className="text-slate-500 italic">empty</span>
            ) : (
                Object.entries(data).map(([key, value]) => (
                    <div
                        key={key}
                        className={`p-1 rounded transition-colors duration-300 ${highlightKey === key ? (type === 'hit' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300') : ''}`}
                    >
                        <span className="text-blue-400">{key}:</span> "{value}"
                    </div>
                ))
            )}
        </div>
    </div>
)

interface LogPanelProps {
    logs: LogEntry[]
}

const LogPanel: FC<LogPanelProps> = ({ logs }) => {
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <div className="bg-black/50 border border-slate-800 rounded-lg p-4 h-full">
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
        </div>
    )
}

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

    return (
        <div className="bg-slate-950 text-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-100">
                        Interactive Caching Strategies
                    </h1>
                    <p className="mt-2 text-lg text-slate-400">
                        Visualize how different caching patterns work in
                        real-time.
                    </p>
                </header>

                <div className="flex justify-center mb-8">
                    <div className="flex flex-wrap gap-2 rounded-lg bg-slate-800 p-1">
                        {(Object.keys(STRATEGIES) as StrategyKey[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStrategy(s)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                                    strategy === s
                                        ? 'bg-sky-600 text-white shadow-md'
                                        : 'text-slate-300 hover:bg-slate-700/50'
                                }`}
                            >
                                {STRATEGIES[s].name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-slate-950/50 p-6">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-semibold text-sky-400">
                            {STRATEGIES[strategy].name}
                        </h2>
                        <p className="mt-1 max-w-3xl mx-auto text-slate-400">
                            {STRATEGIES[strategy].description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Left Side: Controls & Visualization */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <h3 className="font-bold mb-3 text-slate-300">
                                    Controls
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="key-input"
                                            className="text-sm font-medium text-slate-400"
                                        >
                                            Key
                                        </label>
                                        <input
                                            id="key-input"
                                            type="text"
                                            value={key}
                                            onChange={(e) =>
                                                setKey(e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="value-input"
                                            className="text-sm font-medium text-slate-400"
                                        >
                                            Value (for Write)
                                        </label>
                                        <input
                                            id="value-input"
                                            type="text"
                                            value={value}
                                            onChange={(e) =>
                                                setValue(e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        onClick={handleRead}
                                        disabled={isLoading || !key}
                                        className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        {isLoading ? 'Running...' : 'Read Data'}
                                    </button>
                                    <button
                                        onClick={handleWrite}
                                        disabled={isLoading || !key || !value}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        {isLoading
                                            ? 'Running...'
                                            : 'Write Data'}
                                    </button>
                                    <button
                                        onClick={resetSimulation}
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                                    >
                                        Reset
                                    </button>
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
                        <div className="min-h-[600px]">
                            <LogPanel logs={logs} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CachingStrategies
