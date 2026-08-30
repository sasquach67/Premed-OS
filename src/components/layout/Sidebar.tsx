import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, BookOpenText, Crown, LogOut, PanelLeftClose, PanelLeftOpen, Settings, UserRound } from 'lucide-react'
import { NAV_GROUPS, type RouteDef } from '@/app/routes'
import { useStore } from '@/store/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type SidebarProps = {
  onNavigate?: () => void
  collapsible?: boolean
  onSignOut?: () => void
  signedIn?: boolean
  desktopLocked?: boolean
  desktopExpanded?: boolean
  onToggleDesktopLock?: () => void
}

const brandAsset = (file: string) => `${import.meta.env.BASE_URL}art/brand/${file}`
/** Desktop is a fixed, compact icon-and-label sidebar. It does not peek or resize on hover. */
export function Sidebar(props: SidebarProps) {
  return props.collapsible ? <DesktopSidebar {...props} /> : <MobileSidebar {...props} />
}

function DesktopSidebar({ onNavigate, onSignOut, signedIn = false, desktopLocked = false, desktopExpanded = false, onToggleDesktopLock }: SidebarProps) {
  const profile = useStore((s) => s.profile)
  const touchRoute = useStore((s) => s.touchRoute)
  const location = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)
  const [patchNotesSeen, setPatchNotesSeen] = useState(() => localStorage.getItem('premed_hq_patch_notes_seen') === 'foundation-l5-shell')

  return (
    <nav
      aria-label="Premed OS primary navigation"
      className="sidebar-static-nav"
      data-expanded={desktopExpanded}
    >
      <header className="sidebar-static-header">
        <button type="button" className="sidebar-static-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" onClick={onToggleDesktopLock} aria-label={desktopLocked ? 'Unlock sidebar' : 'Lock sidebar open'}>
          <img src={brandAsset('premedos-mark.svg')} alt="" className="h-7 w-8 object-contain" />
        </button>
        <div className="sidebar-static-brand-copy">
          <span className="sidebar-static-wordmark"><span>premed</span><b>OS</b></span>
        </div>
        {onToggleDesktopLock && <button type="button" className="sidebar-static-toggle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" onClick={onToggleDesktopLock} aria-label={desktopLocked ? 'Unlock sidebar' : 'Lock sidebar open'} title={desktopLocked ? 'Unlock sidebar (⌘B)' : 'Lock sidebar open (⌘B)'}>{desktopLocked ? <PanelLeftClose className="size-[1.15rem]" /> : <PanelLeftOpen className="size-[1.15rem]" />}</button>}
      </header>
      <div className="sidebar-static-menu">
        {NAV_GROUPS.map(({ group, items }) => (
          <section key={group} className="sidebar-static-group">
            {group !== 'Home' && <h2 className="sidebar-static-heading">{group}</h2>}
            <ul>{items.map((route) => <DesktopNavItem key={route.id} route={route} locationPath={location.pathname} onNavigate={onNavigate} onRoute={touchRoute} />)}</ul>
          </section>
        ))}
      </div>
      <footer className="sidebar-static-account">
        <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="sidebar-static-account-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" aria-label="Open account menu">
              <Avatar className="size-10 shrink-0 border-[3px] border-card shadow-sm"><AvatarFallback className="bg-primary text-xs font-extrabold text-primary-foreground">{profile.name.slice(0, 1)}</AvatarFallback></Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-64">
            <DropdownMenuItem asChild><Link to="/profile" onClick={onNavigate}><UserRound className="size-4" /> Profile & CV</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings" onClick={onNavigate}><Settings className="size-4" /> Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/upgrade" onClick={onNavigate}><Crown className="size-4" /> Upgrade plan</Link></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setPatchNotesOpen(true); setPatchNotesSeen(true); localStorage.setItem('premed_hq_patch_notes_seen', 'foundation-l5-shell') }}><BookOpenText className="size-4" /> Patch Notes {!patchNotesSeen && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">New</span>}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event('premed:attention'))}><Bell className="size-4" /> Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!signedIn} onSelect={onSignOut}><LogOut className="size-4" /> {signedIn ? 'Sign out' : 'Signed out'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="sidebar-static-account-copy"><p>{profile.name}</p><span>{profile.email || 'Local profile'}</span></div>
      </footer>
      <PatchNotesDialog open={patchNotesOpen} onOpenChange={setPatchNotesOpen} />
    </nav>
  )
}

function DesktopNavItem({ route, locationPath, onNavigate, onRoute }: { route: RouteDef; locationPath: string; onNavigate?: () => void; onRoute: (route: string) => void }) {
  const to = route.id === 'home' ? '/' : `/${route.id}`
  const active = route.id === 'home' ? locationPath === '/' : locationPath === to || locationPath.startsWith(`${to}/`)
  return <li><Link to={to} aria-current={active ? 'page' : undefined} onClick={() => { onRoute(route.id); onNavigate?.() }} className={cn('sidebar-static-row group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring', active && 'sidebar-static-row-active')}><span className="sidebar-static-icon"><route.icon className={cn('size-5', active ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-sidebar-primary')} /></span><span className="sidebar-static-label">{route.label}</span></Link></li>
}

function MobileSidebar({ onNavigate, signedIn = false }: SidebarProps) {
  const profile = useStore((s) => s.profile)
  const touchRoute = useStore((s) => s.touchRoute)
  const location = useLocation()
  return (
    <nav aria-label="Primary navigation" className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar font-display text-sidebar-foreground">
      <div className="grid h-[5.5rem] shrink-0 place-items-center border-b border-sidebar-border/60"><img src={brandAsset('premedos-stack.png')} alt="Premed OS" className="h-16 w-auto object-contain" /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map(({ group, items }) => <div key={group} className="mb-4"><p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{group}</p>{items.map((route) => <MobileItem key={route.id} route={route} locationPath={location.pathname} onNavigate={onNavigate} onRoute={touchRoute} />)}</div>)}
      </div>
      <div className="border-t border-sidebar-border p-3"><button type="button" className="flex w-full items-center gap-2 rounded-xl bg-sidebar-accent/45 p-2 text-left" onClick={onNavigate}><Avatar><AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{profile.name.slice(0, 1)}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate font-display text-sm font-bold">{profile.name}</span><span className="block truncate text-[11px] text-muted-foreground">{signedIn ? profile.email : 'Local profile'}</span></span></button></div>
    </nav>
  )
}

function MobileItem({ route, locationPath, onNavigate, onRoute }: { route: RouteDef; locationPath: string; onNavigate?: () => void; onRoute: (route: string) => void }) {
  const to = route.id === 'home' ? '/' : `/${route.id}`
  const active = route.id === 'home' ? locationPath === '/' : locationPath === to || locationPath.startsWith(`${to}/`)
  return <Link to={to} onClick={() => { onRoute(route.id); onNavigate?.() }} className={cn('flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold', active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/85')}><route.icon className="size-5 text-sidebar-primary" />{route.label}</Link>
}

function PatchNotesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>What’s new in Premed OS</DialogTitle><DialogDescription>Foundation update · version 0.0.0</DialogDescription></DialogHeader><div className="space-y-3 text-sm"><p><strong>A safer workspace.</strong> Undo, Trash, autosave states, and guarded record opening now work together.</p><p><strong>Lists that fit your work.</strong> Comfortable and compact density, saved views, bulk actions, and two-pane focus.</p><p><strong>A connected shell.</strong> Quick Add, command actions, Attention, Atlas reservation, and the finalized navigation.</p></div></DialogContent></Dialog>
}
