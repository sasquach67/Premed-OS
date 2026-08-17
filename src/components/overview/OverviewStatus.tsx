import { Line, LineChart, PolarAngleAxis, RadialBar, RadialBarChart, YAxis } from 'recharts'
import {
  Brain,
  Building2,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Microscope,
  School,
  Stethoscope,
  Telescope,
  Users,
  ChevronDown,
  Eye,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MascotNote } from '@/components/common/MascotNote'
import { NumberFlow } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { daysUntil } from '@/lib/date'
import { hourPaceProjection, totalsForCategory, totalsForExperience, type HourPaceProjection } from '@/lib/experienceHours'
import { fmtGpa, gpaStats } from '@/lib/selectors'
import { goalProgress, termGpaSeries } from '@/lib/overview'
import type { ExperienceCategory } from '@/lib/types'
import { useStore } from '@/store/store'

interface DomainRow {
  group: 'Foundation' | 'Experiences' | 'Application'
  label: string
  route: string
  icon: typeof GraduationCap
  accent: string
  value: string
  state: string
  progress?: number
  records?: Array<{ id: string; title: string; detail: string; state: string }>
  projection?: HourPaceProjection | null
  projectionKey?: string
  projectionUnavailable?: string
}

export function WhereIStand() {
  const state = useStore()
  const [openRow, setOpenRow] = useState<string | null>(null)
  const gpa = gpaStats(state.courses)
  const latestMcat = [...state.mcat.attempts]
    .filter((attempt) => attempt.total != null)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || b.order - a.order)[0]
  const graded = gpa.credits > 0
  const researchProjects = state.experiences.filter((entry) => entry.category === 'research' && !entry.deletedAt).length
  const leadershipRoles = state.orgs.filter((org) => org.status === 'leader' && !org.deletedAt).length
  const activeOrgs = state.orgs.filter((org) => org.status !== 'inactive' && !org.deletedAt).length
  const draftedStories = state.stories.filter((story) => story.commentary.trim()).length
  const submittedSecondaries = state.secondaries.filter((entry) => entry.status === 'submitted').length
  const lettersReceived = state.letters.filter((letter) => letter.status === 'submitted').length
  const activeLetters = state.letters.filter((letter) => letter.status !== 'declined').length
  const examDays = daysUntil(state.mcat.targetDate)
  const mcatGoal = state.mcat.goalScore ?? state.goals.mcatTarget

  /* Class-level state reaches Overview instead of stopping at Academics:
     what's due, what's shaky, what's open, and what is still unfiled. */
  const center = state.academics.classCenter
  const nowMs = Date.now()
  const dueTopics = (center.topics ?? []).filter((topic) =>
    topic.status !== 'ready' && (topic.fsrs?.due ?? Infinity) <= nowMs).length
  const weakTopics = (center.weakAreas ?? []).filter((area) => area.status === 'active').length
  const openAssignments = (center.assignments ?? []).filter((assignment) =>
    assignment.status !== 'graded' && assignment.status !== 'submitted' && assignment.status !== 'dropped').length
  const coverageGaps = (center.sourceChunks ?? []).filter((chunk) => !chunk.topicId).length
    + (center.files ?? []).filter((file) => file.processingStatus === 'pending').length

  const classSignals = [
    dueTopics ? `${dueTopics} due` : '',
    weakTopics ? `${weakTopics} review notes` : '',
    openAssignments ? `${openAssignments} open` : '',
    coverageGaps ? `${coverageGaps} unfiled` : '',
  ].filter(Boolean)

  const hourRow = (
    label: string,
    category: ExperienceCategory,
    goal: number,
    route: string,
    icon: typeof GraduationCap,
    accent: string,
  ): DomainRow => {
    const totals = totalsForCategory(state.experiences, state.experienceHourEntries, category)
    const current = totals.total
    const hasGoal = goal > 0
    const records = state.experiences
      .filter((entry) => entry.category === category && !entry.deletedAt)
      .sort((a, b) => a.order - b.order)
      .map((entry) => ({
        id: entry.id,
        title: entry.org || 'Untitled position',
        detail: `${entry.role || 'Role not recorded'} · ${Math.round(totalsForExperience(state.experienceHourEntries, entry.id).total)} recorded hours`,
        state: entry.status === 'completed' ? 'ended' : entry.status,
      }))
    return {
      group: 'Experiences',
      label,
      route,
      icon,
      accent,
      value: hasGoal ? `${Math.round(current)}/${goal} hrs` : `${Math.round(current)} hrs`,
      state: !current ? 'not started' : hasGoal ? 'goal set' : 'no goal',
      progress: goalProgress(current, goal),
      records,
      projection: hourPaceProjection(state.experiences, state.experienceHourEntries, category, goal),
      projectionKey: `overview-hour-pace:${category}`,
      projectionUnavailable: goal > 0
        ? 'Not enough dated work yet. Add two dated logs on different days to calculate a rate.'
        : 'Set an hours target to calculate a projection from dated logs.',
    }
  }

  const rows: DomainRow[] = [
    {
      group: 'Foundation', label: 'Academics', route: '/academics', icon: GraduationCap, accent: 'var(--cat-gpa)',
      value: graded ? `${fmtGpa(gpa.cum)} cum · ${fmtGpa(gpa.science)} sci` : 'Not started',
      state: classSignals.length
        ? classSignals.join(' · ')
        : !graded ? 'not enough data' : 'record current',
      progress: goalProgress(gpa.cum, state.goals.gpaTarget),
    },
    {
      group: 'Foundation', label: 'MCAT', route: '/mcat', icon: Brain, accent: 'var(--cat-mcat)',
      value: latestMcat?.total ? `${latestMcat.total} recorded · goal ${mcatGoal}` : `${state.mcat.currentPhase ?? 'Plan not started'}`,
      state: examDays != null ? `${Math.max(0, examDays)}d out` : 'no date',
      progress: goalProgress(latestMcat?.total ?? 0, mcatGoal),
    },
    hourRow('Clinical', 'clinical', state.goals.clinical, '/clinical', Stethoscope, 'var(--cat-clinical)'),
    hourRow('Volunteering', 'volunteering', state.goals.volunteering, '/volunteering', HeartHandshake, 'var(--cat-volunteer)'),
    hourRow('Shadowing', 'shadowing', state.goals.shadowing, '/shadowing', Telescope, 'var(--cat-shadow)'),
    {
      group: 'Experiences', label: 'Research', route: '/research', icon: Microscope, accent: 'var(--cat-research)',
      value: researchProjects ? `${researchProjects} ${researchProjects === 1 ? 'project' : 'projects'}` : 'Not started',
      state: 'record count',
      records: state.experiences.filter((entry) => entry.category === 'research' && !entry.deletedAt).sort((a, b) => a.order - b.order).map((entry) => ({ id: entry.id, title: entry.org || 'Untitled project', detail: entry.role || 'Role not recorded', state: entry.status === 'completed' ? 'ended' : entry.status })),
    },
    {
      group: 'Experiences', label: 'Extracurriculars', route: '/ecs', icon: Users, accent: 'var(--cat-activities)',
      value: `${activeOrgs} roles · ${leadershipRoles} leadership`,
      state: 'record count',
    },
    {
      group: 'Application', label: 'School List', route: '/schools', icon: School, accent: 'var(--primary)',
      value: `${state.schools.length} schools`,
      state: state.schools.length ? 'list started' : 'not started',
    },
    {
      group: 'Application', label: 'Essays', route: '/essays', icon: BookOpen, accent: 'var(--cat-activities)',
      value: `${draftedStories} stories · ${submittedSecondaries}/${state.secondaries.length} submitted`,
      state: draftedStories ? 'records present' : 'not started',
    },
    {
      group: 'Application', label: 'Letters', route: '/letters', icon: Building2, accent: 'var(--cat-letters)',
      value: `${lettersReceived}/${activeLetters || 0} received`,
      state: activeLetters ? 'records present' : 'not started',
    },
  ]

  return (
    <Card className="h-full min-h-[34rem]" role="region" aria-labelledby="where-i-stand-heading">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle id="where-i-stand-heading" className="text-lg">Where I stand</CardTitle>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Honest state from each owning domain.</p>
        </div>
        <Badge variant="muted">Record facts</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {(['Foundation', 'Experiences', 'Application'] as const).map((group) => (
          <section key={group} aria-labelledby={`domain-${group}`}>
            <div className="mb-1 flex items-center gap-2">
              <h3 id={`domain-${group}`} className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{group}</h3>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-0.5">
              {rows.filter((row) => row.group === group).map((row) => <DomainStatusRow key={row.label} row={row} open={openRow === row.label} onOpenChange={(next) => setOpenRow(next ? row.label : null)} />)}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

function DomainStatusRow({ row, open, onOpenChange }: { row: DomainRow; open: boolean; onOpenChange: (next: boolean) => void }) {
  const Icon = row.icon
  const records = row.records ?? []
  const visibleRecords = records.slice(0, 3)
  return (
    <div className="rounded-xl">
      <div className="group grid min-h-9 grid-cols-[1.5rem_minmax(4.75rem,.7fr)_minmax(5rem,1fr)_3.5rem_auto] items-center gap-1.5 px-1.5 py-1 transition-colors hover:bg-muted/45">
        <span className="grid size-6 place-items-center rounded-lg text-white shadow-sm" style={{ background: row.accent }}><Icon className="size-3.5" /></span>
        <Link to={row.route} aria-label={`${row.label}, ${row.value}, ${row.state}`} className="truncate text-xs font-extrabold hover:underline">{row.label}</Link>
        <Link to={row.route} className="min-w-0"><span className="block truncate text-right text-[11px] font-bold tabular-nums text-muted-foreground">{row.value}</span></Link>
        {row.progress == null ? <span aria-hidden="true" /> : <Progress value={row.progress} className="h-1.5 border-0" aria-label={`${row.label} progress toward student-set goal`} />}
        {records.length > 0 ? <button type="button" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${row.label} records`} className="flex items-center gap-1 rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Badge variant="muted" className="justify-center px-1.5 text-[9px]">{row.state}</Badge><ChevronDown className={`size-3 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} /></button> : <Badge variant="muted" className="justify-center px-1.5 text-[9px]">{row.state}</Badge>}
      </div>
      {open && records.length > 0 && <div className="mx-1.5 mb-1 space-y-2 rounded-xl border border-border bg-muted/25 p-2.5">
        <div className="space-y-1.5">{visibleRecords.map((record) => <Link key={record.id} to={row.route} className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-card px-2.5 py-2 hover:bg-muted/45"><span className="min-w-0"><span className="block truncate text-xs font-extrabold">{record.title}</span><span className="block truncate text-[11px] font-semibold text-muted-foreground">{record.detail}</span></span><Badge variant="muted" className="shrink-0 px-1.5 text-[9px]">{record.state}</Badge></Link>)}</div>
        {records.length > visibleRecords.length && <Link to={row.route} className="block text-xs font-bold text-primary hover:underline">+{records.length - visibleRecords.length} more →</Link>}
        {row.projectionKey && <ProjectionDisclosure projection={row.projection} projectionKey={row.projectionKey} unavailable={row.projectionUnavailable ?? 'Not enough dated work yet.'} />}
      </div>}
    </div>
  )
}

function ProjectionDisclosure({ projection, projectionKey, unavailable }: { projection: HourPaceProjection | null | undefined; projectionKey: string; unavailable: string }) {
  const dismissed = useStore((state) => Boolean(state.settings.projectionDismissals[projectionKey]))
  const update = useStore((state) => state.update)
  const [open, setOpen] = useState(false)
  const restore = () => {
    update((draft) => { delete draft.settings.projectionDismissals[projectionKey] })
    setOpen(true)
  }

  if (!projection) {
    return <p className="border-l-2 border-warning px-2 py-1 text-[11px] font-semibold text-muted-foreground">{unavailable}</p>
  }
  if (!open || dismissed) {
    return <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={restore}><Eye className="size-3.5" />Show projection</Button>
  }
  const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-[11px]">
      <div className="mb-2 flex items-center justify-between gap-2"><span className="font-extrabold text-foreground">Projection from dated logs</span><Button type="button" size="icon" variant="ghost" className="size-6" aria-label="Hide projection" onClick={() => { update((draft) => { draft.settings.projectionDismissals[projectionKey] = true }); setOpen(false) }}><X className="size-3.5" /></Button></div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"><ProjectionFact label="Window" value={`${formatDate(projection.observationStart)}–${formatDate(projection.observationEnd)}`} /><ProjectionFact label="Logged" value={`${projection.loggedHours.toFixed(1)}h`} /><ProjectionFact label="Rate" value={`${projection.weeklyRate.toFixed(1)}h / week`} /><ProjectionFact label="Remaining" value={`${projection.remainingHours.toFixed(1)}h`} /></div>
      <p className="mt-2 font-semibold text-muted-foreground">At {projection.weeklyRate.toFixed(1)}h/week → remaining hours by <span className="font-extrabold text-foreground">{formatDate(projection.projectedDate)}</span>.</p>
      {projection.estimatedHours > 0 && <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{projection.estimatedHours.toFixed(1)}h of captured time is estimated backfill; it is excluded from this rate.</p>}
    </div>
  )
}

function ProjectionFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-muted/40 px-2 py-1.5"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">{label}</span><span className="block truncate font-bold text-foreground">{value}</span></div>
}

export function GpaStatTile() {
  const courses = useStore((state) => state.courses)
  const stats = gpaStats(courses)
  const graded = stats.credits > 0
  const series = termGpaSeries(courses)
  const previous = series.at(-2)?.cumulative
  const delta = previous == null ? null : stats.cum - previous

  const card = (
    <Card className="h-full min-h-48 transition-transform duration-200 hover:-translate-y-0.5" role="region" aria-label="Recorded GPA">
      <CardContent className="flex h-full flex-col p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Cumulative GPA</p>
        {!graded ? (
          <MascotNote
            variant="empty-state"
            priority={30}
            title="Not enough graded work yet"
            actions={<Button asChild size="sm"><Link to="/academics">Open Academics</Link></Button>}
            className="mt-3 flex-1 items-center"
          >
            Record a grade first; GPA appears only when there is real work to calculate.
          </MascotNote>
        ) : (
          <>
            <div className="mt-2 flex items-end justify-between gap-2">
              <NumberFlow value={stats.cum} format={(value) => value.toFixed(2)} className="font-display text-4xl font-extrabold text-[var(--cat-gpa)]" />
              {delta != null && (
                <Badge variant={delta >= 0 ? 'success' : 'danger'}>
                  {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}{delta.toFixed(2)} this term
                </Badge>
              )}
            </div>
            {series.length < 2 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-xs font-semibold text-muted-foreground">
                Add another graded term to show a GPA trend.
              </p>
            ) : (
              <ChartContainer
                config={{ cumulative: { label: 'Cumulative', color: 'var(--cat-gpa)' }, science: { label: 'Science', color: 'var(--cat-research)' } }}
                className="mt-2 h-16 w-full aspect-auto"
                initialDimension={{ width: 240, height: 64 }}
                aria-label="Cumulative and science GPA trend by term"
              >
                <LineChart data={series} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                  <YAxis hide domain={[0, 4]} />
                  <Line type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="science" stroke="var(--color-science)" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false} />
                </LineChart>
              </ChartContainer>
            )}
            <p className="mt-auto text-xs font-semibold text-muted-foreground">Science {fmtGpa(stats.science)} · {series.length} {series.length === 1 ? 'term' : 'terms'}</p>
          </>
        )}
      </CardContent>
    </Card>
  )

  return graded ? <Link to="/academics" className="block h-full">{card}</Link> : card
}

export function McatStatTile() {
  const mcat = useStore((state) => state.mcat)
  const fallbackGoal = useStore((state) => state.goals.mcatTarget)
  const latest = [...mcat.attempts]
    .filter((attempt) => attempt.total != null)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || b.order - a.order)[0]
  const recorded = latest?.total
  const goal = mcat.goalScore ?? fallbackGoal

  const card = (
    <Card className="h-full min-h-48 transition-transform duration-200 hover:-translate-y-0.5" role="region" aria-label="Latest MCAT score and student-set target">
      <CardContent className="grid h-full place-items-center p-4 text-center">
        {!recorded ? (
          <MascotNote
            variant="empty-state"
            priority={31}
            title="No scored practice yet"
            actions={<Button asChild size="sm"><Link to="/mcat">Open MCAT</Link></Button>}
            className="w-full text-left"
          >
            Log your first scored practice and this target view will use the real result.
          </MascotNote>
        ) : (
          <div className="relative mx-auto size-32">
            <ChartContainer
              config={{ score: { label: 'Recorded score', color: 'var(--cat-mcat)' } }}
              className="size-32 aspect-square"
              initialDimension={{ width: 128, height: 128 }}
              aria-label={`${recorded} recorded against a student-set target of ${goal}`}
            >
              <RadialBarChart data={[{ score: Math.min(recorded, goal) }]} startAngle={90} endAngle={-270} innerRadius="72%" outerRadius="100%">
                <PolarAngleAxis type="number" domain={[472, Math.max(472, goal)]} dataKey="score" tick={false} />
                <RadialBar dataKey="score" background fill="var(--color-score)" cornerRadius={12} isAnimationActive={false} />
              </RadialBarChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div>
                <NumberFlow value={recorded} className="font-display text-3xl font-extrabold" />
                <p className="text-[10px] font-bold text-muted-foreground">of {goal}</p>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs font-semibold text-muted-foreground">MCAT · questions not tracked</p>
      </CardContent>
    </Card>
  )

  return recorded ? <Link to="/mcat" className="block h-full">{card}</Link> : card
}

export function HoursStatTile() {
  const experiences = useStore((state) => state.experiences)
  const hourEntries = useStore((state) => state.experienceHourEntries)
  /* Clinical, Volunteering and Research only (03-overview §6.5a, corrected
   * Aug 2026). Shadowing and Extracurriculars are excluded because their own
   * specs reject an hours-first metric: Shadowing's headline is coverage, not
   * total — "breadth is the metric, not volume" (05-shadowing §2, points 1-2)
   * — and on Extracurriculars "hours are the weakest signal here and are
   * never centered… must not be a headline metric, a goal, or a projection"
   * (07-extracurriculars §2, point 1). Drawing bars those pillars reject
   * makes the app contradict itself. */
  const rows = [
    { label: 'Clinical', value: totalsForCategory(experiences, hourEntries, 'clinical').total, color: 'var(--cat-clinical)' },
    { label: 'Volunteer', value: totalsForCategory(experiences, hourEntries, 'volunteering').total, color: 'var(--cat-volunteer)' },
    { label: 'Research', value: totalsForCategory(experiences, hourEntries, 'research').total, color: 'var(--cat-research)' },
  ]
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const largest = Math.max(...rows.map((row) => row.value), 1)

  return (
    <Card className="h-full min-h-48" role="region" aria-labelledby="hours-stat-heading">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle id="hours-stat-heading">Hours logged</CardTitle>
        {total > 0 && <Badge variant="muted"><NumberFlow value={Math.round(total)} /> total</Badge>}
      </CardHeader>
      <CardContent className="space-y-2">
        {total === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground">No experience hours recorded yet.</p>
        ) : rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 text-xs">
            <span className="font-bold text-muted-foreground">{row.label}</span>
            {row.value > 0
              ? <Progress value={(row.value / largest) * 100} className="h-2" aria-label={`${row.label}, ${Math.round(row.value)} hours`} />
              : <span aria-hidden="true" />}
            {row.value > 0
              ? <span style={{ color: row.color }}><NumberFlow value={Math.round(row.value)} className="text-right font-display font-extrabold" /></span>
              : <span className="text-right font-semibold text-muted-foreground">—</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
