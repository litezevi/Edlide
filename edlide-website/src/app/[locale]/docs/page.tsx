'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronRight } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function DocsPage() {
  const t = useTranslations('docs')
  const locale = useLocale()
  const lp = (path: string) => locale === 'ru' ? path : `/${locale}${path}`

  const docsSections = [
    {
      title: t('gettingStarted'),
      items: [
        { id: 'about', label: t('aboutLabel') },
        { id: 'installation', label: t('installationLabel') },
        { id: 'account', label: t('accountLabel') },
        { id: 'transfer', label: t('transferLabel') },
      ]
    },
    {
      title: t('cliSection'),
      items: [
        { id: 'cli', label: t('cliLabel') },
      ]
    },
    {
      title: t('modelsSection'),
      items: [
        { id: 'available-models', label: t('availableModelsLabel') },
        { id: 'model-features', label: t('modelFeaturesLabel') },
      ]
    },
    {
      title: t('rulesSection'),
      items: [
        { id: 'system-prompt', label: t('systemPromptLabel') },
        { id: 'project-rules', label: t('projectRulesLabel') },
      ]
    },
    {
      title: t('mcpSection'),
      items: [
        { id: 'mcp-setup', label: t('mcpSetupLabel') },
        { id: 'mcp-example', label: t('mcpExampleLabel') },
      ]
    },
    {
      title: t('actionsSection'),
      items: [
        { id: 'apply-settings', label: t('applySettingsLabel') },
        { id: 'autoapprove', label: t('autoapproveLabel') },
      ]
    },
    {
      title: t('advancedSection'),
      items: [
        { id: 'autocompacting', label: t('autocompactingLabel') },
        { id: 'context-window', label: t('contextWindowLabel') },
      ]
    }
  ]

  const [activeSection, setActiveSection] = useState('about')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150
      const docHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const scrollBottom = docHeight - windowHeight - 100

      if (window.scrollY >= scrollBottom) {
        setActiveSection('context-window')
        return
      }

      const sectionIds = Object.keys(sectionRefs.current).reverse()
      for (const id of sectionIds) {
        const element = sectionRefs.current[id]
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex min-h-screen">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed lg:hidden top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 bg-background border-r border-border/50 
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-6">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
          {docsSections.map((section) => (
            <div key={section.title} className="mt-8">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        scrollToSection(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                        activeSection === item.id
                          ? 'bg-accent text-black font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {item.label}
                      {activeSection === item.id && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 hidden lg:block border-r border-border/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="p-4 space-y-6">
          {docsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        activeSection === item.id
                          ? 'bg-accent text-black font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-primary text-primary-foreground rounded-full shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      <main className="flex-1 py-8 px-4 md:px-6 lg:px-12 max-w-4xl w-full">
        <div id="about" ref={(el) => { sectionRefs.current['about'] = el }}>
          <h1 className="text-3xl font-bold text-primary mb-4">{t('aboutTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('aboutDesc')}</p>
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('openSourceFocusTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('openSourceFocusDesc')}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('privacyFirstTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('privacyFirstDesc')}</p>
            </div>
          </div>
        </div>

        <hr className="my-8 md:my-12 border-border/50" />

        <div id="installation" ref={(el) => { sectionRefs.current['installation'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('installationTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('installationDesc')}</p>
          <div className="border rounded-lg bg-card p-4 mb-6">
            <Link href={lp('/download')} className="text-primary hover:underline font-medium">
              {t('goToDownload')}
            </Link>
            <p className="text-sm text-muted-foreground mt-2">{t('installationDownloadDesc')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('macos')}</h3>
              <p className="text-sm text-muted-foreground">{t('macosDesc')}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('windows')}</h3>
              <p className="text-sm text-muted-foreground">{t('windowsDesc')}</p>
            </div>
          </div>
        </div>

        <hr className="my-8 md:my-12 border-border/50" />

        <div id="account" ref={(el) => { sectionRefs.current['account'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('accountTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('accountDesc')}</p>
          <div className="space-y-4">
            {[
              { title: t('step1Title'), desc: t('step1Desc') },
              { title: t('step2Title'), desc: t('step2Desc') },
              { title: t('step3Title'), desc: t('step3Desc') },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium text-primary">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="transfer" ref={(el) => { sectionRefs.current['transfer'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('transferTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('transferDesc')}</p>
          <div className="border rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground mb-4">{t('transferAvailable')}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Transfer from VS Code</strong> — {t('transferVscode').replace('Transfer from VS Code - ', '')}</li>
              <li>• <strong>Transfer from Cursor</strong> — {t('transferCursor').replace('Transfer from Cursor - ', '').replace('Перенос из Cursor — ', '')}</li>
              <li>• <strong>Transfer from Windsurf</strong> — {t('transferWindsurf').replace('Transfer from Windsurf - ', '').replace('Перенос из Windsurf — ', '')}</li>
            </ul>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="cli" ref={(el) => { sectionRefs.current['cli'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-2">{t('cliTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('cliDesc')}</p>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">{t('cliInstallTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t('cliInstallDesc')}</p>
              <div className="border rounded-lg bg-card p-4">
                <Link href={lp('/download') + '#cli'} className="text-primary hover:underline font-medium">
                  {t('cliInstallLink')}
                </Link>
                <p className="text-sm text-muted-foreground mt-2">{t('cliInstallLinkDesc')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">{t('cliConnectTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t('cliConnectDesc')}</p>
              <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                <code className="flex-1 font-mono text-sm text-primary">/connect</code>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{t('cliConnectNote')}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">{t('cliStartTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t('cliStartDesc')}</p>
              <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                <code className="flex-1 font-mono text-sm text-primary">edlide</code>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4 bg-card">
                <h4 className="font-semibold text-primary mb-2">{t('mcpSupportTitle')}</h4>
                <p className="text-sm text-muted-foreground">{t('mcpSupportDesc')}</p>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <h4 className="font-semibold text-primary mb-2 font-mono text-base">.edliderules</h4>
                <p className="text-sm text-muted-foreground">{t('edliderulesDesc')}</p>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <h4 className="font-semibold text-primary mb-2 font-mono text-base">EDLIDE.md</h4>
                <p className="text-sm text-muted-foreground">{t('edlideMdDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="available-models" ref={(el) => { sectionRefs.current['available-models'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('availableModelsTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('availableModelsDesc')}</p>
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[300px]">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-primary">{t('modelCol')}</th>
                    <th className="text-left p-3 font-medium text-primary">{t('contextCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'minimax-m2.5', ctx: '200k' },
                    { name: 'glm-4.7', ctx: '200k' },
                    { name: 'kimi-k2.5', ctx: '256k' },
                    { name: 'mimo-v2-flash', ctx: '256k' },
                    { name: 'deepseek-v3.2', ctx: '163k' },
                  ].map((model) => (
                    <tr key={model.name} className="border-t border-border/50">
                      <td className="p-3 text-muted-foreground font-mono">{model.name}</td>
                      <td className="p-3 text-muted-foreground">{model.ctx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="model-features" ref={(el) => { sectionRefs.current['model-features'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('modelFeaturesTitle')}</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('noContextLimitsTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('noContextLimitsDesc')}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">{t('nativeQuantTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('nativeQuantDesc')}</p>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="system-prompt" ref={(el) => { sectionRefs.current['system-prompt'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('systemPromptTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('systemPromptDesc')}</p>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t('systemPromptNote')}</p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="project-rules" ref={(el) => { sectionRefs.current['project-rules'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('projectRulesTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('projectRulesDesc')}</p>
          <div className="space-y-4">
            {[
              { title: t('ruleStep1Title'), desc: t('ruleStep1Desc') },
              { title: t('ruleStep2Title'), desc: t('ruleStep2Desc') },
              { title: t('ruleStep3Title'), desc: t('ruleStep3Desc') },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium text-primary">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border rounded-lg p-4 bg-card mt-6">
            <p className="text-sm text-muted-foreground">{t('projectRulesNote')}</p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="mcp-setup" ref={(el) => { sectionRefs.current['mcp-setup'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('mcpSetupTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('mcpSetupDesc')}</p>
          <div className="space-y-4">
            {[
              { title: t('mcpStep1Title'), desc: t('mcpStep1Desc') },
              { title: t('mcpStep2Title'), desc: t('mcpStep2Desc') },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium text-primary">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="mcp-example" ref={(el) => { sectionRefs.current['mcp-example'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('mcpExampleTitle')}</h2>
          <p className="text-muted-foreground mb-4">{t('mcpExampleDesc')}</p>
          <div className="border rounded-lg bg-card p-4">
            <div className="overflow-x-auto">
              <pre className="text-sm text-muted-foreground">
{`{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_ACCESS_TOKEN"
      ],
      "transportType": "stdio"
    },
    "search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "SEARCH_API_KEY": "YOUR_API_KEY"
      }
    },
    "context": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ]
    },
    "thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "docs": {
      "url": "https://example.com/mcp-docs"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="apply-settings" ref={(el) => { sectionRefs.current['apply-settings'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('applySettingsTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('applySettingsDesc')}</p>
          <div className="border rounded-lg p-4 bg-card mb-4">
            <h4 className="font-medium text-primary mb-2">{t('sameAsChatTitle')}</h4>
            <p className="text-sm text-muted-foreground">{t('sameAsChatDesc')}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium text-primary mb-2">{t('toolsTitle')}</h4>
            <p className="text-sm text-muted-foreground">{t('toolsDesc')}</p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="autoapprove" ref={(el) => { sectionRefs.current['autoapprove'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('autoapproveTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('autoapproveDesc')}</p>
          <div className="space-y-4">
            {[
              { title: t('autoApproveEditsTitle'), desc: t('autoApproveEditsDesc') },
              { title: t('autoApproveTerminalTitle'), desc: t('autoApproveTerminalDesc') },
              { title: t('autoApproveMcpTitle'), desc: t('autoApproveMcpDesc') },
              { title: t('fixLintTitle'), desc: t('fixLintDesc') },
              { title: t('autoAcceptTitle'), desc: t('autoAcceptDesc') },
            ].map((item, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card">
                <h4 className="font-medium text-primary mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="autocompacting" ref={(el) => { sectionRefs.current['autocompacting'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('autocompactingTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('autocompactingDesc')}</p>
          <div className="space-y-4">
            {[
              { title: t('compactStep1Title'), desc: t('compactStep1Desc') },
              { title: t('compactStep2Title'), desc: t('compactStep2Desc') },
              { title: t('compactStep3Title'), desc: t('compactStep3Desc') },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium text-primary">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="context-window" ref={(el) => { sectionRefs.current['context-window'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('contextWindowTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('contextWindowDesc')}</p>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{t('contextWindowNote')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
