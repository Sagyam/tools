import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Caching',
    description:
        'Learn about caching strategies, techniques, and best practices to improve application performance and reduce latency.',
    openGraph: {
        title: 'Caching',
        description:
            'Learn about caching strategies, techniques, and best practices to improve application performance and reduce latency.',
        url: 'https://tools.sagyamthapa.com.np/caching',
        siteName: 'Tools',
        images: [
            {
                url: './caching.png',
                width: 1200,
                height: 630,
                alt: 'Caching Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Caching',
        description:
            'Learn about caching strategies, techniques, and best practices to improve application performance and reduce latency.',
        images: ['https://sagyamthapa.com.np/caching.png'],
    },
    keywords: [
        'token bucket',
        'leaky bucket',
        'fixed window',
        'sliding window',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
