import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Raft Consensus Algorithm - Interactive Visualization | etcd',
    description:
        'Interactive visualization of the Raft consensus algorithm with leader election, log replication, and network partition simulation. Learn distributed systems through hands-on exploration of etcd\'s core algorithm.',
    openGraph: {
        title: 'Raft Consensus Algorithm - Interactive Visualization',
        description:
            'Interactive visualization of the Raft consensus algorithm with leader election, log replication, and network partition simulation. Learn distributed systems through hands-on exploration.',
        url: 'https://tools.sagyamthapa.com.np/etcd',
        siteName: 'Tools',
        images: [
            {
                url: 'https://tools.sagyamthapa.com.np/etcd.png',
                width: 1200,
                height: 630,
                alt: 'Raft Consensus Algorithm Visualization - Leader Election and Log Replication',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Raft Consensus Algorithm - Interactive Visualization',
        description:
            'Interactive visualization of the Raft consensus algorithm. Learn leader election, log replication, and distributed consensus through hands-on exploration.',
        images: ['https://tools.sagyamthapa.com.np/etcd.png'],
    },
    keywords: [
        'raft consensus',
        'raft algorithm',
        'distributed consensus',
        'leader election',
        'log replication',
        'etcd',
        'distributed systems',
        'consensus algorithm visualization',
        'raft interactive demo',
        'distributed database',
        'quorum consensus',
        'network partition tolerance',
        'CAP theorem',
        'distributed computing',
        'replicated state machine',
    ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
