import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ClipboardPaste, FileAudio, Link2, Mic, Play, Search, Square } from 'lucide-react'
import type { ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'
import { analyzeLectureTranscript } from '@/lib/academics/lectureAnalysis'
import { searchLectureFindings, searchLectureSourceChunks } from '@/lib/academics/lectureEvidence'
import { retainLocalBlob, readLocalBlob } from '@/lib/localBlobStore'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

type View = 'start' | 'review' | 'index' | 'unavailable'

export function LectureCapturePanel({ courseId, data, onOpenNotes }: { courseId: string; data: ClassCenterData; onOpenNotes: () => void }) {
  const toast = useToast()
  const uploadRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioPartsRef = useRef<BlobPart[]>([])
  const [view, setView] = useState<View>('start')
  const [title, setTitle] = useState('')
  const [pasted, setPasted] = useState('')
  const [recording, setRecording] = useState(false)
  const [activeLectureId, setActiveLectureId] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const lectures = data.lectures.filter((lecture) => lecture.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt)
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId) ?? lectures[0]
  const transcriptChunks = activeLecture?.transcriptFileId
    ? data.sourceChunks.filter((chunk) => chunk.fileId === activeLecture.transcriptFileId).sort((a, b) => a.order - b.order)
    : []
  const findings = activeLecture
    ? data.lectureFindings.filter((finding) => finding.lectureId === activeLecture.id).sort((a, b) => a.order - b.order)
    : []
  const pendingNotes = activeLecture
    ? data.lectureNoteProposals.filter((proposal) => proposal.lectureId === activeLecture.id && proposal.status === 'pending')
    : []
  const preview = useMemo(() => (pasted.trim() ? parseTranscript(pasted) : undefined), [pasted])
  const results = useMemo(() => searchLectureFindings(query, findings, transcriptChunks), [findings, query, transcriptChunks])
  const matchingChunks = useMemo(() => searchLectureSourceChunks(query, transcriptChunks), [query, transcriptChunks])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function addTranscript() {
    const built = buildTranscriptImport({
      courseId, title, text: pasted,
      order: data.files.filter((file) => file.courseId === courseId).length,
    })
    if (!built) {
      toast({ title: 'Nothing to import', description: 'Paste the transcript text first.' })
      return
    }
    const now = Date.now()
    const lectureId = uid()
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter
      center.files.push(built.file)
      center.sourceChunks.push(...built.chunks)
      center.lectures.unshift({
        id: lectureId, courseId, title: built.file.title, inputPath: 'pasted', transcriptFileId: built.file.id,
        processingState: 'ready', createdAt: now, processedAt: now, updatedAt: now,
        order: center.lectures.filter((lecture) => lecture.courseId === courseId).length,
      })
    })
    setActiveLectureId(lectureId)
    setTitle('')
    setPasted('')
    setView('review')
    toast({ title: 'Transcript ready', description: built.hasTimestamps ? 'Review source-linked moments or analyze class remarks.' : 'Saved without timestamps. It remains readable, but cannot make time-linked remarks.' })
  }

  async function retainAudio(blob: Blob, inputPath: 'recorded' | 'uploaded', label?: string) {
    const now = Date.now()
    const id = uid()
    const blobRef = `lecture-audio:${id}`
    await retainLocalBlob(blobRef, blob)
    useStore.getState().update((draft) => {
      const lectures = draft.academics.classCenter.lectures
      lectures.unshift({
        id, courseId, title: title.trim() || label || 'Recorded lecture', inputPath, audioBlobRef: blobRef,
        processingState: 'unavailable',
        processingError: 'On-device transcription is unavailable here. Paste a timestamped transcript to create reviewable lecture evidence.',
        createdAt: now, updatedAt: now, order: lectures.filter((lecture) => lecture.courseId === courseId).length,
      })
    })
    setActiveLectureId(id)
    setTitle('')
    setView('unavailable')
    toast({ title: inputPath === 'recorded' ? 'Recording saved locally' : 'Audio saved locally', description: 'Premed OS did not upload the audio. Paste a transcript when you are ready.' })
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setView('unavailable')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioPartsRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => { if (event.data.size) audioPartsRef.current.push(event.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const blob = new Blob(audioPartsRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size) void retainAudio(blob, 'recorded')
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setView('unavailable')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
  }

  async function onAudioUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await retainAudio(file, 'uploaded', file.name.replace(/\.[^.]+$/, ''))
  }

  async function analyze() {
    if (!activeLecture || !transcriptChunks.length) return
    setAnalyzing(true)
    const outcome = await analyzeLectureTranscript({ courseId, chunks: transcriptChunks })
    setAnalyzing(false)
    if (!outcome.ok) {
      toast({ title: 'No lecture remarks were saved', description: outcome.message, tone: 'error' })
      return
    }
    const now = Date.now()
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter
      outcome.findings.forEach((finding, index) => {
        const findingId = uid()
        center.lectureFindings.push({ ...finding, id: findingId, courseId, lectureId: activeLecture.id, createdAt: now, updatedAt: now, order: center.lectureFindings.filter((item) => item.lectureId === activeLecture.id).length + index })
        center.lectureNoteProposals.push({ id: uid(), courseId, lectureId: activeLecture.id, findingId, status: 'pending', createdAt: now, updatedAt: now, order: center.lectureNoteProposals.filter((item) => item.lectureId === activeLecture.id).length + index })
      })
    })
    toast({ title: outcome.findings.length ? 'Remarks ready for review' : 'No class-specific remarks found', description: outcome.findings.length ? 'They are pending in Notes until you add or dismiss them.' : 'No weak guesses were created.' })
    if (outcome.findings.length) setView('review')
  }

  async function playAudio() {
    if (!activeLecture?.audioBlobRef) return
    const blob = await readLocalBlob(activeLecture.audioBlobRef)
    if (!blob) {
      toast({ title: 'Audio is not on this device', description: 'The lecture record remains, but its local audio file is unavailable.', tone: 'error' })
      return
    }
    const audio = new Audio(URL.createObjectURL(blob))
    audio.play().catch(() => toast({ title: 'Playback could not start', description: 'Use the local audio file directly.', tone: 'error' }))
  }

  const openLecture = (lecture: LectureRecord) => {
    setActiveLectureId(lecture.id)
    setView(lecture.processingState === 'ready' ? 'review' : 'unavailable')
  }

  return (
    <Card className="overflow-hidden border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 border-b border-border/70">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture capture</p>
          <CardTitle className="mt-1">Professor moments, with the source attached</CardTitle>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Record locally, upload audio, or paste a transcript. Nothing becomes a class note until you choose it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['start', 'review', 'index'] as View[]).map((candidate) => <Button key={candidate} size="sm" variant={view === candidate ? 'default' : 'outline'} onClick={() => setView(candidate)} disabled={candidate !== 'start' && !activeLecture}>
            {candidate === 'start' ? 'Capture' : candidate === 'review' ? 'Review' : 'Index'}
          </Button>)}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {view === 'start' && <CaptureStart
          title={title} onTitle={setTitle} pasted={pasted} onPasted={setPasted} preview={preview}
          recording={recording} onStart={() => void startRecording()} onStop={stopRecording}
          onPaste={addTranscript} onUpload={() => uploadRef.current?.click()} lectures={lectures} onOpen={openLecture}
        />}
        {view === 'review' && activeLecture && <ReviewView
          lecture={activeLecture} chunks={transcriptChunks} findings={findings} pendingCount={pendingNotes.length}
          analyzing={analyzing} onAnalyze={() => void analyze()} onOpenNotes={onOpenNotes} onPlay={() => void playAudio()} onIndex={() => setView('index')}
        />}
        {view === 'index' && activeLecture && <IndexView query={query} onQuery={setQuery} findings={results} chunks={matchingChunks} onOpenNotes={onOpenNotes} />}
        {view === 'unavailable' && <Unavailable lecture={activeLecture} onCapture={() => setView('start')} onPlay={() => void playAudio()} />}
        {!activeLecture && view !== 'start' && <div className="rounded-xl border border-dashed border-border bg-muted/35 p-4 text-sm font-semibold text-muted-foreground">Capture or paste a transcript first. Premed OS never invents a lecture moment.</div>}
      </CardContent>
      <input ref={uploadRef} type="file" accept="audio/*" className="sr-only" onChange={(event) => void onAudioUpload(event)} />
    </Card>
  )
}

