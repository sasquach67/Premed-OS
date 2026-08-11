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
import { Link } from 'react-router-dom'
import { PaceProjectionLine } from '@/components/common/PaceProjectionLine'
import { MascotNote } from '@/components/common/MascotNote'
import { NumberFlow } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { daysUntil } from '@/lib/date'
import { fmtGpa, gpaStats, hourTotals } from '@/lib/selectors'
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
}

export function WhereIStand() {
  const state = useStore()
  const gpa = gpaStats(state.courses)
  const hours = hourTotals(state.experiences)
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
    const current = hours[category]
    return {
      group: 'Experiences',
      label,
      route,
      icon,
      accent,
      value: `${Math.round(current)}/${goal} hrs`,
      state: current ? 'hours logged' : 'none logged',
    }
  }

  const rows: DomainRow[] = [
    {
      group: 'Foundation', label: 'Academics', route: '/academics', icon: GraduationCap, accent: 'var(--cat-gpa)',
      value: graded ? `${fmtGpa(gpa.cum)} cum · ${fmtGpa(gpa.science)} sci` : 'Not started',
      state: classSignals.length
        ? classSignals.join(' · ')
        : !graded ? 'not enough data' : 'record current',
    },
    {
      group: 'Foundation', label: 'MCAT', route: '/mcat', icon: Brain, accent: 'var(--cat-mcat)',
      value: latestMcat?.total ? `${latestMcat.total} recorded · goal ${state.mcat.goalScore ?? state.goals.mcatTarget}` : `${state.mcat.currentPhase ?? 'Plan not started'}`,
      state: examDays != null ? `${Math.max(0, examDays)}d out` : 'no date',
    },
    hourRow('Clinical', 'clinical', state.goals.clinical, '/clinical', Stethoscope, 'var(--cat-clinical)'),
    hourRow('Volunteering', 'volunteering', state.goals.volunteering, '/volunteering', HeartHandshake, 'var(--cat-volunteer)'),
    hourRow('Shadowing', 'shadowing', state.goals.shadowing, '/shadowing', Telescope, 'var(--cat-shadow)'),
    {
      group: 'Experiences', label: 'Research', route: '/research', icon: Microscope, accent: 'var(--cat-research)',
      value: researchProjects ? `${researchProjects} ${researchProjects === 1 ? 'project' : 'projects'}` : 'Not started',
      state: 'record count',
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
      aria-label={`${row.label}, ${row.value}, ${row.state}`}
      className="group grid min-h-9 grid-cols-[1.5rem_minmax(5.5rem,.72fr)_minmax(8rem,1fr)_4.5rem] items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted/45"
    >
      <span className="grid size-6 place-items-center rounded-lg text-white shadow-sm" style={{ background: row.accent }}>
        <Icon className="size-3.5" />
      </span>
      <span className="truncate text-xs font-extrabold">{row.label}</span>
      <span className="min-w-0">
        <span className="block truncate text-right text-[11px] font-bold tabular-nums text-muted-foreground">{row.value}</span>
      </span>
      <Badge variant="muted" className="justify-center px-1.5 text-[9px]">{row.state}</Badge>
    </Link>
  )
}

export function GpaStatTile() {
  const courses = useStore((state) => state.courses)
  const stats = gpaStats(courses)
  const graded = stats.credits > 0

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
            <div className="mt-2 flex items-end gap-2">
              <NumberFlow value={stats.cum} format={(value) => value.toFixed(2)} className="font-display text-4xl font-extrabold text-[var(--cat-gpa)]" />
            </div>
            <p className="mt-auto text-xs font-semibold text-muted-foreground">Science {fmtGpa(stats.science)} · {stats.credits} graded credits</p>
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
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/35 p-4"><NumberFlow value={recorded} className="font-display text-3xl font-extrabold" /><p className="text-xs font-semibold text-muted-foreground">Latest recorded</p></div>
            <div className="rounded-2xl bg-muted/35 p-4"><NumberFlow value={goal} className="font-display text-3xl font-extrabold" /><p className="text-xs font-semibold text-muted-foreground">Student-set target</p></div>
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
  const totals = hourTotals(experiences)
  /* Clinical, Volunteering and Research only (03-overview §6.5a, corrected
   * Aug 2026). Shadowing and Extracurriculars are excluded because their own
   * specs reject an hours-first metric: Shadowing's headline is coverage, not
   * total — "breadth is the metric, not volume" (05-shadowing §2, points 1-2)
   * — and on Extracurriculars "hours are the weakest signal here and are
   * never centered… must not be a headline metric, a goal, or a projection"
   * (07-extracurriculars §2, point 1). Drawing bars those pillars reject
   * makes the app contradict itself. */
  const rows = [
    { label: 'Clinical', value: totals.clinical, color: 'var(--cat-clinical)' },
    { label: 'Volunteer', value: totals.volunteering, color: 'var(--cat-volunteer)' },
    { label: 'Research', value: totals.research, color: 'var(--cat-research)' },
  ]
  const total = rows.reduce((sum, row) => sum + row.value, 0)

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
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 text-xs">
            <span className="font-bold text-muted-foreground">{row.label}</span>
            {row.value > 0
              ? <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: row.color }}><NumberFlow value={Math.round(row.value)} className="text-right font-display font-extrabold" /></m.span>
              : <span className="text-right font-semibold text-muted-foreground">—</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
