import { AppSidebar } from '@/components/app-sidebar'
import { PostHogProvider } from '@/components/PostHogProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Raleway } from 'next/font/google'
import React from 'react'

export const metadata: Metadata = {
    title: 'Tools',
    description: 'Tools for your application',
    openGraph: {
        title: 'Tools',
        description: 'Tools for your application',
        url: 'https://tools.sagyamthapa.com.np',
        siteName: 'Tools',
        images: [
            {
                url: './og-image.png',
                width: 1200,
                height: 630,
                alt: 'Tools Open Graph Image',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tools',
        description: 'Tools for your application',
        images: ['https://tools.sagyamthapa.com.np/og-image.png'],
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico',
    },
    keywords: [
        'rate limiting',
        'bloom filter',
        'hyperloglog',
        'count-min sketch',
        'load balancer',
        'caching strategies',
        'dns resolver',
        'rate limiting algorithms',
    ],
    creator: 'Sagyam Thapa',
    authors: [
        {
            name: 'Sagyam Thapa',
            url: 'https://sagyamthapa.com.np',
        },
    ],
}

export const viewport: Viewport = {
    themeColor: 'system',
}

const font = Raleway({
    subsets: ['latin'],
    display: 'swap',
})

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={font.className}>
            <body>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <PostHogProvider>
                    <SidebarProvider defaultOpen={false}>
                        <AppSidebar />
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <SidebarTrigger />
                            {children}

                            <Toaster />
                        </ThemeProvider>
                    </SidebarProvider>
                </PostHogProvider>
            </body>
        </html>
    )
}
