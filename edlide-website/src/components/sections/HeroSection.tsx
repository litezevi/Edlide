import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, BookOpen, Code, Shield, Zap } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 text-center max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Open Source AI Development</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="block gradient-text mb-4">
              Edlide IDE
            </span>
            <span className="block text-xl md:text-2xl lg:text-3xl font-normal text-muted-foreground max-w-4xl mx-auto leading-tight">
              The future of AI development is open, transparent, and under your control
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Break free from closed AI ecosystems. Build with locally-executable models, 
            maintain complete transparency, and never worry about vendor lock-in again.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              asChild 
              className="group min-w-[200px] h-12 px-8 text-base font-semibold hover-lift"
            >
              <Link href="/download">
                <Download className="mr-3 h-5 w-5" />
                Get Started Free
                <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="group min-w-[200px] h-12 px-8 text-base font-semibold border-2 hover-lift"
            >
              <Link href="/docs">
                <BookOpen className="mr-3 h-5 w-5" />
                Explore Documentation
                <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">100% Open Source</h3>
            <p className="text-muted-foreground leading-relaxed">
              Full transparency with no hidden dependencies. Your code, your models, your control.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Code className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Local-First Development</h3>
            <p className="text-muted-foreground leading-relaxed">
              Run everything locally without cloud dependencies. Your data never leaves your machine.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Zero Vendor Lock-in</h3>
            <p className="text-muted-foreground leading-relaxed">
              Build with portable models and open standards. Migrate freely between platforms.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 pt-12 border-t border-border/50 animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="flex flex-wrap justify-center items-center gap-12 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></div>
              <span className="text-muted-foreground">Open Source Models</span>
              <span className="text-foreground font-semibold">500+</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow"></div>
              <span className="text-muted-foreground">Local Execution</span>
              <span className="text-foreground font-semibold">100%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-slow"></div>
              <span className="text-muted-foreground">Community Driven</span>
              <span className="text-foreground font-semibold">∞</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}