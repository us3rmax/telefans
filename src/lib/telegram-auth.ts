import { supabase } from './supabase'

type TelegramWebApp = { initData: string; ready?: () => void; expand?: () => void }

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export type TelegramUser = {
  id: number
  username?: string
  first_name: string
  last_name?: string
  photo_url?: string
}

export async function authenticateTelegramMiniApp() {
  if (typeof window === 'undefined') return null
  const webApp = window.Telegram?.WebApp
  if (!webApp?.initData) return null
  webApp.ready?.()
  webApp.expand?.()

  const { data, error } = await supabase.functions.invoke<{ ok: boolean; user?: TelegramUser; error?: string }>('telegram-auth', {
    body: { initData: webApp.initData },
  })
  if (error) throw error
  if (!data?.ok || !data.user) throw new Error(data?.error ?? 'Não foi possível autenticar com o Telegram.')
  return data.user
}
