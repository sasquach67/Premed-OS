import { useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Brain, Captions, Check, ChevronDown, CircleHelp, FileCheck2, FilePlus2, FileSearch, FileStack, FileText, FileUp, FlaskConical, Image as ImageIcon, ListChecks, Mic2, MoreHorizontal, NotebookText, Presentation, Search, ShieldCheck, Sparkles } from 'lucide-react'
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
import { approximateLectureTitle, buildLectureBrief, buildLectureMasteryMap, fileCoverageLabel, sourceChunksForLecture } from '@/lib/academics/lectureWorkspace'
import { practiceQuestionChunkIds } from '@/lib/academics/materialGenerationIntake'
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
import { Textarea } from '@/components/ui/textarea'
import type { ContentBlock, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'

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
  const [rebuildingLectureId, setRebuildingLectureId] = useState<string>()
  const [view, setView] = useState<WorkspaceView>(initialDestination === 'transcript' || initialDestination === 'evidence' ? 'sources' : initialDestination === 'study-work' ? 'materials' : 'brief')
  const [captureGuideOpen, setCaptureGuideOpen] = useState(false)
  if (activeLecture?.workspaceState === 'complete' && rebuildingLectureId !== activeLecture.id) return <LectureWorkspace course={course} courseId={courseId} data={data} lectures={lectures} activeLecture={activeLecture} view={view} onView={setView} onSelect={(lecture) => { setActiveLectureId(lecture.id); setRebuildingLectureId(undefined); setView('brief') }} onDeleted={(lectureId) => { if (activeLectureId !== lectureId) return; setActiveLectureId(lectures.find((lecture) => lecture.id !== lectureId)?.id); setRebuildingLectureId(undefined); setView('brief') }} onRebuild={() => { setStep(activeLecture.transcriptFileId ? 2 : 1); setRebuildingLectureId(activeLecture.id) }} onOpenNotes={onOpenNotes} onHelp={() => setCaptureGuideOpen(true)} help={<LectureCaptureGuide open={captureGuideOpen} onOpenChange={setCaptureGuideOpen} />} embedded={displayMode === 'embedded'} />
  return <LectureImportWizard courseId={courseId} course={course} data={data} lectures={lectures} lecture={activeLecture} step={step} onStep={setStep} onLecture={setActiveLectureId} onBuilt={() => { setRebuildingLectureId(undefined); setView('brief') }} />
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
  const [building, setBuilding] = useState(false)
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
  const previewLecture = lecture ? { ...lecture, selectedSourceFileIds: lectureSourceIds } : undefined
  const previewBrief = previewLecture ? buildLectureBrief(readableChunks, lectureSourceIds, data.files) : undefined
  const previewMastery = previewLecture ? buildLectureMasteryMap({ lecture: previewLecture, topics: data.topics.filter((topic) => topic.courseId === courseId), chunks: readableChunks, files: lectureSources }) : undefined

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
    onLecture(lectureId); onStep(2)
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
    const questionReferenceChunkIds = practiceQuestionChunkIds(lectureSources, chunks)
    setBuilding(true)
    setBuildPhase('guide')
    try {
      const guide = await generateStudyGuide({ courseId, chunks, label: lecture.title, practiceQuestionChunkIds: questionReferenceChunkIds })
      if (!guide.ok || !guide.artifact) {
        toast({ title: 'Nothing was saved', description: guide.message ?? 'The lecture guide could not be generated.', tone: 'error' })
        return
      }
      setBuildPhase('mastery')
      const mastery = await generateUnitMasteryOutline({ courseId, chunks, unit: lecture.title, label: lecture.title, scope: 'lecture', practiceQuestionChunkIds: questionReferenceChunkIds })
      if (!mastery.ok || !mastery.artifact) {
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
      toast({ title: 'Nothing was saved', description: 'Lecture generation stopped unexpectedly. Your transcript and lecture materials are still here.', tone: 'error' })
    } finally {
      setBuilding(false)
      setBuildPhase('idle')
    }
  }

  return <Card className="overflow-hidden border-border bg-card shadow-[0_18px_48px_-28px_rgba(0,0,0,.72)]"><CardContent className="p-0">
    <header className="border-b border-border px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">New lecture</p><h2 className="mt-1 font-display text-xl font-extrabold">Build one study-ready lecture page</h2><p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">The transcript is source evidence. Your finished lecture opens to one combined Study Guide and a separate Mastery Map.</p></div><Badge aria-label="Lecture identity" className="mr-8 shrink-0" variant="outline">{course?.code ?? 'Class'} · Lecture {lectureNumber}</Badge></div><ol className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Lecture import progress">{(['Add lecture source', 'Add lecture materials', 'Build lecture page'] as const).map((label, index) => { const number = (index + 1) as WizardStep; return <li key={label} className={cn('rounded-xl border px-3 py-2', step === number ? 'border-primary bg-primary/8' : step > number ? 'border-border bg-muted/35' : 'border-border bg-card')}><div className="flex items-center gap-2"><span className={cn('grid size-6 place-items-center rounded-full text-xs font-extrabold', step > number ? 'bg-primary text-primary-foreground' : step === number ? 'border border-primary text-primary' : 'border border-border text-muted-foreground')}>{step > number ? <Check className="size-3.5" /> : number}</span><span className="text-xs font-extrabold">{label}</span></div></li> })}</ol></header>
    <div className="p-4 sm:p-6">
      {step === 1 && <section aria-labelledby="lecture-source-heading"><h3 id="lecture-source-heading" className="font-display text-lg font-extrabold">1. Add lecture source</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Paste a transcript or upload a text, PDF, DOCX, or image. Scanned pages are read on this device when possible.</p><div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-4"><label className="block text-sm font-extrabold">Approximate title<Input className="mt-1.5" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true) }} placeholder="Lecture 1 · Origins of Psychology" /></label><div className="block max-w-56 text-sm font-extrabold"><span>Lecture date</span><DateField ariaLabel="Lecture date" className="mt-1.5 min-h-9 rounded-md border-input bg-background px-3 py-1 font-extrabold" value={occurredOn} onChange={setOccurredOn} /></div><label className="block text-sm font-extrabold">Transcript text<Textarea className="mt-1.5 min-h-52" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setPendingFile(null); setPendingExtraction(null) }} placeholder={'Paste the transcript here…\n\nTimestamps are welcome but not required.'} /></label></div><aside className="rounded-2xl border border-border bg-muted/25 p-4"><FileUp className="size-5 text-primary" /><p className="mt-2 font-display text-sm font-extrabold">Or upload the source</p><p className="mt-1 text-xs font-semibold text-muted-foreground">The original file stays on this device. OCR retains page coverage; diagrams and embedded figures are not interpreted.</p><Button className="mt-4 w-full" variant="outline" disabled={reading} onClick={() => input.current?.click()}>{reading ? 'Reading on device…' : 'Choose transcript file'}</Button><input ref={input} type="file" className="sr-only" accept=".pdf,.docx,.txt,.md,image/*,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void chooseTranscript(file); event.currentTarget.value = '' }} />{pendingFile && <div className="mt-3 rounded-xl border border-border bg-card p-3"><p className="truncate text-sm font-extrabold">{pendingFile.name}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileExtension({ fileName: pendingFile.name, title: pendingFile.name, mimeType: pendingFile.type, sourceType: 'upload' })} · {pendingExtraction?.pageCount ? `${pendingExtraction.pageCount} pages` : `${sourceText.length.toLocaleString()} characters`}{pendingExtraction?.ocrPageCount ? ` · ${pendingExtraction.ocrPageCount} OCR recovered` : ''}</p></div>}<TranscriptSourceHelp /></aside></div><div className="mt-5 flex justify-end"><Button onClick={() => void saveSource()} disabled={!sourceText.trim() || !title.trim() || !occurredOn}><FileCheck2 className="size-4" /> Continue to materials</Button></div></section>}
      {step === 2 && lecture && <MaterialsStep courseId={courseId} data={data} lecture={lecture} materials={supportingMaterials} readableChunks={readableChunks} onContinue={goToPreview} />}
      {step === 3 && lecture && previewBrief && <section aria-labelledby="lecture-build-heading"><h3 id="lecture-build-heading" className="font-display text-lg font-extrabold">3. Build lecture page</h3><p className="mt-1 max-w-3xl text-sm font-semibold text-muted-foreground">This preview shows what the readable sources attached to this lecture can support. Build runs the documented Study Guide and Mastery Map generators before anything is marked complete.</p><BuildLecturePreview lecture={lecture} brief={previewBrief} mastery={previewMastery} files={lectureSources} />{building && <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/7 p-4" role="status"><p className="font-display text-sm font-extrabold">Building your lecture workspace</p><ol className="mt-3 grid gap-2 sm:grid-cols-3">{([['guide', 'Generate study guide'], ['mastery', 'Build mastery objectives'], ['saving', 'Verify and save']] as const).map(([phase, label]) => { const phases = ['guide', 'mastery', 'saving']; const active = phases.indexOf(buildPhase) === phases.indexOf(phase); const complete = phases.indexOf(buildPhase) > phases.indexOf(phase); return <li key={phase} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold', active ? 'border-primary bg-card' : 'border-border bg-muted/25')}><span className={cn('grid size-5 place-items-center rounded-full border', complete && 'border-primary bg-primary text-primary-foreground', active && 'border-primary text-primary')}>{complete ? <Check className="size-3" /> : phases.indexOf(phase) + 1}</span>{label}</li> })}</ol></div>}<div className="mt-4 border-t border-border pt-4"><p className="font-display text-sm font-extrabold">Privacy and processing</p><p className="mt-1 max-w-4xl text-xs font-semibold leading-relaxed text-muted-foreground">Only readable passages attached to this lecture are copied to your private server workspace for this generation. Original file bytes stay local. The app refuses unsupported citations and does not save a partial lecture page if either required artifact fails. Figures are not sent or interpreted by this lecture flow.</p></div><div className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" onClick={() => onStep(2)} disabled={building}>Back to materials</Button><Button onClick={() => void buildWorkspace()} disabled={building}><Sparkles className="size-4" /> {building ? 'Building…' : 'Build Guide + Mastery'}</Button></div></section>}
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
      <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">Your lecture, before you build</p><h4 className="mt-1 break-words font-display text-xl font-extrabold">{lecture.title}</h4><p className="mt-1 text-xs font-semibold text-muted-foreground">Study Guide with At a glance and a connected Mastery Map</p></div>
      <Badge variant="outline">{files.length} lecture {files.length === 1 ? 'source' : 'sources'}</Badge>
    </header>
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <article className="min-w-0 px-5 py-6 sm:px-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Study Guide preview · At a glance</p>
        <h5 className="mt-1 font-display text-lg font-extrabold">The lecture in a few clear moves</h5>
        {brief.summary.length ? <div className="mt-4 space-y-3">{brief.summary.slice(0, 2).map((item) => <p key={item.id} className="text-sm font-semibold leading-6 text-foreground/90">{item.text}</p>)}</div> : <p className="mt-4 text-sm font-semibold leading-relaxed text-muted-foreground">No readable summary is available yet. Add a clearer transcript or another processed source.</p>}

        <section className="mt-6 border-y border-border py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How the ideas connect</p>
          {flow.length > 1 ? <ol className="mt-3 flex min-w-0 flex-wrap items-center gap-2" aria-label="Concept flow preview">{flow.map((node, index) => <li key={node.id} className="contents"><span className="max-w-40 rounded-full border border-primary/25 bg-primary/7 px-3 py-1.5 text-xs font-extrabold">{node.label}</span>{index < flow.length - 1 && <span className="text-sm font-black text-primary" aria-hidden="true">→</span>}</li>)}</ol> : brief.connections.length ? <p className="mt-3 text-sm font-semibold leading-6">{brief.connections[0].text}</p> : <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">The completed Brief will place supported relationships here without inventing missing links.</p>}
        </section>

        <section className="mt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Language worth knowing</p>
          {vocabulary.length ? <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">{vocabulary.map((item) => <div key={item.id} className="min-w-0"><dt className="text-xs font-extrabold capitalize text-foreground">{item.term}</dt><dd className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-5 text-muted-foreground">{item.text}</dd></div>)}</dl> : <p className="mt-3 text-xs font-semibold text-muted-foreground">Key vocabulary will appear when the lecture sources repeat a term strongly enough to support it.</p>}
        </section>
      </article>

      <aside className="border-t border-border bg-muted/25 px-5 py-6 lg:border-l lg:border-t-0" aria-label="Mastery Map preview">
        <div className="flex items-center gap-2"><ListChecks className="size-4 text-primary" /><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Mastery Map</p></div>
        <h5 className="mt-2 font-display text-base font-extrabold">What you should be able to do</h5>
        {mastery ? <ol className="mt-4 space-y-4">{mastery.standards.slice(0, 3).map((standard, index) => <li key={standard.id} className="border-l-2 border-primary/35 pl-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Objective {index + 1} · Not started</p><p className="mt-1 text-sm font-extrabold leading-5">{standard.title}</p></li>)}</ol> : <div className="mt-4 border-l-2 border-border pl-3"><p className="text-sm font-extrabold">Objectives need a course source</p><p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">Add learning objectives or syllabus material. Transcript topics are not silently promoted into official objectives.</p></div>}
        <p className="mt-5 border-t border-border pt-4 text-[11px] font-semibold leading-5 text-muted-foreground">Every full objective includes Understand, Be able to do, Watch for, and a mastery state.</p>
      </aside>
    </div>
    <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-muted/15 px-5 py-3 text-[11px] font-semibold text-muted-foreground sm:px-6"><span className="font-extrabold text-foreground">Source foundation</span>{sourceNames.length ? <><span className="max-w-64 truncate">{sourceNames[0]}</span>{sourceNames[1] && <span className="max-w-64 truncate">{sourceNames[1]}</span>}{sourceNames.length > 2 && <span>+{sourceNames.length - 2} more</span>}</> : <span>No sources attached</span>}<span className="ml-auto text-primary">{brief.usedSourceFileIds.length} used in this preview</span></footer>
  </section>
}

function MaterialsStep({ courseId, data, lecture, materials, readableChunks, onContinue }: { courseId: string; data: ClassCenterData; lecture: LectureRecord; materials: AcademicFile[]; readableChunks: SourceChunk[]; onContinue: () => void }) {
  return (
    <section aria-labelledby="lecture-materials-heading">
      <h3 id="lecture-materials-heading" className="font-display text-lg font-extrabold">
        2. Add lecture materials
      </h3>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">Add the slides, textbook pages, notes, or practice that belong to this lecture. Anything added here is automatically included when readable.</p>

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
        {materials.length ? <div className="mt-2 space-y-2">{materials.map((file) => <LectureMaterialStatus key={file.id} file={file} chunks={data.sourceChunks.filter((chunk) => chunk.fileId === file.id && Boolean(chunk.content.trim()))} />)}</div> : <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm font-semibold text-muted-foreground">Add at least one lecture material to continue.</div>}
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
        <Button onClick={onContinue} disabled={!materials.length}>Continue to build preview <ChevronDown className="size-4 -rotate-90" /></Button>
      </div>
    </section>
  )
}

function LectureMaterialStatus({ file, chunks }: { file: AcademicFile; chunks: SourceChunk[] }) {
  const ready = file.processingStatus === 'ready' && chunks.length > 0
  return <div className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3"><span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', ready ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="truncate">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge><Badge variant={ready ? 'default' : 'outline'}>{ready ? 'Ready' : 'Needs attention'}</Badge></span><span className="mt-1 block text-xs font-bold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.length)}{file.sourceCoverage?.figureStatus === 'not-interpreted' ? ' · figures not interpreted' : file.sourceCoverage?.figureStatus === 'question-bank-reviewed' ? ' · visually inspected by Claude for a question bank' : ''}</span>{!ready && <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">Fix: {file.processingError ?? 'Add readable text or a clearer scan.'}</span>}</span></div>
}

function LectureWorkspace({ course, courseId, data, lectures, activeLecture, view, onView, onSelect, onDeleted, onRebuild, onOpenNotes, onHelp, help, embedded = false }: { course?: Pick<Course, 'code' | 'title'>; courseId: string; data: ClassCenterData; lectures: LectureRecord[]; activeLecture: LectureRecord; view: WorkspaceView; onView: (view: WorkspaceView) => void; onSelect: (lecture: LectureRecord) => void; onDeleted: (lectureId: string) => void; onRebuild: () => void; onOpenNotes: () => void; onHelp: () => void; help: ReactNode; embedded?: boolean }) {
  const selectedIds = activeLecture.selectedSourceFileIds ?? (activeLecture.transcriptFileId ? [activeLecture.transcriptFileId] : [])
  const files = data.files.filter((file) => selectedIds.includes(file.id)); const chunks = sourceChunksForLecture(data, activeLecture)
  const brief = activeLecture.lectureBrief ?? buildLectureBrief(chunks, selectedIds, data.files)
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === activeLecture.masteryMapId || outline.lectureId === activeLecture.id)
  const chronological = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (id: string) => chronological.findIndex((lecture) => lecture.id === id) + 1
  const moreMenu = <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={embedded ? 'More lecture tools' : undefined} className={cn(!embedded && 'mr-8')}><MoreHorizontal className="size-4" /><span className={cn(embedded && 'hidden sm:inline')}>More</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Lecture tools</DropdownMenuLabel><DropdownMenuItem onClick={() => onView('sources')}><Search className="size-4" /> Search sources</DropdownMenuItem><DropdownMenuItem onClick={onOpenNotes}><NotebookText className="size-4" /> Open class Guide</DropdownMenuItem><DropdownMenuItem onClick={onHelp}><CircleHelp className="size-4" /> Transcript help</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  const tabs = <nav className={cn('flex min-w-0 gap-1 overflow-x-auto', !embedded && 'mt-4')} aria-label="Lecture workspace views">{([['brief', 'Study Guide'], ['mastery', 'Mastery Map'], ['materials', 'Materials'], ['sources', 'Sources']] as const).map(([value, label]) => <button key={value} type="button" aria-current={view === value ? 'page' : undefined} onClick={() => onView(value)} className={cn('whitespace-nowrap border-b-2 py-2 font-extrabold', embedded ? 'px-2 text-xs sm:px-3 sm:text-sm' : 'px-3 text-sm', view === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{label}</button>)}</nav>
  const content = <>{view === 'brief' && (activeLecture.studyGuide
    ? <GeneratedLectureGuideView lecture={activeLecture} guide={activeLecture.studyGuide} brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />
    : <LectureBriefView brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />)}{view === 'mastery' && <MasteryMapView outline={mastery} chunks={chunks} lecture={activeLecture} />}{view === 'materials' && <LectureMaterialsView data={data} lecture={activeLecture} files={data.files.filter((file) => file.lectureId === activeLecture.id || selectedIds.includes(file.id))} onOpenBrief={() => onView('brief')} onOpenMastery={() => onView('mastery')} />}{view === 'sources' && <LectureSourcesView courseId={courseId} lecture={activeLecture} files={files} chunks={chunks} data={data} />}</>

  if (embedded) return <section className="min-w-0 overflow-hidden border-t border-border bg-card" aria-label="Embedded lecture workspace"><div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-1 sm:px-2"><div className="min-w-0 flex-1">{tabs}</div><div className="shrink-0">{moreMenu}</div></div><div className="max-h-[38rem] min-w-0 overflow-y-auto p-4 sm:p-5">{content}</div>{help}</section>

  return <div className="grid min-h-[38rem] w-full min-w-0 max-w-full overflow-x-hidden lg:grid-cols-[15rem_minmax(0,1fr)]"><aside className="min-w-0 border-b border-border bg-muted/25 p-3 lg:border-b-0 lg:border-r" aria-label="Lecture catalog"><div className="flex items-center justify-between gap-2 px-1"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{course?.code ?? 'Class'}</p><h2 className="font-display text-base font-extrabold">Lectures</h2></div><Badge variant="outline">{lectures.length}</Badge></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible">{lectures.map((lecture) => <LectureRecordMenu key={lecture.id} lecture={lecture} onOpen={() => onSelect(lecture)} onDeleted={onDeleted}><button type="button" aria-current={lecture.id === activeLecture.id ? 'page' : undefined} onClick={() => onSelect(lecture)} className={cn('min-w-56 rounded-xl border p-3 pr-9 text-left lg:min-w-0 lg:w-full', lecture.id === activeLecture.id ? 'border-primary bg-card shadow-sm' : 'border-transparent hover:border-border hover:bg-card/70')}><span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Lecture {lectureNumber(lecture.id)} · {lecture.occurredOn ?? 'Date not set'}</span><b className="mt-1 block line-clamp-2 font-display text-sm">{lecture.title}</b><span className="mt-1 block text-[11px] font-bold text-muted-foreground">{lecture.studyGuide && lecture.masteryMapId ? 'Generated Guide + Mastery' : lecture.workspaceState === 'complete' ? 'Local preview · rebuild available' : 'Import in progress'}</span></button></LectureRecordMenu>)}</div></aside><main className="min-w-0 bg-card"><header className="border-b border-border px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture {lectureNumber(activeLecture.id)} · {activeLecture.occurredOn ?? 'Date not set'}</p><h1 className="mt-1 break-words font-display text-2xl font-extrabold">{activeLecture.title}</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">{files.length} selected {files.length === 1 ? 'source' : 'sources'} · {chunks.length} readable {chunks.length === 1 ? 'passage' : 'passages'}</p></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" onClick={onRebuild}><Sparkles className="size-4" /> Rebuild with AI</Button>{moreMenu}</div></div>{tabs}</header><div className="min-w-0 p-4 sm:p-6">{content}</div>{help}</main></div>
}

function sourceForBlock(block: ContentBlock, chunks: SourceChunk[], files: AcademicFile[]) {
  if (!block.sourceRef) return undefined
  const chunk = chunks.find((item) => item.id === block.sourceRef?.chunkId)
  if (!chunk) return undefined
  const file = files.find((item) => item.id === chunk.fileId)
  return { chunk, label: `${file?.fileName ?? file?.title ?? 'Source'} · ${chunk.sourcePosition?.label ?? 'passage'}` }
}

function GeneratedGuideBlock({ block, chunks, files }: { block: ContentBlock; chunks: SourceChunk[]; files: AcademicFile[] }) {
  const [open, setOpen] = useState(false)
  const source = sourceForBlock(block, chunks, files)
  const items = block.items?.map((item) => item.content).filter(Boolean) ?? []
  return <div className={cn('rounded-xl border border-border bg-muted/20 p-4', block.type === 'must_understand' && 'border-primary/25 bg-primary/6', block.type === 'must_memorize' && 'border-amber-500/25 bg-amber-500/6')}>
    {block.conceptLabel && <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">{block.conceptLabel}</p>}
    {block.text?.content && <p className="mt-1 text-sm font-semibold leading-7">{block.text.content}</p>}
    {items.length > 0 && <ul className="mt-2 space-y-2">{items.map((item, index) => <li key={`${block.id}-${index}`} className="flex gap-2 text-sm font-semibold leading-6"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul>}
    {source && <div className="mt-2"><Button className="h-auto px-0 text-[11px]" variant="link" onClick={() => setOpen((value) => !value)}>{open ? 'Hide source' : `Verify · ${source.label}`}</Button>{open && <blockquote className="mt-1 rounded-lg border border-border bg-card p-3 text-xs font-semibold leading-relaxed text-muted-foreground">{source.chunk.content}</blockquote>}</div>}
  </div>
}

function GeneratedGuideConceptMap({ lecture, guide }: { lecture: LectureRecord; guide: StudyGuideArtifact }) {
  const concepts = guide.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.conceptLabel && block.sourceRef)
    .filter((block, index, all) => all.findIndex((item) => item.conceptLabel?.toLocaleLowerCase() === block.conceptLabel?.toLocaleLowerCase()) === index)
    .slice(0, 8)
  if (!concepts.length) return null
  return <section className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5" aria-label="Generated concept map"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How the ideas fit</p><h3 className="mt-1 font-display text-lg font-extrabold">Concept map</h3><div className="mt-4 grid gap-3 md:grid-cols-[minmax(10rem,0.7fr)_minmax(0,2fr)]"><div className="grid place-items-center rounded-2xl border border-primary/35 bg-card p-5 text-center"><Brain className="size-5 text-primary" /><b className="mt-2 font-display text-sm">{lecture.aiTitle ?? lecture.title}</b></div><div className="grid gap-2 sm:grid-cols-2">{concepts.map((block) => <div key={block.id} className="relative rounded-xl border border-border bg-card p-3 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-primary/40"><p className="text-xs font-extrabold text-primary">{block.conceptLabel}</p>{block.text?.content && <p className="mt-1 line-clamp-3 text-[11px] font-semibold leading-5 text-muted-foreground">{block.text.content}</p>}</div>)}</div></div><p className="mt-3 text-[11px] font-semibold text-muted-foreground">Each branch comes from a cited core-concept, mechanism, or relationship block. It does not infer unsupported links.</p></section>
}

function GeneratedLectureGuideView({ lecture, guide, brief, chunks, files, mastery, onOpenMastery }: { lecture: LectureRecord; guide: StudyGuideArtifact; brief: NonNullable<LectureRecord['lectureBrief']>; chunks: SourceChunk[]; files: AcademicFile[]; mastery?: ClassCenterData['generatedMasteryOutlines'][number]; onOpenMastery: () => void }) {
  const atAGlanceSections = guide.sections.filter((section) => section.id === 'at-a-glance' || section.id === 'big-picture')
  const detailSections = guide.sections.filter((section) => !atAGlanceSections.includes(section))
  return <div className="mx-auto max-w-5xl">
    <section className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Generated from your selected lecture sources</p><h2 className="mt-1 font-display text-2xl font-extrabold">Lecture Study Guide</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground">One connected document: orient yourself in At a glance, then continue into the complete explanation without a second overlapping brief.</p></div><div className="flex flex-wrap gap-2"><Badge variant="outline">spec {guide.specHash}</Badge>{lecture.generationAuditStatus && <Badge variant="outline">Audit {lecture.generationAuditStatus}</Badge>}</div></div></section>
    <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6" aria-labelledby="lecture-guide-at-a-glance"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">First reading depth</p><h3 id="lecture-guide-at-a-glance" className="mt-1 font-display text-xl font-extrabold">At a glance</h3><p className="mt-1 text-xs font-semibold text-muted-foreground">The whole-lecture map before the detailed teaching sections.</p>{atAGlanceSections.length > 0 && <div className="mt-4 grid gap-3">{atAGlanceSections.flatMap((section) => section.blocks).map((block) => <GeneratedGuideBlock key={block.id} block={block} chunks={chunks} files={files} />)}</div>}<GeneratedGuideConceptMap lecture={lecture} guide={guide} /></section>
    <div className="mt-6 space-y-5">{detailSections.map((section) => <section key={section.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{section.id.replace(/-/g, ' ')}</p><h3 className="mt-1 font-display text-lg font-extrabold">{section.title}</h3><div className="mt-4 grid gap-3">{section.blocks.map((block) => <GeneratedGuideBlock key={block.id} block={block} chunks={chunks} files={files} />)}</div></section>)}</div>
    <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Check yourself next</p><h3 className="mt-1 font-display text-lg font-extrabold">Mastery Map preview</h3></div><Button size="sm" variant="outline" onClick={onOpenMastery}>Open full map</Button></div>{mastery ? <div className="mt-4 space-y-2">{mastery.standards.slice(0, 3).map((standard) => <div key={standard.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3"><b className="text-sm">{standard.title}</b><Badge variant="outline">Not started</Badge></div>)}</div> : <p className="mt-3 text-sm font-semibold text-muted-foreground">The Mastery Map is unavailable. This lecture should be rebuilt rather than treated as complete.</p>}</div><SourceCoverage files={files} chunks={chunks} brief={brief} /></section>
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
  return <aside className="rounded-2xl border border-border bg-muted/25 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Source coverage</p><div className="mt-3 space-y-3">{files.map((file) => <div key={file.id}><div className="flex items-center justify-between gap-2"><b className="truncate text-xs">{file.fileName ?? file.title}</b><Badge variant={brief.usedSourceFileIds.includes(file.id) ? 'default' : 'outline'}>{brief.usedSourceFileIds.includes(file.id) ? 'Used' : 'Not used'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p></div>)}</div><p className="mt-4 border-t border-border pt-3 text-[11px] font-semibold text-muted-foreground">Figures and diagrams were not interpreted. Readable captions may appear as ordinary text passages.</p></aside>
}

function MasteryMapView({ outline, chunks, lecture }: { outline?: ClassCenterData['generatedMasteryOutlines'][number]; chunks: SourceChunk[]; lecture: LectureRecord }) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  function setMastery(standardId: string, masteryState: 'not-started' | 'can-explain' | 'can-apply-without-notes') { if (outline) useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id); const standard = record?.standards.find((item) => item.id === standardId); if (standard) { standard.masteryState = masteryState; if (record) record.updatedAt = Date.now() } }) }
  if (!outline) return <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-6"><ListChecks className="size-6 text-primary" /><h2 className="mt-3 font-display text-xl font-extrabold">Mastery Map needs course objectives</h2><p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">Add learning objectives or syllabus material, then link those objectives to this lecture. Premed OS will not turn transcript topics into official course objectives.</p></div>
  return <div className="space-y-4"><section className="rounded-2xl border border-primary/35 bg-primary/6 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{outline.scope ?? 'unit'} scope</p><h2 className="mt-1 font-display text-xl font-extrabold">Mastery Map</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{lecture.title} · {outline.standards.length} source-backed {outline.standards.length === 1 ? 'objective' : 'objectives'}</p></div><label className="text-xs font-extrabold">Scope<select className="ml-2 rounded-lg border border-border bg-card px-2 py-1.5" value={outline.scope ?? 'unit'} onChange={(event) => useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id); if (record) { record.scope = event.target.value as 'lecture' | 'unit' | 'exam'; record.updatedAt = Date.now() } })}><option value="lecture">Lecture</option><option value="unit">Unit</option><option value="exam">Exam</option></select></label></div></section>{outline.standards.map((standard, index) => <article key={standard.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Objective {index + 1}</p><h3 className="mt-1 font-display text-lg font-extrabold">{standard.title}</h3></div><label className="text-xs font-extrabold">Mastery<select aria-label={`Mastery state for ${standard.title}`} className="ml-2 rounded-lg border border-border bg-muted/25 px-2 py-1.5" value={standard.masteryState ?? 'not-started'} onChange={(event) => setMastery(standard.id, event.target.value as 'not-started' | 'can-explain' | 'can-apply-without-notes')}><option value="not-started">Not started</option><option value="can-explain">Can explain</option><option value="can-apply-without-notes">Can apply without notes</option></select></label></div><div className="mt-4"><MasterySection label="Free recall" items={standard.freeRecallCues?.length ? standard.freeRecallCues : [standard.title]} /></div><div className="mt-3 grid gap-3 lg:grid-cols-3"><MasterySection label="Understand" items={standard.understand} /><MasterySection label="Be able to do" items={standard.beAbleToDo} /><MasterySection label="Watch for" items={standard.watchFor} /></div><div className="mt-3 border-t border-border pt-3"><Button variant="link" className="h-auto px-0 text-xs" onClick={() => setSourceId((current) => current === standard.id ? null : standard.id)}>{sourceId === standard.id ? 'Hide sources' : `Show sources (${standard.sourceChunkIds.length})`}</Button>{sourceId === standard.id && <div className="mt-2 space-y-2">{standard.sourceChunkIds.map((id) => { const chunk = chunks.find((item) => item.id === id); return <blockquote key={id} className="rounded-xl border border-border bg-muted/25 p-3 text-xs font-semibold text-muted-foreground"><b className="text-foreground">{chunk?.sourcePosition?.label ?? 'Source passage'}:</b> {chunk?.content ?? 'Source is no longer available.'}</blockquote> })}</div>}</div></article>)}</div>
}
function MasterySection({ label, items }: { label: string; items: string[] }) { return <section className="rounded-xl border border-border bg-muted/25 p-3"><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">{label}</p><ul className="mt-2 space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm font-semibold leading-relaxed"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></section> }

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
