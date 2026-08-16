import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Coins, Heart, House, Send, Share2, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { normalizeCreatorHandle } from '@/data/creators'
import { authenticateTelegramMiniApp, type TelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
import { listFollowedCreators } from '@/lib/admin-repository'
import { PrimaryBottomNav } from '@/components/PrimaryBottomNav'
import { supabase } from '@/lib/supabase'
import '../telescope.css'

const miaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'

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

type ProfileSync = { bio?: string; profilePhotoUrl?: string; coinsBalance?: number; referralCount?: number }


export function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramAuthState, setTelegramAuthState] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'>('idle')
  const [shared, setShared] = useState(false)
  const [coinsHelp, setCoinsHelp] = useState(false)
  const [homeAdded, setHomeAdded] = useState(false)
  const [profileSync, setProfileSync] = useState<ProfileSync>({})
  const [following, setFollowing] = useState<Array<{ creator_id: string; creators: any }>>([])
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
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
          void supabase.from('telegram_users').select('bio, profile_photo_url, coins_balance, referral_count').eq('telegram_id', user.id).maybeSingle().then(({ data }) => {
            if (!data) return
            setProfileSync({ bio: data.bio ?? '', profilePhotoUrl: data.profile_photo_url ?? '', coinsBalance: data.coins_balance ?? 0, referralCount: data.referral_count ?? 0 })
            setCoinsBalance(data.coins_balance ?? 0)
            setReferralCount(data.referral_count ?? 0)
          })
        }
      })
      .catch(() => active && setTelegramAuthState('error'))
    return () => { active = false; cleanupBackButton() }
  }, [])

  const displayName = telegramUser?.first_name || 'W'
  const displayHandle = telegramUser?.username ? `@${telegramUser.username}` : '@wvvtr'
  const displayBio = profileSync.bio || ''
  const profilePhoto = profileSync.profilePhotoUrl || telegramUser?.photo_url
  const displayCoins = profileSync.coinsBalance ?? coinsBalance
  const displayReferrals = profileSync.referralCount ?? referralCount
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName])

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
    // Keep the instruction in-app so Safari/Telegram cannot replace it with a localized native prompt.
    setHomeAdded(true)
    window.setTimeout(() => setHomeAdded(false), 4200)
  }

  return <main className="user-profile-page" data-telegram-user-id={telegramUser?.id ?? undefined}>
    <span className="sr-only" role="status" aria-live="polite">
      {telegramAuthState === 'connected' && `Connected as ${displayName}.`}
      {telegramAuthState === 'connecting' && 'Connecting to your Telegram account...'}
      {telegramAuthState === 'error' && 'Could not connect to your Telegram account.'}
    </span>
    <div className="user-profile-frame">
      <div className="user-profile-scroll">
        <div className="user-profile-titlebar"><Link to="/" className="user-profile-back" aria-label="Back to Explore"><ArrowLeft /></Link><h1 className="user-profile-title">Profile</h1><span aria-hidden="true" /></div>
        <section className="user-identity">
          <div className="user-avatar" aria-label={`Avatar of ${displayName}`}>{profilePhoto ? <img src={profilePhoto} alt="" /> : initials}</div>
          <h2>{displayName}</h2>
          <p>{displayHandle}</p>
          {displayBio && <p className="user-bio">{displayBio}</p>}
        </section>

        <section className="user-metrics" aria-label="Account statistics">
          <div><Sparkles aria-hidden="true" /><strong>0</strong><span>UNLOCKS</span></div>
          <div><Star aria-hidden="true" /><strong>0</strong><span>STARS SPENT</span></div>
          <div><Heart aria-hidden="true" /><strong>{following.length}</strong><span>FOLLOWING</span></div>
        </section>

        <section className="coins-card">
          <div className="coins-card-title"><Coins aria-hidden="true" /><span>FANS COINS BALANCE</span><strong aria-label={`Fans Coins balance: ${displayCoins}`}>{displayCoins}</strong><button type="button" aria-label="About Fans Coins" onClick={() => setCoinsHelp(value => !value)}>?</button></div>
          {coinsHelp && <p className="coins-help">Fans Coins can be used to unlock content and support creators.</p>}
        </section>

        <button type="button" className="user-action-row" onClick={shareProfile}>
          <Send aria-hidden="true" />
          <span><strong>Invite a friend</strong><small>Earn 2 Coins when a friend joins through your link</small></span>
          <b>Share</b>
        </button>
        <button type="button" className="user-action-row user-home-row" onClick={addToHomeScreen}>
          <House aria-hidden="true" />
          <span><strong>Add to home screen</strong><small>{homeAdded ? 'Open your browser menu and choose “Add to Home Screen”' : 'Save TeleFans for faster access'}</small></span>
          <ChevronRight aria-hidden="true" />
        </button>

        <p className="referral-summary" aria-live="polite">{displayReferrals} {displayReferrals === 1 ? 'friend has' : 'friends have'} joined through your link</p>

        <section className="unlock-section">
          <div className="user-section-heading"><div><small>PURCHASE HISTORY</small><h2>Recent unlocks</h2></div><b>0</b></div>
          <div className="unlock-empty"><span><Sparkles aria-hidden="true" /></span><strong>No unlocks yet</strong><p>Once you unlock premium media with Telegram Stars, your latest purchases appear here.</p></div>
        </section>

        <section className="following-section">
          <div className="user-section-heading"><div><small>FOLLOWING</small><h2>Following</h2></div><b>{following.length}</b></div>
          <div className="following-grid">{following.map((item) => { const creator = item.creators; return <Link key={item.creator_id} to="/creator/$slug" params={{ slug: creator?.slug ?? '' }} className="following-card"><img src={creator?.avatar_image ?? miaImage} alt={creator?.name ?? ''} /><span className="following-shade" /><div><strong>{creator?.name ?? 'Creator'}</strong><span>{creator?.handle ? normalizeCreatorHandle(creator.handle) : ''}</span></div><em>0<br />LIKES</em></Link> })}{following.length === 0 && <p className="user-empty-following">You are not following any creators yet.</p>}</div>
        </section>
        <div className="user-profile-bottom-space" />
      </div>
      {shared && <div className="user-share-toast"><Share2 aria-hidden="true" /> Link copied/shared</div>}
    </div>
    <PrimaryBottomNav active="profile" />
  </main>
}

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Profile · TeleFans' }, { name: 'description', content: 'Your TeleFans user profile.' }] }),
  component: ProfilePage,
})
