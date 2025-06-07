'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    ArrowRight,
    Globe,
    Monitor,
    Network,
    Server,
    Shield,
} from 'lucide-react'
import React, { useState } from 'react'

type DnsRecord = {
    type: 'A' | 'CNAME'
    name: string
    value: string
    ttl: number
}

type ServerType = {
    name: string
    type: string
    icon: JSX.Element
}

type Packet = {
    from: string
    to: string
    type: 'query' | 'response'
    queryPacket: Record<string, string>
    responsePacket?: Record<string, string>
}

const initialRecords: DnsRecord[] = [
    { type: 'A', name: 'example.com', value: '192.168.1.1', ttl: 3600 },
    { type: 'CNAME', name: 'www.example.com', value: 'example.com', ttl: 1800 },
]

const servers: ServerType[] = [
    { name: 'Client', type: 'client', icon: <Monitor /> },
    { name: 'Local DNS', type: 'resolver', icon: <Network /> },
    { name: 'Root Server', type: 'root', icon: <Globe /> },
    { name: 'TLD Server', type: 'tld', icon: <Server /> },
    { name: 'Authoritative Server', type: 'authoritative', icon: <Shield /> },
]

export default function DnsSimulator() {
    const [records, setRecords] = useState<DnsRecord[]>(initialRecords)
    const [query, setQuery] = useState<string>('')
    const [queryResult, setQueryResult] = useState<string | null>(null)
    const [isRecursive, setIsRecursive] = useState<boolean>(true)
    const [currentStep, setCurrentStep] = useState<number>(-1)
    const [queryPath, setQueryPath] = useState<Packet[]>([])

    const handleAddRecord = (record: DnsRecord) => {
        setRecords([...records, record])
    }

    const handleDeleteRecord = (name: string) => {
        setRecords(records.filter((r) => r.name !== name))
    }

    const handleQuery = () => {
        setQueryResult(null)
        setQueryPath([])
        setCurrentStep(0)
        animateQuery()
    }

    const animateQuery = () => {
        let path: Packet[] = []
        let step = 0
        const interval = setInterval(() => {
            const from = isRecursive
                ? servers[step - 1]?.name || 'Client'
                : step === 0
                  ? 'Client'
                  : step <= servers.length - 2
                    ? 'Client'
                    : servers[step - 1].name
            const to = servers[step].name

            const queryPacket = {
                type: 'Query',
                name: query,
            }

            const found = records.find((r) => r.name === query)

            const responsePacket =
                step === servers.length - 1 && found
                    ? {
                          type: 'Response',
                          name: query,
                          value: found.value,
                          ttl: found.ttl.toString(),
                      }
                    : undefined

            const type: 'query' | 'response' =
                step < servers.length - 1 ? 'query' : 'response'

            path.push({ from, to, type, queryPacket, responsePacket })
            setQueryPath([...path])
            setCurrentStep(step)

            if (step === servers.length - 1) {
                clearInterval(interval)
                setQueryResult(
                    found ? `${found.value} (TTL: ${found.ttl})` : 'Not found'
                )
            }
            step++
        }, 1000)
    }

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">DNS Server Simulator</h1>

            <Tabs defaultValue="query">
                <TabsList className="mb-4">
                    <TabsTrigger value="query">Query DNS</TabsTrigger>
                    <TabsTrigger value="records">Manage Records</TabsTrigger>
                </TabsList>

                <TabsContent value="query">
                    <div className="flex items-center gap-2 mb-4">
                        <Input
                            placeholder="Enter domain (e.g., example.com)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button onClick={handleQuery}>Query</Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsRecursive(!isRecursive)}
                        >
                            Mode: {isRecursive ? 'Recursive' : 'Iterative'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-5 gap-4 mb-4">
                        {servers.map((server, index) => (
                            <motion.div
                                key={server.name}
                                className={`p-4 rounded-2xl text-center shadow-md flex flex-col items-center gap-2 transition-colors duration-300 ${
                                    index === currentStep
                                        ? 'bg-blue-200'
                                        : 'bg-gray-100'
                                }`}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.2,
                                }}
                            >
                                <div className="text-2xl">{server.icon}</div>
                                <div>{server.name}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[100px]">
                        <h3 className="font-semibold mb-2">Packet Flow:</h3>
                        {queryPath.length === 0 ? (
                            <p className="text-gray-500 italic">
                                No query in progress
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {queryPath.map((step, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex flex-col gap-2 p-2 border rounded-xl bg-white shadow"
                                    >
                                        <div className="flex items-center gap-2">
                                            {step.type === 'query' ? (
                                                <ArrowRight className="text-blue-500" />
                                            ) : (
                                                <ArrowLeft className="text-green-500" />
                                            )}
                                            <span className="text-sm font-mono">
                                                {step.type.toUpperCase()} from{' '}
                                                <strong>{step.from}</strong> to{' '}
                                                <strong>{step.to}</strong>
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                                            <div>
                                                <strong>Query Packet:</strong>{' '}
                                                {JSON.stringify(
                                                    step.queryPacket
                                                )}
                                            </div>
                                            {step.responsePacket && (
                                                <div>
                                                    <strong>
                                                        Response Packet:
                                                    </strong>{' '}
                                                    {JSON.stringify(
                                                        step.responsePacket
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {queryResult && (
                        <Card className="mt-4">
                            <CardContent className="p-4">
                                <div className="text-lg font-semibold">
                                    Final Response
                                </div>
                                <div className="font-mono text-sm mt-2">
                                    {queryResult}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="records">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">
                            DNS Records
                        </h2>
                        {records.map((record, idx) => (
                            <Card key={idx} className="mb-2">
                                <CardContent className="p-2 flex justify-between items-center">
                                    <div>
                                        <div>
                                            <strong>Type:</strong> {record.type}
                                        </div>
                                        <div>
                                            <strong>Name:</strong> {record.name}
                                        </div>
                                        <div>
                                            <strong>Value:</strong>{' '}
                                            {record.value}
                                        </div>
                                        <div>
                                            <strong>TTL:</strong> {record.ttl}s
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            handleDeleteRecord(record.name)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Add Record</h3>
                        <AddRecordForm onAdd={handleAddRecord} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function AddRecordForm({ onAdd }: { onAdd: (r: DnsRecord) => void }) {
    const [type, setType] = useState<DnsRecord['type']>('A')
    const [name, setName] = useState<string>('')
    const [value, setValue] = useState<string>('')
    const [ttl, setTTL] = useState<number | string>(3600)

    const handleSubmit = () => {
        if (!name || !value || isNaN(Number(ttl))) return
        onAdd({ type, name, value, ttl: parseInt(ttl as string) })
        setName('')
        setValue('')
        setTTL(3600)
    }

    return (
        <div className="flex gap-2 items-center flex-wrap">
            <Input
                placeholder="Type (A/CNAME)"
                value={type}
                onChange={(e) => setType(e.target.value as DnsRecord['type'])}
            />
            <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                placeholder="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <Input
                placeholder="TTL (in seconds)"
                value={ttl}
                onChange={(e) => setTTL(e.target.value)}
                type="number"
            />
            <Button onClick={handleSubmit}>Add</Button>
        </div>
    )
}
