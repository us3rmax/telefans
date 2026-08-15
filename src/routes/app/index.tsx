import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { listAdminCreators, uploadCreatorMediaBatch, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })

function DashboardHome() {
  const [models, setModels] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { void listAdminCreators().then(setModels).catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível carregar os modelos.')).finally(() => setLoading(false)) }, [])

  const handleFiles = async (creator: Creator, files: File[]) => {
    if (!files.length) return
    setUploadingId(creator.id); setMessage(''); setError('')
    try {
      const result = await uploadCreatorMediaBatch(files, creator.id)
      const images = result.filter(({ asset }) => asset.kind === 'image').length
      const videos = result.filter(({ asset }) => asset.kind === 'video').length
      setMessage(`${creator.name}: ${images} imagem(ns) adicionada(s) ao perfil e ${videos} vídeo(s) enviado(s) para Reels.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível enviar as mídias.') } finally { setUploadingId(null) }
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm text-muted-foreground">TeleFans Admin</p><h1 className="text-2xl font-semibold tracking-tight">Modelos</h1><p className="mt-1 text-sm text-muted-foreground">Clique numa modelo para adicionar várias imagens e vídeos.</p></header>{message && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{loading ? <p className="text-sm text-muted-foreground">A carregar modelos…</p> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{models.map((model) => { const busy = uploadingId === model.id; return <button key={model.id} type="button" disabled={busy} onClick={() => inputs.current[model.id]?.click()} className="group overflow-hidden rounded-2xl border bg-background text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-wait"><div className="relative aspect-[4/5] bg-muted"><img src={model.avatar_image || model.cover_image} alt={model.name} className="h-full w-full object-cover" /> <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-white"><span className="truncate font-medium">{model.name}</span>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</div></div><div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Upload className="h-4 w-4" />Adicionar mídias<input ref={(element) => { inputs.current[model.id] = element }} type="file" accept="image/*,video/*" multiple className="sr-only" onClick={(event) => event.stopPropagation()} onChange={(event) => { void handleFiles(model, Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></div></button> })}{models.length === 0 && <div className="col-span-full rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">Nenhuma modelo cadastrada.</div>}</div>}</div></main>
}
