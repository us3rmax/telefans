import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Coins, Heart, House, Send, Share2, Sparkles, Star, X } from 'lucide-react'
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
type CoinArtVariant = 'balance' | 'single' | 'double' | 'stack' | 'four' | 'tower' | 'pile' | 'chest' | 'vault' | 'mythic'
type CoinPackage = {
  code: string
  name: string
  coins: number
  priceUsd: number
  badge?: string | null
  featured?: boolean
  art: CoinArtVariant
}
const COIN_PACKAGES: CoinPackage[] = [
  { code: 'starter', name: 'Starter', coins: 200, priceUsd: 0.99, art: 'single' },
  { code: 'fan', name: 'Fan', coins: 500, priceUsd: 2.49, art: 'double' },
  { code: 'supporter', name: 'Supporter', coins: 1000, priceUsd: 4.99, art: 'stack' },
  { code: 'insider', name: 'Insider', coins: 3000, priceUsd: 14.99, art: 'four' },
  { code: 'vip', name: 'VIP', coins: 4000, priceUsd: 19.99, art: 'tower' },
  { code: 'elite', name: 'Elite', coins: 10000, priceUsd: 49.99, badge: 'BEST SELLER', art: 'pile' },
  { code: 'legend', name: 'Legend', coins: 15000, priceUsd: 74.99, art: 'chest' },
  { code: 'icon', name: 'Icon', coins: 20000, priceUsd: 99.99, art: 'vault' },
  { code: 'mythic', name: 'Mythic', coins: 40000, priceUsd: 199.99, art: 'mythic' },
]
const FEATURED_COIN_PACKAGE: CoinPackage = { code: 'superfan', name: 'Superfan', coins: 2000, priceUsd: 9.99, badge: 'MOST POPULAR', featured: true, art: 'tower' }

