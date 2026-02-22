import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      {/* Floating glow orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-purple-500/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-40 right-[10%] w-96 h-96 bg-purple-600/8 rounded-full blur-[140px] animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm text-sm text-muted-foreground animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          One subscription — IDE &amp; CLI included
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up">
          <span className="block gradient-text mb-4">
            Edlide
          </span>
          <span className="block text-xl md:text-2xl lg:text-3xl font-normal text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI&#8209;powered IDE&nbsp;&amp;&nbsp;CLI built on the best open&nbsp;source models
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Open source AI models have caught up to closed alternatives and cost&nbsp;10x&nbsp;less. Full privacy, native quantization, no session limits.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            size="lg"
            asChild
            className="group min-w-[200px] h-12 px-8 text-base font-semibold hover-lift dark:bg-gradient-to-r dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <Link href="/download">
              <Download className="mr-3 h-5 w-5" />
              Download IDE
              <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="min-w-[200px] h-12 px-8 text-base font-semibold border-border/60 hover:bg-card/60 hover:border-purple-500/40 transition-all duration-300"
          >
            <Link href="/pricing">
              View Pricing
            </Link>
          </Button>
        </div>
      </div>

      {/* IDE Screenshot with glow effect */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-16 md:mt-20 px-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        {/* Purple glow behind screenshot */}
        <div className="absolute -inset-4 bg-purple-500/10 dark:bg-purple-500/15 rounded-3xl blur-3xl" />

        {/* Window chrome mockup */}
        <div className="relative rounded-xl overflow-hidden border border-border/40 dark:border-white/10 shadow-2xl dark:shadow-purple-500/10">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-card/90 dark:bg-[#1a1d25]/95 border-b border-border/40 dark:border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="ml-3 text-xs text-muted-foreground/60 font-mono">Edlide IDE</span>
          </div>
          {/* Video – autoplay, looped, muted (required for autoplay) */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          >
            <source src="/edlide-ide-video.mov" type="video/quicktime" />
            <source src="/edlide-ide-video.mov" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
