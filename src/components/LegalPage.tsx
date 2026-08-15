import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useTelegramBackButton } from '@/lib/telegram-auth'
import '../telescope.css'

type LegalPageProps = {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  useEffect(() => useTelegramBackButton(() => window.history.back()), [])

  return (
    <main className="legal-page tg-safe-top">
      <header className="legal-header">
        <Link to="/" className="legal-back" aria-label="Back to Explore"><ArrowLeft /></Link>
        <img src="/assets/telefans-logo.png" alt="TeleFans" />
        <span aria-hidden="true" />
      </header>
      <article className="legal-content">
        <p className="legal-eyebrow">TeleFans</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updatedAt}</p>
        {children}
      </article>
    </main>
  )
}
