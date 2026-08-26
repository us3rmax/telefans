import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
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
  return JSON.parse(rawUser) as { id: number }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const { initData, postId } = await request.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken || typeof initData !== 'string' || typeof postId !== 'string') {
      return json({ ok: false, error: 'Unlock request is not configured correctly' }, 400)
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId)) {
      return json({ ok: false, error: 'Invalid post id' }, 400)
    }

    const user = await validateInitData(initData, botToken)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data, error } = await supabase.rpc('unlock_paid_media', {
      p_telegram_id: user.id,
      p_post_id: postId,
    })
    if (error) {
      const status = error.code === 'P0001' ? 402 : error.code === 'P0002' ? 404 : 400
      return json({ ok: false, error: error.message }, status)
    }

    const unlocked = Array.isArray(data) ? data[0] : data
    if (!unlocked?.media_url) return json({ ok: false, error: 'Paid media could not be unlocked' }, 409)

    return json({
      ok: true,
      mediaUrl: unlocked.media_url,
      coinsBalance: unlocked.remaining_coins,
      alreadyUnlocked: unlocked.already_unlocked,
    })
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Paid media unlock failed' }, 401)
  }
})
