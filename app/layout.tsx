import { AppSidebar } from '@/components/app-sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import './globals.css'
import { Raleway } from 'next/font/google'
import React from 'react'

export const metadata: Metadata = {
    title: 'Tools',
    description: 'Tools for your application',
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
                <SidebarProvider defaultOpen={true}>
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
            </body>
        </html>
    )
}
