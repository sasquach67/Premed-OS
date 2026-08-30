/**
 * The Planner term board (§4.2) — the ruled **A + C** composition.
 *
 * Drawing:   mockup-lab/01-academics/academics-planner-prototype.html
 * Decisions: academics-planner-prototype.md — A's whole-plan board with C's
 *            selected-course inspector on demand. The handoff there is six
 *            numbered rules and this file implements them literally:
 *            the inspector opens from a chip, marks it, REPLACES the outcome
 *            rail rather than rendering beside it, swaps contents when another
 *            chip is picked, and commits nothing by opening.
 * Model:     lib/academics/planner.ts — every rule and every number.
 *
 * Planned-course correction stays inside the selected-course inspector. It is
 * the same Course record the timeline reads; there is no duplicate editor or
 * second planning store.
 *
 * ⚠️ U-9: credits and named requirements only. No readiness score, no
 * composite, no "on track" badge.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarPlus, GraduationCap, Pencil, Search, Trash2, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { fmtGpa } from '@/lib/selectors'
import {
  courseEffects, mcatDividerAfter, outcomeProjection,
  plannerTerms, prereqVsMcat, unplacedRequirements, UNSCHEDULED,
} from '@/lib/academics/planner'
import { termToMonths } from '@/lib/academics/mcatTiming'
import { isProtected } from '@/lib/academics/savedPlans'
import { buildAdvisorSnapshot } from '@/lib/academics/advisorExport'
import {
  candidatePlanCoverage,
  planningRequirementSet,
  UNC_PLANNING_LIBRARY,
  type UncPlanningRequirementSet,
} from '@/lib/academics/uncPlanningLibrary'
import {
  catalogPlanDefaults,
  localCatalogCandidates,
  UNC_CATALOG_INTEGRATION,
  type LocalCatalogCandidate,
} from '@/lib/academics/planningCatalogAdapter'
import {
  UNC_CATALOG_REQUIREMENTS,
  UNC_COURSE_CATALOG_SUBJECTS,
  catalogCourseHasRequirement,
  catalogCreditChoiceIsValid,
  type UncCourseLevel,
} from '@/lib/academics/uncCourseCatalog'
import { removePlannerTermRecord } from '@/lib/academics/planningRecords'
import type { Course, PlannerTerm } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { planningProgramLabel } from '@/components/academics/RequirementsAudit'
import './PlanningWorkspace.css'

const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'
const EMPTY_SELECT_VALUE = '__all__'
const SORTED_PLANNING_PROGRAMS = [...UNC_PLANNING_LIBRARY].sort((a, b) => planningProgramLabel(a).localeCompare(planningProgramLabel(b)))

function PlannerSelect({ value, onValueChange, label, options, className }: {
  value: string
  onValueChange: (value: string) => void
  label: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  className?: string
}) {
  const normalizedValue = value || EMPTY_SELECT_VALUE
  return <Select value={normalizedValue} onValueChange={(next) => onValueChange(next === EMPTY_SELECT_VALUE ? '' : next)}>
    <SelectTrigger aria-label={label} className={cn('planning-select-trigger', className)}><SelectValue /></SelectTrigger>
    <SelectContent className="planning-select-content !border-border !bg-popover !text-popover-foreground shadow-xl">
      {options.map((option) => <SelectItem key={option.value || EMPTY_SELECT_VALUE} value={option.value || EMPTY_SELECT_VALUE} disabled={option.disabled} className="planning-select-item">{option.label}</SelectItem>)}
    </SelectContent>
  </Select>
}

function concretePlannerTerm(term: string, startTerm: string) {
  const start = /^(Spring|Summer|Fall)\s+\d{4}$/i.test(startTerm.trim()) ? startTerm.trim() : 'Fall 2026'
  const match = /^(Spring|Summer|Fall)\s+(\d{4})$/i.exec(start)
  const season = match?.[1].toLowerCase()
  const year = Number(match?.[2] ?? 2026)
  const next = season === 'fall' ? `Spring ${year + 1}` : `Fall ${year}`
  const later = next.startsWith('Spring ') ? `Fall ${Number(next.slice(-4))}` : `Spring ${Number(next.slice(-4)) + 1}`
  const normalized = term.trim().toLowerCase()
  if (normalized === 'this term') return start
  if (normalized === 'next term') return next
  if (normalized === 'later') return later
  return term
}

function nextPlannerTermAfter(term: string) {
  const match = /^(Spring|Summer|Fall)\s+(\d{4})$/i.exec(term.trim())
  if (!match) return 'Spring 2027'
  const season = match[1].toLowerCase()
  const year = Number(match[2])
  if (season === 'spring') return `Fall ${year}`
  if (season === 'summer') return `Fall ${year}`
  return `Spring ${year + 1}`
}

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=plan, with requirements/catalog in-context.
 */
