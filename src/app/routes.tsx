/* ============================================================
   routes.tsx — the navigation registry.
   Grouped MedCoach-style. Icons are chosen to MATCH their labels
   (a fix for the old prototype's mismatched glyphs). Each route
   also declares where the ram mascot sits on that page.
   ============================================================ */
import type { LucideIcon } from 'lucide-react'
import {
  Home, Compass, GraduationCap, Brain, Mail, Stethoscope, HeartHandshake,
  Eye, Microscope, Trophy, BookOpenText, School, CalendarDays, IdCard,
  LifeBuoy, ListChecks, Settings, Archive, Orbit,
} from 'lucide-react'

export interface RouteDef {
  id: string
  label: string
  group: string
  icon: LucideIcon
  /** short tagline shown under the page title */
  tagline: string
  nav?: boolean
}

export const ROUTES: RouteDef[] = [
  { id: 'home', label: 'Overview', group: 'Home', icon: Home, tagline: '' },
  { id: 'northstar', label: 'Ultimate Guide', group: 'Home', icon: Compass, tagline: 'The big-picture roadmap to med school.', nav: false },
  { id: 'academics', label: 'Academics', group: 'Foundation', icon: GraduationCap, tagline: 'AMCAS GPA engine + course planning.' },
  { id: 'mcat', label: 'MCAT', group: 'Foundation', icon: Brain, tagline: 'Resources, schedule, score tracker, error log.' },
  { id: 'clinical', label: 'Clinical', group: 'Experiences', icon: Stethoscope, tagline: 'Patient-contact hours toward your goal.' },
  { id: 'volunteering', label: 'Volunteering', group: 'Experiences', icon: HeartHandshake, tagline: 'Service hours, especially with the underserved.' },
  { id: 'shadowing', label: 'Shadowing', group: 'Experiences', icon: Eye, tagline: 'Documented hours observing physicians.' },
  { id: 'research', label: 'Research', group: 'Experiences', icon: Microscope, tagline: 'Labs, posters, papers — with your Drive embedded.' },
  { id: 'ecs', label: 'Extracurriculars', group: 'Experiences', icon: Trophy, tagline: 'Leadership, clubs & orgs — depth over scatter.' },
  { id: 'schools', label: 'School List', group: 'Application', icon: School, tagline: 'Build a realistic list against your stats + mission.' },
  { id: 'essays', label: 'Essays & Story Bank', group: 'Application', icon: BookOpenText, tagline: 'Reflections, personal statement, secondaries.' },
  { id: 'letters', label: 'Letters of Rec', group: 'Application', icon: Mail, tagline: 'Who, when asked, and where each letter stands.' },
  { id: 'timeline', label: 'Timeline', group: 'Application', icon: CalendarDays, tagline: 'The roadmap for your whole premed journey.' },
  // Tasks are Overview's (03-overview §0), so the expanded list is a sub-route
  // of Overview rather than a sidebar entry — the URL states the ownership.
  // Precedent: /academics/classes/:courseId.
  { id: 'overview/tasks', label: 'Tasks', group: 'Home', icon: ListChecks, tagline: 'Everything on your plate.', nav: false },
  { id: 'atlas', label: 'Atlas', group: 'Atlas', icon: Orbit, tagline: 'Your connected admissions knowledge space.' },
  { id: 'archive', label: 'Archive', group: 'Application', icon: Archive, tagline: 'Finished tasks & focus targets — restorable.', nav: false },
  { id: 'profile', label: 'Profile / CV', group: 'Account', icon: IdCard, tagline: 'Auto-CV from your logged roles + editable resume.', nav: false },
  { id: 'help', label: 'Help', group: 'Account', icon: LifeBuoy, tagline: 'Communities, the Discord, and how this app works.', nav: false },
  { id: 'settings', label: 'Settings', group: 'Account', icon: Settings, tagline: 'Data safety, backups, theme, and reset.', nav: false },
]

export const ROUTE_MAP: Record<string, RouteDef> = Object.fromEntries(ROUTES.map((r) => [r.id, r]))

/** Sidebar groups in display order. */
export const NAV_GROUPS: { group: string; items: RouteDef[] }[] = (() => {
  const order = ['Home', 'Foundation', 'Experiences', 'Application', 'Atlas']
  return order
    .map((group) => ({ group, items: ROUTES.filter((r) => r.group === group && r.nav !== false) }))
    .filter((g) => g.items.length > 0)
})()
