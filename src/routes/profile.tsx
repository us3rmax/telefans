import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Coins, Heart, House, Send, Share2, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { normalizeCreatorHandle } from '@/data/creators'
import { authenticateTelegramMiniApp, type TelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
import { listFollowedCreators } from '@/lib/admin-repository'
import { PrimaryBottomNav } from '@/components/PrimaryBottomNav'
import { supabase } from '@/lib/supabase'
import { formatUsdAmount } from '@/lib/telegram-stars'
import '../telescope.css'

const miaImage = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function telegramWebApp() {
  return (window as Window & {
    Telegram?: { WebApp?: {
      close?: () => void
      ready?: () => void
      expand?: () => void
      addToHomeScreen?: () => void
      checkHomeScreenStatus?: () => void
      addEventListener?: (event: string, callback: () => void) => void
      removeEventListener?: (event: string, callback: () => void) => void
      openTelegramLink?: (url: string) => void
      shareMessage?: (preparedMessageId: string) => void
      openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void
      initData?: string
      platform?: string
    } }
  }).Telegram?.WebApp
}

type ProfileSync = { bio?: string; profilePhotoUrl?: string }
type CoinPackage = {
  code: string
  name: string
  coins: number
  priceUsd: number
  badge?: string | null
  featured?: boolean
}

const COIN_PACKAGES: CoinPackage[] = [
  { code: 'starter', name: 'Starter', coins: 200, priceUsd: 0.99 },
  { code: 'fan', name: 'Fan', coins: 500, priceUsd: 2.49 },
  { code: 'supporter', name: 'Supporter', coins: 1000, priceUsd: 4.99 },
  { code: 'insider', name: 'Insider', coins: 3000, priceUsd: 14.99 },
  { code: 'vip', name: 'VIP', coins: 4000, priceUsd: 19.99 },
  { code: 'elite', name: 'Elite', coins: 10000, priceUsd: 49.99, badge: 'BEST SELLER' },
]
const FEATURED_COIN_PACKAGE: CoinPackage = { code: 'superfan', name: 'Superfan', coins: 2000, priceUsd: 9.99, badge: 'MOST POPULAR', featured: true }


export function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramAuthState, setTelegramAuthState] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'>('idle')
  const [shared, setShared] = useState(false)
  const [coinsHelp, setCoinsHelp] = useState(false)
  const [homeAdded, setHomeAdded] = useState(false)
  const [homeInstruction, setHomeInstruction] = useState('Save TeleFans for faster access')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [profileSync, setProfileSync] = useState<ProfileSync>({})
  const [following, setFollowing] = useState<Array<{ creator_id: string; creators: any }>>([])
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false)
  const [coinPurchaseState, setCoinPurchaseState] = useState<'idle' | 'loading' | 'pending'>('idle')
  const [coinPurchaseError, setCoinPurchaseError] = useState('')
  const [coinPurchaseSuccess, setCoinPurchaseSuccess] = useState('')

  useEffect(() => {
    let active = true
    const webApp = telegramWebApp()
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (active) setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleHomeScreenAdded = () => {
      if (!active) return
      setHomeAdded(true)
      setHomeInstruction('TeleFans was added to your home screen')
    }
    const cleanupBackButton = useTelegramBackButton(() => window.history.back())
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      if (!active) return
      setHomeAdded(true)
      setHomeInstruction('TeleFans was added to your home screen')
      setInstallPrompt(null)
    })
    webApp?.addEventListener?.('homeScreenAdded', handleHomeScreenAdded)
    webApp?.ready?.()
    webApp?.expand?.()
    setTelegramAuthState('connecting')
    void authenticateTelegramMiniApp()
      .then(user => {
        if (!active) return
        setTelegramUser(user)
        setTelegramAuthState(user ? 'connected' : 'unavailable')
        if (user) {
          setCoinsBalance(user.coins_balance ?? 0)
          setReferralCount(user.referral_count ?? 0)
          void listFollowedCreators(String(user.id)).then(setFollowing).catch(() => setFollowing([]))
          void supabase.from('telegram_users').select('bio, profile_photo_url').eq('telegram_id', user.id).maybeSingle().then(({ data }) => {
            if (!data) return
            // Coins and referral totals come only from telegram-auth, which validates
            // Telegram initData and returns the authoritative server-side account row.
            // Do not let this secondary public profile read overwrite them with stale data.
            setProfileSync({ bio: data.bio ?? '', profilePhotoUrl: data.profile_photo_url ?? '' })
          })
        }
      })
      .catch(() => active && setTelegramAuthState('error'))
    return () => {
      active = false
      cleanupBackButton()
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      webApp?.removeEventListener?.('homeScreenAdded', handleHomeScreenAdded)
    }
  }, [])

  const displayName = telegramUser?.first_name || 'W'
  const displayHandle = telegramUser?.username ? `@${telegramUser.username}` : '@wvvtr'
  const displayBio = profileSync.bio || ''
  const profilePhoto = profileSync.profilePhotoUrl || telegramUser?.photo_url
  const displayCoins = coinsBalance
  const displayReferrals = referralCount
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName])

  const inviteMessages = [
    'I found the dirtiest OF you’ll ever jerk to 🔥\nGet unlimited access here:',
    'This OF is pure filth… and it’s waiting for you 😈\nJoin the private club now:',
    'She posts the kind of explicit shit that gets you hooked in seconds 👀\nUnlock everything here:',
    'Ready for the hottest uncensored drops?\nDive into her OF right here:',
    'This isn’t teasing… this is full raw heat 🔥\nClaim your access now:',
    'The kind of OF that makes you cancel all your plans 😏\nEnter the private page here:',
    'She just dropped something that will ruin your night (in the best way) 😈\nSee it first here:',
    'One click away from the most addictive explicit content online 🔥\nJoin her exclusive fans here:',
    'This isn’t soft… this is full explicit heat 🔥\nClaim your access now:',
  ] as const

  const shareProfile = async () => {
    const inviteUrl = telegramUser?.id ? `https://t.me/telefansapp_bot?startapp=ref_${telegramUser.id}` : null
    const message = inviteMessages[Math.floor(Math.random() * inviteMessages.length)]
    const webApp = telegramWebApp()

    if (inviteUrl && webApp?.shareMessage && webApp.initData) {
      const { data, error } = await supabase.functions.invoke<{ ok: boolean; id?: string; message?: string }>('telegram-share', { body: { initData: webApp.initData } })
      if (!error && data?.id) {
        webApp.shareMessage(data.id)
        setShared(true)
        window.setTimeout(() => setShared(false), 1800)
        return
      }
    }

    // Older Telegram clients and ordinary browsers keep a safe fallback.
    const telegramShareUrl = inviteUrl
      ? `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(message)}`
      : null
    if (telegramShareUrl && webApp?.openTelegramLink) webApp.openTelegramLink(telegramShareUrl)
    else if (telegramShareUrl) void navigator.clipboard?.writeText(`${message}\n${inviteUrl}`)
    else void navigator.clipboard?.writeText(message)
    setShared(true)
    window.setTimeout(() => setShared(false), 1800)
  }

  const openBuyCoins = () => {
    setCoinPurchaseError('')
    setCoinPurchaseSuccess('')
    setBuyCoinsOpen(true)
  }

  const closeBuyCoins = () => {
    if (coinPurchaseState === 'loading') return
    setBuyCoinsOpen(false)
    setCoinPurchaseError('')
    setCoinPurchaseSuccess('')
  }

  const refreshCoinsBalance = async (webApp: ReturnType<typeof telegramWebApp>) => {
    if (!webApp?.initData) return
    const { data } = await supabase.functions.invoke<{ ok?: boolean; coinsBalance?: number }>('telegram-coins', {
      body: { action: 'balance', initData: webApp.initData },
    })
    if (typeof data?.coinsBalance === 'number') setCoinsBalance(data.coinsBalance)
  }

  const buyCoinPackage = async (coinPackage: CoinPackage) => {
    const webApp = telegramWebApp()
    if (!telegramUser || !webApp?.initData || !webApp.openInvoice) {
      setCoinPurchaseError('Open this profile inside Telegram to buy Coins.')
      return
    }

    setCoinPurchaseError('')
    setCoinPurchaseSuccess('')
    setCoinPurchaseState('loading')
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean
        invoiceUrl?: string
        error?: string
      }>('telegram-coins', {
        body: { action: 'create', initData: webApp.initData, packageCode: coinPackage.code },
      })
      if (error || !data?.ok || !data.invoiceUrl) throw new Error(data?.error ?? error?.message ?? 'Could not start the coin purchase.')

      setCoinPurchaseState('pending')
      webApp.openInvoice(data.invoiceUrl, (status) => {
        if (status === 'paid') {
          setCoinPurchaseSuccess('Payment confirmed. Updating your Coins balance...')
          window.setTimeout(() => void refreshCoinsBalance(webApp), 900)
        } else if (status === 'cancelled') {
          setCoinPurchaseError('Payment cancelled.')
        } else if (status === 'failed') {
          setCoinPurchaseError('Payment failed. Your balance was not changed.')
        }
        setCoinPurchaseState('idle')
      })
    } catch (error) {
      setCoinPurchaseState('idle')
      setCoinPurchaseError(error instanceof Error ? error.message : 'Could not start the coin purchase.')
    }
  }

  const addToHomeScreen = async () => {
    const webApp = telegramWebApp()

    if (webApp?.addToHomeScreen && webApp.initData) {
      webApp.addToHomeScreen()
      setHomeAdded(true)
      setHomeInstruction('Telegram will ask you to confirm the shortcut')
      window.setTimeout(() => setHomeAdded(false), 4200)
      return
    }

    if (installPrompt) {
      const prompt = installPrompt
      setInstallPrompt(null)
      const result = await prompt.prompt()
      setHomeAdded(true)
      setHomeInstruction(result.outcome === 'accepted' ? 'TeleFans was added to your home screen' : 'Installation was cancelled')
      window.setTimeout(() => setHomeAdded(false), 4200)
      return
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = isIOS || (/safari/i.test(navigator.userAgent) && !/chrome|android/i.test(navigator.userAgent))
    setHomeAdded(true)
    setHomeInstruction(
      isSafari
        ? 'In Safari, tap Share, then choose “Add to Home Screen”'
        : 'Open your browser menu and choose “Add to Home screen”',
    )
    window.setTimeout(() => setHomeAdded(false), 5200)
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
          <button type="button" className="coins-buy-button" onClick={openBuyCoins}><Coins aria-hidden="true" /><span>Buy Coins</span><ChevronRight aria-hidden="true" /></button>
        </section>

        <button type="button" className="user-action-row" onClick={shareProfile}>
          <Send aria-hidden="true" />
          <span><strong>Invite a friend</strong><small>Earn 2 Coins when a friend joins through your link</small></span>
          <b>Share</b>
        </button>
        <button type="button" className="user-action-row user-home-row" onClick={addToHomeScreen}>
          <House aria-hidden="true" />
          <span><strong>Add to home screen</strong><small>{homeAdded ? homeInstruction : 'Save TeleFans for faster access'}</small></span>
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
      {buyCoinsOpen && <div className="coins-purchase-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeBuyCoins() }}>
        <section className="coins-purchase-sheet" role="dialog" aria-modal="true" aria-labelledby="buy-coins-title">
          <div className="coins-sheet-handle" aria-hidden="true" />
          <header className="coins-purchase-header">
            <div><h2 id="buy-coins-title">Buy Coins</h2><p><Coins aria-hidden="true" /> {displayCoins.toLocaleString('en-US')} coin balance</p></div>
            <button type="button" className="coins-purchase-close" aria-label="Close Buy Coins" onClick={closeBuyCoins}>×</button>
          </header>
          {coinPurchaseError && <p className="coins-purchase-feedback coins-purchase-feedback-error" role="alert">{coinPurchaseError}</p>}
          {coinPurchaseSuccess && <p className="coins-purchase-feedback coins-purchase-feedback-success" role="status">{coinPurchaseSuccess}</p>}
          <div className="coins-purchase-scroll">
            <button type="button" className="coin-package coin-package-featured" onClick={() => void buyCoinPackage(FEATURED_COIN_PACKAGE)} disabled={coinPurchaseState !== 'idle'}>
              <span className="coin-package-badge">{FEATURED_COIN_PACKAGE.badge}</span>
              <span className="coin-package-visual coin-package-visual-featured"><Coins aria-hidden="true" /></span>
              <span className="coin-package-copy"><small>{FEATURED_COIN_PACKAGE.name.toUpperCase()}</small><strong>{FEATURED_COIN_PACKAGE.coins.toLocaleString('en-US')} <em>coins</em></strong></span>
              <span className="coin-package-price">{formatUsdAmount(FEATURED_COIN_PACKAGE.priceUsd)}</span>
            </button>
            <div className="coin-package-grid">{COIN_PACKAGES.map((coinPackage) => <button key={coinPackage.code} type="button" className={`coin-package coin-package-small ${coinPackage.badge ? 'coin-package-with-badge' : ''}`} onClick={() => void buyCoinPackage(coinPackage)} disabled={coinPurchaseState !== 'idle'}>
              {coinPackage.badge && <span className="coin-package-badge">{coinPackage.badge}</span>}
              <span className="coin-package-name">{coinPackage.name.toUpperCase()}</span>
              <span className="coin-package-visual"><Coins aria-hidden="true" /></span>
              <strong>{coinPackage.coins.toLocaleString('en-US')}</strong>
              <span className="coin-package-price">{formatUsdAmount(coinPackage.priceUsd)}</span>
            </button>)}</div>
          </div>
          <p className="coins-purchase-note">Prices are shown in USD. Telegram will display the final charge in Stars.</p>
        </section>
      </div>}
    </div>
    <PrimaryBottomNav active="profile" />
  </main>
}

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Profile · TeleFans' }, { name: 'description', content: 'Your TeleFans user profile.' }] }),
  component: ProfilePage,
})