function CaptureStart({ title, onTitle, pasted, onPasted, preview, recording, onStart, onStop, onPaste, onUpload, lectures, onOpen }: {
  title: string; onTitle: (value: string) => void; pasted: string; onPasted: (value: string) => void; preview: ReturnType<typeof parseTranscript> | undefined; recording: boolean; onStart: () => void; onStop: () => void; onPaste: () => void; onUpload: () => void; lectures: LectureRecord[]; onOpen: (lecture: LectureRecord) => void
}) {
  return <div className="space-y-4">
    <div className="grid gap-3 md:grid-cols-3">
      <button type="button" onClick={recording ? onStop : onStart} className="rounded-2xl border border-border bg-muted p-4 text-left transition-colors hover:bg-muted/75">
        {recording ? <Square className="size-5 text-destructive" /> : <Mic className="size-5 text-primary" />}<p className="mt-3 font-display text-lg font-extrabold">{recording ? 'Stop recording' : 'Record locally'}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">The browser asks only after you press this. Audio stays on this device.</p>
      </button>
      <button type="button" onClick={onUpload} className="rounded-2xl border border-border bg-muted p-4 text-left transition-colors hover:bg-muted/75"><FileAudio className="size-5 text-primary" /><p className="mt-3 font-display text-lg font-extrabold">Upload audio</p><p className="mt-1 text-sm font-semibold text-muted-foreground">Keep a lecture audio file local, then add its transcript when ready.</p></button>
      <a href="#lecture-transcript" className="rounded-2xl border border-border bg-muted p-4 text-left transition-colors hover:bg-muted/75"><ClipboardPaste className="size-5 text-primary" /><p className="mt-3 font-display text-lg font-extrabold">Paste transcript</p><p className="mt-1 text-sm font-semibold text-muted-foreground">GoodNotes, Zoom, or any student-owned transcript works.</p></a>
    </div>
    <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs font-semibold text-muted-foreground">Record only where your course permits it. This reminder is shown once per course in the capture workflow; uploaded instructor-posted recordings remain an alternative.</p>
    <section id="lecture-transcript" className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="font-display text-base font-extrabold">Paste a transcript</p><p className="mt-1 text-sm text-muted-foreground">A timestamp has to be present in the source text. Premed OS does not estimate one.</p>
      <Input className="mt-3" value={title} onChange={(event) => onTitle(event.target.value)} placeholder="Lecture 18 — enzyme mechanisms" />
      <Textarea className="mt-2 min-h-40" value={pasted} onChange={(event) => onPasted(event.target.value)} placeholder={'22:14 The distinction here is…\n31:08 If you only take one thing from this unit…'} />
      {preview && <p className="mt-2 text-xs font-semibold text-muted-foreground">{preview.segments.length} source segment{preview.segments.length === 1 ? '' : 's'} detected{preview.hasTimestamps ? ' · timestamps retained' : ' · no timestamps found'}.</p>}
      <Button className="mt-3" size="sm" disabled={!preview?.segments.length} onClick={onPaste}><ClipboardPaste className="size-4" /> Add transcript</Button>
    </section>
    {!!lectures.length && <section><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Your lectures</p><div className="grid gap-2 md:grid-cols-2">{lectures.map((lecture) => <button key={lecture.id} type="button" onClick={() => onOpen(lecture)} className="rounded-xl border border-border bg-muted/35 p-3 text-left hover:bg-muted/70"><p className="font-extrabold">{lecture.title}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{lecture.inputPath} · {lecture.processingState === 'ready' ? 'transcript ready' : 'audio retained locally'}</p></button>)}</div></section>}
  </div>
}

