import { Check, CheckSquare, Film, ImageIcon, ImageUp, Images, KeyRound, Loader2, Search, SlidersHorizontal, Trash2, Upload, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createCarouselFromMediaAssets, deleteMediaAsset, listMediaAssets, setCreatorImageFromMediaAsset, setMediaAssetsPrice, uploadCreatorMediaBatch, type Creator, type CreatorImageField, type MediaAsset } from '@/lib/admin-repository'

type Props = { creatorId: string; creatorName: string; onCreatorUpdated?: (creator: Creator) => void }
type Filter = 'all' | 'image' | 'video'
const MAX_IMPORT_FILES = 100
const isSupportedMedia = (file: File) => file.type.startsWith('image/') || file.type.startsWith('video/')

export function CreatorVault({ creatorId, creatorName, onCreatorUpdated }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [paidAssetIds, setPaidAssetIds] = useState<Set<string>>(new Set())
  const [priceOpen, setPriceOpen] = useState(false)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [priceValue, setPriceValue] = useState('10')
  const [actionLoading, setActionLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setAssets(await listMediaAssets(creatorId)) } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the creator Vault.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [creatorId])

  const addPendingFiles = (files: File[]) => {
    const supported = files.filter(isSupportedMedia)
    if (files.length !== supported.length) setError('Only image and video files can be added to the Vault.')
    setPendingFiles(current => [...current, ...supported].slice(0, MAX_IMPORT_FILES))
    setImportOpen(true)
    setDragActive(false)
  }

  const importFiles = async () => {
    if (!pendingFiles.length) return
    setUploading(true); setError(''); setMessage('')
    try {
      const results = await uploadCreatorMediaBatch(pendingFiles, creatorId)
      setAssets(current => [...results.map(result => result.asset), ...current])
      const images = results.filter(result => result.asset.kind === 'image').length
      const videos = results.filter(result => result.asset.kind === 'video').length
      setMessage(`${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'} imported: ${images} image${images === 1 ? '' : 's'} to Feed and ${videos} video${videos === 1 ? '' : 's'} to Reels.`)
      setPendingFiles([]); setImportOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not import the selected media.') } finally { setUploading(false) }
  }

  const visibleAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return assets.filter(asset => (filter === 'all' || asset.kind === filter) && (!normalized || (asset.original_name ?? '').toLowerCase().includes(normalized)))
  }, [assets, filter, query])
  const imageCount = assets.filter(asset => asset.kind === 'image').length
  const videoCount = assets.filter(asset => asset.kind === 'video').length
  const allVisibleSelected = visibleAssets.length > 0 && visibleAssets.every(asset => selected.has(asset.id))
  const selectedImageOnly = selected.size === 1 && assets.some(asset => selected.has(asset.id) && asset.kind === 'image')

  const toggleSelected = (id: string) => setSelected(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleAll = () => setSelected(current => { const next = new Set(current); if (allVisibleSelected) visibleAssets.forEach(asset => next.delete(asset.id)); else visibleAssets.forEach(asset => next.add(asset.id)); return next })
  const removeSelected = async () => {
    const targets = assets.filter(asset => selected.has(asset.id))
    if (!targets.length) return
    setActionLoading(true); setError('')
    try { await Promise.all(targets.map(asset => deleteMediaAsset(asset.id, asset.storage_path))); setAssets(current => current.filter(asset => !selected.has(asset.id))); setSelected(new Set()); setMessage(`${targets.length} media file${targets.length === 1 ? '' : 's'} deleted.`) } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the selected media.') } finally { setActionLoading(false) }
  }
  const applyPrice = async () => {
    const price = Math.max(0, Number.parseInt(priceValue, 10) || 0)
    const targets = assets.filter(asset => selected.has(asset.id) && asset.kind === 'image')
    if (!targets.length) { setError('Select at least one image to set a price. Videos remain in Reels and cannot be Paid Media.'); return }
    setActionLoading(true); setError('')
    try { await setMediaAssetsPrice(targets.map(asset => asset.id), price); setPaidAssetIds(current => { const next = new Set(current); targets.forEach(asset => price > 0 ? next.add(asset.id) : next.delete(asset.id)); return next }); setPriceOpen(false); setMessage(price > 0 ? `${targets.length} image${targets.length === 1 ? '' : 's'} moved to Paid Media at ${price} Coins.` : `${targets.length} image${targets.length === 1 ? '' : 's'} returned to Feed.`); setSelected(new Set()) } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the selected media price.') } finally { setActionLoading(false) }
  }

  const setCreatorImage = async (field: CreatorImageField) => {
    const targets = assets.filter(asset => selected.has(asset.id))
    if (targets.length !== 1 || targets[0]?.kind !== 'image') { setError('Select exactly one image to use as the profile or cover photo.'); return }
    setActionLoading(true); setError(''); setMessage('')
    try {
      const updated = await setCreatorImageFromMediaAsset(creatorId, targets[0].id, field)
      onCreatorUpdated?.(updated)
      setSelected(new Set())
      setMessage(`${field === 'avatar_image' ? 'Profile photo' : 'Cover photo'} updated from the selected Vault image.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the creator image.') } finally { setActionLoading(false) }
  }

  const createCarousel = async () => {
    const targets = assets.filter(asset => selected.has(asset.id))
    if (targets.length < 2) { setError('Select at least two images to create a carousel.'); return }
    if (targets.some(asset => asset.kind !== 'image')) { setError('Carousels can contain images only. Videos remain in Reels.'); return }
    setActionLoading(true); setError(''); setMessage('')
    try {
      const grouped = await createCarouselFromMediaAssets(targets.map(asset => asset.id), creatorId)
      setSelected(new Set()); setCarouselOpen(false); setMessage(`${grouped.length} images grouped into one carousel. They will appear as slides in the creator profile.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create the carousel.') } finally { setActionLoading(false) }
  }

  return <section className="overflow-hidden rounded-xl border bg-background shadow-sm"><header className="border-b px-4 py-4 md:px-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-base font-semibold">Creator Vault</p><p className="mt-1 text-sm text-muted-foreground">{creatorName} · {imageCount} images · {videoCount} videos</p></div><button type="button" onClick={() => setImportOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Upload className="h-4 w-4" />Upload media</button></div><div className="mt-4 flex flex-col gap-2 md:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search media..." className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></label><select value={filter} onChange={event => setFilter(event.target.value as Filter)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All media</option><option value="image">Feed images</option><option value="video">Reels videos</option></select><button type="button" onClick={toggleAll} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm"><CheckSquare className="h-4 w-4" />{allVisibleSelected ? 'Clear selection' : 'Select all'}</button><SlidersHorizontal className="hidden h-5 w-5 self-center text-muted-foreground md:block" /></div></header>{selected.size > 0 && <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-3 md:px-6"><span className="text-sm font-medium">{selected.size} selected</span><button type="button" disabled={actionLoading} onClick={() => setPriceOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"><KeyRound className="h-4 w-4" />Set price</button><button type="button" disabled={actionLoading || !selectedImageOnly} onClick={() => void setCreatorImage('avatar_image')} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50" title="Select exactly one image"><UserRound className="h-4 w-4" />Set as Profile photo</button><button type="button" disabled={actionLoading || !selectedImageOnly} onClick={() => void setCreatorImage('cover_image')} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50" title="Select exactly one image"><ImageUp className="h-4 w-4" />Set as Cover photo</button><button type="button" disabled={actionLoading || selected.size < 2} onClick={() => setCarouselOpen(true)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Images className="h-4 w-4" />Create carousel</button><button type="button" disabled={actionLoading} onClick={() => void removeSelected()} className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" />Delete</button><button type="button" onClick={() => setSelected(new Set())} className="ml-auto rounded-md px-2 py-1 text-sm text-muted-foreground">Cancel</button></div>}{error && <div className="mx-4 mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive md:mx-6">{error}</div>}{message && <div className="mx-4 mt-4 rounded-md border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-6">{message}</div>}{loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading Vault…</div> : <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 md:p-5">{visibleAssets.map(asset => { const isSelected = selected.has(asset.id); return <button type="button" key={asset.id} onClick={() => toggleSelected(asset.id)} className={`group relative overflow-hidden rounded-lg border bg-muted text-left transition ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/60'}`} title={asset.original_name ?? undefined}><div className="aspect-square">{asset.kind === 'video' ? <video src={asset.public_url ?? undefined} muted playsInline className="h-full w-full object-cover" /> : asset.public_url ? <img src={asset.public_url} alt={asset.original_name ?? ''} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}</div><span className={`absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md ${isSelected ? 'bg-sky-500 text-white' : 'bg-black/40 text-transparent group-hover:text-white'}`}><Check className="h-4 w-4" /></span><span className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-black/60 px-2 py-1 text-[10px] text-white">{asset.kind === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{asset.kind === 'video' ? 'Reel' : paidAssetIds.has(asset.id) ? 'Paid' : 'Feed'}</span></button> })}{visibleAssets.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No media matches this filter.</p>}</div>}
    {carouselOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Create carousel"><div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Create carousel</h2><button type="button" onClick={() => setCarouselOpen(false)} aria-label="Close" disabled={actionLoading}><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-muted-foreground">The {selected.size} selected images will be grouped into one post. Each image becomes an ordered slide.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setCarouselOpen(false)} disabled={actionLoading} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="button" onClick={() => void createCarousel()} disabled={actionLoading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{actionLoading ? 'Creating…' : 'Create carousel'}</button></div></div></div>}{priceOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Set media price"><div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Set price</h2><button type="button" onClick={() => setPriceOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-muted-foreground">Set a price for the selected images. Use 0 Coins to return them to Feed.</p><label className="mt-4 block text-sm font-medium">Price in Coins<input type="number" min="0" value={priceValue} onChange={event => setPriceValue(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPriceOpen(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={actionLoading} onClick={() => void applyPrice()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{actionLoading ? 'Saving…' : 'Save price'}</button></div></div></div>}{importOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Import media"><div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-background shadow-2xl"><div className="flex items-start justify-between border-b px-5 py-4"><div><h2 className="text-lg font-semibold">Import media</h2><p className="mt-1 text-sm text-muted-foreground">Select up to 100 files. Images go to Feed and videos go to Reels automatically.</p></div><button type="button" onClick={() => { setImportOpen(false); setPendingFiles([]) }} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="p-5"><div onDragEnter={event => { event.preventDefault(); if (!uploading) setDragActive(true) }} onDragOver={event => { event.preventDefault(); if (!uploading) setDragActive(true) }} onDragLeave={event => { event.preventDefault(); setDragActive(false) }} onDrop={event => { event.preventDefault(); addPendingFiles(Array.from(event.dataTransfer.files)) }} className={`rounded-xl border-2 border-dashed px-5 py-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 bg-muted/20'} ${uploading ? 'pointer-events-none opacity-70' : ''}`}><Upload className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-sm font-medium">{dragActive ? 'Drop your files here' : 'Click or drag your files'}</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP, MP4, MOV and other image/video formats · up to 100 files</p><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><Upload className="h-4 w-4" />Choose files<input type="file" multiple accept="image/*,video/*" className="sr-only" disabled={uploading} onChange={event => { addPendingFiles(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></label></div>{pendingFiles.length > 0 && <div className="mt-4 max-h-40 overflow-y-auto rounded-md border p-3"><p className="mb-2 text-sm font-medium">{pendingFiles.length} file{pendingFiles.length === 1 ? '' : 's'} ready to import</p><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">{pendingFiles.map((file, index) => <div key={`${file.name}-${index}`} className="truncate rounded bg-muted px-2 py-1">{file.name}</div>)}</div></div>}</div><div className="flex justify-end gap-2 border-t px-5 py-4"><button type="button" onClick={() => { setImportOpen(false); setPendingFiles([]) }} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={!pendingFiles.length || uploading} onClick={() => void importFiles()} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{uploading && <Loader2 className="h-4 w-4 animate-spin" />}{uploading ? 'Importing…' : `Import ${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'}`}</button></div></div></div>}</section>
}
