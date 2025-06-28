import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Count-Min Sketch',
    description:
        'Count-Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data.',
    openGraph: {
        title: 'Count-Min Sketch',
        description:
            'Count-Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data.',
        url: 'https://tools.sagyamthapa.com.np/count-min-sketch',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/cms.png',
                width: 1200,
                height: 630,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Count-Min Sketch',
        description:
            'Count-Min Sketch is a probabilistic data structure used for estimating the frequency of events in a stream of data.',
        images: ['https://tools.sagyamthapa.com.np/cms.png'],
    },
    keywords: [
        'Count-Min Sketch',
        'Probabilistic Data Structure',
        'Frequency Estimation',
        'Data Stream Processing',
        'Approximate Counting',
        'Algorithm',
        'Data Structures',
        'Computer Science',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
