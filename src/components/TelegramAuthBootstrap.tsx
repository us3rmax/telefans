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
      webApp.setHeaderColor?.('#101010')
      webApp.setBackgroundColor?.('#101010')
      webApp.expand?.()
      webApp.disableVerticalSwipes?.()
      syncTelegramViewport(webApp)
      if (!cancelled && attempts < 6) {
        attempts += 1
        timer = window.setTimeout(enforceExpandedMiniApp, 150)
      }
    }

    enforceExpandedMiniApp()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    try { setAgeVerified(window.localStorage.getItem('telefans.age_verified') === 'true') } catch { setAgeVerified(false) }
    let active = true
    void authenticateTelegramMiniApp().then((telegramUser) => { if (active && telegramUser) { setUser(telegramUser); setConnected(true) } }).catch(() => { if (active) setConnected(false) })
    return () => { active = false }
  }, [])

  const confirmAge = () => { try { window.localStorage.setItem('telefans.age_verified', 'true') } catch { /* storage opcional */ }; setAgeVerified(true) }
  const leave = () => { const webApp = window.Telegram?.WebApp; if (webApp?.close) webApp.close(); else window.history.back() }

  return connected && user && ageVerified === false ? <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="global-age-gate-title"><div className="age-gate-card"><div className="age-gate-connected">{user.photo_url ? <img src={user.photo_url} alt="" /> : <span>{user.first_name.slice(0, 1).toUpperCase()}</span>}<p>Connected as<strong>{user.first_name}</strong></p></div><h2 id="global-age-gate-title">Adults only</h2><p className="age-gate-copy">TeleFans contains 18+ premium content. Confirm once that you are 18 years old or above to continue.</p><div className="age-gate-actions"><button type="button" onClick={leave}>Leave</button><button type="button" onClick={confirmAge}>I confirm I am 18+</button></div></div></div> : null
}
