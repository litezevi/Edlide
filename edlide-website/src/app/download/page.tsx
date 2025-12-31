'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DownloadPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-primary mb-8">Download Edlide IDE</h1>
      
      <div className="mb-8">
        <p className="text-lg text-muted-foreground">
          Get started with Edlide IDE. Choose your platform below and download the latest version.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
              </svg>
              Windows
            </CardTitle>
            <CardDescription>Windows 10 or later</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Download .exe
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              macOS
            </CardTitle>
            <CardDescription>macOS 11.0 or later</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Download .dmg
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Linux
            </CardTitle>
            <CardDescription>Ubuntu 18.04 or later</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Download .AppImage
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}