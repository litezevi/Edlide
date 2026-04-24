'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Play, Circle, Clock } from 'lucide-react'
import Link from 'next/link'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { getModule, getLesson, getTopic, getNextTopic, getPrevTopic, getVisibleTopics } from '@/lib/course-data'
import { VideoPlayer } from '@/components/education/VideoPlayer'
import { TopicSidebar } from '@/components/education/TopicSidebar'
import { getCachedVideo, cacheVideoFromUrl, hasCachedVideo } from '@/lib/video-cache'

interface PresignedCacheEntry {
  url: string
  expiresAt: number
}

const presignedCache = new Map<string, PresignedCacheEntry>()
const PRESIGNED_TTL_MS = 14 * 60 * 1000

async function getPresignedUrl(topicId: string, accessToken: string): Promise<string | null> {
  const cached = presignedCache.get(topicId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  try {
    const response = await fetch(`/api/education/video?topicId=${encodeURIComponent(topicId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return null
    const payload = await response.json()
    const url = payload.url || ''
    if (url) {
      presignedCache.set(topicId, { url, expiresAt: Date.now() + PRESIGNED_TTL_MS })
    }
    return url
  } catch {
    return null
  }
}

export default function LessonPage() {
  const t = useTranslations('education')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeTopicId, setActiveTopicId] = useState<string>('')
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false)
  const prefetchRef = useRef(false)

  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string
  const moduleData = getModule(moduleId)
  const lessonData = getLesson(moduleId, lessonId)
  const visibleTopics = lessonData ? getVisibleTopics(lessonData) : []
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
    if (lessonData && visibleTopics.length > 0 && !activeTopicId) {
      setActiveTopicId(visibleTopics[0].id)
    }
  }, [lessonData, visibleTopics, activeTopicId])

  const handleTopicSelect = useCallback((topicId: string) => {
    setActiveTopicId(topicId)
    setMobileTopicsOpen(false)
  }, [])

  const handleVideoComplete = useCallback(() => {}, [])

  const nextTopic = activeTopicId ? getNextTopic(moduleId, lessonId, activeTopicId) : null
  const prevTopic = activeTopicId ? getPrevTopic(moduleId, lessonId, activeTopicId) : null

  useEffect(() => {
    const resolveVideoUrl = async () => {
      if (!activeTopicId || !hasAccess || !user) {
        setResolvedVideoUrl('')
        setVideoError('')
        return
      }

      const cachedBlobUrl = getCachedVideo(activeTopicId)
      if (cachedBlobUrl) {
        setResolvedVideoUrl(cachedBlobUrl)
        setVideoError('')
        setVideoLoading(false)
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        setResolvedVideoUrl('')
        setVideoError('Failed to load video')
        return
      }

      setVideoLoading(true)
      setVideoError('')

      try {
        const presignedUrl = await getPresignedUrl(activeTopicId, accessToken)
        if (!presignedUrl) {
          setResolvedVideoUrl('')
          setVideoError('Failed to load video')
          return
        }

        if (hasCachedVideo(activeTopicId)) {
          setResolvedVideoUrl(getCachedVideo(activeTopicId) || '')
          setVideoLoading(false)
          return
        }

        const blobUrl = await cacheVideoFromUrl(activeTopicId, presignedUrl)
        setResolvedVideoUrl(blobUrl)
      } catch {
        setResolvedVideoUrl('')
        setVideoError('Failed to load video')
      } finally {
        setVideoLoading(false)
      }
    }

    resolveVideoUrl()
  }, [activeTopicId, hasAccess, user])

  useEffect(() => {
    if (!activeTopicId || !hasAccess || !user || prefetchRef.current) return

    const prefetchNext = async () => {
      const next = getNextTopic(moduleId, lessonId, activeTopicId)
      if (!next) return
      if (hasCachedVideo(next.topicId)) return

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) return

      try {
        const presignedUrl = await getPresignedUrl(next.topicId, accessToken)
        if (presignedUrl) {
          const result = await cacheVideoFromUrl(next.topicId, presignedUrl)
          if (result === presignedUrl) return
        }
      } catch {}
    }

    prefetchRef.current = true
    if (!videoLoading && resolvedVideoUrl) {
      const timer = setTimeout(prefetchNext, 5000)
      return () => clearTimeout(timer)
    }
  }, [activeTopicId, hasAccess, user, moduleId, lessonId, videoLoading, resolvedVideoUrl])

  useEffect(() => {
    prefetchRef.current = false
  }, [activeTopicId])

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccess) return null

  if (!moduleData || moduleData.isHidden || !lessonData || lessonData.isHidden) {
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
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground overflow-hidden">
          <Link
            href={localePath('/education')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            {t('courses')}
          </Link>
          <span className="shrink-0">/</span>
          <Link
            href={localePath(`/education/${moduleId}`)}
            className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[200px]"
          >
            {t(moduleData.titleKey)}
          </Link>
          <span className="shrink-0">/</span>
          <span className="text-foreground truncate max-w-[120px] sm:max-w-[200px]">
            {t(lessonData.titleKey)}
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <VideoPlayer
              src={resolvedVideoUrl || activeTopic?.videoUrl || undefined}
              title={activeTopic ? t(activeTopic.titleKey) : ''}
              onComplete={handleVideoComplete}
            />

            {videoLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading video...</p>
            ) : null}
            {videoError ? (
              <p className="mt-2 text-sm text-red-500">{videoError}</p>
            ) : null}

            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {activeTopic && (
                  <>
                    <h2 className="text-base sm:text-lg font-semibold truncate">
                      {t(activeTopic.titleKey)}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {activeTopic.duration ? `${t(lessonData.titleKey)} · ${activeTopic.duration}` : t(lessonData.titleKey)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {activeTopic?.id === 'topic-1-1-5' ? (
              <div className="mt-3 sm:mt-4 rounded-xl border border-border bg-card p-3 sm:p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t('topic1_1_5AssignmentTitle')}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t('topic1_1_5AssignmentStep1')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('topic1_1_5AssignmentStep2')}</p>
              </div>
            ) : null}

            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              {prevTopic ? (
                <Link
                  href={localePath(`/education/${prevTopic.moduleId}/${prevTopic.lessonId}`)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
                  onClick={() => setActiveTopicId(prevTopic.topicId)}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{t('previous')}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextTopic ? (
                <Link
                  href={localePath(`/education/${nextTopic.moduleId}/${nextTopic.lessonId}`)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors min-h-[44px] px-2"
                  onClick={() => setActiveTopicId(nextTopic.topicId)}
                >
                  <span className="hidden sm:inline">{t('next')}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              ) : (
                <Link
                  href={localePath(`/education/${moduleId}`)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-sm text-green-500 hover:text-green-400 font-medium transition-colors min-h-[44px] px-2"
                >
                  {t('backToModule')}
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              )}
            </div>

            <div className="lg:hidden mt-3 sm:mt-4">
              <button
                onClick={() => setMobileTopicsOpen(!mobileTopicsOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors min-h-[44px]"
              >
                <span className="text-sm font-medium">
                  {t('topicsLabel')} ({visibleTopics.length})
                </span>
                {mobileTopicsOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {mobileTopicsOpen && (
                <div className="mt-1 rounded-xl border border-border bg-card overflow-hidden">
                  {visibleTopics.map((topic) => {
                    const isActive = topic.id === activeTopicId
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicSelect(topic.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-secondary/50 border-l-2 border-transparent'
                        }`}
                      >
                        <div className="shrink-0">
                          {isActive ? (
                            <Play className="w-4 h-4 text-primary" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug truncate ${isActive ? 'font-medium text-primary' : 'text-foreground'}`}>
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
