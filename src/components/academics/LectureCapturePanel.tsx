import '@/pages/LecturePage.css'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Brain, Check, ChevronDown, CircleHelp, FileCheck2, FilePlus2, FileSearch, FileStack, FileText, FileUp, FlaskConical, Image as ImageIcon, ListChecks, MoreHorizontal, NotebookText, Presentation, Search, Sparkles } from 'lucide-react'
import type { AcademicFile, ClassCenterData, Course, LectureBriefTrace, LectureRecord, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'
import { extractDocumentText, type ExtractedDocument } from '@/lib/academics/documentText'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import { analyzeLectureTranscript } from '@/lib/academics/lectureAnalysis'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateUnitMasteryOutline } from '@/lib/academics/generateUnitMasteryOutline'
import { buildLectureGuideProposal } from '@/lib/academics/guideContract'
import { approximateLectureTitle, buildLectureBrief, fileCoverageLabel, sourceChunksForLecture } from '@/lib/academics/lectureWorkspace'
import { practiceQuestionChunkIds } from '@/lib/academics/materialGenerationIntake'
import { instructorSourceFileIds } from '@/lib/academics/lectureSourcePriority'
import { selectGenerationSourceChunks } from '@/lib/academics/syncGenerationSources'
import { completedLectureTitle } from '@/lib/academics/lectureLabels'
import { MaterialIntakeDialog } from '@/components/academics/MaterialIntakeDialog'
import { LectureCaptureGuide } from '@/components/academics/LectureCaptureGuide'
import { LectureRecordMenu } from '@/components/academics/LectureRecordMenu'
import { QuestionBankPdfButton } from '@/components/academics/QuestionBankPdfButton'
import { DateField } from '@/components/common/DateField'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { GeneratedLectureGuideView, MasteryMapView } from './LectureStudyViews'

export type LectureDestination = 'overview' | 'transcript' | 'evidence' | 'study-work'
type WizardStep = 1 | 2 | 3
type WorkspaceView = 'brief' | 'mastery' | 'materials' | 'sources'

const MATERIAL_SUGGESTIONS = [
  { title: 'Textbook', detail: 'Definitions, mechanisms & context', Icon: BookOpen },
  { title: 'Slides', detail: 'Instructor sequence & emphasis', Icon: Presentation },
  { title: 'Objectives & syllabus', detail: 'Course goals for the Mastery Map', Icon: ListChecks },
  { title: 'Assigned readings', detail: 'Terminology & course context', Icon: FileText },
  { title: 'Practice questions', detail: 'Quizzes, exams, problem sets & keys', Icon: CircleHelp },
  { title: 'Notes & feedback', detail: 'Personal notes, discussions & feedback', Icon: NotebookText },
  { title: 'Lab & reference', detail: 'Methods, data, tables & formulas', Icon: FlaskConical },
  { title: 'Diagrams & screenshots', detail: 'Captions used; figures not interpreted', Icon: ImageIcon },
  { title: 'Other course files', detail: 'Anything else relevant', Icon: FileStack },
] as const

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
    <details data-testid="transcript-help" className="group/details mt-4 rounded-xl border border-border bg-muted/20">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2"><CircleHelp className="size-4 text-primary" aria-hidden="true" /><span className="font-display text-sm font-extrabold">Ways to get a transcript</span></span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open/details:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-2 border-t border-border px-4 py-3 text-xs font-semibold leading-5 text-muted-foreground">
        <p><b className="text-foreground">Panopto or your course site:</b> download or copy the captions or transcript.</p>
        <p><b className="text-foreground">Voice Memos or Word Transcribe:</b> review the transcript, then paste or upload it here.</p>
        <p><b className="text-foreground">Ask before recording.</b> Premed OS does not record audio here; it only keeps the text or file you add.</p>
      </div>
    </details>
  )
}

export function LectureCapturePanel({ courseId, course, data, onOpenNotes, initialLectureId, initialDestination = 'overview', displayMode = 'dialog', onNavigateLecture, onDeletedLecture }: {
  courseId: string; course?: Pick<Course, 'code' | 'title'>; data: ClassCenterData; onOpenNotes: () => void; initialLectureId?: string; initialDestination?: LectureDestination; displayMode?: 'dialog' | 'embedded' | 'page'; onNavigateLecture?: (id: string) => void; onDeletedLecture?: () => void
}) {
  const lectures = useMemo(() => data.lectures.filter((lecture) => lecture.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt), [courseId, data.lectures])
  const [activeLectureId, setActiveLectureId] = useState<string | undefined>(initialLectureId)
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId)
  const [step, setStep] = useState<WizardStep>(activeLecture?.transcriptFileId ? 2 : 1)
  const [rebuildingLectureId, setRebuildingLectureId] = useState<string>()
  const [view, setView] = useState<WorkspaceView>(initialDestination === 'transcript' || initialDestination === 'evidence' ? 'sources' : initialDestination === 'study-work' ? 'materials' : 'brief')
  const [captureGuideOpen, setCaptureGuideOpen] = useState(false)
  if (activeLecture?.workspaceState === 'complete' && rebuildingLectureId !== activeLecture.id) return <LectureWorkspace course={course} courseId={courseId} data={data} lectures={lectures} activeLecture={activeLecture} view={view} onView={setView} onSelect={(lecture) => { if (onNavigateLecture) { onNavigateLecture(lecture.id); return }; setActiveLectureId(lecture.id); setRebuildingLectureId(undefined); setView('brief') }} onDeleted={(lectureId) => { if (activeLectureId !== lectureId) return; if (onDeletedLecture) { onDeletedLecture(); return }; setActiveLectureId(lectures.find((lecture) => lecture.id !== lectureId)?.id); setRebuildingLectureId(undefined); setView('brief') }} onRebuild={() => { setStep(activeLecture.transcriptFileId ? 2 : 1); setRebuildingLectureId(activeLecture.id) }} onOpenNotes={onOpenNotes} onHelp={() => setCaptureGuideOpen(true)} help={<LectureCaptureGuide open={captureGuideOpen} onOpenChange={setCaptureGuideOpen} />} embedded={displayMode === 'embedded'} standalone={displayMode === 'page'} />
  return <LectureImportWizard courseId={courseId} course={course} data={data} lectures={lectures} lecture={activeLecture} step={step} onStep={setStep} onLecture={(lectureId, isNew) => { setActiveLectureId(lectureId); if (isNew) onNavigateLecture?.(lectureId) }} onBuilt={() => { setRebuildingLectureId(undefined); setView('brief'); if (activeLectureId) onNavigateLecture?.(activeLectureId) }} />
}

