/**
 * Syllabus import — the temporary full-screen mode (§4.1-M-a).
 *
 * Ruled: "like exam prep mode, import is a temporary full-screen flow, not a
 * permanent surface." This replaces the former max-w-xl Dialog. The parse, the
 * diff engine, and local retention are untouched — this file is the screen.
 *
 * Drawing: mockup-lab/01-academics/academics-syllabus-import.html (4 frames)
 * Decisions: academics-syllabus-import.md — behaviour AND appearance.
 * Pattern: components/academics/ExamPrepMode.tsx, the same temporary mode.
 */
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, FileText, Upload, X } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { MascotNote } from '@/components/common/MascotNote'
import { Collapsible } from '@/components/common/Collapsible'
import { AnimatedFileUpload } from '@/components/motion/AnimatedFileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/common/useToast'
import { SharedSyllabusStructurePanel } from '@/components/academics/SharedSyllabusStructurePanel'
import {
  extractSyllabusFile, mergeSyllabusProposals, parseSyllabusText, weightGap,
  type SyllabusProposal, type SyllabusKind, type StructuralSignal,
} from '@/lib/academics/syllabusParser'
import { syllabusReimportDiff, type ReimportRow } from '@/lib/academics/syllabusReimport'
import type { AssignedReading, Course, GradeCategory, SyllabusScheduleEntry, Topic } from '@/lib/types'
import type { ClassAssignment } from '@/lib/types'

/** Ruled review order (§4.1-M-c): identity → standards → exams → weights → units → deadlines → policies → logistics. */
const REVIEW_ORDER: SyllabusKind[] = ['identity', 'standards', 'exams', 'weights', 'units', 'readings', 'deadlines', 'policies', 'logistics']
const GROUP_LABEL: Record<SyllabusKind, string> = {
  identity: 'Class identity', standards: 'Learning standards', exams: 'Exam dates', weights: 'Grade weights', units: 'Schedule scope', readings: 'Assigned readings',
  deadlines: 'Deadlines', policies: 'Policies & boundaries', logistics: 'People, meetings & support',
}
const STRUCTURE_LABEL: Record<StructuralSignal, string> = {
  standards: 'Stated learning standards or objectives', weights: 'Grade weights that sum to 100%', exams: 'Exam or midterm dates',
  units: 'A week-by-week or unit schedule', logistics: 'An instructor and office-hours block',
}
const APPLY_ROWS: Array<[SyllabusKind, string]> = [
  ['identity', 'class identity'], ['standards', 'learning standards'], ['units', 'scheduled class scope'],
  ['readings', 'dated reading tasks'], ['deadlines', 'deadlines'], ['exams', 'exam dates'],
  ['weights', 'grade categories'], ['policies', 'policy & boundary records'], ['logistics', 'people, meetings & course context'],
]
const APPLY_GROUPS: Array<{ label: string; kinds: SyllabusKind[] }> = [
  { label: 'Course setup', kinds: ['identity', 'weights', 'policies', 'logistics'] },
  { label: 'Study map', kinds: ['standards', 'units', 'readings'] },
  { label: 'Calendar', kinds: ['deadlines', 'exams'] },
]

export type ReimportDecision = { row: ReimportRow; action: ReimportRow['defaultAction'] }
export type PastDueImportAction = 'complete' | 'keep'
const reimportActionKey = (row: ReimportRow) => `${row.kind}:${row.key}`

