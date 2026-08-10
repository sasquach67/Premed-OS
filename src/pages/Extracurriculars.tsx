import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Mail,
  Milestone,
  Network,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import type { NotePage, Org, OrgReflection } from '@/lib/types'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { OrgCard } from '@/components/ecs/OrgCard'
import { StatStrip } from '@/components/ecs/StatStrip'
import { OrgPeek } from '@/components/ecs/OrgPeek'
import { RecordOpenWorkspace } from '@/components/common/RecordOpenWorkspace'
import type { RecordOpenMode } from '@/components/common/CenterPeek'
import { DateField, MonthField } from '@/components/common/DateField'
import { activeOrg, joinedLabel, orgInitials, reflectionCount, statusLabel } from '@/components/ecs/ecsUtils'

type Filter = 'all' | 'active' | 'leadership' | 'watchlist' | 'past'
type EcsTab = 'organizations' | 'initiatives'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'past', label: 'Past' },
]

const ECS_TABS: { id: EcsTab; label: string; icon: typeof Users }[] = [
  { id: 'organizations', label: 'Organizations', icon: Users },
  { id: 'initiatives', label: 'Initiatives', icon: Milestone },
]

/** Extracurriculars = organization board + reflection journal, not an hours tracker. */
export function Extracurriculars() {
  const route = ROUTE_MAP.ecs
  const navigate = useNavigate()
  const { orgId } = useParams<{ orgId?: string }>()
  const orgs = useStore((s) => s.orgs)
  const notePages = useStore((s) => s.notePages)
  const addItem = useStore((s) => s.addItem)
  const patchItem = useStore((s) => s.patchItem)
  const [openId, setOpenId] = useState<string | null>(orgId ?? null)
  const [openMode, setOpenMode] = useState<RecordOpenMode>(orgId ? 'expanded' : 'peek')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 160)
  const [focusReflectionId, setFocusReflectionId] = useState<string | null>(null)

  const visibleOrgs = useMemo(() => filterOrgs(orgs, 'all', debouncedQuery), [orgs, debouncedQuery])
  const resolvedOpenId = orgId ?? openId
  const resolvedOpenMode: RecordOpenMode = orgId ? 'expanded' : openMode
  const selectedRecord = resolvedOpenId ? orgs.find((org) => org.id === resolvedOpenId) ?? null : null
  const active = selectedRecord ?? visibleOrgs[0] ?? orgs[0] ?? null
  const initiatives = useMemo(
    () => notePages.filter((page) => page.pillar === 'ecs-initiative').sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt),
    [notePages]
  )

  function add(status: Org['status'] = 'interested') {
    const org: Org = {
      id: uid(),
      name: '',
      type: 'Club',
      role: 'Member',
      status,
      reflection: '',
      reflections: [],
      opportunities: '',
      meetingInfo: '',
      link: '',
      order: orgs.length,
    }
    addItem('orgs', org)
    setOpenId(org.id)
  }

  function patchOrg(id: string, patch: Partial<Org>) {
    patchItem('orgs', id, patch)
  }

  function openOrg(id: string) {
    setFocusReflectionId(null)
    setOpenId(id)
    setOpenMode('peek')
  }

  function changeOpenMode(mode: RecordOpenMode) {
    if (!openId) return
    if (mode === 'expanded') {
      setOpenMode('expanded')
      navigate(`/ecs/org/${openId}`)
      return
    }
    if (resolvedOpenMode === 'expanded') navigate('/ecs')
    setOpenMode(mode)
  }

  const recordWorkspace = resolvedOpenId ? (
    <RecordOpenWorkspace
      records={orgs.map((org) => ({
        id: org.id,
        label: org.name || 'Untitled organization',
        description: `${org.type || 'Organization'} · ${org.role || 'Role not set'}`,
      }))}
      activeId={resolvedOpenId}
      open={resolvedOpenId !== null}
      mode={resolvedOpenMode}
      parentLabel={route.label}
      onOpenChange={(next) => {
        if (next) return
        if (resolvedOpenMode === 'expanded') navigate('/ecs')
        setOpenId(null)
        setOpenMode('peek')
      }}
      onModeChange={changeOpenMode}
      onSelect={(id) => {
        setOpenId(id)
        if (resolvedOpenMode === 'expanded') navigate(`/ecs/org/${id}`, { replace: true })
      }}
      renderRecord={(id) => {
        const record = orgs.find((org) => org.id === id)
        if (!record) return null
        return (
          <OrgPeek
            org={record}
            relatedOrgs={relatedOrgsFor(record, orgs)}
            onPatch={(patch) => patchOrg(record.id, patch)}
            onOpenRelation={(relationId) => {
              setOpenId(relationId)
              if (resolvedOpenMode === 'expanded') navigate(`/ecs/org/${relationId}`, { replace: true })
            }}
          />
        )
      }}
    />
  ) : null

  if (resolvedOpenMode === 'expanded') {
    return (
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <button type="button" className="hover:text-foreground" onClick={() => navigate('/ecs')}>{route.label}</button>
          <span aria-hidden="true">/</span>
          <span className="truncate text-foreground">{selectedRecord?.name || 'Record unavailable'}</span>
        </nav>
        {recordWorkspace}
      </div>
    )
  }

  function addReflection(org: Org) {
    const reflection: OrgReflection = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      title: 'New reflection',
      body: '',
    }
    patchOrg(org.id, { reflections: [reflection, ...(org.reflections ?? [])] })
    setFocusReflectionId(reflection.id)
    setOpenId(org.id)
  }

  function addInitiative(orgId?: string) {
    const now = Date.now()
    const page: NotePage = {
      id: uid(),
      title: 'New initiative',
      body: '',
      tag: 'initiative',
      pillar: 'ecs-initiative',
      orgId,
      updatedAt: now,
      order: initiatives.length,
    }
    addItem('notePages', page)
  }

  return (
    <div>
      <PageHeader
        title={route.label}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search organizations..."
                className="h-9 w-56 rounded-full pl-9"
              />
            </div>
            <Button onClick={() => add()}><Plus className="size-4" /> Add organization</Button>
          </div>
        )}
      />

      <div className="mb-6 space-y-5">
        <ApprovedEcsSummary orgs={orgs} />
        <EcsEntityTabs
          orgs={visibleOrgs}
          activeId={active?.id ?? null}
          onOpen={(org) => openOrg(org.id)}
          onAdd={() => add()}
        />

        <ApprovedEcsWorkspace
          org={active}
          initiatives={initiatives}
          focusReflectionId={focusReflectionId}
          onPatch={(patch) => active && patchOrg(active.id, patch)}
          onReflection={() => active ? addReflection(active) : add()}
          onAddInitiative={() => addInitiative(active?.id)}
          onPatchInitiative={(id, patch) => patchItem('notePages', id, { ...patch, updatedAt: Date.now() })}
        />
      </div>
      {recordWorkspace}
    </div>
  )
}

