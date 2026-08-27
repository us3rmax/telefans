import { useEffect, useMemo, useRef, useState } from 'react'

type ImageField = 'avatar_image' | 'cover_image'

type Props = {
  file: File
  field: ImageField
  onCancel: () => void
  onConfirm: (file: File) => void | Promise<void>
}

const AVATAR_OUTPUT_WIDTH = 800
const COVER_OUTPUT_WIDTH = 1200
const COVER_ASPECT_RATIO = 620 / 300
const MIN_ZOOM = 1
const MAX_ZOOM = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getOutputSize(field: ImageField) {
  const width = field === 'avatar_image' ? AVATAR_OUTPUT_WIDTH : COVER_OUTPUT_WIDTH
  const height = field === 'avatar_image' ? width : Math.round(width / COVER_ASPECT_RATIO)
  return { width, height }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read this image.'))
    image.src = url
  })
}

function getOutputFileName(name: string, field: ImageField, mimeType: string) {
  const baseName = name.replace(/\.[^.]+$/, '') || 'creator-image'
  const suffix = field === 'avatar_image' ? 'profile' : 'cover'
  const extension = mimeType === 'image/png' ? 'png' : 'jpg'
  return `${baseName}-${suffix}.${extension}`
}

async function cropImage(file: File, field: ImageField, zoom: number, position: { x: number; y: number }, objectUrl: string) {
  const image = await loadImage(objectUrl)
  const { width: outputWidth, height: outputHeight } = getOutputSize(field)
  const baseScale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight)
  const displayedWidth = image.naturalWidth * baseScale * zoom
  const displayedHeight = image.naturalHeight * baseScale * zoom
  const viewportWidth = outputWidth
  const viewportHeight = outputHeight
  const cropWidth = viewportWidth / (baseScale * zoom)
  const cropHeight = viewportHeight / (baseScale * zoom)
  const positionX = (position.x + 50) / 100
  const positionY = (position.y + 50) / 100
  const sourceX = clamp((displayedWidth - viewportWidth) * positionX / (baseScale * zoom), 0, image.naturalWidth - cropWidth)
  const sourceY = clamp((displayedHeight - viewportHeight) * positionY / (baseScale * zoom), 0, image.naturalHeight - cropHeight)
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare the image editor.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)
  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, mimeType === 'image/jpeg' ? 0.92 : undefined))
  if (!blob) throw new Error('Could not generate the cropped image.')
  return new File([blob], getOutputFileName(file.name, field, mimeType), { type: mimeType, lastModified: Date.now() })
}

export function ImageCropDialog({ file, field, onCancel, onConfirm }: Props) {
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file])
  const dragging = useRef(false)

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl])

  const handleConfirm = async () => {
    setProcessing(true)
    setError('')
    try {
      const croppedFile = await cropImage(file, field, zoom, position, objectUrl)
      await onConfirm(croppedFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop this image.')
    } finally {
      setProcessing(false)
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (processing) return
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || processing) return
    const width = event.currentTarget.clientWidth || 1
    const height = event.currentTarget.clientHeight || 1
    setPosition(current => ({
      x: clamp(current.x - event.movementX / width * 100, -50, 50),
      y: clamp(current.y - event.movementY / height * 100, -50, 50),
    }))
  }

  const stopDragging = () => { dragging.current = false }
  const isAvatar = field === 'avatar_image'
  const title = isAvatar ? 'Adjust profile photo' : 'Adjust cover photo'
  const hint = isAvatar ? 'Drag to center the face, then adjust the zoom.' : 'Drag to choose the visible area of the cover, then adjust the zoom.'
  const frameStyle = isAvatar ? { width: 'min(100%, 62vh, 620px)', aspectRatio: '1' } : { width: 'min(100%, 620px, calc(55vh * 2.0667))', aspectRatio: '620 / 300' }

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div><h2 id="image-crop-title" className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{hint}</p></div>
        <button type="button" onClick={onCancel} disabled={processing} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close image editor">×</button>
      </header>
      <div className="space-y-5 p-5">
        <div
          className="relative mx-auto max-w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-black active:cursor-grabbing"
          style={frameStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          <img src={objectUrl} alt="Image crop preview" className="h-full w-full select-none object-cover" draggable={false} style={{ objectPosition: `${50 + position.x}% ${50 + position.y}%`, transform: `scale(${zoom})` }} />
          <div className={`pointer-events-none absolute inset-0 border-2 border-white/80 ${isAvatar ? 'rounded-full border-dashed' : 'border-dashed'}`} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="h-px w-full bg-white/25" /><span className="absolute h-full w-px bg-white/25" /></div>
          {processing && <div className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-medium text-white">Preparing image…</div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="block text-sm font-medium">Zoom <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} disabled={processing} className="mt-2 block w-full accent-primary" /></label>
          <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="min-w-12 text-right text-sm text-muted-foreground">{zoom.toFixed(2)}×</span><button type="button" onClick={() => { setZoom(MIN_ZOOM); setPosition({ x: 0, y: 0 }) }} disabled={processing} className="rounded-md border px-3 py-2 text-sm">Reset</button></div>
        </div>
        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
      </div>
      <footer className="flex justify-end gap-2 border-t px-5 py-4"><button type="button" onClick={onCancel} disabled={processing} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="button" onClick={() => void handleConfirm()} disabled={processing} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{processing ? 'Saving…' : `Use ${isAvatar ? 'profile photo' : 'cover photo'}`}</button></footer>
    </section>
  </div>
}
