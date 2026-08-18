import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface ShellProps {
  sidebar: ReactNode
  appName?: string
  children: ReactNode
}

export function Shell({ sidebar, appName = 'App', children }: ShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="crm-shell flex min-h-dvh bg-[#090c12]">
      <aside className="hidden md:block shrink-0">{sidebar}</aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[17rem] border-white/[0.08] bg-[#0d111a] p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="flex flex-1 min-w-0 flex-col">
        <header className="crm-topbar flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-400 hover:bg-white/[0.06] hover:text-white md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">{appName}</p><p className="truncate text-sm font-semibold text-slate-200">Agency operations</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Search" className="crm-topbar-icon hidden sm:grid"><Search className="h-4 w-4" /></button>
            <button type="button" aria-label="Notifications" className="crm-topbar-icon"><Bell className="h-4 w-4" /><span className="crm-notification-dot" /></button>
            <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />
            <div className="crm-status-chip"><span />Live workspace</div>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  )
}
