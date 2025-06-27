import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Deployment Strategies',
    description:
        'Interactive deployment patterns (Rolling, Blue/Green, Canary, A/B, etc.)',
    openGraph: {
        title: 'Deployment Strategies',
        description:
            'Interactive deployment patterns (Rolling, Blue/Green, Canary, A/B, etc.)',
        url: 'https://tools.sagyamthapa.com.np/deployment',
        siteName: 'Tools',
        images: [
            {
                url: './deployment.png',
                width: 1200,
                height: 630,
                alt: 'Deployment Strategies Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Deployment Strategies',
        description:
            'Interactive deployment patterns (Rolling, Blue/Green, Canary, A/B, etc.)',
        images: ['https://sagyamthapa.com.np/deployment.png'],
    },
    keywords: [
        'deployment strategies',
        'rolling deployment',
        'blue-green deployment',
        'canary deployment',
        'A/B testing',
        'interactive tools',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
