import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'telescope-clone-site-kugeom4h',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_-737DnYs_1ZFgs8smncWLIiF9HuxSgE6',
  authRequired: false,
  auth: { mode: 'managed' },
})
