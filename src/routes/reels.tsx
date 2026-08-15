import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { House, MessageCircle, PlaySquare, Send, UserRound, Heart, X, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { readAdminPosts } from '@/data/content'
import { addPostComment, hasPostLike, listPostComments, listPublishedCreators, listPublishedReels, togglePostLike } from '@/lib/telefans-data'
import '../telescope.css'

type ReelItem = { id: string; creator: string; slug: string; avatar?: string; thumbnail: string; video?: string; likes: string; comments: string; shares: string; persisted?: boolean }

const baseReels: ReelItem[] = [
  { id: 'sari-1', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixo/assets/feed/videos/thumbnails/e99ca692-f712-4819-8314-cb178ddc63ce.png', video: 'https://media.telescope.me/posts/sariixo_/3954409237119153417_1010720925.mp4', likes: '1.5K', comments: '45', shares: '87' },
  { id: 'sari-2', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixos/assets/feed/videos/thumbnails/887110cd-40d6-4e9b-a962-a410312b7485.png', video: 'https://media.telescope.me/posts/sariixo_/3955718865442540209_1010720925.mp4', likes: '672', comments: '46', shares: '41' },
  { id: 'sari-3', creator: 'Sari xo', slug: 'sari-xo', thumbnail: 'https://media.telescope.me/influencers/sarixo/assets/feed/videos/thumbnails/110a1d61-01c1-4867-9270-047d421bbc66.png', video: 'https://media.telescope.me/posts/sariixo_/3955913934745296735_1010720925.mp4', likes: '384', comments: '21', shares: '19' },
]

function Nav() {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" className="nav-link"><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} className="nav-link nav-active"><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className="nav-link"><UserRound /><span>Profile</span></Link>
  </nav>
}

function Reel({ reel, activeTab, onComment, onShare, onLike, initialLiked }: { reel: ReelItem; activeTab: 'trending' | 'new'; onComment: () => void; onShare: () => void; onLike?: (liked: boolean) => Promise<void>; initialLiked: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(initialLiked)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [likeBusy, setLikeBusy] = useState(false)
  const slug = reel.slug

  useEffect(() => setLiked(initialLiked), [initialLiked])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (muted) { video.muted = false; setMuted(false) }
    if (video.paused) { void video.play().then(() => setPaused(false)).catch(() => setPaused(true)) }
    else { video.pause(); setPaused(true) }
  }

  const handleLike = async () => {
    if (!onLike || likeBusy) return
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeBusy(true)
    try { await onLike(nextLiked) } catch { setLiked(!nextLiked) }
    finally { setLikeBusy(false) }
  }

  return <article className="reel-card">
    {reel.video ? <>
      <video ref={videoRef} className="reel-image" src={reel.video} poster={reel.thumbnail || undefined} autoPlay loop playsInline muted={muted} onClick={togglePlayback} onPlay={() => setPaused(false)} onPause={() => setPaused(true)} aria-label={`Reel de ${reel.creator}`} />
      <button type="button" className="reel-play-toggle" onClick={togglePlayback} aria-label={paused ? 'Reproduzir reel' : 'Pausar reel'}>{paused ? <Play /> : <Pause />}</button>
      <button type="button" className="reel-sound-toggle" onClick={() => { const next = !muted; videoRef.current && (videoRef.current.muted = next); setMuted(next); void videoRef.current?.play() }} aria-label={muted ? 'Ativar áudio' : 'Desativar áudio'}>{muted ? <VolumeX /> : <Volume2 />}</button>
    </> : <img className="reel-image" src={reel.thumbnail} alt={`Reel de ${reel.creator}`} />}
    <div className="reel-top-gradient" />
    <div className="reel-bottom-gradient" />
    <div className="reel-tabs" aria-label="Filtro de Reels">
      <Link to="/reels" search={{ tab: 'trending' }} className={`reel-tab ${activeTab === 'trending' ? 'active' : ''}`}>Trending</Link>
      <Link to="/reels" search={{ tab: 'new' }} className={`reel-tab ${activeTab === 'new' ? 'active' : ''}`}>New</Link>
    </div>
    <div className="reel-caption">
      <Link to="/creator/$slug" params={{ slug }} className="reel-creator-link">
        <span className="reel-creator-avatar">{reel.avatar ? <img src={reel.avatar} alt="" /> : reel.creator.slice(0, 1)}</span>
        <span>{reel.creator}</span>
      </Link>
      <div className="reel-actions">
        <button type="button" onClick={() => void handleLike()} aria-pressed={liked} aria-label="Like reel" className={liked ? 'liked' : ''}><Heart fill={liked ? 'currentColor' : 'none'} /><small>{liked ? '1' : reel.likes}</small></button>
        <button type="button" onClick={onComment} aria-label="Open comments"><MessageCircle /><small>{reel.comments}</small></button>
        <button type="button" onClick={onShare} aria-label="Share reel"><Send /><small>{reel.shares}</small></button>
      </div>
    </div>
  </article>
}

export function ReelsPage() {
  const { tab } = useSearch({ from: '/reels' })
  const [notice, setNotice] = useState('')
  const [feed, setFeed] = useState<ReelItem[]>(baseReels)
  const [commentReel, setCommentReel] = useState<ReelItem | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<Record<string, string[]>>({})
  const [likedByPost, setLikedByPost] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    const loadFeed = async () => {
      const localVideos = readAdminPosts().filter((post) => post.type === 'video' && post.published && post.mediaUrl).map((post) => ({ id: post.id, creator: post.creatorName, slug: post.creatorSlug, thumbnail: '', video: post.mediaUrl, likes: '0', comments: '0', shares: '0', persisted: false }))
      try {
        const [remoteReels, creators] = await Promise.all([listPublishedReels(), listPublishedCreators()])
        const creatorMap = new Map(creators.map((creator) => [creator.id, creator]))
        const remoteVideos = remoteReels.map((post) => { const creator = creatorMap.get(post.creator_id); return { id: post.id, creator: creator?.name ?? 'Creator', slug: creator?.slug ?? '', avatar: creator?.avatar_image ?? undefined, thumbnail: post.thumbnail_url ?? '', video: post.media_url, likes: '0', comments: '0', shares: '0', persisted: true } })
        if (active) setFeed([...remoteVideos, ...localVideos.filter((local) => !remoteVideos.some((remote) => remote.video === local.video)), ...baseReels.filter((reel) => !remoteVideos.some((remote) => remote.video === reel.video) && !localVideos.some((local) => local.video === reel.video))])
      } catch { if (active) setFeed([...localVideos, ...baseReels.filter((reel) => !localVideos.some((post) => post.video === reel.video))]) }
    }
    void loadFeed()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!feed.length) return
    let active = true
    void Promise.all(feed.filter(reel => reel.persisted).map(async reel => { try { return [reel.id, await hasPostLike(reel.id)] as const } catch { return [reel.id, false] as const } })).then(entries => { if (active) setLikedByPost(Object.fromEntries(entries)) })
    return () => { active = false }
  }, [feed])

  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 1800) }
  const openComments = async (reel: ReelItem) => {
    setCommentDraft(''); setCommentReel(reel)
    if (!reel.persisted) return
    try { const rows = await listPostComments(reel.id); setComments(current => ({ ...current, [reel.id]: rows.map(row => row.body) })) } catch { showNotice('Não foi possível carregar os comentários') }
  }
  const shareReel = async (reel: ReelItem) => { const url = `${window.location.origin}/reels#${reel.id}`; try { if (navigator.share) await navigator.share({ title: `${reel.creator} · TeleFans`, url }); else { await navigator.clipboard?.writeText(url); showNotice('Link copiado') } } catch { /* cancelled */ } }

  return <main className="reels-shell">
    <div className="reels-feed">
      {feed.map((reel) => <Reel key={reel.id} reel={reel} activeTab={tab} initialLiked={likedByPost[reel.id] ?? false} onComment={() => void openComments(reel)} onShare={() => void shareReel(reel)} onLike={reel.persisted ? async liked => { await togglePostLike(reel.id, liked); setLikedByPost(current => ({ ...current, [reel.id]: liked })) } : undefined} />)}
    </div>
    <Nav />
    {notice && <div className="reels-notice">{notice}</div>}
    {commentReel && <div className="comments-backdrop" role="presentation" onClick={() => setCommentReel(null)}><section className="comments-sheet" role="dialog" aria-modal="true" aria-label={`Comentários de ${commentReel.creator}`} onClick={event => event.stopPropagation()}><div className="comments-heading"><strong>Comentários</strong><button type="button" onClick={() => setCommentReel(null)} aria-label="Fechar comentários"><X /></button></div><div className="comments-list">{(comments[commentReel.id] ?? []).map((comment, index) => <p key={`${comment}-${index}`} className="comment-item">{comment}</p>)}{!(comments[commentReel.id]?.length) && <p className="comments-empty">Ainda não há comentários neste reel.</p>}</div><form className="comment-form" onSubmit={async event => { event.preventDefault(); const value = commentDraft.trim(); if (!value) return; try { if (commentReel.persisted) await addPostComment(commentReel.id, value); setComments(current => ({ ...current, [commentReel.id]: [...(current[commentReel.id] ?? []), value] })); setCommentDraft('') } catch { showNotice('Não foi possível guardar o comentário') } }}><input value={commentDraft} onChange={event => setCommentDraft(event.target.value)} placeholder="Escreva um comentário" aria-label="Escreva um comentário" /><button type="submit">Enviar</button></form></section></div>}
  </main>
}

export const Route = createFileRoute('/reels')({ validateSearch: (search: Record<string, unknown>) => ({ tab: search.tab === 'new' ? 'new' as const : 'trending' as const }), head: () => ({ meta: [{ title: 'Reels · TeleFans' }, { name: 'description', content: 'Watch trending creator reels on TeleFans.' }] }), component: ReelsPage })
