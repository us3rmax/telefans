import { createFileRoute, Link } from '@tanstack/react-router'
import { Edit3, Loader2, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { deleteAdminPost, listAdminCreators, listAdminPosts, updateAdminPost, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/content')({ component: AdminContentPage })
type AdminPost = Awaited<ReturnType<typeof listAdminPosts>>[number]
type Draft = { title: string; caption: string; media_url: string; thumbnail_url: string; status: string; published: boolean; reels_enabled: boolean; is_paid: boolean; unlock_price: string; comments_enabled: boolean }
const toDraft = (post: AdminPost): Draft => ({ title: post.title ?? '', caption: post.caption ?? '', media_url: post.media_url ?? '', thumbnail_url: post.thumbnail_url ?? '', status: post.status ?? 'draft', published: Boolean(post.published), reels_enabled: Boolean(post.reels_enabled), is_paid: Boolean(post.is_paid), unlock_price: String(post.unlock_price ?? 0), comments_enabled: post.comments_enabled !== false })

function AdminContentPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [creatorId, setCreatorId] = useState('all')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [priceEditorId, setPriceEditorId] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState('0')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [nextPosts, nextCreators] = await Promise.all([listAdminPosts(), listAdminCreators()])
      setPosts(nextPosts); setCreators(nextCreators)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load content.') } finally { setLoading(false) }
  }
  useEffect(() => { const selectedCreator = new URLSearchParams(window.location.search).get('creator'); if (selectedCreator) setCreatorId(selectedCreator); void load() }, [])

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return posts.filter(post => {
      const creator = creators.find(item => item.id === post.creator_id)
      const matchesCreator = creatorId === 'all' || post.creator_id === creatorId
      const matchesCategory = category === 'all' || (category === 'paid' && Boolean(post.is_paid)) || (category === 'reels' && (post.type === 'video' || Boolean(post.reels_enabled))) || (category === 'feed' && post.type !== 'video' && !post.is_paid)
      const matchesQuery = !normalized || `${post.title ?? ''} ${post.caption ?? ''} ${creator?.name ?? ''} ${creator?.handle ?? ''}`.toLowerCase().includes(normalized)
      return matchesCreator && matchesCategory && matchesQuery
    })
  }, [posts, creators, creatorId, category, query])

  const beginEdit = (post: AdminPost) => { setEditingId(post.id); setPriceEditorId(null); setDraft(toDraft(post)); setError(''); setNotice('') }
  const setPrice = async (post: AdminPost) => {
    const normalizedPrice = priceValue.trim() === '' ? 0 : Number.parseInt(priceValue, 10) || 0
    const price = Math.max(0, normalizedPrice)
    setSavingId(post.id); setError(''); setNotice('')
    try {
      const updated = await updateAdminPost(post.id, { is_paid: price > 0, unlock_price: price })
      setPosts(current => current.map(item => item.id === post.id ? { ...item, ...updated } : item)); setPriceEditorId(null); setNotice(price > 0 ? `Price set to ${price} Coins.` : 'Post set as free Feed content.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not set the price.') } finally { setSavingId(null) }
  }
  const save = async (post: AdminPost) => {
    if (!draft) return
    setSavingId(post.id); setError(''); setNotice('')
    try {
      const updated = await updateAdminPost(post.id, { title: draft.title.trim(), caption: draft.caption.trim(), media_url: draft.media_url.trim(), thumbnail_url: draft.thumbnail_url.trim() || null, status: draft.status, published: draft.published, reels_enabled: draft.reels_enabled, is_paid: draft.is_paid, unlock_price: draft.is_paid ? Math.max(0, Number.parseInt(draft.unlock_price, 10) || 0) : 0, comments_enabled: draft.comments_enabled })
      setPosts(current => current.map(item => item.id === post.id ? { ...item, ...updated } : item)); setEditingId(null); setDraft(null); setNotice('Post updated successfully.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the post.') } finally { setSavingId(null) }
  }
  const remove = async (post: AdminPost) => {
    if (!window.confirm('Delete this post permanently?')) return
    setSavingId(post.id); setError(''); setNotice('')
    try { await deleteAdminPost(post.id); setPosts(current => current.filter(item => item.id !== post.id)); setNotice('Post deleted successfully.') } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the post.') } finally { setSavingId(null) }
  }
  const togglePublish = async (post: AdminPost) => {
    setSavingId(post.id); setError('')
    try { const publish = post.status !== 'published'; const updated = await updateAdminPost(post.id, { status: publish ? 'published' : 'draft', published: publish }); setPosts(current => current.map(item => item.id === post.id ? { ...item, ...updated } : item)); setNotice(publish ? 'Post published.' : 'Post moved to drafts.') } catch (err) { setError(err instanceof Error ? err.message : 'Could not change the status.') } finally { setSavingId(null) }
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm text-muted-foreground">Administration</p><h1 className="text-2xl font-semibold tracking-tight">Content</h1><p className="mt-1 text-sm text-muted-foreground">Filter by creator and manage every profile post, Paid Media item and Reel from one place.</p></div><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
    <section className="grid gap-3 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"><label className="space-y-1 text-sm"><span className="font-medium">Creator</span><select value={creatorId} onChange={event => setCreatorId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="all">All creators</option>{creators.map(creator => <option key={creator.id} value={creator.id}>{creator.name} · @{creator.handle}</option>)}</select></label><label className="space-y-1 text-sm"><span className="font-medium">Search content</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, caption, or creator" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><div className="flex items-end text-sm text-muted-foreground">Showing {visiblePosts.length} of {posts.length}</div></section>
    <div className="flex gap-2 overflow-x-auto">{['all','feed','paid','reels'].map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'}`}>{item === 'all' ? 'All' : item}</button>)}</div>
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">{loading && <p className="flex items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading content…</p>}{!loading && visiblePosts.map(post => { const creator = creators.find(item => item.id === post.creator_id); const isEditing = editingId === post.id; const busy = savingId === post.id; return <article key={post.id} className="border-b p-4 last:border-b-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-muted">{post.type === 'video' ? <video src={post.media_url} poster={post.thumbnail_url ?? undefined} muted controls className="h-full w-full object-cover" /> : <img src={post.media_url} alt="" className="h-full w-full object-cover" />}</div>{isEditing && draft ? <div className="min-w-0 flex-1 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">Editing media post</p><p className="text-sm text-muted-foreground">{creator?.name ?? 'Unknown creator'}</p></div><Link to="/app/models/$id" params={{ id: post.creator_id }} className="text-sm text-primary">Edit creator profile</Link></div><div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">Title</span><input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} className="h-9 w-full rounded-md border px-3" /></label><label className="space-y-1 text-sm"><span className="font-medium">Status</span><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value, published: event.target.value === 'published' })} className="h-9 w-full rounded-md border px-3"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select></label></div><label className="block space-y-1 text-sm"><span className="font-medium">Caption</span><textarea value={draft.caption} onChange={event => setDraft({ ...draft, caption: event.target.value })} className="min-h-20 w-full rounded-md border p-2" /></label><div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">Media URL</span><input type="url" value={draft.media_url} onChange={event => setDraft({ ...draft, media_url: event.target.value })} className="h-9 w-full rounded-md border px-3" /></label><label className="space-y-1 text-sm"><span className="font-medium">Thumbnail URL</span><input type="url" value={draft.thumbnail_url} onChange={event => setDraft({ ...draft, thumbnail_url: event.target.value })} className="h-9 w-full rounded-md border px-3" /></label></div><div className="flex flex-wrap gap-4 text-sm"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.reels_enabled} onChange={event => setDraft({ ...draft, reels_enabled: event.target.checked })} />Show in Reels</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.is_paid} onChange={event => setDraft({ ...draft, is_paid: event.target.checked })} />Paid Media</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.comments_enabled} onChange={event => setDraft({ ...draft, comments_enabled: event.target.checked })} />Comments</label><label className="inline-flex items-center gap-2">Price <input type="number" min="0" value={draft.unlock_price} onChange={event => setDraft({ ...draft, unlock_price: event.target.value })} className="h-8 w-20 rounded-md border px-2" /></label></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void save(post)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"><Save className="h-4 w-4" />Save changes</button><button type="button" disabled={busy} onClick={() => { setEditingId(null); setDraft(null) }} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><X className="h-4 w-4" />Cancel</button></div></div> : <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="truncate font-medium">{post.title || 'Untitled post'}</p><p className="truncate text-sm text-muted-foreground">{post.caption || 'No caption'}</p><p className="mt-1 text-xs text-muted-foreground">{creator?.name ?? 'Unknown creator'} · {post.type} · {post.status} · {post.is_paid ? `${post.unlock_price ?? 0} Coins · Paid Media` : 'Profile post'}</p></div><Link to="/app/models/$id" params={{ id: post.creator_id }} className="text-sm text-primary">Edit profile</Link></div><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => beginEdit(post)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm"><Edit3 className="h-4 w-4" />Edit media</button><button type="button" disabled={busy} onClick={() => { setPriceEditorId(priceEditorId === post.id ? null : post.id); setPriceValue(String(post.unlock_price ?? 0)); setEditingId(null) }} className="rounded-md border px-2 py-1 text-sm">Set price</button><button type="button" disabled={busy} onClick={() => void remove(post)} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-sm text-destructive"><Trash2 className="h-4 w-4" />Delete</button>{priceEditorId === post.id && <div className="flex items-center gap-2"><input type="number" min="0" value={priceValue} onChange={event => setPriceValue(event.target.value)} className="h-8 w-24 rounded-md border px-2 text-sm" placeholder="0 = Feed" /><button type="button" disabled={busy} onClick={() => void setPrice(post)} className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2 text-xs text-primary-foreground"><Save className="h-3.5 w-3.5" />Save price</button></div>}</div></div>}</div></article> })}{!loading && visiblePosts.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No content matches this creator and filter.</p>}</section>
  </div></main>
}
