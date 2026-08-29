import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PACKAGE_CODE_RE = /^[a-z0-9_-]{2,32}$/

type TelegramUser = { id: number; username?: string; first_name: string; last_name?: string; photo_url?: string }
type CoinPackage = {
  code: string
  name: string
  coins: number
  price_stars: number
  price_usd: number
  badge: string | null
  featured: boolean
}
type SuccessfulPayment = {
  invoice_payload: string
  telegram_payment_charge_id: string
  total_amount: number
  currency: string
}
type TelegramUpdate = {
  update_id?: number
  message?: { from?: TelegramUser; successful_payment?: SuccessfulPayment }
  pre_checkout_query?: {
    id: string
    from: TelegramUser
    currency: string
    total_amount: number
    invoice_payload: string
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
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
  return JSON.parse(rawUser) as TelegramUser
}

async function telegramApi(botToken: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { ok: boolean; result?: unknown; description?: string }
  if (!response.ok || !payload.ok) throw new Error(payload.description ?? `Telegram ${method} failed`)
  return payload.result
}

async function ensureTelegramUser(db: ReturnType<typeof createClient>, user: TelegramUser) {
  const { error } = await db.from('telegram_users').upsert({
    telegram_id: user.id,
    username: user.username ?? null,
    first_name: user.first_name,
    last_name: user.last_name ?? null,
    photo_url: user.photo_url ?? null,
    auth_date: new Date().toISOString(),
  }, { onConflict: 'telegram_id' })
  if (error) throw error
}

async function loadPackage(db: ReturnType<typeof createClient>, code: string) {
  if (!PACKAGE_CODE_RE.test(code)) throw new Error('Invalid coin package')
  const { data, error } = await db.from('coin_packages')
    .select('code, name, coins, price_stars, price_usd, badge, featured')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Coin package is not available')
  return data as CoinPackage
}

async function verifyWebhook(request: Request, botToken: string) {
  const expectedSecret = await sha256(botToken)
  return request.headers.get('x-telegram-bot-api-secret-token') === expectedSecret
}

async function handleBalance(db: ReturnType<typeof createClient>, botToken: string, initData: string) {
  const user = await validateInitData(initData, botToken)
  await ensureTelegramUser(db, user)
  const { data, error } = await db.from('telegram_users').select('coins_balance').eq('telegram_id', user.id).maybeSingle()
  if (error) throw error
  return json({ ok: true, coinsBalance: Number(data?.coins_balance ?? 0) })
}

async function handleCreate(db: ReturnType<typeof createClient>, botToken: string, initData: string, packageCode: string) {
  const user = await validateInitData(initData, botToken)
  await ensureTelegramUser(db, user)
  const packageRow = await loadPackage(db, packageCode)
  const invoicePayload = `tfcoin:${packageRow.code}:${user.id}:${crypto.randomUUID()}`
  const invoiceUrl = await telegramApi(botToken, 'createInvoiceLink', {
    title: 'Buy Coins',
    description: `${packageRow.coins.toLocaleString('en-US')} Coins package`,
    payload: invoicePayload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: `${packageRow.name} Coins`, amount: packageRow.price_stars }],
  }) as string

  const { error } = await db.from('coin_purchases').insert({
    telegram_id: user.id,
    package_code: packageRow.code,
    coins: packageRow.coins,
    stars_amount: packageRow.price_stars,
    currency: 'XTR',
    status: 'pending',
    invoice_payload: invoicePayload,
    metadata: { price_usd_display: packageRow.price_usd, package_name: packageRow.name },
  })
  if (error) throw error

  return json({
    ok: true,
    invoiceUrl,
    package: {
      code: packageRow.code,
      name: packageRow.name,
      coins: packageRow.coins,
      priceUsd: packageRow.price_usd,
      stars: packageRow.price_stars,
    },
  })
}

async function handlePreCheckout(request: Request, body: TelegramUpdate, db: ReturnType<typeof createClient>, botToken: string) {
  if (!(await verifyWebhook(request, botToken))) return json({ ok: false, error: 'Invalid webhook secret' }, 401)
  const query = body.pre_checkout_query
  if (!query) return json({ ok: true, ignored: true })

  let approved = false
  let errorMessage = 'This coin package is no longer available.'
  if (query.currency === 'XTR' && /^tfcoin:[a-z0-9_-]+:\d+:[0-9a-f-]+$/i.test(query.invoice_payload)) {
    const { data: purchase, error } = await db.from('coin_purchases')
      .select('telegram_id, stars_amount, status')
      .eq('invoice_payload', query.invoice_payload)
      .maybeSingle()
    if (error) throw error
    approved = Boolean(
      purchase
      && purchase.status === 'pending'
      && Number(purchase.telegram_id) === Number(query.from.id)
      && Number(purchase.stars_amount) === Number(query.total_amount),
    )
    if (!approved) errorMessage = 'The package price could not be verified.'
  }

  await telegramApi(botToken, 'answerPreCheckoutQuery', {
    pre_checkout_query_id: query.id,
    ok: approved,
    ...(approved ? {} : { error_message: errorMessage }),
  })
  return json({ ok: true, approved })
}

async function handleSuccessfulPayment(request: Request, body: TelegramUpdate, db: ReturnType<typeof createClient>, botToken: string) {
  if (!(await verifyWebhook(request, botToken))) return json({ ok: false, error: 'Invalid webhook secret' }, 401)
  const payment = body.message?.successful_payment
  if (!payment || payment.currency !== 'XTR') return json({ ok: true, ignored: true })
  const telegramId = body.message?.from?.id
  if (!telegramId) return json({ ok: false, error: 'Missing payer' }, 400)

  const { data, error } = await db.rpc('settle_coin_purchase', {
    p_invoice_payload: payment.invoice_payload,
    p_telegram_payment_charge_id: payment.telegram_payment_charge_id,
    p_telegram_id: telegramId,
    p_total_amount: payment.total_amount,
  })
  if (error) throw error
  const settled = Array.isArray(data) ? data[0] : data
  return json({
    ok: true,
    processed: true,
    duplicate: Boolean(settled?.already_processed),
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const body = await request.json() as TelegramUpdate & Record<string, unknown>

    if (!botToken) return json({ ok: false, error: 'Telegram bot is not configured' }, 503)
    if (body.pre_checkout_query) return await handlePreCheckout(request, body, db, botToken)
    if (body.message?.successful_payment || body.update_id !== undefined) return await handleSuccessfulPayment(request, body, db, botToken)

    if (typeof body.initData !== 'string' || typeof body.action !== 'string') {
      return json({ ok: false, error: 'Invalid coin purchase request' }, 400)
    }
    if (body.action === 'balance') return await handleBalance(db, botToken, body.initData)
    if (body.action !== 'create' || typeof body.packageCode !== 'string') return json({ ok: false, error: 'Invalid coin purchase request' }, 400)
    return await handleCreate(db, botToken, body.initData, body.packageCode)
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Coin purchase failed' }, 400)
  }
})
