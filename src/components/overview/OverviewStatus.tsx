import { m } from 'motion/react'
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
} from 'lucide-react'
import { Line, LineChart, RadialBar, RadialBarChart, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { PaceProjectionLine } from '@/components/common/PaceProjectionLine'
import { MascotNote } from '@/components/common/MascotNote'
import { NumberFlow } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { daysUntil } from '@/lib/date'
import { paceProjection } from '@/lib/intelligence'
import { observedWeeklyHours, termGpaSeries } from '@/lib/overview'
import { bestMcat, fmtGpa, gpaStats, hourTotals, percent } from '@/lib/selectors'
import type { ExperienceCategory } from '@/lib/types'
import { useStore } from '@/store/store'

interface DomainRow {
  group: 'Foundation' | 'Experiences' | 'Application'
  label: string
  route: string
  icon: typeof GraduationCap
  accent: string
  value: string
  progress?: number
  pace: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

function projectionForHours(category: ExperienceCategory, current: number, goal: number) {
  const state = useStore.getState()
  const weekly = observedWeeklyHours(state.experiences, category)
  if (!goal || weekly == null || weekly <= 0) return null
  return paceProjection(current, goal, weekly)
}

export function WhereIStand() {
  const state = useStore()
  const gpa = gpaStats(state.courses)
  const hours = hourTotals(state.experiences)
  const mcat = bestMcat(state.mcat)
  const graded = gpa.credits > 0
  const researchProjects = state.experiences.filter((entry) => entry.category === 'research' && !entry.deletedAt).length
  const leadershipRoles = state.orgs.filter((org) => org.status === 'leader' && !org.deletedAt).length
  const activeOrgs = state.orgs.filter((org) => org.status !== 'inactive' && !org.deletedAt).length
  const draftedStories = state.stories.filter((story) => story.commentary.trim()).length
  const submittedSecondaries = state.secondaries.filter((entry) => entry.status === 'submitted').length
  const lettersReceived = state.letters.filter((letter) => letter.status === 'submitted').length
  const activeLetters = state.letters.filter((letter) => letter.status !== 'declined').length
  const reachSchools = state.schools.filter((school) => school.category === 'reach').length
  const examDays = daysUntil(state.mcat.targetDate)

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
    weakTopics ? `${weakTopics} weak` : '',
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
    const current = hours[category]
    const projection = projectionForHours(category, current, goal)
    const pace = !current
      ? 'not started'
      : !projection?.projectedDate
        ? 'not enough data'
        : projection.met
          ? 'on track'
          : 'on pace'
    return {
      group: 'Experiences',
      label,
      route,
      icon,
      accent,
      value: `${Math.round(current)}/${goal} hrs`,
      progress: goal ? percent(current, goal) : undefined,
      pace,
      tone: pace === 'on track' || pace === 'on pace' ? 'success' : 'neutral',
    }
  }

  const rows: DomainRow[] = [
    {
      group: 'Foundation', label: 'Academics', route: '/academics', icon: GraduationCap, accent: 'var(--cat-gpa)',
      value: graded ? `${fmtGpa(gpa.cum)} cum · ${fmtGpa(gpa.science)} sci` : 'Not started',
      progress: graded && state.goals.gpaTarget ? percent(gpa.cum, state.goals.gpaTarget) : undefined,
      // Class work outranks the GPA summary here: an unreviewed backlog is the
      // thing you can still act on today, where a posted grade is already set.
      pace: classSignals.length
        ? classSignals.join(' · ')
        : !graded ? 'not enough data' : gpa.cum >= state.goals.gpaTarget ? 'on track' : 'at risk',
      tone: dueTopics || weakTopics
        ? 'warning'
        : !graded ? 'neutral' : gpa.cum >= state.goals.gpaTarget ? 'success' : 'warning',
    },
    {
      group: 'Foundation', label: 'MCAT', route: '/mcat', icon: Brain, accent: 'var(--cat-mcat)',
      value: mcat ? `${mcat} · goal ${state.mcat.goalScore ?? state.goals.mcatTarget}` : `${state.mcat.currentPhase ?? 'Plan not started'}`,
      progress: mcat ? percent(mcat, state.mcat.goalScore ?? state.goals.mcatTarget) : undefined,
      pace: mcat && mcat >= (state.mcat.goalScore ?? state.goals.mcatTarget)
        ? 'on track'
        : examDays != null ? `${Math.max(0, examDays)}d out` : 'no date',
      tone: mcat && mcat >= (state.mcat.goalScore ?? state.goals.mcatTarget) ? 'success' : 'warning',
    },
    hourRow('Clinical', 'clinical', state.goals.clinical, '/clinical', Stethoscope, 'var(--cat-clinical)'),
    hourRow('Volunteering', 'volunteering', state.goals.volunteering, '/volunteering', HeartHandshake, 'var(--cat-volunteer)'),
    hourRow('Shadowing', 'shadowing', state.goals.shadowing, '/shadowing', Telescope, 'var(--cat-shadow)'),
    {
      group: 'Experiences', label: 'Research', route: '/research', icon: Microscope, accent: 'var(--cat-research)',
      value: researchProjects ? `${researchProjects} ${researchProjects === 1 ? 'project' : 'projects'}` : 'Not started',
      pace: 'no goal', tone: 'neutral',
    },
    {
      group: 'Experiences', label: 'Extracurriculars', route: '/ecs', icon: Users, accent: 'var(--cat-activities)',
      value: `${activeOrgs} roles · ${leadershipRoles} leadership`,
      pace: 'no goal', tone: 'neutral',
    },
    {
      group: 'Application', label: 'School List', route: '/schools', icon: School, accent: 'var(--primary)',
      value: `${state.schools.length} schools · ${reachSchools} reach`,
      progress: state.schools.length ? Math.min(100, (state.schools.length / 12) * 100) : undefined,
      pace: state.schools.length ? 'building' : 'not started', tone: 'neutral',
    },
    {
      group: 'Application', label: 'Essays', route: '/essays', icon: BookOpen, accent: 'var(--cat-activities)',
      value: `${draftedStories} stories · ${submittedSecondaries}/${state.secondaries.length} submitted`,
      progress: state.secondaries.length ? percent(submittedSecondaries, state.secondaries.length) : undefined,
      pace: draftedStories ? 'in progress' : 'not started', tone: 'neutral',
    },
    {
      group: 'Application', label: 'Letters', route: '/letters', icon: Building2, accent: 'var(--cat-letters)',
      value: `${lettersReceived}/${activeLetters || 0} received`,
      progress: activeLetters ? percent(lettersReceived, activeLetters) : undefined,
      pace: activeLetters ? (lettersReceived >= activeLetters ? 'on track' : 'in progress') : 'not started',
      tone: lettersReceived >= activeLetters && activeLetters ? 'success' : 'neutral',
    },
  ]

  const exceptions = rows.filter((row) => row.tone === 'warning' || row.tone === 'danger')

  return (
    <Card className="h-full min-h-[34rem]" role="region" aria-labelledby="where-i-stand-heading">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle id="where-i-stand-heading" className="text-lg">Where I stand</CardTitle>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Honest state from each owning domain.</p>
        </div>
        <Badge variant={exceptions.length ? 'warning' : 'success'}>
          {exceptions.length ? `${exceptions.length} need a look` : 'On track'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {(['Foundation', 'Experiences', 'Application'] as const).map((group) => (
          <section key={group} aria-labelledby={`domain-${group}`}>
            <div className="mb-1 flex items-center gap-2">
              <h3 id={`domain-${group}`} className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{group}</h3>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-0.5">
              {rows.filter((row) => row.group === group).map((row) => <DomainStatusRow key={row.label} row={row} />)}
            </div>
          </section>
        ))}
        <PaceProjectionLine
          id="overview-domain-pace"
          insufficientLabel="Not enough dated activity yet to calculate an honest domain pace."
        />
      </CardContent>
    </Card>
  )
}

function DomainStatusRow({ row }: { row: DomainRow }) {
  const Icon = row.icon
  return (
    <Link
      to={row.route}
      aria-label={`${row.label}, ${row.value}, ${row.pace}`}
      className="group grid min-h-9 grid-cols-[1.5rem_minmax(5.5rem,.72fr)_minmax(8rem,1fr)_4.5rem] items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted/45"
    >
      <span className="grid size-6 place-items-center rounded-lg text-white shadow-sm" style={{ background: row.accent }}>
        <Icon className="size-3.5" />
      </span>
      <span className="truncate text-xs font-extrabold">{row.label}</span>
      <span className="min-w-0">
        <span className="block truncate text-right text-[11px] font-bold tabular-nums text-muted-foreground">{row.value}</span>
        {row.progress != null && (
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full" style={{ width: `${row.progress}%`, background: row.accent }} />
          </span>
        )}
      </span>
      <Badge
        variant={row.tone === 'success' ? 'success' : row.tone === 'warning' ? 'warning' : row.tone === 'danger' ? 'danger' : 'muted'}
        className="justify-center px-1.5 text-[9px]"
      >
        {row.pace}
      </Badge>
    </Link>
  )
}

const GPA_CHART = {
  cumulative: { label: 'Cumulative', color: 'var(--chart-1)' },
  science: { label: 'Science', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function GpaStatTile() {
  const courses = useStore((state) => state.courses)
  const series = termGpaSeries(courses)
  const stats = gpaStats(courses)
  const delta = series.length > 1 ? series.at(-1)!.cumulative - series.at(-2)!.cumulative : null

  const card = (
    <Card className="h-full min-h-48 transition-transform duration-200 hover:-translate-y-0.5" role="region" aria-label="GPA trend">
      <CardContent className="flex h-full flex-col p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Cumulative GPA</p>
        {!series.length ? (
          <MascotNote
            variant="empty-state"
            priority={30}
            title="Not enough graded work yet"
            actions={<Button asChild size="sm"><Link to="/academics">Open Academics</Link></Button>}
            className="mt-3 flex-1 items-center"
          >
            Record a grade first; a term trend appears only when there is real work to calculate.
          </MascotNote>
        ) : (
          <>
            <div className="mt-2 flex items-end gap-2">
              <NumberFlow value={stats.cum} format={(value) => value.toFixed(2)} className="font-display text-4xl font-extrabold text-[var(--cat-gpa)]" />
              {delta != null && <Badge variant={delta >= 0 ? 'success' : 'warning'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}</Badge>}
            </div>
            <ChartContainer config={GPA_CHART} className="mt-2 h-20 w-full aspect-auto">
              <LineChart data={series} margin={{ top: 6, right: 5, bottom: 4, left: 5 }}>
                <YAxis domain={[0, 4]} hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Line type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={3} dot={false} isAnimationActive />
                <Line type="monotone" dataKey="science" stroke="var(--color-science)" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
              </LineChart>
            </ChartContainer>
            <p className="mt-auto text-xs font-semibold text-muted-foreground">Science {fmtGpa(stats.science)} · {series.length} terms</p>
          </>
        )}
      </CardContent>
    </Card>
  )

  return series.length ? <Link to="/academics" className="block h-full">{card}</Link> : card
}

const MCAT_CHART = { score: { label: 'Score', color: 'var(--chart-2)' } } satisfies ChartConfig

export function McatStatTile() {
  const mcat = useStore((state) => state.mcat)
  const fallbackGoal = useStore((state) => state.goals.mcatTarget)
  const best = bestMcat(mcat)
  const goal = mcat.goalScore ?? fallbackGoal
  const normalized = best ? Math.max(0, Math.min(100, ((best - 472) / Math.max(1, goal - 472)) * 100)) : 0

  const card = (
    <Card className="h-full min-h-48 transition-transform duration-200 hover:-translate-y-0.5" role="region" aria-label="MCAT score against target">
      <CardContent className="grid h-full place-items-center p-4 text-center">
        {!best ? (
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
          <div className="relative size-36">
            <ChartContainer config={MCAT_CHART} className="size-36 aspect-square">
              <RadialBarChart data={[{ score: normalized }]} innerRadius={49} outerRadius={64} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="score" background fill="var(--color-score)" cornerRadius={10} />
              </RadialBarChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div>
                <NumberFlow value={best} className="font-display text-3xl font-extrabold" />
                <p className="text-xs font-semibold text-muted-foreground">of {goal}</p>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs font-semibold text-muted-foreground">MCAT · questions not tracked</p>
      </CardContent>
    </Card>
  )

  return best ? <Link to="/mcat" className="block h-full">{card}</Link> : card
}

export function HoursStatTile() {
  const experiences = useStore((state) => state.experiences)
  const totals = hourTotals(experiences)
  const rows = [
    { label: 'Clinical', value: totals.clinical, color: 'var(--cat-clinical)' },
    { label: 'Volunteer', value: totals.volunteering, color: 'var(--cat-volunteer)' },
    { label: 'Shadowing', value: totals.shadowing, color: 'var(--cat-shadow)' },
    { label: 'Research', value: totals.research, color: 'var(--cat-research)' },
    { label: 'Activities', value: totals.leadership, color: 'var(--cat-activities)' },
  ]
  const max = Math.max(1, ...rows.map((row) => row.value))
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <Card className="h-full min-h-48" role="region" aria-labelledby="hours-stat-heading">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle id="hours-stat-heading">Hours logged</CardTitle>
        <Badge variant="muted"><NumberFlow value={Math.round(total)} /> total</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.75rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
            <span className="font-bold text-muted-foreground">{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <m.span
                className="block h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                style={{ background: row.color }}
              />
            </span>
            <NumberFlow value={Math.round(row.value)} className="text-right font-display font-extrabold" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
