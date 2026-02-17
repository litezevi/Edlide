import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, Lock, Sparkles, Zap } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/40 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-200/40 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-emerald-200/40 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>

      <div className="relative z-10 text-center max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="space-y-8 animate-slide-up">
          {/* Badge */}


          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="block gradient-text mb-4">
              Edlide IDE
            </span>{' '}
            <span className="block text-xl md:text-2xl lg:text-3xl font-normal text-foreground max-w-4xl mx-auto leading-relaxed">
              Open&nbsp;source&nbsp;AI&nbsp;models have caught up to closed alternatives<br />and cost&nbsp;10x&nbsp;less
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Break free from closed AI ecosystems.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center">
            <Button
              size="lg"
              asChild
              className="group min-w-[200px] h-12 px-8 text-base font-semibold hover-lift dark:bg-gradient-to-r dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              <Link href="/download">
                <Download className="mr-3 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">The Best Models</h3>
            <p className="text-muted-foreground leading-relaxed">
              Minimax-M2.5.5, GLM-4.7, KIMI-K2.5. Only the best open source models.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Lock className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Your Data, Your Control</h3>
            <p className="text-muted-foreground leading-relaxed">
              100% private. Confidential compute on decentralized infrastructure. No vendor eyes on your prompts. Pure inference, pure confidence.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover-lift flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Native quantized</h3>
            <p className="text-muted-foreground leading-relaxed">
              Native quantization or lack thereof has a significant impact on performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
