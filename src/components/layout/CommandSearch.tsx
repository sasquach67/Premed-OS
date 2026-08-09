import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Search, Zap } from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTES, ROUTE_MAP } from '@/app/routes'
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { useShellActions } from './shellActions'
import { useTheme } from '@/store/useTheme'
import type { QuickAddKind } from './shellActions'
import { rankCommandHits, type CommandHit } from './commandSearchCore'

const RECENT_KEY = 'premed_hq_command_recents'

function readRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

export function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentIds, setRecentIds] = useState(readRecents)
  const navigate = useNavigate()
  const store = useStore()
  const { openQuickAdd } = useShellActions()
  const { isDark, setTheme } = useTheme()

  const actions = useMemo<CommandHit[]>(() => {
    const quick = (kind: QuickAddKind) => () => window.setTimeout(() => openQuickAdd(kind), 0)
    return [
      { id: 'action-task', label: 'New task', verbs: 'add create log', sub: 'Create without leaving this page', group: 'Actions', kind: 'action', action: quick('task') },
      { id: 'action-course', label: 'New course', verbs: 'add create', sub: 'Add to Academics', group: 'Actions', kind: 'action', action: quick('course') },
      { id: 'action-hours', label: 'Log hours', verbs: 'add new create', sub: 'Add an experience hour log', group: 'Actions', kind: 'action', action: quick('hours') },
      { id: 'action-experience', label: 'New experience', verbs: 'add create log', sub: 'Create a linked experience', group: 'Actions', kind: 'action', action: quick('experience') },
      { id: 'action-school', label: 'New school', verbs: 'add create', sub: 'Add to School List', group: 'Actions', kind: 'action', action: quick('school') },
      { id: 'action-story', label: 'New story', verbs: 'add create', sub: 'Add to Story Bank', group: 'Actions', kind: 'action', action: quick('story') },
      { id: 'action-overdue', label: 'Find overdue work', verbs: 'show open', sub: 'Open Timeline & Tasks', group: 'Actions', kind: 'action', action: () => navigate('/timeline?filter=overdue') },
      { id: 'action-incomplete', label: 'Find incomplete records', verbs: 'show open', sub: 'Open the data-health Attention feed', group: 'Actions', kind: 'action', action: () => window.dispatchEvent(new Event('premed:attention')) },
      { id: 'action-theme', label: 'Toggle appearance', verbs: 'switch change', sub: `Use ${isDark ? 'light' : 'dark'} mode`, group: 'Actions', kind: 'action', action: () => setTheme(isDark ? 'light' : 'dark') },
      { id: 'action-sidebar', label: 'Toggle sidebar', verbs: 'show hide collapse expand', sub: 'Change sidebar dock', group: 'Actions', kind: 'action', action: () => store.update((draft) => { draft.settings.sidebarCollapsed = !draft.settings.sidebarCollapsed }) },
    ]
  }, [openQuickAdd, navigate, isDark, setTheme, store])

  const index = useMemo<CommandHit[]>(() => {
    const hits: CommandHit[] = [...actions]
    for (const route of ROUTES.filter((item) => item.nav !== false)) hits.push({ id: `page-${route.id}`, label: route.label, sub: route.group, group: 'Navigate', kind: 'page', route: route.id === 'home' ? '/' : `/${route.id}` })
    hits.push({ id: 'page-guide', label: 'Premed Ultimate Guide', sub: 'Overview', group: 'Navigate', kind: 'page', route: '/?guide=open' })
    for (const row of store.orgs) hits.push({ id: `org-${row.id}`, label: row.name, sub: row.role || row.type, group: 'Records', kind: 'record', route: `/ecs/org/${row.id}` })
    const courseById = new Map(store.courses.map((course) => [course.id, course]))
    for (const workspace of store.academics.classCenter.workspaces) {
      const course = courseById.get(workspace.courseId)
      if (course) hits.push({ id: `class-${course.id}`, label: `${course.code} ${course.title}`, sub: course.term, group: 'Records', kind: 'record', route: `/academics/classes/${course.id}` })
    }
    // Milestones are roadmap nodes stored in `tasks`, not task records.
    for (const row of store.tasks.filter((task) => !task.milestone)) hits.push({ id: `task-${row.id}`, label: row.title, sub: row.type, group: 'Records', kind: 'record', route: '/timeline' })
    for (const row of store.experiences) hits.push({ id: `experience-${row.id}`, label: row.org || row.role, sub: row.category, group: 'Records', kind: 'record', route: `/${row.category === 'leadership' ? 'ecs' : row.category}` })
    for (const row of store.schools) hits.push({ id: `school-${row.id}`, label: row.name, sub: row.location || row.type, group: 'Records', kind: 'record', route: '/schools' })
    for (const row of store.stories) hits.push({ id: `story-${row.id}`, label: row.title || row.prompt, sub: 'Story Bank', group: 'Records', kind: 'record', route: '/essays' })
    for (const row of store.resources) hits.push({ id: `resource-${row.id}`, label: row.label, sub: `${ROUTE_MAP[row.pillar]?.label ?? row.pillar} · ${row.category}`, group: 'External links', kind: 'external', url: row.url })
    return hits
  }, [actions, store.orgs, store.courses, store.academics.classCenter.workspaces, store.tasks, store.experiences, store.schools, store.stories, store.resources])

  const results = useMemo(() => {
    if (!query.trim()) {
      const recent = recentIds.map((id) => index.find((hit) => hit.id === id)).filter((hit): hit is CommandHit => Boolean(hit))
      return [...recent, ...actions, ...index.filter((hit) => hit.kind === 'page')].filter((hit, index, list) => list.findIndex((candidate) => candidate.id === hit.id) === index).slice(0, 28)
    }
    return rankCommandHits(index, query, recentIds)
  }, [query, index, actions, recentIds])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value) }
      else if (event.key === '/' && !typing) { event.preventDefault(); setOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function choose(hit?: CommandHit) {
    if (!hit) return
    const next = [hit.id, ...recentIds.filter((id) => id !== hit.id)].slice(0, 12)
    setRecentIds(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    setOpen(false); setQuery('')
    if (hit.action) hit.action()
    else if (hit.url) window.open(hit.url, '_blank', 'noopener,noreferrer')
    else if (hit.route) navigate(hit.route)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground card-soft hover:bg-muted sm:w-56 lg:w-72">
        <Search className="size-4" /><span className="hidden truncate md:inline">Search or run a command...</span><Kbd className="ml-auto hidden border border-border bg-transparent text-[10px] md:inline-flex">⌘K</Kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Premed HQ"
        description="Search records, navigate pages, or run an action."
        className="top-[18%] max-w-xl translate-y-0 gap-0"
      >
        <CommandInput autoFocus value={query} onValueChange={setQuery} placeholder="Search records or type an action…" />
        <CommandList className="max-h-[24rem] p-2">
          <CommandEmpty>No matches for “{query}”.</CommandEmpty>
          {results.map((hit) => (
            <CommandItem key={hit.id} value={hit.id} onSelect={() => choose(hit)} className="gap-3 rounded-lg px-3 py-2">
              {hit.kind === 'action' && <Zap className="size-4 shrink-0 text-primary" />}
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{hit.label}</span><span className="block truncate text-xs text-muted-foreground">{hit.group} · {hit.sub}</span></span>
              {hit.url && <ExternalLink className="size-3.5 text-muted-foreground" />}
            </CommandItem>
          ))}
        </CommandList>
        <div className="border-t border-border px-4 py-2 text-[11px] font-semibold text-muted-foreground">↑↓ move · Enter open · Esc close</div>
      </CommandDialog>
    </>
  )
}
