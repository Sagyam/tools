'use client'

import {
    Config,
    Instance,
    Log,
    Metrics,
    Strategy,
    StrategyInfo,
} from '@/app/deployment/deployment-types'
import {
    Activity,
    CheckCircle,
    Pause,
    Play,
    Server,
    Settings,
    Terminal,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

// Switch component
const Switch: React.FC<{
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
}> = ({ checked, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? 'bg-blue-600' : 'bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    )
}

const DeploymentStrategiesApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Strategy>('rolling')
    const [isDeploying, setIsDeploying] = useState<boolean>(false)
    const [deploymentProgress, setDeploymentProgress] = useState<number>(0)
    const [instances, setInstances] = useState<Instance[]>([])
    const [metrics, setMetrics] = useState<Metrics>({
        errorRate: 0,
        responseTime: 200,
    })
    const [currentVersion, setCurrentVersion] = useState<number>(1)
    const [targetVersion, setTargetVersion] = useState<number>(2)
    const [logs, setLogs] = useState<Log[]>([])
    const [config, setConfig] = useState<Config>({
        totalInstances: 6,
        batchSize: 2,
        canaryPercentage: 20,
        buggyVersion: false,
        errorThreshold: 10,
        rollbackEnabled: true,
        autoPromote: false,
        deploymentSpeed: 1000,
        manualTrafficSplit: undefined,
    })
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const logsEndRef = useRef<HTMLDivElement | null>(null)
    const promoteCheckRef = useRef<boolean>(false)

    const strategies: StrategyInfo[] = [
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
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [
        isDeploying,
        deploymentProgress,
        activeTab,
        targetVersion,
        config.autoPromote,
    ])

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const addLog = (message: string, type: Log['type'] = 'info'): void => {
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
                id: Date.now() + Math.random(),
                timestamp,
                message,
                type,
                icon: logConfig.icon,
                color: logConfig.color,
            },
        ])
    }

    const initializeInstances = (): void => {
        const newInstances: Instance[] = Array.from(
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
        promoteCheckRef.current = false
        addLog(
            `Initialized ${config.totalInstances} instances with version v${currentVersion}.0`,
            'info'
        )
    }

    const startDeployment = (): void => {
        setIsDeploying(true)
        setTargetVersion(currentVersion + 1)
        promoteCheckRef.current = false
        addLog(
            `Starting ${strategies.find((s) => s.id === activeTab)?.name} deployment from v${currentVersion}.0 to v${currentVersion + 1}.0`,
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

        if (config.autoPromote) {
            addLog(
                `Auto-promote enabled when error rate < ${config.errorThreshold}%`,
                'info'
            )
        }
    }

    const updateDeployment = (): void => {
        if (deploymentProgress >= 100) {
            if (
                config.autoPromote &&
                metrics.errorRate < config.errorThreshold &&
                !promoteCheckRef.current
            ) {
                promoteCheckRef.current = true
                addLog(
                    `✅ Error rate (${metrics.errorRate.toFixed(1)}%) below threshold. Auto-promoting deployment!`,
                    'success'
                )
                completeDeployment()
            } else if (!config.autoPromote) {
                completeDeployment()
            }
            return
        }

        const newProgress = Math.min(deploymentProgress + 5, 100)
        setDeploymentProgress(newProgress)

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

            if (config.rollbackEnabled && errorRate > config.errorThreshold) {
                performRollback()
                return
            }
        } else {
            const errorRate = Math.max(0, 2 - newProgress / 50)
            setMetrics({
                errorRate,
                responseTime: 200,
            })
        }

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

    const completeDeployment = (): void => {
        setIsDeploying(false)
        setCurrentVersion(targetVersion)
        addLog(
            `Deployment completed successfully! All instances now running v${targetVersion}.0`,
            'success'
        )
    }

    const updateRollingDeployment = (progress: number): void => {
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

    const updateBlueGreenDeployment = (progress: number): void => {
        if (progress === 5) {
            addLog('Preparing Green environment with new version', 'info')
        }

        if (progress < 50) {
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

    const updateCanaryDeployment = (progress: number): void => {
        const canaryInstances = Math.ceil(
            (config.canaryPercentage / 100) * config.totalInstances
        )
        const canaryTraffic =
            config.manualTrafficSplit !== undefined
                ? Math.min(config.manualTrafficSplit, config.canaryPercentage)
                : (progress / 100) * config.canaryPercentage

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

    const updateABDeployment = (progress: number): void => {
        const abSplit =
            config.manualTrafficSplit !== undefined
                ? config.manualTrafficSplit
                : progress / 2

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

    const updateShadowDeployment = (progress: number): void => {
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
                        traffic: 0,
                    }
                }
                return {
                    ...instance,
                    traffic: 100 / (config.totalInstances - 2),
                }
            })
        )
    }

    const updateRampedDeployment = (progress: number): void => {
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

    const updateRecreateDeployment = (progress: number): void => {
        if (progress === 5) {
            addLog('Terminating all instances...', 'warning')
        }

        if (progress < 50) {
            setInstances((prevInstances) =>
                prevInstances.map((instance) => ({
                    ...instance,
                    status: 'terminating' as const,
                    traffic: 0,
                }))
            )
        } else {
            if (progress === 50) {
                addLog('Creating new instances with updated version', 'info')
            }
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

    const performRollback = (): void => {
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

    const clearLogs = (): void => {
        setLogs([])
    }

    const getInstanceColor = (instance: Instance): string => {
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

    const getStrategyDescription = (): string => {
        const descriptions: Record<Strategy, string> = {
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
                                            totalInstances:
                                                parseInt(e.target.value) || 6,
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
                                                canaryPercentage:
                                                    parseInt(e.target.value) ||
                                                    20,
                                            })
                                        }
                                        className="w-20 px-2 py-1 border rounded"
                                        disabled={isDeploying}
                                    />
                                </label>
                            )}

                            {(activeTab === 'canary' || activeTab === 'ab') && (
                                <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Manual Traffic Split %
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.manualTrafficSplit ?? ''}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                manualTrafficSplit: e.target
                                                    .value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                        placeholder="Auto"
                                        className="w-20 px-2 py-1 border rounded"
                                        disabled={isDeploying}
                                    />
                                </label>
                            )}

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Deploy Buggy Version
                                </span>
                                <Switch
                                    checked={config.buggyVersion}
                                    onChange={(checked) =>
                                        setConfig({
                                            ...config,
                                            buggyVersion: checked,
                                        })
                                    }
                                    disabled={isDeploying}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Auto-Rollback
                                </span>
                                <Switch
                                    checked={config.rollbackEnabled}
                                    onChange={(checked) =>
                                        setConfig({
                                            ...config,
                                            rollbackEnabled: checked,
                                        })
                                    }
                                    disabled={isDeploying}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Auto-Promote
                                </span>
                                <Switch
                                    checked={config.autoPromote}
                                    onChange={(checked) =>
                                        setConfig({
                                            ...config,
                                            autoPromote: checked,
                                        })
                                    }
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
                                            errorThreshold:
                                                parseInt(e.target.value) || 10,
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

                        <div className="pt-4">
                            <button
                                onClick={() =>
                                    isDeploying
                                        ? setIsDeploying(false)
                                        : startDeployment()
                                }
                                disabled={
                                    isDeploying && deploymentProgress === 100
                                }
                                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                                {isDeploying ? (
                                    <Pause className="w-5 h-5" />
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                                {isDeploying
                                    ? 'Pause Deployment'
                                    : 'Start Deployment'}
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
                        Infrastructure View
                    </h3>

                    <div className="flex flex-col items-center">
                        {/* User Traffic */}
                        <div className="text-center mb-4">
                            <div className="flex justify-center gap-2 mb-2">
                                <Users className="w-6 h-6 text-gray-600" />
                                <Users className="w-6 h-6 text-gray-600" />
                                <Users className="w-6 h-6 text-gray-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                                User Traffic
                            </span>
                        </div>

                        {/* Arrow down */}
                        <div className="w-1 h-8 bg-gray-400 relative">
                            <div className="absolute -bottom-2 -left-2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-8 border-t-gray-400"></div>
                        </div>

                        {/* Load Balancer */}
                        <div className="bg-blue-600 rounded-lg p-4 mb-8 shadow-lg relative">
                            <div className="flex gap-3 items-center">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-75"></div>
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-150"></div>
                            </div>
                            <div className="text-white text-sm font-medium mt-2">
                                Load Balancer
                            </div>
                        </div>

                        {/* Traffic Distribution */}
                        <div className="w-full flex justify-center gap-8 mb-4">
                            {(() => {
                                const versionGroups = instances.reduce<
                                    Record<
                                        string,
                                        {
                                            instances: Instance[]
                                            totalTraffic: number
                                        }
                                    >
                                >((acc, instance) => {
                                    const version =
                                        instance.version.split(' ')[0]
                                    if (!acc[version]) {
                                        acc[version] = {
                                            instances: [],
                                            totalTraffic: 0,
                                        }
                                    }
                                    acc[version].instances.push(instance)
                                    acc[version].totalTraffic +=
                                        instance.traffic || 0
                                    return acc
                                }, {})

                                return Object.entries(versionGroups).map(
                                    ([version, data]) => (
                                        <div
                                            key={version}
                                            className="flex flex-col items-center flex-1 max-w-xs"
                                        >
                                            {/* Traffic Arrow with Percentage */}
                                            <div className="relative mb-4">
                                                <div className="w-1 h-12 bg-gray-400 mx-auto">
                                                    <div className="absolute -bottom-2 -left-2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-8 border-t-gray-400"></div>
                                                </div>
                                                <div className="absolute top-1/2 -translate-y-1/2 -right-12 bg-white px-2 py-1 rounded shadow-md">
                                                    <span className="font-bold text-sm">
                                                        {data.totalTraffic.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Server Group */}
                                            <div className="w-full">
                                                <div className="text-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {version}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {data.instances.map(
                                                        (instance) => (
                                                            <div
                                                                key={
                                                                    instance.id
                                                                }
                                                                className="relative"
                                                            >
                                                                <div
                                                                    className={`${getInstanceColor(instance)} rounded p-2 text-white text-center transition-all duration-300 ${
                                                                        instance.status ===
                                                                        'unhealthy'
                                                                            ? 'animate-pulse'
                                                                            : ''
                                                                    } ${instance.status === 'terminating' ? 'opacity-50' : ''}`}
                                                                >
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="w-6 h-4 bg-white bg-opacity-20 rounded-sm mb-1"></div>
                                                                        <div className="w-6 h-4 bg-white bg-opacity-20 rounded-sm mb-1"></div>
                                                                        <div className="text-xs opacity-90">
                                                                            {instance.id +
                                                                                1}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Status Icon */}
                                                                <div className="absolute -top-1 -right-1">
                                                                    {instance.status ===
                                                                        'healthy' && (
                                                                        <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                                                                    )}
                                                                    {instance.status ===
                                                                        'unhealthy' && (
                                                                        <XCircle className="w-4 h-4 text-red-500 bg-white rounded-full" />
                                                                    )}
                                                                    {instance.status ===
                                                                        'shadow' && (
                                                                        <Users className="w-4 h-4 text-purple-500 bg-white rounded-full" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )
                            })()}
                        </div>
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
