import { useEffect } from 'react'
import { authenticateTelegramMiniApp } from '@/lib/telegram-auth'

export function TelegramAuthBootstrap() {
  useEffect(() => {
    void authenticateTelegramMiniApp().catch(() => {
      // Public pages remain usable when Telegram auth is unavailable or expired.
    })
  }, [])

  return null
}
