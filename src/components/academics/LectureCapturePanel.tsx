import { useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Brain, Captions, Check, ChevronDown, CircleHelp, FileCheck2, FilePlus2, FileSearch, FileStack, FileText, FileUp, ListChecks, Mic2, MoreHorizontal, NotebookText, Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { AcademicFile, ClassCenterData, Course, LectureBriefTrace, LectureRecord, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'
import { extractDocumentText, type ExtractedDocument } from '@/lib/academics/documentText'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import { analyzeLectureTranscript } from '@/lib/academics/lectureAnalysis'
import { buildLectureGuideProposal } from '@/lib/academics/guideContract'
import { approximateLectureTitle, buildLectureBrief, buildLectureMasteryMap, fileCoverageLabel, sourceChunksForLecture } from '@/lib/academics/lectureWorkspace'
import { MaterialIntakeDialog } from '@/components/academics/MaterialIntakeDialog'
import { MaterialGenerationIntake, type MaterialArtifact } from '@/components/academics/MaterialGenerationIntake'
import { LectureCaptureGuide } from '@/components/academics/LectureCaptureGuide'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export type LectureDestination = 'overview' | 'transcript' | 'evidence' | 'study-work'
type WizardStep = 1 | 2 | 3
type WorkspaceView = 'brief' | 'mastery' | 'materials' | 'sources'

const MATERIAL_SUGGESTIONS = [
  { group: 'Course backbone', title: 'Textbook pages', detail: 'Adds definitions, mechanisms, and surrounding context the lecture may assume.' },
  { group: 'Course backbone', title: 'Professor slides', detail: 'Preserves the instructor’s sequence, examples, and visible emphasis.' },
  { group: 'Course backbone', title: 'Learning objectives or syllabus material', detail: 'Gives the Mastery Map stable, course-authored objectives.' },
  { group: 'Course backbone', title: 'Assigned readings or review sheets', detail: 'Adds course terminology and the boundaries your instructor expects.' },
  { group: 'Practice signals', title: 'Pearson / publisher practice questions', detail: 'Shows the moves and distractors you are expected to handle. Questions guide new practice; they are never copied.' },
  { group: 'Practice signals', title: 'Quizzes, practice exams, and answer keys', detail: 'Reveals question style, common traps, and the level of explanation that earns credit.' },
  { group: 'Practice signals', title: 'Worksheets or problem sets', detail: 'Adds the kinds of tasks you are expected to perform, not only facts to recall.' },
  { group: 'Practice signals', title: 'Recitation or TA problem sheets', detail: 'Adds worked applications and the intermediate reasoning lecture may skip.' },
  { group: 'Your context', title: 'Personal notes', detail: 'Captures what you wrote down and unlocks Revised Notes as a separate resource.' },
  { group: 'Your context', title: 'Study-group questions or muddy points', detail: 'Tells the Brief which connections still need a clearer explanation.' },
  { group: 'Your context', title: 'Returned work and instructor feedback', detail: 'Grounds misconceptions and practice priorities in feedback you actually received.' },
  { group: 'Your context', title: 'Office-hours or class discussion notes', detail: 'Adds professor explanations and examples that may not appear in the slides.' },
  { group: 'Labs & visuals', title: 'Lab handouts, methods, or data', detail: 'Connects lecture ideas to procedures, controls, results, and interpretation.' },
  { group: 'Labs & visuals', title: 'Diagrams, screenshots, or annotated figures', detail: 'Readable labels and captions can be used. The figure itself stays marked not interpreted.' },
  { group: 'Labs & visuals', title: 'Reference tables or formula sheets', detail: 'Adds the exact lookup tools you are allowed or expected to use.' },
  { group: 'Labs & visuals', title: 'Other relevant course documents', detail: 'Keeps useful evidence available without guessing what the document contains.' },
] as const

const MATERIAL_SUGGESTION_GROUPS = [...new Set(MATERIAL_SUGGESTIONS.map((item) => item.group))]

function isoToday() { return new Date().toISOString().slice(0, 10) }
function fileKind(file: AcademicFile) {
  if (file.type === 'transcript') return 'Transcript'
  if (file.type === 'lecture-slides') return 'Professor slides'
  if (file.type === 'reading') return 'Reading'
  if (file.type === 'lab-handout') return 'Lab handout'
  if (file.type === 'syllabus') return 'Learning objectives / syllabus'
  if (file.owner === 'mine') return 'Personal notes or material'
  return file.type.replace(/-/g, ' ')
}
function fileExtension(file: Pick<AcademicFile, 'fileName' | 'title' | 'mimeType' | 'sourceType'>) {
  const name = file.fileName ?? file.title
  const ext = name?.split('.').pop()
  if (ext && ext !== name) return ext.toLocaleUpperCase()
  if (file.mimeType?.startsWith('image/')) return 'IMAGE'
  if (file.sourceType === 'paste') return 'PASTED TEXT'
  return 'FILE'
}

function TranscriptSourceHelp() {
  return (
    <section aria-labelledby="transcript-source-help" className="mt-5 border-t border-border pt-4">
      <p id="transcript-source-help" className="font-display text-sm font-extrabold">Ways to get a transcript</p>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Captions className="size-4" /></span>
          <div><p className="text-xs font-extrabold">Panopto or your course site</p><p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-muted-foreground">Open Captions or Transcript on the lecture recording. Download or copy the text when your school enables it.</p></div>
        </div>
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Mic2 className="size-4" /></span>
          <div><p className="text-xs font-extrabold">Voice Memos or Word Transcribe</p><p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-muted-foreground">Record or import audio, review the automatic text, then copy or export it here. Some apps store audio in their cloud.</p></div>
        </div>
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><ShieldCheck className="size-4" /></span>
          <div><p className="text-xs font-extrabold">Ask before recording</p><p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-muted-foreground">Get instructor permission and follow class or school rules before recording a live lecture.</p></div>
        </div>
      </div>
      <p className="mt-4 rounded-xl border border-border bg-muted/45 p-3 text-[11px] font-semibold leading-relaxed text-muted-foreground"><b className="text-foreground">Premed OS does not record audio here.</b> Only the text or file you choose is added.</p>
    </section>
  )
}

export function LectureCapturePanel({ courseId, course, data, onOpenNotes, initialLectureId, initialDestination = 'overview', displayMode = 'dialog' }: {
  courseId: string; course?: Pick<Course, 'code' | 'title'>; data: ClassCenterData; onOpenNotes: () => void; initialLectureId?: string; initialDestination?: LectureDestination; displayMode?: 'dialog' | 'embedded'
}) {
  const lectures = useMemo(() => data.lectures.filter((lecture) => lecture.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt), [courseId, data.lectures])
  const [activeLectureId, setActiveLectureId] = useState<string | undefined>(initialLectureId)
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId)
  const [step, setStep] = useState<WizardStep>(activeLecture?.transcriptFileId ? 2 : 1)
  const [view, setView] = useState<WorkspaceView>(initialDestination === 'transcript' || initialDestination === 'evidence' ? 'sources' : initialDestination === 'study-work' ? 'materials' : 'brief')
  const [captureGuideOpen, setCaptureGuideOpen] = useState(false)
  const [artifact, setArtifact] = useState<MaterialArtifact | null>(null)
  if (activeLecture?.workspaceState === 'complete') return <LectureWorkspace course={course} courseId={courseId} data={data} lectures={lectures} activeLecture={activeLecture} view={view} onView={setView} onSelect={(lecture) => { setActiveLectureId(lecture.id); setArtifact(null); setView('brief') }} artifact={artifact} onArtifact={setArtifact} onOpenNotes={onOpenNotes} onHelp={() => setCaptureGuideOpen(true)} help={<LectureCaptureGuide open={captureGuideOpen} onOpenChange={setCaptureGuideOpen} />} embedded={displayMode === 'embedded'} />
  return <LectureImportWizard courseId={courseId} course={course} data={data} lectures={lectures} lecture={activeLecture} step={step} onStep={setStep} onLecture={setActiveLectureId} onBuilt={() => { setView('brief'); setArtifact(null) }} />
}

function LectureImportWizard({ courseId, course, data, lectures, lecture, step, onStep, onLecture, onBuilt }: {
  courseId: string; course?: Pick<Course, 'code' | 'title'>; data: ClassCenterData; lectures: LectureRecord[]; lecture?: LectureRecord; step: WizardStep; onStep: (step: WizardStep) => void; onLecture: (id: string) => void; onBuilt: () => void
}) {
  const toast = useToast()
  const chronological = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = lecture ? Math.max(1, chronological.findIndex((item) => item.id === lecture.id) + 1) : chronological.length + 1
  const [occurredOn, setOccurredOn] = useState(lecture?.occurredOn ?? isoToday)
  const [sourceText, setSourceText] = useState('')
  const [title, setTitle] = useState(lecture?.title ?? `Lecture ${lectureNumber}`)
  const [titleEdited, setTitleEdited] = useState(Boolean(lecture?.title && !/^Lecture \d+$/.test(lecture.title)))
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingExtraction, setPendingExtraction] = useState<ExtractedDocument | null>(null)
  const [reading, setReading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(lecture?.selectedSourceFileIds ?? (lecture?.transcriptFileId ? [lecture.transcriptFileId] : []))
  const input = useRef<HTMLInputElement>(null)
  const lectureFiles = data.files.filter((file) => file.lectureId === lecture?.id)
  const knownCourseFiles = data.files.filter((file) => file.courseId === courseId && file.lectureId !== lecture?.id && file.processingStatus === 'ready' && file.type !== 'transcript')
  const available = [...lectureFiles, ...knownCourseFiles]
  const selectedFiles = available.filter((file) => selectedIds.includes(file.id) || file.id === lecture?.transcriptFileId)
  const selectedChunks = data.sourceChunks.filter((chunk) => selectedFiles.some((file) => file.id === chunk.fileId) && Boolean(chunk.content.trim()))
  const previewLecture = lecture ? { ...lecture, selectedSourceFileIds: selectedFiles.map((file) => file.id) } : undefined
  const previewBrief = previewLecture ? buildLectureBrief(selectedChunks, previewLecture.selectedSourceFileIds ?? [], data.files) : undefined
  const previewMastery = previewLecture ? buildLectureMasteryMap({ lecture: previewLecture, topics: data.topics.filter((topic) => topic.courseId === courseId), chunks: selectedChunks, files: selectedFiles }) : undefined

  async function chooseTranscript(file: File) {
    setReading(true)
    try {
      const extracted = await extractDocumentText(file, { recoverScannedPdfPages: true })
      if (!extracted.text.trim()) return toast({ title: 'No readable transcript text', description: 'On-device OCR could not recover this source. Try a clearer file or paste the transcript.', tone: 'error' })
      setPendingFile(file); setPendingExtraction(extracted); setSourceText(extracted.text)
      if (!titleEdited) setTitle(approximateLectureTitle(lectureNumber, extracted.text))
    } catch (error) {
      toast({ title: 'Transcript could not be read', description: error instanceof Error ? error.message : 'Try a text, PDF, DOCX, or clearer image.', tone: 'error' })
    } finally { setReading(false) }
  }

  async function saveSource() {
    const parsed = parseTranscript(sourceText)
    if (!title.trim() || !occurredOn || !parsed.segments.length) return toast({ title: 'Add the lecture source', description: 'A title, date, and readable transcript are required.' })
    const savedTitle = titleEdited ? title.trim() : approximateLectureTitle(lectureNumber, sourceText)
    const built = buildTranscriptImport({ courseId, title: savedTitle, text: sourceText, order: data.files.filter((file) => file.courseId === courseId).length })
    if (!built) return
    const now = Date.now(); const lectureId = lecture?.id ?? uid(); const blobRef = pendingFile ? await retainLocalMaterial(pendingFile, built.file.id) : undefined
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter
      Object.assign(built.file, {
        lectureId, title: `${savedTitle} transcript`, linkedTopicIds: [], sourceType: pendingFile ? 'upload' as const : 'paste' as const,
        blobRef, fileName: pendingFile?.name, mimeType: pendingFile?.type, processingStatus: 'ready' as const,
        sourceCoverage: { pageCount: pendingExtraction?.pageCount, readablePages: pendingExtraction?.pages?.filter((page) => page.readable).map((page) => page.pageNumber), ocrRecoveredPages: pendingExtraction?.pages?.filter((page) => page.ocrRecovered).map((page) => page.pageNumber), unreadablePages: pendingExtraction?.pages?.filter((page) => !page.readable).map((page) => page.pageNumber), readableCharacterCount: sourceText.trim().length, figureStatus: 'not-interpreted' as const },
      })
      center.files.push(built.file)
      center.sourceChunks.push(...built.chunks.map((chunk) => ({ ...chunk, topicId: undefined, assignmentMethod: 'pending' as const, assignmentConfirmed: false })))
      const existing = center.lectures.find((item) => item.id === lectureId)
      const selectedSourceFileIds = [...new Set([...(existing?.selectedSourceFileIds ?? []), built.file.id])]
      if (existing) Object.assign(existing, { title: savedTitle, occurredOn, inputPath: pendingFile ? 'uploaded' : 'pasted', transcriptFileId: built.file.id, processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds, processedAt: now, updatedAt: now })
      else center.lectures.push({ id: lectureId, courseId, title: savedTitle, inputPath: pendingFile ? 'uploaded' : 'pasted', transcriptFileId: built.file.id, occurredOn, topicIds: [], processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds, createdAt: now, processedAt: now, updatedAt: now, order: center.lectures.filter((item) => item.courseId === courseId).length })
    })
    onLecture(lectureId); setSelectedIds([built.file.id]); onStep(2)
  }
  function toggleSource(fileId: string) { if (fileId !== lecture?.transcriptFileId) setSelectedIds((current) => current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]) }
  function goToPreview() {
    if (!lecture) return
    const ids = [...new Set([lecture.transcriptFileId, ...selectedIds].filter((id): id is string => Boolean(id)))]
    useStore.getState().update((draft) => { const record = draft.academics.classCenter.lectures.find((item) => item.id === lecture.id); if (record) Object.assign(record, { selectedSourceFileIds: ids, updatedAt: Date.now() }) })
    setSelectedIds(ids); onStep(3)
  }
  function buildWorkspace() {
    if (!lecture) return
    const now = Date.now()
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter; const record = center.lectures.find((item) => item.id === lecture.id); if (!record) return
      const ids = [...new Set([record.transcriptFileId, ...(record.selectedSourceFileIds ?? selectedIds)].filter((id): id is string => Boolean(id)))]
      record.selectedSourceFileIds = ids
      const files = center.files.filter((file) => ids.includes(file.id)); const chunks = center.sourceChunks.filter((chunk) => ids.includes(chunk.fileId) && Boolean(chunk.content.trim()))
      record.lectureBrief = buildLectureBrief(chunks, ids, center.files, now)
      const mastery = buildLectureMasteryMap({ lecture: record, topics: center.topics.filter((topic) => topic.courseId === courseId), chunks, files, now })
      if (mastery) {
        const existing = center.generatedMasteryOutlines.find((outline) => outline.lectureId === record.id)
        if (existing) { Object.assign(existing, mastery, { updatedAt: now }); record.masteryMapId = existing.id }
        else { const id = uid(); center.generatedMasteryOutlines.unshift({ ...mastery, id, order: center.generatedMasteryOutlines.length }); record.masteryMapId = id }
      }
      record.workspaceState = 'complete'; record.updatedAt = now
    })
    onBuilt()
    toast({ title: 'Lecture page built', description: 'The Brief and Mastery Map use only the selected readable sources. Source traces stay attached.' })
  }

  return <Card className="overflow-hidden border-border bg-card shadow-[0_18px_48px_-28px_rgba(0,0,0,.72)]"><CardContent className="p-0">
    <header className="border-b border-border px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">New lecture</p><h2 className="mt-1 font-display text-xl font-extrabold">Build one study-ready lecture page</h2><p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">The transcript is source evidence. Your finished lecture opens to a Brief and Mastery Map.</p></div><Badge aria-label="Lecture identity" className="mr-8 shrink-0" variant="outline">{course?.code ?? 'Class'} · Lecture {lectureNumber}</Badge></div><ol className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Lecture import progress">{(['Add lecture source', 'Add related materials', 'Build lecture page'] as const).map((label, index) => { const number = (index + 1) as WizardStep; return <li key={label} className={cn('rounded-xl border px-3 py-2', step === number ? 'border-primary bg-primary/8' : step > number ? 'border-border bg-muted/35' : 'border-border bg-card')}><div className="flex items-center gap-2"><span className={cn('grid size-6 place-items-center rounded-full text-xs font-extrabold', step > number ? 'bg-primary text-primary-foreground' : step === number ? 'border border-primary text-primary' : 'border border-border text-muted-foreground')}>{step > number ? <Check className="size-3.5" /> : number}</span><span className="text-xs font-extrabold">{label}</span></div></li> })}</ol></header>
    <div className="p-4 sm:p-6">
      {step === 1 && <section aria-labelledby="lecture-source-heading"><h3 id="lecture-source-heading" className="font-display text-lg font-extrabold">1. Add lecture source</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Paste a transcript or upload a text, PDF, DOCX, or image. Scanned pages are read on this device when possible.</p><div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-4"><label className="block text-sm font-extrabold">Approximate title<Input className="mt-1.5" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true) }} placeholder="Lecture 1 · Origins of Psychology" /></label><label className="block max-w-56 text-sm font-extrabold">Lecture date<Input className="mt-1.5" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} /></label><label className="block text-sm font-extrabold">Transcript text<Textarea className="mt-1.5 min-h-52" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setPendingFile(null); setPendingExtraction(null) }} placeholder={'Paste the transcript here…\n\nTimestamps are welcome but not required.'} /></label></div><aside className="rounded-2xl border border-border bg-muted/25 p-4"><FileUp className="size-5 text-primary" /><p className="mt-2 font-display text-sm font-extrabold">Or upload the source</p><p className="mt-1 text-xs font-semibold text-muted-foreground">The original file stays on this device. OCR retains page coverage; diagrams and embedded figures are not interpreted.</p><Button className="mt-4 w-full" variant="outline" disabled={reading} onClick={() => input.current?.click()}>{reading ? 'Reading on device…' : 'Choose transcript file'}</Button><input ref={input} type="file" className="sr-only" accept=".pdf,.docx,.txt,.md,image/*,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void chooseTranscript(file); event.currentTarget.value = '' }} />{pendingFile && <div className="mt-3 rounded-xl border border-border bg-card p-3"><p className="truncate text-sm font-extrabold">{pendingFile.name}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileExtension({ fileName: pendingFile.name, title: pendingFile.name, mimeType: pendingFile.type, sourceType: 'upload' })} · {pendingExtraction?.pageCount ? `${pendingExtraction.pageCount} pages` : `${sourceText.length.toLocaleString()} characters`}{pendingExtraction?.ocrPageCount ? ` · ${pendingExtraction.ocrPageCount} OCR recovered` : ''}</p></div>}<TranscriptSourceHelp /></aside></div><div className="mt-5 flex justify-end"><Button onClick={() => void saveSource()} disabled={!sourceText.trim() || !title.trim() || !occurredOn}><FileCheck2 className="size-4" /> Continue to materials</Button></div></section>}
      {step === 2 && lecture && <MaterialsStep courseId={courseId} data={data} lecture={lecture} available={available} selectedIds={selectedIds} selectedFiles={selectedFiles} selectedChunks={selectedChunks} onToggle={toggleSource} onContinue={goToPreview} />}
      {step === 3 && lecture && previewBrief && <section aria-labelledby="lecture-build-heading"><h3 id="lecture-build-heading" className="font-display text-lg font-extrabold">3. Build lecture page</h3><p className="mt-1 max-w-3xl text-sm font-semibold text-muted-foreground">Here is the study front your selected sources can support right now. Build it to open the full, interactive version.</p><BuildLecturePreview lecture={lecture} brief={previewBrief} mastery={previewMastery} files={selectedFiles} /><div className="mt-4 border-t border-border pt-4"><p className="font-display text-sm font-extrabold">Privacy and processing</p><p className="mt-1 max-w-4xl text-xs font-semibold leading-relaxed text-muted-foreground">This preview is assembled on this device from exact selected passages. Original file bytes stay local. If you later request an AI-enhanced Study Guide, Flashcards, Question Bank, or class-remark analysis, Premed OS first copies only the selected source chunks to your private server workspace and then invokes the configured external AI provider. Figures are not sent or interpreted by this lecture flow.</p></div><div className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" onClick={() => onStep(2)}>Back to materials</Button><Button onClick={buildWorkspace}><Sparkles className="size-4" /> Build lecture page</Button></div></section>}
    </div>
  </CardContent></Card>
}

function BuildLecturePreview({ lecture, brief, mastery, files }: {
  lecture: LectureRecord
  brief: NonNullable<LectureRecord['lectureBrief']>
  mastery?: ReturnType<typeof buildLectureMasteryMap>
  files: AcademicFile[]
}) {
  const flow = brief.conceptMap?.nodes.filter((node) => node.lane === 'flow').slice(0, 5) ?? []
  const vocabulary = brief.vocabulary.slice(0, 4)
  const sourceNames = files.map((file) => file.fileName ?? file.title)
  return <section aria-label="Lecture page preview" className="mt-5 overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-[0_20px_55px_-38px_rgba(0,0,0,.75)]">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
      <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">Your lecture, before you build</p><h4 className="mt-1 break-words font-display text-xl font-extrabold">{lecture.title}</h4><p className="mt-1 text-xs font-semibold text-muted-foreground">Lecture Brief with a connected Mastery Map</p></div>
      <Badge variant="outline">{files.length} selected {files.length === 1 ? 'source' : 'sources'}</Badge>
    </header>
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <article className="min-w-0 px-5 py-6 sm:px-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Lecture Brief · Start here</p>
        <h5 className="mt-1 font-display text-lg font-extrabold">The lecture in a few clear moves</h5>
        {brief.summary.length ? <div className="mt-4 space-y-3">{brief.summary.slice(0, 2).map((item) => <p key={item.id} className="text-sm font-semibold leading-6 text-foreground/90">{item.text}</p>)}</div> : <p className="mt-4 text-sm font-semibold leading-relaxed text-muted-foreground">No readable summary is available yet. Add a clearer transcript or another processed source.</p>}

        <section className="mt-6 border-y border-border py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How the ideas connect</p>
          {flow.length > 1 ? <ol className="mt-3 flex min-w-0 flex-wrap items-center gap-2" aria-label="Concept flow preview">{flow.map((node, index) => <li key={node.id} className="contents"><span className="max-w-40 rounded-full border border-primary/25 bg-primary/7 px-3 py-1.5 text-xs font-extrabold">{node.label}</span>{index < flow.length - 1 && <span className="text-sm font-black text-primary" aria-hidden="true">→</span>}</li>)}</ol> : brief.connections.length ? <p className="mt-3 text-sm font-semibold leading-6">{brief.connections[0].text}</p> : <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">The completed Brief will place supported relationships here without inventing missing links.</p>}
        </section>

        <section className="mt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Language worth knowing</p>
          {vocabulary.length ? <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">{vocabulary.map((item) => <div key={item.id} className="min-w-0"><dt className="text-xs font-extrabold capitalize text-foreground">{item.term}</dt><dd className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-5 text-muted-foreground">{item.text}</dd></div>)}</dl> : <p className="mt-3 text-xs font-semibold text-muted-foreground">Key vocabulary will appear when the selected sources repeat a term strongly enough to support it.</p>}
        </section>
      </article>

      <aside className="border-t border-border bg-muted/25 px-5 py-6 lg:border-l lg:border-t-0" aria-label="Mastery Map preview">
        <div className="flex items-center gap-2"><ListChecks className="size-4 text-primary" /><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Mastery Map</p></div>
        <h5 className="mt-2 font-display text-base font-extrabold">What you should be able to do</h5>
        {mastery ? <ol className="mt-4 space-y-4">{mastery.standards.slice(0, 3).map((standard, index) => <li key={standard.id} className="border-l-2 border-primary/35 pl-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Objective {index + 1} · Not started</p><p className="mt-1 text-sm font-extrabold leading-5">{standard.title}</p></li>)}</ol> : <div className="mt-4 border-l-2 border-border pl-3"><p className="text-sm font-extrabold">Objectives need a course source</p><p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">Add learning objectives or syllabus material. Transcript topics are not silently promoted into official objectives.</p></div>}
        <p className="mt-5 border-t border-border pt-4 text-[11px] font-semibold leading-5 text-muted-foreground">Every full objective includes Understand, Be able to do, Watch for, and a mastery state.</p>
      </aside>
    </div>
    <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-muted/15 px-5 py-3 text-[11px] font-semibold text-muted-foreground sm:px-6"><span className="font-extrabold text-foreground">Source foundation</span>{sourceNames.length ? <><span className="max-w-64 truncate">{sourceNames[0]}</span>{sourceNames[1] && <span className="max-w-64 truncate">{sourceNames[1]}</span>}{sourceNames.length > 2 && <span>+{sourceNames.length - 2} more</span>}</> : <span>No sources selected</span>}<span className="ml-auto text-primary">{brief.usedSourceFileIds.length} used in this preview</span></footer>
  </section>
}

function MaterialsStep({ courseId, data, lecture, available, selectedIds, selectedFiles, selectedChunks, onToggle, onContinue }: { courseId: string; data: ClassCenterData; lecture: LectureRecord; available: AcademicFile[]; selectedIds: string[]; selectedFiles: AcademicFile[]; selectedChunks: SourceChunk[]; onToggle: (id: string) => void; onContinue: () => void }) {
  return <section aria-labelledby="lecture-materials-heading"><h3 id="lecture-materials-heading" className="font-display text-lg font-extrabold">2. Add related materials <span className="font-sans text-sm font-bold text-muted-foreground">(optional)</span></h3><p className="mt-1 max-w-3xl text-sm font-semibold text-muted-foreground">A file is not treated as understood merely because it is attached. Only readable, selected sources can support the Brief or Mastery Map.</p><div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]"><div><div className="space-y-4">{MATERIAL_SUGGESTION_GROUPS.map((group) => <section key={group}><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{group}</p><div className="grid gap-2 md:grid-cols-2">{MATERIAL_SUGGESTIONS.filter((item) => item.group === group).map(({ title, detail }) => <div key={title} className="rounded-xl border border-border bg-muted/25 p-3"><p className="font-display text-sm font-extrabold">{title}</p><p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{detail}</p></div>)}</div></section>)}</div>{available.length > 0 && <div className="mt-5"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Ready sources from this class</p><div className="mt-2 space-y-2">{available.map((file) => <SourceChoice key={file.id} file={file} chunks={data.sourceChunks.filter((chunk) => chunk.fileId === file.id && Boolean(chunk.content.trim()))} selected={file.id === lecture.transcriptFileId || selectedIds.includes(file.id)} locked={file.id === lecture.transcriptFileId} onToggle={() => onToggle(file.id)} />)}</div></div>}</div><aside className="h-fit rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Add something else</p><p className="mt-1 font-display text-sm font-extrabold">Keep it with this lecture</p><p className="mt-1 text-xs font-semibold text-muted-foreground">New files are processed locally and return here unselected so you can review coverage first.</p><MaterialIntakeDialog courseId={courseId} lectureId={lecture.id} trigger={<Button className="mt-4 w-full" variant="outline"><FilePlus2 className="size-4" /> Add lecture material</Button>} /><p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">Selected now: {selectedFiles.length} {selectedFiles.length === 1 ? 'source' : 'sources'} · {selectedChunks.length} readable {selectedChunks.length === 1 ? 'passage' : 'passages'}</p></aside></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={onContinue}>Skip for now</Button><Button onClick={onContinue}>Continue to build preview <ChevronDown className="size-4 -rotate-90" /></Button></div></section>
}

function SourceChoice({ file, chunks, selected, locked, onToggle }: { file: AcademicFile; chunks: SourceChunk[]; selected: boolean; locked: boolean; onToggle: () => void }) {
  return <button type="button" aria-pressed={selected} disabled={locked || file.processingStatus !== 'ready'} onClick={onToggle} className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selected ? 'border-primary bg-primary/7' : 'border-border bg-card hover:border-primary/45', file.processingStatus !== 'ready' && 'opacity-75')}><span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{selected && <Check className="size-3.5" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="truncate">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge></span><span className="mt-1 block text-xs font-bold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.length)}</span>{file.sourceCoverage?.figureStatus === 'not-interpreted' && <span className="mt-1 block text-xs font-semibold text-muted-foreground">Readable text/captions only · figures not interpreted</span>}{file.processingStatus !== 'ready' && <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">Fix: {file.processingError ?? 'Add readable text or a clearer scan.'}</span>}</span></button>
}

function LectureWorkspace({ course, courseId, data, lectures, activeLecture, view, onView, onSelect, artifact, onArtifact, onOpenNotes, onHelp, help, embedded = false }: { course?: Pick<Course, 'code' | 'title'>; courseId: string; data: ClassCenterData; lectures: LectureRecord[]; activeLecture: LectureRecord; view: WorkspaceView; onView: (view: WorkspaceView) => void; onSelect: (lecture: LectureRecord) => void; artifact: MaterialArtifact | null; onArtifact: (artifact: MaterialArtifact | null) => void; onOpenNotes: () => void; onHelp: () => void; help: ReactNode; embedded?: boolean }) {
  const selectedIds = activeLecture.selectedSourceFileIds ?? (activeLecture.transcriptFileId ? [activeLecture.transcriptFileId] : [])
  const files = data.files.filter((file) => selectedIds.includes(file.id)); const chunks = sourceChunksForLecture(data, activeLecture)
  const brief = activeLecture.lectureBrief ?? buildLectureBrief(chunks, selectedIds, data.files)
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === activeLecture.masteryMapId || outline.lectureId === activeLecture.id)
  const chronological = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (id: string) => chronological.findIndex((lecture) => lecture.id === id) + 1
  const moreMenu = <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={embedded ? 'More lecture tools' : undefined}><MoreHorizontal className="size-4" /><span className={cn(embedded && 'hidden sm:inline')}>More</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Lecture tools</DropdownMenuLabel><DropdownMenuItem onClick={() => onView('sources')}><Search className="size-4" /> Search sources</DropdownMenuItem><DropdownMenuItem onClick={onOpenNotes}><NotebookText className="size-4" /> Open class Guide</DropdownMenuItem><DropdownMenuItem onClick={onHelp}><CircleHelp className="size-4" /> Transcript help</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  const tabs = <nav className={cn('flex min-w-0 gap-1 overflow-x-auto', !embedded && 'mt-4')} aria-label="Lecture workspace views">{([['brief', 'Lecture Brief'], ['mastery', 'Mastery Map'], ['materials', 'Materials'], ['sources', 'Sources']] as const).map(([value, label]) => <button key={value} type="button" aria-current={view === value ? 'page' : undefined} onClick={() => { onView(value); onArtifact(null) }} className={cn('whitespace-nowrap border-b-2 py-2 font-extrabold', embedded ? 'px-2 text-xs sm:px-3 sm:text-sm' : 'px-3 text-sm', view === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{label}</button>)}</nav>
  const content = <>{view === 'brief' && <LectureBriefView brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />}{view === 'mastery' && <MasteryMapView outline={mastery} chunks={chunks} lecture={activeLecture} />}{view === 'materials' && <LectureMaterialsView course={course} courseId={courseId} lecture={activeLecture} files={data.files.filter((file) => file.lectureId === activeLecture.id || selectedIds.includes(file.id))} artifact={artifact} onArtifact={onArtifact} />}{view === 'sources' && <LectureSourcesView courseId={courseId} lecture={activeLecture} files={files} chunks={chunks} data={data} />}</>

  if (embedded) return <section className="min-w-0 overflow-hidden border-t border-border bg-card" aria-label="Embedded lecture workspace"><div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-1 sm:px-2"><div className="min-w-0 flex-1">{tabs}</div><div className="shrink-0">{moreMenu}</div></div><div className="max-h-[38rem] min-w-0 overflow-y-auto p-4 sm:p-5">{content}</div>{help}</section>

  return <div className="grid min-h-[38rem] w-full min-w-0 max-w-full overflow-x-hidden lg:grid-cols-[15rem_minmax(0,1fr)]"><aside className="min-w-0 border-b border-border bg-muted/25 p-3 lg:border-b-0 lg:border-r" aria-label="Lecture catalog"><div className="flex items-center justify-between gap-2 px-1"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{course?.code ?? 'Class'}</p><h2 className="font-display text-base font-extrabold">Lectures</h2></div><Badge variant="outline">{lectures.length}</Badge></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible">{lectures.map((lecture) => <button key={lecture.id} type="button" aria-current={lecture.id === activeLecture.id ? 'page' : undefined} onClick={() => onSelect(lecture)} className={cn('min-w-56 rounded-xl border p-3 text-left lg:min-w-0 lg:w-full', lecture.id === activeLecture.id ? 'border-primary bg-card shadow-sm' : 'border-transparent hover:border-border hover:bg-card/70')}><span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Lecture {lectureNumber(lecture.id)} · {lecture.occurredOn ?? 'Date not set'}</span><b className="mt-1 block line-clamp-2 font-display text-sm">{lecture.title}</b><span className="mt-1 block text-[11px] font-bold text-muted-foreground">{lecture.workspaceState === 'complete' ? 'Brief + Mastery' : 'Import in progress'}</span></button>)}</div></aside><main className="min-w-0 bg-card"><header className="border-b border-border px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture {lectureNumber(activeLecture.id)} · {activeLecture.occurredOn ?? 'Date not set'}</p><h1 className="mt-1 break-words font-display text-2xl font-extrabold">{activeLecture.title}</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">{files.length} selected {files.length === 1 ? 'source' : 'sources'} · {chunks.length} readable {chunks.length === 1 ? 'passage' : 'passages'}</p></div>{moreMenu}</div>{tabs}</header><div className="min-w-0 p-4 sm:p-6">{content}</div>{help}</main></div>
}

function BriefSection({ eyebrow, title, items, chunks, empty, tone = 'plain' }: {
  eyebrow: string
  title: string
  items: LectureBriefTrace[]
  chunks: SourceChunk[]
  empty: string
  tone?: 'plain' | 'emphasis' | 'caution'
}) {
  const [open, setOpen] = useState(false)
  const evidence = [...new Set(items.map((item) => item.sourceChunkId))]
    .map((id) => chunks.find((chunk) => chunk.id === id))
    .filter((chunk): chunk is SourceChunk => Boolean(chunk))
  return <section className={cn(
    'border-b border-border py-6 first:pt-0 last:border-0 last:pb-0',
    tone === 'emphasis' && 'rounded-2xl border border-primary/25 bg-primary/6 px-5',
    tone === 'caution' && 'rounded-2xl border border-amber-500/25 bg-amber-500/7 px-5',
  )}>
    <p className={cn('text-[10px] font-extrabold uppercase tracking-[0.13em]', tone === 'caution' ? 'text-amber-700 dark:text-amber-300' : 'text-primary')}>{eyebrow}</p>
    <h3 className="mt-1 font-display text-lg font-extrabold">{title}</h3>
    {items.length ? <div className="mt-3 space-y-3">{items.map((item, index) => <p key={item.id} className={cn('font-semibold leading-7', title === 'Lecture in one page' ? 'text-[15px] sm:text-base' : 'text-sm')}>
      {item.text}<sup className="ml-1 text-[9px] font-extrabold text-primary">{index + 1}</sup>
    </p>)}</div> : <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">{empty}</p>}
    {evidence.length > 0 && <div className="mt-3">
      <Button className="h-auto px-0 text-xs" variant="link" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? 'Hide source passages' : `Show source passages (${evidence.length})`}</Button>
      {open && <div className="mt-2 space-y-2" aria-label={`${title} source passages`}>{evidence.map((chunk, index) => <blockquote key={chunk.id} className="rounded-xl border border-border bg-card/75 p-3 text-xs font-semibold leading-relaxed text-muted-foreground"><b className="text-foreground">{index + 1}. {chunk.sourcePosition?.label ?? 'Source passage'}:</b> {chunk.content}</blockquote>)}</div>}
    </div>}
  </section>
}

function ConceptMapView({ map, chunks, files }: {
  map: NonNullable<NonNullable<LectureRecord['lectureBrief']>['conceptMap']>
  chunks: SourceChunk[]
  files: AcademicFile[]
}) {
  const [open, setOpen] = useState(false)
  const flow = map.nodes.filter((node) => node.lane === 'flow')
  const evidenceNodes = map.nodes.filter((node) => node.lane === 'evidence')
  const chunkIds = [...new Set([
    ...map.nodes.flatMap((node) => node.sourceChunkIds),
    ...map.edges.flatMap((edge) => edge.sourceChunkIds),
  ])]
  const evidence = chunkIds.map((id) => chunks.find((chunk) => chunk.id === id)).filter((chunk): chunk is SourceChunk => Boolean(chunk))
  const outgoing = (nodeId: string) => map.edges.find((edge) => edge.fromNodeId === nodeId && flow.some((node) => node.id === edge.toNodeId))
  return <section className="border-b border-border py-6" aria-labelledby="lecture-concept-map-title">
    <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How the ideas fit</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-2"><div><h3 id="lecture-concept-map-title" className="font-display text-lg font-extrabold">{map.title}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Follow the information, then see where experimental evidence attaches.</p></div><Badge variant="outline">Connected model</Badge></div>
    <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label={`${map.title} flow`}>
      {flow.map((node, index) => {
        const edge = outgoing(node.id)
        return <li key={node.id} className="relative flex min-h-44 flex-col rounded-2xl border border-border bg-muted/25 p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">Stage {index + 1}</span>
          <b className="mt-1 font-display text-base">{node.label}</b>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">{node.detail}</p>
          {edge && <p className="mt-auto border-t border-border pt-3 text-[11px] font-extrabold leading-relaxed text-primary"><span aria-hidden="true">→ </span>{edge.label}</p>}
        </li>
      })}
    </ol>
    {evidenceNodes.length > 0 && <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/6 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">How you observe the flow</p><div className="mt-3 grid gap-3 md:grid-cols-2">{evidenceNodes.map((node) => {
      const incoming = map.edges.filter((edge) => edge.toNodeId === node.id)
      return <article key={node.id} className="rounded-xl border border-border bg-card p-4"><b className="font-display text-sm">{node.label}</b><p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{node.detail}</p>{incoming.map((edge) => <p key={edge.id} className="mt-2 text-[11px] font-extrabold text-primary">{edge.label}</p>)}</article>
    })}</div></div>}
    {evidence.length > 0 && <div className="mt-3"><Button className="h-auto px-0 text-xs" variant="link" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? 'Hide concept sources' : `Show concept sources (${evidence.length})`}</Button>{open && <div className="mt-2 space-y-2" aria-label="Concept map source passages">{evidence.map((chunk, index) => { const file = files.find((item) => item.id === chunk.fileId); return <blockquote key={chunk.id} className="rounded-xl border border-border bg-card/75 p-3 text-xs font-semibold leading-relaxed text-muted-foreground"><b className="text-foreground">{index + 1}. {file?.fileName ?? file?.title ?? 'Source'} · {chunk.sourcePosition?.label ?? 'passage'}:</b> {chunk.content}</blockquote> })}</div>}</div>}
  </section>
}

function LectureBriefView({ brief, chunks, files, mastery, onOpenMastery }: { brief: NonNullable<LectureRecord['lectureBrief']>; chunks: SourceChunk[]; files: AcademicFile[]; mastery?: ClassCenterData['generatedMasteryOutlines'][number]; onOpenMastery: () => void }) {
  return <div className="mx-auto max-w-5xl">
    <section className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Your study page</p><h2 className="mt-1 font-display text-2xl font-extrabold">Lecture Brief</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground">Study the explanation here. Source passages stay folded underneath each section when you want to verify or read further.</p></div><Badge variant="outline">{brief.usedSourceFileIds.length}/{brief.selectedSourceFileIds.length} sources used</Badge></div></section>

    <article className="mt-6 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-7">
      <BriefSection eyebrow="Start here" title="Lecture in one page" items={brief.summary} chunks={chunks} empty="No readable summary is available yet. Add a clearer transcript or another processed source." />
      {brief.conceptMap ? <ConceptMapView map={brief.conceptMap} chunks={chunks} files={files} /> : <BriefSection eyebrow="How the ideas fit" title="Concept map & connections" items={brief.connections} chunks={chunks} empty="No explicit connection was found in the selected sources." />}
      <BriefSection eyebrow="What your professor signaled" title="Professor emphasis & examples" items={brief.professorEmphasis} chunks={chunks} empty="No source-supported emphasis was detected. Nothing was guessed." tone="emphasis" />
      <BriefSection eyebrow="What changes and why" title="Processes & comparisons" items={brief.processesAndComparisons} chunks={chunks} empty="No explicit process or comparison was found." />
      <BriefSection eyebrow="Common trap" title="Misconceptions to correct" items={brief.misconceptions} chunks={chunks} empty="No source-supported misconception was found." tone="caution" />
    </article>

    <section className="mt-5 rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Language of the lecture</p><h3 className="mt-1 font-display text-lg font-extrabold">Important vocabulary in context</h3></div><p className="text-xs font-semibold text-muted-foreground">Meaning first, term second</p></div>{brief.vocabulary.length ? <dl className="mt-4 divide-y divide-border">{brief.vocabulary.map((item) => <div key={item.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"><dt className="text-sm font-extrabold capitalize text-primary">{item.term}</dt><dd className="text-sm font-semibold leading-relaxed text-muted-foreground">{item.text}</dd></div>)}</dl> : <p className="mt-3 text-sm font-semibold text-muted-foreground">No repeated source term was strong enough to label without guessing.</p>}</section>

    <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Check yourself next</p><h3 className="mt-1 font-display text-lg font-extrabold">Mastery Map preview</h3></div><Button size="sm" variant="outline" onClick={onOpenMastery}>Open full map</Button></div>{mastery ? <div className="mt-4 space-y-2">{mastery.standards.slice(0, 3).map((standard) => <div key={standard.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3"><b className="text-sm">{standard.title}</b><Badge variant="outline">{standard.masteryState === 'can-apply-without-notes' ? 'Can apply' : standard.masteryState === 'can-explain' ? 'Can explain' : 'Not started'}</Badge></div>)}</div> : <p className="mt-3 text-sm font-semibold text-muted-foreground">Add or link syllabus objectives to create the map. Transcript concepts are not silently promoted into course objectives.</p>}</div><SourceCoverage files={files} chunks={chunks} brief={brief} /></section>
  </div>
}

function SourceCoverage({ files, chunks, brief }: { files: AcademicFile[]; chunks: SourceChunk[]; brief: NonNullable<LectureRecord['lectureBrief']> }) {
  return <aside className="rounded-2xl border border-border bg-muted/25 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Source coverage</p><div className="mt-3 space-y-3">{files.map((file) => <div key={file.id}><div className="flex items-center justify-between gap-2"><b className="truncate text-xs">{file.fileName ?? file.title}</b><Badge variant={brief.usedSourceFileIds.includes(file.id) ? 'default' : 'outline'}>{brief.usedSourceFileIds.includes(file.id) ? 'Used' : 'Selected'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p></div>)}</div><p className="mt-4 border-t border-border pt-3 text-[11px] font-semibold text-muted-foreground">Figures and diagrams were not interpreted. Readable captions may appear as ordinary text passages.</p></aside>
}

function MasteryMapView({ outline, chunks, lecture }: { outline?: ClassCenterData['generatedMasteryOutlines'][number]; chunks: SourceChunk[]; lecture: LectureRecord }) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  function setMastery(standardId: string, masteryState: 'not-started' | 'can-explain' | 'can-apply-without-notes') { if (outline) useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id); const standard = record?.standards.find((item) => item.id === standardId); if (standard) { standard.masteryState = masteryState; if (record) record.updatedAt = Date.now() } }) }
  if (!outline) return <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-6"><ListChecks className="size-6 text-primary" /><h2 className="mt-3 font-display text-xl font-extrabold">Mastery Map needs course objectives</h2><p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">Add learning objectives or syllabus material, then link those objectives to this lecture. Premed OS will not turn transcript topics into official course objectives.</p></div>
  return <div className="space-y-4"><section className="rounded-2xl border border-primary/35 bg-primary/6 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{outline.scope ?? 'unit'} scope</p><h2 className="mt-1 font-display text-xl font-extrabold">Mastery Map</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{lecture.title} · {outline.standards.length} source-backed {outline.standards.length === 1 ? 'objective' : 'objectives'}</p></div><label className="text-xs font-extrabold">Scope<select className="ml-2 rounded-lg border border-border bg-card px-2 py-1.5" value={outline.scope ?? 'unit'} onChange={(event) => useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id); if (record) { record.scope = event.target.value as 'lecture' | 'unit' | 'exam'; record.updatedAt = Date.now() } })}><option value="lecture">Lecture</option><option value="unit">Unit</option><option value="exam">Exam</option></select></label></div></section>{outline.standards.map((standard, index) => <article key={standard.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Objective {index + 1}</p><h3 className="mt-1 font-display text-lg font-extrabold">{standard.title}</h3></div><label className="text-xs font-extrabold">Mastery<select aria-label={`Mastery state for ${standard.title}`} className="ml-2 rounded-lg border border-border bg-muted/25 px-2 py-1.5" value={standard.masteryState ?? 'not-started'} onChange={(event) => setMastery(standard.id, event.target.value as 'not-started' | 'can-explain' | 'can-apply-without-notes')}><option value="not-started">Not started</option><option value="can-explain">Can explain</option><option value="can-apply-without-notes">Can apply without notes</option></select></label></div><div className="mt-4 grid gap-3 lg:grid-cols-3"><MasterySection label="Understand" items={standard.understand} /><MasterySection label="Be able to do" items={standard.beAbleToDo} /><MasterySection label="Watch for" items={standard.watchFor} /></div><div className="mt-3 border-t border-border pt-3"><Button variant="link" className="h-auto px-0 text-xs" onClick={() => setSourceId((current) => current === standard.id ? null : standard.id)}>{sourceId === standard.id ? 'Hide sources' : `Show sources (${standard.sourceChunkIds.length})`}</Button>{sourceId === standard.id && <div className="mt-2 space-y-2">{standard.sourceChunkIds.map((id) => { const chunk = chunks.find((item) => item.id === id); return <blockquote key={id} className="rounded-xl border border-border bg-muted/25 p-3 text-xs font-semibold text-muted-foreground"><b className="text-foreground">{chunk?.sourcePosition?.label ?? 'Source passage'}:</b> {chunk?.content ?? 'Source is no longer available.'}</blockquote> })}</div>}</div></article>)}</div>
}
function MasterySection({ label, items }: { label: string; items: string[] }) { return <section className="rounded-xl border border-border bg-muted/25 p-3"><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">{label}</p><ul className="mt-2 space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm font-semibold leading-relaxed"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></section> }

function LectureMaterialsView({ course, courseId, lecture, files, artifact, onArtifact }: { course?: Pick<Course, 'code' | 'title'>; courseId: string; lecture: LectureRecord; files: AcademicFile[]; artifact: MaterialArtifact | null; onArtifact: (artifact: MaterialArtifact | null) => void }) {
  const hasStudentNotes = files.some((file) => file.owner === 'mine' && file.type !== 'transcript')
  if (artifact) return <MaterialGenerationIntake artifact={artifact} courseId={courseId} courseLabel={lecture.title} course={course} files={files} lectureId={lecture.id} onClose={() => onArtifact(null)} />
  const resources: Array<{ artifact: MaterialArtifact; title: string; detail: string; icon: typeof BookOpen; disabled?: boolean }> = [{ artifact: 'study-guide', title: 'Full Study Guide', detail: 'A comprehensive source-grounded guide for this lecture.', icon: BookOpen }, { artifact: 'revised-notes', title: 'Revised Notes', detail: hasStudentNotes ? 'Improve selected notes while preserving the original baseline.' : 'Available only after you add your own notes as an explicit baseline.', icon: NotebookText, disabled: !hasStudentNotes }, { artifact: 'flashcards', title: 'Flashcards / APKG', detail: 'Inspectable cards with source-chunk trace and export.', icon: Brain }, { artifact: 'unit-question-bank', title: 'Question Bank', detail: 'Source-grounded practice tied to the same Mastery Map.', icon: FileStack }]
  return <div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Supporting resources</p><h2 className="mt-1 font-display text-xl font-extrabold">Materials</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">The lecture front stays Brief + Mastery. Build deeper resources here when useful.</p></div><MaterialIntakeDialog courseId={courseId} lectureId={lecture.id} trigger={<Button variant="outline"><FilePlus2 className="size-4" /> Add source</Button>} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{resources.map(({ artifact: value, title, detail, icon: Icon, disabled }) => <button key={value} type="button" disabled={disabled} onClick={() => onArtifact(value)} className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-60"><Icon className="size-5 text-primary" /><h3 className="mt-3 font-display text-base font-extrabold">{title}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">{detail}</p></button>)}</div></div>
}

function LectureSourcesView({ courseId, lecture, files, chunks, data }: { courseId: string; lecture: LectureRecord; files: AcademicFile[]; chunks: SourceChunk[]; data: ClassCenterData }) {
  const toast = useToast(); const [query, setQuery] = useState(''); const [finding, setFinding] = useState(false)
  const results = chunks.filter((chunk) => !query.trim() || chunk.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  async function findRemarks() {
    if (!chunks.length || finding) return; setFinding(true)
    try {
      const outcome = await analyzeLectureTranscript({ courseId, chunks }); if (!outcome.ok) return toast({ title: 'No class remarks were saved', description: outcome.message, tone: 'error' })
      const now = Date.now(); let count = 0
      useStore.getState().update((draft) => { const center = draft.academics.classCenter; outcome.findings.forEach((item) => { if (center.lectureFindings.some((existing) => existing.lectureId === lecture.id && existing.sourceChunkId === item.sourceChunkId && existing.quote === item.quote)) return; const saved = { ...item, id: uid(), courseId, lectureId: lecture.id, createdAt: now, updatedAt: now, order: center.lectureFindings.filter((row) => row.lectureId === lecture.id).length }; center.lectureFindings.push(saved); const proposal = buildLectureGuideProposal({ center, courseId, lectureId: lecture.id, finding: saved, now }); if (proposal) center.guideProposals.push(proposal); count += 1 }) })
      toast({ title: count ? 'Class remarks ready for review' : 'No new remarks found', description: count ? 'Review them in the class Guide before they affect saved context.' : 'No weak guesses were created.' })
    } finally { setFinding(false) }
  }
  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Inspect on demand</p><h2 className="mt-1 font-display text-xl font-extrabold">Sources</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">The transcript and supporting evidence stay searchable here, behind the lecture’s study front.</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><FileSearch className="size-4" /> More source tools <ChevronDown className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Uses an external AI provider</DropdownMenuLabel><DropdownMenuItem onClick={() => void findRemarks()} disabled={finding}><Sparkles className="size-4" /> {finding ? 'Checking selected passages…' : 'Find class remarks'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="rounded-xl border border-border bg-muted/25 p-3 text-xs font-semibold text-muted-foreground">“Find class remarks” copies only these selected readable passages to your private server workspace, then invokes the configured external AI provider. Results remain proposals until reviewed.</p><label className="relative block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact words across transcript and sources" /></label><div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]"><aside className="space-y-2">{files.map((file) => <div key={file.id} className="rounded-xl border border-border bg-card p-3"><div className="flex flex-wrap items-center gap-2"><FileText className="size-4 text-primary" /><b className="min-w-0 truncate text-sm">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">Selected and processed · {lecture.lectureBrief?.usedSourceFileIds.includes(file.id) ? 'used in Brief' : 'not used in Brief'}</p>{file.sourceCoverage?.figureStatus === 'not-interpreted' && <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Figures not interpreted</p>}</div>)}</aside><article className="space-y-3">{results.map((chunk) => <section key={chunk.id} className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-extrabold text-primary">{files.find((file) => file.id === chunk.fileId)?.fileName ?? files.find((file) => file.id === chunk.fileId)?.title ?? 'Source'} · {chunk.sourcePosition?.label ?? 'passage'}</p><p className="mt-2 text-sm font-semibold leading-relaxed">{chunk.content}</p></section>)}{!results.length && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No selected source contains that exact text.</p>}</article></div><p className="sr-only">{data.lectureFindings.filter((item) => item.lectureId === lecture.id).length} saved class remarks</p></div>
}
