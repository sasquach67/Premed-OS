import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Brain, ChevronDown, ClipboardPaste, FilePlus2, FileStack, FileUp, Link2, NotebookText, Search, Sparkles } from 'lucide-react'
import type { ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'
import { extractDocumentText } from '@/lib/academics/documentText'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import { analyzeLectureTranscript } from '@/lib/academics/lectureAnalysis'
import { searchLectureFindings, searchLectureSourceChunks } from '@/lib/academics/lectureEvidence'
import { buildLectureGuideProposal } from '@/lib/academics/guideContract'
import { MaterialIntakeDialog } from '@/components/academics/MaterialIntakeDialog'
import { MaterialGenerationIntake, type MaterialArtifact } from '@/components/academics/MaterialGenerationIntake'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

type View = 'start' | 'review' | 'index'
export type LectureDestination = 'overview' | 'transcript' | 'evidence' | 'study-work'

function isoToday() { return new Date().toISOString().slice(0, 10) }

export function LectureCapturePanel({ courseId, data, onOpenNotes, initialLectureId, initialDestination = 'overview' }: { courseId: string; data: ClassCenterData; onOpenNotes: () => void; initialLectureId?: string; initialDestination?: LectureDestination }) {
  const toast = useToast()
  const initialLecture = initialLectureId ? data.lectures.find((lecture) => lecture.id === initialLectureId && lecture.courseId === courseId) : undefined
  const [view, setView] = useState<View>(initialLectureId && !(initialDestination === 'transcript' && !initialLecture?.transcriptFileId) ? 'review' : 'start')
  const [occurredOn, setOccurredOn] = useState(initialLecture?.occurredOn ?? isoToday)
  const [pasted, setPasted] = useState('')
  const [activeLectureId, setActiveLectureId] = useState<string | undefined>(initialLectureId)
  const [query, setQuery] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const analysisRequestInFlight = useRef(false)
  const [importingTranscript, setImportingTranscript] = useState(false)
  const [artifact, setArtifact] = useState<MaterialArtifact | null>(null)

  const lectures = data.lectures.filter((lecture) => lecture.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt)
  const chronologicalLectures = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (lectureId: string) => chronologicalLectures.findIndex((lecture) => lecture.id === lectureId) + 1
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId) ?? lectures[0]
  const activeLectureFiles = activeLecture ? data.files.filter((file) => file.lectureId === activeLecture.id) : []
  const transcriptChunks = activeLecture?.transcriptFileId
    ? data.sourceChunks.filter((chunk) => chunk.fileId === activeLecture.transcriptFileId).sort((a, b) => a.order - b.order)
    : []
  const findings = activeLecture
    ? data.lectureFindings.filter((finding) => finding.lectureId === activeLecture.id).sort((a, b) => a.order - b.order)
    : []
  const pendingNotes = activeLecture
    ? data.guideProposals.filter((proposal) => proposal.source.sourceKind === 'lecture' && proposal.source.sourceId === activeLecture.id && proposal.status === 'pending')
    : []
  const preview = useMemo(() => (pasted.trim() ? parseTranscript(pasted) : undefined), [pasted])
  const results = useMemo(() => searchLectureFindings(query, findings, transcriptChunks), [findings, query, transcriptChunks])
  const matchingChunks = useMemo(() => searchLectureSourceChunks(query, transcriptChunks), [query, transcriptChunks])

  function addTranscript() {
    const targetLecture = activeLectureId ? lectures.find((lecture) => lecture.id === activeLectureId && !lecture.transcriptFileId) : undefined
    const defaultTitle = targetLecture?.title ?? `Lecture #${chronologicalLectures.filter((lecture) => String(lecture.occurredOn ?? '') <= occurredOn).length + 1}`
    const built = buildTranscriptImport({
      courseId, title: defaultTitle, text: pasted,
      order: data.files.filter((file) => file.courseId === courseId).length,
    })
    if (!built) {
      toast({ title: 'Nothing to import', description: 'Paste the transcript text first.' })
      return
    }
    const now = Date.now()
    const lectureId = targetLecture?.id ?? uid()
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter
      built.file.lectureId = lectureId
      // Schedules provide chronology only. Syllabus standards/objectives are
      // never inferred from a transcript or a calendar date.
      built.file.linkedTopicIds = []
      center.files.push(built.file)
      center.sourceChunks.push(...built.chunks.map((chunk) => ({ ...chunk, topicId: undefined, assignmentMethod: 'pending' as const, assignmentConfirmed: false })))
      const existing = center.lectures.find((lecture) => lecture.id === lectureId && lecture.courseId === courseId)
      if (existing) Object.assign(existing, { inputPath: 'pasted' as const, transcriptFileId: built.file.id, occurredOn, processingState: 'ready' as const, processedAt: now, updatedAt: now })
      else center.lectures.unshift({
        id: lectureId, courseId, title: built.file.title, inputPath: 'pasted', transcriptFileId: built.file.id,
        occurredOn, topicIds: [], processingState: 'ready', createdAt: now, processedAt: now, updatedAt: now,
        order: center.lectures.filter((lecture) => lecture.courseId === courseId).length,
      })
    })
    setActiveLectureId(lectureId)
    setOccurredOn(isoToday())
    setPasted('')
    setView('review')
    toast({ title: 'Lecture saved', description: built.hasTimestamps ? 'Source timestamps were retained. Title and syllabus context can be confirmed later.' : 'The transcript stays readable without time anchors. Title and syllabus context can be confirmed later.' })
  }

  async function addTranscriptFile(file: File) {
    setImportingTranscript(true)
    try {
      const extracted = await extractDocumentText(file)
      if (!extracted.text.trim()) {
        toast({ title: 'Transcript needs readable text', description: extracted.scanDetected ? 'This file is an image or scanned document. Paste its transcript text, or choose a PDF/DOCX/TXT with a text layer.' : 'No transcript text was found.' })
        return
      }
      const targetLecture = activeLectureId ? lectures.find((lecture) => lecture.id === activeLectureId && !lecture.transcriptFileId) : undefined
      const defaultTitle = targetLecture?.title ?? `Lecture #${chronologicalLectures.filter((lecture) => String(lecture.occurredOn ?? '') <= occurredOn).length + 1}`
      const built = buildTranscriptImport({ courseId, title: defaultTitle, text: extracted.text, order: data.files.filter((item) => item.courseId === courseId).length })
      if (!built) {
        toast({ title: 'Transcript needs readable text', description: 'No transcript passages were found in that file.' })
        return
      }
      const blobRef = await retainLocalMaterial(file, built.file.id)
      const lectureId = targetLecture?.id ?? uid()
      const now = Date.now()
      useStore.getState().update((draft) => {
        const center = draft.academics.classCenter
        Object.assign(built.file, {
          lectureId, sourceType: 'upload' as const, blobRef,
          fileName: file.name, mimeType: file.type, processingStatus: 'ready' as const,
        })
        built.file.linkedTopicIds = []
        center.files.push(built.file)
        center.sourceChunks.push(...built.chunks.map((chunk) => ({ ...chunk, topicId: undefined, assignmentMethod: 'pending' as const, assignmentConfirmed: false })))
        const existing = center.lectures.find((lecture) => lecture.id === lectureId && lecture.courseId === courseId)
        if (existing) Object.assign(existing, { inputPath: 'uploaded' as const, transcriptFileId: built.file.id, occurredOn, processingState: 'ready' as const, processedAt: now, updatedAt: now })
        else center.lectures.unshift({
          id: lectureId, courseId, title: built.file.title, inputPath: 'uploaded', transcriptFileId: built.file.id,
          occurredOn, topicIds: [], processingState: 'ready', createdAt: now, processedAt: now, updatedAt: now,
          order: center.lectures.filter((lecture) => lecture.courseId === courseId).length,
        })
      })
      setActiveLectureId(lectureId)
      setOccurredOn(isoToday())
      setView('review')
      toast({ title: 'Lecture saved', description: 'The original file and its extracted transcript stay together on this device.' })
    } catch (error) {
      toast({ title: 'Transcript could not be read', description: error instanceof Error ? error.message : 'Paste the transcript text instead.' })
    } finally {
      setImportingTranscript(false)
    }
  }

  async function analyze() {
    if (!activeLecture || !transcriptChunks.length || analysisRequestInFlight.current) return
    analysisRequestInFlight.current = true
    setAnalyzing(true)
    try {
      const outcome = await analyzeLectureTranscript({ courseId, chunks: transcriptChunks })
      if (!outcome.ok) {
        toast({ title: 'No lecture remarks were saved', description: outcome.message, tone: 'error' })
        return
      }
      const now = Date.now()
      let addedCount = 0
      useStore.getState().update((draft) => {
        const center = draft.academics.classCenter
        const existingKeys = new Set(center.lectureFindings
          .filter((item) => item.lectureId === activeLecture.id)
          .map((item) => `${item.sourceChunkId}\n${item.timestamp}\n${item.quote}`))
        outcome.findings.forEach((finding) => {
          const evidenceKey = `${finding.sourceChunkId}\n${finding.timestamp}\n${finding.quote}`
          if (existingKeys.has(evidenceKey)) return
          existingKeys.add(evidenceKey)
          const findingId = uid()
          const savedFinding = { ...finding, id: findingId, courseId, lectureId: activeLecture.id, createdAt: now, updatedAt: now, order: center.lectureFindings.filter((item) => item.lectureId === activeLecture.id).length }
          center.lectureFindings.push(savedFinding)
          addedCount += 1
          const proposal = buildLectureGuideProposal({ center, courseId, lectureId: activeLecture.id, finding: savedFinding, now })
          if (proposal) center.guideProposals.push(proposal)
        })
      })
      toast({ title: addedCount ? 'Remarks ready for review' : outcome.findings.length ? 'No new remarks found' : 'No class-specific remarks found', description: addedCount ? 'They are pending in Guide until you review, edit, add, or dismiss them.' : outcome.findings.length ? 'Those exact remarks are already saved for this lecture.' : 'No weak guesses were created.' })
      if (addedCount) setView('review')
    } catch (error) {
      toast({ title: 'No lecture remarks were saved', description: error instanceof Error && error.message ? error.message : 'Lecture analysis is unavailable. Your local lecture and transcript were not changed.', tone: 'error' })
    } finally {
      analysisRequestInFlight.current = false
      setAnalyzing(false)
    }
  }

  const openLecture = (lecture: LectureRecord) => {
    setActiveLectureId(lecture.id)
    setArtifact(null)
    setView('review')
  }

  return (
    <Card className="lecture-capture-panel overflow-hidden border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 border-b border-border/70">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lectures</p>
          <CardTitle className="mt-1">One home for each day of class</CardTitle>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Paste the transcript, attach the material you used, then keep notes and generated study tools with that lecture.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['start', 'review', 'index'] as View[]).map((candidate) => <Button key={candidate} size="sm" variant={view === candidate ? 'default' : 'outline'} onClick={() => setView(candidate)} disabled={candidate !== 'start' && !activeLecture}>
            {candidate === 'start' ? 'Capture' : candidate === 'review' ? 'Review' : 'Index'}
          </Button>)}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {view === 'start' && <CaptureStart
          occurredOn={occurredOn} onOccurredOn={setOccurredOn} pasted={pasted} onPasted={setPasted} preview={preview}
          onPaste={addTranscript} onFile={addTranscriptFile} importing={importingTranscript} lectures={lectures} lectureNumber={lectureNumber} onOpen={openLecture} targetLecture={activeLectureId ? activeLecture : undefined}
        />}
        {view === 'review' && activeLecture && <>
          <ReviewView
            lecture={activeLecture} chunks={transcriptChunks} findings={findings} pendingCount={pendingNotes.length}
            lectureLabel={`Lecture #${lectureNumber(activeLecture.id)}`} analyzing={analyzing} onAnalyze={() => void analyze()} onOpenNotes={onOpenNotes} onIndex={() => setView('index')}
            materials={activeLectureFiles.filter((file) => file.id !== activeLecture.transcriptFileId)} onCreateStudyWork={setArtifact} initialDestination={initialDestination}
          />
          {artifact && <div className="mt-4 border-t border-border pt-4"><MaterialGenerationIntake artifact={artifact} courseId={courseId} courseLabel={`Lecture ${lectureNumber(activeLecture.id)}`} files={activeLectureFiles} lectureId={activeLecture.id} onClose={() => setArtifact(null)} /></div>}
        </>}
        {view === 'index' && activeLecture && <IndexView query={query} onQuery={setQuery} findings={results} chunks={matchingChunks} onOpenNotes={onOpenNotes} />}
        {!activeLecture && view !== 'start' && <div className="rounded-xl border border-dashed border-border bg-muted/35 p-4 text-sm font-semibold text-muted-foreground">Capture or paste a transcript first. Premed OS never invents a lecture moment.</div>}
      </CardContent>
    </Card>
  )
}

