import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RootRoute, LandingRoute } from '@/components/public/RootRoute'
import { MergeGate } from '@/components/public/MergeGate'

/* Route-level code splitting: each page loads on demand, so the initial
   bundle stays small (recharts, dnd-kit, etc. arrive with the page that
   needs them). Pages use named exports, hence the .then() shims. */
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const OverviewTasksPage = lazy(() => import('@/pages/OverviewTasksPage').then((m) => ({ default: m.OverviewTasksPage })))
const OverviewQuarterlyGoalsPage = lazy(() => import('@/pages/OverviewQuarterlyGoalsPage').then((m) => ({ default: m.OverviewQuarterlyGoalsPage })))
const ReviewItemPage = lazy(() => import('@/pages/ReviewItemPage').then((m) => ({ default: m.ReviewItemPage })))
const Academics = lazy(() => import('@/pages/Academics').then((m) => ({ default: m.Academics })))
const McatFocusSession = lazy(() => import('@/pages/McatFocusSession').then((m) => ({ default: m.McatFocusSession })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Help = lazy(() => import('@/pages/Help').then((m) => ({ default: m.Help })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Atlas = lazy(() => import('@/pages/Atlas').then((m) => ({ default: m.Atlas })))
const Upgrade = lazy(() => import('@/pages/Upgrade').then((m) => ({ default: m.Upgrade })))
const FounderConsole = lazy(() => import('@/pages/FounderConsole').then((m) => ({ default: m.FounderConsole })))
const ReservedSpace = lazy(() => import('@/pages/ReservedSpace').then((m) => ({ default: m.ReservedSpace })))
const FounderConsolePrototype = lazy(() => import('@/pages/prototypes/FounderConsolePrototype').then((m) => ({ default: m.FounderConsolePrototype })))

/* The public layer. Seven routes outside the app shell — they have their
   own nav, their own footer, and their own scoped stylesheet. `/` itself
   is decided by RootRoute: a first-time visitor gets the landing page,
   everyone else gets their dashboard (05 §0.1 — a front door, not a gate). */
const AuthPage = lazy(() => import('@/pages/public/AuthPage').then((m) => ({ default: m.AuthPage })))
const FirstLoginSetupPage = lazy(() => import('@/pages/public/FirstLoginSetupPage').then((m) => ({ default: m.FirstLoginSetupPage })))
const MergePage = lazy(() => import('@/pages/public/MergePage').then((m) => ({ default: m.MergePage })))
const AboutPage = lazy(() => import('@/pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/public/TermsPage').then((m) => ({ default: m.TermsPage })))
const PricingPage = lazy(() => import('@/pages/public/PricingPage').then((m) => ({ default: m.PricingPage })))

/** Quiet, theme-neutral loading state shown between page chunks. */
function PageFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" aria-label="Loading" />
    </div>
  )
}

// HashRouter keeps deep links working on any static host (no server rewrites).
function App() {
  return (
    <HashRouter>
      <MergeGate />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="mcat/session" element={<McatFocusSession />} />

          {/* Public layer — outside the shell, own nav and footer. */}
          {/* `/landing` always renders the landing page, for anyone who
              wants to re-read it and for testing the front door without
              clearing storage. `/` stays the smart route. */}
          <Route path="landing" element={<LandingRoute />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="auth/setup" element={<FirstLoginSetupPage />} />
          <Route path="auth/merge" element={<MergePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="pricing" element={<PricingPage />} />
          {import.meta.env.DEV ? <Route path="prototype/founder-console" element={<FounderConsolePrototype />} /> : null}

          {/* `/` — landing page for a first-time visitor, dashboard for
              everyone else. RootRoute renders AppShell in the second case,
              so Home still mounts inside the shell exactly as before. */}
          <Route path="/" element={<RootRoute />}>
            <Route index element={<Home />} />
          </Route>

          <Route element={<AppShell />}>
            <Route path="northstar" element={<Navigate to="/?guide=open" replace />} />
            <Route path="overview/tasks" element={<OverviewTasksPage />} />
            <Route path="overview/goals/:goalId" element={<OverviewQuarterlyGoalsPage />} />
            <Route path="review" element={<ReviewItemPage />} />
            <Route path="academics" element={<Academics />} />
            <Route path="academics/classes/:courseId" element={<Academics />} />
            <Route path="mcat" element={<ReservedSpace routeId="mcat" />} />
            <Route path="letters" element={<ReservedSpace routeId="letters" />} />
            <Route path="clinical" element={<ReservedSpace routeId="clinical" />} />
            <Route path="volunteering" element={<ReservedSpace routeId="volunteering" />} />
            <Route path="shadowing" element={<ReservedSpace routeId="shadowing" />} />
            <Route path="research" element={<ReservedSpace routeId="research" />} />
            <Route path="ecs" element={<ReservedSpace routeId="ecs" />} />
            <Route path="ecs/org/:orgId" element={<ReservedSpace routeId="ecs" />} />
            <Route path="essays" element={<ReservedSpace routeId="essays" />} />
            <Route path="schools" element={<ReservedSpace routeId="schools" />} />
            <Route path="timeline" element={<ReservedSpace routeId="timeline" />} />
            <Route path="archive" element={<Navigate to="/settings?tab=archive" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<Help />} />
            <Route path="settings" element={<Settings />} />
            <Route path="atlas/*" element={<Atlas />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="founder" element={<FounderConsole />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
