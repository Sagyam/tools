import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Bloom Calculator',
    description:
        'Optimize your Bloom filter parameters, adjusting for false positive rates and expected elements.',
    openGraph: {
        title: 'Bloom Calculator',
        description:
            'Optimize your Bloom filter parameters, adjusting for false positive rates and expected elements.',
        url: 'https://tools.sagyamthapa.com.np/bloom-calculator',
        siteName: 'Tools',
        images: [
            {
                url: './bloom-calculator.png',
                width: 1200,
                height: 630,
                alt: 'Bloom Calculator Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bloom Calculator',
        description:
            'Optimize your Bloom filter parameters, adjusting for false positive rates and expected elements.',
        images: ['https://sagyamthapa.com.np/bloom-calculator.png'],
    },
    keywords: [
        'bloom filter',
        'false positive rate',
        'expected elements',
        'hash functions',
        'bit array size',
        'probabilistic data structure',
        'data structures',
        'algorithms',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