function CaptureStart({ occurredOn, onOccurredOn, pasted, onPasted, preview, onPaste, onFile, importing, lectures, lectureNumber, onOpen, targetLecture }: {
  occurredOn: string; onOccurredOn: (value: string) => void; pasted: string; onPasted: (value: string) => void; preview: ReturnType<typeof parseTranscript> | undefined; onPaste: () => void; onFile: (file: File) => Promise<void>; importing: boolean; lectures: LectureRecord[]; lectureNumber: (lectureId: string) => number; onOpen: (lecture: LectureRecord) => void; targetLecture?: LectureRecord
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  return <div className="space-y-4">
    <section id="lecture-transcript" className="lecture-capture-stage">
      <p className="font-display text-base font-extrabold">{targetLecture ? `Add transcript to Lecture #${lectureNumber(targetLecture.id)}` : 'Add a lecture'}</p><p className="mt-1 text-sm text-muted-foreground">Choose the date and paste the transcript. Lecture evidence stays connected to the syllabus standards and objectives that define the course structure.</p>
      <div className="lecture-capture-flow" aria-label="Lecture capture flow"><div className="is-current"><span>1</span><div><b>Add transcript</b><small>Paste the lecture source.</small></div></div><div><span>2</span><div><b>Add materials</b><small>Attach slides, readings, or notes next.</small></div></div><div><span>3</span><div><b>Study from it</b><small>Generate or review later.</small></div></div></div>
      <Input className="mt-3 max-w-40" aria-label="Lecture date" type="date" value={occurredOn} onChange={(event) => onOccurredOn(event.target.value)} />
      <Textarea className="mt-2 min-h-40" value={pasted} onChange={(event) => onPasted(event.target.value)} placeholder={'22:14 The distinction here is…\n31:08 If you only take one thing from this unit…'} />
      {preview && <p className="mt-2 text-xs font-semibold text-muted-foreground">{preview.segments.length} source segment{preview.segments.length === 1 ? '' : 's'} detected{preview.hasTimestamps ? ' · timestamps retained' : ' · no timestamps found'}.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={!preview?.segments.length} onClick={onPaste}><ClipboardPaste className="size-4" /> Add pasted transcript</Button>
        <Button size="sm" variant="outline" disabled={importing} onClick={() => fileInput.current?.click()}><FileUp className="size-4" /> {importing ? 'Reading transcript…' : 'Import transcript file'}</Button>
        <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" aria-label="Choose a lecture transcript file" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void onFile(file); event.currentTarget.value = '' }} />
      </div>
    </section>
    {!!lectures.length && <section><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Your lectures</p><div className="grid gap-2 md:grid-cols-2">{lectures.map((lecture) => <button key={lecture.id} type="button" onClick={() => onOpen(lecture)} className="lecture-capture-record"><p className="font-extrabold">Lecture #{lectureNumber(lecture.id)}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{lecture.aiTitle ?? (lecture.title.startsWith('Lecture #') ? 'Title pending' : lecture.title)} · {lecture.occurredOn ?? 'Date not set'}</p></button>)}</div></section>}
  </div>
}

function ReviewView({ lecture, lectureLabel, chunks, findings, pendingCount, analyzing, onAnalyze, onOpenNotes, onIndex, materials, onCreateStudyWork, initialDestination }: { lecture: LectureRecord; lectureLabel: string; chunks: SourceChunk[]; findings: ClassCenterData['lectureFindings']; pendingCount: number; analyzing: boolean; onAnalyze: () => void; onOpenNotes: () => void; onIndex: () => void; materials: ClassCenterData['files']; onCreateStudyWork: (artifact: MaterialArtifact) => void; initialDestination: LectureDestination }) {
  const [transcriptOpen, setTranscriptOpen] = useState(initialDestination === 'transcript')
  const evidenceRef = useRef<HTMLDivElement>(null)
  const studyWorkRef = useRef<HTMLDivElement>(null)
  const hasTimestamps = chunks.some((chunk) => chunk.sourcePosition?.label)
  const supportingMaterials = materials.filter((file) => file.owner !== 'generated')
  const generatedMaterials = materials.filter((file) => file.owner === 'generated')

  useEffect(() => {
    if (initialDestination === 'evidence' && supportingMaterials.length) evidenceRef.current?.focus()
    if (initialDestination === 'study-work') studyWorkRef.current?.focus()
  }, [initialDestination, supportingMaterials.length])

  return <div className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-lg font-extrabold">{lectureLabel}</p>{(lecture.aiTitle ?? (lecture.title.startsWith('Lecture #') ? undefined : lecture.title)) && <p className="mt-1 font-semibold text-muted-foreground">{lecture.aiTitle ?? lecture.title}</p>}<p className="mt-1 text-sm text-muted-foreground">{lecture.occurredOn ?? 'Date not set'} · transcript, material, and study work stay connected here.</p></div><div className="flex flex-wrap gap-2"><MaterialIntakeDialog courseId={lecture.courseId} lectureId={lecture.id} linkedTopicIds={lecture.topicIds ?? []} trigger={<Button size="sm" className="lecture-next-step"><FilePlus2 className="size-4" /> Add related material</Button>} /><Button size="sm" variant="outline" onClick={onIndex}><Search className="size-4" /> Search index</Button>{hasTimestamps && <Button size="sm" onClick={onAnalyze} disabled={analyzing}>{analyzing ? 'Analyzing complete transcript…' : 'Find class remarks'}</Button>}</div></div>
    <div className="lecture-review-flow" aria-label="Lecture workflow"><span className="is-complete"><b>1</b> Transcript saved</span><span className="is-current"><b>2</b> Add related material</span><span><b>3</b> Generate study material</span></div>
    <div ref={evidenceRef} tabIndex={-1} className="rounded-xl border border-border bg-muted/30 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Supporting evidence</p><div className="mt-2 flex flex-wrap gap-2">{supportingMaterials.map((file) => <span key={file.id} className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold">{file.title}</span>)}{!supportingMaterials.length && <p className="text-sm font-semibold text-muted-foreground">Attach slides, your notes, or any relevant handout to keep it with this lecture.</p>}</div><MaterialIntakeDialog courseId={lecture.courseId} lectureId={lecture.id} linkedTopicIds={lecture.topicIds ?? []} initialOpen={initialDestination === 'evidence' && !supportingMaterials.length} trigger={<Button size="sm" variant="outline" className="mt-3"><FilePlus2 className="size-4" /> {supportingMaterials.length ? 'Add more evidence' : 'Add evidence'}</Button>} /></div>
    <div ref={studyWorkRef} tabIndex={-1} className="rounded-xl border border-border bg-muted/30 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Study work</p>{generatedMaterials.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{generatedMaterials.map((file) => <span key={file.id} className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold">{file.title}</span>)}</div>}<div className="mt-2"><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm"><FileStack className="size-4" /> Create study resources <ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuLabel>Choose a format</DropdownMenuLabel><DropdownMenuItem onClick={() => onCreateStudyWork('flashcards')}><Brain className="size-4" /> Flashcards</DropdownMenuItem><DropdownMenuItem onClick={() => onCreateStudyWork('study-guide')}><BookOpen className="size-4" /> Study guide</DropdownMenuItem><DropdownMenuItem onClick={() => onCreateStudyWork('study-outline')}><Sparkles className="size-4" /> Study outline</DropdownMenuItem><DropdownMenuItem onClick={() => onCreateStudyWork('revised-notes')}><NotebookText className="size-4" /> Revised notes</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
    {!hasTimestamps && <div className="rounded-xl border border-dashed border-amber-500/45 bg-amber-500/8 p-3 text-sm font-semibold text-muted-foreground">This transcript has no source timestamps. It stays readable, but it cannot create time-linked professor remarks.</div>}
    <div className="rounded-xl border border-border bg-muted/20 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-extrabold">Transcript</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{chunks.length} {chunks.length === 1 ? 'passage' : 'passages'} · retained exactly as pasted</p></div><Button size="sm" variant="outline" onClick={() => setTranscriptOpen((open) => !open)}>{transcriptOpen ? 'Hide transcript' : 'Show transcript'}</Button></div></div>
    {transcriptOpen && <><ResizablePanelGroup orientation="horizontal" className="hidden min-h-72 rounded-2xl border border-border lg:flex"><ResizablePanel defaultSize={28} minSize={20} className="overflow-y-auto p-3"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Timestamp rail</p><div className="mt-3 space-y-2">{chunks.map((chunk) => <p key={chunk.id} className="text-xs font-bold text-muted-foreground">{chunk.sourcePosition?.label ?? 'No time'} · {chunk.content.slice(0, 54)}{chunk.content.length > 54 ? '…' : ''}</p>)}</div></ResizablePanel><ResizableHandle withHandle /><ResizablePanel defaultSize={44} minSize={30} className="overflow-y-auto p-4"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Transcript evidence</p><div className="mt-3 space-y-4">{chunks.map((chunk) => <article key={chunk.id}><p className="text-xs font-extrabold tracking-wide text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'}</p><p className="mt-1 text-sm font-semibold leading-relaxed">{chunk.content}</p></article>)}</div></ResizablePanel><ResizableHandle withHandle /><ResizablePanel defaultSize={28} minSize={20} className="overflow-y-auto p-3"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Pending Guide items</p><div className="mt-3 space-y-2">{findings.map((finding) => <div key={finding.id} className="rounded-xl border border-border bg-muted/55 p-3"><p className="text-[11px] font-extrabold text-primary">{finding.timestamp} · {finding.label}</p><p className="mt-1 text-sm font-bold">“{finding.quote}”</p><p className="mt-1 text-xs text-muted-foreground">{finding.detail}</p></div>)}{!findings.length && <p className="text-sm font-semibold text-muted-foreground">Nothing has been proposed yet.</p>}</div>{pendingCount > 0 && <Button size="sm" variant="outline" className="mt-3" onClick={onOpenNotes}>Review in Guide <Link2 className="size-4" /></Button>}</ResizablePanel></ResizablePanelGroup>
    <div className="space-y-3 lg:hidden">{chunks.map((chunk) => <div key={chunk.id} className="rounded-xl border border-border bg-muted/35 p-3"><p className="text-xs font-extrabold text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'}</p><p className="mt-1 text-sm font-semibold">{chunk.content}</p></div>)}</div></>}
  </div>
}

function IndexView({ query, onQuery, findings, chunks, onOpenNotes }: { query: string; onQuery: (value: string) => void; findings: ClassCenterData['lectureFindings']; chunks: SourceChunk[]; onOpenNotes: () => void }) {
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]"><article><label className="text-sm font-extrabold">Search lecture evidence<Input className="mt-2" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Try a phrase from the lecture" /></label><div className="mt-4 space-y-3">{query.trim() ? <>{chunks.map((chunk) => <section key={chunk.id} className="border-t border-border pt-3"><p className="text-xs font-extrabold text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'} · Transcript</p><blockquote className="mt-1 font-display text-lg font-extrabold">“{chunk.content}”</blockquote></section>)}{findings.map((finding) => <section key={finding.id} className="border-t border-border pt-3"><p className="text-xs font-extrabold text-primary">{finding.timestamp} · {finding.label}</p><blockquote className="mt-1 font-display text-lg font-extrabold">“{finding.quote}”</blockquote><p className="mt-1 text-sm text-muted-foreground">{finding.detail}</p></section>)}{!chunks.length && !findings.length && <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm font-semibold text-muted-foreground">No matching lecture moment.</p>}</> : <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm font-semibold text-muted-foreground">Search returns exact student-supplied quotes and timestamps only.</p>}</div></article><aside className="rounded-2xl border border-border bg-muted/30 p-4"><p className="font-display text-base font-extrabold">Material connection</p><p className="mt-2 text-sm font-semibold text-muted-foreground">Connections remain pending until you confirm them. Class-context proposals are reviewed separately in Guide.</p><Button className="mt-4" size="sm" variant="outline" onClick={onOpenNotes}>Open Guide</Button></aside></div>
}
