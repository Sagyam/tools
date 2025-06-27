import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Token Bucket',
    description: 'Visual rate limiter with animated token consumption',
    openGraph: {
        title: 'Token Bucket',
        description: 'Visual rate limiter with animated token consumption',
        url: 'https://tools.sagyamthapa.com.np/token-bucket',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/token-bucket.png',
                width: 1200,
                height: 630,
                alt: 'Token Bucket Algorithm',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Token Bucket',
        description: 'Visual rate limiter with animated token consumption',
        images: ['https://tools.sagyamthapa.com.np/token-bucket.png'],
    },
    keywords: [
        'token bucket',
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
