'use client'

import { useTranslations } from 'next-intl'
import { Github, Twitter } from 'lucide-react'

const team = [
  {
    key: 'founder',
    github: 'https://github.com',
    twitter: 'https://x.com',
    avatar: '/avatars/avatar-placeholder.png',
  },
]

export default function TeamPage() {
  const t = useTranslations('team')

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">{t('title')}</h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.key}
              className="rounded-xl border border-border bg-secondary/20 p-6 flex flex-col gap-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border overflow-hidden flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-medium">
                    {t(`members.${member.key}.name`).charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t(`members.${member.key}.name`)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t(`members.${member.key}.role`)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`members.${member.key}.bio`)}
              </p>

              <div className="flex items-center gap-3 mt-auto">
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {member.twitter && (
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="X / Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-border bg-secondary/20 p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">{t('joinTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('joinDesc')}</p>
          <a
            href="mailto:team@edlide.com"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90"
          >
            {t('joinCta')}
          </a>
        </div>
      </div>
    </div>
  )
}
