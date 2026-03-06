import { HeroSection } from '@/components/sections/HeroSection'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Monitor,
  Terminal,
  Eye,
  Cpu,
  ShieldCheck,
  DollarSign,
  Infinity,
  Layers,
  Check,
} from 'lucide-react'

/* ─────────── Models data ─────────── */
const models = [
  { name: 'GLM-4.7', color: 'from-emerald-400 to-teal-500' },
  { name: 'GLM-5', color: 'from-green-400 to-emerald-500' },
  { name: 'Qwen-3.5', color: 'from-sky-400 to-blue-500' },
  { name: 'KIMI-K2.5', color: 'from-blue-400 to-cyan-500' },
  { name: 'Minimax-M2.5', color: 'from-amber-400 to-orange-500' },
  { name: 'MIMO-V2-FLASH', color: 'from-purple-400 to-pink-500' },
  { name: 'Deepseek-V3.2', color: 'from-rose-400 to-red-500' },
]

/* ─────────── Advantages data ─────────── */
const advantages = [
  {
    icon: Eye,
    title: 'Full Context Window',
    description:
      'See exactly how much context you are using in real time. No guesswork, full transparency on every token.',
    gradient: 'from-blue-400/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Cpu,
    title: 'Native Quantization',
    description:
      'Models are natively quantized from factory. No post-processing artifacts, peak performance out of the box.',
    gradient: 'from-emerald-400/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: ShieldCheck,
    title: 'Complete Privacy',
    description:
      'Your data is processed on decentralized infrastructure. It is impossible for anyone, including us, to see it.',
    gradient: 'from-purple-400/20 to-pink-500/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: DollarSign,
    title: 'Best Price / Quality',
    description:
      'The best price-to-quality ratio on the market. Open source models at a fraction of the cost of closed alternatives.',
    gradient: 'from-amber-400/20 to-orange-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: Infinity,
    title: 'Finish Your Project',
    description:
      'No waiting for a new session limit. Unlike Claude Code and competitors, your workflow never stops mid-task.',
    gradient: 'from-rose-400/20 to-red-500/20',
    iconColor: 'text-rose-500',
  },
  {
    icon: Layers,
    title: 'One Subscription',
    description:
      'A single plan unlocks both the IDE and the CLI. No separate billing, one price, full access.',
    gradient: 'from-indigo-400/20 to-violet-500/20',
    iconColor: 'text-indigo-500',
  },
]

/* ─────────────────────────────────────── */

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ───── 1. Hero ───── */}
      <HeroSection />

      {/* ───── 2. Product Showcase: IDE + CLI ───── */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* faint top border glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold gradient-text">
              Two Products, One Mission
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
               Whether you prefer a full graphical IDE or a lightning-fast terminal, Edlide has you covered.
            </p>
          </div>

          {/* IDE Card */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 md:mb-32">
            {/* Screenshot */}
            <div className="relative group order-2 lg:order-1">
              <div className="absolute -inset-3 bg-purple-500/8 dark:bg-purple-500/12 rounded-2xl blur-2xl group-hover:bg-purple-500/15 transition-all duration-500" />
              <div className="relative rounded-xl overflow-hidden border border-border/40 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-2 px-4 py-2 bg-card/90 dark:bg-[#1a1d25]/95 border-b border-border/40 dark:border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 text-[11px] text-muted-foreground/50 font-mono">Edlide IDE</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/edlide-ide.png"
                  alt="Edlide IDE interface"
                  width={1429}
                  height={867}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Description */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Edlide IDE</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                A full-featured code editor with integrated AI chat, agent mode, and MCP tool support. Built on VS Code for instant familiarity.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                {['AI Chat in the sidebar with multiple models', 'Agent mode with MCP tool access', 'Full context window with real-time token counter'].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
              <Button asChild variant="outline" className="mt-8 border-border/60 hover:border-purple-500/40">
                <Link href="/download">
                  Download IDE <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* CLI Card — reversed layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Description */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Edlide CLI</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                A powerful command-line AI assistant. Ask questions, generate code, all from your terminal. Open source models.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                {['Interactive chat mode in the terminal', 'Same models as the IDE: Minimax, GLM, KIMI', 'Included in every Edlide subscription'].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
              <Button asChild variant="outline" className="mt-8 border-border/60 hover:border-emerald-500/40">
                <Link href="/download">
                  Get CLI <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Screenshot */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-emerald-500/8 dark:bg-emerald-500/10 rounded-2xl blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500" />
              <div className="relative rounded-xl overflow-hidden border border-border/40 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-2 px-4 py-2 bg-card/90 dark:bg-[#1a1d25]/95 border-b border-border/40 dark:border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 text-[11px] text-muted-foreground/50 font-mono">edlide — ~/project</span>
                </div>
                <Image
                  src="/edlide-cli.png"
                  alt="Edlide CLI terminal interface"
                  width={835}
                  height={387}
                  className="w-full h-auto"
                  quality={90}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 3. Key Advantages ───── */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold gradient-text">
              Why Developers Choose&nbsp;Edlide
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
               Every feature exists for a reason. No fluff, just what matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {advantages.map((adv) => {
              const Icon = adv.icon
              return (
                <div
                  key={adv.title}
                  className="group relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-purple-500/30 hover-lift transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${adv.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${adv.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{adv.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{adv.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── 4. Models Section ───── */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* background flair */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
            The Best Open Source Models
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-14">
            Carefully selected and natively quantized. Each model is battle-tested for real coding tasks.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {models.map((model) => (
              <div
                key={model.name}
                className="group relative px-5 py-2.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm hover:border-purple-500/40 hover-lift transition-all duration-300"
              >
                {/* subtle gradient bar at top */}
                <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${model.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <span className="text-base font-semibold text-foreground">{model.name}</span>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-muted-foreground/60">
            More models added regularly. All models run on decentralized infrastructure.
          </p>
        </div>
      </section>



      {/* ───── 6. Bottom CTA ───── */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* Glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-purple-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-6">
            Start Building Today
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Download Edlide for free, pick a plan that fits, and get the best open source AI models working for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="group min-w-[200px] h-12 px-8 text-base font-semibold hover-lift dark:bg-gradient-to-r dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              <Link href="/download">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild className="min-w-[200px] h-12 px-8 text-base font-semibold border-border/60 hover:bg-card/60 hover:border-purple-500/40 transition-all duration-300">
              <Link href="/pricing">
                See Plans
              </Link>
            </Button>
          </div>


        </div>
      </section>
    </div>
  )
}
