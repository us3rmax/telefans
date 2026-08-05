import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'telegram-ui-clone-rcgflz8n',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_t4KbuiD0Ct1pBojfo15OPbUSkyM9um3t',
  authRequired: false,
  auth: { mode: 'managed' },
})
