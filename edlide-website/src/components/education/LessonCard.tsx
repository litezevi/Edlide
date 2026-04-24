'use client'

import Link from 'next/link'
import { Clock, Play, CheckCircle2, BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Lesson } from '@/lib/course-data'
import { getLessonTotalDuration } from '@/lib/course-data'

interface LessonCardProps {
  lesson: Lesson
  moduleId: string
  lessonId: string
  lessonIndex: number
  locale: string
  completedTopics?: number
}

export function LessonCard({ lesson, moduleId, lessonId, lessonIndex, locale, completedTopics = 0 }: LessonCardProps) {
  const t = useTranslations('education')
  const duration = getLessonTotalDuration(lesson)
  const localizedDuration = locale === 'ru' ? duration.replace('h', 'ч').replace('m', 'м') : duration
  const topicCount = lesson.topics.length
  const isComplete = completedTopics >= topicCount
  const progress = topicCount > 0 ? Math.round((completedTopics / topicCount) * 100) : 0

  return (
    <Link
      href={`/${locale}/education/${moduleId}/${lessonId}`}
      className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 hover:bg-secondary/20 min-h-[44px]"
    >
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        isComplete
          ? 'bg-green-500/10 text-green-500'
          : progress > 0
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary text-muted-foreground'
      }`}>
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <span className="text-sm font-semibold">{lessonIndex + 1}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-medium mb-0.5 sm:mb-1 group-hover:text-primary transition-colors">
          {t(lesson.titleKey)}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5 sm:mb-2">
          {t(lesson.descriptionKey)}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {topicCount} {t('topicsLabel')}
          </span>
          {localizedDuration ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {localizedDuration}
            </span>
          ) : null}
          {progress > 0 && !isComplete && (
            <span className="text-primary font-medium">{progress}%</span>
          )}
        </div>
      </div>

      <div className="shrink-0 self-center">
        <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  )
}
