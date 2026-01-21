'use client'

import { useState } from 'react'
import Link from 'next/link'

const docsSections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'installation', label: 'Installation' },
      { id: 'quick-start', label: 'Quick Start' },
    ]
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'architecture', label: 'Architecture' },
      { id: 'configuration', label: 'Configuration' },
      { id: 'models', label: 'Model Management' },
    ]
  },
  {
    title: 'API Reference',
    items: [
      { id: 'chat-api', label: 'Chat API' },
      { id: 'authentication', label: 'Authentication' },
      { id: 'endpoints', label: 'Endpoints' },
    ]
  }
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 py-12 px-6 lg:px-12 max-w-4xl">
        <div id="introduction" className="scroll-mt-20">
          <h1 className="text-3xl font-bold text-primary mb-4">Introduction</h1>
          <p className="text-muted-foreground mb-6">
            Edlide is an AI-powered IDE designed specifically for working with open source models. 
            Built on VSCode architecture, it provides a privacy-focused alternative to other AI IDEs 
            by sending messages directly to providers without data retention.
          </p>
          <p className="text-muted-foreground mb-6">
            With Edlide, you get seamless integration with open source AI models, local provider support 
            via Ollama and LM Studio, and enterprise-grade security with no data retention policies.
          </p>
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Open Source First</h3>
              <p className="text-sm text-muted-foreground">
                Focuses exclusively on open source models with direct integration to providers.
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-primary mb-2">Privacy Focused</h3>
              <p className="text-sm text-muted-foreground">
                No data retention - messages sent directly to providers.
              </p>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="installation" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Installation</h2>
          <p className="text-muted-foreground mb-6">
            Edlide is available for macOS and Windows. Download the appropriate installer for your system.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">macOS</h3>
              <div className="border rounded-lg bg-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Download the DMG file for your architecture:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Apple Silicon (M1/M2/M3):</strong> Edlide-1.0.0-arm64.dmg</li>
                  <li>• <strong>Intel Macs:</strong> Edlide-1.0.0-x64.dmg</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Windows</h3>
              <div className="border rounded-lg bg-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Download the installer for your architecture:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Windows 10/11 x64:</strong> edlide-1.0.0-x64.exe</li>
                  <li>• <strong>Windows ARM64:</strong> edlide-1.0.0-arm64.exe</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="quick-start" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Quick Start</h2>
          <p className="text-muted-foreground mb-6">
            Get started with Edlide in just a few steps.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-primary">Create an Account</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign up using email/password or Google OAuth at <Link href="/account" className="text-primary hover:underline">/account</Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-primary">Link Your Chutes Account</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Chutes.ai account to access AI models. Go to your account page and click &quot;Link Chutes Account&quot;.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-primary">Start Chatting</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Navigate to the chat interface and start using AI models powered by Chutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="architecture" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Architecture</h2>
          <p className="text-muted-foreground mb-6">
            Edlide is built on VSCode architecture, providing a familiar experience for developers while adding powerful AI capabilities.
          </p>
          
          <h3 className="text-lg font-semibold text-primary mb-3">Multi-Process Architecture</h3>
          <p className="text-muted-foreground mb-4">
            Like VSCode, Edlide uses a multi-process architecture with proper separation between browser and main processes 
            for security and CSP compliance.
          </p>

          <h3 className="text-lg font-semibold text-primary mb-3">Service-First Design</h3>
          <p className="text-muted-foreground mb-4">
            Services follow a proper dependency injection pattern with React components for the UI layer.
          </p>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="configuration" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Configuration</h2>
          <p className="text-muted-foreground mb-6">
            Configure Edlide to suit your development workflow.
          </p>

          <h3 className="text-lg font-semibold text-primary mb-3">Environment Variables</h3>
          <div className="border rounded-lg bg-card p-4 mb-6">
            <pre className="text-sm text-muted-foreground overflow-x-auto">
{`# Supabase (required for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Chutes OAuth (required for AI chat)
NEXT_PUBLIC_CHUTES_CLIENT_ID=your-client-id
CHUTES_CLIENT_SECRET=your-client-secret

# Token Encryption (required for production)
CHUTES_ENCRYPTION_KEY=your-encryption-key`}
            </pre>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="models" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Model Management</h2>
          <p className="text-muted-foreground mb-6">
            Edlide supports a variety of open source models through the Chutes integration.
          </p>

          <h3 className="text-lg font-semibold text-primary mb-3">Supported Providers</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>• <strong>Chutes.ai</strong> - Primary AI provider with many open source models</li>
            <li>• <strong>Ollama</strong> - Run models locally</li>
            <li>• <strong>LM Studio</strong> - Local model support</li>
          </ul>

          <h3 className="text-lg font-semibold text-primary mb-3">Popular Models</h3>
          <div className="border rounded-lg bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-3 font-medium text-primary">Model</th>
                  <th className="text-left p-3 font-medium text-primary">Size</th>
                  <th className="text-left p-3 font-medium text-primary">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">Qwen/Qwen3-32B</td>
                  <td className="p-3 text-muted-foreground">32B</td>
                  <td className="p-3 text-muted-foreground">Instruction-tuned</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">Llama-3-70B</td>
                  <td className="p-3 text-muted-foreground">70B</td>
                  <td className="p-3 text-muted-foreground">Instruct</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">Mistral-7B</td>
                  <td className="p-3 text-muted-foreground">7B</td>
                  <td className="p-3 text-muted-foreground">Instruct v0.1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="chat-api" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Chat API</h2>
          <p className="text-muted-foreground mb-6">
            Use the Chat API to integrate AI capabilities into your workflow.
          </p>

          <h3 className="text-lg font-semibold text-primary mb-3">Authentication</h3>
          <p className="text-muted-foreground mb-3">
            All API requests require a Supabase session token in the Authorization header:
          </p>
          <div className="border rounded-lg bg-card p-4 mb-6">
            <pre className="text-sm text-muted-foreground overflow-x-auto">
{`Authorization: Bearer <supabase-session-token>`}
            </pre>
          </div>

          <h3 className="text-lg font-semibold text-primary mb-3">Request Format</h3>
          <div className="border rounded-lg bg-card p-4">
            <pre className="text-sm text-muted-foreground overflow-x-auto">
{`POST /api/chat
Content-Type: application/json

{
  "message": "Your question here",
  "model": "Qwen/Qwen3-32B"
}`}
            </pre>
          </div>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="authentication" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Authentication</h2>
          <p className="text-muted-foreground mb-6">
            Edlide uses a dual authentication system for maximum flexibility.
          </p>

          <h3 className="text-lg font-semibold text-primary mb-3">Supabase Auth</h3>
          <p className="text-muted-foreground mb-3">
            Primary authentication for the application:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground mb-6">
            <li>• Email/password registration and sign-in</li>
            <li>• Google OAuth integration</li>
            <li>• Password reset via email</li>
            <li>• Automatic session management and refresh</li>
          </ul>

          <h3 className="text-lg font-semibold text-primary mb-3">Chutes OAuth</h3>
          <p className="text-muted-foreground mb-3">
            Secondary authentication for AI model access:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground mb-6">
            <li>• OAuth2 + OpenID Connect flow</li>
            <li>• Linked 1-to-1 with Supabase accounts</li>
            <li>• Tokens stored encrypted in database</li>
            <li>• Automatic token refresh</li>
          </ul>
        </div>

        <hr className="my-12 border-border/50" />

        <div id="endpoints" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-primary mb-4">Endpoints</h2>
          <p className="text-muted-foreground mb-6">
            Complete reference for all API endpoints.
          </p>

          <div className="space-y-6">
            <div className="border rounded-lg bg-card p-4">
              <h4 className="font-semibold text-primary mb-2">POST /api/auth/signup</h4>
              <p className="text-sm text-muted-foreground mb-3">Register a new user account.</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`Body: { "email": "user@example.com", "password": "secure-password", "fullName": "John Doe" }`}
              </pre>
            </div>

            <div className="border rounded-lg bg-card p-4">
              <h4 className="font-semibold text-primary mb-2">POST /api/auth/signin</h4>
              <p className="text-sm text-muted-foreground mb-3">Sign in with email/password.</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`Body: { "email": "user@example.com", "password": "secure-password" }`}
              </pre>
            </div>

            <div className="border rounded-lg bg-card p-4">
              <h4 className="font-semibold text-primary mb-2">POST /api/chat</h4>
              <p className="text-sm text-muted-foreground mb-3">Send a message to the AI model.</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`Headers: Authorization: Bearer <supabase-token>
Body: { "message": "Hello", "model": "Qwen/Qwen3-32B" }`}
              </pre>
            </div>

            <div className="border rounded-lg bg-card p-4">
              <h4 className="font-semibold text-primary mb-2">GET /api/auth/chutes/unlink</h4>
              <p className="text-sm text-muted-foreground mb-3">Check Chutes account linkage status.</p>
            </div>

            <div className="border rounded-lg bg-card p-4">
              <h4 className="font-semibold text-primary mb-2">DELETE /api/auth/chutes/unlink</h4>
              <p className="text-sm text-muted-foreground mb-3">Unlink Chutes account from Supabase.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}