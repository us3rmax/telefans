import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createAdminCreator, updateAdminCreator, type Creator } from '@/lib/admin-repository'

type Props = { creator?: Creator }

export function CreatorForm({ creator }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: creator?.name ?? '', handle: creator?.handle ?? '', slug: creator?.slug ?? '', avatar_image: creator?.avatar_image ?? '', cover_image: creator?.cover_image ?? '', bio: creator?.bio ?? '', expanded_bio: creator?.expanded_bio ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try { if (creator) await updateAdminCreator(creator.id, form); else await createAdminCreator({ ...form, published: false, status: 'draft' }); void navigate({ to: '/app/models' }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save the creator.') } finally { setSaving(false) }
  }
  return <form onSubmit={submit} className="space-y-5 rounded-xl border bg-background p-4 shadow-sm md:p-6">
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    <div className="grid gap-4 md:grid-cols-2">{([['name','Name'],['handle','Handle'],['slug','Slug'],['avatar_image','Avatar URL'],['cover_image','Cover URL']] as const).map(([key,label]) => <label key={key} className="space-y-1 text-sm"><span className="font-medium">{label}</span><input required={['name','handle','slug'].includes(key)} value={form[key]} onChange={(event) => set(key, event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>)}</div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Short bio</span><textarea required value={form.bio} onChange={(event) => set('bio', event.target.value)} className="min-h-24 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>
    <label className="block space-y-1 text-sm"><span className="font-medium">Expanded bio / More info</span><textarea value={form.expanded_bio} onChange={(event) => set('expanded_bio', event.target.value)} className="min-h-32 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>
    <div className="flex justify-end gap-2"><button type="button" onClick={() => void navigate({ to: '/app/models' })} className="h-10 rounded-md border px-4 text-sm">Cancel</button><button disabled={saving} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : 'Save creator'}</button></div>
  </form>
}
