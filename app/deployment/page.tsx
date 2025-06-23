'use client'

import {
    Activity,
    CheckCircle,
    Pause,
    Play,
    RotateCcw,
    Server,
    Settings,
    Terminal,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const DeploymentStrategiesApp = () => {
    const [activeTab, setActiveTab] = useState('rolling')
    const [isDeploying, setIsDeploying] = useState(false)
    const [deploymentProgress, setDeploymentProgress] = useState(0)
    const [instances, setInstances] = useState([])
    const [traffic, setTraffic] = useState({})
    const [metrics, setMetrics] = useState({ errorRate: 0, responseTime: 200 })
    const [currentVersion, setCurrentVersion] = useState(1)
    const [targetVersion, setTargetVersion] = useState(2)
    const [logs, setLogs] = useState([])
    const [config, setConfig] = useState({
        totalInstances: 6,
        batchSize: 2,
        canaryPercentage: 20,
        buggyVersion: false,
        errorThreshold: 10,
        rollbackEnabled: true,
        deploymentSpeed: 1000,
    })
    const intervalRef = useRef(null)
    const logsEndRef = useRef(null)

    const strategies = [
        { id: 'rolling', name: 'Rolling Update', icon: '🔄' },
        { id: 'bluegreen', name: 'Blue/Green', icon: '🔵🟢' },
        { id: 'canary', name: 'Canary', icon: '🐤' },
        { id: 'ab', name: 'A/B Testing', icon: '🅰️🅱️' },
        { id: 'shadow', name: 'Shadow', icon: '👤' },
        { id: 'ramped', name: 'Ramped Slow', icon: '📈' },
        { id: 'recreate', name: 'Recreate', icon: '♻️' },
    ]

    useEffect(() => {
        initializeInstances()
    }, [config.totalInstances, activeTab])

    useEffect(() => {
        if (isDeploying) {
            intervalRef.current = setInterval(() => {
                updateDeployment()
            }, config.deploymentSpeed)
        } else {
            clearInterval(intervalRef.current)
        }
        return () => clearInterval(intervalRef.current)
    }, [isDeploying, deploymentProgress, activeTab, targetVersion])

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString()
        const logTypes = {
            info: { icon: '📘', color: 'text-blue-600' },
            success: { icon: '✅', color: 'text-green-600' },
            warning: { icon: '⚠️', color: 'text-yellow-600' },
            error: { icon: '❌', color: 'text-red-600' },
            deployment: { icon: '🚀', color: 'text-purple-600' },
        }

        const logConfig = logTypes[type] || logTypes.info

        setLogs((prev) => [
            ...prev,
            {
                id: Date.now(),
                timestamp,
                message,
                type,
                icon: logConfig.icon,
                color: logConfig.color,
            },
        ])
    }

    const initializeInstances = () => {
        const newInstances = Array.from(
            { length: config.totalInstances },
            (_, i) => ({
                id: i,
                version: `v${currentVersion}.0`,
                status: 'healthy',
                traffic: 100 / config.totalInstances,
            })
        )
        setInstances(newInstances)
        setDeploymentProgress(0)
        setMetrics({ errorRate: 0, responseTime: 200 })
        addLog(
            `Initialized ${config.totalInstances} instances with version v${currentVersion}.0`,
            'info'
        )
    }

    const startDeployment = () => {
        setIsDeploying(true)
        setTargetVersion(currentVersion + 1)
        addLog(
            `Starting ${strategies.find((s) => s.id === activeTab).name} deployment from v${currentVersion}.0 to v${currentVersion + 1}.0`,
            'deployment'
        )

        if (config.buggyVersion) {
            addLog('⚠️ Warning: Deploying potentially buggy version', 'warning')
        }

        if (config.rollbackEnabled) {
            addLog(
                `Auto-rollback enabled with error threshold: ${config.errorThreshold}%`,
                'info'
            )
        }
    }

    const updateDeployment = () => {
        if (deploymentProgress >= 100) {
            setIsDeploying(false)
            setCurrentVersion(targetVersion)
            addLog(
                `Deployment completed successfully! All instances now running v${targetVersion}.0`,
                'success'
            )
            return
        }

        const newProgress = Math.min(deploymentProgress + 5, 100)
        setDeploymentProgress(newProgress)

        // Simulate metrics
        if (config.buggyVersion && newProgress > 30) {
            const errorRate = Math.min(25, newProgress / 4)
            setMetrics({
                errorRate,
                responseTime: 200 + errorRate * 10,
            })

            if (errorRate > 5 && errorRate < 6) {
                addLog(
                    `Error rate increasing: ${errorRate.toFixed(1)}%`,
                    'warning'
                )
            }

            // Auto-rollback if threshold exceeded
            if (config.rollbackEnabled && errorRate > config.errorThreshold) {
                performRollback()
                return
            }
        }

        // Update instances based on strategy
        switch (activeTab) {
            case 'rolling':
                updateRollingDeployment(newProgress)
                break
            case 'bluegreen':
                updateBlueGreenDeployment(newProgress)
                break
            case 'canary':
                updateCanaryDeployment(newProgress)
                break
            case 'ab':
                updateABDeployment(newProgress)
                break
            case 'shadow':
                updateShadowDeployment(newProgress)
                break
            case 'ramped':
                updateRampedDeployment(newProgress)
                break
            case 'recreate':
                updateRecreateDeployment(newProgress)
                break
        }
    }

    const updateRollingDeployment = (progress) => {
        const instancesPerBatch = Math.ceil(
            config.totalInstances / config.batchSize
        )
        const currentBatch = Math.floor((progress / 100) * config.batchSize)

        setInstances((prevInstances) => {
            const updated = prevInstances.map((instance, idx) => {
                const batchIndex = Math.floor(idx / instancesPerBatch)
                if (
                    batchIndex <= currentBatch &&
                    instance.version !== `v${targetVersion}.0`
                ) {
                    addLog(
                        `Updating instance ${instance.id + 1} to v${targetVersion}.0 (Batch ${batchIndex + 1})`,
                        'info'
                    )
                    return {
                        ...instance,
                        version: `v${targetVersion}.0`,
                        status:
                            config.buggyVersion && Math.random() < 0.3
                                ? 'unhealthy'
                                : 'healthy',
                    }
                }
                return instance
            })
            return updated
        })
    }

    const updateBlueGreenDeployment = (progress) => {
        if (progress === 5) {
            addLog('Preparing Green environment with new version', 'info')
        }

        if (progress < 50) {
            // Prepare green environment
            setInstances((prevInstances) =>
                prevInstances.map((instance, idx) => ({
                    ...instance,
                    version:
                        idx < config.totalInstances / 2
                            ? `v${currentVersion}.0`
                            : `v${targetVersion}.0`,
                    status: 'healthy',
                    traffic:
                        idx < config.totalInstances / 2
                            ? 100 / (config.totalInstances / 2)
                            : 0,
                }))
            )
        } else if (progress === 50) {
            addLog(
                'Switching traffic from Blue to Green environment',
                'deployment'
            )
            // Switch traffic to green
            setInstances((prevInstances) =>
                prevInstances.map((instance, idx) => ({
                    ...instance,
                    traffic:
                        idx < config.totalInstances / 2
                            ? 0
                            : 100 / (config.totalInstances / 2),
                }))
            )
        }
    }

    const updateCanaryDeployment = (progress) => {
        const canaryInstances = Math.ceil(
            (config.canaryPercentage / 100) * config.totalInstances
        )
        const canaryTraffic = (progress / 100) * config.canaryPercentage

        if (progress === 5) {
            addLog(
                `Deploying canary instances (${config.canaryPercentage}% of fleet)`,
                'info'
            )
        }

        if (progress === 50) {
            addLog(
                `Canary receiving ${canaryTraffic.toFixed(1)}% of traffic`,
                'info'
            )
        }

        setInstances((prevInstances) =>
            prevInstances.map((instance, idx) => {
                if (idx < canaryInstances) {
                    return {
                        ...instance,
                        version: `v${targetVersion}.0`,
                        status:
                            config.buggyVersion && Math.random() < 0.4
                                ? 'unhealthy'
                                : 'healthy',
                        traffic: canaryTraffic / canaryInstances,
                    }
                }
                return {
                    ...instance,
                    traffic:
                        (100 - canaryTraffic) /
                        (config.totalInstances - canaryInstances),
                }
            })
        )
    }

    const updateABDeployment = (progress) => {
        const abSplit = progress / 2 // 50-50 split max

        if (progress === 5) {
            addLog('Starting A/B test deployment', 'info')
        }

        if (progress === 50) {
            addLog(
                `Traffic split: ${(100 - abSplit).toFixed(1)}% to v${currentVersion}.0, ${abSplit.toFixed(1)}% to v${targetVersion}.0`,
                'info'
            )
        }

        setInstances((prevInstances) =>
            prevInstances.map((instance, idx) => {
                if (idx < config.totalInstances / 2) {
                    return {
                        ...instance,
                        version: `v${targetVersion}.0`,
                        status:
                            config.buggyVersion && Math.random() < 0.3
                                ? 'unhealthy'
                                : 'healthy',
                        traffic: abSplit / (config.totalInstances / 2),
                    }
                }
                return {
                    ...instance,
                    traffic: (100 - abSplit) / (config.totalInstances / 2),
                }
            })
        )
    }

    const updateShadowDeployment = (progress) => {
        if (progress === 5) {
            addLog(
                'Deploying shadow instances (receiving mirrored traffic only)',
                'info'
            )
        }

        setInstances((prevInstances) =>
            prevInstances.map((instance, idx) => {
                if (idx < 2) {
                    return {
                        ...instance,
                        version: `v${targetVersion}.0 (shadow)`,
                        status: 'shadow',
                        traffic: 0, // Shadow instances don't receive real traffic
                    }
                }
                return {
                    ...instance,
                    traffic: 100 / (config.totalInstances - 2),
                }
            })
        )
    }

    const updateRampedDeployment = (progress) => {
        const deployedInstances = Math.ceil(
            (progress / 100) * config.totalInstances
        )

        setInstances((prevInstances) => {
            let newDeployments = 0
            const updated = prevInstances.map((instance, idx) => {
                if (
                    idx < deployedInstances &&
                    instance.version !== `v${targetVersion}.0`
                ) {
                    newDeployments++
                    return {
                        ...instance,
                        version: `v${targetVersion}.0`,
                        status:
                            config.buggyVersion && Math.random() < 0.3
                                ? 'unhealthy'
                                : 'healthy',
                        traffic: 100 / config.totalInstances,
                    }
                }
                return instance
            })

            if (newDeployments > 0) {
                addLog(
                    `Ramped deployment: ${deployedInstances}/${config.totalInstances} instances updated`,
                    'info'
                )
            }

            return updated
        })
    }

    const updateRecreateDeployment = (progress) => {
        if (progress === 5) {
            addLog('Terminating all instances...', 'warning')
        }

        if (progress < 50) {
            // Terminate all instances
            setInstances((prevInstances) =>
                prevInstances.map((instance) => ({
                    ...instance,
                    status: 'terminating',
                    traffic: 0,
                }))
            )
        } else {
            if (progress === 50) {
                addLog('Creating new instances with updated version', 'info')
            }
            // Create new instances
            setInstances((prevInstances) =>
                prevInstances.map((instance) => ({
                    ...instance,
                    version: `v${targetVersion}.0`,
                    status:
                        config.buggyVersion && Math.random() < 0.3
                            ? 'unhealthy'
                            : 'healthy',
                    traffic: 100 / config.totalInstances,
                }))
            )
        }
    }

    const performRollback = () => {
        setIsDeploying(false)
        addLog(
            `🚨 ERROR THRESHOLD EXCEEDED! Error rate: ${metrics.errorRate.toFixed(1)}%`,
            'error'
        )
        addLog('Initiating automatic rollback...', 'error')
        setTimeout(() => {
            initializeInstances()
            addLog(
                `Rollback completed. All instances restored to v${currentVersion}.0`,
                'success'
            )
        }, 1000)
    }

    const handleReset = () => {
        setIsDeploying(false)
        initializeInstances()
        addLog('Deployment reset by user', 'info')
    }

    const clearLogs = () => {
        setLogs([])
        addLog('Logs cleared', 'info')
    }

    const getInstanceColor = (instance) => {
        if (instance.status === 'unhealthy') return 'bg-red-500'
        if (instance.status === 'terminating') return 'bg-gray-400'
        if (instance.status === 'shadow') return 'bg-purple-400'
        if (
            instance.version === `v${targetVersion}.0` ||
            instance.version.includes(`v${targetVersion}.0`)
        )
            return 'bg-green-500'
        return 'bg-blue-500'
    }

    const getStrategyDescription = () => {
        const descriptions = {
            rolling:
                'Gradually replaces instances in batches. Zero downtime, but mixed versions during deployment.',
            bluegreen:
                'Maintains two identical environments. Instant switch with easy rollback, but requires double resources.',
            canary: 'Deploys to a small subset first. Tests with real traffic before full rollout.',
            ab: 'Splits traffic between versions for testing. Great for feature validation.',
            shadow: 'Mirrors traffic to new version without affecting users. Risk-free testing.',
            ramped: 'Slowly increases traffic to new version. Gradual rollout with monitoring.',
            recreate:
                'Terminates all instances before creating new ones. Simple but causes downtime.',
        }
        return descriptions[activeTab] || ''
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Deployment Strategies Simulator
                </h1>

                {/* Current Version Display */}
                <div className="mb-4 flex items-center gap-4">
                    <span className="text-lg font-medium">
                        Current Production Version:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                        v{currentVersion}.0
                    </span>
                    {isDeploying && (
                        <>
                            <span className="text-gray-500">→</span>
                            <span className="text-xl font-bold text-green-600">
                                v{targetVersion}.0
                            </span>
                        </>
                    )}
                </div>

                {/* Strategy Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {strategies.map((strategy) => (
                        <button
                            key={strategy.id}
                            onClick={() => setActiveTab(strategy.id)}
                            disabled={isDeploying}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTab === strategy.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${isDeploying ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="mr-2">{strategy.icon}</span>
                            {strategy.name}
                        </button>
                    ))}
                </div>

                {/* Strategy Description */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-gray-700">{getStrategyDescription()}</p>
                </div>

                {/* Control Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configuration
                        </h3>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Total Instances
                                </span>
                                <input
                                    type="number"
                                    min="4"
                                    max="12"
                                    value={config.totalInstances}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            totalInstances: parseInt(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-20 px-2 py-1 border rounded"
                                    disabled={isDeploying}
                                />
                            </label>

                            {activeTab === 'canary' && (
                                <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Canary %
                                    </span>
                                    <input
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={config.canaryPercentage}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                canaryPercentage: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-20 px-2 py-1 border rounded"
                                        disabled={isDeploying}
                                    />
                                </label>
                            )}

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Deploy Buggy Version
                                </span>
                                <input
                                    type="checkbox"
                                    checked={config.buggyVersion}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            buggyVersion: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5"
                                    disabled={isDeploying}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Auto-Rollback
                                </span>
                                <input
                                    type="checkbox"
                                    checked={config.rollbackEnabled}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            rollbackEnabled: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5"
                                    disabled={isDeploying}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Error Threshold %
                                </span>
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    value={config.errorThreshold}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            errorThreshold: parseInt(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-20 px-2 py-1 border rounded"
                                    disabled={isDeploying}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Metrics
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Error Rate
                                </span>
                                <span
                                    className={`font-semibold ${metrics.errorRate > config.errorThreshold ? 'text-red-600' : 'text-green-600'}`}
                                >
                                    {metrics.errorRate.toFixed(1)}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Response Time
                                </span>
                                <span className="font-semibold">
                                    {metrics.responseTime}ms
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Progress
                                </span>
                                <span className="font-semibold">
                                    {deploymentProgress}%
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    isDeploying
                                        ? setIsDeploying(false)
                                        : startDeployment()
                                }
                                disabled={
                                    isDeploying && deploymentProgress === 100
                                }
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeploying ? (
                                    <Pause className="w-4 h-4" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                {isDeploying ? 'Pause' : 'Deploy'}
                            </button>

                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${deploymentProgress}%` }}
                        />
                    </div>
                </div>

                {/* Instance Visualization */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        Instance Status
                    </h3>

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {instances.map((instance) => (
                            <div key={instance.id} className="relative group">
                                <div
                                    className={`${getInstanceColor(instance)} rounded-lg p-4 text-white text-center transition-all duration-300 ${
                                        instance.status === 'unhealthy'
                                            ? 'animate-pulse'
                                            : ''
                                    }`}
                                >
                                    <Server className="w-8 h-8 mx-auto mb-2" />
                                    <div className="text-xs font-medium">
                                        {instance.version}
                                    </div>
                                    <div className="text-xs opacity-75">
                                        Pod {instance.id + 1}
                                    </div>
                                </div>

                                {/* Traffic Indicator */}
                                {instance.traffic > 0 && (
                                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${instance.traffic}%`,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Status Icon */}
                                <div className="absolute -top-2 -right-2">
                                    {instance.status === 'healthy' && (
                                        <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                                    )}
                                    {instance.status === 'unhealthy' && (
                                        <XCircle className="w-5 h-5 text-red-500 bg-white rounded-full" />
                                    )}
                                    {instance.status === 'shadow' && (
                                        <Users className="w-5 h-5 text-purple-500 bg-white rounded-full" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>v{currentVersion}.0 (Current)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>v{targetVersion}.0 (New)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>Unhealthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-400 rounded"></div>
                        <span>Shadow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded"></div>
                        <span>Terminating</span>
                    </div>
                </div>

                {/* Deployment Logs */}
                <div className="mt-6 bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            Deployment Logs
                        </h3>
                        <button
                            onClick={clearLogs}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Clear logs"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-black rounded p-3 h-48 overflow-y-auto font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="text-gray-500">
                                No logs yet. Start a deployment to see
                                activity...
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeploymentStrategiesApp
