import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Fixed Window',
    description: 'Visual rate limiter with fixed time window',
    openGraph: {
        title: 'Fixed Window',
        description: 'Visual rate limiter with fixed time window',
        url: 'https://tools.sagyamthapa.com.np/fixed-window',
        images: ['https://tools.sagyamthapa.com.np/fixed-window.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Fixed Window',
        description: 'Visual rate limiter with fixed time window',
        images: ['https://tools.sagyamthapa.com.np/fixed-window.png'],
    },
    keywords: [
        'fixed window',
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
