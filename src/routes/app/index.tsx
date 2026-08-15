import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, Clapperboard, FileText, RefreshCw, Users, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAdminMetrics } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })

type Metrics = Awaited<ReturnType<typeof getAdminMetrics>>

function DashboardHome() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => { setLoading(true); setError(''); try { setMetrics(await getAdminMetrics()) } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar as métricas.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const cards = metrics ? [{ label: 'Utilizadores Telegram', value: metrics.users, icon: UserRound }, { label: 'Creators', value: metrics.creators, icon: Users }, { label: 'Creators publicados', value: metrics.publishedCreators, icon: Activity }, { label: 'Posts publicados', value: metrics.posts, icon: FileText }, { label: 'Reels ativos', value: metrics.reels, icon: Clapperboard }] : []
  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">TeleFans Admin</p><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Visão geral do catálogo e da atividade editorial.</p></div><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm"><RefreshCw className="h-4 w-4" />Atualizar</button></header>{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{loading ? <p className="text-sm text-muted-foreground">A carregar métricas…</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border bg-background p-4 shadow-sm"><Icon className="h-5 w-5 text-muted-foreground" /><p className="mt-4 text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}</div>}<section className="grid gap-4 md:grid-cols-3"><Link to="/app/models" className="rounded-xl border bg-background p-5 shadow-sm transition hover:border-primary"><h2 className="font-medium">Gerir modelos</h2><p className="mt-1 text-sm text-muted-foreground">Criar, editar e publicar perfis.</p></Link><Link to="/app/content" className="rounded-xl border bg-background p-5 shadow-sm transition hover:border-primary"><h2 className="font-medium">Fila editorial</h2><p className="mt-1 text-sm text-muted-foreground">Rever rascunhos e publicações.</p></Link><Link to="/app/media" className="rounded-xl border bg-background p-5 shadow-sm transition hover:border-primary"><h2 className="font-medium">Biblioteca</h2><p className="mt-1 text-sm text-muted-foreground">Enviar e reutilizar mídia.</p></Link></section></div></main>
}
