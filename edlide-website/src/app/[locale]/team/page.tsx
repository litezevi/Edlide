'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'

const team = [
  {
    name: 'Aitegin Bek',
    nameRu: 'Айтегин Бек',
    role: 'Founder',
    avatar: '/aitegin.JPG',
  },
]

export default function TeamPage() {
  const t = useTranslations('team')
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">{t('title')}</h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-xl border border-border bg-secondary/20 p-6 flex items-center gap-5 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-border">
                <Image
                  src={member.avatar}
                  alt={member.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">{locale === 'ru' ? member.nameRu : member.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{member.role}</div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  )
}
