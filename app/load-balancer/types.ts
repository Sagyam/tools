export interface Request {
    id: number
    clientIndex: number
    serverIndex: number
    color: string
    phase: 'toLB' | 'toServer'
    weight: number
}

export interface Client {
    name: string
    rate: number
}

export interface ServerState {
    name: string
    cores: number
    usedCores: number
    drops: number
}
