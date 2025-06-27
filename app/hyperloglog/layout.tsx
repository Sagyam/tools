import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'HyperLogLog',
    description:
        'Cardinality estimation demonstration with bucket visualization',
    openGraph: {
        title: 'HyperLogLog',
        description:
            'Cardinality estimation demonstration with bucket visualization',
        url: 'https://tools.sagyamthapa.com.np/hyperloglog',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/hll.png',
                width: 1200,
                height: 630,
                alt: 'HyperLogLog Algorithm',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'HyperLogLog',
        description:
            'Cardinality estimation demonstration with bucket visualization',
        images: ['https://tools.sagyamthapa.com.np/hll.png'],
    },
    keywords: [
        'hyperloglog',
        'probabilistic data structure',
        'cardinality estimation',
        'algorithm',
        'networking',
        'performance',
        'interactive tools',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
