import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Count Min Sketch',
    description:
        'Count Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data. It is particularly useful for applications that require approximate counting of large datasets with limited memory.',
    openGraph: {
        title: 'Count Min Sketch',
        description:
            'Count Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data. It is particularly useful for applications that require approximate counting of large datasets with limited memory.',
        url: 'https://tools.sagyamthapa.com.np/cms-working',
        siteName: 'Tools',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/cms-working.png',
                width: 1200,
                height: 630,
                alt: 'Count Min Sketch Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Count Min Sketch',
        description:
            'Count Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data. It is particularly useful for applications that require approximate counting of large datasets with limited memory.',
        images: ['https://tools.sagyamthapa.com.np/cms-working.png'],
    },
    keywords: [
        'count min sketch',
        'probabilistic data structure',
        'frequency estimation',
        'stream data processing',
        'approximate counting',
        'large datasets',
        'memory-efficient algorithms',
        'data structures',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
