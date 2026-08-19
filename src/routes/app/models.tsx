import { createFileRoute, Link } from '@tanstack/react-router'
import { Eye, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CreatorForm } from '@/components/admin/CreatorForm'
import { CreatorVault } from '@/components/admin/CreatorVault'
import { getCreatorQueueMetrics, listAdminCreators, setCreatorPublished, type Creator, type CreatorQueueMetrics } from '@/lib/admin-repository'

const normalizeNewFlag = (value: unknown) => {
  const normalized = String(value ?? '').replace(/^"|"$/g, '')
  return normalized === '1' ? '1' : undefined
}

export const Route = createFileRoute('/app/models')({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
    new: normalizeNewFlag(search.new),
    search: typeof search.search === 'string' ? search.search : undefined,
    status: search.status === 'draft' || search.status === 'published' ? search.status : undefined,
    queue: search.queue === 'no-content' || search.queue === 'no-views' || search.queue === 'scheduled' ? search.queue : undefined,
  }),
  component: AdminModelsPage,
})

function AdminModelsPage() {
  const [models, setModels] = useState<Creator[]>([])
  const [queueMetrics, setQueueMetrics] = useState<Map<string, CreatorQueueMetrics>>(new Map())
  const { edit: editId, new: newMode, search: searchParam, status, queue } = Route.useSearch()
  const [query, setQuery] = useState(searchParam ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [creators, metrics] = await Promise.all([listAdminCreators(), getCreatorQueueMetrics()])
      setModels(creators)
      setQueueMetrics(metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load creators.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { setQuery(searchParam ?? '') }, [searchParam])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const statusFiltered = status ? models.filter(model => status === 'published' ? model.published : !model.published) : models
    const queueFiltered = queue === 'no-content' ? statusFiltered.filter(model => (queueMetrics.get(model.id)?.posts ?? 0) === 0) : queue === 'no-views' ? statusFiltered.filter(model => (queueMetrics.get(model.id)?.views ?? 0) === 0) : queue === 'scheduled' ? statusFiltered.filter(model => (queueMetrics.get(model.id)?.scheduled ?? 0) > 0) : statusFiltered
    if (!normalized) return queueFiltered
    return queueFiltered.filter(model => `${model.name} ${model.handle} ${model.slug}`.toLowerCase().includes(normalized))
  }, [models, queueMetrics, query, status, queue])

  const togglePublished = async (model: Creator) => {
    try {
      const updated = await setCreatorPublished(model.id, !model.published)
      if (updated) setModels(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the status.')
    }
  }

  const editingCreator = editId ? models.find(model => model.id === editId) : undefined

  if (newMode && !loading) {
    return (
      <main className="min-h-full bg-muted/20 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <p className="text-sm text-muted-foreground">Administration / Creators</p>
            <h1 className="text-2xl font-semibold tracking-tight">New creator</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create a draft profile and publish it after validating the details.</p>
          </header>
          <CreatorForm />
        </div>
      </main>
    )
  }

  if (editId && !loading && editingCreator) {
    return (
      <main className="min-h-full bg-muted/20 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Administration / Creators</p>
              <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">Update {editingCreator.name} and manage the complete creator workspace.</p>
            </div>
            <Link to="/app/models" search={{ edit: undefined, new: undefined, search: undefined, status: undefined, queue: undefined }} className="shrink-0 rounded-md border px-3 py-2 text-sm hover:bg-muted">Back to creators</Link>
          </header>
          <CreatorForm creator={editingCreator} />
          <CreatorVault creatorId={editingCreator.id} creatorName={editingCreator.name} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Administration</p>
            <h1 className="text-2xl font-semibold tracking-tight">Creators</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage profiles, publish status and each creator’s complete content workspace.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" />Refresh</button>
            <Link to="/app/models" search={{ edit: undefined, new: '1', search: undefined, status: undefined, queue: undefined }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm"><Plus className="h-4 w-4" />New creator</Link>
          </div>
        </header>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name, handle, or slug" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Showing {filtered.length} of {models.length} creators{queue ? ` · ${queue === 'no-content' ? 'without published content' : queue === 'no-views' ? 'with no views' : 'scheduled queue'}` : ''}</p>
        </section>

        {loading && <section className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">Loading creators…</section>}

        {!loading && filtered.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(model => {
              const cover = model.cover_image || model.avatar_image || '/placeholder-cover.svg'
              const avatar = model.avatar_image || '/placeholder-avatar.svg'
              const handle = model.handle.replace(/^@+/, '')
              return (
                <article key={model.id} className="group overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md">
                  <Link to="/app/models" search={{ edit: model.id, new: undefined, search: undefined, status: undefined, queue: undefined }} className="block">
                    <div className="relative aspect-[16/8] bg-muted">
                      <img src={cover} alt={`${model.name} cover`} className="h-full w-full rounded-t-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                      <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur ${model.published ? 'bg-emerald-100/90 text-emerald-700' : 'bg-background/90 text-muted-foreground'}`}>{model.published ? 'Published' : 'Draft'}</span>
                      <img src={avatar} alt="" className="absolute -bottom-7 left-5 h-14 w-14 rounded-full border-4 border-background bg-muted object-cover" />
                    </div>
                    <div className="space-y-2 px-5 pb-4 pt-10">
                      <h2 className="truncate text-lg font-semibold">{model.name}</h2>
                      <p className="truncate text-sm text-muted-foreground">@{handle}</p>
                      <p className="min-h-10 line-clamp-2 text-sm text-muted-foreground">{model.bio || 'No bio added yet.'}</p>
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 border-t px-5 py-4">
                    <Link to="/creator/$slug" params={{ slug: model.slug }} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"><Eye className="h-3.5 w-3.5" />View profile</Link>
                    <Link to="/app/models" search={{ edit: model.id, new: undefined, search: undefined, status: undefined, queue: undefined }} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Open workspace</Link>
                    <button type="button" onClick={() => void togglePublished(model)} className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${model.published ? 'border-emerald-500/30 text-emerald-700 hover:bg-emerald-50' : 'hover:bg-muted'}`}>{model.published ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}{model.published ? 'Unpublish' : 'Publish'}</button>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {!loading && filtered.length === 0 && <section className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">No creators found for this queue.</section>}
      </div>
    </main>
  )
}
