import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Bloom Filter',
    description:
        'Explore the Bloom filter algorithm, a space-efficient probabilistic data structure for set membership testing.',
    openGraph: {
        title: 'Bloom Filter',
        description:
            'Explore the Bloom filter algorithm, a space-efficient probabilistic data structure for set membership testing.',
        url: 'https://tools.sagyamthapa.com.np/bloom-filter',
        siteName: 'Tools',
        images: [
            {
                url: './bloom-filter.png',
                width: 1200,
                height: 630,
                alt: 'Bloom Filter Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bloom Filter',
        description:
            'Explore the Bloom filter algorithm, a space-efficient probabilistic data structure for set membership testing.',
        images: ['https://sagyamthapa.com.np/bloom-filter.png'],
    },
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
