import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calculator, ChevronRight, Download, GraduationCap, Info, Plus, Save } from 'lucide-react'
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
import { isSavedTermReportId } from '@/lib/academics/termReportRoute'
import { courseworkExport } from '@/lib/academics/evidence'
import { termToMonths } from '@/lib/academics/mcatTiming'
import './GradesArchive.css'

type ArchiveView = 'ledger' | 'gpa' | 'what-if'
type ScenarioRow = { id: string; courseId?: string; title: string; credits: number; grade: LetterGrade; bcpm: boolean }
const VIEWS: Array<{ id: ArchiveView; label: string }> = [
  { id: 'ledger', label: 'Ledger' }, { id: 'gpa', label: 'GPA' }, { id: 'what-if', label: 'What-if' },
]
const GRADES: LetterGrade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
const QUICK_SCENARIO_GRADES: LetterGrade[] = ['A', 'A-', 'B+', 'B']

export function GradesArchive({ courses }: { courses: Course[] }) {
  const center = useStore((state) => state.academics.classCenter)
  const [params, setParams] = useSearchParams()
  const requested = params.get('gradeView')
  const view: ArchiveView = VIEWS.some((item) => item.id === requested) ? requested as ArchiveView : 'ledger'
  const requestedReportId = params.get('termReport')
  const reports = center.termReports ?? []
  const hasRequestedReport = isSavedTermReportId(requestedReportId, reports)
  const showReport = view === 'ledger' && hasRequestedReport
  const invalidReportId = view === 'ledger' && Boolean(requestedReportId) && !hasRequestedReport
  const ledger = useMemo(() => buildGradeLedger(courses, center.transcriptRecords), [courses, center.transcriptRecords])

  if (!ledger.rows.length) return <TranscriptEmptyStart courses={courses} initialStage={params.get('transcript') === 'intake' ? 'intake' : 'closed'} />

  function selectView(next: ArchiveView) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('gradeView', next)
      updated.delete('termReport')
      updated.delete('forecastAccuracy')
      return updated
    }, { replace: true })
  }

  function exportCurrentView() {
    if (view === 'what-if') return
    const payload = view === 'ledger'
      ? { notice: 'Student-controlled coursework export. Not an official transcript, registrar document, application submission, or degree audit.', coursework: courseworkExport(center.transcriptRecords) }
      : { notice: 'Student-controlled GPA preview. Verify classifications and every attempt against the current official application guide.', local: ledger.local, amcas: ledger.amcas, trend: ledger.trend, ruleSnapshot: AMCAS_RULE_SNAPSHOT }
    downloadJson(payload, view === 'ledger' ? 'premed-os-coursework.json' : 'premed-os-gpa-preview.json')
  }

  return <section className="grades-workspace" aria-label="Grades and Archive">
    {/* Visual source: mockup-lab/01-academics/academics-grades-archive.html · Variant A, record-view toolbar. */}
    <div className="grades-view-bar">
      <div className="grades-view-tabs" role="tablist" aria-label="Grades and Archive view">
        {VIEWS.map((item) => <button key={item.id} role="tab" aria-selected={view === item.id} onClick={() => selectView(item.id)} className="grades-view-tab">{item.label}</button>)}
      </div>
      <p className="grades-view-context"><b>{view === 'ledger' ? 'The record' : view === 'gpa' ? 'Dual GPA' : 'Scenario mode'}</b> · {view === 'ledger' ? 'every recorded attempt, with archive as a filter' : view === 'gpa' ? 'UNC and AMCAS stay side by side' : 'scratch work that never changes the ledger'}</p>
      {view !== 'what-if' && <button type="button" className="grades-export-button" onClick={exportCurrentView}><Download className="size-3.5" /> {view === 'ledger' ? 'Export transcript' : 'Export GPA report'}</button>}
    </div>
    {showReport && requestedReportId && <TermReportPanel focusReportId={requestedReportId} onBack={() => {
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
    {view === 'ledger' && !showReport && <LedgerView courses={courses} ledger={ledger} reports={reports} invalidReportId={invalidReportId} openTranscriptIntake={params.get('transcript') === 'intake'} onOpenReport={(reportId) => {
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

function downloadJson(payload: unknown, fileName: string) {
  const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  link.click()
  URL.revokeObjectURL(href)
}

/**
 * Visual source: mockup-lab/01-academics/academics-grades-archive.html
 * Approved target: Variant A · view=transcript-empty. This branch deliberately
 * precedes every ledger/GPA/What-if control so zero data never implies a record.
 */
function TranscriptEmptyStart({ courses, initialStage = 'closed' }: { courses: Course[]; initialStage?: 'closed' | 'intake' }) {
  // 'closed' → 'intake' is the approved path: a transcript file has somewhere to
  // go before the manual grid, which is kept as an equal route rather than the
  // only one. Source: academics-grades-archive.html · view=transcript-intake.
  const [stage, setStage] = useState<'closed' | 'intake' | 'manual'>(initialStage)
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
  courses, ledger, reports, invalidReportId, openTranscriptIntake, onOpenReport,
}: {
  courses: Course[]
  ledger: ReturnType<typeof buildGradeLedger>
  reports: Array<{ id: string; term: string; status: string }>
  invalidReportId: boolean
  openTranscriptIntake: boolean
  onOpenReport: (reportId: string) => void
}) {
  const center = useStore((state) => state.academics.classCenter)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LedgerStatus>('all')
  const openableCourseIds = useMemo(
    () => new Set(center.workspaces.map((workspace) => workspace.courseId)),
    [center.workspaces],
  )
  const normalized = query.trim().toLowerCase()
  const visible = ledger.rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status
    const text = `${row.institution} ${row.courseNumberExact} ${row.titleExact} ${row.term} ${row.year}`.toLowerCase()
    return matchesStatus && (!normalized || text.includes(normalized))
  })
  const groups = groupRows(visible)
  const totalCredits = visible.reduce((sum, row) => sum + (Number.parseFloat(row.creditsExact) || 0), 0)
  const bcpmCredits = visible.filter((row) => row.bcpm === true).reduce((sum, row) => sum + (Number.parseFloat(row.creditsExact) || 0), 0)
  return <>
    {openTranscriptIntake && <TranscriptImportRoute courses={courses} initialStage="intake" />}
    <div className="grades-ledger-filters">
      <div className="grades-ledger-status" role="group" aria-label="Filter transcript status">
        {([['all', 'All'], ['needs-details', 'Needs details'], ['complete', 'Completed'], ['in-progress', 'In progress'], ['withdrawn', 'Withdrawn'], ['repeat', 'Superseded / repeat']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{label}<span>{value === 'all' ? ledger.rows.length : ledger.rows.filter((row) => row.status === value).length}</span></button>)}
      </div>
      <Input aria-label="Search coursework" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the ledger" className="grades-search" />
      {reports.length > 0 && <Button size="sm" variant="ghost" className="h-9" onClick={() => onOpenReport(reports.at(-1)!.id)}>Term reports <span className="ml-1 text-xs text-muted-foreground">{reports.length}</span></Button>}
      <Badge variant="outline" className="grades-record-count">{visible.length} record{visible.length === 1 ? '' : 's'}</Badge>
    </div>
    {invalidReportId && <Card><CardContent className="p-4 text-sm font-semibold text-muted-foreground">That saved term report is no longer available. You’re viewing your ledger instead.</CardContent></Card>}
    <section className="grades-record-hero" aria-label="Transcript record summary">
      <div><span>The record</span><b>{visible.length} courses · {formatCredits(totalCredits)} credits · {groups.length} term{groups.length === 1 ? '' : 's'}</b></div>
      <div><span>Counting toward AMCAS BCPM</span><b>{formatCredits(bcpmCredits)} credits</b></div>
    </section>
    <div className="space-y-3">
      {groups.map(([key, rows]) => {
        const summary = ledgerTermSummary(rows)
        return <Card key={key} className="grades-term-card"><CardHeader className="grades-term-header"><div><CardTitle>{key}</CardTitle><p>{summary.complete ? 'completed' : 'in progress'} · {formatCredits(summary.credits)} credits{summary.repeatCount ? ` · ${summary.repeatCount} repeated attempt${summary.repeatCount === 1 ? '' : 's'}` : ''}</p></div><div className="grades-term-stats">{summary.gpa != null && <div><b>{summary.gpa.toFixed(2)}</b><span>term GPA</span></div>}{summary.bcpmGpa != null && <div data-bcpm="true"><b>{summary.bcpmGpa.toFixed(2)}</b><span>term BCPM</span></div>}</div></CardHeader><CardContent>
          <div className="grades-ledger-table" role="table" aria-label={`${key} transcript rows`}>
            {['Course', 'Title — as printed', 'Credits', 'Grade', 'AMCAS', 'Status'].map((label) => <div key={label} className="grades-ledger-heading" role="columnheader">{label}</div>)}
            {rows.map((row) => <div key={row.id} className="grades-ledger-table-row" role="row">
              <div className="grades-ledger-cell grades-ledger-code" role="cell">{row.courseNumberExact || 'Not entered'}</div>
              <div className="grades-ledger-cell grades-ledger-title" role="cell">{row.courseId && openableCourseIds.has(row.courseId)
                ? <Link to={`/academics/classes/${row.courseId}?classTab=assignments`}>{row.titleExact || 'Title not entered'}<ChevronRight className="size-3.5" /></Link>
                : <span>{row.titleExact || 'Title not entered'}</span>}<small>{row.institution}</small></div>
              <div className="grades-ledger-cell grades-ledger-number" role="cell">{row.creditsExact || '—'}</div>
              <div className="grades-ledger-cell grades-ledger-number" role="cell">{row.gradeExact || '—'}</div>
              <div className="grades-ledger-cell" role="cell">{row.bcpm === true ? <Badge variant="outline">BCPM</Badge> : row.bcpm === false ? <Badge variant="outline">Other</Badge> : <Badge variant="outline">Unclassified</Badge>}</div>
              <div className="grades-ledger-cell" role="cell"><LedgerBadge status={row.status} /></div>
            </div>)}
          </div>
        </CardContent></Card>
      })}
      {!groups.length && <Card><CardContent className="p-5 text-sm font-semibold text-muted-foreground">No coursework matches that filter.</CardContent></Card>}
    </div>
    <Collapsible title="Transcript record tools"><div className="space-y-4"><TranscriptImportRoute courses={courses} /><TranscriptRecordsPanel courses={courses} /><TermRollover />{courses.filter((course) => course.status === 'in-progress').map((course) => <GradeDecisions key={course.id} course={course} assignments={center.assignments.filter((item) => item.courseId === course.id)} categories={center.gradeCategories.filter((item) => item.courseId === course.id)} />)}</div></Collapsible>
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
  const workspaces = useStore((state) => state.academics.classCenter.workspaces)
  const gradeCategories = useStore((state) => state.academics.classCenter.gradeCategories)
  const openableCourseIds = useMemo(() => new Set(workspaces.map((workspace) => workspace.courseId)), [workspaces])
  const termOptions = useMemo(() => [...new Set(courses.filter((course) => course.status === 'in-progress').map((course) => course.term).filter(Boolean))], [courses])
  const [activeTerm, setActiveTerm] = useState(termOptions[0] ?? '')
  const termCourses = useMemo(
    () => courses.filter((course) => course.status === 'in-progress' && (!activeTerm || course.term === activeTerm)),
    [activeTerm, courses],
  )
  const calculatorCourses = useMemo(
    () => termCourses.filter((course) => openableCourseIds.has(course.id)),
    [openableCourseIds, termCourses],
  )
  const initialRows = useMemo(() => termCourses.map((course) => ({ id: `scenario-${course.id}`, courseId: course.id, title: `${course.code} · ${course.title}`, credits: course.credits, grade: 'A' as LetterGrade, bcpm: course.bcpm })), [termCourses])
  const [rows, setRows] = useState<ScenarioRow[]>(initialRows)
  const [courseId, setCourseId] = useState(calculatorCourses[0]?.id ?? '')
  useEffect(() => setRows(initialRows), [initialRows])
  useEffect(() => setCourseId(calculatorCourses[0]?.id ?? ''), [calculatorCourses])
  const scenario = useMemo(() => projectGpa(ledger.local, rows), [ledger.local, rows])
  const amcasScenario = useMemo(() => ledger.amcas.value == null ? null : projectGpa(ledger.amcas, rows), [ledger.amcas, rows])
  const selectedCourse = courses.find((course) => course.id === courseId)
  const policyRows = useMemo(() => {
    const ids = new Set(termCourses.map((course) => course.id))
    return gradeCategories.filter((category) => ids.has(category.courseId) && (
      Boolean(category.policyNote) || category.dropLowestCount != null || category.replacementRule != null || category.curvePublished != null
    ))
  }, [gradeCategories, termCourses])
  function addRow() { setRows((current) => [...current, { id: uid(), title: 'Hypothetical course', credits: 3, grade: 'A', bcpm: true }]) }
  const assumption = rows.map((row) => row.grade).join(' · ')
  const localChange = ledger.local.value != null && scenario.value != null ? scenario.value - ledger.local.value : null
  const amcasChange = ledger.amcas.value != null && amcasScenario?.value != null ? amcasScenario.value - ledger.amcas.value : null
  function saveScenario() {
    downloadJson({
      notice: 'Student-owned What-if scratch work. This file does not change coursework, an official transcript, or an application GPA.',
      term: activeTerm || 'In-progress courses',
      savedAt: new Date().toISOString(),
      assumptions: rows.map(({ id: _id, ...row }) => row),
      projection: { local: scenario, amcas: amcasScenario },
    }, 'premed-os-grade-scenario.json')
  }
  return <div className="space-y-4">
    <section className="grades-whatif-toolbar" aria-label="Scenario controls">
      <div><b>What-if scenario</b><span>Scratch work only · coursework stays unchanged</span></div>
      {termOptions.length > 0 && <Select value={activeTerm} onValueChange={setActiveTerm}><SelectTrigger aria-label="Scenario term" className="grades-whatif-term"><SelectValue /></SelectTrigger><SelectContent>{termOptions.map((term) => <SelectItem key={term} value={term}>{term}</SelectItem>)}</SelectContent></Select>}
      <Badge variant="outline">{termCourses.length} course{termCourses.length === 1 ? '' : 's'} in progress</Badge>
      <Button size="sm" onClick={saveScenario} disabled={!rows.length}><Save className="size-4" /> Save scenario</Button>
    </section>
    {rows.length > 0 && <section className="grades-whatif-hero" aria-label="Scenario result"><div className="grades-whatif-hero-top"><div><span>If {activeTerm || 'this term'} goes {assumption}</span><b>AMCAS cumulative lands at {formatTruncatedGpa(amcasScenario?.value ?? null)}</b></div><div><span>Change from today</span><b>{amcasChange == null ? '—' : `${amcasChange >= 0 ? '+' : ''}${amcasChange.toFixed(2)}`}</b></div></div><div className="grades-whatif-results"><Metric label="AMCAS cumulative" value={formatTruncatedGpa(amcasScenario?.value ?? null)} detail={amcasChange == null ? 'Needs a transcript-faithful baseline' : `${amcasChange >= 0 ? '+' : ''}${amcasChange.toFixed(2)} from today`} /><Metric label="AMCAS BCPM" value={formatTruncatedGpa(amcasScenario?.scienceValue ?? null)} detail="Scenario only" /><Metric label="UNC cumulative" value={formatLocalGpa(scenario.value)} detail={localChange == null ? 'Needs a completed-course baseline' : `${localChange >= 0 ? '+' : ''}${localChange.toFixed(2)} from today`} /></div></section>}
    <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
      <Card><CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Assume a grade</CardTitle><p className="mt-1 text-sm text-muted-foreground">{activeTerm || 'In-progress courses'} · {rows.reduce((sum, row) => sum + row.credits, 0)} credits</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setRows(initialRows)}>Reset</Button><Button size="sm" onClick={addRow}><Plus className="size-4" /> Add assumption</Button></div></CardHeader><CardContent className="space-y-3">{!rows.length ? <p className="rounded-[13px] border border-dashed border-[var(--border)] p-4 text-sm font-semibold text-muted-foreground">Add an in-progress course to this term before testing a scenario.</p> : rows.map((row) => <div key={row.id} className="grades-whatif-row">{row.courseId ? <div className="grades-whatif-course"><b>{row.title}</b><span>{row.credits} credits · {row.bcpm ? 'BCPM' : 'All other'}</span></div> : <Input aria-label="Hypothetical course name" value={row.title} onChange={(event) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, title: event.target.value } : item))} className="bg-[var(--card)]" />}<Input aria-label="Hypothetical credits" type="number" min={.5} step={.5} value={row.credits} readOnly={Boolean(row.courseId)} onChange={(event) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, credits: Number(event.target.value) || 0 } : item))} className="bg-[var(--card)]" /><div className="grades-whatif-grade-picks" aria-label={`Quick grades for ${row.title}`}>{QUICK_SCENARIO_GRADES.map((grade) => <button key={grade} type="button" aria-pressed={row.grade === grade} onClick={() => setRows((items) => items.map((item) => item.id === row.id ? { ...item, grade } : item))}>{grade}</button>)}</div><Select value={row.grade} onValueChange={(grade) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, grade: grade as LetterGrade } : item))}><SelectTrigger aria-label={`Assumed grade for ${row.title}`} className="grades-whatif-grade-select"><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((grade) => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}</SelectContent></Select><Button size="sm" variant={row.bcpm ? 'default' : 'outline'} disabled={Boolean(row.courseId)} onClick={() => setRows((items) => items.map((item) => item.id === row.id ? { ...item, bcpm: !item.bcpm } : item))}>{row.bcpm ? 'BCPM' : 'All other'}</Button><Button size="sm" variant="ghost" onClick={() => setRows((items) => items.filter((item) => item.id !== row.id))}>Remove</Button></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>What do I need?</CardTitle><p className="mt-1 text-sm text-muted-foreground">Open the course’s weight-aware calculator for an exact target.</p></CardHeader><CardContent className="flex flex-col gap-3">{calculatorCourses.length ? <><Select value={courseId} onValueChange={setCourseId}><SelectTrigger className="bg-[var(--muted)]"><SelectValue placeholder="Select an active class" /></SelectTrigger><SelectContent>{calculatorCourses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code || 'Course'} · {course.title || 'Untitled course'}</SelectItem>)}</SelectContent></Select>{selectedCourse && openableCourseIds.has(selectedCourse.id) ? <Button asChild><Link to={`/academics/classes/${selectedCourse.id}?classTab=assignments&whatIf=1`}><Calculator className="size-4" /> Open {selectedCourse.code || 'class'} calculator</Link></Button> : null}</> : <p className="text-sm font-semibold text-muted-foreground">Add or open an active class in Class Center before using its category calculator.</p>}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Syllabus policies in this calculation</CardTitle><p className="mt-1 text-sm text-muted-foreground">Only recorded course policies appear; curves are named but never predicted.</p></CardHeader><CardContent className="space-y-2">{policyRows.length ? policyRows.map((category) => {
      const course = courses.find((item) => item.id === category.courseId)
      const applied = Boolean((category.dropLowestCount ?? 0) > 0 || category.replacementRule)
      return <div key={category.id} className="grades-whatif-policy"><span><b>{course?.code || 'Course'} · {category.name}</b>{category.policyNote ? ` — ${category.policyNote}` : ''}</span><Badge variant={category.curvePublished ? 'warning' : applied ? 'success' : 'outline'}>{category.curvePublished ? 'not modeled' : applied ? 'applied' : 'recorded'}</Badge></div>
    }) : <p className="rounded-[13px] border border-dashed border-[var(--border)] p-4 text-sm font-semibold text-muted-foreground">No syllabus grade policies are recorded for {activeTerm || 'these courses'}.</p>}</CardContent></Card>
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
    const recordedTerm = row.term.trim()
    const recordedYear = row.year.trim()
    const termLabel = recordedTerm || recordedYear
      ? [recordedTerm || 'Term not recorded', recordedYear || 'Year not recorded'].join(' · ')
      : 'Term and year not recorded'
    const label = row.institution.trim() ? `${termLabel} · ${row.institution}` : termLabel
    grouped.set(label, [...(grouped.get(label) ?? []), row])
  }
  return [...grouped.entries()].sort(([, a], [, b]) => {
    const aMonths = termToMonths([a[0]?.term, a[0]?.year].filter(Boolean).join(' '))
    const bMonths = termToMonths([b[0]?.term, b[0]?.year].filter(Boolean).join(' '))
    if (aMonths == null && bMonths == null) return 0
    if (aMonths == null) return 1
    if (bMonths == null) return -1
    return bMonths - aMonths
  })
}

