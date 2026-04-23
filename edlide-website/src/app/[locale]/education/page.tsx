'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, GraduationCap } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import { courses } from '@/lib/course-data'
import { CourseCard } from '@/components/education/CourseCard'

export default function EducationPage() {
  const t = useTranslations('education')
  const locale = useLocale()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 gradient-text">
            {t('academyTitle')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('academySubtitle')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {courses.map((mod) => (
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
