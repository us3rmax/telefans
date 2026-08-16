import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, ToggleLeft, ToggleRight, Pencil, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listAdminCreators, setCreatorPublished, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/models')({ component: AdminModelsPage })

function AdminModelsPage() {
  const [models, setModels] = useState<Creator[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setModels(await listAdminCreators()) } catch (err) { setError(err instanceof Error ? err.message : 'Could not load creators.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return models
    return models.filter((model) => `${model.name} ${model.handle} ${model.slug}`.toLowerCase().includes(normalized))
  }, [models, query])

  const togglePublished = async (model: Creator) => {
    try { const updated = await setCreatorPublished(model.id, !model.published); if (updated) setModels((current) => current.map((item) => item.id === updated.id ? updated : item)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not change the status.') }
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-muted-foreground">Administration</p><h1 className="text-2xl font-semibold tracking-tight">Creators</h1><p className="mt-1 text-sm text-muted-foreground">Persistent profiles, publishing, and data displayed on the site.</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm"><RefreshCw className="h-4 w-4" />Refresh</button><Link to="/app/models/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm"><Plus className="h-4 w-4" />New creator</Link></div></header>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    <section className="rounded-xl border bg-background p-4 shadow-sm"><div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, handle, or slug" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div></section>
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm"><div className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[2fr_1fr_1fr_auto]"><span>Creator</span><span className="hidden md:block">Status</span><span className="hidden md:block">Updated</span><span>Action</span></div>
      {loading && <p className="p-8 text-center text-sm text-muted-foreground">Loading creators…</p>}
      {!loading && filtered.map((model) => <div key={model.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-4 last:border-b-0 md:grid-cols-[2fr_1fr_1fr_auto]"><div className="flex min-w-0 items-center gap-3"><img src={model.avatar_image || '/placeholder-avatar.svg'} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="truncate font-medium">{model.name}</p><p className="truncate text-sm text-muted-foreground">{model.handle}</p></div></div><span className={`hidden w-fit rounded-full px-2 py-1 text-xs font-medium md:inline-flex ${model.published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{model.published ? 'Published' : 'Draft'}</span><span className="hidden text-sm text-muted-foreground md:block">{new Date(model.updated_at).toLocaleDateString('en-US')}</span><div className="flex items-center gap-1"><Link to="/creator/$slug" params={{ slug: model.slug }} className="rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10">View</Link><Link to="/app/models/$id" params={{ id: model.id }} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Edit creator"><Pencil className="h-4 w-4" /></Link><button type="button" onClick={() => void togglePublished(model)} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label={model.published ? 'Unpublish creator' : 'Publish creator'}>{model.published ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button></div></div>)}
      {!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No creators found.</p>}
    </section>
  </div></main>
}
