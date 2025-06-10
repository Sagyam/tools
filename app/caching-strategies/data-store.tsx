import { DataStoreProps } from '@/app/caching-strategies/types'
import { FC } from 'react'

export const DataStore: FC<DataStoreProps> = ({
    title,
    data,
    icon,
    highlightKey,
    type,
}) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex-1">
        <div className="flex items-center mb-3 text-slate-300">
            {icon}
            <h3 className="font-bold ml-2 text-lg">{title}</h3>
        </div>
        <div className="bg-slate-900 rounded p-3 min-h-[100px] font-mono text-sm text-slate-400 space-y-1 overflow-y-auto max-h-[150px]">
            {Object.keys(data).length === 0 ? (
                <span className="text-slate-500 italic">empty</span>
            ) : (
                Object.entries(data).map(([key, value]) => (
                    <div
                        key={key}
                        className={`p-1 rounded transition-colors duration-300 ${highlightKey === key ? (type === 'hit' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300') : ''}`}
                    >
                        <span className="text-blue-400">{key}:</span> "{value}"
                    </div>
                ))
            )}
        </div>
    </div>
)
