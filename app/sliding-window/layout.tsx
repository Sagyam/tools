import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Sliding Window',
    description: 'Sliding window rate limiting algorithm',
    openGraph: {
        title: 'Sliding Window',
        description: 'Sliding window rate limiting algorithm',
        url: 'https://tools.sagyamthapa.com.np/sliding-window',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/sliding-window.png',
                width: 1200,
                height: 630,
                alt: 'Sliding Window Algorithm',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Sliding Window',
        description: 'Sliding window rate limiting algorithm',
        images: ['https://tools.sagyamthapa.com.np/sliding-window.png'],
    },
    keywords: [
        'sliding window',
        'rate limiting',
        'algorithm',
        'networking',
        'performance',
        'interactive tools',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
