import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const SUBSCRIPTION_PERIOD_SECONDS = 2_592_000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type TelegramUser = { id: number; username?: string; first_name: string; last_name?: string; photo_url?: string }
type Settings = {
  creator_id: string
  plan_mode: 'free' | 'paid' | 'promo'
  title: string
  message: string
  normal_price_stars: number
  promo_price_stars: number
  promo_days: number
  promo_expires_at: string | null
  telegram_username: string
  vip_channel_url: string
  is_active: boolean
}

type Offer = {
  mode: 'free' | 'paid' | 'promo'
  stars: number
  days: number | null
  autoRenew: boolean
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function validateInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData)
  const receivedHash = params.get('hash')
  if (!receivedHash) throw new Error('Missing Telegram hash')
  params.delete('hash')
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n')
  const encoder = new TextEncoder()
  const webAppKey = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const secret = await crypto.subtle.sign('HMAC', webAppKey, encoder.encode(botToken))
  const dataKey = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const calculatedHash = hex(await crypto.subtle.sign('HMAC', dataKey, encoder.encode(dataCheckString)))
  if (calculatedHash !== receivedHash) throw new Error('Invalid Telegram signature')
  const authDate = Number(params.get('auth_date'))
  if (!authDate || Date.now() / 1000 - authDate > 86400) throw new Error('Expired Telegram login data')
  const rawUser = params.get('user')
  if (!rawUser) throw new Error('Missing Telegram user')
  return { user: JSON.parse(rawUser) as TelegramUser }
}

async function telegramApi(botToken: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json() as { ok: boolean; result?: unknown; description?: string }
  if (!response.ok || !payload.ok) throw new Error(payload.description ?? `Telegram ${method} failed`)
  return payload.result
}

function activeOffer(settings: Settings, now = Date.now()): Offer {
  if (!settings.is_active || settings.plan_mode === 'free') return { mode: 'free', stars: 0, days: null, autoRenew: false }
  const promoValid = settings.plan_mode === 'promo' && settings.promo_price_stars > 0 && (!settings.promo_expires_at || new Date(settings.promo_expires_at).getTime() > now)
  if (promoValid) return { mode: 'promo', stars: settings.promo_price_stars, days: Math.max(1, settings.promo_days), autoRenew: false }
  return { mode: 'paid', stars: Math.max(1, settings.normal_price_stars), days: 30, autoRenew: true }
}

function publicOffer(settings: Settings, offer: Offer) {
  return {
    mode: offer.mode,
    stars: offer.stars,
    days: offer.days,
    autoRenew: offer.autoRenew,
    title: settings.title,
    message: settings.message,
    promoExpiresAt: settings.promo_expires_at,
  }
}

async function loadSettings(db: ReturnType<typeof createClient>, creatorId: string) {
  const { data, error } = await db.from('creator_subscription_settings').select('creator_id, plan_mode, title, message, normal_price_stars, promo_price_stars, promo_days, promo_expires_at, telegram_username, vip_channel_url, is_active').eq('creator_id', creatorId).maybeSingle()
  if (error) throw error
  return data as Settings | null
}

async function loadCreator(db: ReturnType<typeof createClient>, creatorId: string) {
  const { data, error } = await db.from('creators').select('id, name, handle, avatar_image, published').eq('id', creatorId).eq('published', true).maybeSingle()
  if (error) throw error
  return data as { id: string; name: string; handle: string; avatar_image: string | null; published: boolean } | null
}

function normalizeTelegramUsername(value: unknown) {
  const username = typeof value === 'string' ? value.trim().replace(/^@+/, '') : ''
  return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : ''
}

function defaultFreeSettings(creatorId: string, creatorName: string, creatorHandle: string): Settings {
  return { creator_id: creatorId, plan_mode: 'free', title: 'Subscription', message: `Join ${creatorName} on TeleFans.`, normal_price_stars: 0, promo_price_stars: 0, promo_days: 30, promo_expires_at: null, telegram_username: normalizeTelegramUsername(creatorHandle), vip_channel_url: '', is_active: true }
}

