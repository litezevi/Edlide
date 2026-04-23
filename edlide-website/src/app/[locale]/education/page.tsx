'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { BookOpen, Download, CreditCard, Users } from 'lucide-react'

const sections = [
  { icon: BookOpen, key: 'docs', href: '/docs' },
  { icon: Download, key: 'download', href: '/download' },
  { icon: CreditCard, key: 'pricing', href: '/pricing' },
  { icon: Users, key: 'team', href: '/team' },
]

export default function EducationPage() {
  const t = useTranslations('education')
  const locale = useLocale()

  const localePath = (path: string) => `/${locale}${path}`

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">{t('title')}</h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.key}
              href={localePath(section.href)}
              className="group rounded-xl border border-border bg-secondary/20 p-6 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <section.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t(`${section.key}Title`)}</h2>
              <p className="text-sm text-muted-foreground">{t(`${section.key}Desc`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
