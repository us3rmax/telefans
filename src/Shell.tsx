import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface ShellProps {
  sidebar: ReactNode
  appName?: string
  children: ReactNode
}

export function Shell({ sidebar, appName = 'App', children }: ShellProps) {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const submitSearch = () => {
    const value = query.trim()
    if (!value) return
    window.location.href = `/app/models?search=${encodeURIComponent(value)}`
  }

  return (
    <div className="crm-shell flex min-h-dvh bg-[#090c12]">
      <aside className="hidden md:block shrink-0">{sidebar}</aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[17rem] border-white/[0.08] bg-[#0d111a] p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="flex flex-1 min-w-0 flex-col">
        <header className="crm-topbar relative flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-400 hover:bg-white/[0.06] hover:text-white md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">{appName}</p><p className="truncate text-sm font-semibold text-slate-200">Agency operations</p></div>
          </div>
          <div className="flex items-center gap-2">
            {searchOpen && <form onSubmit={event => { event.preventDefault(); submitSearch() }} className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2">
              <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search creators" aria-label="Search creators" className="h-8 w-32 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500 sm:w-44" />
              <button type="button" aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery('') }} className="text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </form>}
            {!searchOpen && <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className="crm-topbar-icon hidden sm:grid"><Search className="h-4 w-4" /></button>}
            <div className="relative">
              <button type="button" aria-label="Notifications" onClick={() => setNotificationsOpen(value => !value)} className="crm-topbar-icon"><Bell className="h-4 w-4" /><span className="crm-notification-dot" /></button>
              {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-white/[0.1] bg-[#111722] p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between"><strong className="text-xs text-slate-100">Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" /></button></div>
                <p className="text-xs leading-5 text-slate-400">Your CRM workspace is live. Operational alerts will appear here when action events are connected.</p>
              </div>}
            </div>
            <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />
            <div className="crm-status-chip"><span />Live workspace</div>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  )
}

