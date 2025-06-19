import { StrategyInfo, StrategyKey } from '@/app/caching/types'

export const STRATEGIES: Record<StrategyKey, StrategyInfo> = {
    'cache-aside': {
        name: 'Cache-Aside',
        description:
            "The application is responsible for managing the cache. It looks for an entry in the cache. If it's a miss, the application reads the data from the database and adds the data to the cache.",
    },
    'read-through': {
        name: 'Read-Through',
        description:
            'The application treats the cache as the main data source. The cache library itself handles fetching data from the database on a cache miss. The application logic is simplified.',
    },
    'write-through': {
        name: 'Write-Through',
        description:
            'Data is written to the cache and the database simultaneously. This provides strong data consistency but at the cost of higher write latency, as the operation only completes when both writes succeed.',
    },
    'write-back': {
        name: 'Write-Back (Write-Behind)',
        description:
            'The application writes data to the cache, which acknowledges the write immediately. The cache then asynchronously writes the data to the database after a delay. This is very fast for writes but risks data loss if the cache fails.',
    },
    'write-around': {
        name: 'Write-Around',
        description:
            'Data is written directly to the database, bypassing the cache entirely. Only data that is read is then added to the cache. This is useful for workloads with few re-reads of recently written data (e.g., logging).',
    },
    'refresh-ahead': {
        name: 'Refresh-Ahead',
        description:
            'Cache entries are proactively refreshed before they expire, based on access patterns. When data is accessed and is close to expiring, the cache triggers an asynchronous refresh from the database. This ensures fresh data with minimal latency.',
    },
}
