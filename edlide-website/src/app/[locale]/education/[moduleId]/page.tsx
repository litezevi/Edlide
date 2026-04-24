'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, ArrowLeft, Globe, Smartphone, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { getModule, getVisibleLessons } from '@/lib/course-data'
import { LessonCard } from '@/components/education/LessonCard'

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
}

export default function ModulePage() {
  const t = useTranslations('education')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const moduleId = params.moduleId as string
  const moduleData = getModule(moduleId)
  const visibleLessons = moduleData ? getVisibleLessons(moduleData) : []
  const Icon = moduleData ? iconMap[moduleData.icon] || BookOpen : BookOpen

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

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccess) return null

  if (!moduleData || moduleData.isHidden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Module not found</p>
          <Link href={localePath('/education')} className="text-primary hover:underline">
            Back to Education
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        <Link
          href={localePath('/education')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 sm:mb-8 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToCourses')}
        </Link>

        <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
              {t(moduleData.titleKey)}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t(moduleData.descriptionKey)}
            </p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {visibleLessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              moduleId={moduleId}
              lessonId={lesson.id}
              lessonIndex={index}
              locale={locale}
              completedTopics={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
