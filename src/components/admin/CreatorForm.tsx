import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createAdminCreator, getAdminSubscriptionSettings, updateAdminCreator, uploadMediaAsset, upsertAdminSubscriptionSettings, type Creator, type SubscriptionPlanMode } from '@/lib/admin-repository'
import { formatUsdFromStars, formatUsdInputFromStars, usdToStars } from '@/lib/telegram-stars'

type Props = { creator?: Creator }
type ImageField = 'avatar_image' | 'cover_image'
type FormState = { name: string; handle: string; slug: string; avatar_image: string; cover_image: string; bio: string }
type SubscriptionFormState = {
  plan_mode: SubscriptionPlanMode
  title: string
  message: string
  normal_price_usd: string
  promo_price_usd: string
  promo_days: number
  promo_expires_at: string
  telegram_username: string
  vip_channel_url: string
  is_active: boolean
}
type NormalizedSubscription = SubscriptionFormState & { normal_price_stars: number; promo_price_stars: number }

const slugify = (value: string) => value.trim().replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase()
const normalizeHandle = (value: string) => value.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
const defaultSubscription: SubscriptionFormState = { plan_mode: 'free', title: 'Subscription', message: '', normal_price_usd: '0.00', promo_price_usd: '0.00', promo_days: 30, promo_expires_at: '', telegram_username: '', vip_channel_url: '', is_active: true }

function toNumber(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback
}

