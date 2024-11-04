export interface SyscallData {
    syscall: string
    percentage: number
    calls: number
    time: number
    errors: number
}

export interface ProgramData {
    name: string
    language: string
    totalTime: number
    syscalls: SyscallData[]
}

export interface BarDetailsProps {
    programName: string
    totalExecutionTime: number
    data: SyscallData[]
}

export interface TooltipProps {
    active?: boolean
    payload?: any[]
}

export type SortOrder = 'asc' | 'desc'

export interface SyscallInfo {
    [key: string]: string
}
