import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { readAdminCreators, writeAdminCreators, type AdminCreator } from '@/data/admin'

export const Route = createFileRoute('/app/models')({
  component: AdminModelsPage,
})

function AdminModelsPage() {
  const [models, setModels] = useState<AdminCreator[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => setModels(readAdminCreators()), [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return models
    return models.filter((model) => `${model.name} ${model.handle} ${model.slug}`.toLowerCase().includes(normalized))
  }, [models, query])

  const togglePublished = (slug: string) => {
    const next = models.map((model) => model.slug === slug ? { ...model, published: !model.published } : model)
    setModels(next)
    writeAdminCreators(next)
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Administração</p>
          <h1 className="text-2xl font-semibold tracking-tight">Modelos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie perfis, publicação e dados exibidos no site.</p>
        </div>
        <Link to="/app/models/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm"><Plus className="h-4 w-4" />Nova modelo</Link>
      </header>

      <section className="rounded-xl border bg-background p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por nome, handle ou slug" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[2fr_1fr_1fr_auto]">
          <span>Modelo</span><span className="hidden md:block">Estado</span><span className="hidden md:block">Atualização</span><span>Ação</span>
        </div>
        {filtered.map((model) => <div key={model.slug} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-4 last:border-b-0 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <img src={model.avatarImage} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            <div className="min-w-0"><p className="truncate font-medium">{model.name}</p><p className="truncate text-sm text-muted-foreground">{model.handle}</p></div>
          </div>
          <span className={`hidden w-fit rounded-full px-2 py-1 text-xs font-medium md:inline-flex ${model.published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{model.published ? 'Publicado' : 'Rascunho'}</span>
          <span className="hidden text-sm text-muted-foreground md:block">{model.updatedAt}</span>
          <div className="flex items-center gap-1"><Link to="/creator/$slug" params={{ slug: model.slug }} className="rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10">Ver</Link><button type="button" onClick={() => togglePublished(model.slug)} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label={model.published ? 'Despublicar modelo' : 'Publicar modelo'}>{model.published ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button></div>
        </div>)}
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum modelo encontrado.</p>}
      </section>
    </div>
  </main>
}
