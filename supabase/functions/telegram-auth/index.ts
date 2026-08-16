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
  return {
    user: JSON.parse(rawUser) as { id: number; username?: string; first_name: string; last_name?: string; photo_url?: string },
    startParam: params.get('start_param') ?? '',
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const { initData } = await request.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken || typeof initData !== 'string') throw new Error('Telegram authentication is not configured')

    const { user, startParam } = await validateInitData(initData, botToken)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: existingUser, error: lookupError } = await supabase
      .from('telegram_users')
      .select('telegram_id')
      .eq('telegram_id', user.id)
      .maybeSingle()
    if (lookupError) throw lookupError

    const { error: upsertError } = await supabase.from('telegram_users').upsert({
      telegram_id: user.id,
      username: user.username ?? null,
      first_name: user.first_name,
      last_name: user.last_name ?? null,
      photo_url: user.photo_url ?? null,
      auth_date: new Date().toISOString(),
    }, { onConflict: 'telegram_id' })
    if (upsertError) throw upsertError

    let referralRewardClaimed = false
    const referralMatch = /^ref_(\d+)$/.exec(startParam)
    if (!existingUser && referralMatch) {
      const referrerId = Number(referralMatch[1])
      const { data: claimed, error: referralError } = await supabase.rpc('claim_referral_reward', {
        p_referred_telegram_id: user.id,
        p_referrer_telegram_id: referrerId,
      })
      if (referralError) throw referralError
      referralRewardClaimed = claimed === true
    }

    const { data: account, error: accountError } = await supabase
      .from('telegram_users')
      .select('coins_balance, referral_count')
      .eq('telegram_id', user.id)
      .single()
    if (accountError) throw accountError

    return new Response(JSON.stringify({
      ok: true,
      user: { ...user, coins_balance: account.coins_balance, referral_count: account.referral_count },
      referralRewardClaimed,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Telegram authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
