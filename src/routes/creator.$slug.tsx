import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Feather, Heart, Image, Radio, Share2, Video } from 'lucide-react'
import { useState } from 'react'
import { getCreatorProfile, type CreatorBadge } from '@/data/creators'
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
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <span className="cover-stat"><span>{icon}</span>{value}<span className="sr-only"> {label}</span></span> }
function CreatorBadges({ badges }: { badges: CreatorBadge[] }) { return <span className="creator-badges">{badges.map((badge) => <CreatorBadgeIcon key={badge} badge={badge} />)}</span> }

function CreatorProfileNav() {
  return <nav className="creator-profile-nav" aria-label="Profile navigation">
    <Link to="/" aria-label="Explore"><span className="profile-home-glyph" /></Link>
    <Link to="/reels" search={{ tab: 'trending' }} aria-label="Reels"><Video /></Link>
    <button type="button" aria-label="More options"><span className="profile-more-glyph">•••</span></button>
  </nav>
}

export function CreatorProfilePage() {
  const { slug } = Route.useParams()
  const creator = getCreatorProfile(slug)
  const [liked, setLiked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [shared, setShared] = useState(false)

  const shareProfile = async () => {
    const url = window.location.href
    try { if (navigator.share) await navigator.share({ title: `${creator.name} · Telescope`, url }); else { await navigator.clipboard?.writeText(url); setShared(true); window.setTimeout(() => setShared(false), 1800) } } catch { /* share dismissed */ }
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
            <Link to="/" className="creator-cover-back" aria-label="Back to explore"><ArrowLeft /></Link>
            <div className="creator-cover-name"><strong>{creator.name} <CreatorBadges badges={creator.badges} /></strong><div><Stat icon={<Image />} value={creator.stats.posts} label="posts" /><b>·</b><Stat icon={<Video />} value={creator.stats.media} label="media" /><b>·</b><Stat icon={<Radio />} value={creator.stats.live} label="live" /><b>·</b><Stat icon={<Heart fill="currentColor" />} value={creator.stats.likes} label="likes" /></div></div>
          </div>
          <div className="creator-avatar"><img src={creator.avatarImage} alt={`${creator.name} avatar`} /><span /></div>
        </section>

        <section className="creator-about">
          <button type="button" className="creator-share" onClick={shareProfile} aria-label="Share profile"><Share2 /></button>
<h1>{creator.name} <CreatorBadges badges={creator.badges} /></h1>
          <p className="creator-handle">{creator.handle} <b>·</b> <span>{creator.status}</span></p>
          <p className={`creator-bio ${expanded ? 'is-expanded' : ''}`} aria-expanded={expanded}>{creator.bio}</p>
          <button type="button" className="creator-more-info" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'More info'}</button>
        </section>

        <section className="creator-subscription">
          <span className="creator-section-label">SUBSCRIPTION</span>
<h2>{creator.subscription.title}</h2>
          <button type="button" className="creator-offer-row" onClick={shareProfile} aria-label="View subscription offer">
            <img src={creator.avatarImage} alt="" />
            <span>{creator.subscription.message}</span>
            <span className="offer-arrow">›</span>
          </button>
        </section>

        <section className="creator-content"><div className="creator-tabs"><button type="button" className="active">{creator.tabs.postsLabel}</button><button type="button">{creator.tabs.mediaLabel}</button></div><div className="creator-grid-preview">{[0, 1, 2, 3, 4, 5].map((index) => <div className="locked-preview" key={index}><img src={creator.coverImage} alt={`${creator.name} preview ${index + 1}`} /><div className="locked-overlay"><Heart /><span>Subscribe to unlock</span></div></div>)}</div></section>
        <div className="creator-bottom-space" />
      </div>
      <CreatorProfileNav />
      {shared && <div className="creator-share-toast">Link copied</div>}
    </div>
  </main>
}

export const Route = createFileRoute('/creator/$slug')({ head: ({ params }) => ({ meta: [{ title: `${params.slug} · Telescope` }, { name: 'description', content: 'View this creator profile on Telescope.' }] }), component: CreatorProfilePage })

export { slugify }
