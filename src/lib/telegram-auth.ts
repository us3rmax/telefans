import { supabase } from './supabase'

type TelegramBackButton = {
  show?: () => void
  hide?: () => void
  onClick?: (callback: () => void) => void
  offClick?: (callback: () => void) => void
}

type TelegramWebApp = {
  initData?: string
  ready?: () => void
  expand?: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  isFullscreen?: boolean
  isVersionAtLeast?: (version: string) => boolean
  close?: () => void
  openTelegramLink?: (url: string) => void
  disableVerticalSwipes?: () => void
  enableVerticalSwipes?: () => void
  disableClosingConfirmation?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  BackButton?: TelegramBackButton
  safeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number }
  contentSafeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number }
}

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

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

export function syncTelegramViewport(webApp: TelegramWebApp | null | undefined) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const safe = webApp?.safeAreaInset ?? {}
  const content = webApp?.contentSafeAreaInset ?? {}
  const top = Math.max(Number(safe.top ?? 0), Number(content.top ?? 0))
  const bottom = Math.max(Number(safe.bottom ?? 0), Number(content.bottom ?? 0))
  const chromeTop = webApp ? Math.max(top, 48) : top
  root.style.setProperty('--tg-chrome-top', `${chromeTop}px`)
  root.style.setProperty('--tg-native-top', `${top}px`)
  root.style.setProperty('--tg-native-bottom', `${bottom}px`)
  root.style.setProperty('--tg-native-left', `${Math.max(Number(safe.left ?? 0), Number(content.left ?? 0))}px`)
  root.style.setProperty('--tg-native-right', `${Math.max(Number(safe.right ?? 0), Number(content.right ?? 0))}px`)
}

export function useTelegramBackButton(onBack: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const webApp = window.Telegram?.WebApp
  syncTelegramViewport(webApp)
  const button = webApp?.BackButton
  if (!button?.show || !button.onClick) return () => undefined
  button.onClick(onBack)
  button.show()
  return () => {
    button.offClick?.(onBack)
    button.hide?.()
  }
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
  const cached = readCachedUser()
  const webApp = await waitForWebApp()
  syncTelegramViewport(webApp)
  webApp?.ready?.(); webApp?.expand?.()
  if (!webApp?.initData) return cached
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; user?: TelegramUser; error?: string }>('telegram-auth', { body: { initData: webApp.initData } })
  if (error) throw error
  if (!data?.ok || !data.user) throw new Error(data?.error ?? 'Could not authenticate with Telegram.')
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
