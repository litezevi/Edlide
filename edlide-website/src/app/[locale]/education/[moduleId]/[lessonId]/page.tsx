'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { getModule, getLesson, getTopic, getNextTopic, getPrevTopic } from '@/lib/course-data'
import { VideoPlayer } from '@/components/education/VideoPlayer'
import { TopicSidebar } from '@/components/education/TopicSidebar'

export default function LessonPage() {
  const t = useTranslations('education')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeTopicId, setActiveTopicId] = useState<string>('')

  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string
  const moduleData = getModule(moduleId)
  const lessonData = getLesson(moduleId, lessonId)
  const activeTopic = activeTopicId ? getTopic(moduleId, lessonId, activeTopicId) : null

  const localePath = (path: string) => `/${locale}${path}`

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) {
        router.replace(localePath('/account'))
        return
      }
      const { data } = await supabase
        .from('education_access')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data) {
        router.replace(localePath('/account'))
        return
      }
      setHasAccess(true)
      setChecking(false)
    }
    checkAccess()
  }, [user, authLoading, locale, router])

  useEffect(() => {
    if (lessonData && lessonData.topics.length > 0 && !activeTopicId) {
      setActiveTopicId(lessonData.topics[0].id)
    }
  }, [lessonData, activeTopicId])

  const handleTopicSelect = useCallback((topicId: string) => {
    setActiveTopicId(topicId)
  }, [])

  const handleVideoComplete = useCallback(() => {}, [])

  const nextTopic = activeTopicId ? getNextTopic(moduleId, lessonId, activeTopicId) : null
  const prevTopic = activeTopicId ? getPrevTopic(moduleId, lessonId, activeTopicId) : null

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccess) return null

  if (!moduleData || !lessonData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Lesson not found</p>
          <Link href={localePath('/education')} className="text-primary hover:underline">
            Back to Education
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Link
            href={localePath('/education')}
            className="hover:text-foreground transition-colors"
          >
            {t('courses')}
          </Link>
          <span>/</span>
          <Link
            href={localePath(`/education/${moduleId}`)}
            className="hover:text-foreground transition-colors truncate max-w-[200px]"
          >
            {t(moduleData.titleKey)}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">
            {t(lessonData.titleKey)}
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <VideoPlayer
              src={activeTopic?.videoUrl || ''}
              title={activeTopic ? t(activeTopic.titleKey) : ''}
              onComplete={handleVideoComplete}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {activeTopic && (
                  <>
                    <h2 className="text-lg font-semibold truncate">
                      {t(activeTopic.titleKey)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(lessonData.titleKey)} · {activeTopic.duration}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('manualProgressNote')}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {prevTopic ? (
                <Link
                  href={localePath(`/education/${prevTopic.moduleId}/${prevTopic.lessonId}`)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setActiveTopicId(prevTopic.topicId)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('previous')}
                </Link>
              ) : (
                <div />
              )}
              {nextTopic ? (
                <Link
                  href={localePath(`/education/${nextTopic.moduleId}/${nextTopic.lessonId}`)}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  onClick={() => setActiveTopicId(nextTopic.topicId)}
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={localePath(`/education/${moduleId}`)}
                  className="inline-flex items-center gap-2 text-sm text-green-500 hover:text-green-400 font-medium transition-colors"
                >
                  {t('backToModule')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-72 shrink-0 rounded-xl border border-border bg-card overflow-hidden">
            <TopicSidebar
              lesson={lessonData}
              activeTopicId={activeTopicId}
              completedTopics={new Set()}
              onTopicSelect={handleTopicSelect}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
