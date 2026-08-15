import { createFileRoute, Link } from '@tanstack/react-router'
import { House, MessageCircle, PlaySquare, Send, UserRound, Heart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { readAdminPosts } from '@/data/content'
import { addPostComment, listCreatorPosts, listPublishedCreators, listPublishedReels, togglePostLike } from '@/lib/telefans-data'
import '../telescope.css'

type ReelItem = { id: string; creator: string; slug: string; thumbnail: string; video?: string; likes: string; comments: string; shares: string; persisted?: boolean }

const baseReels: ReelItem[] = [
  { id: 'sari-1', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixo/assets/feed/videos/thumbnails/e99ca692-f712-4819-8314-cb178ddc63ce.png', video: 'https://media.telescope.me/posts/sariixo_/3954409237119153417_1010720925.mp4', likes: '1.5K', comments: '45', shares: '87' },
  { id: 'sari-2', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixo/assets/feed/videos/thumbnails/887110cd-40d6-4e9b-a962-a410312b7485.png', video: 'https://media.telescope.me/posts/sariixo_/3955718865442540209_1010720925.mp4', likes: '672', comments: '46', shares: '41' },
  { id: 'sari-3', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixo/assets/feed/videos/thumbnails/110a1d61-01c1-4867-9270-047d421bbc66.png', video: 'https://media.telescope.me/posts/sariixo_/3955913934745296735_1010720925.mp4', likes: '384', comments: '21', shares: '19' },
  { id: 'saffron-1', creator: 'Saffron Summers', slug: 'saffron-summers', thumbnail: 'https://media.telescope.me/influencers/saffronsummers/assets/feed/videos/thumbnails/14bc347d-a564-45af-a255-4d3f070e3562.png', likes: '273', comments: '6', shares: '10' },
  { id: 'emma-1', creator: 'Emma Hix', slug: 'emma-hix', thumbnail: 'https://media.telescope.me/influencers/emmahix/assets/feed/videos/thumbnails/2ca140f6-dfa4-496d-802f-6d8f6bcc8df5.png', likes: '456', comments: '8', shares: '14' },
]

function Nav() {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" className="nav-link"><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} className="nav-link nav-active"><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className="nav-link"><UserRound /><span>Profile</span></Link>
  </nav>
}

function Reel({ reel, onComment, onShare, onLike }: { reel: ReelItem; onComment: () => void; onShare: () => void; onLike?: (liked: boolean) => Promise<void> }) {
  const [liked, setLiked] = useState(false)
  const [playing, setPlaying] = useState(Boolean(reel.video))
  const slug = reel.slug

  const handleLike = () => {
    const nextLiked = !liked
    setLiked(nextLiked)
    void onLike?.(nextLiked)
  }

  return <article className="reel-card">
    {reel.video && playing ? <video className="reel-image" src={reel.video} poster={reel.thumbnail} autoPlay loop muted playsInline onClick={() => setPlaying(false)} aria-label={`Reel de ${reel.creator}`} /> : <button className="reel-media-button" type="button" onClick={() => setPlaying(Boolean(reel.video))} aria-label={reel.video ? 'Reproduzir reel' : 'Reel sem vídeo disponível'}><img className="reel-image" src={reel.thumbnail} alt={`Reel de ${reel.creator}`} /></button>}
    <div className="reel-top-gradient" />
    <div className="reel-bottom-gradient" />
    <div className="reel-tabs">
      <Link to="/reels" search={{ tab: 'trending' }} className="reel-tab active">Trending</Link>
      <Link to="/reels" search={{ tab: 'new' }} className="reel-tab">New</Link>
    </div>
    <div className="reel-caption">
      <Link to="/creator/$slug" params={{ slug }} className="reel-creator-link">{reel.creator}</Link>
      <div className="reel-actions">
        <button type="button" onClick={handleLike} aria-pressed={liked} aria-label="Like reel" className={liked ? 'liked' : ''}><Heart fill={liked ? 'currentColor' : 'none'} /><small>{liked ? '1.6K' : reel.likes}</small></button>
        <button type="button" onClick={onComment} aria-label="Open comments"><MessageCircle /><small>{reel.comments}</small></button>
        <button type="button" onClick={onShare} aria-label="Share reel"><Send /><small>{reel.shares}</small></button>
      </div>
    </div>
  </article>
}

export function ReelsPage() {
  const [notice, setNotice] = useState('')
  const [feed, setFeed] = useState<ReelItem[]>(baseReels)
  const [commentReel, setCommentReel] = useState<ReelItem | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let active = true
    const loadFeed = async () => {
      const localVideos = readAdminPosts().filter((post) => post.type === 'video' && post.published && post.mediaUrl).map((post) => ({ id: post.id, creator: post.creatorName, slug: post.creatorSlug, thumbnail: '', video: post.mediaUrl, likes: '0', comments: String(comments[post.id]?.length ?? 0), shares: '0', persisted: false }))
      try {
        const [remoteReels, creators] = await Promise.all([listPublishedReels(), listPublishedCreators()])
        const creatorMap = new Map(creators.map((creator) => [creator.id, creator]))
        const remoteVideos = remoteReels.map((post) => {
          const creator = creatorMap.get(post.creator_id)
          return { id: post.id, creator: creator?.name ?? 'Creator', slug: creator?.slug ?? '', thumbnail: post.thumbnail_url ?? '', video: post.media_url, likes: '0', comments: '0', shares: '0', persisted: true }
        })
        if (active) setFeed([...remoteVideos, ...localVideos.filter((local) => !remoteVideos.some((remote) => remote.video === local.video)), ...baseReels.filter((reel) => !remoteVideos.some((remote) => remote.video === reel.video) && !localVideos.some((local) => local.video === reel.video))])
      } catch {
        if (active) setFeed([...localVideos, ...baseReels.filter((reel) => !localVideos.some((post) => post.video === reel.video))])
      }
    }
    void loadFeed()
    return () => { active = false }
  }, [])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1800)
  }

  const shareReel = async (reel: ReelItem) => {
    const url = `${window.location.origin}/reels#${reel.id}`
    try {
      if (navigator.share) await navigator.share({ title: `${reel.creator} · Telescope`, url })
      else { await navigator.clipboard?.writeText(url); showNotice('Link copiado') }
    } catch { /* The native share sheet was dismissed. */ }
  }

  return <main className="reels-shell">
    <div className="reels-feed">
      {feed.map((reel) => <Reel key={reel.id} reel={reel} onComment={() => { setCommentDraft(''); setCommentReel(reel) }} onShare={() => void shareReel(reel)} onLike={reel.persisted ? async (liked) => { await togglePostLike(reel.id, liked) } : undefined} />)}
    </div>
    <Nav />
    {notice && <div className="reels-notice">{notice}</div>}
    {commentReel && <div className="comments-backdrop" role="presentation" onClick={() => setCommentReel(null)}>
      <section className="comments-sheet" role="dialog" aria-modal="true" aria-label={`Comentários de ${commentReel.creator}`} onClick={(event) => event.stopPropagation()}>
        <div className="comments-heading"><strong>Comentários</strong><button type="button" onClick={() => setCommentReel(null)} aria-label="Fechar comentários"><X /></button></div>
        <div className="comments-list">{(comments[commentReel.id] ?? []).map((comment, index) => <p key={`${comment}-${index}`} className="comment-item">{comment}</p>)}{!(comments[commentReel.id]?.length) && <p className="comments-empty">Ainda não há comentários neste reel.</p>}</div><form className="comment-form" onSubmit={async (event) => { event.preventDefault(); const value = commentDraft.trim(); if (!value) return; try { if (commentReel.persisted) await addPostComment(commentReel.id, value) } catch { showNotice('Não foi possível guardar o comentário') } setComments((current) => ({ ...current, [commentReel.id]: [...(current[commentReel.id] ?? []), value] })); setCommentDraft('') }}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Escreva um comentário" aria-label="Escreva um comentário" /><button type="submit">Enviar</button></form>
      </section>
    </div>}
  </main>
}

export const Route = createFileRoute('/reels')({
  validateSearch: (search: Record<string, unknown>) => ({ tab: search.tab === 'new' ? 'new' as const : 'trending' as const }),
  head: () => ({ meta: [{ title: 'Reels · Telescope' }, { name: 'description', content: 'Watch trending creator reels on Telescope.' }] }),
  component: ReelsPage,
})