function withCreatorDefaults(settings: Settings, creatorHandle: string) {
  const configuredUsername = normalizeTelegramUsername(settings.telegram_username)
  if (configuredUsername) return configuredUsername === settings.telegram_username ? settings : { ...settings, telegram_username: configuredUsername }
  const fallbackUsername = normalizeTelegramUsername(creatorHandle)
  return fallbackUsername ? { ...settings, telegram_username: fallbackUsername } : settings
}

async function ensureTelegramUser(db: ReturnType<typeof createClient>, user: TelegramUser) {
  const { error } = await db.from('telegram_users').upsert({ telegram_id: user.id, username: user.username ?? null, first_name: user.first_name, last_name: user.last_name ?? null, photo_url: user.photo_url ?? null, auth_date: new Date().toISOString() }, { onConflict: 'telegram_id' })
  if (error) throw error
}

async function currentSubscription(db: ReturnType<typeof createClient>, creatorId: string, telegramId: number) {
  const { data, error } = await db.from('creator_subscriptions').select('id, creator_id, telegram_id, subscription_type, payment_status, stars_amount, telegram_invoice_payload, telegram_payment_charge_id, current_period_start, current_period_end, auto_renew').eq('creator_id', creatorId).eq('telegram_id', telegramId).maybeSingle()
  if (error) throw error
  return data
}

function isActiveSubscription(row: { payment_status: string; current_period_end: string | null } | null) {
  if (!row || row.payment_status !== 'active') return false
  return !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now()
}

function resourceResponse(settings: Settings, subscription: Record<string, unknown> | null, offer: Offer) {
  const active = isActiveSubscription(subscription as { payment_status: string; current_period_end: string | null } | null)
  return {
    ok: true,
    subscribed: active,
    offer: publicOffer(settings, offer),
    subscription: active && subscription ? {
      status: subscription.payment_status,
      type: subscription.subscription_type,
      currentPeriodEnd: subscription.current_period_end,
      autoRenew: subscription.auto_renew,
    } : null,
    telegramUsername: active ? normalizeTelegramUsername(settings.telegram_username) || null : null,
    vipChannelUrl: active ? settings.vip_channel_url : null,
  }
}

