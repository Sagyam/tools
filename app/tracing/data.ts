'use client'

import TraceParser from '@/app/tracing/trace-parser'
import { ProgramData } from '@/app/tracing/types'

const sources = [
    {
        url: 'https://raw.githubusercontent.com/Sagyam/benchmarks/refs/heads/main/hello-world/traces/csharp-traces.txt',
        name: 'C#',
        language: 'C#',
    },
    {
        url: 'https://raw.githubusercontent.com/Sagyam/benchmarks/refs/heads/main/hello-world/traces/dart-traces.txt',
        name: 'Dart',
        language: 'Dart',
    },
]

export const programData: ProgramData[] =
    await TraceParser.fetchAndParse(sources)
