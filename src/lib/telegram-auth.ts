import { supabase } from './supabase'

type TelegramWebApp = { initData?: string; ready?: () => void; expand?: () => void }

declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

export type TelegramUser = { id: number; username?: string; first_name: string; last_name?: string; photo_url?: string }
export type TelegramAuthState = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'

const SESSION_KEY = 'telefans.telegram.session'
let authPromise: Promise<TelegramUser | null> | null = null

function readCachedUser(): TelegramUser | null {
  try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as TelegramUser : null } catch { return null }
}

function saveCachedUser(user: TelegramUser) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)) } catch { /* storage opcional */ }
}

export function clearTelegramSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* storage opcional */ }
  authPromise = null
}

async function waitForWebApp(timeoutMs = 3500): Promise<TelegramWebApp | null> {
  if (typeof window === 'undefined') return null
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const webApp = window.Telegram?.WebApp
    if (webApp) return webApp
    await new Promise((resolve) => window.setTimeout(resolve, 100))
  }
  return window.Telegram?.WebApp ?? null
}

async function authenticateOnce(): Promise<TelegramUser | null> {
  const webApp = await waitForWebApp()
  if (!webApp?.initData) return null
  webApp.ready?.(); webApp.expand?.()
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; user?: TelegramUser; error?: string }>('telegram-auth', { body: { initData: webApp.initData } })
  if (error) throw error
  if (!data?.ok || !data.user) throw new Error(data?.error ?? 'Não foi possível autenticar com o Telegram.')
  saveCachedUser(data.user)
  return data.user
}

export function authenticateTelegramMiniApp() {
  if (!authPromise) authPromise = authenticateOnce().catch((error) => { authPromise = null; throw error })
  return authPromise
}

export async function getTelegramUser() {
  return authenticateTelegramMiniApp()
}
