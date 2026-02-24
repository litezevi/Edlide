import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Edlide IDE - IDE and CLI built for open-source AI models',
    template: '%s | Edlide IDE',
  },
  description: 'Open source AI models have caught up to closed alternatives and cost 10x less. Break free from closed AI ecosystems.',
  keywords: ['edlide', 'ide', 'ai', 'open source', 'code editor', 'ai assistant', 'minimax', 'glm', 'kimi'],
  authors: [{ name: 'Edlide' }],
  creator: 'Edlide',
  publisher: 'Edlide',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://edlide.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Edlide IDE - IDE and CLI built for open-source AI models',
    description: 'Open source AI models have caught up to closed alternatives and cost 10x less. Break free from closed AI ecosystems.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Edlide',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edlide IDE - IDE and CLI built for open-source AI models',
    description: 'Open source AI models have caught up to closed alternatives and cost 10x less. Break free from closed AI ecosystems.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('edlide-theme');
                  var isDark = stored === 'dark';
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
