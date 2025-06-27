import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Code2, Database, Network, Timer, Zap } from "lucide-react"

const toolCategories = [
  {
    title: "Data Structures & Algorithms",
    description: "Interactive visualizations of probabilistic data structures and algorithms",
    icon: Database,
    tools: [
      { name: "Bloom Filter", href: "/bloom-filter", description: "Probabilistic membership testing" },
      { name: "Bloom Calculator", href: "/bloom-calculator", description: "Parameter optimization" },
      { name: "HyperLogLog", href: "/hyperloglog", description: "Cardinality estimation" },
      { name: "Count-Min Sketch", href: "/count-min-sketch", description: "Frequency estimation" },
    ]
  },
  {
    title: "Rate Limiting & Traffic Control",
    description: "Visual demonstrations of traffic shaping and flow control algorithms",
    icon: Timer,
    tools: [
      { name: "Token Bucket", href: "/token-bucket", description: "Rate limiting with bursts" },
      { name: "Leaky Bucket", href: "/leaky-bucket", description: "Smooth traffic shaping" },
      { name: "Fixed Window", href: "/fixed-window", description: "Time-based rate limiting" },
      { name: "Sliding Window", href: "/sliding-window", description: "Moving window approach" },
    ]
  },
  {
    title: "System Design & Infrastructure",
    description: "Learn system architecture patterns through interactive simulations",
    icon: Code2,
    tools: [
      { name: "Load Balancer", href: "/load-balancer", description: "Multi-algorithm load balancing" },
      { name: "Deployment Strategies", href: "/deployment", description: "Blue/green, canary, rolling" },
      { name: "Caching Strategies", href: "/caching", description: "Cache patterns & policies" },
    ]
  },
  {
    title: "Network Tools",
    description: "Understand network protocols and communication patterns",
    icon: Network,
    tools: [
      { name: "DNS Resolver", href: "/dns", description: "DNS resolution visualization" },
    ]
  }
]

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-4xl font-bold">Computer Science Tools</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          Interactive educational tools for learning algorithms, data structures, and system design concepts. 
          Visualize complex computer science topics through hands-on demonstrations.
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Interactive
          </Badge>
          <Badge variant="secondary">13+ Tools</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Next.js</Badge>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="grid gap-8 mb-12">
        {toolCategories.map((category, index) => (
          <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="mt-1">{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool, toolIndex) => (
                  <Link key={toolIndex} href={tool.href}>
                    <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {tool.name}
                        </h3>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <CardDescription>
            Choose a tool from the sidebar or click on any of the categories above to begin learning
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bloom-filter">
              <Button size="lg" className="w-full sm:w-auto">
                Try Bloom Filter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/load-balancer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Load Balancer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
