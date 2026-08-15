import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Image, Play, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { readAdminPosts, writeAdminPosts, type AdminPost } from '@/data/content'

export const Route = createFileRoute('/app/content')({ component: AdminContentPage })

function AdminContentPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  useEffect(() => setPosts(readAdminPosts()), [])

  const toggle = (id: string) => {
    const next = posts.map((post) => post.id === id ? { ...post, published: !post.published } : post)
    setPosts(next)
    writeAdminPosts(next)
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm text-muted-foreground">Administração</p><h1 className="text-2xl font-semibold tracking-tight">Conteúdo</h1><p className="mt-1 text-sm text-muted-foreground">Posts ficam associados ao perfil da modelo e vídeos podem alimentar a fila de Reels.</p></header>
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm"><div className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[2fr_1fr_1fr_auto]"><span>Post</span><span className="hidden md:block">Formato</span><span className="hidden md:block">Estado</span><span>Ação</span></div>
      {posts.map((post) => <div key={post.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-4 last:border-b-0 md:grid-cols-[2fr_1fr_1fr_auto]"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">{post.type === 'video' ? <Play className="h-5 w-5" /> : <Image className="h-5 w-5" />}</div><div className="min-w-0"><p className="truncate font-medium">{post.title}</p><p className="truncate text-sm text-muted-foreground">{post.creatorName} · {post.id}</p></div></div><span className="hidden text-sm capitalize text-muted-foreground md:block">{post.type}</span><span className={`hidden w-fit rounded-full px-2 py-1 text-xs font-medium md:inline-flex ${post.published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{post.published ? 'Publicado' : 'Rascunho'}</span><div className="flex items-center gap-1"><Link to="/creator/$slug" params={{ slug: post.creatorSlug }} className="rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10">Perfil</Link><button type="button" onClick={() => toggle(post.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label={post.published ? 'Despublicar post' : 'Publicar post'}>{post.published ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button></div></div>)}
      {posts.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-5 w-5" />Ainda não há conteúdo.</div>}
    </section>
  </div></main>
}
