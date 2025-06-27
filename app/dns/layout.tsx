import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'DNS Tools',
    description: 'Interactive DNS tools for testing and learning.',
    openGraph: {
        title: 'DNS Tools',
        description: 'Interactive DNS tools for testing and learning.',
        url: 'https://tools.sagyamthapa.com.np/dns',
        siteName: 'Tools',
        images: [
            {
                url: './dns.png',
                width: 1200,
                height: 630,
                alt: 'DNS Tools Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DNS Tools',
        description: 'Interactive DNS tools for testing and learning.',
        images: ['https://sagyamthapa.com.np/dns.png'],
    },
    keywords: [
        'DNS tools',
        'interactive DNS testing',
        'DNS lookup',
        'DNS records',
        'DNS troubleshooting',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
