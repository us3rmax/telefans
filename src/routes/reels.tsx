import { ChevronDown, ChevronLeft, Heart, House, MessageCircle, MoreHorizontal, Pause, Play, PlaySquare, Send, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { readAdminPosts } from '@/data/content'
import { addPostComment, hasPostLike, listPostComments, listPublishedCreators, listPublishedReels, recordPostView, togglePostLike } from '@/lib/telefans-data'
import { getTelegramUser, useTelegramBackButton } from '@/lib/telegram-auth'
import '../telescope.css'

type FeedTab = 'trending' | 'new'
type CommentRow = { id: string; body: string; created_at: string; visitor_key?: string | null; user_id?: string | null; telegram_id?: number | null; author_name?: string | null; author_username?: string | null; author_photo_url?: string | null }

type ReelItem = {
  id: string
  creator: string
  slug: string
  avatar?: string
  thumbnail: string
  video: string
  likes: number
  comments: number
  views: number
  commentsEnabled: boolean
  persisted: boolean
}

function formatCount(value: number) {
  if (value < 1000) return String(value)
  if (value < 1000000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '')}K`
  return `${(value / 1000000).toFixed(1).replace('.0', '')}M`
}

function relativeTime(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function commentAuthor(comment: CommentRow, currentName: string) {
  return comment.author_name || (comment.visitor_key && comment.visitor_key === currentName ? currentName : 'TeleFans user')
}

function Nav() {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" className="nav-link"><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} className="nav-link nav-active"><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className="nav-link"><UserRound /><span>Profile</span></Link>
  </nav>
}

function Reel({ reel, active, loadVideo, onVisible, onComment, onShare, onLike, initialLiked, onOpenCreator }: { reel: ReelItem; active: boolean; loadVideo: boolean; onVisible: (id: string) => void; onComment: () => void; onShare: () => void; onLike?: (liked: boolean) => Promise<{ applied: boolean; delta: -1 | 0 | 1 }>; initialLiked: boolean; onOpenCreator: (id: string) => void }) {
  const cardRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(initialLiked)
  const [paused, setPaused] = useState(true)
  const [muted, setMuted] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const optimisticLikeRef = useRef(false)

  useEffect(() => {
    if (!optimisticLikeRef.current) setLiked(initialLiked)
  }, [initialLiked])

  const playVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video || mediaError) return
    video.muted = muted
    try {
      await video.play()
      setPaused(false)
    } catch {
      video.muted = true
      setMuted(true)
      try { await video.play(); setPaused(false) } catch { setPaused(true) }
    }
  }, [mediaError, muted])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.7) onVisible(reel.id)
      if (!entry.isIntersecting && videoRef.current) { videoRef.current.pause(); setPaused(true) }
    }, { threshold: [0.7] })
    observer.observe(card)
    return () => observer.disconnect()
  }, [onVisible, reel.id])

  useEffect(() => {
    if (!active || !loadVideo || mediaError) return
    void playVideo()
    return () => { videoRef.current?.pause() }
  }, [active, loadVideo, mediaError, playVideo])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = false
      setMuted(false)
      void playVideo()
    } else {
      video.pause()
      setPaused(true)
    }
  }

  const handleLike = async () => {
    if (!onLike || likeBusy) return
    const nextLiked = !liked
    optimisticLikeRef.current = true
    setLiked(nextLiked)
    setLikeBusy(true)
    try {
      const result = await onLike(nextLiked)
      if (!result.applied) {
        optimisticLikeRef.current = false
        setLiked(!nextLiked)
      }
    } catch {
      optimisticLikeRef.current = false
      setLiked(!nextLiked)
    }
    finally { setLikeBusy(false) }
  }

  return <article ref={cardRef} data-reel-id={reel.id} className="reel-card">
    {loadVideo && !mediaError ? <video ref={videoRef} className="reel-image" src={reel.video} poster={reel.thumbnail || undefined} preload="metadata" loop playsInline muted={muted} onClick={togglePlayback} onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setMediaError(true)} aria-label={`Reel de ${reel.creator}`} /> : <img className="reel-image" src={reel.thumbnail || reel.video} alt={`Reel de ${reel.creator}`} loading="lazy" />}
    {loadVideo && !mediaError && <button type="button" className="reel-play-toggle" onClick={togglePlayback} aria-label={paused ? 'Reproduzir reel' : 'Pausar reel'}>{paused ? <Play /> : <Pause />}</button>}
    {mediaError && <div className="reel-media-error">Não foi possível carregar este vídeo.</div>}
    <div className="reel-top-gradient" />
    <div className="reel-bottom-gradient" />
    <div className="reels-creator-caption">
      <Link to="/creator/$slug" params={{ slug: reel.slug }} onClick={() => onOpenCreator(reel.id)} className="reel-creator-link" aria-label={`Abrir perfil de ${reel.creator}`}>
        <span>{reel.creator}</span>
      </Link>
    </div>
    <div className="reel-actions" aria-label={`Acções de ${reel.creator}`}>
      <Link to="/creator/$slug" params={{ slug: reel.slug }} onClick={() => onOpenCreator(reel.id)} className="reel-follow-avatar" aria-label={`Abrir perfil de ${reel.creator}`}>{reel.avatar ? <img src={reel.avatar} alt="" /> : reel.creator.slice(0, 1)}<span>+</span></Link>
      <button type="button" onClick={() => void handleLike()} aria-pressed={liked} aria-label="Gostar do Reel" disabled={!onLike || likeBusy} className={liked ? 'liked' : ''}><Heart fill={liked ? 'currentColor' : 'none'} /><small>{formatCount(reel.likes)}</small></button>
      <button type="button" onClick={onComment} aria-label={reel.commentsEnabled ? 'Abrir comentários' : 'Comentários desactivados'} disabled={!reel.commentsEnabled}><MessageCircle /><small>{formatCount(reel.comments)}</small></button>
      <button type="button" onClick={onShare} aria-label="Partilhar Reel"><Send /><small>{formatCount(reel.views)}</small></button>
    </div>
  </article>
}

export function ReelsPage() {
  const { tab } = useSearch({ from: '/reels' })
  const activeTab: FeedTab = tab === 'new' ? 'new' : 'trending'
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feed, setFeed] = useState<ReelItem[]>([])
  const [commentReel, setCommentReel] = useState<ReelItem | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({})
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({})
  const [commentBusy, setCommentBusy] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentTelegramId, setCurrentTelegramId] = useState<number | null>(null)
  const [insideTelegram, setInsideTelegram] = useState(false)
  const [likedByPost, setLikedByPost] = useState<Record<string, boolean>>({})
  const [activeReelId, setActiveReelId] = useState<string | null>(null)
  const viewedReels = useRef(new Set<string>())
  const reelsFeedRef = useRef<HTMLDivElement>(null)
  const restoringPosition = useRef(false)
  const positionKey = 'telefans.reels.position'

  useEffect(() => {
    let attempts = 0
    const timer = window.setInterval(() => {
      const detected = Boolean(window.Telegram?.WebApp)
      if (detected) setInsideTelegram(true)
      attempts += 1
      if (detected || attempts >= 20) window.clearInterval(timer)
    }, 100)
    if (window.Telegram?.WebApp) {
      setInsideTelegram(true)
      window.clearInterval(timer)
    }
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => useTelegramBackButton(() => window.history.back()), [])

  useEffect(() => {
    void getTelegramUser().then((user) => {
      if (user) {
        setCurrentUserName([user.first_name, user.last_name].filter(Boolean).join(' '))
        setCurrentTelegramId(user.id)
      }
    }).catch(() => undefined)
  }, [])

  const showNotice = useCallback((message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }, [])

  useEffect(() => {
    let mounted = true
    const loadFeed = async () => {
      setLoading(true); setError('')
      try {
        const [remoteReels, creators] = await Promise.all([listPublishedReels(), listPublishedCreators()])
        const creatorMap = new Map(creators.map((creator) => [creator.id, creator]))
        const remoteVideos: ReelItem[] = remoteReels.flatMap((post) => {
          const creator = creatorMap.get(post.creator_id)
          if (!creator || !post.media_url) return []
          return [{ id: post.id, creator: creator.name, slug: creator.slug, avatar: creator.avatar_image || undefined, thumbnail: post.thumbnail_url ?? '', video: post.media_url, likes: post.metrics.likes, comments: post.metrics.comments, views: post.metrics.views, commentsEnabled: post.comments_enabled, persisted: true }]
        })
        const localVideos: ReelItem[] = readAdminPosts().filter((post) => post.type === 'video' && post.published && post.mediaUrl).map((post) => ({ id: post.id, creator: post.creatorName, slug: post.creatorSlug, thumbnail: '', video: post.mediaUrl, likes: 0, comments: 0, views: 0, commentsEnabled: true, persisted: false }))
        const unique = [...remoteVideos, ...localVideos.filter((local) => !remoteVideos.some((remote) => remote.video === local.video))]
        const sorted = activeTab === 'new' ? unique.sort((a, b) => b.id.localeCompare(a.id)) : unique.sort((a, b) => (b.likes * 3 + b.comments * 2 + b.views) - (a.likes * 3 + a.comments * 2 + a.views))
        if (mounted) {
          setFeed(sorted)
          let restoredId: string | null = null
          try { restoredId = JSON.parse(sessionStorage.getItem(positionKey) || 'null')?.id ?? null } catch { restoredId = null }
          setActiveReelId(restoredId && sorted.some((item) => item.id === restoredId) ? restoredId : sorted[0]?.id ?? null)
        }
      } catch (loadError) {
        if (mounted) { setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os Reels.'); setFeed([]) }
      } finally { if (mounted) setLoading(false) }
    }
    void loadFeed()
    return () => { mounted = false }
  }, [activeTab])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!activeReelId || !feed.length) return
      const container = reelsFeedRef.current
      const index = feed.findIndex((reel) => reel.id === activeReelId)
      if (!container || index < 0) return
      let savedTop: number | null = null
      try {
        const saved = JSON.parse(sessionStorage.getItem(positionKey) || 'null')
        savedTop = typeof saved?.scrollTop === 'number' ? saved.scrollTop : null
      } catch { savedTop = null }
      restoringPosition.current = true
      container.scrollTo({ top: savedTop ?? index * container.clientHeight, behavior: 'auto' })
      window.setTimeout(() => { restoringPosition.current = false }, 120)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeReelId, feed])

  useEffect(() => {
    let mounted = true
    void Promise.all(feed.filter((reel) => reel.persisted).map(async (reel) => { try { return [reel.id, await hasPostLike(reel.id, currentTelegramId)] as const } catch { return [reel.id, false] as const } })).then((entries) => { if (mounted) setLikedByPost(Object.fromEntries(entries)) })
    return () => { mounted = false }
  }, [feed, currentTelegramId])

  const handleVisible = useCallback((id: string) => {
    if (restoringPosition.current) return
    setActiveReelId(id)
    try { sessionStorage.setItem(positionKey, JSON.stringify({ id, tab: activeTab, scrollTop: reelsFeedRef.current?.scrollTop ?? 0 })) } catch { /* storage opcional */ }
    if (viewedReels.current.has(id)) return
    viewedReels.current.add(id)
    const reel = feed.find((item) => item.id === id)
    if (reel?.persisted) void recordPostView(id, currentTelegramId).catch(() => undefined)
  }, [feed, activeTab, currentTelegramId])

  const openComments = async (reel: ReelItem) => {
    if (!reel.commentsEnabled) return
    setCommentDraft(''); setCommentReel(reel)
    if (!reel.persisted || comments[reel.id]) return
    try {
      const rows = await listPostComments(reel.id) as CommentRow[]
      setComments((current) => ({ ...current, [reel.id]: rows }))
    } catch { showNotice('Não foi possível carregar os comentários') }
  }

  const shareReel = async (reel: ReelItem) => {
    const url = `${window.location.origin}/reels?tab=${activeTab}#${encodeURIComponent(reel.id)}`
    const text = `${reel.creator} · TeleFans`
    const telegram = window.Telegram?.WebApp
    if (telegram?.openTelegramLink) { telegram.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`); return }
    try { if (navigator.share) await navigator.share({ title: text, url }); else { await navigator.clipboard?.writeText(url); showNotice('Link copiado') } } catch { /* cancelado */ }
  }

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!commentReel || commentBusy) return
    const value = commentDraft.trim()
    if (!value) return
    setCommentBusy(true)
    try {
      if (commentReel.persisted) {
        const created = await addPostComment(commentReel.id, value, currentTelegramId) as CommentRow | null
        if (created) setComments((current) => ({ ...current, [commentReel.id]: [...(current[commentReel.id] ?? []), { ...created, telegram_id: currentTelegramId, author_name: currentUserName || 'TeleFans user' }] }))
      } else {
        setComments((current) => ({ ...current, [commentReel.id]: [...(current[commentReel.id] ?? []), { id: crypto.randomUUID(), body: value, created_at: new Date().toISOString(), visitor_key: currentUserName, telegram_id: currentTelegramId, author_name: currentUserName || 'TeleFans user' }] }))
      }
      setFeed((current) => current.map((item) => item.id === commentReel.id ? { ...item, comments: item.comments + 1 } : item))
      setCommentDraft('')
    } catch { showNotice('Não foi possível guardar o comentário') }
    finally { setCommentBusy(false) }
  }

  const activeIndex = Math.max(0, feed.findIndex((reel) => reel.id === activeReelId))
  const visibleFeed = useMemo(() => feed, [feed])
  const commentRows = commentReel ? comments[commentReel.id] ?? [] : []

  return <main className={`reels-shell${commentReel ? ' comments-open' : ''}`}>
    <header className={`reels-topbar ${insideTelegram ? 'reels-topbar-telegram' : ''}`}>
      {!insideTelegram && <button type="button" className="reels-back-button" onClick={() => window.history.back()} aria-label="Voltar"><ChevronLeft /><span>Voltar</span></button>}
      <div className="reels-controls" aria-label="Filtro de Reels">
        <Link to="/reels" search={{ tab: 'trending' }} className={`reel-tab ${activeTab === 'trending' ? 'active' : ''}`}>Trending</Link>
        <Link to="/reels" search={{ tab: 'new' }} className={`reel-tab ${activeTab === 'new' ? 'active' : ''}`}>New</Link>
      </div>
      {!insideTelegram && <button type="button" className="reels-menu-button" aria-label="Opções"><ChevronDown /><MoreHorizontal /></button>}
    </header>
    <div ref={reelsFeedRef} className="reels-feed">
      {loading && <div className="reels-state">A carregar Reels…</div>}
      {!loading && error && <div className="reels-state reels-state-error">{error}</div>}
      {!loading && !error && !feed.length && <div className="reels-state">Ainda não existem Reels publicados.</div>}
      {!loading && !error && visibleFeed.map((reel, index) => <Reel key={reel.id} reel={reel} active={activeReelId === reel.id || (!activeReelId && index === 0)} loadVideo={Math.abs(index - activeIndex) <= 1} onVisible={handleVisible} initialLiked={likedByPost[reel.id] ?? false} onOpenCreator={(id) => { try { sessionStorage.setItem(positionKey, JSON.stringify({ id, tab: activeTab, scrollTop: reelsFeedRef.current?.scrollTop ?? 0 })) } catch { /* storage opcional */ } }} onComment={() => void openComments(reel)} onShare={() => void shareReel(reel)} onLike={reel.persisted ? async (liked) => { const result = await togglePostLike(reel.id, liked, currentTelegramId); if (result.applied) { setFeed((current) => current.map((item) => item.id === reel.id ? { ...item, likes: Math.max(0, item.likes + result.delta) } : item)); setLikedByPost((current) => ({ ...current, [reel.id]: liked })) } return result } : undefined} />)}
    </div>
    <Nav />
    {notice && <div className="reels-notice" role="status">{notice}</div>}
    {commentReel && <div className="comments-backdrop" role="presentation" onClick={() => setCommentReel(null)}><section className="comments-sheet" role="dialog" aria-modal="true" aria-label={`Comentários de ${commentReel.creator}`} onClick={(event) => event.stopPropagation()}>
      <div className="comments-heading"><strong>{commentRows.length || commentReel.comments} comments</strong><button type="button" onClick={() => setCommentReel(null)} aria-label="Fechar comentários"><X /></button></div>
      <div className="comments-list">{commentRows.map((comment) => <article key={comment.id} className="comment-item"><div className="comment-content"><div className="comment-meta"><strong>{commentAuthor(comment, currentUserName)}</strong><small>{relativeTime(comment.created_at)}</small></div><p>{comment.body}</p></div><button type="button" className={`comment-like ${commentLikes[comment.id] ? 'liked' : ''}`} onClick={() => setCommentLikes((current) => ({ ...current, [comment.id]: !current[comment.id] }))} aria-label="Gostar do comentário"><Heart fill={commentLikes[comment.id] ? 'currentColor' : 'none'} /><small>{commentLikes[comment.id] ? 1 : 0}</small></button></article>)}{!commentRows.length && <p className="comments-empty">Ainda não há comentários neste Reel.</p>}</div>
      <form className="comment-form" onSubmit={submitComment}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add comment…" aria-label="Adicionar comentário" maxLength={1000} disabled={commentBusy} /><button type="submit" disabled={commentBusy || !commentDraft.trim()}>{commentBusy ? '...' : 'Post'}</button></form>
    </section></div>}
  </main>
}

export const Route = createFileRoute('/reels')({ validateSearch: (search: Record<string, unknown>) => ({ tab: search.tab === 'new' ? 'new' as const : 'trending' as const }), head: () => ({ meta: [{ title: 'Reels · TeleFans' }, { name: 'description', content: 'Watch trending creator reels on TeleFans.' }] }), component: ReelsPage })
