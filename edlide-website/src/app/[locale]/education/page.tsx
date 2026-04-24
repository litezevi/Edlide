'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, GraduationCap } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { getVisibleModules } from '@/lib/course-data'
import { CourseCard } from '@/components/education/CourseCard'

export default function EducationPage() {
  const t = useTranslations('education')
  const locale = useLocale()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const localePath = (path: string) => `/${locale}${path}`
  const visibleModules = getVisibleModules()

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="mb-8 sm:mb-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3 gradient-text">
            {t('academyTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2">
            {t('academySubtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {visibleModules.map((mod) => (
            <CourseCard
              key={mod.id}
              moduleData={mod}
              moduleId={mod.id}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
