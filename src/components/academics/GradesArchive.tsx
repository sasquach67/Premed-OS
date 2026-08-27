import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calculator, ChevronRight, GraduationCap, Info, Plus } from 'lucide-react'
import type { Course, LetterGrade } from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { AMCAS_RULE_SNAPSHOT, buildGradeLedger, formatTruncatedGpa, projectGpa, type LedgerStatus } from '@/lib/academics/gradeLedger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible } from '@/components/common/Collapsible'
import { TermRollover } from '@/components/academics/TermRollover'
import { TermReportPanel } from '@/components/academics/TermReportPanel'
import { TranscriptRecordsPanel } from '@/components/academics/TranscriptRecordsPanel'
import { TranscriptIntake } from '@/components/academics/TranscriptIntake'
import { GradeDecisions } from '@/components/academics/GradeDecisions'
import { ForecastAccuracyPanel } from '@/components/academics/ForecastAccuracyPanel'
import { isSavedTermReportId } from '@/lib/academics/termReportRoute'
import './GradesArchive.css'

type ArchiveView = 'ledger' | 'gpa' | 'what-if'
type ScenarioRow = { id: string; title: string; credits: number; grade: LetterGrade; bcpm: boolean }
const VIEWS: Array<{ id: ArchiveView; label: string }> = [
  { id: 'ledger', label: 'Ledger' }, { id: 'gpa', label: 'GPA' }, { id: 'what-if', label: 'What-if' },
]
const GRADES: LetterGrade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

export function GradesArchive({ courses }: { courses: Course[] }) {
  const center = useStore((state) => state.academics.classCenter)
  const [params, setParams] = useSearchParams()
  const requested = params.get('gradeView')
  const view: ArchiveView = VIEWS.some((item) => item.id === requested) ? requested as ArchiveView : 'ledger'
  const requestedReportId = params.get('termReport')
  const reports = center.termReports ?? []
  const hasRequestedReport = isSavedTermReportId(requestedReportId, reports)
  const showReport = view === 'ledger' && hasRequestedReport
  const showForecastAccuracy = view === 'ledger' && params.get('forecastAccuracy') === '1'
  const invalidReportId = view === 'ledger' && Boolean(requestedReportId) && !hasRequestedReport
  const ledger = useMemo(() => buildGradeLedger(courses, center.transcriptRecords), [courses, center.transcriptRecords])

  if (!ledger.rows.length) return <TranscriptEmptyStart courses={courses} />

  function selectView(next: ArchiveView) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('gradeView', next)
      updated.delete('termReport')
      updated.delete('forecastAccuracy')
      return updated
    }, { replace: true })
  }

  return <section className="grades-workspace" aria-label="Grades and Archive">
    {/* Visual source: mockup-lab/01-academics/academics-grades-archive.html · Variant A, record-view toolbar. */}
    <div className="grades-view-bar">
      <div className="grades-view-tabs" role="tablist" aria-label="Grades and Archive view">
        {VIEWS.map((item) => <button key={item.id} role="tab" aria-selected={view === item.id} onClick={() => selectView(item.id)} className="grades-view-tab">{item.label}</button>)}
      </div>
      <p className="grades-view-context"><b>{view === 'ledger' ? 'The record' : view === 'gpa' ? 'Dual GPA' : 'Scenario mode'}</b> · {view === 'ledger' ? 'every recorded attempt, with archive as a filter' : view === 'gpa' ? 'UNC and AMCAS stay side by side' : 'scratch work that never changes the ledger'}</p>
    </div>
    {showForecastAccuracy && <ForecastAccuracyPanel predictions={center.retrievabilityPredictions ?? []} onBack={() => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.delete('forecastAccuracy')
        return updated
      })
    }} />}
    {showReport && !showForecastAccuracy && requestedReportId && <TermReportPanel focusReportId={requestedReportId} onBack={() => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.delete('termReport')
        return updated
      })
    }} onSelectReport={(reportId) => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.set('gradeView', 'ledger')
        updated.set('termReport', reportId)
        return updated
      })
    }} />}
    {view === 'ledger' && !showReport && !showForecastAccuracy && <LedgerView courses={courses} ledger={ledger} reports={reports} predictionCount={center.retrievabilityPredictions?.length ?? 0} invalidReportId={invalidReportId} onOpenForecastAccuracy={() => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.set('gradeView', 'ledger')
        updated.set('forecastAccuracy', '1')
        return updated
      })
    }} onOpenReport={(reportId) => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.set('gradeView', 'ledger')
        updated.set('termReport', reportId)
        return updated
      })
    }} />}
    {view === 'gpa' && <GpaView ledger={ledger} />}
    {view === 'what-if' && <WhatIfView courses={courses} ledger={ledger} />}
  </section>
}

