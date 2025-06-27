import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Proxy PostHog ingestion and assets requests to the PostHog endpoints
    // Note: `Toward_Frog_Principle5` is a randomly generated prefix
    // to bypass Adblockers.
    async rewrites() {
        return [
            {
                source: '/relay-Toward_Frog_Principle5/static/:path*',
                destination: 'https://us-assets.i.posthog.com/static/:path*',
            },
            {
                source: '/relay-Toward_Frog_Principle5/:path*',
                destination: 'https://us.i.posthog.com/:path*',
            },
            {
                source: '/relay-Toward_Frog_Principle5/flags',
                destination: 'https://us.i.posthog.com/flags',
            },
        ]
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,
    allowedDevOrigins: ['http://localhost:3000', 'http://192.168.1.83:3000'],
}

export default nextConfig
