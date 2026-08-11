import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '@/store/useTheme'
import { useBackup } from '@/store/useBackup'
import { useCloudSync } from '@/store/useCloudSync'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/common/ToastProvider'
import { ShellActionsProvider } from './ShellActionsProvider'
import { QuickAddDialog } from './QuickAddDialog'
import { HelpFeedbackLauncher } from './HelpFeedbackLauncher'
import { MOTION_TRANSITION } from '@/lib/motion'
import { crossfade } from '@/lib/motion'

// The dock becomes the full sidebar in place: short, interruptible, and overlay-only.
const SIDEBAR_TRANSFORM = { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const }

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopSidebarLocked, setDesktopSidebarLocked] = useState(false)
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  useTheme()
  useBackup() // wires daily-on-open check + debounced auto-backup
  const cloud = useCloudSync() // wires Supabase login + cross-device cloud sync (no-op until configured/signed in)
  const desktopSidebarVisible = desktopSidebarLocked
  const keepDesktopSidebarVisibleOnNavigate = useCallback(() => {}, [])
  const toggleDesktopSidebarLock = useCallback(() => {
    if (desktopSidebarLocked) {
      setDesktopSidebarLocked(false)
      return
    }
    setDesktopSidebarLocked(true)
  }, [desktopSidebarLocked])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleDesktopSidebarLock()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleDesktopSidebarLock])

  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
      <ShellActionsProvider>
      <div className="flex h-svh overflow-hidden">
        <m.aside
          className="fixed inset-y-0 left-0 z-40 hidden w-[15.625rem] lg:block"
          initial={false}
          animate={desktopSidebarVisible ? { width: '15.625rem' } : { width: '4.25rem' }}
          transition={reduceMotion ? { duration: 0 } : SIDEBAR_TRANSFORM}
          style={{ willChange: 'width', overflow: 'visible' }}
        >
          <Sidebar
            collapsible
            desktopExpanded={desktopSidebarVisible}
            signedIn={Boolean(cloud.user)}
            desktopLocked={desktopSidebarLocked}
            onNavigate={keepDesktopSidebarVisibleOnNavigate}
            onToggleDesktopLock={toggleDesktopSidebarLock}
            onSignOut={() => { void cloud.signOut() }}
          />
        </m.aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
          <m.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={MOTION_TRANSITION.micro}>
            <m.div className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
            <m.div className="absolute inset-y-0 left-0" initial={{ x: -16 }} animate={{ x: 0 }} exit={{ x: -16 }} transition={MOTION_TRANSITION.standard}>
              <Sidebar onNavigate={() => setMobileOpen(false)} signedIn={Boolean(cloud.user)} onSignOut={() => { void cloud.signOut() }} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </m.div>
          </m.div>
          )}
        </AnimatePresence>

        {/* main column */}
        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${desktopSidebarLocked ? 'lg:pl-[15.625rem]' : 'lg:pl-[4.25rem]'}`}>
          <Topbar onMenu={() => setMobileOpen(true)} onShowDesktopSidebar={toggleDesktopSidebarLock} desktopSidebarHidden={!desktopSidebarVisible} />
          <main className="relative flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[84rem] px-4 py-6 md:px-8 md:py-8">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={location.pathname}
                  variants={crossfade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Outlet />
                </m.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
        <QuickAddDialog />
        <HelpFeedbackLauncher />
      </div>
      </ShellActionsProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