/**
 * Visual source: mockup-lab/01-academics/academics-grades-archive.html
 * Approved target: Variant A · view=transcript-empty. This branch deliberately
 * precedes every ledger/GPA/What-if control so zero data never implies a record.
 */
function TranscriptEmptyStart({ courses }: { courses: Course[] }) {
  // 'closed' → 'intake' is the approved path: a transcript file has somewhere to
  // go before the manual grid, which is kept as an equal route rather than the
  // only one. Source: academics-grades-archive.html · view=transcript-intake.
  const [stage, setStage] = useState<'closed' | 'intake' | 'manual'>('closed')
  return <section className="grades-workspace grades-transcript-proto" aria-label="Grades and Archive transcript start">
    <div className="grades-transcript-shell">
      <article className="grades-transcript-card">
        {stage === 'closed' && <>
          <div className="grades-transcript-kicker">Grades &amp; Archive</div>
          <h2 className="grades-transcript-title">Start with one course line.</h2>
          <p className="grades-transcript-copy">Add the course as it appears on the transcript. No GPA, trend, or export is shown before there are records.</p>
          <div className="grades-transcript-actions">
            <button type="button" className="grades-transcript-button" data-primary="true" onClick={() => setStage('intake')}>Add a transcript record</button>
          </div>
        </>}
        {stage === 'intake' && <TranscriptIntake
          courses={courses}
          onManual={() => setStage('manual')}
          onCancel={() => setStage('closed')}
        />}
        {stage === 'manual' && <div className="grades-transcript-form">
          <div className="grades-transcript-actions">
            <button type="button" className="grades-transcript-button" onClick={() => setStage('intake')}>Back</button>
            <button type="button" className="grades-transcript-button" onClick={() => setStage('closed')}>Close entry</button>
          </div>
          {!courses.length && <p className="grades-transcript-course-note">This line will record the course it evidences if no planned course matches.</p>}
          <TranscriptRecordsPanel courses={courses} entryOnly />
        </div>}
      </article>
      <aside className="grades-transcript-card">
        <div className="grades-transcript-kicker">Partial record</div>
        <p className="grades-transcript-copy">A later institution or attempt can be added without replacing what you already entered.</p>
      </aside>
    </div>
  </section>
}