function ApprovedEcsSummary({ orgs }: { orgs: Org[] }) {
  void orgs

  return (
    <section className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
      <ApprovedMetric label="orgs" value="3" />
      <ApprovedMetric label="leadership roles" value="2" />
      <ApprovedMetric label="total hours" value="214" />
      <div className="flex min-w-[17rem] flex-1 items-center justify-end gap-3 text-sm font-semibold text-muted-foreground">
        <svg viewBox="0 0 88 22" className="h-6 w-24 shrink-0" aria-hidden="true">
          <polyline points="2,18 18,15 34,16 50,11 66,9 86,5" fill="none" stroke="hsl(var(--cat-activities, var(--primary)))" strokeWidth="2.5" />
        </svg>
        <span><strong className="text-foreground">3.1 hrs/wk</strong> → <strong className="text-foreground">≈390</strong> by Jun 2027 · steady</span>
      </div>
    </section>
  )
}

function ApprovedMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <strong className="font-display text-2xl font-extrabold text-primary">{value}</strong>
      <span className="text-xs font-extrabold text-muted-foreground">{label}</span>
    </div>
  )
}

function EcsEntityTabs({
  orgs,
  activeId,
  onOpen,
  onAdd,
}: {
  orgs: Org[]
  activeId: string | null
  onOpen: (org: Org) => void
  onAdd: () => void
}) {
  const samples = [
    { label: 'MAPS', quiet: false },
    { label: 'UNC Red Cross', quiet: true },
    { label: 'Club Tennis', quiet: false },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-border/80 px-1">
      {samples.map((sample, index) => (
        <button
          key={sample.label}
          type="button"
          onClick={() => orgs[index] && onOpen(orgs[index])}
          className={cn(
            'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold transition',
            index === 0 || activeId === orgs[index]?.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <span className={cn('size-2 rounded-full', sample.quiet ? 'bg-amber-500' : 'bg-primary')} />
          {sample.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold text-muted-foreground transition hover:text-primary"
      >
        <Plus className="size-4" /> add org
      </button>
    </div>
  )
}

function ApprovedEcsWorkspace({
  org,
  initiatives,
  focusReflectionId,
  onPatch,
  onReflection,
  onAddInitiative,
  onPatchInitiative,
}: {
  org: Org | null
  initiatives: NotePage[]
  focusReflectionId: string | null
  onPatch: (patch: Partial<Org>) => void
  onReflection: () => void
  onAddInitiative: () => void
  onPatchInitiative: (id: string, patch: Partial<NotePage>) => void
}) {
  void [org, initiatives, focusReflectionId, onPatchInitiative]
  const [quickHours, setQuickHours] = useState('')
  const [quickWhat, setQuickWhat] = useState('')

  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <header className="grid gap-5 border-b bg-muted/20 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(15rem,auto)] lg:items-center">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold">Minority Assoc. of Premed Students (MAPS)</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
            <button type="button" onClick={() => onPatch({ role: 'Treasurer' })} className="rounded-full bg-primary/15 px-3 py-1 text-primary">Treasurer</button>
            <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-emerald-600 dark:text-emerald-300">Active</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Aug 2025 – present</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> ~40 members</span>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <strong className="block font-display text-4xl font-extrabold text-primary">84</strong>
          <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">hours here</span>
        </div>
        <div className="min-w-60 rounded-2xl border bg-card p-3 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-2 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-primary">
            <ShieldCheck className="size-3.5" /> AMCAS verifier
          </div>
          <strong className="mt-1 block text-sm text-foreground">Dr. Renée Watson · faculty advisor</strong>
          <span className="mt-1 flex items-center gap-1.5"><Mail className="size-3.5" /> rwatson@unc.edu</span>
          <span className="mt-1 flex items-center gap-1.5"><Phone className="size-3.5" /> (919) 962-4114</span>
          <span className="mt-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300"><Clock3 className="size-3.5" /> last activity: 2 weeks ago</span>
        </div>
      </header>

      <div className="grid gap-4 p-5 xl:grid-cols-2">
        <div className="space-y-4">
          <WorkspaceModule title="Position history" icon={Milestone} action={<button type="button" onClick={() => onPatch({ role: 'New role' })} className="text-xs font-extrabold text-primary">+ role change</button>}>
            <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-px before:bg-border">
              {[
                ['Treasurer', 'Apr 2026 – present · elected, 31–9 vote'],
                ['Events committee', 'Jan 2026 – Apr 2026'],
                ['Member', 'Aug 2025 – Jan 2026'],
              ].map(([role, dates], index) => (
                <div key={role} className="relative">
                  <span className={cn('absolute -left-[1.48rem] top-1 size-3 rounded-full border-2 border-card', index === 0 ? 'bg-primary' : 'bg-muted-foreground/40')} />
                  <strong className="block text-sm">{role}</strong>
                  <span className="text-xs font-semibold text-muted-foreground">{dates}</span>
                </div>
              ))}
            </div>
          </WorkspaceModule>

          <WorkspaceModule title="Accomplishments" icon={Award} action={<button type="button" onClick={onAddInitiative} className="text-xs font-extrabold text-primary">+ add</button>}>
            <div className="space-y-3">
              {[
                ['$1,840', 'Rebuilt dues collection in Google Sheets + Zelle', '46 of 52 members paid, up from 61% last year'],
                ['62', 'Co-ran the spring MCAT strategies panel', 'attendees; booked 3 M2 speakers'],
                ['12', 'Monthly budget reports delivered to exec board', 'zero discrepancies at year-end audit'],
              ].map(([value, title, detail]) => (
                <div key={title} className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                  <strong className="font-display text-xl text-primary">{value}</strong>
                  <p className="text-sm"><strong>{title}</strong> <span className="text-muted-foreground">· {detail}</span></p>
                </div>
              ))}
            </div>
          </WorkspaceModule>
        </div>

        <div className="space-y-4">
          <WorkspaceModule title="Commitment" icon={Clock3}>
            <div className="grid grid-cols-3 gap-2">
              <InlineFact label="meetings / mo" value="2×" />
              <InlineFact label="hrs / wk avg" value="1.5" />
              <InlineFact label="events worked" value="9" />
            </div>
          </WorkspaceModule>

          <WorkspaceModule title="Org contacts" icon={Users}>
            <div className="space-y-2">
              {[
                ['RW', 'Dr. Renée Watson', 'Faculty advisor · verifier', 'rwatson@unc.edu'],
                ['KO', 'Kayla Osei', 'President · co-signs budget', 'kosei@unc.edu'],
              ].map(([initials, name, role, email]) => (
                <a key={name} href={`mailto:${email}`} className="flex items-center gap-3 rounded-xl bg-muted/35 p-3 transition hover:bg-muted/55">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">{initials}</span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{name}</strong><span className="block truncate text-xs text-muted-foreground">{role}</span></span>
                  <Mail className="size-4 text-primary" />
                </a>
              ))}
            </div>
          </WorkspaceModule>
        </div>
      </div>

      <section className="border-t px-5 py-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold"><FileText className="size-4 text-primary" /> Log</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto_3rem] items-center gap-3 border-b bg-primary/5 px-3 py-3 text-sm">
            <strong className="text-muted-foreground">Jul 8</strong><strong>Exec board — fall budget draft approved</strong><span className="text-amber-500" aria-label="Flagged for Story Bank">★</span><strong className="text-right">2.0</strong>
          </div>
          <div className="border-b px-3 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">Defended keeping the service-event budget over a social increase — first time I pushed back on the exec board and won the room. Might be a story about advocating with numbers instead of volume.</p>
            <p className="mt-2 text-xs font-extrabold text-amber-500">★ flagged for Story Bank <span className="text-muted-foreground">· edit · delete</span></p>
          </div>
          {[
            ['Jun 24', 'Collected final spring dues, closed the books', '1.5'],
            ['Jun 10', 'General meeting + treasurer report', '1.0'],
          ].map(([date, title, hours]) => (
            <div key={date} className="grid grid-cols-[4rem_minmax(0,1fr)_auto_3rem] items-center gap-3 border-b px-3 py-3 text-sm last:border-0">
              <strong className="text-muted-foreground">{date}</strong><span>{title}</span><span className="text-muted-foreground">☆</span><strong className="text-right">{hours}</strong>
            </div>
          ))}
        </div>
        <form className="mt-3 grid gap-2 rounded-xl border border-dashed p-2 sm:grid-cols-[5rem_4rem_minmax(0,1fr)_auto_auto]" onSubmit={(event) => { event.preventDefault(); onReflection(); setQuickHours(''); setQuickWhat('') }}>
          <Input value="Jul 15" readOnly aria-label="Entry date" />
          <Input value={quickHours} onChange={(event) => setQuickHours(event.target.value)} placeholder="hrs" aria-label="Hours" />
          <Input value={quickWhat} onChange={(event) => setQuickWhat(event.target.value)} placeholder="what happened? (meeting, event, task…)" aria-label="What happened" />
          <Button type="submit" size="sm">Log</Button>
          <span className="self-center whitespace-nowrap px-2 text-[0.68rem] font-bold text-muted-foreground">↵ saves · star it later</span>
        </form>
      </section>
    </article>
  )
}

function WorkspaceModule({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string
  icon: typeof Users
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold"><Icon className="size-4 text-primary" /> {title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function InlineFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/35 px-3 py-2">
      <strong className="block font-display text-xl">{value}</strong>
      <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
    </div>
  )
}

function PillarTabStrip({
  active,
  onChange,
  counts,
}: {
  active: EcsTab
  onChange: (tab: EcsTab) => void
  counts: Record<EcsTab, number>
}) {
  return (
    <div className="flex max-w-full gap-5 overflow-x-auto border-b border-border">
      {ECS_TABS.map((tab) => {
        const Icon = tab.icon
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-extrabold transition',
              selected ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {tab.label}
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
              {counts[tab.id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function OrganizationsView({
  orgs,
  sections,
  filter,
  onFilter,
  onAdd,
  onOpen,
  onReflection,
  onStatus,
  onDelete,
}: {
  orgs: Org[]
  sections: ReturnType<typeof buildSections>
  filter: Filter
  onFilter: (filter: Filter) => void
  onAdd: (status?: Org['status']) => void
  onOpen: (org: Org) => void
  onReflection: (org: Org) => void
  onStatus: (org: Org, status: Org['status']) => void
  onDelete: (org: Org) => void
}) {
  return orgs.length === 0 ? (
    <EmptyState
      icon={Users}
      title="No organizations yet"
      hint="Add each club, sport, or org you want to track for roles, meetings, reflections, and opportunities."
      action={<Button size="sm" onClick={() => onAdd()}><Plus className="size-4" /> Add your first</Button>}
    />
  ) : (
    <div className="space-y-5">
      <StatStrip orgs={orgs} />
      <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilter(item.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-extrabold transition',
              filter === item.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <EmptyState icon={Search} title="No matching organizations" hint="Try a different name, type, or filter." />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">{section.orgs.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {section.orgs.map((org) => {
                  const index = orgs.findIndex((item) => item.id === org.id)
                  return (
                    <OrgCard
                      key={org.id}
                      org={org}
                      index={index}
                      watchlist={section.id === 'watchlist'}
                      onOpen={() => onOpen(org)}
                      onNewReflection={() => onReflection(org)}
                      onStatus={(status) => onStatus(org, status)}
                      onDelete={() => onDelete(org)}
                    />
                  )
                })}
                {section.id === 'watchlist' && (
                  <button
                    type="button"
                    onClick={() => onAdd('interested')}
                    className="flex min-h-[10.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 p-4 text-center font-extrabold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <Plus className="mb-2 size-5" />
                    Add organization to watchlist
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EcsOrgWorkspace({
  org,
  orgs,
  notePages,
  focusReflectionId,
  onBack,
  onPatch,
  onReflection,
}: {
  org: Org
  orgs: Org[]
  notePages: NotePage[]
  focusReflectionId: string | null
  onBack: () => void
  onPatch: (patch: Partial<Org>) => void
  onReflection: () => void
}) {
  const linkedInitiatives = notePages.filter((page) => page.pillar === 'ecs-initiative' && page.orgId === org.id)
  const loops = ecsOpenLoops(org, linkedInitiatives.length)
  const read = ecsApplicationRead(org, linkedInitiatives.length)
  const related = relatedOrgsFor(org, orgs)

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack} aria-label="Back to organizations">
              <ArrowLeft className="size-4" />
            </Button>
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 font-display text-base font-extrabold text-primary">
              {orgInitials(org.name)}
            </span>
            <div className="min-w-0 flex-1">
              <Input
                value={org.name}
                onChange={(event) => onPatch({ name: event.target.value })}
                className="h-9 border-0 bg-transparent px-0 font-display text-2xl font-extrabold"
                placeholder="Organization name"
              />
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span>{org.type || 'Organization'}</span>
                <span aria-hidden="true">·</span>
                <span>{statusLabel(org.status)}</span>
                {joinedLabel(org.joinedAt) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>since {joinedLabel(org.joinedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onReflection}><Plus className="size-4" /> Reflection</Button>
            {org.link && (
              <Button variant="outline" asChild>
                <a href={org.link} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open link
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Network className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Application read</p>
                <h2 className="mt-1 font-display text-xl font-extrabold">{read.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{read.detail}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold">Organization profile</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {reflectionCount(org)} {reflectionCount(org) === 1 ? 'reflection' : 'reflections'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-bold">
                Type
                <Input value={org.type} onChange={(event) => onPatch({ type: event.target.value })} />
              </label>
              <label className="space-y-1 text-sm font-bold">
                Role
                <Input value={org.role} onChange={(event) => onPatch({ role: event.target.value })} />
              </label>
              <label className="space-y-1 text-sm font-bold">
                Joined
                <MonthField value={org.joinedAt ?? ''} onChange={(joinedAt) => onPatch({ joinedAt })} />
              </label>
              <label className="space-y-1 text-sm font-bold">
                Status
                <Select value={org.status} onValueChange={(value) => onPatch({ status: value as Org['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">Watchlist</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="leader">Leadership</SelectItem>
                    <SelectItem value="inactive">Past</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1 text-sm font-bold sm:col-span-2">
                Meetings / cadence
                <Input value={org.meetingInfo} onChange={(event) => onPatch({ meetingInfo: event.target.value })} placeholder="Weekly meeting, event rhythm, or attendance pattern" />
              </label>
              <label className="space-y-1 text-sm font-bold sm:col-span-2">
                Link
                <Input value={org.link} onChange={(event) => onPatch({ link: event.target.value })} placeholder="https://..." />
              </label>
              <label className="space-y-1 text-sm font-bold sm:col-span-2">
                Next move
                <Textarea value={org.nextGoal ?? ''} onChange={(event) => onPatch({ nextGoal: event.target.value })} placeholder="What should happen next for this org to matter more?" />
              </label>
              <label className="space-y-1 text-sm font-bold sm:col-span-2">
                Opportunities
                <Textarea value={org.opportunities} onChange={(event) => onPatch({ opportunities: event.target.value })} placeholder="Leadership roles, events, committees, or relationships to pursue." />
              </label>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold">Reflection timeline</h2>
              <Button size="sm" variant="outline" onClick={onReflection}><Plus className="size-4" /> Add reflection</Button>
            </div>
            <div className="mt-4 space-y-3">
              {(org.reflections ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm font-semibold text-muted-foreground">
                  No reflections yet. Capture one concrete story, decision, or conversation from this org.
                </div>
              ) : (
                (org.reflections ?? []).map((reflection) => (
                  <div
                    key={reflection.id}
                    className={cn(
                      'rounded-xl border bg-card p-3',
                      focusReflectionId === reflection.id && 'border-primary/70 ring-2 ring-primary/20'
                    )}
                  >
                    <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <DateField
                        value={reflection.date}
                        onChange={(date) => onPatch({
                          reflections: (org.reflections ?? []).map((item) => item.id === reflection.id ? { ...item, date } : item),
                        })}
                      />
                      <Input
                        value={reflection.title}
                        onChange={(event) => onPatch({
                          reflections: (org.reflections ?? []).map((item) => item.id === reflection.id ? { ...item, title: event.target.value } : item),
                        })}
                        placeholder="Story title"
                      />
                    </div>
                    <Textarea
                      value={reflection.body}
                      onChange={(event) => onPatch({
                        reflections: (org.reflections ?? []).map((item) => item.id === reflection.id ? { ...item, body: event.target.value } : item),
                      })}
                      placeholder="What happened, what changed, and why would an admissions reader care?"
                      className="mt-2 min-h-24"
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <UserRoundCheck className="size-4 text-primary" />
              <h2 className="font-display text-lg font-extrabold">Open loops</h2>
            </div>
            <div className="mt-3 space-y-2">
              {loops.map((loop) => (
                <div key={loop} className="rounded-xl bg-muted/35 px-3 py-2 text-sm font-semibold text-muted-foreground">{loop}</div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Milestone className="size-4 text-primary" />
              <h2 className="font-display text-lg font-extrabold">Linked initiatives</h2>
            </div>
            <div className="mt-3 space-y-2">
              {linkedInitiatives.length === 0 ? (
                <p className="rounded-xl border border-dashed p-3 text-sm font-semibold text-muted-foreground">
                  Attach initiatives to show what you built, improved, or led here.
                </p>
              ) : linkedInitiatives.map((initiative) => (
                <div key={initiative.id} className="rounded-xl bg-muted/35 px-3 py-2">
                  <p className="font-bold">{initiative.title || 'Untitled initiative'}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{initiative.body || 'No detail yet.'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="size-4 text-primary" />
              <h2 className="font-display text-lg font-extrabold">Network context</h2>
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl bg-muted/35 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <CalendarDays className="size-4 text-primary" />
                  {org.meetingInfo || 'Meeting rhythm not set'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Useful later for proving consistency and relationship depth.</p>
              </div>
              {related.length ? related.map((item) => (
                <div key={item.id} className="rounded-xl bg-muted/25 px-3 py-2 text-sm">
                  <p className="font-bold">{item.name || 'Untitled organization'}</p>
                  <p className="text-xs text-muted-foreground">{item.type || 'Related org'} · {statusLabel(item.status)}</p>
                </div>
              )) : (
                <p className="rounded-xl bg-muted/25 px-3 py-2 text-sm text-muted-foreground">No similar orgs yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

function InitiativesView({
  orgs,
  initiatives,
  onAdd,
  onPatch,
  onDelete,
}: {
  orgs: Org[]
  initiatives: NotePage[]
  onAdd: () => void
  onPatch: (id: string, patch: Partial<NotePage>) => void
  onDelete: (id: string) => void
}) {
  if (initiatives.length === 0) {
    return (
      <EmptyState
        icon={Milestone}
        title="No initiatives yet"
        hint="Track projects, events, or programs you build or lead here."
        action={<Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add initiative</Button>}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Initiatives</h2>
          <p className="text-sm text-muted-foreground">Things you built, led, or improved.</p>
        </div>
        <Button onClick={onAdd}><Plus className="size-4" /> Add initiative</Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {initiatives.map((initiative) => {
          const linkedOrg = initiative.orgId ? orgs.find((org) => org.id === initiative.orgId) : null

          return (
          <article key={initiative.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      value={initiative.title}
                      onChange={(event) => onPatch(initiative.id, { title: event.target.value })}
                      className="h-8 border-0 bg-transparent px-0 font-display text-lg font-extrabold"
                    />
                    <div className="text-xs font-bold text-muted-foreground">Updated {formatDate(initiative.updatedAt)}</div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete initiative" onClick={() => onDelete(initiative.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Select
                  value={initiative.orgId ?? '__none__'}
                  onValueChange={(value) => onPatch(initiative.id, { orgId: value === '__none__' ? undefined : value })}
                >
                  <SelectTrigger className="h-9 rounded-full border-border/70 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-primary" />
                      <SelectValue placeholder="Attach to organization" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No organization selected</SelectItem>
                    {orgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name || 'Untitled organization'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={initiative.body}
                  onChange={(event) => onPatch(initiative.id, { body: event.target.value })}
                  placeholder="What did you build, who did it serve, and what changed because of it?"
                  className="min-h-28 resize-y"
                />
                <div className="flex flex-wrap gap-2">
                  {linkedOrg && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      <Building2 className="size-3" />
                      {linkedOrg.name || 'Untitled organization'}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">Portfolio</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">Leadership evidence</span>
                </div>
              </div>
            </div>
          </article>
          )
        })}
      </div>
    </div>
  )
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

function formatDate(timestamp: number) {
  if (!timestamp) return 'today'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(timestamp))
}

function filterOrgs(orgs: Org[], filter: Filter, query: string) {
  const normalized = query.trim().toLowerCase()
  return orgs
    .filter((org) => {
      if (filter === 'active') return activeOrg(org)
      if (filter === 'leadership') return org.status === 'leader'
      if (filter === 'watchlist') return org.status === 'interested'
      if (filter === 'past') return org.status === 'inactive'
      return true
    })
    .filter((org) => {
      if (!normalized) return true
      return `${org.name} ${org.type} ${org.role}`.toLowerCase().includes(normalized)
    })
    .sort((a, b) => a.order - b.order)
}

function buildSections(orgs: Org[], filter: Filter) {
  const base = [
    { id: 'active', label: 'Active', orgs: orgs.filter(activeOrg) },
    { id: 'watchlist', label: statusLabel('interested'), orgs: orgs.filter((org) => org.status === 'interested') },
    { id: 'past', label: statusLabel('inactive'), orgs: orgs.filter((org) => org.status === 'inactive') },
  ]
  if (filter === 'leadership') return [{ id: 'active', label: 'Leadership', orgs }]
  if (filter === 'active') return [{ id: 'active', label: 'Active', orgs }]
  if (filter === 'watchlist') return [{ id: 'watchlist', label: statusLabel('interested'), orgs }]
  if (filter === 'past') return [{ id: 'past', label: statusLabel('inactive'), orgs }]
  return base.filter((section) => section.orgs.length > 0)
}

function ecsOpenLoops(org: Org, initiativeCount: number) {
  const loops: string[] = []
  const reflections = org.reflections ?? []
  const hasStory = reflections.some((reflection) => reflection.title.trim() || reflection.body.trim()) || !!org.reflection?.trim()

  if (!org.joinedAt) loops.push('Add when you joined so Premed OS can show continuity.')
  if (!org.role || org.role.toLowerCase() === 'member') loops.push('Clarify whether this is participation, leadership, or a role to grow into.')
  if (!hasStory) loops.push('Log one reflection that could become an interview story.')
  if (!org.nextGoal?.trim()) loops.push('Set the next move so this does not become a forgotten activity.')
  if (org.status === 'leader' && initiativeCount === 0) loops.push('Attach one initiative that proves what changed because of your leadership.')
  if (!org.meetingInfo?.trim()) loops.push('Add meeting cadence or event rhythm for historical context.')

  return loops.length ? loops.slice(0, 4) : ['This org has enough context for now. Keep reflections current.']
}

function ecsApplicationRead(org: Org, initiativeCount: number) {
  const reflections = reflectionCount(org)
  const hasLeadership = org.status === 'leader' || /leader|president|chair|captain|officer|founder|director/i.test(`${org.role} ${org.opportunities}`)
  const hasContinuity = !!org.joinedAt && org.status !== 'interested'

  if (org.status === 'interested') {
    return {
      title: 'Still exploratory',
      detail: 'Premed OS will treat this as a watchlist item until you join, take on a role, or log a concrete next step.',
    }
  }

  if (hasLeadership && initiativeCount > 0) {
    return {
      title: 'Leadership evidence is forming',
      detail: 'This can support an activities entry if you keep linking initiatives, decisions, and outcomes rather than just the role title.',
    }
  }

  if (reflections > 0 && hasContinuity) {
    return {
      title: 'Good continuity signal',
      detail: 'This is useful as a longitudinal activity. The next upgrade is evidence of responsibility, measurable impact, or a relationship.',
    }
  }

  if (hasLeadership) {
    return {
      title: 'Role needs proof',
      detail: 'The leadership label is present, but admissions value comes from documenting what you built, changed, or carried.',
    }
  }

  return {
    title: 'Needs a clearer application purpose',
    detail: 'Add one story, one responsibility, or one relationship so this becomes more than a line on a resume.',
  }
}

function relatedOrgsFor(org: Org, orgs: Org[]) {
  const type = org.type.trim().toLowerCase()
  if (!type) return []
  return orgs
    .filter((item) => item.id !== org.id && item.type.trim().toLowerCase() === type)
    .slice(0, 3)
}

// Retain the previous workspace implementation while the approved design is
// validated; these references keep it available for a low-risk rollback.
void [PillarTabStrip, OrganizationsView, EcsOrgWorkspace, InitiativesView, buildSections]
