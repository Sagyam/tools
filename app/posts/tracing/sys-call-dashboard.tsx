'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, X } from 'lucide-react'
import React, { useState } from 'react'
import { BarDetails } from './bar-details'
import { ProgramData, SortOrder } from './types'

const getSyscallColor = (percentage: number): string => {
    if (percentage >= 50) {
        return 'bg-red-400'
    } else if (percentage >= 20) {
        return 'bg-yellow-400'
    } else {
        return 'bg-green-400'
    }
}

export const SyscallDashboard: React.FC = () => {
    const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(
        null
    )
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [languageFilter, setLanguageFilter] = useState('all')

    const programData: ProgramData[] = [
        {
            name: 'c_gcc',
            language: 'C (GCC)',
            totalTime: 516,
            syscalls: [
                {
                    syscall: 'execve',
                    percentage: 45.74,
                    calls: 1,
                    time: 362,
                    errors: 0,
                },
                {
                    syscall: 'mmap',
                    percentage: 17.44,
                    calls: 8,
                    time: 91,
                    errors: 0,
                },
                {
                    syscall: 'read',
                    percentage: 12,
                    calls: 2,
                    time: 30,
                    errors: 0,
                },
                {
                    syscall: 'other',
                    percentage: 24.82,
                    calls: 2,
                    time: 28,
                    errors: 0,
                },
            ],
        },
        {
            name: 'rust',
            language: 'Rust',
            totalTime: 600,
            syscalls: [
                {
                    syscall: 'clone',
                    percentage: 70.16,
                    calls: 1,
                    time: 362,
                    errors: 0,
                },
                {
                    syscall: 'read',
                    percentage: 17.64,
                    calls: 8,
                    time: 91,
                    errors: 0,
                },
            ],
        },
    ]

    const languages = Array.from(
        new Set(programData.map((prog) => prog.language))
    )
    const maxTime = Math.max(...programData.map((p) => p.totalTime))

    const sortedAndFilteredData = programData
        .filter(
            (prog) =>
                languageFilter === 'all' || prog.language === languageFilter
        )
        .sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1
            return (a.totalTime - b.totalTime) * order
        })

    // Generate time scale markers
    const timeScaleMarkers = []
    const scaleSteps = 5
    for (let i = 0; i <= scaleSteps; i++) {
        timeScaleMarkers.push(Math.round((maxTime / scaleSteps) * i))
    }

    return (
        <div className="space-y-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Hello World Syscall Comparison</CardTitle>
                        <div className="flex space-x-4">
                            <Select
                                value={languageFilter}
                                onValueChange={setLanguageFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Languages
                                    </SelectItem>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setSortOrder((prev) =>
                                        prev === 'asc' ? 'desc' : 'asc'
                                    )
                                }
                            >
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Sort by Time
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="space-y-2">
                        {sortedAndFilteredData.map((program) => (
                            <div
                                key={program.name}
                                className="relative h-12 flex items-center group cursor-pointer hover:bg-gray-50 rounded-lg"
                                onClick={() => setSelectedProgram(program)}
                            >
                                {/* Language label */}
                                <div className="w-24 text-sm font-medium pr-2">
                                    {program.language}
                                </div>

                                {/* Proportional bar lengths */}
                                <div className="relative flex-1 h-full">
                                    {program.syscalls.map((syscall, index) => (
                                        <div
                                            key={index}
                                            className={`absolute inset-y-0 left-0 rounded-l-lg ${getSyscallColor(syscall.percentage)}`}
                                            style={{
                                                width: `${(syscall.time / program.totalTime) * 100}%`,
                                                height: '100%',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>

                {/* Timescale at the bottom */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500">
                        {timeScaleMarkers.map((marker, index) => (
                            <div key={index} className="flex-1 text-center">
                                {marker}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {selectedProgram && (
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 z-10"
                        onClick={() => setSelectedProgram(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <BarDetails
                        programName={selectedProgram.name}
                        totalExecutionTime={selectedProgram.totalTime}
                        data={selectedProgram.syscalls}
                    />
                </div>
            )}
        </div>
    )
}

export default SyscallDashboard