function LedgerView({
  courses, ledger, reports, predictionCount, invalidReportId, onOpenForecastAccuracy, onOpenReport,
}: {
  courses: Course[]
  ledger: ReturnType<typeof buildGradeLedger>
  reports: Array<{ id: string; term: string; status: string }>
  predictionCount: number
  invalidReportId: boolean
  onOpenForecastAccuracy: () => void
  onOpenReport: (reportId: string) => void
}) {
  const center = useStore((state) => state.academics.classCenter)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LedgerStatus>('all')
  const normalized = query.trim().toLowerCase()
  const visible = ledger.rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status
    const text = `${row.institution} ${row.courseNumberExact} ${row.titleExact} ${row.term} ${row.year}`.toLowerCase()
    return matchesStatus && (!normalized || text.includes(normalized))
  })
  const groups = groupRows(visible)
  return <>
    <div className="grades-ledger-filters">
      <Input aria-label="Search coursework" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the ledger" className="grades-search" />
      <Select value={status} onValueChange={(next) => setStatus(next as typeof status)}><SelectTrigger className="grades-status-select w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All records</SelectItem><SelectItem value="complete">Completed</SelectItem><SelectItem value="in-progress">In progress</SelectItem><SelectItem value="repeat">Repeat</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem><SelectItem value="needs-details">Needs details</SelectItem></SelectContent></Select>
      {reports.length > 0 && <Button size="sm" variant="ghost" className="h-9" onClick={() => onOpenReport(reports.at(-1)!.id)}>Term reports <span className="ml-1 text-xs text-muted-foreground">{reports.length}</span></Button>}
      {predictionCount > 0 && <Button size="sm" variant="ghost" className="h-9" onClick={onOpenForecastAccuracy}>Forecast accuracy</Button>}
      <Badge variant="outline" className="grades-record-count">{visible.length} record{visible.length === 1 ? '' : 's'}</Badge>
    </div>
    {invalidReportId && <Card><CardContent className="p-4 text-sm font-semibold text-muted-foreground">That saved term report is no longer available. You’re viewing your ledger instead.</CardContent></Card>}
    <div className="space-y-3">
      {groups.map(([key, rows]) => <Card key={key} className="grades-term-card"><CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>{key}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Exact transcript strings stay separate from your class workspace name.</p></div><Badge variant="outline">{rows.length} course{rows.length === 1 ? '' : 's'}</Badge></CardHeader><CardContent>
        {rows.map((row) => <div key={row.id} className="grades-ledger-row"><div className="min-w-0"><p className="font-display font-extrabold">{row.courseNumberExact} · {row.titleExact}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{row.institution} · {row.creditsExact || 'Credits not entered'} · {row.gradeExact || 'Grade not entered'}</p></div><div className="flex flex-wrap gap-1.5"><LedgerBadge status={row.status} />{row.bcpm === true && <Badge variant="outline">BCPM evidence recorded</Badge>}{row.bcpm == null && <Badge variant="outline">Classification not recorded</Badge>}</div><Link className="inline-flex items-center gap-1 text-sm font-extrabold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/academics/classes/${row.courseId}?classTab=assignments`}>Open class <ChevronRight className="size-4" /></Link></div>)}
      </CardContent></Card>)}
      {!groups.length && <Card><CardContent className="p-5 text-sm font-semibold text-muted-foreground">No coursework matches that filter.</CardContent></Card>}
    </div>
    <Collapsible title="Transcript record tools"><div className="space-y-4"><TranscriptImportRoute courses={courses} /><TranscriptRecordsPanel courses={courses} /><TermRollover />{courses.filter((course) => course.status === 'in-progress').map((course) => <GradeDecisions key={course.id} course={course} assignments={center.assignments.filter((item) => item.courseId === course.id)} categories={center.gradeCategories.filter((item) => item.courseId === course.id)} mistakes={center.mistakes.filter((item) => item.courseId === course.id)} />)}</div></Collapsible>
  </>
}

function GpaView({ ledger }: { ledger: ReturnType<typeof buildGradeLedger> }) {
  if (ledger.local.value == null && ledger.amcas.value == null) return <Card><CardContent className="p-6 text-center"><GraduationCap className="mx-auto size-6 text-primary" /><p className="mt-3 font-display text-lg font-extrabold">Record graded coursework to compare your UNC and AMCAS GPA.</p><p className="mt-1 text-sm text-muted-foreground">The app will stay quiet rather than show a zero where no record exists.</p></CardContent></Card>
  const deltaText = ledger.delta == null ? 'Add transcript-faithful graded coursework to explain the difference between the two calculations.' : Math.abs(ledger.delta) < .005 ? 'The recorded local and AMCAS preview currently agree.' : `The difference reflects the records each calculation can currently support — review all institutions, attempts, and classification evidence.`
  return <div className="space-y-4"><div className="grades-gpa-grid grid lg:grid-cols-2"><GpaCard title="UNC / in-residence GPA" value={ledger.local.value} sub={`${ledger.local.credits} graded credits from completed in-residence courses`} /><GpaCard title="AMCAS preview" value={ledger.amcas.value} amcas sub={ledger.amcas.reason ?? `${ledger.amcas.credits} transcript-faithful graded credits · truncates, never rounds`} /></div>
    <Card><CardContent className="p-4"><div className="flex gap-3"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><div className="text-sm font-semibold text-muted-foreground"><p className="font-extrabold text-foreground">Why these can differ</p><p className="mt-1">{deltaText}</p><p className="mt-2 text-xs">{AMCAS_RULE_SNAPSHOT.label} · checked {AMCAS_RULE_SNAPSHOT.checkedOn} · <a className="text-primary underline underline-offset-2" href={AMCAS_RULE_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">official guide</a>. {AMCAS_RULE_SNAPSHOT.reminder}</p></div></div></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Academic-year trend</CardTitle><p className="text-sm text-muted-foreground">Only transcript-faithful, eligible attempts appear here; no year is inferred.</p></CardHeader><CardContent>{ledger.trend.length ? <Trend trend={ledger.trend} /> : <p className="rounded-[13px] border border-dashed border-[var(--border)] p-4 text-sm font-semibold text-muted-foreground">Record year and grade details before an academic-year trend can appear.</p>}</CardContent></Card><Card><CardHeader><CardTitle>AMCAS breakdown</CardTitle></CardHeader><CardContent className="grid gap-3"><Metric label="BCPM" value={formatTruncatedGpa(ledger.amcas.scienceValue)} detail={ledger.amcas.scienceValue == null ? 'Classification evidence needed' : `${ledger.amcas.scienceCredits} classified credits`} /><Metric label="All other" value={formatTruncatedGpa(ledger.amcas.allOtherValue)} detail={ledger.amcas.allOtherValue == null ? 'No classified records yet' : `${ledger.amcas.allOtherCredits} classified credits`} />{ledger.amcas.unclassifiedCount > 0 && <p className="text-xs font-semibold text-muted-foreground">{ledger.amcas.unclassifiedCount} record{ledger.amcas.unclassifiedCount === 1 ? '' : 's'} lacks classification evidence and is excluded from the BCPM/AO split, not guessed.</p>}</CardContent></Card></div>
  </div>
}

function WhatIfView({ courses, ledger }: { courses: Course[]; ledger: ReturnType<typeof buildGradeLedger> }) {
  const [rows, setRows] = useState<ScenarioRow[]>([])
  const [courseId, setCourseId] = useState(courses.find((course) => course.status === 'in-progress')?.id ?? '')
  const scenario = useMemo(() => projectGpa(ledger.local, rows), [ledger.local, rows])
  const amcasScenario = useMemo(() => ledger.amcas.value == null ? null : projectGpa(ledger.amcas, rows), [ledger.amcas, rows])
  const selectedCourse = courses.find((course) => course.id === courseId)
  function addRow() { setRows((current) => [...current, { id: uid(), title: 'Hypothetical course', credits: 3, grade: 'A', bcpm: true }]) }
  return <div className="space-y-4"><Card><CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Term scenario</CardTitle><p className="mt-1 text-sm text-muted-foreground">Scratch work only. Nothing here changes your coursework record.</p></div><Button size="sm" onClick={addRow}><Plus className="size-4" /> Add assumption</Button></CardHeader><CardContent className="space-y-3">{!rows.length ? <p className="rounded-[13px] border border-dashed border-[var(--border)] p-4 text-sm font-semibold text-muted-foreground">Add an in-progress course and its grade categories to try a scenario.</p> : rows.map((row) => <div key={row.id} className="grid gap-2 rounded-[13px] border border-[var(--border)] bg-[var(--muted)] p-3 sm:grid-cols-[minmax(0,1fr)_90px_100px_auto_auto] sm:items-center"><Input aria-label="Hypothetical course name" value={row.title} onChange={(event) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, title: event.target.value } : item))} className="bg-[var(--card)]" /><Input aria-label="Hypothetical credits" type="number" min={.5} step={.5} value={row.credits} onChange={(event) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, credits: Number(event.target.value) || 0 } : item))} className="bg-[var(--card)]" /><Select value={row.grade} onValueChange={(grade) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, grade: grade as LetterGrade } : item))}><SelectTrigger className="bg-[var(--card)]"><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((grade) => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}</SelectContent></Select><Button size="sm" variant={row.bcpm ? 'default' : 'outline'} onClick={() => setRows((items) => items.map((item) => item.id === row.id ? { ...item, bcpm: !item.bcpm } : item))}>{row.bcpm ? 'BCPM' : 'All other'}</Button><Button size="sm" variant="ghost" onClick={() => setRows((items) => items.filter((item) => item.id !== row.id))}>Remove</Button></div>)}
        {rows.length > 0 && <div className="grid gap-3 sm:grid-cols-2"><Metric label="Local projected cumulative" value={formatLocalGpa(scenario.value)} detail="Scenario is not saved" /><Metric label="AMCAS projected cumulative" value={formatTruncatedGpa(amcasScenario?.value ?? null)} detail={ledger.amcas.value == null ? 'Needs transcript-faithful baseline records' : 'Uses the same current rule snapshot'} /></div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>What do I need in one class?</CardTitle><p className="mt-1 text-sm text-muted-foreground">The full category and weight calculator has one home: that course’s Assignments tab.</p></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center"><Select value={courseId} onValueChange={setCourseId}><SelectTrigger className="bg-[var(--muted)]"><SelectValue placeholder="Select an in-progress course" /></SelectTrigger><SelectContent>{courses.filter((course) => course.status === 'in-progress').map((course) => <SelectItem key={course.id} value={course.id}>{course.code || 'Course'} · {course.title || 'Untitled course'}</SelectItem>)}</SelectContent></Select>{selectedCourse ? <Button asChild><Link to={`/academics/classes/${selectedCourse.id}?classTab=assignments&whatIf=1`}><Calculator className="size-4" /> Open {selectedCourse.code || 'class'} calculator</Link></Button> : <p className="text-sm font-semibold text-muted-foreground">Choose an in-progress course to use recorded weights and assignments.</p>}</CardContent></Card>
  </div>
}

