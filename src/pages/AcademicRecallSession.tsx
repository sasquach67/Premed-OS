import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Brain, FileText, ImagePlus,
  Mic, RotateCcw, Settings2, SkipForward, Sparkles, Square, X,
} from 'lucide-react'
import type { ReviewGrade } from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { homeBanner } from '@/lib/themeAssets'
import { reviewTopic } from '@/lib/academics/fsrs'
import {
  REVIEW_RATINGS, buildRecallQueue, buildScopeItems,
  calibrationFor, confidenceForEvent, sourceForScope,
  type GapDisposition, type RecallConfidence, type RecallScopeItem,
} from '@/lib/academics/activeRecall'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  studyTools, type GapCheckItem, type GapCheckResult,
} from '@/lib/intelligence/studyTools'
import { cn } from '@/lib/utils'
import { AnimatedFileUpload } from '@/components/motion'
import { FocusModeLayout } from '@/components/common/FocusModeLayout'
import { MascotNote } from '@/components/common/MascotNote'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SessionPhase = 'start' | 'active' | 'report' | 'summary'

interface SessionResult {
  topicId: string
  title: string
  confidence: RecallConfidence
  grade: ReviewGrade
  skipped?: boolean
}

const CONFIDENCE_OPTIONS: Array<{ value: RecallConfidence; label: string }> = [
  { value: 'no-idea', label: 'No idea' },
  { value: 'shaky', label: 'Shaky' },
  { value: 'pretty-sure', label: 'Pretty sure' },
  { value: 'know-it-cold', label: 'Know it cold' },
]

const GRADE_OPTIONS: Array<{ grade: ReviewGrade; interval: string; key: string }> = [
  { grade: 'again', interval: '<10 min', key: '1' },
  { grade: 'hard', interval: '2d', key: '2' },
  { grade: 'good', interval: '5d', key: '3' },
  { grade: 'easy', interval: '12d', key: '4' },
]

const DISPOSITION_OPTIONS: Array<{ value: GapDisposition; label: string }> = [
  { value: 'had', label: 'Had it' },
  { value: 'missed', label: 'Missed' },
  { value: 'wrong', label: 'Got wrong' },
]

