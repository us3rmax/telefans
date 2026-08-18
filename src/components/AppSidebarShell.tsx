import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  href: string
  icon: ReactNode
  label: string
  exact?: boolean
}

const NAV_ITEMS: NavItemDef[] = [
  { href: '/app', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Overview', exact: true },
  { href: '/app/models', icon: <UsersRound className="h-4 w-4" />, label: 'Creators' },
  { href: '/app/fans', icon: <BarChart3 className="h-4 w-4" />, label: 'Fan metrics' },
]

function NavItem({ item, collapsed, active }: { item: NavItemDef; collapsed: boolean; active: boolean }) {
  const link = (
    <a
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl text-[13px] transition-all duration-200 cursor-pointer',
        collapsed ? 'justify-center w-9 h-9 mx-auto' : 'px-3 h-10 w-full',
        active
          ? 'bg-cyan-400/12 text-cyan-200 ring-1 ring-cyan-300/15'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
      )}
    >
      <span className={cn('shrink-0 transition-colors', active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300')}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-cyan-300/70" />}
    </a>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function AppSidebarShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(SIDEBAR_KEY) === 'true') setCollapsed(true)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(value => {
      const next = !value
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('crm-sidebar flex flex-col h-full overflow-hidden shrink-0 transition-[width] duration-200 ease-linear', collapsed ? 'w-[4.25rem]' : 'w-[16.5rem]')}>
        <div className={cn('flex items-center gap-3 shrink-0 h-[72px] px-5 border-b border-white/[0.06]', collapsed && 'justify-center px-2')}>
          <div className="crm-brand-mark"><Sparkles className="h-4 w-4" /></div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold tracking-tight text-slate-100">TeleFans</p><p className="truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">Creator CRM</p></div>}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 text-slate-500 hover:bg-white/[0.06] hover:text-slate-100" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                <PanelLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-1">
          {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>}
          {NAV_ITEMS.map(item => {
            const active = item.exact ? location.pathname === item.href : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            return <NavItem key={item.href} item={item} collapsed={collapsed} active={active} />
          })}
          {!collapsed && <p className="px-3 pt-7 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">System</p>}
          <button type="button" onClick={() => setSettingsOpen(value => !value)} aria-expanded={settingsOpen} className={cn('group flex items-center gap-3 rounded-xl text-[13px] transition-all duration-200 text-slate-500 hover:bg-white/[0.05] hover:text-slate-200', collapsed ? 'justify-center w-9 h-9 mx-auto' : 'px-3 h-10 w-full')}>
            <Settings2 className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-300" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </button>
          {settingsOpen && !collapsed && <div className="mx-1 mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[11px] text-slate-400"><p className="font-semibold text-slate-200">Admin preferences</p><p className="mt-1 leading-4">Sidebar state is saved automatically on this device.</p><button type="button" onClick={() => { localStorage.removeItem(SIDEBAR_KEY); setCollapsed(false); setSettingsOpen(false) }} className="mt-2 text-cyan-300 hover:text-cyan-200">Reset sidebar layout</button></div>}
        </div>

        <div className={cn('shrink-0 border-t border-white/[0.06]', collapsed ? 'flex flex-col items-center gap-2 p-3' : 'p-4 space-y-3')}>
          {collapsed ? (
            <Tooltip><TooltipTrigger asChild><button type="button" onClick={() => { window.location.href = '/app' }} aria-label="Open Agency workspace" className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition-colors"><Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-cyan-400/15 text-cyan-200">A</AvatarFallback></Avatar></button></TooltipTrigger><TooltipContent side="right">Agency workspace</TooltipContent></Tooltip>
          ) : (
            <a href="/app" className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-cyan-300/20 hover:bg-cyan-300/[0.05]">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-cyan-400/15 text-cyan-200">A</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">Agency workspace</p><p className="truncate text-[10px] text-slate-500">Admin CRM</p></div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </a>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => { localStorage.removeItem(SIDEBAR_KEY); window.location.href = '/' }} className={cn('text-slate-500 hover:bg-white/[0.05] hover:text-slate-200', collapsed ? 'h-8 w-8 p-0' : 'w-full justify-start px-2 gap-2')}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && 'Sign out'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
