import { ProgramData, SyscallData, TraceSource } from '@/app/tracing/types'

class TraceParser {
    private static PERCENTAGE_THRESHOLD = 5.0

    /**
     * Downloads and parses trace files from multiple sources
     */
    static async fetchAndParse(sources: TraceSource[]): Promise<ProgramData[]> {
        const results: ProgramData[] = []

        for (const source of sources) {
            try {
                const response = await fetch(source.url)
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch ${source.url}: ${response.statusText}`
                    )
                }
                const content = await response.text()
                results.push(this.parseContent(content, source))
            } catch (error) {
                console.error(`Error processing ${source.url}:`, error)
                throw error
            }
        }

        return results
    }

    /**
     * Parses a single trace file content
     */
    static parseContent(content: string, source: TraceSource): ProgramData {
        // Split into lines and remove empty lines
        const lines = content.split('\n').filter((line) => line.trim() !== '')

        // Skip first two and last two lines
        const dataLines = lines.slice(2, -2)

        const syscalls: SyscallData[] = []
        let totalTime = 0
        const othersGroup: SyscallData = {
            syscall: 'Others',
            percentage: 0,
            calls: 0,
            time: 0,
            errors: 0,
        }

        // Process each line
        for (const line of dataLines) {
            const parts = line.trim().split(/\s+/)
            if (parts.length < 6) continue

            const percentage = parseFloat(parts[0])
            const time = parseFloat(parts[1])
            const calls = parseInt(parts[3])
            const errors = parts[4] === '' ? 0 : parseInt(parts[4])
            const syscall = parts[5]

            // Add to total time regardless of threshold
            totalTime += time

            if (percentage < this.PERCENTAGE_THRESHOLD) {
                // Add to Others group
                othersGroup.percentage += percentage
                othersGroup.calls += calls
                othersGroup.time += time
                othersGroup.errors += errors
            } else {
                // Add as individual syscall
                syscalls.push({
                    syscall,
                    percentage,
                    calls,
                    time,
                    errors,
                })
            }
        }

        // Add Others group if it has any data
        if (othersGroup.calls > 0) {
            syscalls.push(othersGroup)
        }

        // Sort by percentage in descending order
        syscalls.sort((a, b) => b.percentage - a.percentage)

        console.debug({
            name: source.name,
            language: source.language,
            totalTime,
            syscalls,
        })

        return {
            name: source.name,
            language: source.language,
            totalTime,
            syscalls,
        }
    }

    /**
     * Validates the parsed data
     */
    static validateData(data: ProgramData): boolean {
        if (!data.syscalls.length) return false

        const totalPercentage = data.syscalls.reduce(
            (sum, syscall) => sum + syscall.percentage,
            0
        )

        // Allow for small floating-point differences
        return Math.abs(100 - totalPercentage) < 0.1
    }
}

export default TraceParser
