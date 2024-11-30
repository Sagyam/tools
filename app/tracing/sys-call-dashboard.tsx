'use client'

import { BarDetails } from '@/app/tracing/bar-details'
import { programData } from '@/app/tracing/data'
import { ProgramData, SortOrder } from '@/app/tracing/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'
import React, { useState } from 'react'

const getSyscallColor = (percentage: number): string => {
    if (percentage >= 50) {
        return 'bg-red-300'
    } else if (percentage >= 20) {
        return 'bg-amber-300'
    } else {
        return 'bg-green-300'
    }
}

export const SyscallDashboard: React.FC = () => {
    const [selectedProgram, setSelectedProgram] = useState<ProgramData>(
        programData[0]
    )
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [languageFilter, setLanguageFilter] = useState('all')

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

    if (programData.length === 0) {
        return <div>Loading...</div>
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
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center text-sm text-black font-bold">
                                                {syscall.percentage > 5 &&
                                                    syscall.percentage.toFixed(
                                                        0
                                                    )}
                                                %
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total time label */}
                                <div className="ml-2 text-sm font-medium">
                                    {program.totalTime} µs
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
                                {marker} µs
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {selectedProgram && (
                <div className="relative">
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