async function handleStart(db: ReturnType<typeof createClient>, botToken: string, user: TelegramUser, creatorId: string) {
  if (!UUID_RE.test(creatorId)) return json({ ok: false, error: 'Invalid creator id' }, 400)
  await ensureTelegramUser(db, user)
  const creator = await loadCreator(db, creatorId)
  const storedSettings = await loadSettings(db, creatorId)
  if (!creator) return json({ ok: false, error: 'Creator is not available' }, 404)
  const settings = withCreatorDefaults(storedSettings ?? defaultFreeSettings(creatorId, creator.name, creator.handle), creator.handle)
  if (!settings.is_active) return json({ ok: false, error: 'Subscription is not available for this creator' }, 404)
  const offer = activeOffer(settings)
  const existing = await currentSubscription(db, creatorId, user.id)
  if (isActiveSubscription(existing)) return new Response(JSON.stringify(resourceResponse(settings, existing, offer)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (offer.mode === 'free') {
    const { data, error } = await db.from('creator_subscriptions').upsert({ creator_id: creatorId, telegram_id: user.id, subscription_type: 'free', payment_status: 'active', stars_amount: 0, telegram_invoice_payload: null, current_period_start: new Date().toISOString(), current_period_end: null, auto_renew: false }, { onConflict: 'creator_id,telegram_id' }).select('id, creator_id, telegram_id, subscription_type, payment_status, stars_amount, current_period_start, current_period_end, auto_renew').single()
    if (error) throw error
    await db.from('crm_fan_events').upsert({ telegram_id: user.id, creator_id: creatorId, event_type: 'subscription_started', amount: 0, currency: 'Stars', idempotency_key: `free:${creatorId}:${user.id}`, metadata: { subscription_type: 'free' } }, { onConflict: 'idempotency_key' })
    return new Response(JSON.stringify(resourceResponse(settings, data, offer)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (!botToken) return json({ ok: false, error: 'Telegram Stars is not configured' }, 503)
  const payload = `tfsub:${creatorId}:${user.id}:${crypto.randomUUID()}`
  const title = (creator.name || settings.title || 'TeleFans').slice(0, 32)
  const description = (settings.message || `Subscription to ${creator.name}`).slice(0, 255)
  const invoice = await telegramApi(botToken, 'createInvoiceLink', {
    title,
    description,
    payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: creator.name || title, amount: offer.stars }],
    ...(creator.avatar_image ? { photo_url: creator.avatar_image } : {}),
    ...(offer.autoRenew ? { subscription_period: SUBSCRIPTION_PERIOD_SECONDS } : {}),
  }) as string
  const { error } = await db.from('creator_subscriptions').upsert({ creator_id: creatorId, telegram_id: user.id, subscription_type: offer.mode, payment_status: 'pending', stars_amount: offer.stars, telegram_invoice_payload: payload, telegram_payment_charge_id: null, current_period_start: null, current_period_end: null, auto_renew: offer.autoRenew }, { onConflict: 'creator_id,telegram_id' })
  if (error) throw error
  return new Response(JSON.stringify({ ok: true, subscribed: false, invoiceUrl: invoice, offer: publicOffer(settings, offer) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function handleStatus(db: ReturnType<typeof createClient>, user: TelegramUser, creatorId: string) {
  if (!UUID_RE.test(creatorId)) return json({ ok: false, error: 'Invalid creator id' }, 400)
  const creator = await loadCreator(db, creatorId)
  const storedSettings = await loadSettings(db, creatorId)
  if (!creator) return json({ ok: false, error: 'Creator is not available' }, 404)
  const settings = withCreatorDefaults(storedSettings ?? defaultFreeSettings(creatorId, creator.name, creator.handle), creator.handle)
  if (!settings.is_active) return json({ ok: false, error: 'Subscription is not available for this creator' }, 404)
  const offer = activeOffer(settings)
  const subscription = await currentSubscription(db, creatorId, user.id)
  if (subscription?.payment_status === 'active' && !isActiveSubscription(subscription)) {
    await db.from('creator_subscriptions').update({ payment_status: 'expired', updated_at: new Date().toISOString() }).eq('id', subscription.id)
    subscription.payment_status = 'expired'
  }
  return new Response(JSON.stringify(resourceResponse(settings, subscription, offer)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

type TelegramPaymentUpdate = { message?: { from?: TelegramUser; successful_payment?: { invoice_payload: string; telegram_payment_charge_id: string; total_amount: number; currency: string; subscription_expiration_date?: number; is_recurring?: boolean; is_first_recurring?: boolean } } }

async function handleWebhook(request: Request, body: TelegramPaymentUpdate, db: ReturnType<typeof createClient>, botToken: string) {
  if (!botToken) return json({ ok: false, error: 'Telegram bot is not configured' }, 503)
  const expectedSecret = await sha256(botToken)
  if (request.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) return json({ ok: false, error: 'Invalid webhook secret' }, 401)
  const payment = body.message?.successful_payment
  if (!payment?.invoice_payload || payment.currency !== 'XTR') return json({ ok: true, ignored: true })
  const telegramId = body.message?.from?.id
  if (!telegramId) return json({ ok: false, error: 'Missing payer' }, 400)
  const { data: existing, error: lookupError } = await db.from('creator_subscriptions').select('id, creator_id, telegram_id, subscription_type, payment_status, stars_amount, auto_renew, current_period_end, telegram_payment_charge_id').eq('telegram_invoice_payload', payment.invoice_payload).maybeSingle()
  if (lookupError) throw lookupError
  if (existing && Number(existing.telegram_id) !== telegramId) return json({ ok: false, error: 'Invoice payer does not match the subscription user' }, 400)
  if (existing?.telegram_payment_charge_id && existing.telegram_payment_charge_id === payment.telegram_payment_charge_id && existing.payment_status === 'active') return json({ ok: true, processed: true, duplicate: true })
  let creatorId = existing?.creator_id as string | undefined
  if (!creatorId) {
    const match = /^tfsub:([^:]+):(\d+):/.exec(payment.invoice_payload)
    if (!match || !UUID_RE.test(match[1]) || Number(match[2]) !== telegramId) return json({ ok: false, error: 'Unknown invoice payload' }, 400)
    creatorId = match[1]
  }
  const settings = await loadSettings(db, creatorId)
  if (!settings || !settings.is_active) return json({ ok: false, error: 'Subscription settings are unavailable' }, 404)
  const subscriptionType = existing?.subscription_type ?? (settings.plan_mode === 'promo' ? 'promo' : 'paid')
  const expectedStars = existing?.stars_amount ?? activeOffer(settings).stars
  if (payment.total_amount !== expectedStars) return json({ ok: false, error: 'Invoice amount does not match the configured offer' }, 400)
  const configuredDays = subscriptionType === 'promo' ? Math.max(1, settings.promo_days) : 30
  const periodEnd = payment.subscription_expiration_date
    ? new Date(payment.subscription_expiration_date * 1000).toISOString()
    : new Date(Date.now() + configuredDays * 86400000).toISOString()
  const { error: updateError } = await db.from('creator_subscriptions').upsert({ id: existing?.id, creator_id: creatorId, telegram_id: telegramId, subscription_type: subscriptionType, payment_status: 'active', stars_amount: payment.total_amount, telegram_invoice_payload: payment.invoice_payload, telegram_payment_charge_id: payment.telegram_payment_charge_id, current_period_start: new Date().toISOString(), current_period_end: periodEnd, auto_renew: existing?.auto_renew ?? Boolean(payment.is_recurring) }, { onConflict: 'creator_id,telegram_id' })
  if (updateError) throw updateError
  const { error: eventError } = await db.from('crm_fan_events').upsert({ telegram_id: telegramId, creator_id: creatorId, event_type: 'subscription_started', amount: payment.total_amount, currency: 'Stars', idempotency_key: `stars:${payment.telegram_payment_charge_id}`, metadata: { invoice_payload: payment.invoice_payload, recurring: Boolean(payment.is_recurring), first_recurring: Boolean(payment.is_first_recurring) } }, { onConflict: 'idempotency_key' })
  if (eventError) throw eventError
  const { error: transactionError } = await db.from('crm_fan_transactions').upsert({ telegram_id: telegramId, creator_id: creatorId, transaction_type: 'subscription', gross_amount: payment.total_amount, creator_amount: payment.total_amount, currency: 'Stars', external_reference: payment.telegram_payment_charge_id, idempotency_key: `stars:${payment.telegram_payment_charge_id}`, metadata: { invoice_payload: payment.invoice_payload } }, { onConflict: 'idempotency_key' })
  if (transactionError) throw transactionError
  return json({ ok: true, processed: true })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const body = await request.json() as Record<string, unknown>
    if (body?.update_id !== undefined || (body?.message && typeof body.message === 'object' && (body.message as Record<string, unknown>).successful_payment)) return await handleWebhook(request, body as TelegramPaymentUpdate, db, botToken)
    if (!botToken || typeof body?.initData !== 'string') return json({ ok: false, error: 'Telegram authentication is not configured' }, 503)
    const { user } = await validateInitData(body.initData, botToken)
    if (body.action === 'start') return await handleStart(db, botToken, user, String(body.creatorId ?? ''))
    if (body.action === 'status') return await handleStatus(db, user, String(body.creatorId ?? ''))
    return json({ ok: false, error: 'Unknown subscription action' }, 400)
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Subscription request failed' }, 400)
  }
})