function localTodayIso(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function pastDatedSyllabusWork(proposal: SyllabusProposal, today = localTodayIso()) {
  return proposal.items.filter((item) =>
    (item.kind === 'readings' || item.kind === 'deadlines' || item.kind === 'exams')
    && /^\d{4}-\d{2}-\d{2}$/.test(item.value ?? '')
    && (item.value ?? '') < today,
  )
}

export function SyllabusImportMode({
  semester, scopedCourse, reimport = false, reimportFileId, current,
  initialProposal, initialFiles = [], initialCourse, onBackFromReview,
  onExit, onImport, onFileMaterial,
}: {
  semester: string
  scopedCourse?: Course
  reimport?: boolean
  reimportFileId?: string
  current?: { topics: Topic[]; assignments: ClassAssignment[]; categories: GradeCategory[]; readings?: AssignedReading[]; schedule?: SyllabusScheduleEntry[] }
  /** Cold Add-class review starts here after the details sheet. These values
   * are staged UI state only and are never written until `onImport`. */
  initialProposal?: SyllabusProposal
  initialFiles?: File[]
  initialCourse?: { courseCode: string; courseTitle: string; semester: string; type?: string }
  onBackFromReview?: (proposal: SyllabusProposal) => void
  onExit: () => void
  onImport: (
    form: { courseCode: string; courseTitle: string; semester: string },
    files: File[], proposal?: SyllabusProposal, existingCourseId?: string,
    decisions?: ReimportDecision[], replaceSyllabusFileId?: string,
    pastDueAction?: PastDueImportAction,
  ) => Promise<void>
  /** A readable non-syllabus can be filed only into an existing class's
   * Materials shelf. It never enters the syllabus apply path. */
  onFileMaterial?: (files: File[], proposal: SyllabusProposal, courseId: string) => Promise<void>
}) {
  const [courseCode, setCourseCode] = useState(initialCourse?.courseCode ?? '')
  const [courseTitle, setCourseTitle] = useState(initialCourse?.courseTitle ?? '')
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [pastedText, setPastedText] = useState('')
  const [proposal, setProposal] = useState<SyllabusProposal | null>(initialProposal ?? null)
  const [parsing, setParsing] = useState(false)
  const [parsingMessage, setParsingMessage] = useState('Reading syllabus…')
  const [error, setError] = useState<string | null>(null)
  const [reviewAnyway, setReviewAnyway] = useState(false)
  const [applying, setApplying] = useState(false)
  const [reimportRows, setReimportRows] = useState<ReimportRow[]>([])
  const [reimportActions, setReimportActions] = useState<Record<string, ReimportRow['defaultAction']>>({})
  const [confirmedItemIds, setConfirmedItemIds] = useState<ReadonlySet<string>>(() => new Set())
  const [pastDuePromptOpen, setPastDuePromptOpen] = useState(false)
  const toast = useToast()

  /** Wrong document (§4.1-M-d): readable, and still not a syllabus. Always overridable. */
  const misfiled = Boolean(proposal && proposal.documentKind === 'unrecognized' && !reviewAnyway)

  async function parse() {
    setError(null); setParsing(true)
    try {
      const proposals: SyllabusProposal[] = []
      if (!pastedText.trim()) {
        for (const file of files) {
          proposals.push(await extractSyllabusFile(file, { onProgress: (progress) => setParsingMessage(progress.message) }))
        }
      }
      const next = pastedText.trim()
        ? parseSyllabusText(pastedText, 'Pasted syllabus')
        : mergeSyllabusProposals(proposals)
      setProposal(next)
      setConfirmedItemIds(new Set())
      setReviewAnyway(false)
      if (reimport && current) {
        const rows = syllabusReimportDiff(current, next.items)
        setReimportRows(rows)
        setReimportActions(Object.fromEntries(rows.map((row) => [reimportActionKey(row), row.defaultAction])))
      }
      const identity = next.items.find((item) => item.kind === 'identity')
      if (identity && !courseCode) { setCourseCode(identity.label); setCourseTitle((title) => identity.value || title) }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This file could not be read.')
    } finally {
      setParsing(false)
      setParsingMessage('Reading syllabus…')
    }
  }

  function patchItem(id: string, patch: Partial<SyllabusProposal['items'][number]>) {
    setConfirmedItemIds((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
    setProposal((state) => state ? { ...state, items: state.items.map((item) => item.id === id ? { ...item, ...patch } : item) } : state)
  }
  function removeItem(id: string) {
    setConfirmedItemIds((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
    setProposal((state) => state ? { ...state, items: state.items.filter((item) => item.id !== id) } : state)
  }
  function confirmItem(id: string) {
    setConfirmedItemIds((current) => new Set(current).add(id))
  }
  function addManual(kind: SyllabusKind) {
    setProposal((state) => state ? {
      ...state,
      items: [...state.items, { id: `${kind}-manual-${Date.now()}`, kind, label: '', value: '', confidence: 'low', evidence: { quote: 'Added manually', location: 'manual entry' } }],
    } : state)
  }

  const grouped = useMemo(
    () => proposal ? REVIEW_ORDER.map((kind) => [kind, proposal.items.filter((item) => item.kind === kind)] as const) : [],
    [proposal],
  )
  const gap = proposal ? weightGap(proposal.items) : null
  const decisions: ReimportDecision[] = reimportRows.map((row) => ({ row, action: reimportActions[reimportActionKey(row)] ?? row.defaultAction }))
  const decided = reimportRows.filter((row) => reimportActions[reimportActionKey(row)] !== undefined).length
  const flaggedCount = proposal ? proposal.items.filter((item) => item.confidence === 'low' && !confirmedItemIds.has(item.id)).length : 0
  const missingCount = proposal ? REVIEW_ORDER.filter((kind) => !proposal.items.some((item) => item.kind === kind)).length : 0
  const pastDueItems = proposal ? pastDatedSyllabusWork(proposal) : []

  /** Mode tag states what is happening — never a step number (§4.1-M-b: no wizard). */
  const modeTag = reimport
    ? `Re-import · ${scopedCourse?.code ?? 'this class'}`
    : proposal ? 'Import syllabus · review before apply' : 'Import syllabus · nothing saved yet'

  const heading = misfiled ? 'That reads like course material'
    : reimport && proposal ? `${reimportRows.filter((row) => row.status !== 'unchanged').length} things changed`
    : proposal ? 'Review syllabus'
    : scopedCourse ? `Add a syllabus to ${scopedCourse.code}` : 'Add a class from its syllabus'

  const subline = misfiled ? scopedCourse
    ? 'I read the whole thing — there’s just no syllabus in it. You can file it in this class’s Materials without changing class records.'
    : 'I read the whole thing — there’s just no syllabus in it. Nothing will be saved until you choose where it belongs.'
    : reimport && proposal ? 'Nothing you’ve already confirmed will be touched unless you accept it here.'
    : proposal ? (flaggedCount
      ? `${flaggedCount} ${flaggedCount === 1 ? 'item needs' : 'items need'} confirmation; everything else is collapsed.`
      : 'Open any section to verify it against the source.')
    : 'Drop the file and HQ pulls out your units, exam dates, deadlines, and grade weights — then you confirm all of it before anything is saved.'

  const bannerMetrics = proposal ? (reimport ? [
    { id: 'added', label: 'Added', value: String(reimportRows.filter((r) => r.status === 'added').length), cadence: 'variable' as const },
    { id: 'changed', label: 'Changed', value: String(reimportRows.filter((r) => r.status === 'changed').length), cadence: 'variable' as const },
    { id: 'removed', label: 'Removed', value: String(reimportRows.filter((r) => r.status === 'removed').length), cadence: 'variable' as const },
    { id: 'untouched', label: 'Untouched', value: String(reimportRows.filter((r) => r.status === 'unchanged').length), cadence: 'variable' as const },
  ] : [
    { id: 'found', label: misfiled ? 'Items found' : 'Items found', value: String(misfiled ? 0 : proposal.items.length), cadence: 'variable' as const },
    { id: 'look', label: misfiled ? 'File kept' : 'To confirm', value: String(misfiled ? 1 : flaggedCount), cadence: 'variable' as const },
    { id: 'missing', label: 'Not found', value: String(misfiled ? REVIEW_ORDER.length : missingCount), cadence: 'variable' as const },
  ]) : []

  function back() {
    if (proposal && onBackFromReview) {
      onBackFromReview(proposal)
      return
    }
    if (proposal) {
      setProposal(null)
      setReviewAnyway(false)
      return
    }
    onExit()
  }

  async function apply(pastDueAction?: PastDueImportAction) {
    if (!misfiled && !reimport && flaggedCount > 0) {
      toast({
        title: 'Confirm the flagged details first',
        description: `${flaggedCount} ${flaggedCount === 1 ? 'item still needs' : 'items still need'} your confirmation or removal.`,
      })
      return
    }
    if (!misfiled && pastDueItems.length > 0 && !pastDueAction) {
      setPastDuePromptOpen(true)
      return
    }
    setApplying(true)
    try {
      if (misfiled) {
        // A cold import has no course-owned Materials shelf. Never create a
        // class just because the selected document is not a syllabus.
        if (!proposal || !scopedCourse || !onFileMaterial) return
        await onFileMaterial(files, proposal, scopedCourse.id)
      } else {
        await onImport(
          { courseCode, courseTitle, semester }, files, proposal ?? undefined, scopedCourse?.id,
          reimport ? decisions : undefined, reimport ? reimportFileId : undefined, pastDueAction,
        )
      }
      toast({
        title: misfiled ? 'Material filed' : reimport ? 'Syllabus changes applied' : 'Syllabus applied',
        description: misfiled ? `Added to ${scopedCourse?.code} Materials without changing class records.` : reimport ? 'Only the changes you accepted were applied.' : `Updated ${scopedCourse?.code || courseCode || 'your class'} from the reviewed proposal.`,
      })
    } finally { setApplying(false) }
  }

  return (
    <main className="syllabus-import-mode min-h-full bg-background" aria-labelledby="syllabus-import-title">
      <PageHeader
        scene="academics"
        title={heading}
        subtitle={subline}
        className="syllabus-import-header"
      >
        <div className="flex flex-wrap items-center gap-3 p-2">
          <Button variant="ghost" className="text-white/90 hover:bg-white/10 hover:text-white" onClick={back}>
            <ArrowLeft className="size-4" /> {proposal ? 'Back' : 'Cancel'}
          </Button>
          <span className="glass-surface glass-surface--dark rounded-full px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/70">
            {modeTag}
          </span>
          {proposal && bannerMetrics.length > 0 && (
            <dl className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-white/75">
              {bannerMetrics.map((metric) => (
                <div key={metric.id} className="flex items-baseline gap-1.5">
                  <dd className="font-display text-sm font-extrabold text-white">{metric.value}</dd>
                  <dt className="text-[10px] font-extrabold uppercase tracking-[0.08em]">{metric.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </PageHeader>

      <span id="syllabus-import-title" className="sr-only">{heading}</span>

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        {!proposal ? <UploadState
          files={files} pastedText={pastedText} parsing={parsing} parsingMessage={parsingMessage} error={error}
          onFiles={(next) => { setFiles(next); setError(null) }}
          onPaste={setPastedText} onParse={parse}
        /> : (
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_316px]">
            <div className="min-w-0 flex flex-col gap-4">
              {misfiled ? (
                <MisfiledCard
                  proposal={proposal}
                  canFile={Boolean(scopedCourse && onFileMaterial)}
                  onFile={() => void apply()}
                  onChooseClass={onExit}
                  onReviewAnyway={() => setReviewAnyway(true)}
                  onRetry={() => setProposal(null)}
                />
              ) : (
                <>
                  {proposal.scanDetected && (
                    <section className="rounded-2xl border border-warning/40 bg-warning/8 p-4">
                      <h2 className="font-display text-base font-extrabold">I couldn’t read this one</h2>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        It looks like a scan without a text layer, so there’s nothing to pull out on this device. Paste the text
                        or choose a text-based PDF, DOCX, or TXT file. Your file is saved to this class either way.
                      </p>
                    </section>
                  )}
                  {!proposal.scanDetected && Boolean(proposal.ocrPageCount) && (
                    <section className="rounded-2xl border border-primary/30 bg-primary/8 px-4 py-3" role="status">
                      <p className="text-sm font-semibold text-foreground">
                        Read {proposal.ocrPageCount} scanned {proposal.ocrPageCount === 1 ? 'page' : 'pages'} on this device.
                      </p>
                    </section>
                  )}
                  {!proposal.scanDetected && Boolean(proposal.unreadablePageCount) && (
                    <section className="rounded-2xl border border-warning/40 bg-warning/8 p-4" role="status">
                      <h2 className="font-display text-base font-extrabold">Some pages still need a look</h2>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        I read the text on {Math.max(0, (proposal.pageCount ?? 0) - (proposal.unreadablePageCount ?? 0))} of {proposal.pageCount ?? 'the'} pages.
                        {' '}{proposal.unreadablePageCount} {proposal.unreadablePageCount === 1 ? 'page is' : 'pages are'} image-only, so its schedule or tables may be missing below. Nothing is treated as complete until you review it.
                      </p>
                    </section>
                  )}
                  {reimport ? (
                    <ReimportDiff rows={reimportRows} actions={reimportActions} onAction={(row, action) => setReimportActions((state) => ({ ...state, [reimportActionKey(row)]: action }))} />
                  ) : (
                    <>
                      {!scopedCourse && !initialCourse && (
                        <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
                          <h2 className="font-display text-base font-extrabold">Which class is this?</h2>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">Prefilled from the syllabus. Correct it if it’s wrong.</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Course code
                              <Input className="mt-1" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="CHEM 262" /></label>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Course title
                              <Input className="mt-1" value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} placeholder="Organic Chemistry II" /></label>
                          </div>
                        </section>
                      )}
                      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_44px_-28px_rgba(0,0,0,0.72)]" aria-label="Extracted syllabus details">
                        <div className="border-b border-border bg-muted/55 px-4 py-3.5 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="font-display text-base font-extrabold">
                                  {scopedCourse ? `${scopedCourse.code} · ${scopedCourse.title}` : `${courseCode} · ${courseTitle}`}
                                </p>
                                {!scopedCourse && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-primary">New class · not saved</span>}
                              </div>
                              <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                                <FileText className="mr-1 inline size-3.5 text-primary" aria-hidden="true" />
                                {proposal.sourceName}
                                {!scopedCourse && initialCourse && <span> · {initialCourse.semester} · {initialCourse.type ? initialCourse.type[0].toUpperCase() + initialCourse.type.slice(1) : ''}</span>}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-extrabold text-success">
                              <CheckCircle2 className="size-3.5" /> Source linked
                            </span>
                          </div>
                        </div>

                        <div className="lg:grid lg:grid-cols-[196px_minmax(0,1fr)]">
                          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background/55 p-2 lg:block lg:overflow-visible lg:border-b-0 lg:border-r lg:p-3" aria-label="Extraction sections">
                            <p className="hidden px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground lg:block">Review sections</p>
                            {grouped.map(([kind, items]) => {
                              const flagged = items.filter((item) => item.confidence === 'low' && !confirmedItemIds.has(item.id)).length
                              return (
                                <button
                                  key={kind}
                                  type="button"
                                  onClick={() => document.getElementById(`syllabus-group-${kind}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                  className="group flex w-full shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full"
                                >
                                  <span className={cn('size-2 shrink-0 rounded-full', flagged ? 'bg-warning' : items.length ? 'bg-success' : 'border border-border bg-background')} aria-hidden="true" />
                                  <span className="whitespace-nowrap lg:min-w-0 lg:flex-1 lg:truncate">{GROUP_LABEL[kind]}</span>
                                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] tabular-nums', flagged ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground')}>{items.length}</span>
                                </button>
                              )
                            })}
                          </nav>
                          <div className="min-w-0">
                            <div className="border-b border-border px-4 py-3 sm:px-5">
                              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Extracted records</p>
                            </div>
                            {grouped.map(([kind, items]) => (
                              <ReviewGroup
                                key={kind} kind={kind} items={items}
                                searched={proposal.searched[kind]}
                                confirmedItemIds={confirmedItemIds}
                                onPatch={patchItem} onRemove={removeItem} onAddManual={() => addManual(kind)}
                                onConfirm={confirmItem}
                              />
                            ))}
                          </div>
                        </div>
                      </section>
                      {gap !== null && gap !== 0 && (
                        <p className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm font-bold">
                          Grade weights are {Math.abs(gap)}% {gap > 0 ? 'short of' : 'over'} 100%. Nothing was normalized.
                        </p>
                      )}
                      <Collapsible title="Advanced: optional course structure sharing" badge={<span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">Private by default</span>}>
                        <SharedSyllabusStructurePanel
                          proposal={proposal}
                          courseCode={scopedCourse?.code || courseCode}
                          term={semester}
                          onStageCandidate={(items) => setProposal((current) => current ? { ...current, items } : current)}
                        />
                      </Collapsible>
                    </>
                  )}
                </>
              )}
            </div>

            <ApplyRail
              misfiled={misfiled} reimport={reimport} proposal={proposal}
              rows={reimportRows} decided={decided} applying={applying}
              unresolvedCount={flaggedCount}
              courseLabel={scopedCourse?.code || courseCode || courseTitle || 'this class'}
              canFileMaterial={Boolean(scopedCourse && onFileMaterial)}
              onApply={() => void apply()}
              onAcceptAll={() => setReimportActions(Object.fromEntries(reimportRows.map((row) => [reimportActionKey(row), 'accept' as const])))}
              onKeepAll={() => setReimportActions(Object.fromEntries(reimportRows.map((row) => [reimportActionKey(row), 'keep' as const])))}
            />
          </div>
        )}
      </div>
      <AlertDialog open={pastDuePromptOpen} onOpenChange={setPastDuePromptOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>This syllabus includes {pastDueItems.length} past-dated {pastDueItems.length === 1 ? 'item' : 'items'}</AlertDialogTitle>
            <AlertDialogDescription>
              If you are adding or updating the syllabus after classes began, these may be work you already handled. Marking them done keeps their dates and source, but removes them from Overdue. You can also keep them as overdue work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-border bg-muted/55 p-3 text-sm font-semibold text-muted-foreground">
            {pastDueItems.slice(0, 3).map((item) => <p key={item.id} className="truncate">{item.label} · {item.value}</p>)}
            {pastDueItems.length > 3 && <p>+{pastDueItems.length - 3} more</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => void apply('keep')}>Keep as overdue</AlertDialogCancel>
            <AlertDialogAction onClick={() => void apply('complete')}><CheckCircle2 className="size-4" /> Mark past items done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

/** Upload — dropzone dominant in a narrow reading column. Paste is an equal path. */
function UploadState({ files, pastedText, parsing, parsingMessage, error, onFiles, onPaste, onParse }: {
  files: File[]; pastedText: string; parsing: boolean; parsingMessage: string; error: string | null
  onFiles: (files: File[]) => void; onPaste: (text: string) => void; onParse: () => void
}) {
  return (
    <div className="mx-auto max-w-[840px] py-2">
      <AnimatedFileUpload
        accept=".pdf,.docx,.txt,text/plain" multiple onFiles={onFiles}
        label="Drop a syllabus or course schedule here"
        description="Text-based PDF, DOCX, or TXT. The source file stays on this device."
      />
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-sm font-extrabold">Or paste the text instead</p>
        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Copying out of Canvas is common and shouldn’t need a file first.</p>
        <Textarea className="mt-2 min-h-28" value={pastedText} onChange={(event) => onPaste(event.target.value)} placeholder="Paste syllabus text from Canvas…" />
      </div>
      {error && <p className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold">{error} Paste the text or continue with manual entry; importing never blocks you.</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        <MascotNote variant="tip" className="flex-1">
          Nothing is saved until you review it. Saved records can sync when cloud sync is enabled.
        </MascotNote>
        <Button size="lg" disabled={(!files.length && !pastedText.trim()) || parsing} onClick={onParse}>
          <Upload className="size-4" /> {parsing ? parsingMessage : 'Read syllabus'}
        </Button>
      </div>
    </div>
  )
}

/** A group collapses to one factual summary when clean; any low-confidence item expands it. */
function ReviewGroup({ kind, items, searched, confirmedItemIds, onPatch, onRemove, onAddManual, onConfirm }: {
  kind: SyllabusKind; items: SyllabusProposal['items']; searched: string
  confirmedItemIds: ReadonlySet<string>
  onPatch: (id: string, patch: Partial<SyllabusProposal['items'][number]>) => void
  onRemove: (id: string) => void
  onAddManual: () => void
  onConfirm: (id: string) => void
}) {
  const needsConfirmation = (item: SyllabusProposal['items'][number]) => item.confidence === 'low' && !confirmedItemIds.has(item.id)
  const flagged = items.some(needsConfirmation)
  // Keep clean groups compact so the review stays scannable at desktop and
  // narrow widths. Only rows that need a decision claim vertical attention.
  const [open, setOpen] = useState(flagged)
  const needsValue = ['identity', 'exams', 'weights', 'units', 'readings', 'deadlines'].includes(kind)
  const flaggedCount = items.filter(needsConfirmation).length
  return (
    <section id={`syllabus-group-${kind}`} className={cn('relative scroll-mt-6 border-b border-border last:border-b-0', flagged && 'bg-warning/[0.035]')}>
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', flagged ? 'bg-warning' : items.length ? 'bg-success/65' : 'bg-border')} aria-hidden="true" />
      <button type="button" onClick={() => setOpen((state) => !state)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3.5 pl-5 pr-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-display text-sm font-extrabold">
            {GROUP_LABEL[kind]}
          </span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">
            {items.length ? (flagged ? `${flaggedCount} ${flaggedCount === 1 ? 'item needs' : 'items need'} confirmation` : collapsedSummary(kind, items, searched)) : searched}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide', flagged ? 'bg-warning/18 text-warning' : items.length ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground')}>
            {flagged ? 'Confirm' : items.length ? `${items.length} found` : 'Not found'}
          </span>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="border-t border-border/70">
          {items.map((item) => (
            <div key={item.id} className="border-b border-border/60 py-3 pl-5 pr-4 last:border-b-0">
              {item.context && <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">{item.context}</p>}
              <div className={cn('grid items-start gap-2', (needsValue || item.value !== undefined) ? 'sm:grid-cols-[minmax(0,1.35fr)_minmax(160px,.65fr)_32px]' : 'grid-cols-[minmax(0,1fr)_32px]')}>
                <Input aria-label={`${GROUP_LABEL[kind]} label`} value={item.label} onChange={(event) => onPatch(item.id, { label: event.target.value })}
                  className={cn('h-8 font-bold', needsConfirmation(item) && 'border-warning')} />
                {(needsValue || item.value !== undefined) && (kind === 'policies' || (kind === 'logistics' && (item.value?.length ?? 0) > 120)
                  ? <Textarea aria-label={`${GROUP_LABEL[kind]} value`} value={item.value ?? ''} onChange={(event) => onPatch(item.id, { value: event.target.value })} className="min-h-20 resize-y text-xs" />
                  : <Input aria-label={`${GROUP_LABEL[kind]} value`} value={item.value ?? ''} onChange={(event) => onPatch(item.id, { value: event.target.value })} className="h-8" />)}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  aria-label={`Remove ${GROUP_LABEL[kind]} row`}
                  onClick={() => onRemove(item.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex min-h-8 flex-wrap items-start justify-between gap-2">
                <details className="min-w-0 text-xs font-semibold text-muted-foreground">
                  <summary className="w-fit cursor-pointer text-primary/90">View source</summary>
                  <p className="mt-1 border-l-2 border-primary/30 pl-2">{item.evidence.location} · “{item.evidence.quote}”</p>
                </details>
                {confirmedItemIds.has(item.id) ? (
                  <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 font-display text-xs font-extrabold text-success" role="status">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" /> Confirmed
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      'h-8 shrink-0 font-display font-extrabold',
                      item.confidence === 'low'
                        ? 'border-warning/55 bg-warning/10 text-warning hover:bg-warning/18 hover:text-warning'
                        : 'border-primary/35 bg-primary/[0.06] text-primary hover:bg-primary/12 hover:text-primary',
                    )}
                    aria-label={`Confirm ${item.label || GROUP_LABEL[kind]}`}
                    onClick={() => onConfirm(item.id)}
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" /> Confirm
                  </Button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={onAddManual} className="m-4 ml-5 text-xs font-bold text-primary underline underline-offset-4">Add manually</button>
        </div>
      )}
      {!open && items.length === 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 py-2.5 pl-5 pr-4 text-xs font-semibold text-muted-foreground">
          <span>No value was inferred.</span>
          <button type="button" onClick={onAddManual} className="shrink-0 font-bold text-primary underline underline-offset-4">Add manually</button>
        </div>
      )}
    </section>
  )
}

function collapsedSummary(kind: SyllabusKind, items: SyllabusProposal['items'], searched: string) {
  const first = items[0]
  if (!first) return searched
  const visible = items.slice(0, 2).map((item) => item.value ? `${item.label}: ${item.value}` : item.label).filter(Boolean)
  const suffix = items.length > 2 ? ` · +${items.length - 2} more` : ''
  const summary = `${visible.join(' · ')}${suffix}`
  return kind === 'policies' || kind === 'logistics' ? `${items.length} source-backed records` : summary
}

/** Wrong document (§4.1-M-d). Academics accent, NOT the warning tone: nothing failed. */
function MisfiledCard({ proposal, canFile, onFile, onChooseClass, onReviewAnyway, onRetry }: {
  proposal: SyllabusProposal; canFile: boolean; onFile: () => void; onChooseClass: () => void; onReviewAnyway: () => void; onRetry: () => void
}) {
  const missing = (Object.keys(STRUCTURE_LABEL) as StructuralSignal[]).filter((signal) => !proposal.structureFound.includes(signal))
  return (
    <section className="rounded-2xl border border-primary/35 bg-primary/8 p-4 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <h2 className="font-display text-base font-extrabold">This looks like course material, not a syllabus</h2>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">
        A syllabus has grade weights, exam dates, and a week-by-week schedule. <b className="text-foreground">{proposal.sourceName}</b> has
        none of those. That’s a perfectly good file to keep — it belongs in Materials, filed against the unit it practises,
        where the study tools can actually use it.
      </p>
      <div className="mt-3 rounded-xl border border-border bg-background p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">What I looked for and didn’t find</p>
        <ul className="mt-1.5 space-y-1">
          {missing.map((signal) => (
            <li key={signal} className="flex gap-2 text-xs font-bold text-muted-foreground"><span aria-hidden="true">✕</span>{STRUCTURE_LABEL[signal]}</li>
          ))}
          {proposal.numberedItems > 0 && (
            <li className="flex gap-2 text-xs font-bold text-primary">
              <span aria-hidden="true">✓</span>{proposal.numberedItems} numbered questions — which is why Materials is the better home
            </li>
          )}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {canFile
          ? <Button onClick={onFile}><FileText className="size-4" /> File it in Materials</Button>
          : <Button onClick={onChooseClass}><ArrowLeft className="size-4" /> Choose a class first</Button>}
        <Button variant="outline" onClick={onReviewAnyway}>It really is my syllabus — review anyway</Button>
        <Button variant="ghost" onClick={onRetry}>Try another file</Button>
      </div>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">
        Some syllabi genuinely are one page with no weights table, so this is a proposal like every other one on this screen —
        reviewing anyway drops you into the ordinary review with whatever was found.
      </p>
    </section>
  )
}

/** Editorial diff rows, not a table wall. The engine owns matching and defaults. */
function ReimportDiff({ rows, actions, onAction }: {
  rows: ReimportRow[]; actions: Record<string, ReimportRow['defaultAction']>
  onAction: (row: ReimportRow, action: ReimportRow['defaultAction']) => void
}) {
  const labels: Record<ReimportRow['status'], string> = { added: 'Added', changed: 'Changed', removed: 'Removed', unchanged: 'Unchanged' }
  const unchanged = rows.filter((row) => row.status === 'unchanged')
  return (
    <div className="flex flex-col gap-3">
      <p className="syllabus-import-inner rounded-2xl border border-border p-3 text-sm font-semibold">
        Changed and removed records default to <b>Keep mine</b>; nothing is overwritten or deleted until you explicitly accept it.
      </p>
      {(['added', 'changed', 'removed'] as const).map((status) => {
        const group = rows.filter((row) => row.status === status)
        if (!group.length) return null
        return (
          <section key={status} className={cn('rounded-2xl border p-3', status === 'removed' ? 'border-warning/45 bg-warning/8' : 'border-border bg-card')}>
            <h3 className="font-display text-sm font-extrabold">{labels[status]} · {group.length}</h3>
            <div className="mt-2 space-y-2">
              {group.map((row) => {
                const action = actions[reimportActionKey(row)] ?? row.defaultAction
                return (
                  <div key={reimportActionKey(row)} className="syllabus-import-inner flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{row.kind}</p>
                      <p className="mt-0.5 text-sm font-bold">
                        {row.status === 'changed'
                          ? <><span className="text-muted-foreground line-through">{row.current}</span> <span aria-hidden="true">→</span> {row.proposed}</>
                          : row.proposed ?? row.current}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button type="button" size="sm" variant={action === 'keep' ? 'default' : 'outline'} onClick={() => onAction(row, 'keep')}>Keep mine</Button>
                      <Button type="button" size="sm" variant={action === 'accept' ? 'default' : 'outline'} onClick={() => onAction(row, 'accept')}>
                        {row.status === 'removed' ? 'Remove' : 'Accept'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      {unchanged.length > 0 && (
        <p className="syllabus-import-inner rounded-2xl border border-border p-3 text-sm font-semibold text-muted-foreground">
          {unchanged.length} items are unchanged and are not listed again. Nothing to do.
        </p>
      )}
    </div>
  )
}

/** The sticky rail: the exact records that will be written, and nothing softer. */
function ApplyRail({ misfiled, reimport, proposal, rows, decided, applying, unresolvedCount, courseLabel, canFileMaterial, onApply, onAcceptAll, onKeepAll }: {
  misfiled: boolean; reimport: boolean; proposal: SyllabusProposal
  rows: ReimportRow[]; decided: number; applying: boolean; unresolvedCount: number; courseLabel: string; canFileMaterial: boolean
  onApply: () => void; onAcceptAll: () => void; onKeepAll: () => void
}) {
  const differences = rows.filter((row) => row.status !== 'unchanged').length
  return (
    <aside className="min-w-0 flex flex-col gap-3 lg:sticky lg:top-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_38px_-26px_rgba(0,0,0,0.72)]">
        {misfiled ? (
          <div className="p-4">
            <h2 className="font-display text-base font-extrabold">Nothing to apply</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">No class records would change</p>
            <dl className="mt-3 space-y-1">
              {APPLY_ROWS.map(([kind, label]) => (
                <div key={kind} className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <dt className="sr-only">{label}</dt>
                  <dd className="w-6 text-right font-display tabular-nums text-foreground">0</dd><span>{label}</span>
                </div>
              ))}
            </dl>
            {canFileMaterial && <Button className="mt-3 w-full" onClick={onApply} disabled={applying}><FileText className="size-4" /> File it in Materials</Button>}
            <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
              {canFileMaterial
                ? 'This import would write nothing. Filing the file is a Materials action, not an import.'
                : 'This import would write nothing. Choose a class first, or explicitly review this as a syllabus.'}
            </p>
          </div>
        ) : reimport ? (
          <div className="p-4">
            <h2 className="font-display text-base font-extrabold">Apply changes</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{differences} differences · {decided} decided</p>
            <Button className="mt-3 w-full" onClick={onApply} disabled={applying}><CheckCircle2 className="size-4" /> Apply accepted changes</Button>
            <Button variant="outline" className="mt-2 w-full" onClick={onAcceptAll}>Accept all {differences}</Button>
            <Button variant="ghost" className="mt-1.5 w-full" onClick={onKeepAll}>Keep everything as it is</Button>
            <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
              Either way it’s one write, and it’s reversible.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-border bg-muted/55 px-4 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Final check</p>
              <h2 className="mt-1 font-display text-lg font-extrabold">{unresolvedCount ? `Confirm ${unresolvedCount} ${unresolvedCount === 1 ? 'item' : 'items'}` : 'Ready to add'}</h2>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {unresolvedCount ? 'Confirm or remove every flagged detail before it is saved.' : `One reviewed write to ${courseLabel}.`}
              </p>
            </div>
            <dl className="divide-y divide-border">
              {APPLY_GROUPS.map((group) => {
                const details = APPLY_ROWS
                  .filter(([kind]) => group.kinds.includes(kind))
                  .map(([kind, label]) => ({ label, count: proposal.items.filter((item) => item.kind === kind).length }))
                const count = details.reduce((total, detail) => total + detail.count, 0)
                return (
                  <div key={group.label} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="font-display text-sm font-extrabold">{group.label}</dt>
                      <dd className="font-display text-lg font-extrabold tabular-nums text-primary">{count}</dd>
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold leading-4 text-muted-foreground">
                      {details.map((detail) => `${detail.count} ${detail.label}`).join(' · ')}
                    </p>
                  </div>
                )
              })}
            </dl>
            <div className="border-t border-border bg-background/45 p-3">
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/[0.06] p-2.5 text-[11px] font-semibold leading-4 text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                <span>Readings become dated before-class tasks. Office hours stay in course context, not the calendar.</span>
              </div>
              <Button className="w-full font-display font-extrabold" onClick={onApply} disabled={applying || unresolvedCount > 0}>
                <CheckCircle2 className="size-4" /> {unresolvedCount ? `Confirm ${unresolvedCount} above to continue` : `Add reviewed syllabus to ${courseLabel}`}
              </Button>
            </div>
          </>
        )}
      </section>
      {!misfiled && !reimport && (
        <p className="px-2 text-[11px] font-semibold leading-4 text-muted-foreground">
          Everything stays editable. The local source—including text that was not categorized—remains linked in Materials.
        </p>
      )}
    </aside>
  )
}
