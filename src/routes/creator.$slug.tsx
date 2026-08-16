import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Feather, Heart, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCreatorProfile, normalizeCreatorHandle, type CreatorBadge, type CreatorProfile } from '@/data/creators'
import { getPublishedCreator, listCreatorPosts } from '@/lib/telefans-data'
import { useTelegramBackButton } from '@/lib/telegram-auth'
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

type PublicCreatorPost = { id: string; type: string; mediaUrl: string; thumbnailUrl?: string | null; title: string; caption: string; isPaid: boolean; unlockPrice: number }

export function CreatorProfilePage() {
  const { slug } = Route.useParams()
  const [creator, setCreator] = useState<CreatorProfile>(() => getCreatorProfile(slug))
  const [publicPosts, setPublicPosts] = useState<PublicCreatorPost[]>([])
  const [liked, setLiked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')
  const [offerOpened, setOfferOpened] = useState(false)
  const availability = getCreatorAvailability(slug)

  useEffect(() => useTelegramBackButton(() => {
    if (window.history.length > 1) window.history.back()
    else window.location.assign('/')
  }), [])

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
        if (active) setPublicPosts(posts.map(post => ({ id: post.id, type: post.type, mediaUrl: post.media_url, thumbnailUrl: post.thumbnail_url, title: post.title, caption: post.caption, isPaid: post.is_paid, unlockPrice: post.unlock_price })))
      } catch {
        if (active) setPublicPosts([])
      }
    }
    void loadPublicCreator()
    return () => { active = false }
  }, [slug])

  const openOffer = () => {
    setOfferOpened(true)
    window.setTimeout(() => setOfferOpened(false), 1800)
  }

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
          <div className="creator-avatar">            <img src={creator.avatarImage} alt={`${creator.name} avatar`} /></div>
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

        <section className="creator-content"><div className="creator-tabs"><button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>{creator.tabs.postsLabel}</button><button type="button" className={activeTab === 'media' ? 'active' : ''} onClick={() => setActiveTab('media')}>Paid Media</button></div><div className="creator-grid-preview creator-paid-grid">{activeTab === 'media' ? (publicPosts.filter(post => post.type === 'image' && post.isPaid).length ? publicPosts.filter(post => post.type === 'image' && post.isPaid).map((post) => <article className="paid-media-card" key={post.id}><img src={post.mediaUrl} alt="Paid media" /><div className="paid-media-overlay"><LockKeyhole className="paid-media-lock" /><span>{post.unlockPrice} coins</span></div></article>) : <div className="creator-media-empty">There is no Paid Media available for this creator yet.</div>) : (publicPosts.filter(post => post.type === 'image').length ? publicPosts.filter(post => post.type === 'image').map((post) => <article className="creator-post-card" key={post.id}><img src={post.mediaUrl} alt={post.title || `${creator.name} post`} />{post.isPaid && <span className="creator-post-paid-badge">Paid</span>}</article>) : <div className="creator-media-empty">There are no posts available for this creator yet.</div>)}</div></section>
      </div>
      {offerOpened && <div className="creator-offer-toast" role="status">Subscription offer selected</div>}
    </div>
  </main>
}

export const Route = createFileRoute('/creator/$slug')({ head: ({ params }) => ({ meta: [{ title: `${params.slug} · Telescope` }, { name: 'description', content: 'View this creator profile on Telescope.' }] }), component: CreatorProfilePage })

export { slugify }