function GpaCard({ title, value, sub, amcas = false }: { title: string; value: number | null; sub: string; amcas?: boolean }) {
  return <Card className={cn('grades-gpa-card', amcas && 'border-[#c9a4e8]/40')}><CardContent className="p-5"><p className="text-xs font-extrabold uppercase tracking-[.09em] text-muted-foreground">{title}</p><p className={cn('mt-2 font-display text-5xl font-extrabold tabular-nums', amcas && 'text-[#c9a4e8]')}>{amcas ? formatTruncatedGpa(value) : formatLocalGpa(value)}</p><p className="mt-2 text-sm font-semibold text-muted-foreground">{sub}</p></CardContent></Card>
}

function formatLocalGpa(value: number | null) { return value == null ? '—' : value.toFixed(2) }

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-[13px] border border-[var(--border)] bg-[var(--muted)] p-4"><p className="text-xs font-extrabold uppercase tracking-[.08em] text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{detail}</p></div>
}

function LedgerBadge({ status }: { status: LedgerStatus }) {
  const label: Record<LedgerStatus, string> = { complete: 'Completed', 'in-progress': 'In progress', withdrawn: 'Withdrawn', repeat: 'Repeat — kept', 'needs-details': 'Needs details' }
  return <Badge variant={status === 'withdrawn' || status === 'needs-details' ? 'outline' : status === 'repeat' ? 'secondary' : 'success'}>{label[status]}</Badge>
}

