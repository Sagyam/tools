'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import React, { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
            api_host: `/relay-Toward_Frog_Principle5`,
            autocapture: true,
            defaults: '2025-05-24',
            person_profiles: 'always',
            capture_performance: true,
            capture_dead_clicks: true,
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
