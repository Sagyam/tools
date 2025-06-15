import { ReactNode } from 'react'

export type DataObject = { [key: string]: string }

export type StrategyKey =
    | 'cache-aside'
    | 'read-through'
    | 'write-through'
    | 'write-back'
    | 'write-around'

export type LogStatus = 'info' | 'hit' | 'miss'

export type LogEntry = {
    time: string
    message: string
    status: LogStatus
    icon: ReactNode
}

export type HighlightState = {
    key: string | null
    type: 'hit' | 'miss' | null
}

export type StrategyInfo = {
    name: string
    description: string
}

export interface LogPanelProps {
    logs: LogEntry[]
}

export interface DataStoreProps {
    title: string
    data: DataObject
    icon: ReactNode
    highlightKey?: string | null
    type?: 'hit' | 'miss' | null
}