function ReviewView({ lecture, chunks, findings, pendingCount, analyzing, onAnalyze, onOpenNotes, onPlay, onIndex }: { lecture: LectureRecord; chunks: SourceChunk[]; findings: ClassCenterData['lectureFindings']; pendingCount: number; analyzing: boolean; onAnalyze: () => void; onOpenNotes: () => void; onPlay: () => void; onIndex: () => void }) {
  const hasTimestamps = chunks.some((chunk) => chunk.sourcePosition?.label)
  return <div className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-lg font-extrabold">{lecture.title}</p><p className="mt-1 text-sm text-muted-foreground">Read the source first. Findings are proposals, not an exam forecast.</p></div><div className="flex flex-wrap gap-2">{lecture.audioBlobRef && <Button size="sm" variant="outline" onClick={onPlay}><Play className="size-4" /> Play local audio</Button>}<Button size="sm" variant="outline" onClick={onIndex}><Search className="size-4" /> Search index</Button>{hasTimestamps && <Button size="sm" onClick={onAnalyze} disabled={analyzing}>{analyzing ? 'Analyzing complete transcript…' : 'Find class remarks'}</Button>}</div></div>
    {!hasTimestamps && <div className="rounded-xl border border-dashed border-amber-500/45 bg-amber-500/8 p-3 text-sm font-semibold text-muted-foreground">This transcript has no source timestamps. It stays readable, but it cannot create time-linked professor remarks.</div>}
    <ResizablePanelGroup orientation="horizontal" className="hidden min-h-72 rounded-2xl border border-border lg:flex"><ResizablePanel defaultSize={28} minSize={20} className="overflow-y-auto p-3"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Timestamp rail</p><div className="mt-3 space-y-2">{chunks.map((chunk) => <p key={chunk.id} className="text-xs font-bold text-muted-foreground">{chunk.sourcePosition?.label ?? 'No time'} · {chunk.content.slice(0, 54)}{chunk.content.length > 54 ? '…' : ''}</p>)}</div></ResizablePanel><ResizableHandle withHandle /><ResizablePanel defaultSize={44} minSize={30} className="overflow-y-auto p-4"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Transcript evidence</p><div className="mt-3 space-y-4">{chunks.map((chunk) => <article key={chunk.id}><p className="text-xs font-extrabold tracking-wide text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'}</p><p className="mt-1 text-sm font-semibold leading-relaxed">{chunk.content}</p></article>)}</div></ResizablePanel><ResizableHandle withHandle /><ResizablePanel defaultSize={28} minSize={20} className="overflow-y-auto p-3"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Pending class notes</p><div className="mt-3 space-y-2">{findings.map((finding) => <div key={finding.id} className="rounded-xl border border-border bg-muted/55 p-3"><p className="text-[11px] font-extrabold text-primary">{finding.timestamp} · {finding.label}</p><p className="mt-1 text-sm font-bold">“{finding.quote}”</p><p className="mt-1 text-xs text-muted-foreground">{finding.detail}</p></div>)}{!findings.length && <p className="text-sm font-semibold text-muted-foreground">Nothing has been proposed yet.</p>}</div>{pendingCount > 0 && <Button size="sm" variant="outline" className="mt-3" onClick={onOpenNotes}>Review in Notes <Link2 className="size-4" /></Button>}</ResizablePanel></ResizablePanelGroup>
    <div className="space-y-3 lg:hidden">{chunks.map((chunk) => <div key={chunk.id} className="rounded-xl border border-border bg-muted/35 p-3"><p className="text-xs font-extrabold text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'}</p><p className="mt-1 text-sm font-semibold">{chunk.content}</p></div>)}</div>
  </div>
}

function IndexView({ query, onQuery, findings, chunks, onOpenNotes }: { query: string; onQuery: (value: string) => void; findings: ClassCenterData['lectureFindings']; chunks: SourceChunk[]; onOpenNotes: () => void }) {
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]"><article><label className="text-sm font-extrabold">Search lecture evidence<Input className="mt-2" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Try a phrase from the lecture" /></label><div className="mt-4 space-y-3">{query.trim() ? <>{chunks.map((chunk) => <section key={chunk.id} className="border-t border-border pt-3"><p className="text-xs font-extrabold text-primary">{chunk.sourcePosition?.label ?? 'No timestamp'} · Transcript</p><blockquote className="mt-1 font-display text-lg font-extrabold">“{chunk.content}”</blockquote></section>)}{findings.map((finding) => <section key={finding.id} className="border-t border-border pt-3"><p className="text-xs font-extrabold text-primary">{finding.timestamp} · {finding.label}</p><blockquote className="mt-1 font-display text-lg font-extrabold">“{finding.quote}”</blockquote><p className="mt-1 text-sm text-muted-foreground">{finding.detail}</p></section>)}{!chunks.length && !findings.length && <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm font-semibold text-muted-foreground">No matching lecture moment.</p>}</> : <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm font-semibold text-muted-foreground">Search returns exact student-supplied quotes and timestamps only.</p>}</div></article><aside className="rounded-2xl border border-border bg-muted/30 p-4"><p className="font-display text-base font-extrabold">Material connection</p><p className="mt-2 text-sm font-semibold text-muted-foreground">Connections remain pending until you confirm them. Notes proposals are reviewed separately in Notes.</p><Button className="mt-4" size="sm" variant="outline" onClick={onOpenNotes}>Open Notes</Button></aside></div>
}

function Unavailable({ lecture, onCapture, onPlay }: { lecture?: LectureRecord; onCapture: () => void; onPlay: () => void }) {
  return <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 text-amber-500" /><div><p className="font-display text-lg font-extrabold">Capture needs another input path</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{lecture?.processingError ?? 'This browser cannot record lecture audio. Upload audio or paste a transcript instead.'}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={onCapture}>Paste a transcript</Button>{lecture?.audioBlobRef && <Button size="sm" variant="outline" onClick={onPlay}><Play className="size-4" /> Play local audio</Button>}</div></div></div></div>
}
