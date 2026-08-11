import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, PanelLeftOpen, Plus } from 'lucide-react'
import { CommandSearch } from './CommandSearch'
import { AttentionBell } from './AttentionBell'
import { buildAttention, attentionStatus } from './attention'
import { useShellActions } from './shellActions'
import { useTheme } from '@/store/useTheme'
import { useBackup } from '@/store/useBackup'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/motion'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'
import { isDemoMode } from '@/lib/demoMode'

type TopbarProps = {
  onMenu: () => void
  onShowDesktopSidebar?: () => void
  desktopSidebarHidden?: boolean
}

export function Topbar({ onMenu, onShowDesktopSidebar, desktopSidebarHidden = false }: TopbarProps) {
  const location = useLocation()
  const data = useStore()
  const { isDark, setTheme } = useTheme()
  const backup = useBackup()
  const { openQuickAdd } = useShellActions()
  const activeRoute = useMemo(() => {
    const first = location.pathname.split('/').filter(Boolean)[0] || 'home'
    return ROUTE_MAP[first] ?? ROUTE_MAP.home
  }, [location.pathname])
  const deepLabel = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length < 2 || parts[0] === 'atlas') return ''
    if (parts[0] === 'ecs' && parts[1] === 'org') return data.orgs.find((org) => org.id === parts[2])?.name ?? 'Organization'
    if (parts[0] === 'academics' && parts[1] === 'classes') return data.courses.find((course) => course.id === parts[2])?.code ?? 'Class'
    return parts.at(-1)?.replace(/-/g, ' ') ?? ''
  }, [location.pathname, data.orgs, data.courses])
  const status = useMemo(() => attentionStatus(buildAttention(data), backup.enabled), [data, backup.enabled])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'q') {
        event.preventDefault()
        openQuickAdd()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openQuickAdd])

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/75 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[84rem] min-w-0 items-center gap-2 px-4 py-2.5 md:px-8">
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></Button>
        {desktopSidebarHidden && onShowDesktopSidebar && <Button variant="ghost" size="icon" className="hidden shrink-0 lg:inline-flex" onPointerDown={(event) => { event.preventDefault(); onShowDesktopSidebar() }} aria-label="Show sidebar"><PanelLeftOpen className="size-5" /></Button>}
        <Breadcrumb className="hidden min-w-0 xl:block">
          <BreadcrumbList className="h-9 flex-nowrap gap-1 text-xs font-bold sm:gap-1">
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbLink asChild>
                <Link to={activeRoute.id === 'home' ? '/' : `/${activeRoute.id}`} className="max-w-32 truncate">{activeRoute.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {deepLabel && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="max-w-32 truncate capitalize font-bold">{deepLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <CommandSearch />
        <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {isDemoMode() && <span className="inline-flex h-8 shrink-0 items-center rounded-full border border-primary/30 bg-primary/12 px-2.5 text-xs font-extrabold text-primary shadow-sm">Demo data</span>}
          <LiveStatusChip label={status.label} tone={status.tone} />
          <Button variant="default" size="sm" className="h-8 rounded-full px-2.5 sm:px-3" onClick={() => openQuickAdd()} aria-label="Quick Add"><Plus className="size-4" /><span className="hidden sm:inline">Add</span></Button>
          <AttentionBell />
          <ThemeToggleButton isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} />
        </div>
      </div>
    </header>
  )
}

function LiveStatusChip({ label, tone }: { label: string; tone: 'alert' | 'due' | 'system' | 'clear' }) {
  return (
    <Link to={tone === 'system' || tone === 'clear' ? '/settings' : '/overview/tasks'} className={cn(
      'hidden h-8 max-w-[10rem] items-center gap-1.5 truncate rounded-full border px-3 text-xs font-extrabold shadow-sm transition hover:bg-muted sm:inline-flex',
      tone === 'alert' && 'border-destructive/35 bg-destructive/10 text-destructive',
      tone === 'due' && 'border-primary/30 bg-primary/10 text-primary',
      tone === 'system' && 'border-warning/35 bg-warning/10 text-warning',
      tone === 'clear' && 'border-primary/20 bg-card text-primary'
    )}>
      <span className="size-1.5 rounded-full bg-current" /><span className="truncate">{label}</span>
    </Link>
  )
}
