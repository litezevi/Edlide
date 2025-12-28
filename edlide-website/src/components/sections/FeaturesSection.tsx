import { Shield, Code, Zap, GitBranch, Cpu, Users } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: "Open Source First",
    description: "Exclusive focus on open source models. No vendor lock-in, full transparency, and complete control over your AI development workflow."
  },
  {
    icon: Code,
    title: "Developer-Centric",
    description: "Built by developers, for developers. Native support for model training, fine-tuning, and deployment with the tools you already love."
  },
  {
    icon: Zap,
    title: "10x Cheaper",
    description: "Native quantization or lack thereof. Open source models have caught up to closed alternatives while costing 10x less on average."
  },
  {
    icon: GitBranch,
    title: "Version Control Enabled",
    description: "Integrated Git support for model versioning, experiment tracking, and collaborative development workflows."
  },
  {
    icon: Cpu,
    title: "Hardware Optimized",
    description: "Leverage your own GPU resources efficiently. Support for CUDA, ROCm, and Apple Silicon acceleration."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a growing community of open source AI developers sharing models, tools, and best practices."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 border-t">
      <div className="container max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary">
            Why Developers Choose Edlide
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={index}
                className="group relative p-6 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-primary group-hover:text-primary/80 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4 text-primary">
            Ready to take control of your AI development?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers who've already made the switch to true open source freedom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Developers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Supported Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
          </div>

          <p className="text-2xl font-bold mt-12 text-foreground">
            Powered by Chutes
          </p>
        </div>
      </div>
    </section>
  )
}