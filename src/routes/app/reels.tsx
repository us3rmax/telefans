import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Film, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { readAdminPosts, writeAdminPosts, type AdminPost } from '@/data/content'

export const Route = createFileRoute('/app/reels')({ component: AdminReelsPage })

function AdminReelsPage() {
  const [reels, setReels] = useState<AdminPost[]>([])
  useEffect(() => setReels(readAdminPosts().filter((post) => post.type === 'video')), [])

  const toggle = (id: string) => {
    const all = readAdminPosts().map((post) => post.id === id ? { ...post, published: !post.published } : post)
    writeAdminPosts(all)
    setReels(all.filter((post) => post.type === 'video'))
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm text-muted-foreground">Administração</p><h1 className="text-2xl font-semibold tracking-tight">Reels</h1><p className="mt-1 text-sm text-muted-foreground">Vídeos publicados entram na fila de distribuição da aba Reels.</p></header>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reels.map((reel) => <article key={reel.id} className="overflow-hidden rounded-xl border bg-background shadow-sm"><div className="flex aspect-[9/12] items-center justify-center bg-slate-900 text-white"><Film className="h-8 w-8 opacity-70" /></div><div className="space-y-3 p-4"><div><h2 className="font-medium">{reel.title}</h2><p className="text-sm text-muted-foreground">{reel.creatorName}</p></div><div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-xs font-medium ${reel.published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{reel.published ? 'Na fila' : 'Pausado'}</span><div className="flex items-center gap-1"><Link to="/creator/$slug" params={{ slug: reel.creatorSlug }} className="rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10">Perfil</Link><button type="button" onClick={() => toggle(reel.id)} aria-label={reel.published ? 'Pausar reel' : 'Publicar reel'}>{reel.published ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}</button></div></div></div></article>)}{reels.length === 0 && <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3"><CheckCircle2 className="mx-auto mb-2 h-5 w-5" />Nenhum vídeo na fila.</div>}</section>
  </div></main>
}
