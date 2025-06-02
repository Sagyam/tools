'use client'

import type { Request } from '@/app/load-balancer/types'
import { motion } from 'framer-motion'
import type React from 'react'

interface ServerQueueProps {
    serverIndex: number
    queue: Request[]
    position: { x: number; y: number }
}

export const ServerQueue: React.FC<ServerQueueProps> = ({
    serverIndex,
    queue,
    position,
}) => {
    const queueSpacing = 15
    const maxVisibleItems = 5

    return (
        <>
            {queue.slice(0, maxVisibleItems).map((request, index) => {
                const size = 8 + request.weight / 300
                const queueX = position.x - 30 - index * queueSpacing
                const queueY = position.y

                return (
                    <motion.div
                        key={`queue-${request.id}`}
                        initial={{ x: position.x, y: position.y, opacity: 0 }}
                        animate={{ x: queueX, y: queueY, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute rounded-full"
                        style={{
                            backgroundColor: request.color,
                            width: size,
                            height: size,
                            zIndex: 10 - index,
                        }}
                    />
                )
            })}

            {queue.length > maxVisibleItems && (
                <motion.div
                    key={`queue-more-${serverIndex}`}
                    className="absolute text-xs font-bold text-white bg-gray-700 rounded-full flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{
                        x:
                            position.x -
                            30 -
                            maxVisibleItems * queueSpacing -
                            10,
                        y: position.y,
                        opacity: 1,
                    }}
                    exit={{ opacity: 0 }}
                    style={{
                        width: 16,
                        height: 16,
                    }}
                >
                    +{queue.length - maxVisibleItems}
                </motion.div>
            )}
        </>
    )
}
