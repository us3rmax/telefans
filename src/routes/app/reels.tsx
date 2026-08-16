import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { listAdminPosts, updateAdminPost } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/reels')({ component: AdminReelsPage })
type AdminReel = Awaited<ReturnType<typeof listAdminPosts>>[number]

function AdminReelsPage() {
  const [reels, setReels] = useState<AdminReel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => { setLoading(true); setError(''); try { setReels(await listAdminPosts({ type: 'video' })) } catch (err) { setError(err instanceof Error ? err.message : 'Could not load Reels.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const toggle = async (reel: AdminReel) => { try { const updated = await updateAdminPost(reel.id, { reels_enabled: !reel.reels_enabled }); if (updated) setReels((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item)) } catch (err) { setError(err instanceof Error ? err.message : 'Could not change the queue.') } }
  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm text-muted-foreground">Administration</p><h1 className="text-2xl font-semibold tracking-tight">Reels</h1><p className="mt-1 text-sm text-muted-foreground">Videos published to the public feed.</p></header>{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{loading && <p className="text-sm text-muted-foreground">Loading Reels…</p>}{!loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reels.map((reel) => <article key={reel.id} className="overflow-hidden rounded-xl border bg-background shadow-sm"><div className="aspect-[9/12] bg-black"> <video src={reel.media_url} poster={reel.thumbnail_url ?? undefined} controls muted className="h-full w-full object-cover" /></div><div className="space-y-3 p-4"><div><h2 className="truncate font-medium">{reel.title}</h2><p className="text-sm text-muted-foreground">{reel.status}</p></div><div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-xs ${reel.reels_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{reel.reels_enabled ? 'In queue' : 'Paused'}</span><button type="button" onClick={() => void toggle(reel)} className="rounded-md border px-3 py-2 text-sm">{reel.reels_enabled ? 'Pause' : 'Enable'}</button></div></div></article>)}{reels.length === 0 && <p className="col-span-full rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">No videos have been added yet.</p>}</div>}</div></main>
}
