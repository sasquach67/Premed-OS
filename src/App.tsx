import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

/* Route-level code splitting: each page loads on demand, so the initial
   bundle stays small (recharts, dnd-kit, etc. arrive with the page that
   needs them). Pages use named exports, hence the .then() shims. */
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const OverviewTasksPage = lazy(() => import('@/pages/OverviewTasksPage').then((m) => ({ default: m.OverviewTasksPage })))
const Academics = lazy(() => import('@/pages/Academics').then((m) => ({ default: m.Academics })))
const AcademicRecallSession = lazy(() => import('@/pages/AcademicRecallSession').then((m) => ({ default: m.AcademicRecallSession })))
const Mcat = lazy(() => import('@/pages/Mcat').then((m) => ({ default: m.Mcat })))
const McatFocusSession = lazy(() => import('@/pages/McatFocusSession').then((m) => ({ default: m.McatFocusSession })))
const Letters = lazy(() => import('@/pages/Letters').then((m) => ({ default: m.Letters })))
const ExperiencePillar = lazy(() => import('@/pages/ExperiencePillar').then((m) => ({ default: m.ExperiencePillar })))
const Extracurriculars = lazy(() => import('@/pages/Extracurriculars').then((m) => ({ default: m.Extracurriculars })))
const Essays = lazy(() => import('@/pages/Essays').then((m) => ({ default: m.Essays })))
const Schools = lazy(() => import('@/pages/Schools').then((m) => ({ default: m.Schools })))
const Timeline = lazy(() => import('@/pages/Timeline').then((m) => ({ default: m.Timeline })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Help = lazy(() => import('@/pages/Help').then((m) => ({ default: m.Help })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Atlas = lazy(() => import('@/pages/Atlas').then((m) => ({ default: m.Atlas })))
const Upgrade = lazy(() => import('@/pages/Upgrade').then((m) => ({ default: m.Upgrade })))

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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="mcat/session" element={<McatFocusSession />} />
          <Route path="academics/review/:courseId" element={<AcademicRecallSession />} />
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="northstar" element={<Navigate to="/?guide=open" replace />} />
            <Route path="overview/tasks" element={<OverviewTasksPage />} />
            <Route path="academics" element={<Academics />} />
            <Route path="academics/classes/:courseId" element={<Academics />} />
            <Route path="mcat" element={<Mcat />} />
            <Route path="letters" element={<Letters />} />
            <Route path="clinical" element={<ExperiencePillar key="clinical" category="clinical" />} />
            <Route path="volunteering" element={<ExperiencePillar key="volunteering" category="volunteering" />} />
            <Route path="shadowing" element={<ExperiencePillar key="shadowing" category="shadowing" />} />
            <Route path="research" element={<ExperiencePillar key="research" category="research" />} />
            <Route path="ecs" element={<Extracurriculars />} />
            <Route path="ecs/org/:orgId" element={<Extracurriculars />} />
            <Route path="essays" element={<Essays />} />
            <Route path="schools" element={<Schools />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="archive" element={<Navigate to="/settings?tab=archive" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<Help />} />
            <Route path="settings" element={<Settings />} />
            <Route path="atlas/*" element={<Atlas />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