function toDateTimeLocal(value: unknown) {
  if (typeof value !== 'string' || !value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function readSubscription(value: unknown): SubscriptionFormState {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const planMode = raw.plan_mode === 'paid' || raw.plan_mode === 'promo' ? raw.plan_mode : 'free'
  return {
    plan_mode: planMode,
    title: typeof raw.title === 'string' && raw.title ? raw.title : defaultSubscription.title,
    message: typeof raw.message === 'string' ? raw.message : defaultSubscription.message,
    normal_price_usd: formatUsdInputFromStars(toNumber(raw.normal_price_stars, 0)),
    promo_price_usd: formatUsdInputFromStars(toNumber(raw.promo_price_stars, 0)),
    promo_days: Math.max(1, toNumber(raw.promo_days, defaultSubscription.promo_days)),
    promo_expires_at: toDateTimeLocal(raw.promo_expires_at),
    telegram_username: typeof raw.telegram_username === 'string' ? raw.telegram_username : '',
    vip_channel_url: typeof raw.vip_channel_url === 'string' ? raw.vip_channel_url : '',
    is_active: raw.is_active !== false,
  }
}

function publicSubscription(value: NormalizedSubscription) {
  return {
    plan_mode: value.plan_mode,
    title: value.title.trim() || 'Subscription',
    message: value.message.trim(),
    normal_price_stars: value.normal_price_stars,
    promo_price_stars: value.promo_price_stars,
    promo_days: value.promo_days,
    promo_expires_at: value.promo_expires_at ? new Date(value.promo_expires_at).toISOString() : null,
    isFree: value.plan_mode === 'free',
  }
}

export function CreatorForm({ creator }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: creator?.name ?? '', handle: creator?.handle ?? '', slug: creator?.slug ?? '', avatar_image: creator?.avatar_image ?? '', cover_image: creator?.cover_image ?? '', bio: creator?.bio ?? '' })
  const [subscription, setSubscription] = useState<SubscriptionFormState>(() => readSubscription(creator?.subscription))
  const [selectedImages, setSelectedImages] = useState<Partial<Record<ImageField, File>>>({})
  const [previews, setPreviews] = useState<Partial<Record<ImageField, string>>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const set = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }))
  const setSubscriptionValue = (key: keyof SubscriptionFormState, value: string | number | boolean) => setSubscription(current => ({ ...current, [key]: value }))
  const suggestedSlug = useMemo(() => slugify(form.handle || form.name), [form.handle, form.name])

  useEffect(() => () => Object.values(previews).forEach(url => url && URL.revokeObjectURL(url)), [previews])

  useEffect(() => {
    if (!creator) return
    let active = true
    void getAdminSubscriptionSettings(creator.id).then(settings => {
      if (active && settings) setSubscription(readSubscription(settings))
    }).catch(() => undefined)
    return () => { active = false }
  }, [creator])

  useEffect(() => {
    if (!creator) return
    setForm(current => current.avatar_image === creator.avatar_image && current.cover_image === creator.cover_image ? current : { ...current, avatar_image: creator.avatar_image, cover_image: creator.cover_image })
  }, [creator?.id, creator?.avatar_image, creator?.cover_image])

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

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const normalizedSubscription: NormalizedSubscription = {
        ...subscription,
        title: subscription.title.trim() || 'Subscription',
        message: subscription.message.trim(),
        telegram_username: normalizeHandle(subscription.telegram_username),
        vip_channel_url: subscription.vip_channel_url.trim(),
        normal_price_stars: usdToStars(Number(subscription.normal_price_usd.replace(',', '.'))),
        promo_price_stars: usdToStars(Number(subscription.promo_price_usd.replace(',', '.'))),
        promo_days: Math.max(1, Math.round(subscription.promo_days)),
      }
      if (normalizedSubscription.is_active && !normalizedSubscription.telegram_username) throw new Error('Telegram username is required when the subscription is active.')
      if (normalizedSubscription.plan_mode === 'paid' && normalizedSubscription.normal_price_stars < 1) throw new Error(`A paid subscription needs a price of at least ${formatUsdFromStars(1)}.`)
      if (normalizedSubscription.plan_mode === 'promo' && (normalizedSubscription.normal_price_stars < 1 || normalizedSubscription.promo_price_stars < 1)) throw new Error(`A promotional subscription needs normal and promotional prices of at least ${formatUsdFromStars(1)}.`)
      if (normalizedSubscription.vip_channel_url && !/^(https:\/\/t\.me\/|tg:\/\/)/i.test(normalizedSubscription.vip_channel_url)) throw new Error('VIP channel must be a Telegram link starting with https://t.me/ or tg://.')
      const settingsPayload = { plan_mode: normalizedSubscription.plan_mode, title: normalizedSubscription.title, message: normalizedSubscription.message, normal_price_stars: normalizedSubscription.normal_price_stars, promo_price_stars: normalizedSubscription.promo_price_stars, promo_days: normalizedSubscription.promo_days, promo_expires_at: normalizedSubscription.promo_expires_at, telegram_username: normalizedSubscription.telegram_username, vip_channel_url: normalizedSubscription.vip_channel_url, is_active: normalizedSubscription.is_active }
      const payload = { name: form.name.trim(), handle: normalizeHandle(form.handle), slug: slugify(form.slug || suggestedSlug), avatar_image: form.avatar_image, cover_image: form.cover_image, bio: form.bio.trim(), expanded_bio: null, subscription: publicSubscription(normalizedSubscription) }
      if (!payload.name || !payload.handle || !payload.slug || !payload.bio) throw new Error('Name, handle, slug and bio are required.')
      if (creator) {
        await updateAdminCreator(creator.id, payload)
        await upsertAdminSubscriptionSettings(creator.id, { ...settingsPayload, promo_expires_at: normalizedSubscription.promo_expires_at ? new Date(normalizedSubscription.promo_expires_at).toISOString() : null })
        setSuccess('Creator and subscription offer updated successfully.')
      } else {
        const created = await createAdminCreator({ ...payload, published: false, status: 'draft' })
        await upsertAdminSubscriptionSettings(created.id, { ...settingsPayload, promo_expires_at: normalizedSubscription.promo_expires_at ? new Date(normalizedSubscription.promo_expires_at).toISOString() : null })
        const uploaded: Partial<Record<ImageField, string>> = {}
        for (const field of ['avatar_image', 'cover_image'] as ImageField[]) {
          const file = selectedImages[field]
          if (!file) continue
          const asset = await uploadMediaAsset(file, created.id)
          if (asset.public_url) uploaded[field] = asset.public_url
        }
        if (Object.keys(uploaded).length) await updateAdminCreator(created.id, uploaded)
        setSuccess('Creator created as a draft. Media and subscription offer were added.')
      }
      window.setTimeout(() => void navigate({ to: '/app/models', search: { edit: undefined, new: undefined, search: undefined, status: undefined, queue: undefined } }), 500)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the creator.') } finally { setSaving(false) }
  }

  const avatarPreview = previews.avatar_image || form.avatar_image
  const coverPreview = previews.cover_image || form.cover_image
  const isPaidOffer = subscription.plan_mode !== 'free'
  return <form onSubmit={submit} className="space-y-6 rounded-xl border bg-background p-4 shadow-sm md:p-6">
    <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[auto_1fr] sm:items-center"><div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">{avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl text-muted-foreground">{form.name.slice(0, 1).toUpperCase() || '?'}</div>}</div><div><p className="font-medium">{form.name || 'New creator'}</p><p className="text-sm text-muted-foreground">{form.handle ? `@${normalizeHandle(form.handle)}` : 'Add a handle to preview the profile identity.'}</p><p className="mt-1 text-xs text-muted-foreground">Creators are saved as drafts until published from the Creators list.</p></div></div>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{success && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div>}
    <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">Display name *</span><input required value={form.name} onChange={event => set('name', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Telegram handle *</span><input required value={form.handle} onChange={event => set('handle', event.target.value)} onBlur={() => set('handle', normalizeHandle(form.handle))} placeholder="alexmucci" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Profile slug *</span><input required value={form.slug} onChange={event => set('slug', event.target.value)} onBlur={() => set('slug', slugify(form.slug || suggestedSlug))} placeholder={suggestedSlug || 'creator-slug'} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /><small className="text-muted-foreground">Public URL: /creator/{slugify(form.slug || suggestedSlug) || 'creator-slug'}</small></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Profile photo</span><div className="flex gap-2"><input type="text" readOnly value={form.avatar_image} placeholder="Upload an image" className="h-10 min-w-0 flex-1 rounded-md border bg-muted/30 px-3 text-sm" /><label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{uploadingField === 'avatar_image' ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" className="sr-only" disabled={uploadingField !== null || saving} onChange={event => { void chooseImage('avatar_image', event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div></label>
      <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">Cover photo</span><div className="flex gap-2"><input type="text" readOnly value={form.cover_image} placeholder="Upload an image" className="h-10 min-w-0 flex-1 rounded-md border bg-muted/30 px-3 text-sm" /><label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{uploadingField === 'cover_image' ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" className="sr-only" disabled={uploadingField !== null || saving} onChange={event => { void chooseImage('cover_image', event.target.files?.[0]); event.currentTarget.value = '' }} /></label></div>{coverPreview && <img src={coverPreview} alt="Cover preview" className="mt-2 h-24 w-full rounded-md object-cover" />}</label>
    </div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Bio *</span><textarea required value={form.bio} onChange={event => set('bio', event.target.value)} placeholder="Write the complete creator bio. Long bios automatically show a More info button on the public profile." className="min-h-32 w-full rounded-md border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>

    <section className="space-y-4 rounded-lg border bg-muted/10 p-4">
      <div><h2 className="font-semibold">Subscription offer</h2><p className="text-sm text-muted-foreground">Configure this creator independently. Prices are entered and displayed in USD; the secure Telegram checkout opens only after the subscriber clicks.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm"><span className="font-medium">Plan mode</span><select value={subscription.plan_mode} onChange={event => setSubscriptionValue('plan_mode', event.target.value as SubscriptionPlanMode)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"><option value="free">Free</option><option value="paid">Paid</option><option value="promo">Paid with promotion</option></select></label>
        <label className="flex items-center gap-3 self-end pb-2 text-sm"><input type="checkbox" checked={subscription.is_active} onChange={event => setSubscriptionValue('is_active', event.target.checked)} className="h-4 w-4" /><span><span className="font-medium">Enable subscription</span><span className="block text-xs text-muted-foreground">Required before checkout or free activation.</span></span></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Offer title</span><input value={subscription.title} onChange={event => setSubscriptionValue('title', event.target.value)} maxLength={80} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" placeholder="Subscription" /></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Offer message</span><input value={subscription.message} onChange={event => setSubscriptionValue('message', event.target.value)} maxLength={255} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" placeholder="Exclusive content every week" /></label>
        {isPaidOffer && <label className="space-y-1 text-sm"><span className="font-medium">Normal price (USD)</span><input type="number" min="0.01" step="0.01" value={subscription.normal_price_usd} onChange={event => setSubscriptionValue('normal_price_usd', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label>}
        {subscription.plan_mode === 'promo' && <><label className="space-y-1 text-sm"><span className="font-medium">Promotional price (USD)</span><input type="number" min="0.01" step="0.01" value={subscription.promo_price_usd} onChange={event => setSubscriptionValue('promo_price_usd', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Promotion duration (days)</span><input type="number" min="1" max="3650" step="1" value={subscription.promo_days} onChange={event => setSubscriptionValue('promo_days', Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="space-y-1 text-sm"><span className="font-medium">Promotion ends (optional)</span><input type="datetime-local" value={subscription.promo_expires_at} onChange={event => setSubscriptionValue('promo_expires_at', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /></label></>}
        <label className="space-y-1 text-sm"><span className="font-medium">Creator Telegram username</span><input value={subscription.telegram_username} onChange={event => setSubscriptionValue('telegram_username', event.target.value)} onBlur={() => setSubscriptionValue('telegram_username', normalizeHandle(subscription.telegram_username))} placeholder="creator_username" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /><small className="text-muted-foreground">Used by the unlocked Message button.</small></label>
        <label className="space-y-1 text-sm"><span className="font-medium">VIP channel link</span><input value={subscription.vip_channel_url} onChange={event => setSubscriptionValue('vip_channel_url', event.target.value)} placeholder="https://t.me/your_channel" className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30" /><small className="text-muted-foreground">Private destination; returned only after subscription.</small></label>
      </div>
    </section>

    <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void navigate({ to: '/app/models', search: { edit: undefined, new: undefined, search: undefined, status: undefined, queue: undefined } })} className="h-10 rounded-md border px-4 text-sm">Cancel</button><button disabled={saving || uploadingField !== null} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : creator ? 'Save changes' : 'Create draft creator'}</button></div>
  </form>
}
