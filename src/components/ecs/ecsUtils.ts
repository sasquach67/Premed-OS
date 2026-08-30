import type { AcademicTagColor, Org } from '@/lib/types'

export const ORG_TYPES = ['Club', 'Sport', 'Greek life', 'Volunteer org', 'Professional', 'Cultural', 'Research group', 'Other']
export const ORG_STATUSES: Org['status'][] = ['interested', 'member', 'leader', 'inactive']
export const ORG_COLORS: AcademicTagColor[] = ['blue', 'green', 'purple', 'orange', 'yellow', 'red', 'pink', 'gray', 'brown']

export const ORG_COLOR_CLASSES: Record<AcademicTagColor, string> = {
  gray: 'bg-slate-500/12 text-slate-700 dark:text-slate-200',
  brown: 'bg-stone-500/12 text-stone-700 dark:text-stone-200',
  orange: 'bg-orange-500/12 text-orange-700 dark:text-orange-200',
  coral: 'bg-[#ef8b75]/16 text-[#9b3f33] dark:text-[#ffc4b8]',
  yellow: 'bg-yellow-500/18 text-yellow-800 dark:text-yellow-100',
  lime: 'bg-lime-500/16 text-lime-800 dark:text-lime-100',
  green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
  mint: 'bg-[#6dcfac]/16 text-[#176b54] dark:text-[#b5f4dc]',
  teal: 'bg-teal-500/14 text-teal-700 dark:text-teal-200',
  cyan: 'bg-cyan-500/14 text-cyan-800 dark:text-cyan-100',
  sky: 'bg-[#64c3ec]/16 text-[#17678d] dark:text-[#c2ecff]',
  blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-200',
  navy: 'bg-[#476b9e]/16 text-[#29476e] dark:text-[#c5d7f0]',
  indigo: 'bg-indigo-500/14 text-indigo-700 dark:text-indigo-200',
  purple: 'bg-violet-500/12 text-violet-700 dark:text-violet-200',
  plum: 'bg-[#b06ca9]/16 text-[#71376d] dark:text-[#efc2ea]',
  pink: 'bg-pink-500/12 text-pink-700 dark:text-pink-200',
  red: 'bg-red-500/12 text-red-700 dark:text-red-200',
}

export function statusLabel(status: Org['status']) {
  if (status === 'interested') return 'Watchlist'
  if (status === 'inactive') return 'Past'
  if (status === 'leader') return 'Leadership'
  return 'Member'
}

export function orgInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'OR'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function joinedLabel(joinedAt?: string) {
  if (!joinedAt) return ''
  const [year, month] = joinedAt.split('-').map(Number)
  if (!year || !month) return ''
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export function activeOrg(org: Org) {
  return org.status === 'member' || org.status === 'leader'
}

export function reflectionCount(org: Org) {
  return org.reflections?.filter((reflection) => reflection.title.trim() || reflection.body.trim()).length ?? 0
}
