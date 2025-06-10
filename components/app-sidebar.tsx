import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
    ArrowBigRightDashIcon,
    AudioWaveformIcon,
    CalculatorIcon,
    CoinsIcon,
    DatabaseZapIcon,
    DropletIcon,
    FilterIcon,
    NetworkIcon,
    PinIcon,
    SuperscriptIcon,
} from 'lucide-react'

// Menu items.
const items = [
    {
        title: 'Bloom Calculator',
        url: '/bloom-calculator',
        icon: CalculatorIcon,
    },
    {
        title: 'Bloom Filter',
        url: '/bloom-filter',
        icon: FilterIcon,
    },
    {
        title: 'Caching Strategies',
        url: '/caching-strategies',
        icon: DatabaseZapIcon,
    },
    {
        title: 'Count-Min Sketch',
        url: '/count-min-sketch',
        icon: AudioWaveformIcon,
    },
    {
        title: 'DNS Resolver',
        url: '/dns',
        icon: NetworkIcon,
    },
    {
        title: 'HyperLogLog',
        url: '/hyperloglog',
        icon: SuperscriptIcon,
    },
    {
        title: 'Load Balancer',
        url: '/load-balancer',
        icon: NetworkIcon,
    },
    {
        title: 'Token Bucket',
        url: '/token-bucket',
        icon: CoinsIcon,
    },
    {
        title: 'Leaky Bucket',
        url: '/leaky-bucket',
        icon: DropletIcon,
    },
    {
        title: 'Fixed Window',
        url: '/fixed-window',
        icon: PinIcon,
    },
    {
        title: 'Sliding Window',
        url: '/sliding-window',
        icon: ArrowBigRightDashIcon,
    },
]

export function AppSidebar() {
    return (
        <Sidebar variant={'floating'}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
