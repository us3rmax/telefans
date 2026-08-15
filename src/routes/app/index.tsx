import { createFileRoute } from '@tanstack/react-router'
import { Activity, Clock3, ImagePlus, Loader2, RefreshCw, Upload, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { listAdminClients, listAdminCreators, type AdminClient, uploadCreatorMediaBatch, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })

function ClientRow({ client }: { client: AdminClient }) {
  const name = [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Cliente Telegram'
  const avatar = client.profile_photo_url || client.photo_url
  return <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
      {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{client.username ? `@${client.username}` : `Telegram ID ${client.telegram_id}`}</p>
    </div>
    <div className="shrink-0 text-right text-xs text-muted-foreground">
      <strong className="block text-foreground">{client.following_count}</strong>
      Following
    </div>
  </div>
}

function ClientSection({ title, icon: Icon, clients, empty }: { title: string; icon: typeof Users; clients: AdminClient[]; empty: string }) {
  return <section className="space-y-3 rounded-2xl border bg-background p-4 shadow-sm">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h2 className="font-semibold">{title}</h2><span className="ml-auto text-xs text-muted-foreground">{clients.length}</span></div>
    {clients.length ? <div className="space-y-2">{clients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div> : <p className="py-5 text-center text-sm text-muted-foreground">{empty}</p>}
  </section>
}

function DashboardHome() {
  const [models, setModels] = useState<Creator[]>([])
  const [clients, setClients] = useState<{ total: number; recent: AdminClient[]; active: AdminClient[]; all: AdminClient[] }>({ total: 0, recent: [], active: [], all: [] })
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadDashboard = async () => {
    setLoading(true); setError('')
    try {
      const [creatorRows, clientMetrics] = await Promise.all([listAdminCreators(), listAdminClients(100)])
      setModels(creatorRows); const all = [...clientMetrics].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setClients({ total: all.length, recent: all.slice(0, 8), active: [...all].sort((a, b) => b.following_count - a.following_count || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 8), all })
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadDashboard() }, [])

  const handleFiles = async (creator: Creator, files: File[]) => {
    if (!files.length) return
    setUploadingId(creator.id); setMessage(''); setError('')
    try {
      const result = await uploadCreatorMediaBatch(files, creator.id)
      const images = result.filter(({ asset }) => asset.kind === 'image').length
      const videos = result.filter(({ asset }) => asset.kind === 'video').length
      setMessage(`${creator.name}: ${images} imagem(ns) adicionada(s) ao perfil e ${videos} vídeo(s) enviado(s) para Reels.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível enviar as mídias.') }
    finally { setUploadingId(null) }
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-8">
    <header className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">TeleFans Admin</p><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Modelos, clientes e uploads num só lugar.</p></div><button type="button" onClick={() => void loadDashboard()} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" />Atualizar</button></header>
    {message && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    {loading ? <p className="text-sm text-muted-foreground">A carregar dashboard…</p> : <>
      <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-background p-4 shadow-sm"><Users className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-semibold">{clients.total}</p><p className="text-sm text-muted-foreground">Clientes Telegram</p></div><div className="rounded-2xl border bg-background p-4 shadow-sm"><Clock3 className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-semibold">{clients.recent.length}</p><p className="text-sm text-muted-foreground">Mais recentes na lista</p></div><div className="rounded-2xl border bg-background p-4 shadow-sm"><Activity className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-semibold">{clients.active.filter(client => client.following_count > 0).length}</p><p className="text-sm text-muted-foreground">Clientes com Following</p></div></section>
      <section className="space-y-3"><div><h2 className="text-xl font-semibold">Clientes</h2><p className="text-sm text-muted-foreground">Lista persistente de utilizadores Telegram, ordenada por atividade e entrada.</p></div><div className="grid gap-4 lg:grid-cols-3"><ClientSection title="Mais recentes" icon={Clock3} clients={clients.recent} empty="Ainda não existem clientes registados." /><ClientSection title="Mais ativos" icon={Activity} clients={clients.active} empty="Ainda não há atividade de Following." /><ClientSection title="Todos os clientes" icon={Users} clients={clients.all} empty="Nenhum cliente encontrado." /></div></section>
      <section className="space-y-3"><div><h2 className="text-xl font-semibold">Modelos</h2><p className="text-sm text-muted-foreground">Clique numa modelo para adicionar várias imagens e vídeos.</p></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{models.map((model) => { const busy = uploadingId === model.id; return <button key={model.id} type="button" disabled={busy} onClick={() => inputs.current[model.id]?.click()} className="group overflow-hidden rounded-2xl border bg-background text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-wait"><div className="relative aspect-[4/5] bg-muted"><img src={model.avatar_image || model.cover_image} alt={model.name} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-white"><span className="truncate font-medium">{model.name}</span>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</div></div><div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Upload className="h-4 w-4" />Adicionar mídias<input ref={element => { inputs.current[model.id] = element }} type="file" accept="image/*,video/*" multiple className="sr-only" onClick={event => event.stopPropagation()} onChange={event => { void handleFiles(model, Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></div></button> })}{models.length === 0 && <div className="col-span-full rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">Nenhuma modelo cadastrada.</div>}</div></section>
    </>}
  </div></main>
}
