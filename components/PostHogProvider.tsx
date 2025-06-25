'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            person_profiles: 'always',
            defaults: '2025-05-24',
        })

        posthog.register({
            $browser: navigator.userAgent,
            $device_id: posthog.get_distinct_id(),
            $country_code: Intl.DateTimeFormat().resolvedOptions().timeZone,
            $timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })

        //capture page views
        posthog.capture('$pageview', {
            $current_url: window.location.href,
            $pathname: window.location.pathname,
            $search: window.location.search,
            $title: document.title,
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
