'use client'

import Link from 'next/link'
import { Globe, Smartphone, Clock, BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Module } from '@/lib/course-data'
import { getModuleTotalDuration } from '@/lib/course-data'

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
}

interface CourseCardProps {
  moduleData: Module
  moduleId: string
  locale: string
}

export function CourseCard({ moduleData, moduleId, locale }: CourseCardProps) {
  const t = useTranslations('education')
  const Icon = iconMap[moduleData.icon] || BookOpen
  const duration = getModuleTotalDuration(moduleData)
  const localizedDuration = locale === 'ru' ? duration.replace('h', 'ч').replace('m', 'м') : duration
  const lessonCount = moduleData.lessons.length
  const topicCount = moduleData.lessons.reduce((acc, l) => acc + l.topics.length, 0)

  return (
    <Link
      href={`/${locale}/education/${moduleId}`}
      className="group block rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          {localizedDuration ? (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              {localizedDuration}
            </span>
          ) : null}
        </div>

        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {t(moduleData.titleKey)}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
          {t(moduleData.descriptionKey)}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {lessonCount} {t('lessonsLabel')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {topicCount} {t('topicsLabel')}
          </span>
        </div>

      </div>
    </Link>
  )
}