function LectureImportWizard({ courseId, course, data, lectures, lecture, step, onStep, onLecture, onBuilt }: {
  courseId: string; course?: Pick<Course, 'code' | 'title'>; data: ClassCenterData; lectures: LectureRecord[]; lecture?: LectureRecord; step: WizardStep; onStep: (step: WizardStep) => void; onLecture: (id: string, isNew: boolean) => void; onBuilt: () => void
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
  const [building, setBuilding] = useState(false)
  const [buildError, setBuildError] = useState<{ stage: string; message: string } | null>(null)
  const [buildPhase, setBuildPhase] = useState<'idle' | 'guide' | 'mastery' | 'saving'>('idle')
  const input = useRef<HTMLInputElement>(null)
  const lectureFiles = data.files.filter((file) => file.lectureId === lecture?.id)
  const lectureSourceIds = [...new Set([
    ...(lecture?.transcriptFileId ? [lecture.transcriptFileId] : []),
    ...(lecture?.selectedSourceFileIds ?? []),
    ...lectureFiles.map((file) => file.id),
  ])]
  const lectureSources = data.files.filter((file) => lectureSourceIds.includes(file.id))
  const supportingMaterials = lectureSources.filter((file) => file.id !== lecture?.transcriptFileId)
  const readableChunks = data.sourceChunks.filter((chunk) => lectureSourceIds.includes(chunk.fileId) && Boolean(chunk.content.trim()))
  const allQuestionReferenceChunkIds = practiceQuestionChunkIds(lectureSources, readableChunks)
  const primaryFileIds = instructorSourceFileIds(lectureSources, lecture?.transcriptFileId)
  const generationChunks = selectGenerationSourceChunks(readableChunks, {
    preferredFileIds: primaryFileIds,
    priorityChunkIds: allQuestionReferenceChunkIds,
  })
  const generationQuestionReferenceChunkIds = practiceQuestionChunkIds(lectureSources, generationChunks)

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
    const now = Date.now(); const isNewLecture = !lecture; const lectureId = lecture?.id ?? uid(); const blobRef = pendingFile ? await retainLocalMaterial(pendingFile, built.file.id) : undefined
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
    onLecture(lectureId, isNewLecture); onStep(2)
  }
  function goToPreview() {
    if (!lecture) return
    useStore.getState().update((draft) => { const record = draft.academics.classCenter.lectures.find((item) => item.id === lecture.id); if (record) Object.assign(record, { selectedSourceFileIds: lectureSourceIds, updatedAt: Date.now() }) })
    onStep(3)
  }
  async function buildWorkspace() {
    if (!lecture || building) return
    const ids = lectureSourceIds
    const chunks = readableChunks
    const chunksForGeneration = generationChunks
    const questionReferenceChunkIds = generationQuestionReferenceChunkIds
    setBuilding(true)
    setBuildError(null)
    setBuildPhase('guide')
    try {
      const guide = await generateStudyGuide({ courseId, chunks: chunksForGeneration, label: lecture.title, practiceQuestionChunkIds: questionReferenceChunkIds, primarySourceChunkIds: chunksForGeneration.filter((chunk) => primaryFileIds.includes(chunk.fileId)).map((chunk) => chunk.id) })
      if (!guide.ok || !guide.artifact) {
        setBuildError({ stage: 'Study Guide', message: guide.message ?? 'The lecture guide could not be generated.' })
        toast({ title: 'Nothing was saved', description: guide.message ?? 'The lecture guide could not be generated.', tone: 'error' })
        return
      }
      setBuildPhase('mastery')
      const mastery = await generateUnitMasteryOutline({ courseId, chunks: chunksForGeneration, unit: lecture.title, label: lecture.title, scope: 'lecture', practiceQuestionChunkIds: questionReferenceChunkIds, primarySourceChunkIds: chunksForGeneration.filter((chunk) => primaryFileIds.includes(chunk.fileId)).map((chunk) => chunk.id) })
      if (!mastery.ok || !mastery.artifact) {
        setBuildError({ stage: 'Mastery Map', message: mastery.message ?? 'The lecture Mastery Map could not be generated.' })
        toast({ title: 'Nothing was saved', description: mastery.message ?? 'The lecture Mastery Map could not be generated.', tone: 'error' })
        return
      }
      const generatedGuide = guide.artifact
      const generatedMastery = mastery.artifact
      setBuildPhase('saving')
      const now = Date.now()
      useStore.getState().update((draft) => {
        const center = draft.academics.classCenter
        const record = center.lectures.find((item) => item.id === lecture.id)
        if (!record) return
        record.selectedSourceFileIds = ids
        const brief = buildLectureBrief(chunks, ids, center.files, now)
        const usedChunkIds = new Set([
          ...generatedGuide.sections.flatMap((section) => section.blocks.map((block) => block.sourceRef?.chunkId).filter((id): id is string => Boolean(id))),
          ...generatedMastery.sourceChunkIds,
        ])
        const usedSourceFileIds = [...new Set(chunks.filter((chunk) => usedChunkIds.has(chunk.id)).map((chunk) => chunk.fileId))]
        record.lectureBrief = {
          ...brief,
          usedSourceFileIds,
          unusedSourceFileIds: ids.filter((id) => !usedSourceFileIds.includes(id)),
        }
        record.studyGuide = generatedGuide
        if (guide.suggestedTitle) record.aiTitle = guide.suggestedTitle
        record.generationAuditStatus = guide.auditStatus
        const existing = center.generatedMasteryOutlines.find((outline) => outline.lectureId === record.id)
        if (existing) {
          Object.assign(existing, generatedMastery, { lectureId: record.id, scopeId: record.id, updatedAt: now })
          record.masteryMapId = existing.id
        } else {
          const id = uid()
          center.generatedMasteryOutlines.unshift({ ...generatedMastery, id, lectureId: record.id, scopeId: record.id, createdAt: now, updatedAt: now, order: center.generatedMasteryOutlines.length })
          record.masteryMapId = id
        }
        record.workspaceState = 'complete'
        record.updatedAt = now
      })
      onBuilt()
      toast({ title: 'Lecture study page built', description: 'The combined Study Guide and Mastery Map passed the source-trace checks before either one was saved.' })
    } catch {
      setBuildError({ stage: 'Lecture build', message: 'Generation stopped unexpectedly. Your transcript and lecture materials are still here.' })
      toast({ title: 'Nothing was saved', description: 'Lecture generation stopped unexpectedly. Your transcript and lecture materials are still here.', tone: 'error' })
    } finally {
      setBuilding(false)
      setBuildPhase('idle')
    }
  }

  const progressPercent = Math.round(((step - 1) / 3) * 100)
  const stepLabels = ['Transcript', 'Materials', 'Build'] as const

  return <Card className="overflow-hidden border-border bg-card shadow-[0_18px_48px_-28px_rgba(0,0,0,.72)]"><CardContent className="p-0">
    <header className="border-b border-border px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">New lecture</p><h2 className="mt-1 font-display text-xl font-extrabold">Build a lecture</h2></div>
        <Badge aria-label="Lecture identity" className="mr-8 shrink-0" variant="outline">{course?.code ?? 'Class'} · Lecture {lectureNumber}</Badge>
      </div>
      <div className="mt-3" aria-label="Lecture import progress">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold"><span>Step {step} of 3 · {stepLabels[step - 1]}</span><span className="tabular-nums text-primary">{progressPercent}%</span></div>
        <Progress className="mt-2 h-1.5" value={progressPercent} aria-label={`Lecture import ${progressPercent}% complete`} />
        <ol className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-bold">
          {stepLabels.map((label, index) => <li key={label} className={cn('flex items-center gap-1.5', step === index + 1 ? 'text-foreground' : step > index + 1 ? 'text-primary' : 'text-muted-foreground')}>{step > index + 1 && <Check className="size-3" aria-hidden="true" />}{label}</li>)}
        </ol>
      </div>
    </header>
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      {step === 3 && buildError && <section role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4"><h3 className="font-display text-base font-extrabold">{buildError.stage} needs attention</h3><p className="mt-2 break-words text-sm leading-6">{buildError.message}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Your uploaded sources are still attached. You do not need to import them again.</p></section>}
      {step === 1 && <section aria-labelledby="lecture-source-heading"><h3 id="lecture-source-heading" className="font-display text-lg font-extrabold">Add the transcript</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Paste it below or upload a text, PDF, DOCX, or image.</p><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-4"><label className="block text-sm font-extrabold">Lecture title<Input className="mt-1.5" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true) }} placeholder="Lecture 1 · Origins of Psychology" /></label><div className="block max-w-56 text-sm font-extrabold"><span>Lecture date</span><DateField ariaLabel="Lecture date" className="mt-1.5 min-h-9 rounded-md border-input bg-background px-3 py-1 font-extrabold" value={occurredOn} onChange={setOccurredOn} /></div><label className="block text-sm font-extrabold">Transcript<Textarea className="mt-1.5 min-h-52" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setPendingFile(null); setPendingExtraction(null) }} placeholder={'Paste the transcript here…\n\nTimestamps are welcome but not required.'} /></label></div><aside className="rounded-2xl border border-border bg-muted/25 p-4"><FileUp className="size-5 text-primary" /><p className="mt-2 font-display text-sm font-extrabold">Upload transcript</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Files stay on this device while text is read.</p><Button className="mt-4 w-full" variant="outline" disabled={reading} onClick={() => input.current?.click()}>{reading ? 'Reading on device…' : 'Choose file'}</Button><input ref={input} type="file" className="sr-only" accept=".pdf,.docx,.txt,.md,image/*,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void chooseTranscript(file); event.currentTarget.value = '' }} />{pendingFile && <div className="mt-3 rounded-xl border border-border bg-card p-3"><p className="truncate text-sm font-extrabold">{pendingFile.name}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileExtension({ fileName: pendingFile.name, title: pendingFile.name, mimeType: pendingFile.type, sourceType: 'upload' })} · {pendingExtraction?.pageCount ? `${pendingExtraction.pageCount} pages` : `${sourceText.length.toLocaleString()} characters`}{pendingExtraction?.ocrPageCount ? ` · ${pendingExtraction.ocrPageCount} OCR recovered` : ''}</p></div>}<TranscriptSourceHelp /></aside></div><div className="mt-5 flex justify-end"><Button onClick={() => void saveSource()} disabled={!sourceText.trim() || !title.trim() || !occurredOn}><FileCheck2 className="size-4" /> Continue to materials</Button></div></section>}
      {step === 2 && lecture && <MaterialsStep courseId={courseId} data={data} lecture={lecture} materials={supportingMaterials} readableChunks={readableChunks} onContinue={goToPreview} />}
      {step === 3 && lecture && <section aria-labelledby="lecture-build-heading"><h3 id="lecture-build-heading" className="font-display text-lg font-extrabold">Ready to build</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Check the source receipt, then create both study tools.</p><LectureBuildSummary title={completedLectureTitle(lectureNumber, lecture)} sourceCount={lectureSources.length} materialCount={supportingMaterials.length} readableCount={readableChunks.length} generationCount={generationChunks.length} />{building && buildPhase !== 'idle' && <LectureBuildProgress phase={buildPhase} />}<details data-testid="lecture-ai-details" className="group/details mt-4 rounded-xl border border-border bg-muted/20"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span>What gets sent to AI</span><ChevronDown className="size-4 text-muted-foreground transition-transform group-open/details:rotate-180" aria-hidden="true" /></summary><p className="border-t border-border px-4 py-3 text-xs font-semibold leading-5 text-muted-foreground">Only the readable passages prepared for this build are copied to your private server workspace. Original file bytes stay local, figures are not sent, and nothing partial is saved if either study tool fails.</p></details><div className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" onClick={() => onStep(2)} disabled={building}>Back to materials</Button><Button onClick={() => void buildWorkspace()} disabled={building}><Sparkles className="size-4" /> {building ? 'Building…' : 'Build Guide + Mastery'}</Button></div></section>}
    </div>
  </CardContent></Card>
}

function LectureBuildSummary({ title, sourceCount, materialCount, readableCount, generationCount }: { title: string; sourceCount: number; materialCount: number; readableCount: number; generationCount: number }) {
  return <section aria-label="Lecture build summary" className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
    <header className="flex items-start gap-3 bg-muted/25 px-4 py-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><FileCheck2 className="size-4" /></span><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Source receipt</p><h4 className="mt-0.5 truncate font-display text-base font-extrabold">{title}</h4></div></header>
    <dl className="grid border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-border"><div className="px-4 py-3"><dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Transcript</dt><dd className="mt-1 text-sm font-extrabold text-success">Ready</dd></div><div className="border-t border-border px-4 py-3 sm:border-t-0"><dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Sources</dt><dd className="mt-1 text-sm font-extrabold">{sourceCount} {sourceCount === 1 ? 'source' : 'sources'} · {materialCount} {materialCount === 1 ? 'material' : 'materials'}</dd></div><div className="border-t border-border px-4 py-3 sm:border-t-0"><dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Readable text</dt><dd className="mt-1 text-sm font-extrabold">{readableCount.toLocaleString()} readable {readableCount === 1 ? 'passage' : 'passages'}</dd></div></dl>
    <div className="grid border-t border-border bg-muted/15 sm:grid-cols-2 sm:divide-x sm:divide-border"><div className="flex gap-3 px-4 py-3"><BookOpen className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><div><b className="text-sm">Study Guide</b><span className="mt-0.5 block text-xs font-semibold text-muted-foreground">At a glance plus the full lecture</span></div></div><div className="flex gap-3 border-t border-border px-4 py-3 sm:border-t-0"><ListChecks className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><div><b className="text-sm">Mastery Map</b><span className="mt-0.5 block text-xs font-semibold text-muted-foreground">Free-recall cues and application goals</span></div></div></div>
    {readableCount > 24 && <p className="border-t border-border px-4 py-3 text-xs font-semibold leading-5 text-muted-foreground">{readableCount === generationCount ? `All ${readableCount.toLocaleString()} readable passages will be reviewed for this build.` : `All ${readableCount.toLocaleString()} readable passages stay attached. The build will automatically use ${generationCount.toLocaleString()} representative, lecture-relevant passages.`}</p>}
  </section>
}

function LectureBuildProgress({ phase }: { phase: 'guide' | 'mastery' | 'saving' }) {
  const phases = [
    { id: 'guide', label: 'Generating the Study Guide', percent: 34 },
    { id: 'mastery', label: 'Creating the Mastery Map', percent: 67 },
    { id: 'saving', label: 'Checking sources and saving', percent: 92 },
  ] as const
  const current = phases.find((item) => item.id === phase) ?? phases[0]
  const stepNumber = phases.findIndex((item) => item.id === phase) + 1
  return <section className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5" role="status" aria-live="polite" aria-busy="true"><div className="flex items-start gap-3"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary" aria-hidden="true"><Sparkles className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-3"><p className="font-display text-sm font-extrabold">Building lecture</p><span className="shrink-0 text-xs font-extrabold tabular-nums text-primary">{current.percent}%</span></div><p className="mt-1 text-xs font-semibold text-muted-foreground">Step {stepNumber} of 3 · {current.label}</p><Progress className="mt-2 h-2" value={current.percent} aria-label={`Lecture generation ${current.percent}% complete`} /></div></div></section>
}

function MaterialsStep({ courseId, data, lecture, materials, readableChunks, onContinue }: { courseId: string; data: ClassCenterData; lecture: LectureRecord; materials: AcademicFile[]; readableChunks: SourceChunk[]; onContinue: () => void }) {
  const [showMaterials, setShowMaterials] = useState(false)
  const readableFileIds = new Set(readableChunks.map(chunk => chunk.fileId))
  const readyCount = materials.filter(file => file.processingStatus === 'ready' && readableFileIds.has(file.id)).length
  const compact = materials.length > 3
  return (
    <section aria-labelledby="lecture-materials-heading">
      <h3 id="lecture-materials-heading" className="font-display text-lg font-extrabold">
        Add materials
      </h3>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">Add the textbook pages, slides, notes, or practice for this lecture.</p>

      <div data-testid="add-material-strip" className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><FilePlus2 className="size-5" /></span>
          <div className="min-w-0">
            <p className="font-display text-sm font-extrabold">Add material</p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Textbook, slides, notes, or practice.</p>
          </div>
        </div>
        <MaterialIntakeDialog courseId={courseId} lectureId={lecture.id} trigger={<Button className="min-h-11 w-full sm:w-auto" variant="outline"><FilePlus2 className="size-4" /> Add material</Button>} />
      </div>

      <section className="mt-5" aria-labelledby="lecture-material-list-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p id="lecture-material-list-heading" className="font-display text-sm font-extrabold">Added to this lecture</p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Automatically included when readable. Unreadable files remain visible with a fix.</p>
          </div>
          <Badge variant="outline">{materials.length} {materials.length === 1 ? 'material' : 'materials'}</Badge>
        </div>
        {materials.length ? <div className="mt-2">
          {compact && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted px-3 py-2">
            <p className="text-xs font-semibold" role="status">{readyCount} ready · {materials.length - readyCount} need attention</p>
            <Button type="button" variant="ghost" size="sm" aria-expanded={showMaterials} onClick={() => setShowMaterials(value => !value)}>{showMaterials ? 'Hide file details' : `Review ${materials.length} files`}</Button>
          </div>}
          {(!compact || showMaterials) && <div role="region" aria-label="Attached lecture materials" tabIndex={0} className="mt-2 max-h-64 space-y-2 overflow-y-auto overscroll-contain rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {materials.map(file => <LectureMaterialStatus key={file.id} file={file} chunks={data.sourceChunks.filter(chunk => chunk.fileId === file.id && Boolean(chunk.content.trim()))} />)}
          </div>}
        </div> : <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm font-semibold text-muted-foreground">Add at least one lecture material to continue.</div>}
        <p className="mt-2 text-xs font-semibold text-muted-foreground">Transcript ready · {readableChunks.length} readable {readableChunks.length === 1 ? 'passage' : 'passages'} across this lecture.</p>
      </section>

      <details data-testid="material-suggestion-guide" className="group/details mt-4 rounded-2xl border border-border bg-muted/20">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><CircleHelp className="size-4 text-primary" aria-hidden="true" /><span className="font-display text-sm font-extrabold">Not sure what to add?</span></span>
          <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">9 examples <ChevronDown className="size-4 group-open/details:rotate-180" aria-hidden="true" /></span>
        </summary>
        <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Suggested material types">
          {MATERIAL_SUGGESTIONS.map(({ title, detail, Icon }) => (
            <div key={title} data-testid="material-suggestion" className="grid min-h-16 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Icon className="size-4" /></span>
              <span className="min-w-0">
                <b className="block font-display text-xs leading-4">{title}</b>
                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-muted-foreground">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Your transcript is included automatically.</p>
        <Button onClick={onContinue} disabled={!materials.length}>Review and build <ChevronDown className="size-4 -rotate-90" /></Button>
      </div>
    </section>
  )
}

function LectureMaterialStatus({ file, chunks }: { file: AcademicFile; chunks: SourceChunk[] }) {
  const ready = file.processingStatus === 'ready' && chunks.length > 0
  return <div className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3"><span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', ready ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="truncate">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge><Badge variant={ready ? 'default' : 'outline'}>{ready ? 'Ready' : 'Needs attention'}</Badge></span><span className="mt-1 block text-xs font-bold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.length)}{file.sourceCoverage?.figureStatus === 'not-interpreted' ? ' · figures not interpreted' : file.sourceCoverage?.figureStatus === 'question-bank-reviewed' ? ' · visually inspected by Claude for a question bank' : ''}</span>{!ready && <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">Fix: {file.processingError ?? 'Add readable text or a clearer scan.'}</span>}</span></div>
}

function LectureWorkspace({ course, courseId, data, lectures, activeLecture, view, onView, onSelect, onDeleted, onRebuild, onOpenNotes, onHelp, help, embedded = false, standalone = false }: { course?: Pick<Course, 'code' | 'title'>; courseId: string; data: ClassCenterData; lectures: LectureRecord[]; activeLecture: LectureRecord; view: WorkspaceView; onView: (view: WorkspaceView) => void; onSelect: (lecture: LectureRecord) => void; onDeleted: (lectureId: string) => void; onRebuild: () => void; onOpenNotes: () => void; onHelp: () => void; help: ReactNode; embedded?: boolean; standalone?: boolean }) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const selectedIds = activeLecture.selectedSourceFileIds ?? (activeLecture.transcriptFileId ? [activeLecture.transcriptFileId] : [])
  const files = data.files.filter((file) => selectedIds.includes(file.id)); const chunks = sourceChunksForLecture(data, activeLecture)
  const brief = activeLecture.lectureBrief ?? buildLectureBrief(chunks, selectedIds, data.files)
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === activeLecture.masteryMapId || outline.lectureId === activeLecture.id)
  const chronological = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (id: string) => chronological.findIndex((lecture) => lecture.id === id) + 1
  const moreMenu = <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={embedded ? 'More lecture tools' : undefined} className={cn(!embedded && 'mr-8')}><MoreHorizontal className="size-4" /><span className={cn(embedded && 'hidden sm:inline')}>More</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Lecture tools</DropdownMenuLabel><DropdownMenuItem onClick={() => onView('sources')}><Search className="size-4" /> Search sources</DropdownMenuItem><DropdownMenuItem onClick={onOpenNotes}><NotebookText className="size-4" /> Open class Guide</DropdownMenuItem><DropdownMenuItem onClick={onHelp}><CircleHelp className="size-4" /> Transcript help</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  const tabs = <nav className={cn('lecture-workspace-tabs flex min-w-0 gap-1 overflow-x-auto', !embedded && 'mt-4')} aria-label="Lecture workspace views">{([['brief', 'Study Guide'], ['mastery', 'Mastery Map'], ['materials', 'Materials'], ['sources', 'Sources']] as const).map(([value, label]) => <button key={value} type="button" aria-current={view === value ? 'page' : undefined} onClick={() => onView(value)} className={cn('whitespace-nowrap border-b-2 py-2 font-extrabold', embedded ? 'px-2 text-xs sm:px-3 sm:text-sm' : 'px-3 text-sm', view === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{label}</button>)}</nav>
  const content = <>{view === 'brief' && (activeLecture.studyGuide
    ? <GeneratedLectureGuideView standalone={standalone} lecture={activeLecture} guide={activeLecture.studyGuide} brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />
    : <LectureBriefView brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />)}{view === 'mastery' && <MasteryMapView outline={mastery} chunks={chunks} lecture={activeLecture} />}{view === 'materials' && <LectureMaterialsView data={data} lecture={activeLecture} files={data.files.filter((file) => file.lectureId === activeLecture.id || selectedIds.includes(file.id))} onOpenBrief={() => onView('brief')} onOpenMastery={() => onView('mastery')} />}{view === 'sources' && <LectureSourcesView courseId={courseId} lecture={activeLecture} files={files} chunks={chunks} data={data} />}</>

  if (embedded) return <section className="min-w-0 overflow-hidden border-t border-border bg-card" aria-label="Embedded lecture workspace"><div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-1 sm:px-2"><div className="min-w-0 flex-1">{tabs}</div><div className="shrink-0">{moreMenu}</div></div><div role="region" aria-label="Lecture reading area" tabIndex={0} className="max-h-[38rem] min-w-0 overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5">{content}</div>{help}</section>

  const catalog = <aside className="lecture-workspace-catalog min-h-0 min-w-0 border-b border-border bg-muted/25 lg:border-b-0 lg:border-r" aria-label="Lecture catalog">
      <div className="lecture-workspace-catalog-header flex items-center justify-between gap-2 px-4 py-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{course?.code ?? 'Class'}</p><h2 className="font-display text-base font-extrabold">Lectures</h2></div>
        <Badge variant="outline">{lectures.length}</Badge>
      </div>
      <div className="lecture-workspace-catalog-list flex min-h-0 gap-2 px-3 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:block lg:space-y-1.5" role="region" aria-label="Lecture list" tabIndex={0}>
        {lectures.map((lecture) => <LectureRecordMenu key={lecture.id} lecture={lecture} onOpen={() => { setCatalogOpen(false); onSelect(lecture) }} onDeleted={onDeleted}><button type="button" aria-current={lecture.id === activeLecture.id ? 'page' : undefined} onClick={() => { setCatalogOpen(false); onSelect(lecture) }} className={cn('lecture-workspace-catalog-record min-w-56 rounded-xl border p-3 pr-9 text-left lg:min-w-0 lg:w-full', lecture.id === activeLecture.id ? 'border-primary bg-card shadow-sm' : 'border-transparent hover:border-border hover:bg-card/70')}><span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Lecture {lectureNumber(lecture.id)} · {lecture.occurredOn ?? 'Date not set'}</span><b className="mt-1 block line-clamp-2 font-display text-sm">{completedLectureTitle(lectureNumber(lecture.id), lecture)}</b><span className="lecture-workspace-catalog-status mt-1 block text-[11px] font-bold text-muted-foreground">{lecture.studyGuide && lecture.masteryMapId ? 'Generated Guide + Mastery' : lecture.workspaceState === 'complete' ? 'Local preview · rebuild available' : 'Import in progress'}</span></button></LectureRecordMenu>)}
      </div>
    </aside>
  return <div className={cn("lecture-workspace grid w-full min-w-0 max-w-full overflow-hidden", standalone && "lecture-workspace-standalone")} data-layout="independent-scroll">
    {!standalone && catalog}
    <div className="lecture-workspace-main min-w-0 bg-card">
      <header className="lecture-workspace-header border-b border-border px-4 py-4 sm:px-6" aria-label="Lecture header">
        <div className="lecture-workspace-heading-row flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture {lectureNumber(activeLecture.id)} · {activeLecture.occurredOn ?? 'Date not set'}</p><h1 className="mt-1 break-words font-display text-2xl font-extrabold">{completedLectureTitle(lectureNumber(activeLecture.id), activeLecture)}</h1><p className="lecture-workspace-source-summary mt-1 text-sm font-semibold text-muted-foreground">{files.length} selected {files.length === 1 ? 'source' : 'sources'} · {chunks.length} readable {chunks.length === 1 ? 'passage' : 'passages'}</p></div>
          <div className="lecture-workspace-actions flex flex-wrap items-center gap-2">{standalone && <Sheet open={catalogOpen} onOpenChange={setCatalogOpen}><SheetTrigger asChild><Button size="sm" variant="outline"><BookOpen className="size-4" />Switch lecture</Button></SheetTrigger><SheetContent side="left" className="lecture-switcher"><SheetHeader><SheetTitle>Class lectures</SheetTitle><SheetDescription>Choose a lecture to open its study workspace.</SheetDescription></SheetHeader>{catalog}</SheetContent></Sheet>}<Button size="sm" onClick={onRebuild}><Sparkles className="size-4" /> Rebuild with AI</Button>{moreMenu}</div>
        </div>
        {tabs}
      </header>
      <div key={`${activeLecture.id}:${view}`} role="region" aria-label="Lecture reading area" tabIndex={0} className="lecture-workspace-reading min-w-0 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6">{content}</div>
      {help}
    </div>
  </div>
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
    <section className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Study Guide preview</p><h2 className="mt-1 font-display text-2xl font-extrabold">At a glance</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground">This source-grounded preview becomes the opening of the full Study Guide after generation.</p></div><Badge variant="outline">{brief.usedSourceFileIds.length}/{brief.selectedSourceFileIds.length} sources used</Badge></div></section>

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
  return <details className="rounded-2xl border border-border bg-card p-4"><summary className="cursor-pointer rounded py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-ring">Source coverage</summary><aside className="pt-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Source coverage</p><div className="mt-3 space-y-3">{files.map((file) => <div key={file.id}><div className="flex items-center justify-between gap-2"><b className="truncate text-xs">{file.fileName ?? file.title}</b><Badge variant={brief.usedSourceFileIds.includes(file.id) ? 'default' : 'outline'}>{brief.usedSourceFileIds.includes(file.id) ? 'Used' : 'Not used'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p></div>)}</div><p className="mt-4 border-t border-border pt-3 text-[11px] font-semibold text-muted-foreground">Figures and diagrams were not interpreted. Readable captions may appear as ordinary text passages.</p></aside></details>
}

function GeneratedMaterialRow({ icon: Icon, title, detail, onOpen, children }: {
  icon: typeof BookOpen
  title: string
  detail: string
  onOpen?: () => void
  children?: ReactNode
}) {
  const heading = <><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="font-display text-sm">{title}</b><Badge variant="outline">Generated</Badge></span><span className="mt-0.5 block text-xs font-semibold text-muted-foreground">{detail}</span></span></>
  if (onOpen) return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">{heading}<Button size="sm" variant="outline" className="shrink-0" onClick={onOpen}>Open</Button></div>
  return <details className="group rounded-xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{heading}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="border-t border-border px-4 py-3">{children}</div></details>
}

function LectureMaterialsView({ data, lecture, files, onOpenBrief, onOpenMastery }: {
  data: ClassCenterData
  lecture: LectureRecord
  files: AcademicFile[]
  onOpenBrief: () => void
  onOpenMastery: () => void
}) {
  const explicitLectureFileIds = new Set(files.filter((file) => file.lectureId === lecture.id || file.id === lecture.transcriptFileId).map((file) => file.id))
  const fileIds = explicitLectureFileIds.size > 0 ? explicitLectureFileIds : new Set(files.map((file) => file.id))
  const chunkFile = new Map(data.sourceChunks.map((chunk) => [chunk.id, chunk.fileId]))
  const usesLectureSource = (chunkIds: string[]) => chunkIds.some((id) => fileIds.has(chunkFile.get(id) ?? ''))
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === lecture.masteryMapId || outline.lectureId === lecture.id)
  const decks = data.generatedFlashcardDecks.filter((deck) => deck.courseId === lecture.courseId && usesLectureSource(deck.sourceChunkIds))
  const revisedNotes = data.generatedRevisedNotes.filter((notes) => notes.courseId === lecture.courseId && notes.selectedFileIds.some((id) => fileIds.has(id)))
  const banks = data.generatedUnitQuestionBanks.filter((bank) => bank.courseId === lecture.courseId && usesLectureSource(bank.sourceChunkIds))
  const guideNotes = data.notes.filter((note) => note.courseId === lecture.courseId && note.type === 'study-guide' && note.linkedFileIds?.some((id) => fileIds.has(id)))
  const generatedCount = Number(Boolean(lecture.studyGuide)) + Number(Boolean(mastery)) + decks.length + revisedNotes.length + banks.length + guideNotes.length

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="border-b border-border pb-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture library</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Materials</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Everything attached to this lecture, separated by origin.</p></div><p className="text-xs font-extrabold text-muted-foreground">{generatedCount} generated · {files.length} {files.length === 1 ? 'source' : 'sources'}</p></div>
    </header>

    <section aria-labelledby="generated-lecture-materials">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Made from this lecture</p><h3 id="generated-lecture-materials" className="mt-1 font-display text-lg font-extrabold">Generated resources</h3></div><p className="text-xs font-semibold text-muted-foreground">Create new resources from Class Materials.</p></div>
      <div className="mt-3 space-y-2">
        {lecture.studyGuide && <GeneratedMaterialRow icon={BookOpen} title="Study Guide" detail={`${lecture.studyGuide.sections.length} sections · At a glance through full depth · source traced`} onOpen={onOpenBrief} />}
        {mastery && <GeneratedMaterialRow icon={ListChecks} title="Mastery Map" detail={`${mastery.standards.length} learning ${mastery.standards.length === 1 ? 'objective' : 'objectives'} · ${mastery.scope ?? 'unit'} scope`} onOpen={onOpenMastery} />}
        {guideNotes.map((note) => <GeneratedMaterialRow key={note.id} icon={BookOpen} title={note.title} detail={`${note.linkedFileIds?.length ?? 0} linked sources`}><p className="whitespace-pre-wrap text-sm font-semibold leading-6">{note.content}</p></GeneratedMaterialRow>)}
        {decks.map((deck) => <GeneratedMaterialRow key={deck.id} icon={Brain} title={deck.title} detail={`${deck.cards.length} cards · ${deck.sourceChunkIds.length} source passages`}><div className="divide-y divide-border">{deck.cards.map((card, index) => <div key={card.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3"><span className="text-xs font-extrabold text-primary">{index + 1}</span><p className="text-sm font-bold">{card.cloze ?? card.front}</p><p className="text-sm font-semibold text-muted-foreground">{card.back ?? card.extra ?? 'Cloze answer retained in the card.'}</p></div>)}</div></GeneratedMaterialRow>)}
        {revisedNotes.map((notes) => <GeneratedMaterialRow key={notes.id} icon={NotebookText} title={notes.title} detail={`${notes.sections.length} sections · ${notes.usedFileIds.length}/${notes.selectedFileIds.length} sources used`}><div className="space-y-4">{notes.sections.map((section) => <section key={section.id}><h4 className="font-display text-sm font-extrabold">{section.title}</h4><div className="mt-2 space-y-2">{section.passages.map((passage) => <p key={passage.id} className="text-sm font-semibold leading-6 text-muted-foreground">{passage.content}</p>)}</div></section>)}</div></GeneratedMaterialRow>)}
        {banks.map((bank) => <GeneratedMaterialRow key={bank.id} icon={FileStack} title={bank.title} detail={`${bank.questions.length} questions · ${bank.integrationPercent}% prior-unit integration${bank.visualSourceFileIds?.length ? ` · ${bank.visualSourceFileIds.length} images inspected` : ''}${bank.webPatternSearchCount ? ` · ${bank.webPatternSearchCount} official web ${bank.webPatternSearchCount === 1 ? 'search' : 'searches'}` : ''}`}><div className="mb-3 flex justify-end"><QuestionBankPdfButton bank={bank} /></div><div className="divide-y divide-border">{bank.questions.map((question, index) => <div key={question.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)]"><span className="text-xs font-extrabold text-primary">{index + 1}</span><div><p className="text-sm font-bold">{question.prompt}</p><p className="mt-1 text-sm font-semibold text-muted-foreground"><b className="text-foreground">Answer:</b> {question.answer}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{question.rationale}</p></div></div>)}</div></GeneratedMaterialRow>)}
        {!generatedCount && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No generated resources for this lecture yet. Use Create study resources in Class Materials when your sources are ready.</p>}
      </div>
    </section>

    <section aria-labelledby="source-lecture-materials">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Imported for this lecture</p>
      <h3 id="source-lecture-materials" className="mt-1 font-display text-lg font-extrabold">Your sources</h3>
      <div className="mt-3 space-y-2">{files.map((file) => <LectureMaterialStatus key={file.id} file={file} chunks={data.sourceChunks.filter((chunk) => chunk.fileId === file.id)} />)}{!files.length && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No sources are attached to this lecture.</p>}</div>
    </section>
  </div>
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
  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Inspect on demand</p><h2 className="mt-1 font-display text-xl font-extrabold">Sources</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">The transcript and supporting evidence stay searchable here, behind the lecture’s study front.</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><FileSearch className="size-4" /> More source tools <ChevronDown className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Uses an external AI provider</DropdownMenuLabel><DropdownMenuItem onClick={() => void findRemarks()} disabled={finding}><Sparkles className="size-4" /> {finding ? 'Checking lecture passages…' : 'Find class remarks'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="rounded-xl border border-border bg-muted/25 p-3 text-xs font-semibold text-muted-foreground">“Find class remarks” copies only these readable lecture passages to your private server workspace, then invokes the configured external AI provider. Results remain proposals until reviewed.</p><label className="relative block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact words across transcript and sources" /></label><div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]"><aside className="space-y-2">{files.map((file) => <div key={file.id} className="rounded-xl border border-border bg-card p-3"><div className="flex flex-wrap items-center gap-2"><FileText className="size-4 text-primary" /><b className="min-w-0 truncate text-sm">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">Attached and processed · {lecture.lectureBrief?.usedSourceFileIds.includes(file.id) ? 'used in Guide' : 'not used in Guide'}</p>{file.sourceCoverage?.figureStatus === 'not-interpreted' && <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Figures not interpreted</p>}</div>)}</aside><article className="space-y-3">{results.map((chunk) => <section key={chunk.id} className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-extrabold text-primary">{files.find((file) => file.id === chunk.fileId)?.fileName ?? files.find((file) => file.id === chunk.fileId)?.title ?? 'Source'} · {chunk.sourcePosition?.label ?? 'passage'}</p><p className="mt-2 text-sm font-semibold leading-relaxed">{chunk.content}</p></section>)}{!results.length && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No lecture source contains that exact text.</p>}</article></div><p className="sr-only">{data.lectureFindings.filter((item) => item.lectureId === lecture.id).length} saved class remarks</p></div>
}
