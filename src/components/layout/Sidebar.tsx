import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, BookOpenText, ChevronsUpDown, Crown, LogOut, PanelLeftClose, PanelLeftOpen, Settings, UserRound } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { NAV_GROUPS } from '@/app/routes'
import { useStore } from '@/store/store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MOTION_DISTANCE, MOTION_TRANSITION } from '@/lib/motion'

const RAIL_COMPENSATION = '11.25rem'

/** MedCoach-style grouped nav. Collapsible on desktop; always full-width inside the mobile drawer. */
export function Sidebar({
  onNavigate, collapsible = false, onSignOut, signedIn = false,
}: { onNavigate?: () => void; collapsible?: boolean; onSignOut?: () => void; signedIn?: boolean }) {
  const profile = useStore((s) => s.profile)
  const touchRoute = useStore((s) => s.touchRoute)
  const collapsed = useStore((s) => s.settings.sidebarCollapsed)
  const update = useStore((s) => s.update)
  const location = useLocation()
  const [hoverPreview, setHoverPreview] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)
  const [patchNotesSeen, setPatchNotesSeen] = useState(() => localStorage.getItem('premed_hq_patch_notes_seen') === 'foundation-l5-shell')

  // expanded view shows labels; collapsed + not-hovered shows icons only
  const expanded = !collapsible || !collapsed || hoverPreview || accountOpen
  const labelsShown = expanded
  const railResting = collapsible && collapsed && !expanded
  const compensatedX = railResting ? RAIL_COMPENSATION : 0

  return (
    <m.nav
      initial={false}
      animate={{ x: railResting ? `-${RAIL_COMPENSATION}` : 0 }}
      transition={MOTION_TRANSITION.standard}
      onMouseEnter={() => { if (collapsible && collapsed) setHoverPreview(true) }}
      onMouseMove={() => { if (collapsible && collapsed && !hoverPreview) setHoverPreview(true) }}
      onMouseLeave={() => setHoverPreview(false)}
      onPointerEnter={() => { if (collapsible && collapsed) setHoverPreview(true) }}
      onPointerMove={() => { if (collapsible && collapsed && !hoverPreview) setHoverPreview(true) }}
      onPointerLeave={() => setHoverPreview(false)}
      onFocus={() => { if (collapsible && collapsed) setHoverPreview(true) }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHoverPreview(false)
      }}
      className={cn(
        'flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground will-change-transform',
        collapsible && 'absolute inset-y-0 left-0 z-30',
        railResting && 'overflow-hidden',
        collapsible && collapsed && expanded && 'z-40 shadow-2xl'
      )}
    >
      {/* brand + collapse toggle (no school subtitle — minimalist) */}
      <div
        className="grid h-[4.25rem] grid-cols-[2.25rem_minmax(0,1fr)_1.75rem] items-center gap-2 overflow-hidden px-3.5"
      >
        <AppMark x={compensatedX} />
        <AnimatePresence initial={false}>
          {expanded && (
            <m.p className="min-w-0 font-display text-lg font-bold" initial={{ opacity: 0, x: -MOTION_DISTANCE.small }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -MOTION_DISTANCE.small }} transition={MOTION_TRANSITION.standard}>Premed OS</m.p>
          )}
        </AnimatePresence>
        {collapsible && expanded && (
          <button
            onClick={() => {
              const nextCollapsed = !collapsed
              setHoverPreview(false)
              update((d) => { d.settings.sidebarCollapsed = nextCollapsed })
            }}
            className={cn(
              'grid size-7 place-items-center rounded-md text-muted-foreground transition-[opacity,background-color,color] duration-150 hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              labelsShown ? 'opacity-100' : 'opacity-70'
            )}
            aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
            title={collapsed ? 'Pin open (⌘B)' : 'Collapse (⌘B)'}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      {/* groups */}
      <div className="flex-1 overflow-hidden px-2.5 pb-3 [@media(max-height:1000px)]:pb-6">
        <div className="flex min-h-full flex-col [@media(max-height:1000px)]:py-2">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-2.5 [@media(max-height:1000px)]:mb-2">
              <div className="h-7 overflow-hidden [@media(max-height:1000px)]:h-6">
                {group === 'Home' ? null : (
                  <AnimatePresence initial={false}>
                    {labelsShown && <m.p className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80 [@media(max-height:1000px)]:text-[10px]" initial={{ opacity: 0, x: -MOTION_DISTANCE.small }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -MOTION_DISTANCE.small }} transition={MOTION_TRANSITION.standard}>{group}</m.p>}
                  </AnimatePresence>
                )}
                {!expanded && group !== 'Home' && (
                  <m.div initial={false} animate={{ x: compensatedX }} transition={MOTION_TRANSITION.standard} className="mx-auto my-3 h-px w-6 bg-sidebar-border" />
                )}
              </div>
              <ul className="space-y-1 [@media(max-height:1000px)]:space-y-0.5">
                {items.map((r) => {
                  const to = r.id === 'home' ? '/' : `/${r.id}`
                  const isActive = r.id === 'home' ? location.pathname === '/' : location.pathname === to
                  const link = (
                    <Link
                      to={to}
                      aria-label={r.label}
                      onClick={() => { touchRoute(r.id); onNavigate?.() }}
                      className={cn(
                        'group relative grid h-12 grid-cols-[3rem_minmax(0,1fr)] items-center overflow-hidden rounded-lg border border-transparent text-base font-semibold transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring [@media(max-height:1000px)]:h-10 [@media(max-height:1000px)]:grid-cols-[2.5rem_minmax(0,1fr)] [@media(max-height:1000px)]:text-sm',
                        expanded ? 'px-1.5' : 'mx-auto w-12 px-0 [@media(max-height:1000px)]:w-10',
                        r.id === 'home' && expanded && 'border-sidebar-border bg-card shadow-sm',
                        expanded
                          ? isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]'
                            : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60'
                          : isActive
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground hover:text-sidebar-primary'
                      )}
                    >
                      <span className="grid size-12 place-items-center [@media(max-height:1000px)]:size-10">
                        <r.icon className={cn('size-5 shrink-0 transition-colors duration-200 [@media(max-height:1000px)]:size-[18px]', isActive ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-sidebar-primary')} />
                      </span>
                      <AnimatePresence initial={false}>
                        {labelsShown && <m.span className="min-w-0 truncate" initial={{ opacity: 0, x: -MOTION_DISTANCE.small }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -MOTION_DISTANCE.small }} transition={MOTION_TRANSITION.standard}>{r.label}</m.span>}
                      </AnimatePresence>
                    </Link>
                  )
                  return (
                    <m.li
                      key={r.id}
                      initial={false}
                      animate={{ x: compensatedX }}
                      transition={MOTION_TRANSITION.standard}
                      className={railResting ? 'w-[4.75rem]' : 'w-full'}
                    >
                      {collapsible && collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{r.label}</TooltipContent>
                        </Tooltip>
                      ) : link}
                    </m.li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <m.div className={cn('border-t border-sidebar-border px-3 py-2.5', railResting ? 'w-[4.75rem]' : 'w-full')} initial={false} animate={{ x: compensatedX }} transition={MOTION_TRANSITION.standard}>
        <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'grid w-full items-center overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-2 text-left shadow-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                accountOpen && 'bg-sidebar-accent',
                expanded ? 'grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] gap-2' : 'grid-cols-[2.25rem] justify-center'
              )}
              aria-label="Open account menu"
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{profile.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              {expanded && <div className="min-w-0 leading-tight"><p className="truncate text-sm font-bold">{profile.name}</p><p className="truncate text-[11px] text-muted-foreground">{profile.email || 'Local profile'}</p></div>}
              {expanded && <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-64">
            <DropdownMenuItem asChild><Link to="/profile" onClick={onNavigate}><UserRound className="size-4" /> Profile & CV</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings" onClick={onNavigate}><Settings className="size-4" /> Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/upgrade" onClick={onNavigate}><Crown className="size-4" /> Upgrade plan</Link></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setPatchNotesOpen(true); setPatchNotesSeen(true); localStorage.setItem('premed_hq_patch_notes_seen', 'foundation-l5-shell') }}>
              <BookOpenText className="size-4" /> Patch Notes {!patchNotesSeen && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">New</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event('premed:attention'))}><Bell className="size-4" /> Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!signedIn} onSelect={onSignOut}><LogOut className="size-4" /> {signedIn ? 'Sign out' : 'Signed out'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </m.div>
      <Dialog open={patchNotesOpen} onOpenChange={setPatchNotesOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>What’s new in Premed OS</DialogTitle><DialogDescription>Foundation update · version 0.0.0</DialogDescription></DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>A safer workspace.</strong> Undo, Trash, autosave states, and guarded record opening now work together.</p>
            <p><strong>Lists that fit your work.</strong> Comfortable and compact density, saved views, bulk actions, and two-pane focus.</p>
            <p><strong>A connected shell.</strong> Quick Add, command actions, Attention, Atlas reservation, and the finalized navigation.</p>
          </div>
        </DialogContent>
      </Dialog>
    </m.nav>
  )
}

function AppMark({ x = 0 }: { x?: number | string }) {
  return (
    <m.div initial={false} animate={{ x }} transition={MOTION_TRANSITION.standard} className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="size-7">
        <rect x="8" y="9" width="20" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M13 15h10M13 20h10" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        <path d="M18 7v7M14.5 10.5h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M10 26c3.2 2.2 12.8 2.2 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      </svg>
    </m.div>
  )
}
