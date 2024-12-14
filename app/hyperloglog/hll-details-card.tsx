import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Info } from 'lucide-react'
import React from 'react'

export interface HLLDetailsCardProps {
    hash?: number | string
    currentRunLength?: number
    lastRunLength?: number
    selectedBucket?: number
    wasAdded?: boolean
    isSingleIP?: boolean
}

export const HLLDetailsCard: React.FC<HLLDetailsCardProps> = ({
    hash,
    currentRunLength,
    lastRunLength,
    selectedBucket,
    wasAdded,
    isSingleIP,
}) => {
    const renderContent = () => {
        // No data scenario
        if (currentRunLength === undefined || selectedBucket === undefined) {
            return (
                <CardContent className="flex items-center space-x-2">
                    <p>Add IPs to see HyperLogLog details</p>
                </CardContent>
            )
        }

        // Single IP addition details
        if (isSingleIP) {
            return (
                <CardContent>
                    <p className="text-lg">
                        The hash of the current input is{' '}
                        <span className="font-semibold underline decoration-purple-500">
                            {hash + '. '}
                        </span>
                        The input was mapped to bucket{'  '}
                        <strong className="text-blue-500">
                            {selectedBucket}.
                        </strong>{' '}
                        The current run length is{' '}
                        <span
                            className={
                                wasAdded
                                    ? 'font-semibold text-green-600'
                                    : 'font-semibold text-red-600'
                            }
                        >
                            {currentRunLength}.
                        </span>
                        {wasAdded && (
                            <span className="text-emerald-500 ml-1">
                                The bucket was successfully updated.
                            </span>
                        )}
                        {!wasAdded && (
                            <span className="text-rose-500">
                                The bucket was not updated because the current
                                run length {currentRunLength} was not greater
                                than the existing value {lastRunLength}.
                            </span>
                        )}
                    </p>
                </CardContent>
            )
        }

        // Multiple IP addition details
        return (
            <CardContent>
                <p className="text-lg">
                    The hash of the current input is{' '}
                    <span className="font-semibold underline decoration-purple-500">
                        {hash + '. '}
                    </span>
                    The input was mapped to bucket{' '}
                    <strong className="text-blue-500">{selectedBucket}.</strong>{' '}
                    The previous run length was {lastRunLength}, and the current
                    run length is{' '}
                    <span
                        className={
                            wasAdded
                                ? 'font-semibold text-green-600'
                                : 'font-semibold text-red-600'
                        }
                    >
                        {currentRunLength + '. '}
                    </span>
                    {wasAdded && (
                        <span className="text-emerald-500">
                            The bucket was successfully updated.
                        </span>
                    )}
                    {!wasAdded && (
                        <span className="text-rose-500">
                            The bucket was not updated because the current run
                            length {currentRunLength} was not greater than the
                            existing value {lastRunLength}.
                        </span>
                    )}
                </p>
            </CardContent>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <span>HyperLogLog Bucket Details</span>
                </CardTitle>
                <CardDescription>
                    Insights into the current HyperLogLog bucket selection and
                    update process
                </CardDescription>
            </CardHeader>
            {renderContent()}
        </Card>
    )
}
