import { useEffect, useState } from 'react'
import { authenticateTelegramMiniApp, syncTelegramViewport, type TelegramUser } from '@/lib/telegram-auth'

export function TelegramAuthBootstrap() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [connected, setConnected] = useState(false)
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (webApp) {
      const preventGesture = (event: Event) => event.preventDefault()
      const preventCtrlWheel = (event: WheelEvent) => { if (event.ctrlKey) event.preventDefault() }
      document.documentElement.classList.add('telegram-no-zoom')
      document.addEventListener('gesturestart', preventGesture, { passive: false })
      document.addEventListener('gesturechange', preventGesture, { passive: false })
      document.addEventListener('gestureend', preventGesture, { passive: false })
      document.addEventListener('wheel', preventCtrlWheel, { passive: false })
      return () => {
        document.documentElement.classList.remove('telegram-no-zoom')
        document.removeEventListener('gesturestart', preventGesture)
        document.removeEventListener('gesturechange', preventGesture)
        document.removeEventListener('gestureend', preventGesture)
        document.removeEventListener('wheel', preventCtrlWheel)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let timer: number | undefined

    const enforceExpandedMiniApp = () => {
      const webApp = window.Telegram?.WebApp
      if (!webApp) {
        if (!cancelled && attempts < 40) {
          attempts += 1
          timer = window.setTimeout(enforceExpandedMiniApp, 100)
        }
        return
      }
      webApp.ready?.()
      webApp.disableClosingConfirmation?.()
      webApp.disableVerticalSwipes?.()
      webApp.setHeaderColor?.('#101010')
      webApp.setBackgroundColor?.('#101010')

      // Fullscreen is an official Bot API 8.0+ capability. Older Telegram
      // clients keep the existing expand() behavior as a safe fallback.
      const supportsFullscreen = webApp.isVersionAtLeast?.('8.0') === true
      if (supportsFullscreen && webApp.requestFullscreen) {
        try {
          webApp.requestFullscreen()
        } catch {
          webApp.expand?.()
        }
      } else {
        webApp.expand?.()
      }

      syncTelegramViewport(webApp)
      if (!cancelled && attempts < 6) {
        attempts += 1
        timer = window.setTimeout(enforceExpandedMiniApp, 150)
      }
    }

    enforceExpandedMiniApp()
    return () => {
      cancelled = true
      window.Telegram?.WebApp?.enableVerticalSwipes?.()
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    let active = true
    let verified = false
    try { verified = window.localStorage.getItem('telefans.age_verified') === 'true' } catch { verified = false }
    setAgeVerified(verified)

    // Do not authenticate or create the Telegram account until age consent exists.
    if (!verified) return () => { active = false }

    void authenticateTelegramMiniApp().then((telegramUser) => {
      if (active && telegramUser) { setUser(telegramUser); setConnected(true) }
    }).catch(() => { if (active) setConnected(false) })
    return () => { active = false }
  }, [])

  const confirmAge = () => {
    try { window.localStorage.setItem('telefans.age_verified', 'true') } catch { /* storage opcional */ }
    setAgeVerified(true)
    void authenticateTelegramMiniApp().then((telegramUser) => {
      if (telegramUser) { setUser(telegramUser); setConnected(true) }
    }).catch(() => setConnected(false))
  }
  const leave = () => { const webApp = window.Telegram?.WebApp; if (webApp?.close) webApp.close(); else window.history.back() }

  return ageVerified === false ? <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="global-age-gate-title"><div className="age-gate-card"><h2 id="global-age-gate-title">Adults only</h2><p className="age-gate-copy">This app contains 18+ content. You must confirm that you are 18 years old or above before creating an account or continuing.</p><div className="age-gate-actions"><button type="button" onClick={leave}>Leave</button><button type="button" onClick={confirmAge}>I confirm I am 18+</button></div></div></div> : null
}
