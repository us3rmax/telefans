import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Coins, Feather, Heart, LockKeyhole, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getCreatorProfile, normalizeCreatorHandle, type CreatorBadge, type CreatorProfile } from '@/data/creators'
import { getCreatorSubscriptionStatus, getPublishedCreator, listCreatorPosts, startCreatorSubscription, unlockPaidMedia } from '@/lib/telefans-data'
import { getTelegramInitData, getTelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
import { formatUsdFromStars } from '@/lib/telegram-stars'
import { clearProfileReturnState, saveExploreRestoreState, saveReelsPosition, readProfileReturnState } from '@/lib/navigation-state'
import '../telescope.css'

function CreatorBadgeIcon({ badge }: { badge: CreatorBadge }) {
  if (badge === 'verified') return <Verified />
  if (badge === 'heart') return <Heart className="creator-badge-icon" fill="currentColor" />
  if (badge === 'feather') return <Feather className="creator-badge-icon" />
  if (badge === 'diamond') return <span className="creator-badge-symbol" aria-label="diamond">◆</span>
  return <span className="creator-badge-symbol" aria-label="rabbit">♧</span>
}

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function Verified() { return <span className="verified-mark" aria-label="Verified"><Check /></span> }
function CreatorBadges({ badges }: { badges: CreatorBadge[] }) { return <span className="creator-badges">{badges.map((badge) => <CreatorBadgeIcon key={badge} badge={badge} />)}</span> }

function createEmptyCreatorProfile(slug: string): CreatorProfile {
  return {
    slug,
    name: '',
    handle: '',
    coverImage: '',
    avatarImage: '',
    badges: [],
    status: '',
    bio: '',
    expandedBio: '',
    stats: { posts: '', media: '', live: '', likes: '' },
    subscription: { title: '', message: '' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  }
}

function CreatorProfileLoading() {
  return <main className="creator-profile-page creator-profile-loading" aria-busy="true" aria-label="Loading creator profile"><div className="creator-profile-frame"><div className="creator-profile-scroll"><section className="creator-hero"><span className="creator-loading-block" /></section><section className="creator-about"><div className="creator-loading-line creator-loading-name" /><div className="creator-loading-line creator-loading-handle" /><div className="creator-loading-line creator-loading-bio" /><div className="creator-loading-line creator-loading-bio short" /></section><section className="creator-subscription"><div className="creator-loading-line creator-loading-section" /><div className="creator-loading-line creator-loading-offer" /></section><section className="creator-content"><div className="creator-tabs"><span /><span /></div><div className="creator-grid-preview creator-loading-grid">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div></section></div></div></main>
}

function getCreatorAvailability(slug: string) {
  const now = new Date()
  const period = Math.floor(now.getHours() / 6)
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
  const seed = [...`${slug}:${day}:${period}`].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7)
  const state = seed % 3
  if (state === 0) return 'Available now'
  if (state === 1) return 'online'
  return `online ${1 + (seed % 34)} minutes ago`
}

type PublicCreatorPost = {
  id: string
  type: string
  mediaUrl: string
  thumbnailUrl?: string | null
  title: string
  caption: string
  isPaid: boolean
  unlockPrice: number
  carouselId: string | null
  carouselPosition: number
}

type CreatorPostGroup = {
  id: string
  posts: PublicCreatorPost[]
}

type SubscriptionOffer = {
  mode: 'free' | 'paid' | 'promo'
  stars: number
  days: number | null
  autoRenew: boolean
  title: string
  message: string
  promoExpiresAt: string | null
}
type SubscriptionStatus = {
  subscribed: boolean
  offer: SubscriptionOffer | null
  subscription: { status: string; type: string; currentPeriodEnd: string | null; autoRenew: boolean } | null
  telegramUsername: string | null
  vipChannelUrl: string | null
}

function readPublicSubscription(value: unknown): CreatorProfile['subscription'] {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const mode = raw.plan_mode === 'paid' || raw.plan_mode === 'promo' ? raw.plan_mode : 'free'
  const normal = Number(raw.normal_price_stars) || 0
  const promo = Number(raw.promo_price_stars) || 0
  const stars = mode === 'promo' && promo > 0 ? promo : normal
  return {
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Subscription',
    message: typeof raw.message === 'string' ? raw.message : 'Join this creator on TeleFans.',
    priceLabel: mode === 'free' ? 'Free' : formatUsdFromStars(stars),
    isFree: mode === 'free',
    planMode: mode,
    normalPriceStars: normal,
    promoPriceStars: promo,
    promoDays: Number(raw.promo_days) || 30,
    promoExpiresAt: typeof raw.promo_expires_at === 'string' ? raw.promo_expires_at : null,
  }
}

function toSubscriptionOffer(subscription: CreatorProfile['subscription']): SubscriptionOffer {
  const mode = subscription.planMode ?? (subscription.isFree ? 'free' : 'paid')
  const normal = subscription.normalPriceStars ?? 0
  const promo = subscription.promoPriceStars ?? 0
  return { mode, stars: mode === 'promo' && promo > 0 ? promo : normal, days: mode === 'free' ? null : (subscription.promoDays ?? 30), autoRenew: mode !== 'free', title: subscription.title, message: subscription.message, promoExpiresAt: subscription.promoExpiresAt ?? null }
}

export function CreatorProfilePage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate({ from: '/creator/$slug' })
  const [creator, setCreator] = useState<CreatorProfile>(() => createEmptyCreatorProfile(slug))
  const [creatorFound, setCreatorFound] = useState(false)
  const [creatorMediaLoaded, setCreatorMediaLoaded] = useState(false)
  const [publicPostsLoaded, setPublicPostsLoaded] = useState(false)
  const [publicPosts, setPublicPosts] = useState<PublicCreatorPost[]>([])
  const [expanded, setExpanded] = useState(false)
  const [remoteCreatorId, setRemoteCreatorId] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ subscribed: false, offer: null, subscription: null, telegramUsername: null, vipChannelUrl: null })
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [subscriptionFeedback, setSubscriptionFeedback] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')
  const [expandedPost, setExpandedPost] = useState<PublicCreatorPost | null>(null)
  const [expandedPostGroup, setExpandedPostGroup] = useState<CreatorPostGroup | null>(null)
  const [expandedPostIndex, setExpandedPostIndex] = useState(0)
  const [pendingUnlock, setPendingUnlock] = useState<PublicCreatorPost | null>(null)
  const [unlockingPostId, setUnlockingPostId] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState('')
  const [unlockedMedia, setUnlockedMedia] = useState<Record<string, string>>({})
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const availability = getCreatorAvailability(slug)
  const touchStartX = useRef<number | null>(null)

  const closeExpandedPost = useCallback(() => {
    setExpandedPost(null)
    setExpandedPostGroup(null)
    setExpandedPostIndex(0)
  }, [])

  const openExpandedSlide = useCallback((post: PublicCreatorPost, index: number) => {
    if (post.isPaid && !unlockedMedia[post.id]) {
      setUnlockError('')
      setPendingUnlock(post)
      return
    }
    setPendingUnlock(null)
    setExpandedPostIndex(index)
    setExpandedPost({ ...post, mediaUrl: unlockedMedia[post.id] || post.mediaUrl })
  }, [unlockedMedia])

  const changeExpandedSlide = useCallback((delta: number) => {
    if (!expandedPost || !expandedPostGroup || pendingUnlock || expandedPostGroup.posts.length < 2) return
    const slideCount = expandedPostGroup.posts.length
    const currentIndex = Math.min(Math.max(expandedPostIndex, 0), slideCount - 1)
    const nextIndex = (currentIndex + delta + slideCount) % slideCount
    openExpandedSlide(expandedPostGroup.posts[nextIndex], nextIndex)
  }, [expandedPost, expandedPostGroup, expandedPostIndex, openExpandedSlide, pendingUnlock])

  const goBack = useCallback(() => {
    if (pendingUnlock) {
      setPendingUnlock(null)
      return
    }
    if (expandedPost) {
      closeExpandedPost()
      return
    }
    const origin = readProfileReturnState()
    clearProfileReturnState()
    if (!origin || origin.slug !== slug) {
      void navigate({ to: '/' })
      return
    }
    if (origin.source === 'explore') {
      saveExploreRestoreState(origin)
      void navigate({ to: '/' })
      return
    }
    if (origin?.source === 'reels') {
      saveReelsPosition(origin)
      void navigate({ to: '/reels', search: { tab: origin.tab } })
      return
    }
    void navigate({ to: '/' })
  }, [closeExpandedPost, expandedPost, navigate, pendingUnlock])

  useEffect(() => useTelegramBackButton(goBack), [goBack])

  useEffect(() => {
    if (!expandedPost && !pendingUnlock) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeExpandedPost()
        setPendingUnlock(null)
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        changeExpandedSlide(-1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        changeExpandedSlide(1)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [changeExpandedSlide, closeExpandedPost, expandedPost, pendingUnlock])

  useEffect(() => {
    let active = true
    setCreator(createEmptyCreatorProfile(slug))
    setCreatorFound(false)
    setRemoteCreatorId(null)
    setSubscriptionStatus({ subscribed: false, offer: null, subscription: null, telegramUsername: null, vipChannelUrl: null })
    setSubscriptionLoading(true)
    setSubscriptionError('')
    setSubscriptionFeedback('')
    setCreatorMediaLoaded(false)
    setPublicPostsLoaded(false)
    setPublicPosts([])
    setExpanded(false)
    setExpandedPost(null)
    setExpandedPostGroup(null)
    setExpandedPostIndex(0)
    setPendingUnlock(null)
    setUnlockedMedia({})
    setUnlockError('')
    const loadPublicCreator = async () => {
      try {
        const remote = await getPublishedCreator(slug)
        if (!remote || !active) {
          if (active) {
            setCreatorFound(false)
            setCreatorMediaLoaded(true)
            setPublicPostsLoaded(true)
          }
          return
        }
        const fallback = createEmptyCreatorProfile(slug)
        setCreator({
          ...fallback,
          slug: remote.slug,
          name: remote.name,
          handle: normalizeCreatorHandle(remote.handle),
          coverImage: remote.cover_image || '',
          avatarImage: remote.avatar_image || '',
          bio: remote.bio || '',
          expandedBio: remote.expanded_bio || remote.bio || '',
          status: remote.status || 'Available now',
          subscription: readPublicSubscription(remote.subscription),
        })
        const publicOffer = readPublicSubscription(remote.subscription)
        setSubscriptionStatus(current => ({ ...current, offer: toSubscriptionOffer(publicOffer) }))
        setRemoteCreatorId(remote.id)
        setCreatorFound(true)
        setCreatorMediaLoaded(true)
        const posts = await listCreatorPosts(remote.id).catch(() => [])
        if (active) setPublicPosts(posts.map(post => ({
          id: post.id,
          type: post.type,
          // Paid media_url is already a transformed, low-resolution preview from listCreatorPosts.
          mediaUrl: post.media_url,
          thumbnailUrl: post.thumbnail_url,
          title: post.title,
          caption: post.caption,
          isPaid: post.is_paid,
          unlockPrice: post.unlock_price,
          carouselId: post.carousel_id,
          carouselPosition: post.carousel_position,
        })))
        if (active) setPublicPostsLoaded(true)
      } catch {
        if (active) {
          setCreatorFound(false)
          setCreatorMediaLoaded(true)
          setPublicPostsLoaded(true)
          setPublicPosts([])
        }
      }
    }
    void loadPublicCreator()
    void getTelegramUser().then(user => { if (active) setCoinBalance(user?.coins_balance ?? null) }).catch(() => undefined)
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!remoteCreatorId) return
    let active = true
    setSubscriptionLoading(true)
    void getCreatorSubscriptionStatus(remoteCreatorId).then(response => {
      if (!active) return
      setSubscriptionStatus({ subscribed: response.subscribed, offer: response.offer ?? null, subscription: response.subscription ?? null, telegramUsername: response.telegramUsername ?? null, vipChannelUrl: response.vipChannelUrl ?? null })
      setSubscriptionError('')
    }).catch(error => {
      if (active && getTelegramInitData()) setSubscriptionError(error instanceof Error ? error.message : 'Could not load subscription status.')
    }).finally(() => { if (active) setSubscriptionLoading(false) })
    return () => { active = false }
  }, [remoteCreatorId])

  const applySubscriptionResponse = (response: Awaited<ReturnType<typeof getCreatorSubscriptionStatus>>) => {
    setSubscriptionStatus({ subscribed: response.subscribed, offer: response.offer ?? subscriptionStatus.offer, subscription: response.subscription ?? null, telegramUsername: response.telegramUsername ?? null, vipChannelUrl: response.vipChannelUrl ?? null })
  }

  const pollSubscriptionStatus = async () => {
    if (!remoteCreatorId) return false
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await getCreatorSubscriptionStatus(remoteCreatorId)
      applySubscriptionResponse(response)
      if (response.subscribed) return true
      if (attempt < 5) await new Promise(resolve => window.setTimeout(resolve, 1000))
    }
    return false
  }

  const subscribe = async () => {
    if (!remoteCreatorId || subscriptionActionLoading) return
    if (!getTelegramInitData()) { setSubscriptionError('Open this profile inside Telegram to subscribe with Telegram Stars.'); return }
    setSubscriptionActionLoading(true); setSubscriptionError(''); setSubscriptionFeedback('')
    try {
      const response = await startCreatorSubscription(remoteCreatorId)
      applySubscriptionResponse(response)
      if (response.subscribed) {
        setSubscriptionFeedback('Subscription active. Your Telegram and VIP buttons are now available.')
        setSubscriptionActionLoading(false)
        return
      }
      if (!response.invoiceUrl) throw new Error('The Telegram Stars invoice was not created.')
      const webApp = window.Telegram?.WebApp
      if (!webApp?.openInvoice) throw new Error('Open the TeleFans Mini App in Telegram to complete this payment.')
      setSubscriptionFeedback('Complete the Telegram Stars payment in the Telegram window.')
      webApp.openInvoice(response.invoiceUrl, status => {
        if (status === 'paid') {
          setSubscriptionFeedback('Payment received. Confirming your subscription…')
          void pollSubscriptionStatus().then(active => {
            if (active) setSubscriptionFeedback('Subscription active. Your Telegram and VIP buttons are now available.')
            else setSubscriptionError('Payment is pending confirmation. Please check again in a moment.')
          }).catch(error => setSubscriptionError(error instanceof Error ? error.message : 'Could not confirm the subscription.')).finally(() => setSubscriptionActionLoading(false))
        } else if (status === 'pending') {
          setSubscriptionFeedback('Payment is pending confirmation. Your private access will appear after confirmation.')
          setSubscriptionActionLoading(false)
        } else if (status === 'cancelled') {
          setSubscriptionFeedback('Payment cancelled.')
          setSubscriptionActionLoading(false)
        } else {
          setSubscriptionError('Telegram could not complete the payment.')
          setSubscriptionActionLoading(false)
        }
      })
    } catch (error) {
      setSubscriptionError(error instanceof Error ? error.message : 'Could not start the subscription.')
      setSubscriptionActionLoading(false)
    }
  }

  const openSubscriptionDestination = (destination: 'message' | 'vip') => {
    if (!subscriptionStatus.subscribed) return
    const target = destination === 'message'
      ? (subscriptionStatus.telegramUsername ? `https://t.me/${subscriptionStatus.telegramUsername}` : '')
      : (subscriptionStatus.vipChannelUrl ?? '')
    if (!target) { setSubscriptionError(destination === 'message' ? 'This creator has not configured a Telegram username yet.' : 'This creator has not configured a VIP channel yet.'); return }
    const webApp = window.Telegram?.WebApp
    if (webApp?.openTelegramLink) webApp.openTelegramLink(target)
    else window.open(target, '_blank', 'noopener,noreferrer')
  }

  const offer = subscriptionStatus.offer ?? toSubscriptionOffer(creator.subscription)
  const previewUrl = (post: PublicCreatorPost) => unlockedMedia[post.id] || post.mediaUrl

  const openPost = (post: PublicCreatorPost, group: CreatorPostGroup, index: number) => {
    setUnlockError('')
    setExpandedPostGroup(group)
    setExpandedPostIndex(index)
    openExpandedSlide(post, index)
  }

  const confirmUnlock = async () => {
    if (!pendingUnlock || unlockingPostId) return
    const post = pendingUnlock
    setUnlockingPostId(post.id)
    setUnlockError('')
    try {
      const unlocked = await unlockPaidMedia(post.id)
      setUnlockedMedia(current => ({ ...current, [post.id]: unlocked.mediaUrl }))
      setCoinBalance(unlocked.coinsBalance)
      setPendingUnlock(null)
      const unlockedIndex = expandedPostGroup?.posts.findIndex(item => item.id === post.id) ?? -1
      if (unlockedIndex >= 0) setExpandedPostIndex(unlockedIndex)
      setExpandedPost({ ...post, mediaUrl: unlocked.mediaUrl })
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Could not unlock this media.')
    } finally {
      setUnlockingPostId(null)
    }
  }

  if (!creatorMediaLoaded || !publicPostsLoaded) return <CreatorProfileLoading />
  if (!creatorFound) return <main className="creator-profile-page"><div className="creator-profile-frame"><div className="creator-profile-unavailable"><button type="button" className="creator-cover-back" aria-label="Back" onClick={goBack}><ArrowLeft /></button><strong>Creator unavailable</strong><span>This profile could not be loaded right now.</span></div></div></main>

  const posts = publicPosts.filter(post => post.type === 'image' && !post.isPaid)
  const paidMedia = publicPosts.filter(post => post.type === 'image' && post.isPaid)

  const groupPosts = (items: PublicCreatorPost[]): CreatorPostGroup[] => {
    const grouped = new Map<string, PublicCreatorPost[]>()
    for (const post of items) {
      const groupId = post.carouselId ?? post.id
      const current = grouped.get(groupId) ?? []
      current.push(post)
      grouped.set(groupId, current)
    }
    return [...grouped.entries()].map(([id, group]) => ({ id, posts: [...group].sort((a, b) => a.carouselPosition - b.carouselPosition) }))
  }

  const postGroups = groupPosts(posts)
  const paidMediaGroups = groupPosts(paidMedia)

  const lightboxPosts = expandedPostGroup?.posts ?? (expandedPost ? [expandedPost] : [])
  const lightboxSlideIndex = Math.min(Math.max(expandedPostIndex, 0), Math.max(lightboxPosts.length - 1, 0))
  const lightboxPost = lightboxPosts[lightboxSlideIndex] ?? expandedPost
  const activeLightboxPost = lightboxPost ? { ...lightboxPost, mediaUrl: unlockedMedia[lightboxPost.id] || lightboxPost.mediaUrl } : null

  const renderPostGroup = (group: CreatorPostGroup, isPaid: boolean) => {
    const post = group.posts[0]
    const unlocked = Boolean(unlockedMedia[post.id])
    const cardClass = isPaid ? `paid-media-card ${unlocked ? 'is-unlocked' : 'is-locked'}` : 'creator-post-card'
    return <div className={`creator-carousel-card ${cardClass}`} key={group.id}>
      <button type="button" className="creator-carousel-media" onClick={() => openPost(post, group, 0)} aria-label={`${isPaid && !unlocked ? 'Unlock' : 'Open'} ${group.posts.length > 1 ? `carousel with ${group.posts.length} slides from ` : ''}post from ${creator.name}`}>
        <img src={previewUrl(post)} alt={post.title || `${creator.name} post`} />
        {isPaid && !unlocked && <div className="paid-media-overlay"><LockKeyhole className="paid-media-lock" /><span>{post.unlockPrice} coins</span></div>}
      </button>
    </div>
  }

  return <main className="creator-profile-page">
    <div className="creator-profile-frame">
      <div className="creator-profile-scroll">
        <section className="creator-hero">
          <div className="creator-hero-media">
            {creatorMediaLoaded && creator.coverImage ? <img src={creator.coverImage} alt={creator.name} /> : <span className="creator-image-placeholder" aria-hidden="true" />}
            <div className="creator-hero-gradient" />
          </div>
          <div className="creator-cover-header">
            <button type="button" className="creator-cover-back" aria-label="Back" onClick={goBack}><ArrowLeft /></button>
          </div>
          <div className="creator-avatar">{creatorMediaLoaded && creator.avatarImage ? <img src={creator.avatarImage} alt={`${creator.name} avatar`} /> : <span className="creator-image-placeholder" aria-hidden="true" />}</div>
        </section>

        <section className="creator-about">
          <div className="creator-identity">
            <h1>{creator.name} <CreatorBadges badges={creator.badges} /></h1>
            <p className="creator-handle">{creator.handle} <b>·</b> <span className="creator-availability"><i aria-hidden="true">🟢</i>{availability}</span></p>
          </div>
          <p className={`creator-bio ${expanded ? 'is-expanded' : ''}`} aria-expanded={expanded}>{creator.bio}</p>
          {creator.bio.length > 180 && <button type="button" className="creator-more-info" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'More info'}</button>}
          {subscriptionStatus.subscribed && <div className="creator-profile-private-actions" aria-label="Private creator actions"><button type="button" onClick={() => openSubscriptionDestination('message')} disabled={!subscriptionStatus.telegramUsername}>Message</button><button type="button" onClick={() => openSubscriptionDestination('vip')} disabled={!subscriptionStatus.vipChannelUrl}>Access VIP</button></div>}
        </section>

        <section className="creator-subscription">
          <span className="creator-section-label">SUBSCRIPTION</span>
          <div className="creator-subscription-title-row"><h2>{offer.title === 'Subscription' ? `Subscribe to ${creator.name}` : offer.title}</h2><span className={`creator-subscription-badge ${offer.mode}`}>{offer.mode === 'free' ? 'FREE' : offer.mode === 'promo' ? 'PROMO' : 'PAID'}</span></div>
          <p className="creator-subscription-message">{offer.message || 'Join this creator on TeleFans.'}</p>
          <div className="creator-subscription-identity"><div className="creator-subscription-avatar">{creatorMediaLoaded && creator.avatarImage ? <img src={creator.avatarImage} alt="" /> : <span className="creator-image-placeholder" aria-hidden="true" />}</div><div><strong>{creator.name}</strong><span>{creator.handle}</span></div></div>
          {offer.mode === 'promo' && <p className="creator-subscription-detail">{formatUsdFromStars(offer.stars)} for the promotion{offer.days ? ` · ${offer.days} days` : ''}{offer.promoExpiresAt ? ` · ends ${new Date(offer.promoExpiresAt).toLocaleDateString()}` : ''}</p>}
          {offer.mode === 'paid' && <p className="creator-subscription-detail">{formatUsdFromStars(offer.stars)} / month</p>}
          {subscriptionStatus.subscribed ? <div className="creator-subscription-active"><p><strong>Subscription active.</strong> Your private actions are shown below the bio.</p></div> : <button type="button" className="creator-offer-row" onClick={() => { void subscribe() }} disabled={subscriptionLoading || subscriptionActionLoading} aria-label="Subscribe to this creator">{creatorMediaLoaded && creator.avatarImage ? <img src={creator.avatarImage} alt="" /> : <span className="creator-image-placeholder" aria-hidden="true" />}<span>{subscriptionLoading ? 'Checking subscription…' : subscriptionActionLoading ? 'Opening secure checkout…' : offer.mode === 'free' ? 'Subscribe for free' : `Subscribe for ${formatUsdFromStars(offer.stars)}`}</span><span className="offer-arrow">›</span></button>}
          {subscriptionError && <p className="creator-subscription-error" role="alert">{subscriptionError}</p>}
          {subscriptionFeedback && <p className="creator-subscription-feedback" role="status">{subscriptionFeedback}</p>}
        </section>

        <section className="creator-content">
          <div className="creator-tabs">
            <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>{creator.tabs.postsLabel}</button>
            <button type="button" className={activeTab === 'media' ? 'active' : ''} onClick={() => setActiveTab('media')}>Paid Media</button>
          </div>
          <div className="creator-grid-preview creator-paid-grid">
            {activeTab === 'media' ? (paidMediaGroups.length ? paidMediaGroups.map(group => renderPostGroup(group, true)) : <div className="creator-media-empty">There is no Paid Media available for this creator yet.</div>) : (postGroups.length ? postGroups.map(group => renderPostGroup(group, false)) : <div className="creator-media-empty">There are no posts available for this creator yet.</div>)}
          </div>
        </section>
      </div>

      {unlockError && !pendingUnlock && <div className="creator-unlock-toast" role="alert">{unlockError}</div>}

      {pendingUnlock && <div className="creator-unlock-backdrop" role="presentation" onClick={() => { if (!unlockingPostId) setPendingUnlock(null) }}>
        <section className="creator-unlock-modal" role="dialog" aria-modal="true" aria-labelledby="creator-unlock-title" onClick={event => event.stopPropagation()}>
          <button type="button" className="creator-unlock-close" onClick={() => setPendingUnlock(null)} aria-label="Close unlock dialog" disabled={Boolean(unlockingPostId)}><X /></button>
          <div className="creator-unlock-icon"><Coins /></div>
          <h2 id="creator-unlock-title">Unlock Paid Media</h2>
          <p>Unlock this media from {creator.name} for <strong>{pendingUnlock.unlockPrice} coins</strong>.</p>
          <p className="creator-unlock-balance">Your balance: <strong>{coinBalance === null ? 'Connect Telegram' : `${coinBalance} coins`}</strong></p>
          {unlockError && <p className="creator-unlock-error" role="alert">{unlockError}</p>}
          <button type="button" className="creator-unlock-confirm" onClick={() => { void confirmUnlock() }} disabled={Boolean(unlockingPostId)}>{unlockingPostId ? 'Unlocking…' : `Pay ${pendingUnlock.unlockPrice} coins`}</button>
          <button type="button" className="creator-unlock-cancel" onClick={() => setPendingUnlock(null)} disabled={Boolean(unlockingPostId)}>Cancel</button>
        </section>
      </div>}

      {expandedPost && activeLightboxPost && <div className="creator-media-lightbox" role="dialog" aria-modal="true" aria-label="Expanded media" onClick={closeExpandedPost}>
        <button type="button" className="creator-media-lightbox-close" onClick={event => { event.stopPropagation(); closeExpandedPost() }} aria-label="Close expanded media"><X /></button>
        <div
          className="creator-media-lightbox-content"
          onClick={event => event.stopPropagation()}
          onTouchStart={event => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }}
          onTouchEnd={event => {
            const startX = touchStartX.current
            touchStartX.current = null
            const endX = event.changedTouches[0]?.clientX
            if (startX === null || endX === undefined || Math.abs(startX - endX) < 48) return
            changeExpandedSlide(startX > endX ? 1 : -1)
          }}
        >
          <div className="creator-media-lightbox-stage">
            {lightboxPosts.length > 1 && <button type="button" className="creator-media-lightbox-arrow creator-media-lightbox-arrow-left" onClick={() => changeExpandedSlide(-1)} aria-label="Previous slide"><ChevronLeft /></button>}
            <img src={activeLightboxPost.mediaUrl} alt={activeLightboxPost.title || `${creator.name} post`} />
            {lightboxPosts.length > 1 && <button type="button" className="creator-media-lightbox-arrow creator-media-lightbox-arrow-right" onClick={() => changeExpandedSlide(1)} aria-label="Next slide"><ChevronRight /></button>}
          </div>
          {lightboxPosts.length > 1 && <div className="creator-media-lightbox-navigation" aria-label="Carousel navigation">
            <span className="creator-media-lightbox-counter" aria-live="polite">{lightboxSlideIndex + 1} / {lightboxPosts.length}</span>
            <div className="creator-media-lightbox-dots">
              {lightboxPosts.map((post, index) => <button key={post.id} type="button" className={`creator-media-lightbox-dot ${index === lightboxSlideIndex ? 'active' : ''}`} onClick={() => openExpandedSlide(post, index)} aria-label={`Open slide ${index + 1} of ${lightboxPosts.length}`} aria-current={index === lightboxSlideIndex ? 'true' : undefined} />)}
            </div>
          </div>}
          <div className="creator-media-lightbox-caption"><strong>{creator.name}</strong>{activeLightboxPost.caption && <span>{activeLightboxPost.caption}</span>}</div>
        </div>
      </div>}
    </div>
  </main>
}

export const Route = createFileRoute('/creator/$slug')({ head: ({ params }) => ({ meta: [{ title: `${params.slug} · TeleFans` }, { name: 'description', content: 'View this creator profile on TeleFans.' }] }), component: CreatorProfilePage })

export { slugify }