function formatCredits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function ledgerTermSummary(rows: ReturnType<typeof buildGradeLedger>['rows']) {
  const quality = rows.flatMap((row) => {
    const grade = row.gradeExact.trim().toUpperCase() as keyof typeof AMCAS_RULE_SNAPSHOT.gradePoints
    const credits = Number.parseFloat(row.creditsExact)
    const points = AMCAS_RULE_SNAPSHOT.gradePoints[grade]
    return Number.isFinite(credits) && credits > 0 && points != null ? [{ credits, points, bcpm: row.bcpm }] : []
  })
  const gpaFor = (items: typeof quality) => {
    const credits = items.reduce((sum, item) => sum + item.credits, 0)
    return credits ? items.reduce((sum, item) => sum + item.points * item.credits, 0) / credits : null
  }
  return {
    credits: rows.reduce((sum, row) => sum + (Number.parseFloat(row.creditsExact) || 0), 0),
    gpa: gpaFor(quality),
    bcpmGpa: gpaFor(quality.filter((item) => item.bcpm === true)),
    complete: rows.every((row) => row.status !== 'in-progress' && row.status !== 'needs-details'),
    repeatCount: rows.filter((row) => row.status === 'repeat').length,
  }
}

/**
 * The same intake, reachable once records exist. Importing a transcript is not a
 * first-run-only act: a student adds a term, or a second institution, later —
 * and this is the only route on which duplicate detection can actually fire.
 */
function TranscriptImportRoute({ courses, initialStage = 'closed' }: { courses: Course[]; initialStage?: 'closed' | 'intake' }) {
  const [stage, setStage] = useState<'closed' | 'intake' | 'manual'>(initialStage)
  if (stage === 'closed') {
    return <div className="grades-transcript-actions">
      <button type="button" className="grades-transcript-button" data-primary="true" onClick={() => setStage('intake')}>
        Import a transcript
      </button>
    </div>
  }
  if (stage === 'manual') return <div className="grades-transcript-form">
    <div className="grades-transcript-actions">
      <button type="button" className="grades-transcript-button" onClick={() => setStage('intake')}>Back</button>
      <button type="button" className="grades-transcript-button" onClick={() => setStage('closed')}>Close entry</button>
    </div>
    <TranscriptRecordsPanel courses={courses} entryOnly />
  </div>
  return <TranscriptIntake
    courses={courses}
    onManual={() => setStage('manual')}
    onCancel={() => setStage('closed')}
    onSaved={() => setStage('closed')}
  />
}
