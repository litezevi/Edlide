import type { Metadata } from 'next'
import './globals.css'

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
  metadataBase: new URL('https://edlide.com'),
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

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

// Root layout — provides html/body shell for all routes.
// Locale-specific layout ([locale]/layout.tsx) wraps with NextIntlClientProvider, Navbar, Footer.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
