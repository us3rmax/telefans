import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SharedAppLayout } from '@/layouts/shared-app-layout'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * Admin CRM shell. Every /app route requires a Supabase account authorized by is_admin().
 */
export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let active = true
    void getCurrentAdmin().then((admin) => {
      if (!active) return
      if (!admin) {
        void navigate({ to: '/admin/login' })
        return
      }
      setAuthorized(true)
      setChecking(false)
    })
    return () => { active = false }
  }, [navigate])

  if (checking || !authorized) return <main className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Validating access…</main>
  return <SharedAppLayout appName="TeleFans CRM"><Outlet /></SharedAppLayout>
}

export default AppLayout
