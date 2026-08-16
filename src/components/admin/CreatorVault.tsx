import { Film, ImageIcon, Loader2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listMediaAssets, uploadCreatorMediaBatch, type MediaAsset } from '@/lib/admin-repository'

type Props = { creatorId: string; creatorName: string }

export function CreatorVault({ creatorId, creatorName }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setAssets(await listMediaAssets(creatorId)) } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the creator Vault.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [creatorId])

  const upload = async (files: File[]) => {
    if (!files.length) return
    setUploading(true); setError(''); setMessage('')
    try {
      const results = await uploadCreatorMediaBatch(files, creatorId)
      setAssets(current => [...results.map(result => result.asset), ...current])
      const images = results.filter(result => result.asset.kind === 'image').length
      const videos = results.filter(result => result.asset.kind === 'video').length
      setMessage(`${files.length} file${files.length === 1 ? '' : 's'} added to ${creatorName}'s Vault: ${images} image${images === 1 ? '' : 's'} to Feed and ${videos} video${videos === 1 ? '' : 's'} to Reels.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload the selected media.') } finally { setUploading(false) }
  }

  const imageCount = assets.filter(asset => asset.kind === 'image').length
  const videoCount = assets.filter(asset => asset.kind === 'video').length
  return <section className="space-y-4 rounded-xl border bg-background p-4 shadow-sm md:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium">Creator Vault</p><p className="mt-1 text-sm text-muted-foreground">Upload the full content library for {creatorName}. Images become profile Feed posts and videos become Reels automatically.</p><p className="mt-2 text-xs text-muted-foreground">{imageCount} images · {videoCount} videos · Paid Media is managed later from Content by setting a price.</p></div><label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload media'}<input type="file" multiple accept="image/*,video/*" className="sr-only" disabled={uploading} onChange={event => { void upload(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></label></div>{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{message && <div className="rounded-md border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{loading ? <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading Vault…</div> : <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">{assets.slice(0, 24).map(asset => <div key={asset.id} className="overflow-hidden rounded-md border bg-muted" title={asset.original_name ?? undefined}><div className="aspect-square">{asset.kind === 'video' ? <video src={asset.public_url ?? undefined} muted className="h-full w-full object-cover" /> : asset.public_url ? <img src={asset.public_url} alt={asset.original_name ?? ''} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}</div><div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-muted-foreground">{asset.kind === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{asset.kind === 'video' ? 'Reel' : 'Feed'}</div></div>)}{assets.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">The Vault is empty. Upload images and videos to create content automatically.</p>}</div>}{assets.length > 24 && <p className="text-xs text-muted-foreground">Showing the 24 most recent Vault assets. Use Content for full editing, pricing, and deletion.</p>}</section>
}