export function PlannerBoard({ onComparePlans, openRequirements = false }: {
  onComparePlans: () => void
  openRequirements?: boolean
}) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const planningContext = useStore((s) => s.academics.classCenter.planningProgramContext ?? {})
  const selectedProgramId = planningContext.selectedProgramId
  const mcatDate = useStore((s) => s.mcat.targetDate)
  const studentName = useStore((s) => s.profile.name)
  const profileStartTerm = useStore((s) => s.profile.startTerm)
  const slots = useStore((s) => s.academics.classCenter.plannerTerms ?? [])
  const savedPlans = useStore((s) => s.academics.classCenter.savedPlans ?? [])
  const transcriptRecords = useStore((s) => s.academics.classCenter.transcriptRecords ?? [])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [placingCourse, setPlacingCourse] = useState<Course | undefined>()
  const [placementOpen, setPlacementOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<PlannerTerm | undefined>()
  const [deletingSlot, setDeletingSlot] = useState<PlannerTerm | undefined>()
  const [requirementsExpanded, setRequirementsExpanded] = useState(openRequirements)
  const [newTermLabel, setNewTermLabel] = useState('')
  const [newTermKind, setNewTermKind] = useState<PlannerTerm['kind']>('standard')
  const [catalogRequest, setCatalogRequest] = useState<PlannerCatalogRequest>()
  const [registrationTermId, setRegistrationTermId] = useState<string>()

  const displayPlan = useMemo(() => {
    const canonicalByLabel = new Map<string, PlannerTerm>()
    const canonicalIdById = new Map<string, string>()
    for (const slot of slots) {
      const normalized = { ...slot, label: concretePlannerTerm(slot.label, profileStartTerm) }
      const key = normalized.label.trim().toLocaleLowerCase()
      const canonical = canonicalByLabel.get(key)
      if (canonical) canonicalIdById.set(normalized.id, canonical.id)
      else {
        canonicalByLabel.set(key, normalized)
        canonicalIdById.set(normalized.id, normalized.id)
      }
    }
    return {
      slots: [...canonicalByLabel.values()],
      courses: courses.map((course) => ({
        ...course,
        term: concretePlannerTerm(course.term, profileStartTerm),
        plannerTermId: course.plannerTermId ? (canonicalIdById.get(course.plannerTermId) ?? course.plannerTermId) : undefined,
      })),
    }
  }, [courses, profileStartTerm, slots])
  const columns = plannerTerms(displayPlan.courses, displayPlan.slots)
  const divider = mcatDividerAfter(columns, mcatDate)
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const localCoverage = selectedProgram ? candidatePlanCoverage(selectedProgram, courses.map((course) => course.code)) : undefined
  const unplaced = localCoverage
    ? localCoverage.filter((item) => item.state !== 'scheduled').map((item) => ({ id: item.node.id, label: item.node.label, verificationStatus: item.state === 'manual-review' ? 'needs-verification' as const : 'verified' as const }))
    : unplacedRequirements(requirements, courses)
  const selected = courses.find((course) => course.id === selectedId)
  const selectedTermLocked = Boolean(selected?.plannerTermId && slots.find((slot) => slot.id === selected.plannerTermId)?.lockedAt)
  const planName = savedPlans.at(-1)?.name || 'Current course plan'
  const programSummary = selectedProgram
    ? `${planningProgramLabel(selectedProgram)} · ${selectedProgram.catalogYear}`
    : 'Program not selected · Catalog not recorded'
  const priorCreditCount = transcriptRecords.filter((record) =>
    ['ap', 'ib', 'transfer', 'dual-enrollment'].includes(record.courseType.trim().toLocaleLowerCase())).length
  const trajectoryDestination = columns.find((column) => !column.lockedAt && !column.registered && column.kind !== 'gap' && column.credits < 12)

  if (!columns.length) return null

  const requestCourse = (destination: string, destinationId?: string) => setCatalogRequest((current) => ({
    id: (current?.id ?? 0) + 1,
    destination,
    destinationId,
  }))

  const updateProgram = (selectedProgramId?: string) => useStore.getState().update((draft) => {
    draft.academics.classCenter.planningProgramContext = {
      ...draft.academics.classCenter.planningProgramContext,
      selectedProgramId,
      updatedAt: Date.now(),
    }
  })

  const removeTerm = (id: string) => {
    const linkedIds = new Set(courses.filter((course) => course.plannerTermId === id && !isProtected(course)).map((course) => course.id))
    const remainingCourses = courses.filter((course) => !linkedIds.has(course.id))
    const result = removePlannerTermRecord(slots, remainingCourses, id)
    if (!result.ok) return
    useStore.getState().update((draft) => {
      draft.courses = draft.courses.filter((course) => !linkedIds.has(course.id))
      draft.academics.classCenter.plannerTerms = result.value
    })
    setDeletingSlot(undefined)
  }

  const openNewTerm = () => {
    const latestConcrete = [...columns].reverse().find((column) => /^(Spring|Summer|Fall)\s+\d{4}$/i.test(column.term))?.term ?? profileStartTerm
    if (!newTermLabel.trim()) setNewTermLabel(nextPlannerTermAfter(latestConcrete))
    setPlacingCourse(undefined)
    setPlacementOpen(true)
  }

  const addSlot = () => {
    const label = newTermLabel.trim()
    if (!label) return
    const concreteLabel = concretePlannerTerm(label, profileStartTerm).toLocaleLowerCase()
    const already = slots.some((slot) => concretePlannerTerm(slot.label, profileStartTerm).toLocaleLowerCase() === concreteLabel)
    if (already) return
    const now = Date.now()
    const slot: PlannerTerm = {
      id: uid(), label, kind: newTermKind, origin: 'student-created', createdAt: now, updatedAt: now, order: slots.length,
    }
    useStore.getState().update((draft) => { draft.academics.classCenter.plannerTerms.push(slot) })
    setNewTermLabel('')
  }

  const place = (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => {
    if (term.lockedAt || term.registered || isProtected(course)) return
    if (course.plannerTermId && slots.find((slot) => slot.id === course.plannerTermId)?.lockedAt) return
    useStore.getState().update((draft) => {
      const row = draft.courses.find((item) => item.id === course.id)
      if (row && !isProtected(row)) {
        row.term = term.term
        row.plannerTermId = term.id
      }
    })
    setPlacingCourse(undefined)
  }

  const exportAdvisorSnapshot = () => {
    const snapshot = buildAdvisorSnapshot({
      courses,
      requirements,
      catalogDate: selectedProgram?.catalogYear,
      studentName,
      planningContext,
    })
    const href = URL.createObjectURL(new Blob([snapshot.text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = href
    link.download = 'premed-os-advisor-plan.txt'
    link.click()
    URL.revokeObjectURL(href)
  }

  return (
    <section className="planning-workspace" aria-label="Academic planner">
      <div className="planning-filter-bar" aria-label="Plan controls">
        <button type="button" className="planning-control" data-primary="true" onClick={onComparePlans} aria-label={`Open saved plans for ${planName}`}>{planName}</button>
        <button type="button" className="planning-control" aria-expanded={requirementsExpanded} onClick={() => setRequirementsExpanded((expanded) => !expanded)}>{programSummary}</button>
        <button type="button" className="planning-control" onClick={() => {
          const destination = columns.find((column) => !column.lockedAt && !column.courses.length) ?? columns.find((column) => !column.lockedAt) ?? columns[0]
          requestCourse(destination.term, destination.id)
        }}>＋ Add course</button>
        <button type="button" className="planning-control" onClick={onComparePlans}>Compare plans</button>
        <span className="planning-control"><GraduationCap className="size-3.5" /> MCAT · {mcatDate || 'date not recorded'}</span>
        <span className="planning-control-spacer" />
        <button type="button" className="planning-control" onClick={exportAdvisorSnapshot}>Export for advisor</button>
        <details className="planning-more">
          <summary className="planning-control" aria-label="More plan actions">•••</summary>
          <div className="planning-more-menu">
            <button type="button" onClick={openNewTerm}><CalendarPlus className="size-3.5" /> Add term</button>
            <button type="button" onClick={() => setRequirementsExpanded((expanded) => !expanded)}>{requirementsExpanded ? 'Collapse requirements' : 'Show all requirements'}</button>
          </div>
        </details>
      </div>

      <section className="planning-context-bar" aria-label="Planning context">
        <div className="planning-context-label"><b>Your planning context</b><span>These choices set the requirement map.</span></div>
        <div className="planning-context-field planning-context-program"><small>Major / program</small><PlannerSelect label="Major or program" value={selectedProgramId ?? ''} onValueChange={(value) => updateProgram(value || undefined)} className="planning-context-select" options={[{ value: '', label: 'Choose a major' }, ...SORTED_PLANNING_PROGRAMS.map((program) => ({ value: program.id, label: planningProgramLabel(program) }))]} /></div>
        <div className="planning-context-field"><small>Catalog + cohort</small><b>{selectedProgram ? `${selectedProgram.catalogYear} · ${planningContext.matriculationTerm ?? 'cohort not recorded'}` : 'Set by major selection'}</b></div>
        <div className="planning-context-field"><small>Premed / MCAT</small><b>{mcatDate ? `MCAT ${mcatDate}` : 'Date not recorded'}</b></div>
        <a className="planning-context-field" data-action="true" href="#/academics?mode=planning&tab=archive&gradeView=ledger&transcript=intake" aria-label="Open prior credit transcript intake in Grades and Archive"><small>Prior credit</small><b>{priorCreditCount ? `${priorCreditCount} transcript record${priorCreditCount === 1 ? '' : 's'}` : 'Not recorded'}</b></a>
        <div className="planning-context-field" data-unavailable="true"><small>Interests</small><b>Not recorded</b></div>
      </section>

      <div className="planning-canvas">
        <div className="planning-layout">
          <div className="planning-main">
            <section className="planning-card">
              <header className="planning-card-header">
                <div><div className="planning-card-title">Your academic plan</div><div className="planning-card-subtitle">past → registered → planned · scroll across terms</div></div>
                <button type="button" className="planning-control" onClick={openNewTerm}>＋ Add term</button>
              </header>
              <div className="planning-card-body">
                <div className="planning-board-scroll">
                  <div className="planning-terms">
                    {columns.map((column, index) => (
                      <div key={column.id ?? column.term} className="flex items-stretch gap-2.5">
                        <article className="planning-term" data-current={column.registered || undefined}>
                          <header className="planning-term-header">
                            <div><div className="planning-term-name">{column.term}</div><div className="planning-term-meta">{column.registered ? 'Registered' : column.lockedAt ? 'Locked' : 'Planned'} · {column.credits} credits</div></div>
                            {column.id ? <div className="planning-term-actions"><button type="button" className="planning-term-lock" data-locked={Boolean(column.lockedAt) || undefined} onClick={() => setEditingSlot(slots.find((slot) => slot.id === column.id))} aria-label={`Edit ${column.term}`}>{column.lockedAt ? 'Locked' : 'Edit'} <Pencil className="inline size-2.5" /></button><button type="button" className="planning-term-remove" disabled={Boolean(column.lockedAt || column.courses.some(isProtected))} onClick={() => setDeletingSlot(slots.find((slot) => slot.id === column.id))} aria-label={`Delete ${column.term}`} title={column.courses.length ? `Delete ${column.term} and its planned courses` : `Delete ${column.term}`}><Trash2 className="size-3" /></button></div> : <span className="planning-term-lock" data-locked={column.registered || undefined}>{column.registered ? 'Registered' : 'Recorded'}</span>}
                          </header>
                          {column.note && <p className="planning-term-meta">{column.note}</p>}
                          {column.courses.map((course) => {
                            const effects = planningCourseEffects(course, requirements, courses, selectedProgram)
                            return <button key={course.id} type="button" className="planning-course" data-selected={course.id === selectedId || undefined} onClick={() => setSelectedId(course.id === selectedId ? undefined : course.id)}>
                              <span className="planning-course-top"><span className="planning-course-code">{course.code || 'Course code'}</span><span className="planning-course-credits">{course.credits} cr</span></span>
                              <span className="planning-course-name">{course.title || 'Title not recorded'}</span>
                              <span className="planning-course-tags"><span className="planning-course-tag">{course.bcpm ? 'BCPM' : 'AO'}</span>{effects.clears[0] ? <span className="planning-course-tag" data-tone={effects.clears[0].confidence === 'verified' ? 'sage' : 'amber'}>{effects.clears[0].label}</span> : <span className="planning-course-tag" data-tone="muted">Unmapped</span>}</span>
                            </button>
                          })}
                          {!column.courses.length && <p className="planning-term-empty">Nothing placed</p>}
                          {column.id && !column.lockedAt && <button type="button" className="planning-term-add" onClick={() => requestCourse(column.term, column.id)}>＋ Add course</button>}
                          <p className="planning-term-load"><b>{column.credits} credits</b> · {column.bcpmCredits} BCPM</p>
                          {column.id && /registration/i.test(column.note ?? '') && <button type="button" className="planning-term-nudge" onClick={() => setRegistrationTermId(column.id)}>{column.note} →</button>}
                        </article>
                        {divider === index && <div className="planning-mcat-divider"><GraduationCap className="mb-2 size-5" /><b>MCAT</b><span>{mcatDate || 'Date not recorded'}</span></div>}
                      </div>
                    ))}
                    {divider === undefined && <div className="planning-mcat-divider"><GraduationCap className="mb-2 size-5" /><b>MCAT</b><span>Date not recorded</span></div>}
                  </div>
                </div>
              </div>
            </section>

            {registrationTermId && (() => {
              const term = columns.find((column) => column.id === registrationTermId)
              if (!term) return null
              return <section className="planning-registration-panel" aria-label={`${term.term} registration review`}>
                <div><p className="planning-eyebrow">{term.term} · registration window</p><h3>Review this term before registration.</h3><p>{term.note || 'Check the planned sequence and credit load before opening the official registration system.'}</p></div>
                <div className="planning-registration-actions"><button type="button" className="planning-control" data-primary="true" onClick={() => {
                  const editable = slots.find((slot) => slot.id === term.id)
                  setRegistrationTermId(undefined)
                  if (editable) setEditingSlot(editable)
                }}>Review {term.term}</button><a className="planning-control" href="https://connectcarolina.unc.edu/" target="_blank" rel="noreferrer">Open ConnectCarolina ↗</a><button type="button" className="planning-control" onClick={() => setRegistrationTermId(undefined)}>Dismiss</button></div>
                <p className="planning-registration-boundary">Current sections, seats, restrictions, and enrollment stay in ConnectCarolina.</p>
              </section>
            })()}

            <section className="planning-tray" aria-label="Unplaced planning work">
              <header className="planning-tray-header"><div><span className="planning-tray-title">Unplaced</span> <span className="planning-tray-copy">requirements and courses with no term yet</span></div></header>
              {unplaced.length ? <div className="planning-tray-items">{unplaced.map((item) => <div key={item.id} className="planning-tray-chip"><b>{item.label}</b><span>{item.verificationStatus === 'needs-verification' ? 'Manual review' : 'Source recorded'} · no term selected</span></div>)}</div> : <p className="planning-tray-copy">No uncaptured planning nodes are shown locally.</p>}
            </section>
            <PlannerCourseDiscovery
              destinations={columns}
              selectedProgramId={selectedProgramId}
              request={catalogRequest}
              onClose={() => setCatalogRequest(undefined)}
              onAdded={(courseId) => setSelectedId(courseId)}
            />
            {!selected && <div className="planning-trajectory-wide"><OutcomeRail mcatDate={mcatDate} selectedProgramId={selectedProgramId} hasCourseDestination={Boolean(trajectoryDestination)} onAddCourse={() => trajectoryDestination ? requestCourse(trajectoryDestination.term, trajectoryDestination.id) : openNewTerm()} onReviewRequirements={() => setRequirementsExpanded(true)} /></div>}
          </div>

          <aside className="planning-rail">
            <PlanCoverage selectedProgram={selectedProgram} coverage={localCoverage ?? []} expanded={requirementsExpanded} onToggle={() => setRequirementsExpanded((expanded) => !expanded)} />
            {selected && <Inspector course={selected} selectedProgram={selectedProgram} planningLocked={selectedTermLocked} onClose={() => setSelectedId(undefined)} onPlace={() => { setPlacingCourse(selected); setPlacementOpen(true) }} />}
          </aside>
        </div>
      </div>

      <PlacementDialog key={placingCourse?.id ?? 'new-term'}
        course={placingCourse}
        open={placementOpen}
        columns={columns}
        label={newTermLabel}
        onLabelChange={setNewTermLabel}
        kind={newTermKind}
        onKindChange={setNewTermKind}
        onAdd={addSlot}
        onPlace={place}
        onOpenChange={(open) => { setPlacementOpen(open); if (!open) setPlacingCourse(undefined) }}
      />
      <TermEditor key={editingSlot?.id ?? 'term-editor-closed'} term={editingSlot} onOpenChange={(open) => { if (!open) setEditingSlot(undefined) }} />
      <AlertDialog open={Boolean(deletingSlot)} onOpenChange={(open) => { if (!open) setDeletingSlot(undefined) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingSlot?.label}?</AlertDialogTitle>
            <AlertDialogDescription>{(() => {
              const count = courses.filter((course) => course.plannerTermId === deletingSlot?.id).length
              return count ? `This removes the semester and its ${count} planned course${count === 1 ? '' : 's'}. Completed or in-progress semesters stay protected.` : 'This removes the empty semester from your plan.'
            })()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep semester</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => deletingSlot && removeTerm(deletingSlot.id)}>Remove semester</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=plan, persistent Plan coverage rail.
 */
function PlanCoverage({ selectedProgram, coverage, expanded, onToggle }: {
  selectedProgram?: NonNullable<ReturnType<typeof planningRequirementSet>>
  coverage: ReturnType<typeof candidatePlanCoverage>
  expanded: boolean
  onToggle: () => void
}) {
  const courses = useStore((s) => s.courses)
  const completedCodes = new Set(courses.filter((course) => course.status === 'completed').map((course) => course.code.trim().toUpperCase()))
  const complete = coverage.filter((item) => item.state === 'scheduled' && item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))).length
  const planned = coverage.filter((item) => item.state === 'scheduled' && !item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))).length
  const notScheduled = coverage.filter((item) => item.state === 'not-scheduled').length
  const manualReview = coverage.filter((item) => item.state === 'manual-review').length
  return <section className="planning-card planning-coverage" data-expanded={expanded || undefined}>
    <header className="planning-card-header"><div><p className="planning-eyebrow">Major requirements</p><h3 className="planning-card-title">Plan coverage</h3><p className="planning-card-subtitle">courses matched to the selected major</p></div><button type="button" className="planning-control" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Show less' : 'Show all'}</button></header>
    <div className="planning-card-body">
      <div className="planning-coverage-identity"><div><b>{selectedProgram ? planningProgramLabel(selectedProgram) : 'No program selected'}</b><span>{selectedProgram ? `${selectedProgram.catalogYear} · retrieved ${selectedProgram.retrievedAt}` : 'Choose an exact program before reading requirement effects.'}</span></div>{selectedProgram && <span className="planning-eyebrow">Local source record</span>}</div>
      <div className="planning-coverage-counts" aria-label="Local planning evidence"><div className="planning-coverage-count" data-tone="sage"><b>{complete}</b><span>Complete</span></div><div className="planning-coverage-count" data-tone="blue"><b>{planned}</b><span>Planned</span></div><div className="planning-coverage-count" data-tone="amber"><b>{notScheduled}</b><span>Not complete</span></div><div className="planning-coverage-count" data-tone="violet"><b>{manualReview}</b><span>Manual review</span></div></div>
      <div className="planning-coverage-rows">{selectedProgram ? coverage.slice(0, expanded ? coverage.length : 4).map((item) => {
        const isComplete = item.state === 'scheduled' && item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))
        const state = item.state === 'manual-review' ? 'manual-review' : isComplete ? 'complete' : item.state === 'scheduled' ? 'planned' : 'not-complete'
        const label = state === 'complete' ? 'Complete' : state === 'planned' ? 'Planned' : state === 'not-complete' ? 'Not complete' : 'Manual review'
        return <div key={item.node.id} className="planning-coverage-row"><div className="planning-coverage-row-head"><span>{item.node.label}</span><span className="planning-coverage-state" data-state={state}>{label}</span></div><p>{item.scheduledCourses.length ? `Local record: ${item.scheduledCourses.join(' · ')}` : item.node.detail}</p></div>
      }) : <div className="planning-coverage-row"><div className="planning-coverage-row-head"><span>Choose a major above</span><span className="planning-coverage-state" data-state="manual-review">Not set</span></div><p>The requirement list appears here after a major is selected.</p></div>}</div>
      <div className="planning-boundary">Local planning evidence only. Live catalog, enrollment, official audit, exceptions, and substitutions are not configured here.</div>
    </div>
  </section>
}

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=catalog, course-discovery bay.
 */
export interface PlannerCatalogRequest {
  id: number
  destination: string
  destinationId?: string
}

export interface PlannerCourseDestination {
  id?: string
  term: string
  kind?: PlannerTerm['kind']
  registered: boolean
  lockedAt?: number
}

export function PlannerCourseDiscoveryDialog({ destinations, selectedProgramId, request, onOpenChange, onAdded }: {
  destinations: PlannerCourseDestination[]
  selectedProgramId?: string
  request?: PlannerCatalogRequest
  onOpenChange: (open: boolean) => void
  onAdded?: (courseId: string) => void
}) {
  return <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
    <DialogContent className="planning-workspace max-h-[90vh] overflow-y-auto bg-card p-0 sm:max-w-5xl">
      <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
        <DialogTitle>Add a course to {request?.destination ?? 'the plan'}</DialogTitle>
        <DialogDescription>Search the local planning library or enter the course yourself. Nothing is added until you review the missing facts.</DialogDescription>
      </DialogHeader>
      <div className="px-5 pb-5">
        <PlannerCourseDiscovery
          destinations={destinations}
          selectedProgramId={selectedProgramId}
          request={request}
          onClose={() => onOpenChange(false)}
          onAdded={onAdded}
        />
      </div>
    </DialogContent>
  </Dialog>
}

export function PlannerCourseDiscovery({ destinations, selectedProgramId, request, onClose, onAdded }: {
  destinations: PlannerCourseDestination[]
  selectedProgramId?: string
  request?: PlannerCatalogRequest
  onClose?: () => void
  onAdded?: (courseId: string) => void
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>(selectedProgramId ? 'selected' : 'all')
  const [subjectCode, setSubjectCode] = useState('')
  const [courseNumber, setCourseNumber] = useState('')
  const [level, setLevel] = useState<UncCourseLevel | 'all'>('undergraduate')
  const [requirement, setRequirement] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<LocalCatalogCandidate | undefined>()
  const [addOpen, setAddOpen] = useState(false)
  const [manualDestinationKey, setManualDestinationKey] = useState<string>()
  const [entryDestinationKey, setEntryDestinationKey] = useState<string>()
  const [title, setTitle] = useState('')
  const [credits, setCredits] = useState('')
  const [bcpm, setBcpm] = useState(false)
  const [courseStatus, setCourseStatus] = useState<Course['status']>('planned')
  const [inResidence, setInResidence] = useState(true)
  const [pendingDecision, setPendingDecision] = useState<'prerequisite' | 'redundant' | 'retake'>()
  const courses = useStore((state) => state.courses)
  const editableDestinations = destinations.filter((column) => !column.lockedAt && column.kind !== 'gap' && column.term.trim().toLocaleLowerCase() !== 'prior credit')
  const defaultDestination = editableDestinations[0] ?? destinations[0]
  const destinationKey = (item?: PlannerCourseDestination) => item ? (item.id ?? item.term) : 'new-term'
  const [destination, setDestination] = useState(destinationKey(defaultDestination))
  const candidates = useMemo(() => localCatalogCandidates(), [])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const normalizedCourseNumber = courseNumber.trim().toLocaleLowerCase()
  const results = useMemo(() => candidates.filter((candidate) => {
    if (scope === 'selected' && selectedProgramId && !candidate.programIds.includes(selectedProgramId)) return false
    if (subjectCode && candidate.subjectCode !== subjectCode) return false
    if (normalizedCourseNumber && !candidate.number.toLocaleLowerCase().includes(normalizedCourseNumber)) return false
    if (level !== 'all' && candidate.level !== level) return false
    if (requirement && !catalogCourseHasRequirement(candidate.attributes, requirement)) return false
    const requirementLabels = requirementLabelsForCandidate(candidate)
    return !normalizedQuery || `${candidate.code} ${candidate.title} ${candidate.description} ${candidate.subjectName} ${candidate.attributes.join(' ')} ${requirementLabels.join(' ')}`.toLocaleLowerCase().includes(normalizedQuery)
  }).slice(0, 60), [candidates, level, normalizedCourseNumber, normalizedQuery, requirement, scope, selectedProgramId, subjectCode])
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const requestedDestination = request
    ? editableDestinations.find((item) => request.destinationId ? item.id === request.destinationId : item.term === request.destination) ?? defaultDestination
    : defaultDestination
  const entryDestination = destinations.find((item) => destinationKey(item) === entryDestinationKey)
  const chosenDestination = destinations.find((item) => destinationKey(item) === destination) ?? defaultDestination
  const manualDestination = destinations.find((item) => destinationKey(item) === manualDestinationKey)

  useEffect(() => {
    if (!request) return
    setEntryDestinationKey(destinationKey(requestedDestination))
    setDestination(destinationKey(requestedDestination))
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    searchRef.current?.focus()
  }, [request?.id, requestedDestination])

  function openAdd(candidate: LocalCatalogCandidate) {
    const defaults = catalogPlanDefaults(candidate)
    setSelectedCandidate(candidate)
    setTitle(defaults.title)
    setCredits(defaults.credits == null ? '' : String(defaults.credits))
    setBcpm(false)
    setCourseStatus('planned')
    setInResidence(true)
    setDestination(destinationKey(entryDestination ?? defaultDestination))
    setAddOpen(true)
  }

  function decisionForCandidate() {
    if (!selectedCandidate || !chosenDestination) return undefined
    const sameCode = courses.filter((course) => course.code.trim().toUpperCase() === selectedCandidate.code.trim().toUpperCase())
    if (sameCode.some((course) => course.status === 'completed')) return 'retake' as const
    if (sameCode.length) return 'redundant' as const
    const requiredCodes = [...new Set((selectedCandidate.requisites?.toUpperCase().match(/\b[A-Z]{2,5}\s+\d{3}[A-Z]?\b/g) ?? []).map((code) => code.replace(/\s+/g, ' ')))]
    if (!requiredCodes.length) return undefined
    const destinationMonths = termToMonths(chosenDestination.term)
    const supported = new Set(courses.filter((course) => {
      if (course.status === 'completed') return true
      const courseMonths = termToMonths(course.term)
      return destinationMonths != null && courseMonths != null && courseMonths < destinationMonths
    }).map((course) => course.code.trim().toUpperCase().replace(/\s+/g, ' ')))
    return requiredCodes.some((code) => !supported.has(code)) ? 'prerequisite' as const : undefined
  }

  function addCandidate(unplaced = false) {
    if (!selectedCandidate || !title.trim() || !chosenDestination) return
    const parsedCredits = Number(credits)
    if (!catalogCreditChoiceIsValid(selectedCandidate, parsedCredits)) return
    const id = uid()
    const defaults = catalogPlanDefaults(selectedCandidate)
    useStore.getState().addItem('courses', {
      id,
      term: unplaced ? UNSCHEDULED : chosenDestination.term,
      plannerTermId: unplaced ? undefined : chosenDestination.id,
      code: selectedCandidate.code,
      title: title.trim(),
      credits: parsedCredits,
      grade: '',
      bcpm,
      status: courseStatus,
      inResidence,
      satisfies: [],
      notes: `${defaults.catalogNote} · Student-selected planning destination; live offering and degree audit not verified.`,
      order: 0,
    })
    setAddOpen(false)
    setEntryDestinationKey(undefined)
    onAdded?.(id)
  }

  function reviewCandidate() {
    const decision = decisionForCandidate()
    if (decision) setPendingDecision(decision)
    else addCandidate()
  }

  return <section ref={sectionRef} className="planning-catalog-dock" data-entry-active={Boolean(entryDestination) || undefined} aria-label="UNC course catalog">
    <header className="planning-catalog-head"><div><p className="planning-eyebrow">Official UNC course catalog</p><h3>Find a course that fits the plan.</h3><p>{candidates.length.toLocaleString()} published courses · major suggestions first, full catalog always available.</p></div><div className="planning-catalog-head-actions"><span className="planning-source-chip">{UNC_CATALOG_INTEGRATION.catalogYear} · retrieved {UNC_CATALOG_INTEGRATION.retrievedAt}</span><button type="button" className="planning-control" onClick={() => setManualDestinationKey(destinationKey(entryDestination ?? requestedDestination))}>Enter manually</button></div></header>
    {entryDestination && <div className="planning-catalog-entry" role="status"><span><b>{entryDestination.term}</b> is the destination semester.</span><button type="button" onClick={() => onClose?.()}>Cancel</button></div>}
    <div className="planning-catalog-toolbar planning-catalog-toolbar-search">
      <label className="planning-search-wrap"><Search className="size-3" /><input ref={searchRef} className="planning-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course code, title, topic, or attribute" aria-label="Search UNC course catalog" /></label>
      <div className="planning-catalog-scope" role="group" aria-label="Course results"><button type="button" data-active={scope === 'selected' || undefined} disabled={!selectedProgramId} onClick={() => setScope('selected')}>{selectedProgram ? `Suggested for ${selectedProgram.program}` : 'Major suggestions'}</button><button type="button" data-active={scope === 'all' || undefined} onClick={() => setScope('all')}>All UNC courses</button></div>
    </div>
    <div className="planning-catalog-filters" aria-label="Catalog filters">
      <div className="planning-catalog-filter"><span>Subject</span><PlannerSelect label="Subject" value={subjectCode} onValueChange={setSubjectCode} options={[{ value: '', label: 'All subjects A–Z' }, ...UNC_COURSE_CATALOG_SUBJECTS.map((subject) => ({ value: subject.subjectCode, label: `${subject.subjectCode} · ${subject.subjectName}` }))]} /></div>
      <label className="planning-catalog-filter"><span>Course number</span><input className="planning-catalog-number" value={courseNumber} onChange={(event) => setCourseNumber(event.target.value)} inputMode="numeric" placeholder="Any number" aria-label="Course number" /></label>
      <div className="planning-catalog-filter"><span>Level</span><PlannerSelect label="Level" value={level} onValueChange={(value) => setLevel(value as UncCourseLevel | 'all')} options={[{ value: 'undergraduate', label: 'Undergraduate' }, { value: 'advanced-undergraduate-graduate', label: 'Advanced undergraduate / graduate' }, { value: 'graduate', label: 'Graduate' }, { value: 'all', label: 'All levels' }]} /></div>
      <div className="planning-catalog-filter"><span>Requirement</span><PlannerSelect label="Requirement" value={requirement} onValueChange={setRequirement} options={[{ value: '', label: 'All IDEAs & gen ed' }, ...UNC_CATALOG_REQUIREMENTS]} /></div>
    </div>
    <p className="planning-catalog-context"><b>{selectedProgram ? planningProgramLabel(selectedProgram) : 'No major selected'}.</b> Destination: {entryDestination?.term ?? defaultDestination?.term ?? 'choose a semester'}. Published facts are separate from planning suggestions.</p>
    <div className="planning-library-grid">
      <div className="planning-catalog-results" aria-live="polite">{results.length ? results.map((candidate) => {
        const labels = requirementLabelsForCandidate(candidate)
        const tags = catalogPlanningTags(candidate, selectedProgramId)
        const selected = candidate.code === selectedCandidate?.code
        return <button type="button" key={candidate.code} className="planning-catalog-result" data-selected={selected || undefined} onClick={() => { setSelectedCandidate(candidate); setAddOpen(false) }}><span><b>{candidate.code}</b><p>{candidate.title}</p><span className="planning-catalog-tags"><em>{candidate.creditText}</em>{tags.map((tag) => <em key={tag}>{tag}</em>)}{!tags.length && labels[0] && <em>{labels[0]}</em>}</span></span><span className="planning-eyebrow">Inspect →</span></button>
      }) : <div className="planning-catalog-empty"><b>No catalog course matches these filters.</b><br />Clear a filter or enter a historical course manually.</div>}</div>
      <div className="planning-library-detail">{selectedCandidate ? <>
        <p className="planning-eyebrow">Published course detail</p>
        <h4>{selectedCandidate.code}</h4>
        <p className="planning-library-detail-title">{selectedCandidate.title}</p>
        <div className="planning-catalog-tags planning-catalog-tags-detail">{catalogPlanningTags(selectedCandidate, selectedProgramId).map((tag) => <em key={tag}>{tag}</em>)}</div>
        <p className="planning-library-description">{selectedCandidate.description}</p>
        <dl><div><dt>Credits</dt><dd>{selectedCandidate.creditText}</dd></div><div><dt>Subject</dt><dd>{selectedCandidate.subjectName}</dd></div><div><dt>Attributes</dt><dd>{selectedCandidate.attributes.join(' · ') || 'None published'}</dd></div><div><dt>Planning relevance</dt><dd>{requirementLabelsForCandidate(selectedCandidate).join(' · ') || 'No local program mapping'}</dd></div></dl>
        {selectedCandidate.requisites && <p className="planning-catalog-requisite"><b>Published requisite:</b> {selectedCandidate.requisites}</p>}
        {!addOpen ? <button type="button" className="planning-control" data-primary="true" onClick={() => openAdd(selectedCandidate)}>＋ Add to {entryDestination?.term ?? chosenDestination?.term ?? 'plan'}</button> : <form className="planning-catalog-inline-add" onSubmit={(event) => { event.preventDefault(); reviewCandidate() }}>
          <div className="planning-catalog-inline-heading"><div><span>Planning details</span><b>{title}</b></div><button type="button" onClick={() => setAddOpen(false)}>Cancel</button></div>
          <div className="planning-catalog-inline-grid">
            <label className="planning-catalog-field"><span>Credits {selectedCandidate.variableCredits ? '· choose published value' : '· published'}</span><input required inputMode="decimal" readOnly={!selectedCandidate.variableCredits} value={credits} onChange={(event) => setCredits(event.target.value)} min={selectedCandidate.minCredits} max={selectedCandidate.maxCredits} /></label>
            <div className="planning-catalog-field"><span>Semester</span><PlannerSelect label="Destination semester" value={destination} onValueChange={setDestination} options={editableDestinations.map((column) => ({ value: destinationKey(column), label: column.term }))} /></div>
            <div className="planning-catalog-field"><span>Status</span><PlannerSelect label="Course status" value={courseStatus} onValueChange={(value) => setCourseStatus(value as Course['status'])} options={[{ value: 'planned', label: 'Planned' }, { value: 'in-progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} /></div>
            <div className="planning-catalog-inline-checks"><label className="planning-catalog-check"><input type="checkbox" checked={inResidence} onChange={(event) => setInResidence(event.target.checked)} /> UNC / in residence</label><label className="planning-catalog-check"><input type="checkbox" checked={bcpm} onChange={(event) => setBcpm(event.target.checked)} /> BCPM</label></div>
          </div>
          <button type="submit" className="planning-control" data-primary="true" disabled={!catalogCreditChoiceIsValid(selectedCandidate, Number(credits))}>Add to {chosenDestination?.term ?? 'plan'}</button>
        </form>}
      </> : <><p className="planning-eyebrow">Published course detail</p><h4>Select a course</h4><p>Its official title, credits, description, attributes, and source will appear here before you add anything.</p></>}</div>
    </div>
    <div className="planning-library-boundary"><b>Official catalog snapshot.</b> {UNC_CATALOG_INTEGRATION.reason}</div>
    <PlanningCourseCreateDialog
      destination={manualDestination}
      onOpenChange={(open) => { if (!open) setManualDestinationKey(undefined) }}
      onSaved={(courseId) => { setManualDestinationKey(undefined); onAdded?.(courseId) }}
    />
    <AlertDialog open={Boolean(pendingDecision)} onOpenChange={(open) => { if (!open) setPendingDecision(undefined) }}>
      <AlertDialogContent className="planning-workspace">
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingDecision === 'prerequisite' ? `${selectedCandidate?.code} needs prerequisite review.` : pendingDecision === 'retake' ? `Keep both ${selectedCandidate?.code} attempts.` : `${selectedCandidate?.code} is already in the plan.`}</AlertDialogTitle>
          <AlertDialogDescription>{pendingDecision === 'prerequisite' ? `The saved catalog lists ${selectedCandidate?.requisites}. The local plan does not show every named course before ${chosenDestination?.term}.` : pendingDecision === 'retake' ? 'A planned repeat adds another attempt; it never replaces the earned transcript record or assumes a future grade.' : 'Adding the same course again does not create another known requirement effect. Keep it only for a deliberate reason.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="planning-boundary">{pendingDecision === 'retake' ? 'AMCAS keeps every earned attempt. UNC repeat treatment and requirement effects remain separately sourced.' : 'The local plan can flag this relationship; official permission, exceptions, and enrollment remain outside Premed OS.'}</div>
        <AlertDialogFooter>
          <AlertDialogCancel>{pendingDecision === 'prerequisite' ? 'Keep reviewing' : 'Cancel'}</AlertDialogCancel>
          {pendingDecision === 'prerequisite' && <AlertDialogAction onClick={() => { addCandidate(true); setPendingDecision(undefined) }}>Keep unplaced</AlertDialogAction>}
          {pendingDecision === 'redundant' && <AlertDialogAction onClick={() => { addCandidate(); setPendingDecision(undefined) }}>Keep for another reason</AlertDialogAction>}
          {pendingDecision === 'retake' && <AlertDialogAction onClick={() => { addCandidate(); setPendingDecision(undefined) }}>Keep planned repeat</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
}

export function PlanningCourseCreateDialog({ destination, onOpenChange, onSaved }: {
  destination?: PlannerCourseDestination
  onOpenChange: (open: boolean) => void
  onSaved?: (courseId: string) => void
}) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [credits, setCredits] = useState('')
  const [bcpm, setBcpm] = useState(false)
  const [courseStatus, setCourseStatus] = useState<Course['status']>('planned')
  const [inResidence, setInResidence] = useState(true)

  function close() {
    setCode('')
    setTitle('')
    setCredits('')
    setBcpm(false)
    setCourseStatus('planned')
    setInResidence(true)
    onOpenChange(false)
  }

  function save() {
    const parsedCredits = Number(credits)
    if (!destination || !code.trim() || !title.trim() || !Number.isFinite(parsedCredits) || parsedCredits <= 0) return
    const id = uid()
    useStore.getState().addItem('courses', {
      id,
      term: destination.term,
      plannerTermId: destination.id,
      code: code.trim(),
      title: title.trim(),
      credits: parsedCredits,
      grade: '',
      bcpm,
      status: courseStatus,
      inResidence,
      satisfies: [],
      notes: 'Student-entered Planning record.',
      order: 0,
    })
    close()
    onSaved?.(id)
  }

  return <Dialog open={Boolean(destination)} onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent className="planning-workspace bg-card sm:max-w-lg">
      <DialogHeader><DialogTitle>Enter a course for {destination?.term ?? 'the plan'}</DialogTitle><DialogDescription>Use the course facts from your own schedule or record. Nothing is added until you save.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="planning-catalog-field"><span>Course code</span><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. BIOL 252" /></label>
        <label className="planning-catalog-field"><span>Credits</span><input inputMode="decimal" value={credits} onChange={(event) => setCredits(event.target.value)} placeholder="e.g. 3" /></label>
        <label className="planning-catalog-field sm:col-span-2"><span>Course title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter the title from your source" /></label>
        <div className="planning-catalog-field"><span>Course status</span><PlannerSelect label="Course status" value={courseStatus} onValueChange={(value) => setCourseStatus(value as Course['status'])} options={[{ value: 'planned', label: 'Planned' }, { value: 'in-progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} /></div>
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2"><label className="planning-catalog-check"><input type="checkbox" checked={inResidence} onChange={(event) => setInResidence(event.target.checked)} /> Taken at UNC / in residence</label><label className="planning-catalog-check"><input type="checkbox" checked={bcpm} onChange={(event) => setBcpm(event.target.checked)} /> Mark BCPM from your own evidence</label></div>
      </div>
      <div className="planning-boundary">Saved as a student-owned course record in {destination?.term ?? 'the plan'}. This does not register the course or mark a requirement complete.</div>
      <DialogFooter><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={save} disabled={!code.trim() || !title.trim() || !(Number(credits) > 0)}>Add to {destination?.term ?? 'plan'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}

function requirementLabelsForCandidate(candidate: LocalCatalogCandidate) {
  const ids = new Set(candidate.requirementNodeIds)
  return UNC_PLANNING_LIBRARY.flatMap((program) => program.nodes
    .filter((node) => ids.has(`${program.id}:${node.id}`))
    .map((node) => node.label))
    .filter((label, index, labels) => labels.indexOf(label) === index)
}

function catalogPlanningTags(candidate: LocalCatalogCandidate, selectedProgramId?: string) {
  const tags: string[] = []
  if (selectedProgramId && candidate.programIds.includes(selectedProgramId)) tags.push('Major option')
  if (UNC_CATALOG_REQUIREMENTS.some((option) => catalogCourseHasRequirement(candidate.attributes, option.value))) tags.push('IDEAs')
  const planningText = requirementLabelsForCandidate(candidate).join(' ').toLocaleLowerCase()
  if (/biology|chemistry|physics|biochemistry|psychology|statistics/.test(planningText)) tags.push('Premed / MCAT context')
  return tags
}

/** One mapping seam for the term chip, inspector, coverage rail, and
 * trajectory. The selected-program library remains candidate evidence, so it
 * is always labeled inferred and never upgrades itself to an official audit. */
function planningCourseEffects(
  course: Course,
  requirements: Parameters<typeof courseEffects>[1],
  courses: Course[],
  selectedProgram?: UncPlanningRequirementSet,
) {
  const base = courseEffects(course, requirements, courses)
  if (!selectedProgram) return base
  const code = course.code.trim().toUpperCase().replace(/\s+/g, ' ')
  const programClears = selectedProgram.nodes.flatMap((node) =>
    node.courseCodes?.some((candidate) => candidate.trim().toUpperCase().replace(/\s+/g, ' ') === code)
      ? [{
        label: node.label,
        group: `${selectedProgram.program} ${selectedProgram.degree}`,
        confidence: 'inferred' as const,
        source: `UNC ${selectedProgram.catalogYear} catalog · retrieved ${selectedProgram.retrievedAt}`,
      }]
      : [])
  const seen = new Set<string>()
  return {
    ...base,
    clears: [...programClears, ...base.clears].filter((effect) => {
      const key = `${effect.group}\u0000${effect.label}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  }
}

function OutcomeRail({ mcatDate, selectedProgramId, hasCourseDestination, onAddCourse, onReviewRequirements }: { mcatDate?: string; selectedProgramId?: string; hasCourseDestination: boolean; onAddCourse: () => void; onReviewRequirements: () => void }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const projection = outcomeProjection(courses)
  const late = prereqVsMcat(courses, mcatDate)
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const coverage = selectedProgram ? candidatePlanCoverage(selectedProgram, courses.map((course) => course.code)) : undefined
  const open = coverage
    ? coverage.filter((item) => item.state !== 'scheduled').map((item) => ({ id: item.node.id, label: item.node.label }))
    : unplacedRequirements(requirements, courses)

  return (
    <aside className="planning-card planning-trajectory-card">
      <header><div><p className="planning-eyebrow">Plan trajectory</p>
      <h4 className="mt-0.5 font-display text-sm font-extrabold">If this plan holds</h4>
      </div><span className="planning-eyebrow">Projected</span></header>
      <div className="planning-trajectory-body"><div className="planning-trajectory-readout">
        <Stat label="Cumulative" value={fmtGpa(projection.cumulative)} />
        <Stat label="Science (BCPM)" value={fmtGpa(projection.science)} />
      </div>
      <div className="planning-runway" aria-label="Projected planning sequence"><div data-state="done"><small>Recorded</small><b>{projection.gradedCredits} graded credits</b></div><div data-state={open.length ? 'gap' : 'done'}><small>Open requirement</small><b>{open[0]?.label ?? 'No local gap named'}</b></div><div data-state="milestone"><small>{mcatDate || 'Date not recorded'}</small><b>MCAT</b><span>{late.length ? `${late.length} course${late.length === 1 ? '' : 's'} at or after target` : mcatDate ? 'Recorded sequence precedes target' : 'Manual review'}</span></div><div><small>Plan</small><b>{projection.plannedCredits} planned credits</b></div></div>
      <div className="planning-trajectory-actions"><button type="button" onClick={onReviewRequirements}><span>1</span><div><b>{open[0] ? `Review ${open[0].label}` : 'Review requirement evidence'}</b><small>{selectedProgram ? 'Selected major map' : 'Choose a major first'}</small></div><i>→</i></button><button type="button" onClick={onAddCourse}><span>2</span><div><b>{hasCourseDestination ? 'Add course to the next open term' : 'Add an editable term first'}</b><small>{hasCourseDestination ? 'Uses the inline UNC catalog' : 'Create a term before choosing a course'}</small></div><i>→</i></button></div>
      <p className="planning-trajectory-note">Local projection from placed courses · official completion and enrollment remain in ConnectCarolina.</p></div>
    </aside>
  )
}

/** C — opens from a chip, commits nothing, and says which mappings are inferred. */
function Inspector({ course, selectedProgram, planningLocked, onClose, onPlace }: { course: Course; selectedProgram?: UncPlanningRequirementSet; planningLocked: boolean; onClose: () => void; onPlace: () => void }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const patchItem = useStore((s) => s.patchItem)
  const softDeleteItems = useStore((s) => s.softDeleteItems)
  const [editing, setEditing] = useState(false)
  const effects = planningCourseEffects(course, requirements, courses, selectedProgram)

  const patch = (fields: Partial<Course>) => patchItem('courses', course.id, fields)
  // Soft delete, so an accidental removal is recoverable rather than final.
  const remove = () => { softDeleteItems('courses', [course.id], 'Removed course from plan'); onClose() }

  return (
    <aside className="planning-card h-fit p-[14px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={EYEBROW}>Selected course</p>
          <h4 className="mt-0.5 font-display text-sm font-extrabold">{course.code}</h4>
          <p className="text-[11px] font-bold text-muted-foreground">{course.title}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close inspector">
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-2.5 border-t border-border pt-2.5">
        <p className={EYEBROW}>What it clears</p>
        {effects.clears.length ? (
          <ul className="mt-1.5 space-y-1.5">
            {effects.clears.map((effect) => (
              <li key={effect.label} className="rounded-lg border border-border bg-muted p-2">
                <b className="font-display text-[11.5px] font-extrabold">{effect.label}</b>
                <p className="text-[10.5px] font-bold text-muted-foreground">{effect.group}</p>
                <p className={cn(
                  'mt-0.5 text-[10px] font-bold',
                  effect.confidence === 'verified' ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300',
                )}>
                  {effect.confidence === 'verified'
                    ? `Verified${effect.source ? ` · ${effect.source}` : ''}`
                    : `Inferred mapping${effect.source ? ` · ${effect.source}` : ''} · confirm with an advisor`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            No recorded requirement names this course.
          </p>
        )}
      </div>

      {effects.unlocks.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <p className={EYEBROW}>What it unlocks</p>
          <ul className="mt-1 space-y-0.5 text-[11px] font-bold">
            {effects.unlocks.map((item) => <li key={item.id}>{item.code} — {item.title}</li>)}
          </ul>
        </div>
      )}

      {effects.offeringRisk && (
        <div className="mt-3 rounded-lg border border-amber-500/45 bg-amber-500/5 p-2 text-[11px] font-bold text-muted-foreground">
          <b className="font-display text-foreground">Offering risk. </b>{effects.offeringRisk}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-2.5">
        {isProtected(course) || planningLocked ? (
          <p className="text-[10.5px] font-bold text-muted-foreground">{planningLocked ? 'Unlock this planning term before moving, editing, or removing its courses.' : 'This recorded course is locked from planning moves.'}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={onPlace}>Choose term</Button>
            {/* A planned course had no edit or remove path: `Add course` writes
                the row immediately, so an empty or wrong record could be created
                and then never corrected or taken back. Both live here now. */}
            <Button size="sm" variant="outline" onClick={() => setEditing((open) => !open)}>
              {editing ? 'Done editing' : 'Edit details'}
            </Button>
            <Button size="sm" variant="ghost" onClick={remove}>
              <Trash2 className="size-3.5" /> Remove
            </Button>
          </div>
        )}
        {editing && !isProtected(course) && !planningLocked && (
          <div className="mt-2.5 grid gap-1.5">
            <label className="planning-inspect-field">
              <small>Course code</small>
              <input value={course.code} placeholder="Not recorded" aria-label="Course code"
                onChange={(event) => patch({ code: event.target.value })} />
            </label>
            <label className="planning-inspect-field">
              <small>Title</small>
              <input value={course.title} placeholder="Not recorded" aria-label="Course title"
                onChange={(event) => patch({ title: event.target.value })} />
            </label>
            <label className="planning-inspect-field">
              <small>Credits</small>
              <input value={String(course.credits ?? '')} inputMode="decimal" aria-label="Credits"
                onChange={(event) => patch({ credits: Number(event.target.value) || 0 })} />
            </label>
          </div>
        )}
        <p className="mt-2 text-[10.5px] font-bold text-muted-foreground">Nothing changes until you choose a destination.</p>
      </div>
    </aside>
  )
}

function PlacementDialog({
  course, open, columns, label, onLabelChange, kind, onKindChange, onAdd, onPlace, onOpenChange,
}: {
  course?: Course
  open: boolean
  columns: ReturnType<typeof plannerTerms>
  label: string
  onLabelChange: (value: string) => void
  kind: PlannerTerm['kind']
  onKindChange: (value: PlannerTerm['kind']) => void
  onAdd: () => void
  onPlace: (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => void
  onOpenChange: (open: boolean) => void
}) {
  const [previewTermId, setPreviewTermId] = useState<string | undefined>()
  const preview = columns.find((column) => (column.id ?? column.term) === previewTermId)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{course ? `Place ${course.code}` : 'Add a planning term'}</DialogTitle>
          <DialogDescription>{course ? 'Choose a recorded term. Locked or registered terms cannot be changed here.' : 'A term is a planning slot, not an official registration record.'}</DialogDescription>
        </DialogHeader>
        {course && <div className="grid gap-2 sm:grid-cols-2">
          {columns.map((column) => {
            const blocked = Boolean(column.lockedAt || column.registered)
            return <Button key={column.id ?? column.term} variant={preview === column ? 'default' : 'outline'} className="h-auto justify-start py-3 text-left" disabled={blocked} onClick={() => setPreviewTermId(column.id ?? column.term)}>
              <span><b className="block font-display">{column.term}</b><span className="text-[11px] text-muted-foreground">{blocked ? (column.lockedAt ? 'Locked term' : 'Registered term') : `${column.credits} credits placed`}</span></span>
            </Button>
          })}
        </div>}
        {course && preview && <div className="rounded-xl border border-border bg-muted p-3 text-xs font-bold">
          <p><b className="font-display">Preview:</b> move {course.code} from {course.term} to {preview.term}.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">The inspector names recorded requirement effects; no catalog substitute or official completion is inferred here.</p>
          <Button size="sm" className="mt-2" onClick={() => onPlace(course, preview)}>Place in {preview.term}</Button>
        </div>}
        <div className="border-t border-border pt-3">
          <p className={EYEBROW}>New term slot</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="e.g. Summer 2027" className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2.5 py-2 text-xs font-bold" />
            <PlannerSelect label="Term type" value={kind} onValueChange={(value) => onKindChange(value as PlannerTerm['kind'])} className="w-32" options={[{ value: 'standard', label: 'Standard' }, { value: 'summer', label: 'Summer' }, { value: 'gap', label: 'Gap' }]} />
            <Button size="sm" variant="outline" onClick={onAdd} disabled={!label.trim()}>Add term</Button>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TermEditor({ term, onOpenChange }: { term?: PlannerTerm; onOpenChange: (open: boolean) => void }) {
  const [note, setNote] = useState(term?.note ?? '')
  const [locked, setLocked] = useState(Boolean(term?.lockedAt))
  const openedId = term?.id
  return (
    <Dialog open={Boolean(term)} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle>Term details</DialogTitle><DialogDescription>Keep a short reason for a locked planning term. This is not an official registration status.</DialogDescription></DialogHeader>
        {term && <div className="space-y-3">
          <p className="font-display text-sm font-extrabold">{term.label}</p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note or constraint" className="min-h-20 w-full rounded-lg border border-border bg-muted p-2 text-xs font-bold" />
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} /> Lock this planning term</label>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => {
          if (!openedId) return
          useStore.getState().update((draft) => {
            const target = draft.academics.classCenter.plannerTerms.find((slot) => slot.id === openedId)
            if (!target) return
            target.note = note.trim() || undefined
            target.lockedAt = locked ? (target.lockedAt ?? Date.now()) : undefined
            target.updatedAt = Date.now()
          })
          onOpenChange(false)
        }}>Save term details</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-2">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  )
}
