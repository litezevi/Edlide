"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Mail } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const encodedSubject = encodeURIComponent(subject || "Support Request")
    const encodedBody = encodeURIComponent(
      `Name: ${name}\n\n${message}`
    )
    window.location.href = `mailto:support@edlide.com?subject=${encodedSubject}&body=${encodedBody}`
  }

  const isValid = name.trim() !== "" && message.trim() !== ""

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Fill in the form below and your email client will open with a pre-filled message to{" "}
            <span className="text-foreground font-medium">support@edlide.com</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Clicking &quot;Send Message&quot; will open your default email client with a pre-filled message.
        </p>
      </div>
    </div>
  )
}
