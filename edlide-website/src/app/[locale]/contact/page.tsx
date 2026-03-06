"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Mail } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

export default function ContactPage() {
  const t = useTranslations('contact')
  const locale = useLocale()
  const lp = (path: string) => locale === 'ru' ? path : `/${locale}${path}`
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const encodedSubject = encodeURIComponent(subject || "Support Request")
    const encodedBody = encodeURIComponent(`Name: ${name}\n\n${message}`)
    window.location.href = `mailto:support@edlide.com?subject=${encodedSubject}&body=${encodedBody}`
  }

  const isValid = name.trim() !== "" && message.trim() !== ""

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Link
          href={lp('/')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              {t('nameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
              {t('subjectLabel')}
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              {t('messageLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {t('sendButton')}
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          {t('sendNote')}
        </p>
      </div>
    </div>
  )
}
