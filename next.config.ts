import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Proxy PostHog ingestion and assets requests to the PostHog endpoints
    async rewrites() {
        return [
            {
                source: '/ingest/static/:path*',
                destination: 'https://us-assets.i.posthog.com/static/:path*',
            },
            {
                source: '/ingest/:path*',
                destination: 'https://us.i.posthog.com/:path*',
            },
            {
                source: '/ingest/decide',
                destination: 'https://us.i.posthog.com/decide',
            },
        ]
    },
    // Required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,
}

export default nextConfig
