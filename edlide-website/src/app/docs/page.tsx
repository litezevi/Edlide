'use client'

import { useState } from 'react'
import Link from 'next/link'

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

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex min-h-screen">
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

      <main className="flex-1 py-12 px-6 lg:px-12 max-w-4xl">
        <div id="about" className="scroll-mt-20">
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

        <hr className="my-12 border-border/50" />

        <div id="installation" className="scroll-mt-20">
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

        <hr className="my-12 border-border/50" />

        <div id="account" className="scroll-mt-20">
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

        <div id="transfer" className="scroll-mt-20">
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

        <div id="available-models" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Available Models</h2>
          <p className="text-muted-foreground mb-6">
            Choose from the best open source AI models.
          </p>

          <div className="border rounded-lg bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-3 font-medium text-primary">Model</th>
                  <th className="text-left p-3 font-medium text-primary">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">deepseek-v3.2</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">glm-4.6</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">glm-4.7</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">mimo-v2-flash</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">minimax-m2.1</td>
                  <td className="p-3 text-muted-foreground">Open Source</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="model-features" className="scroll-mt-20">
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

        <div id="system-prompt" className="scroll-mt-20">
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

        <div id="project-rules" className="scroll-mt-20">
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

        <div id="mcp-setup" className="scroll-mt-20">
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

        <div id="mcp-example" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Example Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Add MCP servers by pasting this configuration into your MCP settings:
          </p>

          <div className="border rounded-lg bg-card p-4 overflow-x-auto">
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

        <hr className="my-12 border-border/50" />

        <div id="apply-settings" className="scroll-mt-20">
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

        <div id="autoapprove" className="scroll-mt-20">
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

        <div id="autocompacting" className="scroll-mt-20">
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

        <div id="context-window" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Context Window</h2>
          <p className="text-muted-foreground mb-6">
            Monitor your real-time context window usage in the chat interface.
          </p>

          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">
              Hover over the context window indicator in the chat for <strong>2+ seconds</strong> 
              to see your real-time context usage. This helps you understand when auto-compacting 
              will be triggered.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}