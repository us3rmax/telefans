import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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

async function telegramApi(method: string, botToken: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok || !result.ok) throw new Error(result.description || `Telegram ${method} failed`)
  return result.result
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { initData, inviteUrl: requestedInviteUrl } = await request.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken || typeof initData !== 'string') throw new Error('Telegram sharing is not configured')

    const user = await validateInitData(initData, botToken)
    const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'telefansapp_bot'
    const inviteUrl = `https://t.me/${botUsername}?startapp=ref_${user.id}`
    if (requestedInviteUrl !== undefined && requestedInviteUrl !== inviteUrl) throw new Error('Invite link does not belong to the authenticated user')

    const result = {
      type: 'article',
      id: `telefans-profile-${user.id}`,
      title: 'Discover TeleFans',
      description: 'Discover content creators on Telegram 💙',
      input_message_content: {
        message_text: `I found a Telegram app you are going to love 👀\n\n<a href="${inviteUrl}">Discover TeleFans here:</a>`,
        parse_mode: 'HTML',
      },
    }
    const prepared = await telegramApi('savePreparedInlineMessage', botToken, {
      user_id: user.id,
      result,
      allow_user_chats: true,
      allow_bot_chats: false,
      allow_group_chats: true,
      allow_channel_chats: true,
    })

    return new Response(JSON.stringify({ ok: true, id: prepared.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Telegram sharing failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
