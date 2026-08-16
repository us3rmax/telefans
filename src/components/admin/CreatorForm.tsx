import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createAdminCreator, updateAdminCreator, uploadMediaAsset, type Creator } from '@/lib/admin-repository'

type Props = { creator?: Creator }
type ImageField = 'avatar_image' | 'cover_image'
type FormState = { name: string; handle: string; slug: string; avatar_image: string; cover_image: string; bio: string }

const slugify = (value: string) => value.trim().replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase()
const normalizeHandle = (value: string) => value.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()

export function CreatorForm({ creator }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: creator?.name ?? '', handle: creator?.handle ?? '', slug: creator?.slug ?? '', avatar_image: creator?.avatar_image ?? '', cover_image: creator?.cover_image ?? '', bio: creator?.bio ?? '' })
  const [selectedImages, setSelectedImages] = useState<Partial<Record<ImageField, File>>>({})
  const [previews, setPreviews] = useState<Partial<Record<ImageField, string>>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const set = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }))
  const suggestedSlug = useMemo(() => slugify(form.handle || form.name), [form.handle, form.name])

  useEffect(() => () => Object.values(previews).forEach(url => url && URL.revokeObjectURL(url)), [previews])

  const chooseImage = async (field: ImageField, file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    const preview = URL.createObjectURL(file)
    setPreviews(current => ({ ...current, [field]: preview }))
    setSelectedImages(current => ({ ...current, [field]: file }))
    setError('')
    if (!creator) return
    setUploadingField(field); setSuccess('')
    try {
      const asset = await uploadMediaAsset(file, creator.id)
      const url = asset.public_url ?? ''
      if (!url) throw new Error('The uploaded image did not return a public URL.')
      await updateAdminCreator(creator.id, { [field]: url })
      set(field, url)
      setSelectedImages(current => ({ ...current, [field]: undefined }))
      setSuccess(`${field === 'avatar_image' ? 'Profile photo' : 'Cover photo'} uploaded successfully.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the image.')
    } finally { setUploadingField(null) }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { ...form, name: form.name.trim(), handle: normalizeHandle(form.handle), slug: slugify(form.slug || suggestedSlug), expanded_bio: null }
      if (!payload.name || !payload.handle || !payload.slug || !payload.bio.trim()) throw new Error('Name, handle, slug and bio are required.')
      if (creator) {
        await updateAdminCreator(creator.id, payload)
        setSuccess('Creator updated successfully.')
      } else {
        const created = await createAdminCreator({ ...payload, published: false, status: 'draft' })
        const uploaded: Partial<Record<ImageField, string>> = {}
        for (const field of ['avatar_image', 'cover_image'] as ImageField[]) {
          const file = selectedImages[field]
          if (!file) continue
          const asset = await uploadMediaAsset(file, created.id)
          if (asset.public_url) uploaded[field] = asset.public_url
        }
        if (Object.keys(uploaded).length) await updateAdminCreator(created.id, uploaded)
        setSuccess('Creator created as a draft. Media was added to the creator Vault.')
      }
      window.setTimeout(() => void navigate({ to: '/app/models', search: { edit: undefined, new: undefined } }), 500)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the creator.') } finally { setSaving(false) }
  }

  const avatarPreview = previews.avatar_image || form.avatar_image
  const coverPreview = previews.cover_image || form.cover_image
  return <form onSubmit={submit} className="space-y-6 rounded-xl border bg-background p-4 shadow-sm md:p-6">
    <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[auto_1fr] sm:items-center"><div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">{avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl text-muted-foreground">{form.name.slice(0, 1).toUpperCase() || '?'}</div>}</div><div><p className="font-medium">{form.name || 'New creator'}</p><p className="text-sm text-muted-foreground">{form.handle ? `@${normalizeHandle(form.handle)}` : 'Add a handle to preview the profile identity.'}</p><p className="mt-1 text-xs text-muted-foreground">Creators are saved as drafts until published from the Creators list.</p></div></div>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{success && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div>}
    <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">Display name *</span><input required value={form.name} onChange={event => set('name', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Telegram handle *</span><input required value={form.handle} onChange={event => set('handle', event.target.value)} onBlur={() => set('handle', normalizeHandle(form.handle))} placeholder="alexmucci" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Profile slug *</span><input required value={form.slug} onChange={event => set('slug', event.target.value)} onBlur={() => set('slug', slugify(form.slug || suggestedSlug))} placeholder={suggestedSlug || 'creator-slug'} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /><small className="text-muted-foreground">Public URL: /creator/{slugify(form.slug || suggestedSlug) || 'creator-slug'}</small></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Profile photo</span><div className="flex gap-2"><input type="text" readOnly value={form.avatar_image} placeholder="Upload an image" className="h-10 min-w-0 flex-1 rounded-md border bg-muted/30 px-3 text-sm" /><label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{uploadingField === 'avatar_image' ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" className="sr-only" disabled={uploadingField !== null || saving} onChange={event => { void chooseImage('avatar_image', event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div></label>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">Cover photo</span><div className="flex gap-2"><input type="text" readOnly value={form.cover_image} placeholder="Upload an image" className="h-10 min-w-0 flex-1 rounded-md border bg-muted/30 px-3 text-sm" /><label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{uploadingField === 'cover_image' ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" className="sr-only" disabled={uploadingField !== null || saving} onChange={event => { void chooseImage('cover_image', event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div>{coverPreview && <img src={coverPreview} alt="Cover preview" className="mt-2 h-24 w-full rounded-md object-cover" />}</label>
    </div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Bio *</span><textarea required value={form.bio} onChange={event => set('bio', event.target.value)} placeholder="Write the complete creator bio. Long bios automatically show a More info button on the public profile." className="min-h-32 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>
    <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void navigate({ to: '/app/models', search: { edit: undefined, new: undefined } })} className="h-10 rounded-md border px-4 text-sm">Cancel</button><button disabled={saving || uploadingField !== null} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : creator ? 'Save changes' : 'Create draft creator'}</button></div>
  </form>
}
