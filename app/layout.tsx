import { AppSidebar } from '@/components/app-sidebar'
import { ModeToggle } from '@/components/mode-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { cookies } from 'next/headers'
import React from 'react'

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
})
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
})

export const metadata: Metadata = {
    title: 'Tools',
    description: 'Tools for your application',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = cookies()
    const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true'
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SidebarProvider defaultOpen={defaultOpen}>
                    <AppSidebar />
                    <ModeToggle></ModeToggle>
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
            </body>
        </html>
    )
}
