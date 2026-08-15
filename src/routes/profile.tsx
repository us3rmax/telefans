import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, ChevronRight, Coins, Ellipsis, Heart, House, Pencil, Send, Share2, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { authenticateTelegramMiniApp, type TelegramUser } from '@/lib/telegram-auth'
import '../telescope.css'

const miaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'
const bellaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public'

function Verified() {
  return <span className="user-verified" aria-label="Verificada"><Check /></span>
}

function TelegramClose() {
  const close = () => {
    const webApp = (window as Window & { Telegram?: { WebApp?: { close?: () => void } } }).Telegram?.WebApp
    if (webApp?.close) webApp.close()
    else window.history.back()
  }
  return <button type="button" className="user-close" onClick={close}><ArrowLeft /> <span>Fechar</span></button>
}

export function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramAuthState, setTelegramAuthState] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'>('idle')
  const [shared, setShared] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let active = true
    setTelegramAuthState('connecting')
    void authenticateTelegramMiniApp()
      .then(user => {
        if (!active) return
        setTelegramUser(user)
        setTelegramAuthState(user ? 'connected' : 'unavailable')
      })
      .catch(() => active && setTelegramAuthState('error'))
    return () => { active = false }
  }, [])

  const displayName = telegramUser?.first_name || 'W'
  const displayHandle = telegramUser?.username ? `@${telegramUser.username}` : '@wvvtr'
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName])

  const shareProfile = async () => {
    try { await navigator.clipboard?.writeText(window.location.href) } finally {
      setShared(true)
      window.setTimeout(() => setShared(false), 1800)
    }
  }

  return <main className="user-profile-page" data-telegram-user-id={telegramUser?.id ?? undefined}>
    <span className="sr-only" role="status" aria-live="polite">
      {telegramAuthState === 'connected' && `Ligado como ${displayName}.`}
      {telegramAuthState === 'connecting' && 'A ligar à conta Telegram...'}
      {telegramAuthState === 'error' && 'Não foi possível ligar à conta Telegram.'}
    </span>
    <div className="user-profile-frame">
      <header className="user-profile-topbar">
        <TelegramClose />
        <h1>Profile</h1>
        <button type="button" className="user-menu" aria-label="Mais opções"><Ellipsis /></button>
      </header>

      <div className="user-profile-scroll">
        <section className="user-identity">
          <div className="user-avatar" aria-label={`Avatar de ${displayName}`}>{telegramUser?.photo_url ? <img src={telegramUser.photo_url} alt="" /> : initials}</div>
          <h2>{displayName}</h2>
          <p>{displayHandle}</p>
        </section>

        <section className="user-metrics" aria-label="Estatísticas da conta">
          <div><Sparkles /><strong>0</strong><span>UNLOCKS</span></div>
          <div><Star /><strong>0</strong><span>STARS SPENT</span></div>
          <div><Heart /><strong>3</strong><span>FOLLOWING</span></div>
        </section>

        <button type="button" className="user-edit-button" onClick={() => setEditing(value => !value)}><Pencil /> {editing ? 'Done' : 'Edit profile'}</button>
        {editing && <div className="user-edit-note" role="status">O editor de perfil será ligado ao cadastro Telegram na próxima etapa.</div>}

        <section className="coins-card">
          <div className="coins-card-title"><Coins /> <span>FANS COINS BALANCE</span><button type="button" aria-label="Sobre Fans Coins">?</button></div>
          <strong>0</strong>
        </section>

        <section className="user-action-row">
          <Send />
          <div><strong>Invite a friend</strong><span>10 Coins when they open TeleFans for the first time</span></div>
          <button type="button" onClick={shareProfile}>Share</button>
        </section>
        <section className="user-action-row user-home-row">
          <House />
          <div><strong>Add to home screen</strong><span>Open TeleFans faster</span></div>
          <ChevronRight />
        </section>

        <section className="unlock-section">
          <div className="user-section-heading"><div><small>PURCHASE HISTORY</small><h2>Recent unlocks</h2></div><b>0</b></div>
          <div className="unlock-empty"><span><Sparkles /></span><strong>No unlocks yet</strong><p>Once you unlock premium media with Telegram Stars, your latest purchases appear here.</p></div>
        </section>

        <section className="following-section">
          <div className="user-section-heading"><div><small>FOLLOWING</small><h2>Following</h2></div><b>2</b></div>
          <div className="following-grid">
            <Link to="/creator/$slug" params={{ slug: 'jasmine-jae' }} className="following-card"><img src={miaImage} alt="Mia" /><span className="following-shade" /><div><strong>Mia 🍒</strong><span>@mialov</span></div><em>20<br />LIKES</em></Link>
            <Link to="/creator/$slug" params={{ slug: 'alex-mucci' }} className="following-card"><img src={bellaImage} alt="Bella" /><span className="following-shade" /><div><strong>Bella 🌸</strong><span>@bella</span></div><em>3<br />LIKES</em></Link>
          </div>
        </section>
        <div className="user-profile-bottom-space" />
      </div>
      {shared && <div className="user-share-toast"><Share2 /> Link copied</div>}
    </div>
  </main>
}

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Profile · TeleFans' }, { name: 'description', content: 'Perfil do utilizador TeleFans.' }] }),
  component: ProfilePage,
})
