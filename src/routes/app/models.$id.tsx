import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, ImagePlus, Loader2, Save, Trash2, Upload, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CreatorForm } from '@/components/admin/CreatorForm'
import {
  deleteAdminPost,
  getAdminCreator,
  listAdminPosts,
  updateAdminPost,
  uploadCreatorMediaBatch,
  type Creator,
} from '@/lib/admin-repository'

export const Route = createFileRoute('/app/models/$id')({ component: EditModelPage })
type AdminPost = Awaited<ReturnType<typeof listAdminPosts>>[number]

type PostDraft = { title: string; caption: string; is_paid: boolean; unlock_price: string; reels_enabled: boolean; published: boolean }

const makeDraft = (post: AdminPost): PostDraft => ({
  title: post.title ?? '',
  caption: post.caption ?? '',
  is_paid: Boolean(post.is_paid),
  unlock_price: String(post.unlock_price ?? 0),
  reels_enabled: Boolean(post.reels_enabled),
  published: Boolean(post.published),
})

function EditModelPage() {
  const { id } = Route.useParams()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [paidImages, setPaidImages] = useState(false)
  const [unlockPrice, setUnlockPrice] = useState('10')
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [draft, setDraft] = useState<PostDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextCreator, nextPosts] = await Promise.all([getAdminCreator(id), listAdminPosts({ creatorId: id })])
      setCreator(nextCreator)
      setPosts(nextPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load creator workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  const upload = async () => {
    if (!files.length) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await uploadCreatorMediaBatch(files, id, Math.max(0, Number.parseInt(unlockPrice, 10) || 0), paidImages)
      const uploadedPosts = result.map(item => ({ ...item.post, creators: { name: creator?.name ?? '', slug: creator?.slug ?? '', avatar_image: creator?.avatar_image ?? '' } }))
      setPosts(current => [...uploadedPosts, ...current])
      setFiles([])
      setNotice(`${result.length} file${result.length === 1 ? '' : 's'} added to the creator profile.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload media.')
    } finally { setBusy(false) }
  }

  const savePost = async (post: AdminPost) => {
    if (!draft) return
    setBusy(true); setError(''); setNotice('')
    try {
      const updated = await updateAdminPost(post.id, {
        title: draft.title.trim(),
        caption: draft.caption.trim(),
        is_paid: draft.is_paid,
        unlock_price: draft.is_paid ? Math.max(0, Number.parseInt(draft.unlock_price, 10) || 0) : 0,
        reels_enabled: post.type === 'video' ? draft.reels_enabled : false,
        published: draft.published,
        status: draft.published ? 'published' : 'draft',
      })
      setPosts(current => current.map(item => item.id === post.id ? { ...item, ...updated } : item))
      setEditingPost(null); setDraft(null); setNotice('Post updated successfully.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update post.') } finally { setBusy(false) }
  }

  const removePost = async (post: AdminPost) => {
    if (!window.confirm('Delete this post permanently?')) return
    setBusy(true); setError(''); setNotice('')
    try { await deleteAdminPost(post.id); setPosts(current => current.filter(item => item.id !== post.id)); setNotice('Post deleted successfully.') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete post.') }
    finally { setBusy(false) }
  }

  if (loading) return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl"><p className="text-sm text-muted-foreground">Loading creator workspace…</p></div></main>
  if (!creator) return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-4"><p className="text-sm text-destructive">{error || 'Creator not found.'}</p><Link to="/app/models" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back to creators</Link></div></main>

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Link to="/app/models" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Creators</Link><h1 className="text-2xl font-semibold tracking-tight">{creator.name}</h1><p className="mt-1 text-sm text-muted-foreground">Manage profile, posts, paid media and Reels from one workspace.</p></div><Link to="/creator/$slug" params={{ slug: creator.slug }} className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm">View public profile</Link></header>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    {notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

    <CreatorForm creator={creator} />

    <section className="rounded-xl border bg-background p-4 shadow-sm md:p-6"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold">Add media</h2><p className="mt-1 text-sm text-muted-foreground">Images become profile posts. Videos become Reels automatically.</p></div><Upload className="h-5 w-5 text-muted-foreground" /></div><div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end"><label className="space-y-1 text-sm"><span className="font-medium">Files</span><input type="file" multiple accept="image/*,video/*" onChange={event => setFiles(Array.from(event.target.files ?? []))} className="block w-full rounded-md border bg-background p-2 text-sm" /><small className="text-muted-foreground">{files.length ? `${files.length} selected` : 'Select multiple images and videos.'}</small></label><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={paidImages} onChange={event => setPaidImages(event.target.checked)} />Mark images as Paid Media</label><label className="space-y-1 text-sm"><span className="font-medium">Price</span><input type="number" min="0" value={unlockPrice} onChange={event => setUnlockPrice(event.target.value)} disabled={!paidImages} className="h-10 w-24 rounded-md border px-3 disabled:opacity-50" /></label></div><button type="button" disabled={!files.length || busy} onClick={() => void upload()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"><ImagePlus className="h-4 w-4" />{busy ? 'Uploading…' : 'Upload and publish'}</button></section>

    <section className="rounded-xl border bg-background shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Creator content</h2><p className="mt-1 text-sm text-muted-foreground">{posts.length} total · {posts.filter(post => post.type === 'video').length} Reels · {posts.filter(post => post.is_paid).length} Paid Media</p></div><button type="button" onClick={() => void load()} className="rounded-md border px-3 py-2 text-sm">Refresh</button></div>{posts.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No content yet. Upload files above.</p>}{posts.map(post => { const isEditing = editingPost === post.id; const postDraft = isEditing ? draft : null; return <article key={post.id} className="border-b p-4 last:border-b-0"><div className="flex gap-3"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-muted">{post.type === 'video' ? <video src={post.media_url} poster={post.thumbnail_url ?? undefined} muted controls className="h-full w-full object-cover" /> : <img src={post.media_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1">{isEditing && postDraft ? <div className="space-y-3"><input value={postDraft.title} onChange={event => setDraft({ ...postDraft, title: event.target.value })} className="h-9 w-full rounded-md border px-3 text-sm" /><textarea value={postDraft.caption} onChange={event => setDraft({ ...postDraft, caption: event.target.value })} className="min-h-16 w-full rounded-md border p-2 text-sm" /><div className="flex flex-wrap gap-4 text-sm"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={postDraft.published} onChange={event => setDraft({ ...postDraft, published: event.target.checked })} />Published</label>{post.type === 'video' && <label className="inline-flex items-center gap-2"><input type="checkbox" checked={postDraft.reels_enabled} onChange={event => setDraft({ ...postDraft, reels_enabled: event.target.checked })} />Show in Reels</label>}{post.type === 'image' && <label className="inline-flex items-center gap-2"><input type="checkbox" checked={postDraft.is_paid} onChange={event => setDraft({ ...postDraft, is_paid: event.target.checked })} />Paid Media <input type="number" min="0" value={postDraft.unlock_price} onChange={event => setDraft({ ...postDraft, unlock_price: event.target.value })} className="h-8 w-20 rounded-md border px-2" /></label>}</div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void savePost(post)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"><Save className="h-4 w-4" />Save</button><button type="button" onClick={() => { setEditingPost(null); setDraft(null) }} className="rounded-md border px-3 py-2 text-sm">Cancel</button></div></div> : <><p className="truncate font-medium">{post.title || 'Untitled post'}</p><p className="truncate text-sm text-muted-foreground">{post.caption || 'No caption'}</p><p className="mt-1 text-xs text-muted-foreground">{post.type === 'video' ? 'Reel' : post.is_paid ? `Paid Media · ${post.unlock_price ?? 0} Coins` : 'Profile post'} · {post.published ? 'Published' : 'Draft'}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingPost(post.id); setDraft(makeDraft(post)) }} className="rounded-md border px-2 py-1 text-sm">Edit</button><button type="button" disabled={busy} onClick={() => void removePost(post)} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-sm text-destructive"><Trash2 className="h-4 w-4" />Delete</button></div></>}</div></div></article> })}</section>
  </div></main>
}
