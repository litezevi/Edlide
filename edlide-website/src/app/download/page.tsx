'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Loader2, Copy, Check } from 'lucide-react'

export default function DownloadPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [isLight, setIsLight] = useState(false)
  const [copied, setCopied] = useState(false)

  const cliCommand = 'curl -fsSL https://github.com/litezevi/edlide-cli-releases/releases/latest/download/install | bash'

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.classList.contains('light'))
    }
    checkTheme()
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const windowsLogo = isLight ? '/windowsLogoLight.png' : '/windowsLogoDark.png'

  const handleDownload = async (file: string) => {
    setLoading(file)
    try {
      const res = await fetch(`/api/download?file=${file}`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-primary mb-8">Download  </h1>

      <div className="mb-8">
        <p className="text-lg text-muted-foreground">
          Choose your platform below
        </p>
      </div>

      <h2 className="text-2xl font-semibold text-primary mb-6">IDE</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <h2 className="text-xl font-semibold text-primary">Windows (10 or later, 64-bit)</h2>
        <h2 className="text-xl font-semibold text-primary text-right">macOS (11.0 or later)</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
<img src={windowsLogo} alt="Windows" className="w-[26px] h-[26px] object-contain" />
              Windows x64 <span className="text-sm font-normal text-muted-foreground ml-2">v1.0.7</span> <span className="text-xs text-green-400 ml-2">stable</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-xs">February 20, 2026</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 mt-auto">
            <Button
              className="w-full text-black"
              size="lg"
              onClick={() => handleDownload('win64')}
              disabled={loading === 'win64'}
            >
              {loading === 'win64' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download .exe (Intel)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              macOS ARM <span className="text-sm font-normal text-muted-foreground ml-2">v1.0.7</span> <span className="text-xs text-green-400 ml-2">stable</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-xs">February 20, 2026</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 mt-auto">
            <Button
              className="w-full text-black"
              size="lg"
              onClick={() => handleDownload('arm64')}
              disabled={loading === 'arm64'}
            >
              {loading === 'arm64' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download .dmg (ARM)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <img src={windowsLogo} alt="Windows" className="w-[26px] h-[26px] object-contain" />
              Windows ARM <span className="text-sm font-normal text-muted-foreground ml-2">v1.0.7</span> <span className="text-xs text-green-400 ml-2">stable</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-xs">February 20, 2026</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 mt-auto">
            <Button
              className="w-full text-black"
              size="lg"
              onClick={() => handleDownload('winarm64')}
              disabled={loading === 'winarm64'}
            >
              {loading === 'winarm64' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download .exe (ARM)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              macOS Intel <span className="text-sm font-normal text-muted-foreground ml-2">v1.0.7</span> <span className="text-xs text-green-400 ml-2">stable</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-xs">February 20, 2026</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 mt-auto">
            <Button
              className="w-full text-black"
              size="lg"
              onClick={() => handleDownload('x64')}
              disabled={loading === 'x64'}
            >
              {loading === 'x64' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download .dmg (Intel)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold text-primary mb-6">CLI</h2>

      <div className="mb-12 p-6 rounded-lg bg-surface border border-border">
        <p className="text-sm text-muted-foreground mb-4">Install Edlide CLI with a single command:</p>
        <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
          <code className="flex-1 font-mono text-sm text-primary select-all break-all">
            {cliCommand}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-[#9ca3af] hover:bg-transparent transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-muted-foreground" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

        <div className="mt-12 p-6 rounded-lg bg-surface border border-border">
        <h3 className="text-lg font-semibold text-primary mb-4">System Requirements</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-primary mb-2">Windows</p>
            Windows 10 or later (64-bit)<br />
            1.6 GHz or faster processor<br />
            1 GB of RAM<br />
            1 GB disk space
          </div>
          <div>
            <p className="font-medium text-primary mb-2">macOS</p>
            macOS 11.0 or later<br />
            Apple Silicon or Intel processor<br />
            1 GB of RAM<br />
            1 GB disk space
          </div>
        </div>
      </div>

    </div>
  )
}
