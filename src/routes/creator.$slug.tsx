import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Heart, Image, Radio, Share2, Video } from 'lucide-react'
import { useState } from 'react'
import '../telescope.css'

const creatorProfiles = {
  'abigaiil-morris': { name: 'Abigaiil Morris', handle: '@abigaiilmorris', image: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public', bio: 'Hey! I’m Abigaiil. Welcome to my exclusive space — come closer and get to know me better.', posts: '128', media: '96', likes: '3.2K', offer: '80% OFF — Come see all my new content! 🔥' },
  'alex-mucci': { name: 'Alex Mucci', handle: '@alexmucci', image: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public', bio: 'Your favorite Italian creator. New photos, videos and behind-the-scenes content every week.', posts: '214', media: '175', likes: '8.7K', offer: 'New content every week — don’t miss this 💋' },
  'emma-hix': { name: 'Emma Hix', handle: '@emmahix', image: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/a6184bf9-e8f4-4e3f-2907-02eb2aeff000/public', bio: 'Hi babes! This is my little corner for my newest content and daily updates.', posts: '456', media: '312', likes: '12.4K', offer: 'Unlock my newest exclusive drops ✨' },
  'lily-phillips': { name: 'Lily Phillips', handle: '@lilyphillips', image: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/d14de298-7e05-4b79-ec24-4b35ccbd4e00/public', bio: 'Welcome to my page. I’m sharing more of the things I can’t post anywhere else.', posts: '189', media: '142', likes: '5.1K', offer: 'See what I can’t post anywhere else 🔥' },
  'pleasant-morenaa': { name: 'Pleasant Morenaa', handle: '@pleasantmorenaa', image: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/924fed1a-5cc0-41fa-3a25-a2ecb3569200/public', bio: 'Come say hello and enjoy my latest exclusive drops.', posts: '96', media: '74', likes: '2.8K', offer: 'Come say hello to my exclusive content 💕' },
} as const

type CreatorProfile = (typeof creatorProfiles)[keyof typeof creatorProfiles]

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function Verified() { return <span className="verified-mark" aria-label="Verified"><Check /></span> }
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <span className="cover-stat"><span>{icon}</span>{value}<span className="sr-only"> {label}</span></span> }

function CreatorProfileNav() {
  return <nav className="creator-profile-nav" aria-label="Profile navigation">
    <Link to="/" aria-label="Explore"><span className="profile-home-glyph" /></Link>
    <Link to="/reels" aria-label="Reels"><Video /></Link>
    <button type="button" aria-label="More options"><span className="profile-more-glyph">•••</span></button>
  </nav>
}

export function CreatorProfilePage() {
  const { slug } = Route.useParams()
  const creator = creatorProfiles[slug as keyof typeof creatorProfiles] ?? { name: slug.replace(/-/g, ' '), handle: `@${slug}`, image: creatorProfiles['abigaiil-morris'].image, bio: 'Welcome to my exclusive profile on Telescope.', posts: '120', media: '80', likes: '1.5K', offer: 'Come see my latest exclusive content 🔥' }
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
          <img src={creator.image} alt={creator.name} />
          <div className="creator-hero-gradient" />
          <div className="creator-cover-header">
            <Link to="/" className="creator-cover-back" aria-label="Back to explore"><ArrowLeft /></Link>
            <div className="creator-cover-name"><strong>{creator.name} <Verified /></strong><div><Stat icon={<Image />} value={creator.posts} label="posts" /><b>·</b><Stat icon={<Video />} value={creator.media} label="media" /><b>·</b><Stat icon={<Radio />} value="24" label="live" /><b>·</b><Stat icon={<Heart fill="currentColor" />} value={creator.likes} label="likes" /></div></div>
          </div>
          <div className="creator-avatar"><img src={creator.image} alt={`${creator.name} avatar`} /><span /></div>
        </section>

        <section className="creator-about">
          <button type="button" className="creator-share" onClick={shareProfile} aria-label="Share profile"><Share2 /></button>
          <h1>{creator.name} <Verified /></h1>
          <p className="creator-handle">{creator.handle} <b>·</b> <span><i />Available now</span></p>
          <p className={`creator-bio ${expanded ? 'is-expanded' : ''}`}>{creator.bio}</p>
          <button type="button" className="creator-more-info" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'More info'}</button>
        </section>

        <section className="creator-subscription">
          <span className="creator-section-label">SUBSCRIPTION</span>
          <h2>Limited offer: 80% off for the first 31 days!</h2>
          <button type="button" className="creator-offer-row" onClick={shareProfile} aria-label="View subscription offer">
            <img src={creator.image} alt="" />
            <span>{creator.offer}</span>
            <span className="offer-arrow">›</span>
          </button>
        </section>

        <section className="creator-content"><div className="creator-tabs"><button type="button" className="active">Posts</button><button type="button">Media</button></div><div className="creator-grid-preview">{[0, 1, 2, 3, 4, 5].map((index) => <div className="locked-preview" key={index}><img src={creator.image} alt={`${creator.name} preview ${index + 1}`} /><div className="locked-overlay"><Heart /><span>Subscribe to unlock</span></div></div>)}</div></section>
        <div className="creator-bottom-space" />
      </div>
      <CreatorProfileNav />
      {shared && <div className="creator-share-toast">Link copied</div>}
    </div>
  </main>
}

export const Route = createFileRoute('/creator/$slug')({ head: ({ params }) => ({ meta: [{ title: `${params.slug} · Telescope` }, { name: 'description', content: 'View this creator profile on Telescope.' }] }), component: CreatorProfilePage })

export { slugify }
