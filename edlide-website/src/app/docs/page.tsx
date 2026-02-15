'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronRight } from 'lucide-react'

const docsSections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'about', label: 'About Edlide' },
      { id: 'installation', label: 'Installation' },
      { id: 'account', label: 'Account Setup' },
      { id: 'transfer', label: 'Transfer Settings' },
    ]
  },
  {
    title: 'Models',
    items: [
      { id: 'available-models', label: 'Available Models' },
      { id: 'model-features', label: 'Key Features' },
    ]
  },
  {
    title: 'Rules',
    items: [
      { id: 'system-prompt', label: 'System Prompt' },
      { id: 'project-rules', label: 'Project Rules' },
    ]
  },
  {
    title: 'MCP',
    items: [
      { id: 'mcp-setup', label: 'Setup' },
      { id: 'mcp-example', label: 'Example Configuration' },
    ]
  },
  {
    title: 'Actions',
    items: [
      { id: 'apply-settings', label: 'Apply Settings' },
      { id: 'autoapprove', label: 'Auto-Approve' },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { id: 'autocompacting', label: 'Autocompacting' },
      { id: 'context-window', label: 'Context Window' },
    ]
  }
]

export default function DocsPage() {
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
      {/* Mobile menu overlay */}
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
          <h1 className="text-3xl font-bold text-primary mb-4">About Edlide</h1>
          <p className="text-muted-foreground mb-6">
            Edlide is an AI-powered IDE focused on open source models and privacy. 
            Unlike other AI IDEs, Edlide does not collect or retain your important data, 
            ensuring a secure and private development environment.
          </p>
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Open Source Focus</h3>
              <p className="text-sm text-muted-foreground">
                Work with the best open source AI models without vendor lock-in.
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                No data retention - your data stays yours.
              </p>
            </div>
          </div>
        </div>

        <hr className="my-8 md:my-12 border-border/50" />

        <div id="installation" ref={(el) => { sectionRefs.current['installation'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Installation</h2>
          <p className="text-muted-foreground mb-6">
            Get started by downloading Edlide for your platform.
          </p>

          <div className="border rounded-lg bg-card p-4 mb-6">
            <Link href="/download" className="text-primary hover:underline font-medium">
              Go to Download Page
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Download the appropriate installer for macOS or Windows.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">macOS</h3>
              <p className="text-sm text-muted-foreground">
                Download the DMG file and install Edlide on your Mac.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Windows</h3>
              <p className="text-sm text-muted-foreground">
                Download the installer and install Edlide on Windows.
              </p>
            </div>
          </div>
        </div>

        <hr className="my-8 md:my-12 border-border/50" />

        <div id="account" ref={(el) => { sectionRefs.current['account'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Account Setup</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Edlide IDE to your account to access all features.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-primary">Open Settings</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Navigate to <strong>Settings → Account</strong> in the IDE.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-primary">Connect Account</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click <strong>Connect to your account</strong> to open the Edlide website.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-primary">Authenticate</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in or create an account. The IDE will automatically connect.
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="transfer" ref={(el) => { sectionRefs.current['transfer'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Transfer Settings</h2>
          <p className="text-muted-foreground mb-6">
            Import your settings from other IDEs seamlessly.
          </p>

          <div className="border rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Available transfer options in <strong>Settings → General</strong>:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Transfer from VS Code</strong> - Import extensions and settings</li>
              <li>• <strong>Transfer from Cursor</strong> - Migrate your Cursor configuration</li>
              <li>• <strong>Transfer from Windsurf</strong> - Import Windsurf settings</li>
            </ul>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="available-models" ref={(el) => { sectionRefs.current['available-models'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Available Models</h2>
          <p className="text-muted-foreground mb-6">
            Choose from the best open source AI models.
          </p>

          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-3 font-medium text-primary">Model</th>
                  <th className="text-left p-3 font-medium text-primary">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">kimi-k2.5</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="model-features" ref={(el) => { sectionRefs.current['model-features'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Key Features</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">No Context Window Limits</h3>
              <p className="text-sm text-muted-foreground">
                Work with large contexts without artificial limitations.
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Native Quantization</h3>
              <p className="text-sm text-muted-foreground">
                Optimized for performance and efficiency.
              </p>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="system-prompt" ref={(el) => { sectionRefs.current['system-prompt'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">System Prompt</h2>
          <p className="text-muted-foreground mb-6">
            Configure your global communication style and AI behavior in <strong>Settings → Rules → System Prompt</strong>.
          </p>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">
              The System Prompt applies globally and does not change when opening different projects. 
              Use it to define communication style, explanation depth, and other general AI behavior preferences.
            </p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="project-rules" ref={(el) => { sectionRefs.current['project-rules'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Project Rules</h2>
          <p className="text-muted-foreground mb-6">
            Create project-specific rules for tailored AI responses.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-primary">Create Rule</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the <strong>+</strong> button in <strong>Settings → Rules</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-primary">Name Your Rule</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a name for your project-specific rule.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-primary">File Created</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  A file is automatically created in your project with a <code className="text-xs bg-accent px-1 py-0.5 rounded ml-1">.edliderules</code> extension.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card mt-6">
            <p className="text-sm text-muted-foreground">
              Project rules are ideal for specific project requirements that need tailored AI behavior 
              for better results. Each rule applies only to its respective project.
            </p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="mcp-setup" ref={(el) => { sectionRefs.current['mcp-setup'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">MCP Setup</h2>
          <p className="text-muted-foreground mb-6">
            Model Context Protocol (MCP) servers extend Edlide capabilities. First, ensure <strong>Node.js</strong> is installed.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-primary">Open MCP Settings</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Navigate to <strong>Settings → MCP</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-primary">Add Server</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click <strong>Add MCP Server</strong> to configure your server.
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="mcp-example" ref={(el) => { sectionRefs.current['mcp-example'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Example Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Add MCP servers by pasting this configuration into your MCP settings:
          </p>

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
          <h2 className="text-2xl font-bold text-primary mb-4">Apply Settings</h2>
          <p className="text-muted-foreground mb-6">
            Configure how the Apply button behaves in <strong>Settings → Actions → Apply</strong>.
          </p>

          <div className="border rounded-lg p-4 bg-card mb-4">
            <h4 className="font-medium text-primary mb-2">Same as Chat Model</h4>
            <p className="text-sm text-muted-foreground">
              Use the same AI model for Apply functionality as your chat model.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium text-primary mb-2">Tools</h4>
            <p className="text-sm text-muted-foreground">
              Functions that LLMs can call. Some tools require user approval before execution.
            </p>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="autoapprove" ref={(el) => { sectionRefs.current['autoapprove'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Auto-Approve Settings</h2>
          <p className="text-muted-foreground mb-6">
            Configure automatic approval behaviors in <strong>Settings → Actions</strong>.
          </p>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-primary mb-1">Auto-approve edits</h4>
              <p className="text-sm text-muted-foreground">Automatically accepts code edits suggested by the AI without requiring manual confirmation.</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-primary mb-1">Auto-approve terminal</h4>
              <p className="text-sm text-muted-foreground">Automatically accepts terminal command executions run by the AI.</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-primary mb-1">Auto-approve MCP tools</h4>
              <p className="text-sm text-muted-foreground">Automatically accepts MCP (Model Context Protocol) tool calls made by the AI.</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-primary mb-1">Fix lint errors</h4>
              <p className="text-sm text-muted-foreground">Automatically fixes lint errors detected in your code without asking for confirmation.</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-primary mb-1">Auto-accept LLM changes</h4>
              <p className="text-sm text-muted-foreground">Automatically accepts all changes made by the LLM during conversations and edits.</p>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="autocompacting" ref={(el) => { sectionRefs.current['autocompacting'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Autocompacting</h2>
          <p className="text-muted-foreground mb-6">
            Edlide automatically manages context window efficiency when it reaches 80% capacity.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-primary">Threshold Reached</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  When context window reaches 80%, the auto-compacting mechanism triggers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-primary">Summarization</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  The entire chat session is summarized to preserve key information.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-primary">New Session</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  A fresh session opens with the summarized context for better performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="context-window" ref={(el) => { sectionRefs.current['context-window'] = el }} className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Context Window</h2>
          <p className="text-muted-foreground mb-6">
            Monitor your real-time context window usage in the chat interface.
          </p>

          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">
              Hover over the context window indicator in the chat for <strong>2+ seconds</strong> to 
              see your real-time context usage. This helps you understand when auto-compacting 
              will be triggered.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}