export function AcademicRecallSession() {
  const { courseId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const visualTheme = useStore((state) => state.settings.visualTheme)
  const course = useStore((state) => state.courses.find((item) => item.id === courseId))
  const workspace = useStore((state) => state.academics.classCenter.workspaces.find((item) => item.courseId === courseId))
  const data = useStore((state) => state.academics.classCenter)
  const update = useStore((state) => state.update)
  const requestedTopicId = params.get('topicId') ?? undefined
  const queue = useMemo(
    () => buildRecallQueue(data.topics.filter((topic) => topic.courseId === courseId), Date.now(), requestedTopicId),
    [courseId, data.topics, requestedTopicId],
  )

  const [phase, setPhase] = useState<SessionPhase>('start')
  const [index, setIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [confidence, setConfidence] = useState<RecallConfidence | ''>('')
  const [dispositions, setDispositions] = useState<Record<string, GapDisposition>>({})
  const [results, setResults] = useState<SessionResult[]>([])
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([])
  const [audio, setAudio] = useState<{ url: string; durationLabel: string } | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingError, setRecordingError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [sourceItem, setSourceItem] = useState<RecallScopeItem | null>(null)
  const [gapResult, setGapResult] = useState<GapCheckResult | null>(null)
  const [gapError, setGapError] = useState('')
  const [checkingGaps, setCheckingGaps] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartedRef = useRef(0)
  const current = queue[index]
  const scope = useMemo(
    () => current ? buildScopeItems(current, data.keyPoints, data.sourceChunks, data.files) : [],
    [current, data.files, data.keyPoints, data.sourceChunks],
  )
  const source = sourceItem ? sourceForScope(sourceItem, data) : null
  const apiGapAvailable = isSupabaseConfigured
  const reading = phase === 'active' || phase === 'report'
  const exitTo = courseId ? `/academics/classes/${courseId}` : '/academics'

  useEffect(() => {
    if (phase !== 'active' && phase !== 'report') return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target?.matches('textarea,input,[contenteditable="true"]')
      if (typing) return
      if (event.key.toLowerCase() === 'n' && (phase === 'active' || phase === 'report')) {
        event.preventDefault()
        skipTopic()
        return
      }
      if (event.code === 'Space' && phase === 'active' && confidence) {
        event.preventDefault()
        setPhase('report')
        return
      }
      if (phase === 'report') {
        const option = GRADE_OPTIONS.find((item) => item.key === event.key)
        if (option && scope.every((item) => dispositions[item.id])) {
          event.preventDefault()
          gradeTopic(option.grade)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!course || !workspace) {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
        <div><Brain className="mx-auto size-8 text-muted-foreground" /><h1 className="mt-3 font-display text-3xl font-extrabold">Review session unavailable</h1><p className="mt-2 text-muted-foreground">This current-term class workspace could not be found.</p><Button asChild className="mt-5"><Link to="/academics">Back to Academics</Link></Button></div>
      </main>
    )
  }

  function resetComposer() {
    setResponse('')
    setConfidence('')
    setDispositions({})
    setImages((currentImages) => {
      currentImages.forEach((image) => URL.revokeObjectURL(image.url))
      return []
    })
    setAudio((currentAudio) => {
      if (currentAudio?.url) URL.revokeObjectURL(currentAudio.url)
      return null
    })
    setRecordingError('')
    setGapResult(null)
    setGapError('')
    setCheckingGaps(false)
  }

  async function runGapCheck() {
    if (!current || checkingGaps) return
    setCheckingGaps(true)
    setGapError('')
    const result = await studyTools.gapCheck({
      action: 'gap-check',
      courseId,
      topicId: current.id,
      response,
      sources: data.sourceChunks
        .filter((chunk) => chunk.courseId === courseId && chunk.topicId === current.id)
        .slice(0, 24)
        .map((chunk) => ({
          chunkId: chunk.id,
          fileId: chunk.fileId,
          content: chunk.content,
          start: 0,
          end: chunk.content.length,
        })),
    })
    setCheckingGaps(false)
    if (!result.ok) {
      setGapResult(null)
      setGapError(result.message)
      return
    }
    setGapResult(result.data)
  }

  function openGapCitation(item: GapCheckItem) {
    if (item.citation.kind !== 'material') return
    setSourceItem({
      id: `ai-${item.citation.chunkId}-${item.citation.start}`,
      label: item.text,
      provenance: item.citation,
    })
  }

  function advance(result?: SessionResult) {
    if (result) setResults((currentResults) => [...currentResults, result])
    stopRecording()
    resetComposer()
    if (index >= queue.length - 1) {
      setPhase('summary')
      return
    }
    setIndex((value) => value + 1)
    setPhase('active')
  }

  function skipTopic() {
    if (!current) return
    advance({ topicId: current.id, title: current.title, confidence: confidence || 'no-idea', grade: 'again', skipped: true })
  }

  function gradeTopic(grade: ReviewGrade) {
    if (!current || !confidence || !scope.every((item) => dispositions[item.id])) return
    const now = Date.now()
    update((draft) => {
      const center = draft.academics.classCenter
      const topic = center.topics.find((item) => item.id === current.id)
      if (!topic) return
      topic.fsrs = reviewTopic(topic.fsrs, REVIEW_RATINGS[grade], now)
      topic.updatedAt = now
      center.reviewEvents.push({
        id: uid(),
        topicId: topic.id,
        timestamp: now,
        grade,
        confidence: confidenceForEvent(confidence),
        order: center.reviewEvents.length,
      })
      for (const item of scope) {
        if (!item.keyPointId) continue
        const keyPoint = center.keyPoints.find((point) => point.id === item.keyPointId)
        if (keyPoint) {
          keyPoint.timesSurfaced += 1
          keyPoint.lastSurfaced = now
          keyPoint.updatedAt = now
        }
      }
    })
    advance({ topicId: current.id, title: current.title, confidence, grade })
  }

  async function toggleRecording() {
    if (recording) {
      stopRecording()
      return
    }
    setRecordingError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Audio capture is not supported here. Typed and image responses still work.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recordingStartedRef.current = Date.now()
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const seconds = Math.max(1, Math.round((Date.now() - recordingStartedRef.current) / 1000))
        setAudio((previous) => {
          if (previous?.url) URL.revokeObjectURL(previous.url)
          return { url, durationLabel: `${seconds}s audio` }
        })
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setRecordingError('Microphone permission was not granted. Typed and image responses still work.')
    }
  }

  function attachImages(files: File[]) {
    setImages((currentImages) => [
      ...currentImages,
      ...files.filter((file) => file.type.startsWith('image/')).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    ])
  }

  const completed = results.filter((result) => !result.skipped)
  const overconfident = completed.filter((result) => calibrationFor(result.confidence, result.grade).overconfident)
  const underconfident = completed.filter((result) => calibrationFor(result.confidence, result.grade).underconfident)

  return (
    <TooltipProvider>
    <FocusModeLayout
      exitTo={exitTo}
      exitLabel={`Back to ${course.code}`}
      className="bg-slate-950 text-white"
      background={(
        <>
          <img src={homeBanner(visualTheme)} alt="" className="absolute inset-0 size-full object-cover" />
          <div className={cn('absolute inset-0 transition-colors duration-300 motion-reduce:transition-none', reading ? 'bg-slate-950/92' : 'bg-slate-950/55')} />
          <div className={cn('absolute inset-0 bg-gradient-to-b', reading ? 'from-slate-950/80 via-slate-950/90 to-slate-950/96' : 'from-slate-950/20 via-slate-950/38 to-slate-950/78')} />
        </>
      )}
      headerEnd={(
        <div className="flex items-center gap-3">
          <Badge className="border-white/18 bg-slate-950/52 text-white backdrop-blur">{course.code} · Active recall</Badge>
          {reading && <SessionSpine current={index} total={queue.length} results={results} />}
          {reading && <span className="text-sm font-extrabold tabular-nums text-white/72">{formatTime(elapsed)}</span>}
        </div>
      )}
    >
      {phase === 'start' && (
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10">
          <p className="font-display text-[clamp(3.4rem,8vw,6rem)] font-extrabold leading-none">{queue.length} topics up</p>
          <p className="mt-3 text-lg font-bold text-white/76">About <strong className="text-white">{Math.max(5, queue.length * 4)} min</strong> · <strong className="text-white">{queue.filter((topic) => topic.status === 'weak').length}</strong> weak · <strong className="text-white">{queue.filter((topic) => topic.fsrs.reps === 0).length}</strong> never reviewed</p>
          <div className="mt-8 max-h-[42vh] overflow-y-auto border-y border-white/14">
            {queue.slice(0, 9).map((topic) => (
              <div key={topic.id} className="flex items-center gap-3 border-b border-white/12 px-1 py-3 last:border-b-0">
                <span className="min-w-0 flex-1 truncate font-extrabold">{topic.title}</span>
                {topic.status === 'weak' && <Badge variant="danger">Weak</Badge>}
                {topic.fsrs.reps === 0 && <Badge className="border-primary/30 bg-primary/20 text-sky-100">Never reviewed</Badge>}
                <span className="text-xs font-bold text-white/52">{topic.unit || 'Unit not mapped'}</span>
              </div>
            ))}
          </div>
          {queue.length > 9 && <p className="mt-2 text-sm font-bold text-white/62">+ {queue.length - 9} more due</p>}
          {!queue.length && <p className="mt-8 rounded-2xl border border-dashed border-white/25 p-6 text-center font-bold text-white/72">No topics are available for this class yet.</p>}
          <div className="mt-8 flex max-w-3xl gap-3">
            <Button size="lg" className="h-14 flex-1 rounded-2xl text-base" disabled={!queue.length} onClick={() => setPhase('active')}><PlayIcon /> Start active recall</Button>
            <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" className="size-14 border-white/20 bg-slate-950/45 text-white"><Mic className="size-5" /></Button></TooltipTrigger><TooltipContent>Mic is the default response input.</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" className="size-14 border-white/20 bg-slate-950/45 text-white"><Settings2 className="size-5" /></Button></TooltipTrigger><TooltipContent>Speak default · interleave on · weak first on.</TooltipContent></Tooltip>
          </div>
          <p className="mt-3 text-sm font-bold text-white/58">Speak <strong className="text-white">default</strong> · Interleave <strong className="text-white">on</strong> · Weak first <strong className="text-white">on</strong></p>
          <MascotNote variant="banner" className="mt-7 max-w-2xl">
            Say it out loud before you look. The gap between feeling sure and actually recalling is the whole point.
          </MascotNote>
        </section>
      )}

      {phase === 'active' && current && (
        <section className="mx-auto grid w-full max-w-5xl flex-1 place-items-center py-8">
          <div className="w-full rounded-3xl border border-white/14 bg-slate-950/82 p-5 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Topic {index + 1} of {queue.length}</p><h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{current.title}</h1></div>
              <Button variant="ghost" className="text-white/64 hover:bg-white/10 hover:text-white" onClick={skipTopic}><SkipForward className="size-4" /> Skip <kbd className="ml-1">N</kbd></Button>
            </div>
            <div className="mt-5">
              <p className="text-sm font-extrabold text-white/70">Cover this scope — these chips are the grading checklist:</p>
              <div className="mt-2 flex flex-wrap gap-2">{scope.map((item) => <Badge key={item.id} className="border-primary/28 bg-primary/15 text-sky-100">{item.label}</Badge>)}</div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div>
                <Textarea value={response} onChange={(event) => setResponse(event.target.value)} className="min-h-52 border-white/15 bg-white/7 text-base text-white placeholder:text-white/38 focus-visible:ring-primary" placeholder="Explain it from memory. Speak, type, draw—or combine all three." />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" variant={recording ? 'destructive' : 'outline'} className={cn(!recording && 'border-white/20 bg-white/7 text-white hover:bg-white/12')} onClick={toggleRecording}>
                    {recording ? <><Square className="size-4 fill-current" /> Stop recording</> : <><Mic className="size-4" /> {audio ? 'Record again' : 'Record response'}</>}
                  </Button>
                  {audio && <audio controls src={audio.url} className="h-9 max-w-64" aria-label={audio.durationLabel} />}
                  {images.map((image) => <span key={image.url} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2 py-1 text-xs font-bold"><ImagePlus className="size-3" /> {image.name}<button aria-label={`Remove ${image.name}`} onClick={() => setImages((currentImages) => currentImages.filter((item) => item.url !== image.url))}><X className="size-3" /></button></span>)}
                </div>
                {recordingError && <p className="mt-2 text-sm font-bold text-amber-200">{recordingError}</p>}
              </div>
              <AnimatedFileUpload
                accept="image/*"
                multiple
                onFiles={attachImages}
                label="Attach your page"
                description="Add a drawing or photo at any point."
                className="min-h-52 border-white/18 bg-white/7 text-white"
              />
            </div>
            <div className="mt-7 border-t border-white/12 pt-6">
              <p className="font-display text-xl font-extrabold">Before you reveal: how sure are you?</p>
              <ToggleGroup type="single" value={confidence} onValueChange={(value) => value && setConfidence(value as RecallConfidence)} variant="outline" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CONFIDENCE_OPTIONS.map((option) => <ToggleGroupItem key={option.value} value={option.value} className="h-12 border-white/18 bg-white/6 text-white data-[state=on]:border-primary data-[state=on]:bg-primary/20">{option.label}</ToggleGroupItem>)}
              </ToggleGroup>
              <Button size="lg" className="mt-4 w-full" disabled={!confidence} onClick={() => setPhase('report')}>Reveal gap report <ArrowRight className="size-4" /></Button>
              <p className="mt-2 text-center text-xs font-bold text-white/48">Space reveals after confidence · N skips</p>
            </div>
          </div>
        </section>
      )}

      {phase === 'report' && current && confidence && (
        <section className="mx-auto grid w-full max-w-5xl flex-1 place-items-center py-8">
          <div className="w-full rounded-3xl border border-white/14 bg-slate-950/88 p-5 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Gap report</p><h1 className="mt-1 font-display text-3xl font-extrabold">{current.title}</h1></div><Badge className="border-white/15 bg-white/8 text-white">{confidenceLabel(confidence)} before reveal</Badge></div>
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4">
              <p className="font-extrabold">{apiGapAvailable ? 'AI gap-check available' : 'Deterministic self-check — no API key required'}</p>
              <p className="mt-1 text-sm text-white/64">{apiGapAvailable ? 'Run the structured gap check against only the scope below.' : 'Classify each stated scope item yourself. FSRS scheduling, calibration, grading, and the summary remain fully available.'}</p>
              <Button size="sm" variant="outline" className="mt-3 border-white/18 bg-white/7 text-white" disabled={!apiGapAvailable || checkingGaps} onClick={runGapCheck}><Sparkles className="size-4" /> {checkingGaps ? 'Checking…' : 'Run AI gap-check'}</Button>
            </div>
            {gapError && <p role="status" className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/8 px-4 py-3 text-sm font-bold text-amber-100">{gapError} Nothing was saved.</p>}
            {gapResult && <StructuredGapReport result={gapResult} onOpenCitation={openGapCitation} />}
            <div className="mt-5 space-y-3">
              {scope.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-white/12 bg-white/5 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div><p className="font-extrabold">{item.label}</p><ProvenanceChip item={item} onOpen={() => item.provenance.kind === 'material' && setSourceItem(item)} /></div>
                  <div className="flex flex-wrap gap-2">{DISPOSITION_OPTIONS.map((option) => <Button key={option.value} size="sm" variant={dispositions[item.id] === option.value ? 'default' : 'outline'} className={cn(dispositions[item.id] !== option.value && 'border-white/18 bg-white/5 text-white')} onClick={() => setDispositions((currentValue) => ({ ...currentValue, [item.id]: option.value }))}>{option.label}</Button>)}</div>
                </div>
              ))}
            </div>
            {scope.every((item) => dispositions[item.id]) && (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {(['had', 'missed', 'wrong'] as const).map((kind) => {
                  const items = scope.filter((item) => dispositions[item.id] === kind)
                  return <div key={kind} className="rounded-2xl border border-white/12 bg-white/5 p-4"><p className={cn('font-display font-extrabold', kind === 'had' ? 'text-emerald-300' : kind === 'missed' ? 'text-amber-200' : 'text-rose-300')}>{kind === 'had' ? '✓ You had it' : kind === 'missed' ? 'What you missed' : 'What you got wrong'}</p><div className="mt-2 space-y-2">{items.map((item) => <p key={item.id} className="text-sm font-semibold text-white/78">{item.label}</p>)}{!items.length && <p className="text-sm text-white/42">None marked.</p>}</div></div>
                })}
              </div>
            )}
            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm font-bold text-white/72">
              You said <strong className="text-white">{confidenceLabel(confidence)}</strong>. Grade the recall honestly; the interval becomes the next Premed OS review.
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GRADE_OPTIONS.map((option) => <Button key={option.grade} variant="outline" disabled={!scope.every((item) => dispositions[item.id])} className="h-16 flex-col border-white/18 bg-white/5 text-white" onClick={() => gradeTopic(option.grade)}><span className="font-display text-lg font-extrabold">{titleCase(option.grade)}</span><span className="text-xs text-white/54">{option.interval} · {option.key}</span></Button>)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-bold text-white/45"><span>1–4 grades · N skips</span><button disabled={!apiGapAvailable || checkingGaps} onClick={runGapCheck} className="underline decoration-dotted disabled:no-underline disabled:opacity-50">Second opinion</button></div>
          </div>
        </section>
      )}

      {phase === 'summary' && (
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Session complete</p>
          <h1 className="mt-2 font-display text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold leading-none">
            {overconfident.length ? `Overconfident on ${overconfident.length} of ${completed.length}` : underconfident.length ? `You knew more than expected on ${underconfident.length}` : 'Confidence matched your recall'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg font-bold text-white/72">
            {overconfident.length
              ? `You predicted Pretty sure or Know it cold, then graded ${overconfident.map((item) => item.title).join(', ')} Again or Hard.`
              : `${completed.length} topics scheduled deterministically with FSRS · ${results.filter((result) => result.skipped).length} skipped · ${formatTime(elapsed)} elapsed.`}
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <SummaryMetric label="Reviewed" value={String(completed.length)} />
            <SummaryMetric label="Overconfident" value={String(overconfident.length)} />
            <SummaryMetric label="Underconfident" value={String(underconfident.length)} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" onClick={() => navigate(exitTo)}>Back to class</Button><Button size="lg" variant="outline" className="border-white/20 bg-slate-950/42 text-white" onClick={() => { setIndex(0); setResults([]); setElapsed(0); resetComposer(); setPhase('start') }}><RotateCcw className="size-4" /> Review again</Button></div>
          <MascotNote variant="banner" className="mt-7 max-w-2xl">
            Calibration is the win: notice where certainty and recall disagreed, then let the next scheduled rep correct it.
          </MascotNote>
        </section>
      )}

      <SourceDialog item={sourceItem} source={source} open={Boolean(sourceItem)} onOpenChange={(open) => !open && setSourceItem(null)} />
    </FocusModeLayout>
    </TooltipProvider>
  )
}

function SessionSpine({ current, total, results }: { current: number; total: number; results: SessionResult[] }) {
  return <div className="hidden min-w-48 items-center gap-1 md:flex" aria-label={`Topic ${current + 1} of ${total}`}>{Array.from({ length: total }, (_, position) => <span key={position} className={cn('h-1.5 min-w-3 flex-1 rounded-full', position < results.length ? 'bg-emerald-400' : position === current ? 'bg-primary' : 'bg-white/16')} />)}</div>
}

function ProvenanceChip({ item, onOpen }: { item: RecallScopeItem; onOpen: () => void }) {
  if (item.provenance.kind === 'general') return <Badge className="mt-2 border-amber-400/28 bg-amber-400/12 text-amber-100">general knowledge — not in your notes</Badge>
  return <button type="button" onClick={onOpen} className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-sky-100 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">from your materials ↗</button>
}

function SourceDialog({
  item, source, open, onOpenChange,
}: {
  item: RecallScopeItem | null
  source: ReturnType<typeof sourceForScope>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!item || item.provenance.kind !== 'material') return null
  const content = source?.chunk?.content ?? ''
  const localStart = Math.max(0, item.provenance.start)
  const localEnd = Math.min(content.length, Math.max(localStart + 1, item.provenance.end))
  const before = content.slice(0, localStart)
  const highlighted = content.slice(localStart, localEnd)
  const after = content.slice(localEnd)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> {source?.file?.title || 'Source passage'}</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-muted/30 p-5 text-sm font-semibold leading-7">
          {content ? <>{before}<mark className="rounded bg-primary/25 px-0.5 text-foreground">{highlighted}</mark>{after}</> : 'The cited passage is no longer available in local materials.'}
        </div>
        {source?.file?.url && <Button asChild variant="outline"><a href={source.file.url} target="_blank" rel="noreferrer">Open file ↗</a></Button>}
      </DialogContent>
    </Dialog>
  )
}

function StructuredGapReport({
  result,
  onOpenCitation,
}: {
  result: GapCheckResult
  onOpenCitation: (item: GapCheckItem) => void
}) {
  const groups = [
    { key: 'covered', label: 'Covered', items: result.covered, tone: 'text-emerald-300' },
    { key: 'missed', label: 'Missed', items: result.missed, tone: 'text-amber-200' },
    { key: 'wrong', label: 'Wrong', items: result.wrong, tone: 'text-rose-300' },
  ]
  return (
    <section className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 p-4" aria-label="AI gap-check result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-extrabold">Structured second opinion</p>
        <Badge className="border-primary/30 bg-primary/15 text-sky-100">Suggested grade: {titleCase(result.suggestedGrade)}</Badge>
      </div>
      <p className="mt-1 text-xs font-bold text-white/52">Advisory only — your manual classification and grade remain in control.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {groups.map((group) => (
          <div key={group.key} className="rounded-xl border border-white/12 bg-white/5 p-3">
            <p className={cn('font-extrabold', group.tone)}>{group.label}</p>
            <div className="mt-2 space-y-2">
              {group.items.map((item, index) => (
                <div key={`${group.key}-${index}`}>
                  <p className="text-sm font-semibold text-white/82">{item.text}</p>
                  {item.citation.kind === 'material'
                    ? <button type="button" onClick={() => onOpenCitation(item)} className="mt-1 text-xs font-bold text-sky-200 underline decoration-dotted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">from your materials ↗</button>
                    : <span className="mt-1 block text-xs font-bold text-amber-100">general knowledge — not in your notes</span>}
                </div>
              ))}
              {!group.items.length && <p className="text-sm text-white/38">None.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/16 bg-slate-950/48 p-5 shadow-xl backdrop-blur"><p className="text-xs font-extrabold uppercase tracking-wide text-white/52">{label}</p><p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{value}</p></div>
}

function PlayIcon() {
  return <span className="grid size-5 place-items-center rounded-full bg-white/20"><ArrowRight className="size-3.5" /></span>
}

function confidenceLabel(value: RecallConfidence) {
  return CONFIDENCE_OPTIONS.find((item) => item.value === value)?.label ?? value
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