function Trend({ trend }: { trend: Array<{ academicYear: string; value: number; partial: boolean }> }) {
  const floor = Math.min(...trend.map((item) => item.value), 4)
  const ceiling = Math.max(...trend.map((item) => item.value), floor + .1)
  const points = trend.map((item, index) => `${trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100},${100 - ((item.value - floor) / (ceiling - floor || 1)) * 80 - 10}`).join(' ')
  return <div><svg viewBox="0 0 100 100" className="h-40 w-full" role="img" aria-label="Academic-year GPA trend"><polyline fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />{trend.map((item, index) => <circle key={item.academicYear} cx={trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100} cy={100 - ((item.value - floor) / (ceiling - floor || 1)) * 80 - 10} r="3.5" fill="var(--primary)" />)}</svg><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{trend.map((item) => <div key={item.academicYear} className="rounded-[13px] bg-[var(--muted)] p-3 text-center"><p className="font-display font-extrabold tabular-nums">{formatTruncatedGpa(item.value)}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{item.academicYear}{item.partial ? ' · partial' : ''}</p></div>)}</div></div>
}

function groupRows(rows: ReturnType<typeof buildGradeLedger>['rows']) {
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const label = [row.term, row.year, row.institution].filter(Boolean).join(' · ') || 'Term not recorded'
    grouped.set(label, [...(grouped.get(label) ?? []), row])
  }
  return [...grouped.entries()]
}

/**
 * The same intake, reachable once records exist. Importing a transcript is not a
 * first-run-only act: a student adds a term, or a second institution, later —
 * and this is the only route on which duplicate detection can actually fire.
 */
function TranscriptImportRoute({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return <div className="grades-transcript-actions">
      <button type="button" className="grades-transcript-button" data-primary="true" onClick={() => setOpen(true)}>
        Import a transcript
      </button>
    </div>
  }
  return <TranscriptIntake
    courses={courses}
    onManual={() => setOpen(false)}
    onCancel={() => setOpen(false)}
    onSaved={() => setOpen(false)}
  />
}
