'use client'

import { CheckCircle2, Play, Circle, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Lesson } from '@/lib/course-data'

interface TopicSidebarProps {
  lesson: Lesson
  activeTopicId: string
  completedTopics: Set<string>
  onTopicSelect: (topicId: string) => void
}

export function TopicSidebar({ lesson, activeTopicId, completedTopics, onTopicSelect }: TopicSidebarProps) {
  const t = useTranslations('education')

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm mb-1">{t(lesson.titleKey)}</h3>
        <p className="text-xs text-muted-foreground">
          {lesson.topics.length} {t('topicsLabel')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {lesson.topics.map((topic) => {
          const isActive = topic.id === activeTopicId
          const isCompleted = completedTopics.has(topic.id)

          return (
            <button
              key={topic.id}
              onClick={() => onTopicSelect(topic.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : 'hover:bg-secondary/50 border-l-2 border-transparent'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : isActive ? (
                  <Play className="w-4 h-4 text-primary" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isActive ? 'font-medium text-primary' : 'text-foreground'}`}>
                  {t(topic.titleKey)}
                </p>
                {topic.duration ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {topic.duration}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
