import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Leaky Bucket',
    description: 'Visual rate limiter with animated token flow',
    openGraph: {
        title: 'Leaky Bucket',
        description: 'Visual rate limiter with animated token flow',
        url: 'https://tools.sagyamthapa.com.np/leaky-bucket',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/leaky-bucket.png',
                width: 1200,
                height: 630,
                alt: 'Leaky Bucket Algorithm',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Leaky Bucket',
        description: 'Visual rate limiter with animated token flow',
        images: ['https://tools.sagyamthapa.com.np/leaky-bucket.png'],
    },
    keywords: [
        'leaky bucket',
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
