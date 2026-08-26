import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Coins, Feather, Heart, LockKeyhole, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCreatorProfile, normalizeCreatorHandle, type CreatorBadge, type CreatorProfile } from '@/data/creators'
import { getPublishedCreator, listCreatorPosts, unlockPaidMedia } from '@/lib/telefans-data'
import { getTelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
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
}

export function CreatorProfilePage() {
  const { slug } = Route.useParams()
  const [creator, setCreator] = useState<CreatorProfile>(() => getCreatorProfile(slug))
  const [publicPosts, setPublicPosts] = useState<PublicCreatorPost[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')
  const [offerOpened, setOfferOpened] = useState(false)
  const [expandedPost, setExpandedPost] = useState<PublicCreatorPost | null>(null)
  const [pendingUnlock, setPendingUnlock] = useState<PublicCreatorPost | null>(null)
  const [unlockingPostId, setUnlockingPostId] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState('')
  const [unlockedMedia, setUnlockedMedia] = useState<Record<string, string>>({})
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const availability = getCreatorAvailability(slug)

  useEffect(() => useTelegramBackButton(() => {
    if (pendingUnlock) {
      setPendingUnlock(null)
      return
    }
    if (expandedPost) {
      setExpandedPost(null)
      return
    }
    if (window.history.length > 1) window.history.back()
    else window.location.assign('/')
  }), [expandedPost, pendingUnlock])

  useEffect(() => {
    if (!expandedPost && !pendingUnlock) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedPost(null)
        setPendingUnlock(null)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedPost, pendingUnlock])

  useEffect(() => {
    let active = true
    const loadPublicCreator = async () => {
      try {
        const remote = await getPublishedCreator(slug)
        if (!remote || !active) return
        const fallback = getCreatorProfile(slug)
        setCreator({
          ...fallback,
          slug: remote.slug,
          name: remote.name,
          handle: normalizeCreatorHandle(remote.handle),
          coverImage: remote.cover_image || fallback.coverImage,
          avatarImage: remote.avatar_image || fallback.avatarImage,
          bio: remote.bio || fallback.bio,
          status: remote.status || fallback.status,
        })
        const posts = await listCreatorPosts(remote.id)
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
        })))
      } catch {
        if (active) setPublicPosts([])
      }
    }
    void loadPublicCreator()
    void getTelegramUser().then(user => { if (active) setCoinBalance(user?.coins_balance ?? null) }).catch(() => undefined)
    return () => { active = false }
  }, [slug])

  const openOffer = () => {
    setOfferOpened(true)
    window.setTimeout(() => setOfferOpened(false), 1800)
  }

  const previewUrl = (post: PublicCreatorPost) => unlockedMedia[post.id] || post.mediaUrl

  const openPost = (post: PublicCreatorPost) => {
    setUnlockError('')
    if (post.isPaid && !unlockedMedia[post.id]) {
      setPendingUnlock(post)
      return
    }
    setExpandedPost({ ...post, mediaUrl: unlockedMedia[post.id] || post.mediaUrl })
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
      setExpandedPost({ ...post, mediaUrl: unlocked.mediaUrl })
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Could not unlock this media.')
    } finally {
      setUnlockingPostId(null)
    }
  }

  const posts = publicPosts.filter(post => post.type === 'image' && !post.isPaid)
  const paidMedia = publicPosts.filter(post => post.type === 'image' && post.isPaid)

  return <main className="creator-profile-page">
    <div className="creator-profile-frame">
      <div className="creator-profile-scroll">
        <section className="creator-hero">
          <div className="creator-hero-media">
            <img src={creator.coverImage} alt={creator.name} />
            <div className="creator-hero-gradient" />
          </div>
          <div className="creator-cover-header">
            <Link to="/" className="creator-cover-back" aria-label="Back" onClick={(event) => { if (window.history.length > 1) { event.preventDefault(); window.history.back() } }}><ArrowLeft /></Link>
          </div>
          <div className="creator-avatar"><img src={creator.avatarImage} alt={`${creator.name} avatar`} /></div>
        </section>

        <section className="creator-about">
          <div className="creator-identity">
            <h1>{creator.name} <CreatorBadges badges={creator.badges} /></h1>
            <p className="creator-handle">{creator.handle} <b>·</b> <span className="creator-availability"><i aria-hidden="true">🟢</i>{availability}</span></p>
          </div>
          <p className={`creator-bio ${expanded ? 'is-expanded' : ''}`} aria-expanded={expanded}>{creator.bio}</p>
          {creator.bio.length > 180 && <button type="button" className="creator-more-info" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'More info'}</button>}
        </section>

        <section className="creator-subscription">
          <span className="creator-section-label">SUBSCRIPTION</span>
          <h2>{creator.subscription.title}</h2>
          <button type="button" className="creator-offer-row" onClick={openOffer} aria-label="View subscription offer">
            <img src={creator.avatarImage} alt="" />
            <span>{creator.subscription.message}</span>
            <span className="offer-arrow">›</span>
          </button>
        </section>

        <section className="creator-content">
          <div className="creator-tabs">
            <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>{creator.tabs.postsLabel}</button>
            <button type="button" className={activeTab === 'media' ? 'active' : ''} onClick={() => setActiveTab('media')}>Paid Media</button>
          </div>
          <div className="creator-grid-preview creator-paid-grid">
            {activeTab === 'media' ? (paidMedia.length ? paidMedia.map(post => <button type="button" className={`paid-media-card ${unlockedMedia[post.id] ? 'is-unlocked' : 'is-locked'}`} key={post.id} onClick={() => openPost(post)} aria-label={`Unlock paid media from ${creator.name} for ${post.unlockPrice} coins`}>
              <img src={previewUrl(post)} alt={post.title || `Paid media from ${creator.name}`} />
              {!unlockedMedia[post.id] && <div className="paid-media-overlay"><LockKeyhole className="paid-media-lock" /><span>{post.unlockPrice} coins</span></div>}
            </button>) : <div className="creator-media-empty">There is no Paid Media available for this creator yet.</div>) : (posts.length ? posts.map(post => <button type="button" className="creator-post-card" key={post.id} onClick={() => openPost(post)} aria-label={`Open post from ${creator.name}`}><img src={previewUrl(post)} alt={post.title || `${creator.name} post`} /></button>) : <div className="creator-media-empty">There are no posts available for this creator yet.</div>)}
          </div>
        </section>
      </div>
      {offerOpened && <div className="creator-offer-toast" role="status">Subscription offer selected</div>}
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

      {expandedPost && <div className="creator-media-lightbox" role="dialog" aria-modal="true" aria-label="Expanded media" onClick={() => setExpandedPost(null)}>
        <button type="button" className="creator-media-lightbox-close" onClick={() => setExpandedPost(null)} aria-label="Close expanded media"><X /></button>
        <div className="creator-media-lightbox-content" onClick={event => event.stopPropagation()}>
          <img src={expandedPost.mediaUrl} alt={expandedPost.title || `${creator.name} post`} />
          <div className="creator-media-lightbox-caption"><strong>{creator.name}</strong>{expandedPost.caption && <span>{expandedPost.caption}</span>}</div>
        </div>
      </div>}
    </div>
  </main>
}

export const Route = createFileRoute('/creator/$slug')({ head: ({ params }) => ({ meta: [{ title: `${params.slug} · TeleFans` }, { name: 'description', content: 'View this creator profile on TeleFans.' }] }), component: CreatorProfilePage })

export { slugify }