function CoinArtwork({ variant, code, size }: { variant: CoinArtVariant; code: string; size?: number }) {
  const rim = `coin-${code}-rim`
  const inner = `coin-${code}-inner`
  const star = `coin-${code}-star`
  const edge = `coin-${code}-edge`
  const glow = `coin-${code}-glow`
  const coin = `coin-${code}-coin`
  const svgProps = { viewBox: '0 0 64 64', width: size, height: size, className: 'coin-artwork', 'aria-hidden': true }
  const coinUse = (transform: string, opacity = 1) => <use href={`#${coin}`} transform={transform} opacity={opacity} />
  const discUse = (transform: string, opacity = 1) => <use href={`#${code}-disc`} transform={transform} opacity={opacity} />
  return <svg {...svgProps}>
    <defs>
      <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFE070" /><stop offset="0.55" stopColor="#F4B41C" /><stop offset="1" stopColor="#B8770A" /></linearGradient>
      <linearGradient id={inner} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#D69327" /><stop offset="1" stopColor="#9A6312" /></linearGradient>
      <linearGradient id={star} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFE585" /><stop offset="1" stopColor="#F4B41C" /></linearGradient>
      <linearGradient id={edge} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#F4B41C" /><stop offset="1" stopColor="#8a5a08" /></linearGradient>
      <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5"><stop stopColor="#FFC83A" stopOpacity="0.5" /><stop offset="1" stopColor="#FFC83A" stopOpacity="0" /></radialGradient>
      <g id={coin}>
        <circle cx="32" cy="32" r="30" fill={`url(#${rim})`} />
        <circle cx="32" cy="32" r="22" fill={`url(#${inner})`} />
        <path d="M32 18L36.11 26.34L45.32 27.67L38.66 34.16L40.23 43.32L32 39L23.77 43.32L25.34 34.16L18.68 27.67L27.89 26.34Z" fill={`url(#${star})`} stroke="#7A4D08" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14 17C18 11 25 8 33 8" stroke="#FFF6C4" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </g>
      <g id={`${code}-disc`}>
        <path d="M2 6L2 11A16 6 0 0 0 34 11L34 6A16 6 0 0 1 2 6Z" fill={`url(#${edge})`} />
        <ellipse cx="18" cy="6" rx="16" ry="6" fill={`url(#${rim})`} />
        <ellipse cx="18" cy="6" rx="10.5" ry="3.8" fill={`url(#${inner})`} opacity="0.9" />
      </g>
    </defs>
    {variant !== 'single' && <circle cx="32" cy="34" r="30" fill={`url(#${glow})`} opacity={variant === 'mythic' || variant === 'vault' ? 0.9 : 0.55} />}
    {variant === 'balance' && coinUse('translate(2,2) scale(0.94)')}
    {variant === 'single' && coinUse('translate(15,15) scale(0.53)')}
    {variant === 'double' && <>{coinUse('translate(3,16) scale(0.46)', 0.95)}{coinUse('translate(27,19) scale(0.5)')}</>}
    {variant === 'stack' && <>{discUse('translate(5,44)')}{discUse('translate(7,37)')}{discUse('translate(5,30)')}{coinUse('translate(28,17) scale(0.44)')}</>}
    {variant === 'four' && <>{discUse('translate(2,44)')}{discUse('translate(4,37)')}{discUse('translate(2,30)')}{discUse('translate(27,44)')}{discUse('translate(29,37)')}{coinUse('translate(24,9) scale(0.48)')}</>}
    {variant === 'tower' && <>{discUse('translate(0,49.5) scale(0.85)')}{discUse('translate(1,43.6) scale(0.85)')}{discUse('translate(0,37.6) scale(0.85)')}{discUse('translate(33,49.5) scale(0.85)')}{discUse('translate(34,43.6) scale(0.85)')}{discUse('translate(33,37.6) scale(0.85)')}{discUse('translate(15,48) scale(0.9)')}{discUse('translate(16,41.7) scale(0.9)')}{discUse('translate(15,35.4) scale(0.9)')}{discUse('translate(16,29.1) scale(0.9)')}{coinUse('translate(21,13) scale(0.4)')}</>}
    {variant === 'pile' && <>{discUse('translate(7,38) scale(0.95)')}{discUse('translate(23,39) scale(0.95)')}{discUse('translate(-1,47) scale(0.95)')}{discUse('translate(29,47) scale(0.95)')}{discUse('translate(14,48) scale(0.95)')}{coinUse('translate(16,11) scale(0.48)')}</>}
    {variant === 'chest' && <><ellipse cx="32" cy="12" rx="9" ry="4.5" fill={`url(#${rim})`} /><rect x="22" y="15.5" width="20" height="5.5" rx="2.75" fill="#B8770A" /><path d="M23 19C20 23 14 26 11.5 31C7.5 38.5 7.5 47 12 53C16.5 58.5 24 61 32 61C40 61 47.5 58.5 52 53C56.5 47 56.5 38.5 52.5 31C50 26 44 23 41 19Z" fill={`url(#${rim})`} stroke="#8a5b09" strokeWidth="1" /><g transform="translate(17.5,25.5) scale(0.45)"><path d="M32 18L36.11 26.34L45.32 27.67L38.66 34.16L40.23 43.32L32 39L23.77 43.32L25.34 34.16L18.68 27.67L27.89 26.34Z" fill={`url(#${star})`} stroke="#7A4D08" strokeWidth="1.6" strokeLinejoin="round" /></g>{coinUse('translate(-1,46) scale(0.28)')}{discUse('translate(46,50) scale(0.5)')}</>}
    {variant === 'vault' && <>{coinUse('translate(8,1) scale(0.24)')}{coinUse('translate(24,0) scale(0.28)')}{coinUse('translate(40,3) scale(0.22)')}<path d="M9 32L9 24C9 15 19 10 32 10C45 10 55 15 55 24L55 32Z" fill={`url(#${rim})`} stroke="#8a5b09" strokeWidth="1" /><rect x="9" y="31" width="46" height="2.5" fill="#5b3c06" /><rect x="9" y="33.5" width="46" height="22.5" rx="4" fill={`url(#${edge})`} /><rect x="17" y="12" width="5" height="44" rx="1.5" fill="#B8770A" opacity="0.85" /><rect x="42" y="12" width="5" height="44" rx="1.5" fill="#B8770A" opacity="0.85" /><circle cx="32" cy="37" r="4.5" fill={`url(#${star})`} stroke="#7A4D08" strokeWidth="1" /></>}
    {variant === 'mythic' && <><rect x="10" y="11" width="44" height="44" rx="9" fill={`url(#${rim})`} stroke="#8a5b09" strokeWidth="1" /><rect x="14.5" y="15.5" width="35" height="35" rx="6" fill={`url(#${inner})`} /><circle cx="16.5" cy="17.5" r="1.8" fill="#FFE585" opacity="0.9" /><circle cx="47.5" cy="17.5" r="1.8" fill="#FFE585" opacity="0.9" /><circle cx="16.5" cy="48.5" r="1.8" fill="#FFE585" opacity="0.9" /><circle cx="47.5" cy="48.5" r="1.8" fill="#FFE585" opacity="0.9" /><circle cx="32" cy="33" r="13.5" fill={`url(#${rim})`} /><circle cx="32" cy="33" r="9.5" fill={`url(#${inner})`} /><g stroke="#FFE585" strokeWidth="2.4" strokeLinecap="round"><path d="M32 25.5V40.5" /><path d="M24.5 33H39.5" /><path d="M26.7 27.7L37.3 38.3" /><path d="M37.3 27.7L26.7 38.3" /></g><circle cx="32" cy="33" r="3.2" fill={`url(#${star})`} stroke="#7A4D08" strokeWidth="1" />{coinUse('translate(0,49) scale(0.22)')}{coinUse('translate(50,49) scale(0.22)')}</>}
  </svg>
}


