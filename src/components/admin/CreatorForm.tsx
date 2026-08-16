import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createAdminCreator, updateAdminCreator, type Creator } from '@/lib/admin-repository'

type Props = { creator?: Creator }

type FormState = { name: string; handle: string; slug: string; avatar_image: string; cover_image: string; bio: string; expanded_bio: string }

const slugify = (value: string) => value.trim().replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase()
const normalizeHandle = (value: string) => value.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()

export function CreatorForm({ creator }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: creator?.name ?? '', handle: creator?.handle ?? '', slug: creator?.slug ?? '', avatar_image: creator?.avatar_image ?? '', cover_image: creator?.cover_image ?? '', bio: creator?.bio ?? '', expanded_bio: creator?.expanded_bio ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const set = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }))
  const suggestedSlug = useMemo(() => slugify(form.handle || form.name), [form.handle, form.name])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { ...form, name: form.name.trim(), handle: normalizeHandle(form.handle), slug: slugify(form.slug || suggestedSlug) }
      if (!payload.name || !payload.handle || !payload.slug || !payload.bio.trim()) throw new Error('Name, handle, slug and short bio are required.')
      if (creator) { await updateAdminCreator(creator.id, payload); setSuccess('Creator updated successfully.') } else { await createAdminCreator({ ...payload, published: false, status: 'draft' }); setSuccess('Creator created as a draft.') }
      window.setTimeout(() => void navigate({ to: '/app/models' }), 500)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the creator.') } finally { setSaving(false) }
  }
  return <form onSubmit={submit} className="space-y-6 rounded-xl border bg-background p-4 shadow-sm md:p-6">
    <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[auto_1fr] sm:items-center"><div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">{form.avatar_image ? <img src={form.avatar_image} alt="Avatar preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl text-muted-foreground">{form.name.slice(0, 1).toUpperCase() || '?'}</div>}</div><div><p className="font-medium">{form.name || 'New creator'}</p><p className="text-sm text-muted-foreground">{form.handle ? `@${normalizeHandle(form.handle)}` : 'Add a handle to preview the profile identity.'}</p><p className="mt-1 text-xs text-muted-foreground">Creators are saved as drafts until published from the Creators list.</p></div></div>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{success && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div>}
    <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">Display name *</span><input required value={form.name} onChange={event => set('name', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Telegram handle *</span><input required value={form.handle} onChange={event => set('handle', event.target.value)} onBlur={() => set('handle', normalizeHandle(form.handle))} placeholder="alexmucci" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Profile slug *</span><input required value={form.slug} onChange={event => set('slug', event.target.value)} onBlur={() => set('slug', slugify(form.slug || suggestedSlug))} placeholder={suggestedSlug || 'creator-slug'} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /><small className="text-muted-foreground">Public URL: /creator/{slugify(form.slug || suggestedSlug) || 'creator-slug'}</small></label><label className="space-y-1 text-sm"><span className="font-medium">Avatar image URL</span><input type="url" value={form.avatar_image} onChange={event => set('avatar_image', event.target.value)} placeholder="https://..." className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">Cover image URL</span><input type="url" value={form.cover_image} onChange={event => set('cover_image', event.target.value)} placeholder="https://..." className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label></div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Short bio *</span><textarea required value={form.bio} onChange={event => set('bio', event.target.value)} className="min-h-24 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="block space-y-1 text-sm"><span className="font-medium">Expanded bio / More info</span><textarea value={form.expanded_bio} onChange={event => set('expanded_bio', event.target.value)} className="min-h-32 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>
    <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void navigate({ to: '/app/models' })} className="h-10 rounded-md border px-4 text-sm">Cancel</button><button disabled={saving} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : creator ? 'Save changes' : 'Create draft creator'}</button></div>
  </form>
}
