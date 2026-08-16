import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Coins, Heart, House, Pencil, Send, Share2, Sparkles, Star, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { normalizeCreatorHandle } from '@/data/creators'
import { authenticateTelegramMiniApp, type TelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
import { listFollowedCreators } from '@/lib/admin-repository'
import { PrimaryBottomNav } from '@/components/PrimaryBottomNav'
import { supabase } from '@/lib/supabase'
import '../telescope.css'

const miaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'
const bellaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public'
const PROFILE_OVERRIDES_KEY = 'telefans_profile_overrides'

function telegramWebApp() {
  return (window as Window & {
    Telegram?: { WebApp?: {
      close?: () => void
      ready?: () => void
      expand?: () => void
      addToHomeScreen?: () => void
      openTelegramLink?: (url: string) => void
      shareMessage?: (preparedMessageId: string) => void
      initData?: string
    } }
  }).Telegram?.WebApp
}

type ProfileOverrides = { name?: string; username?: string; bio?: string; gender?: string; dateOfBirth?: string; profilePhotoUrl?: string }


export function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramAuthState, setTelegramAuthState] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'>('idle')
  const [shared, setShared] = useState(false)
  const [editing, setEditing] = useState(false)
  const [coinsHelp, setCoinsHelp] = useState(false)
  const [homeAdded, setHomeAdded] = useState(false)
  const [overrides, setOverrides] = useState<ProfileOverrides>({})
  const [draftName, setDraftName] = useState('')
  const [draftUsername, setDraftUsername] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftGender, setDraftGender] = useState('prefer_not_to_say')
  const [draftDateOfBirth, setDraftDateOfBirth] = useState('')
  const [following, setFollowing] = useState<Array<{ creator_id: string; creators: any }>>([])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PROFILE_OVERRIDES_KEY)
      if (stored) setOverrides(JSON.parse(stored) as ProfileOverrides)
    } catch { /* storage pode estar indisponível no Mini App */ }

    let active = true
    const webApp = telegramWebApp()
    const cleanupBackButton = useTelegramBackButton(() => window.history.back())
    webApp?.ready?.()
    webApp?.expand?.()
    setTelegramAuthState('connecting')
    void authenticateTelegramMiniApp()
      .then(user => {
        if (!active) return
        setTelegramUser(user)
        setTelegramAuthState(user ? 'connected' : 'unavailable')
        if (user) {
          void listFollowedCreators(String(user.id)).then(setFollowing).catch(() => setFollowing([]))
          void supabase.from('telegram_users').select('bio, gender, date_of_birth, profile_photo_url').eq('telegram_id', user.id).maybeSingle().then(({ data }) => { if (!data) return; setOverrides(current => ({ ...current, bio: data.bio ?? '', gender: data.gender ?? 'prefer_not_to_say', dateOfBirth: data.date_of_birth ?? '', profilePhotoUrl: data.profile_photo_url ?? '' })) })
        }
      })
      .catch(() => active && setTelegramAuthState('error'))
    return () => { active = false; cleanupBackButton() }
  }, [])

  const displayName = overrides.name || telegramUser?.first_name || 'W'
  const displayHandle = overrides.username ? `@${overrides.username.replace(/^@/, '')}` : telegramUser?.username ? `@${telegramUser.username}` : '@wvvtr'
  const displayBio = overrides.bio || ''
  const profilePhoto = overrides.profilePhotoUrl || telegramUser?.photo_url
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName])

  const openEditor = () => {
    setDraftName(displayName)
    setDraftUsername(displayHandle.replace(/^@/, ''))
    setDraftBio(overrides.bio || '')
    setDraftGender(overrides.gender || 'prefer_not_to_say')
    setDraftDateOfBirth(overrides.dateOfBirth || '')
    setEditing(true)
  }

  const saveEditor = () => {
    const next = { name: draftName.trim() || displayName, username: draftUsername.trim().replace(/^@/, '') || displayHandle.replace(/^@/, ''), bio: draftBio.trim(), gender: draftGender, dateOfBirth: draftDateOfBirth || '' }
    setOverrides(current => ({ ...current, ...next }))
    window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(next))
    if (telegramUser) {
      void supabase.from('telegram_users').update({ first_name: next.name, username: next.username, bio: next.bio, gender: next.gender, date_of_birth: next.dateOfBirth || null }).eq('telegram_id', telegramUser.id)
    }
    setEditing(false)
  }

  const shareProfile = async () => {
    const inviteUrl = `https://t.me/telefans_offbot?startapp=ref_${telegramUser?.id ?? 'guest'}`
    const message = 'I found a Telegram app you are going to love 👀\n\nDiscover TeleFans here:'
    const webApp = telegramWebApp()

    if (webApp?.shareMessage && webApp.initData) {
      const { data, error } = await supabase.functions.invoke<{ ok: boolean; id?: string }>('telegram-share', { body: { initData: webApp.initData, inviteUrl } })
      if (!error && data?.id) {
        webApp.shareMessage(data.id)
        setShared(true)
        window.setTimeout(() => setShared(false), 1800)
        return
      }
    }

    // Older Telegram clients and ordinary browsers keep a safe fallback.
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(message)}`
    if (webApp?.openTelegramLink) webApp.openTelegramLink(telegramShareUrl)
    else void navigator.clipboard?.writeText(`${message}\n${inviteUrl}`)
    setShared(true)
    window.setTimeout(() => setShared(false), 1800)
  }

  const addToHomeScreen = () => {
    const webApp = telegramWebApp()
    if (webApp?.addToHomeScreen) webApp.addToHomeScreen()
    setHomeAdded(true)
    window.setTimeout(() => setHomeAdded(false), 2200)
  }

  return <main className="user-profile-page" data-telegram-user-id={telegramUser?.id ?? undefined}>
    <span className="sr-only" role="status" aria-live="polite">
      {telegramAuthState === 'connected' && `Ligado como ${displayName}.`}
      {telegramAuthState === 'connecting' && 'A ligar à conta Telegram...'}
      {telegramAuthState === 'error' && 'Não foi possível ligar à conta Telegram.'}
    </span>
    <div className="user-profile-frame">
      <div className="user-profile-scroll">
        <div className="user-profile-titlebar"><Link to="/" className="user-profile-back" aria-label="Voltar para Explore"><ArrowLeft /></Link><h1 className="user-profile-title">Profile</h1><span aria-hidden="true" /></div>
        <section className="user-identity">
          <div className="user-avatar" aria-label={`Avatar de ${displayName}`}>{profilePhoto ? <img src={profilePhoto} alt="" /> : initials}</div>
          <h2>{displayName}</h2>
          <p>{displayHandle}</p>
          {displayBio && <p className="user-bio">{displayBio}</p>}
        </section>

        <section className="user-metrics" aria-label="Estatísticas da conta">
          <div><Sparkles aria-hidden="true" /><strong>0</strong><span>UNLOCKS</span></div>
          <div><Star aria-hidden="true" /><strong>0</strong><span>STARS SPENT</span></div>
          <div><Heart aria-hidden="true" /><strong>{following.length}</strong><span>FOLLOWING</span></div>
        </section>

        <button type="button" className="user-edit-button" onClick={openEditor}><Pencil aria-hidden="true" /> Edit profile</button>
        {editing && <div className="user-edit-panel" role="dialog" aria-label="Editar perfil">
          <div className="user-edit-panel-heading"><strong>Edit profile</strong><button type="button" onClick={() => setEditing(false)} aria-label="Fechar editor"><X /></button></div>
          <label>Nome<input value={draftName} onChange={event => setDraftName(event.target.value)} maxLength={40} /></label>
          <label>Username<input value={draftUsername} onChange={event => setDraftUsername(event.target.value)} maxLength={32} /></label>
          <label>Bio<textarea value={draftBio} onChange={event => setDraftBio(event.target.value)} maxLength={240} placeholder="Tell us a little about yourself..." /></label>
          <label>Gender<select value={draftGender} onChange={event => setDraftGender(event.target.value)}><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option></select></label>
          <label>Date of birth<input type="date" value={draftDateOfBirth} onChange={event => setDraftDateOfBirth(event.target.value)} /></label>
          <button type="button" className="user-edit-save" onClick={saveEditor}>Guardar alterações</button>
        </div>}

        <section className="coins-card">
          <div className="coins-card-title"><Coins aria-hidden="true" /><span>FANS COINS BALANCE</span><button type="button" aria-label="Sobre Fans Coins" onClick={() => setCoinsHelp(value => !value)}>?</button></div>
          <strong>0</strong>
          {coinsHelp && <p className="coins-help">Fans Coins podem ser usados para desbloquear conteúdos e apoiar creators.</p>}
        </section>

        <button type="button" className="user-action-row" onClick={shareProfile}>
          <Send aria-hidden="true" />
          <span><strong>Invite a friend</strong><small>10 Coins when they open TeleFans for the first time</small></span>
          <b>Share</b>
        </button>
        <button type="button" className="user-action-row user-home-row" onClick={addToHomeScreen}>
          <House aria-hidden="true" />
          <span><strong>Add to home screen</strong><small>{homeAdded ? 'Added to your Telegram home screen' : 'Open TeleFans faster'}</small></span>
          <ChevronRight aria-hidden="true" />
        </button>

        <section className="unlock-section">
          <div className="user-section-heading"><div><small>PURCHASE HISTORY</small><h2>Recent unlocks</h2></div><b>0</b></div>
          <div className="unlock-empty"><span><Sparkles aria-hidden="true" /></span><strong>No unlocks yet</strong><p>Once you unlock premium media with Telegram Stars, your latest purchases appear here.</p></div>
        </section>

        <section className="following-section">
          <div className="user-section-heading"><div><small>FOLLOWING</small><h2>Following</h2></div><b>{following.length}</b></div>
          <div className="following-grid">{following.map((item) => { const creator = item.creators; return <Link key={item.creator_id} to="/creator/$slug" params={{ slug: creator?.slug ?? '' }} className="following-card"><img src={creator?.avatar_image ?? miaImage} alt={creator?.name ?? ''} /><span className="following-shade" /><div><strong>{creator?.name ?? 'Creator'}</strong><span>{creator?.handle ? normalizeCreatorHandle(creator.handle) : ''}</span></div><em>0<br />LIKES</em></Link> })}{following.length === 0 && <p className="user-empty-following">Ainda não segue nenhum creator.</p>}</div>
        </section>
        <div className="user-profile-bottom-space" />
      </div>
      {shared && <div className="user-share-toast"><Share2 aria-hidden="true" /> Link copied/shared</div>}
    </div>
    <PrimaryBottomNav active="profile" />
  </main>
}

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Profile · TeleFans' }, { name: 'description', content: 'Perfil do utilizador TeleFans.' }] }),
  component: ProfilePage,
})