export function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramAuthState, setTelegramAuthState] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'>('idle')
  const [shared, setShared] = useState(false)
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
          <div className="coins-card-title"><span>FANS COINS BALANCE</span></div>
          <div className="coins-card-main">
            <span className="coins-card-balance" aria-label={`Fans Coins balance: ${displayCoins}`}><strong>{displayCoins.toLocaleString('en-US')}</strong><CoinArtwork code="profile-balance" variant="balance" size={22} /></span>
            <button type="button" className="coins-buy-button" onClick={openBuyCoins}><span>Buy Coins</span><ChevronRight aria-hidden="true" /></button>
          </div>
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
      {buyCoinsOpen && <div className="coins-purchase-overlay" role="presentation" style={{ height: 'var(--tg-stable-app-height, 100dvh)' }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeBuyCoins() }}>
        <section className="coins-purchase-sheet" role="dialog" aria-modal="true" aria-labelledby="buy-coins-title">
          <div className="coins-sheet-handle" aria-hidden="true" />
          <header className="coins-purchase-header">
            <div><h2 id="buy-coins-title">Buy Coins</h2><p><CoinArtwork code="balance" variant="single" size={13} /> <span>{displayCoins.toLocaleString('en-US')}</span> coin balance</p></div>
            <button type="button" className="coins-purchase-close" aria-label="Close Buy Coins" onClick={closeBuyCoins}><X aria-hidden="true" /></button>
          </header>
          {coinPurchaseError && <p className="coins-purchase-feedback coins-purchase-feedback-error" role="alert">{coinPurchaseError}</p>}
          {coinPurchaseSuccess && <p className="coins-purchase-feedback coins-purchase-feedback-success" role="status">{coinPurchaseSuccess}</p>}
          <div className="coins-purchase-scroll">
            <div className="coin-package-featured-shell">
              <button type="button" className="coin-package coin-package-featured" onClick={() => void buyCoinPackage(FEATURED_COIN_PACKAGE)} disabled={coinPurchaseState !== 'idle'}>
                <CoinArtwork code={FEATURED_COIN_PACKAGE.code} variant={FEATURED_COIN_PACKAGE.art} size={56} />
                <span className="coin-package-copy"><small>{FEATURED_COIN_PACKAGE.name}</small><strong>{FEATURED_COIN_PACKAGE.coins.toLocaleString('en-US')} <em>COINS</em></strong></span>
                <span className="coin-package-price">{formatUsdAmount(FEATURED_COIN_PACKAGE.priceUsd)}</span>
              </button>
              <span className="coin-package-badge credits-badge-shimmer">{FEATURED_COIN_PACKAGE.badge}</span>
            </div>
            <div className="coin-package-grid">{COIN_PACKAGES.map((coinPackage) => <button key={coinPackage.code} type="button" className={`coin-package coin-package-small ${coinPackage.badge ? 'coin-package-with-badge' : ''}`} onClick={() => void buyCoinPackage(coinPackage)} disabled={coinPurchaseState !== 'idle'}>
              {coinPackage.badge && <span className="coin-package-badge credits-badge-shimmer">{coinPackage.badge}</span>}
              <span className="coin-package-name">{coinPackage.name}</span>
              <span className="coin-package-visual"><CoinArtwork code={coinPackage.code} variant={coinPackage.art} size={coinPackage.art === 'mythic' ? 52 : 45} /></span>
              <strong>{coinPackage.coins.toLocaleString('en-US')}</strong>
              <span className="coin-package-price">{formatUsdAmount(coinPackage.priceUsd)}</span>
            </button>)}</div>
          </div>
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
