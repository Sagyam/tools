import { DataStoreProps } from '@/app/caching/types'
import { FC } from 'react'

export const DataStore: FC<DataStoreProps> = ({
    title,
    data,
    icon,
    highlightKey,
    type,
}) => (
    <div className="bg-primary border border-primary-foreground rounded-lg p-4 flex-1">
        <div className="flex items-center mb-3">
            {icon}
            <h3 className="font-bold ml-2 text-lg">{title}</h3>
        </div>
        <div className="bg-primary rounded p-3 min-h-[100px] font-mono text-sm text-secondary space-y-1 overflow-y-auto max-h-[150px]">
            {Object.keys(data).length === 0 ? (
                <span className="text-slate-500 italic">empty</span>
            ) : (
                Object.entries(data).map(([key, value]) => (
                    <div
                        key={key}
                        className={`p-1 rounded transition-colors duration-1000 ${highlightKey === key ? (type === 'hit' ? 'bg-green-300 text-green-600' : 'bg-red-300 text-red-600') : ''}`}
                    >
                        <span className="text-blue-500">{key}:</span> "{value}"
                    </div>
                ))
            )}
        </div>
    </div>
)
