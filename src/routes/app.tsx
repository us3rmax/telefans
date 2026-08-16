import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SharedAppLayout } from '@/layouts/shared-app-layout'

/**
 * Admin CRM shell.
 *
 * Authentication is intentionally disabled temporarily while the CRM is under
 * active development. Re-enable the admin guard before production launch.
 */
export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <SharedAppLayout appName="App">
      <Outlet />
    </SharedAppLayout>
  )
}

export default AppLayout

export const ADMIN_AUTH_TEMPORARILY_DISABLED = true

// Re-enable the admin session guard before production launch by restoring the
// getCurrentAdmin check in this layout.
void ADMIN_AUTH_TEMPORARILY_DISABLED
