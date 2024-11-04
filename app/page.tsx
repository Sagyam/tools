import { SyscallDashboard } from '@/app/posts/tracing/sys-call-dashboard'

export default function Home() {
    return (
        <main className="container mx-auto p-4">
            <SyscallDashboard />
        </main>
    )
}
