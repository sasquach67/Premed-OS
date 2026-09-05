import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
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
import { isTypingTarget, isModalOpen } from '@/lib/keyboard'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// The dock becomes the full sidebar in place: short, interruptible, and overlay-only.
const SIDEBAR_TRANSFORM = { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const }
const DESKTOP_SIDEBAR_LOCK_KEY = 'premed_os_desktop_sidebar_locked'

function readDesktopSidebarLock() {
  return localStorage.getItem(DESKTOP_SIDEBAR_LOCK_KEY) === 'true'
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopSidebarLocked, setDesktopSidebarLocked] = useState(readDesktopSidebarLock)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => { mainRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' }) }, [location.pathname])
  const navigate = useNavigate()
  useTheme()
  useBackup() // wires daily-on-open check + debounced auto-backup
  const cloud = useCloudSync() // wires Supabase login + cross-device cloud sync (no-op until configured/signed in)
  const desktopSidebarVisible = desktopSidebarLocked
  const keepDesktopSidebarVisibleOnNavigate = useCallback(() => {}, [])
  const toggleDesktopSidebarLock = useCallback(() => {
    setDesktopSidebarLocked((wasLocked) => {
      const nextLocked = !wasLocked
      localStorage.setItem(DESKTOP_SIDEBAR_LOCK_KEY, String(nextLocked))
      return nextLocked
    })
  }, [])
  const requestSignOut = useCallback(() => {
    setSignOutError('')
    setSignOutOpen(true)
  }, [])
  const confirmSignOut = useCallback(async () => {
    setSigningOut(true)
    setSignOutError('')
    try {
      await cloud.signOut()
      setSignOutOpen(false)
      setMobileOpen(false)
      navigate('/landing', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out. Try again.')
    } finally {
      setSigningOut(false)
    }
  }, [cloud, navigate])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented || isTypingTarget(event.target) || isModalOpen()) return
      const commandToggle = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b'
      if (commandToggle) {
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
      <ShellActionsProvider onRequestSignOut={requestSignOut} onToggleSidebar={toggleDesktopSidebarLock}>
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
            onSignOut={requestSignOut}
          />
        </m.aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
          <m.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={MOTION_TRANSITION.micro}>
            <m.div className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
            <m.div className="absolute inset-y-0 left-0" initial={{ x: -16 }} animate={{ x: 0 }} exit={{ x: -16 }} transition={MOTION_TRANSITION.standard}>
              <Sidebar onNavigate={() => setMobileOpen(false)} signedIn={Boolean(cloud.user)} onSignOut={requestSignOut} />
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
          <main ref={mainRef} data-app-scroll-container className="relative flex-1 overflow-y-auto">
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
        <AlertDialog
          open={signOutOpen}
          onOpenChange={(open) => {
            if (!signingOut) setSignOutOpen(open)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-primary/10 text-primary">
                <LogOut className="size-7" />
              </AlertDialogMedia>
              <AlertDialogTitle>Sign out of Premed OS?</AlertDialogTitle>
              <AlertDialogDescription>
                You’ll return to the public home and a separate Guest workspace. This account’s browser cache stays isolated and returns when you sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {signOutError && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {signOutError}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={signingOut}>Stay signed in</AlertDialogCancel>
              <Button onClick={() => void confirmSignOut()} disabled={signingOut}>
                <LogOut className="size-4" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </ShellActionsProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
