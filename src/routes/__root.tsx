/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'
import type { ReactNode } from 'react'
import indexCss from '../index.css?url'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, interactive-widget=overlays-content' },
      { title: 'Telefans' },
      { name: 'description', content: 'Telefans' },
      { name: 'theme-color', content: '#1c1d1f' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <AuthProvider>
              {children}
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
