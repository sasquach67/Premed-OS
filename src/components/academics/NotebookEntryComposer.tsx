import { useEffect, useId, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, PenLine, Check, FilePlus2, FileText, Loader2, NotebookPen, Sparkles, X } from 'lucide-react'
import type { ClassCenterData, Course, LectureRecord, NotebookGoal } from '@/lib/types'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { inferNotebookGoal, initialNotebookInstructions } from '@/lib/academics/notebookGoal'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MaterialIntakeDialog } from './MaterialIntakeDialog'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateUnitMasteryOutline } from '@/lib/academics/generateUnitMasteryOutline'
import { selectGenerationSourceChunks } from '@/lib/academics/syncGenerationSources'
import { instructorSourceFileIds, personalNoteSourceFileIds, STUDY_MATERIAL_TYPES } from '@/lib/academics/lectureSourcePriority'
import { practiceQuestionChunkIds } from '@/lib/academics/materialGenerationIntake'
import { buildLectureBrief, fileCoverageLabel } from '@/lib/academics/lectureWorkspace'

// Shared across composer mounts: navigation does not cancel valid work, but a
// newer explicit build supersedes every pending response for that entry.
const activeBuildAttempts = new Map<string, symbol>()

const goalOptions: { value: NotebookGoal; label: string; output: string; description: string }[] = [
  { value: 'review', label: 'Review class material', output: 'Study Guide + Mastery Map', description: 'Connect ideas, work through examples, and build recall from your class material.' },
  { value: 'assessment', label: 'Prepare for an assessment', output: 'Assessment study guide', description: 'Organize the topics to know, connect the supporting materials, and identify gaps in preparation.' },
  { value: 'assignment', label: 'Work on an assignment', output: 'Assignment workspace', description: 'Work through the task using its instructions, your materials, and any draft or attempt.' },
]

const uploadGuidance: Record<NotebookGoal, { start: string; suggestions: string[] }> = {
  review: {
    start: 'Start with the lecture or reading you want to understand. You do not need every item below.',
    suggestions: ['Lecture transcript, slides, or your notes — what your instructor explained and emphasized.', 'Assigned reading or textbook excerpt — the pages that support this topic.', 'Guided-reading questions or learning objectives — what you are expected to explain or apply.'],
  },
  assessment: {
    start: 'Start with the review sheet or exam topic list, if your instructor provided one.',
    suggestions: ['Review sheet, exam scope, or learning objectives — what the assessment covers.', 'Relevant lecture notes, transcripts, slides, and assigned readings — evidence for those topics.', 'Practice questions, answer explanations, or past feedback — what you need to work through.'],
  },
  assignment: {
    start: 'Start with the assignment prompt or the exact problem you need help with.',
    suggestions: ['Instructions and grading rubric — what the task asks for and how it is assessed.', 'Required readings, data, or examples — the material you are supposed to use.', 'Your draft, outline, attempted solution, or instructor feedback — where you are starting.'],
  },
}

export function NotebookEntryComposer({ courseId, course, data, entry, onBuilt }: {
  courseId: string
  course?: Pick<Course, 'code' | 'title'>
  data: ClassCenterData
  entry?: LectureRecord
  onBuilt: (id: string) => void
}) {
  const [draftId] = useState(() => entry?.id ?? uid())
  const [title, setTitle] = useState(entry?.title ?? '')
  const [request, setRequest] = useState(initialNotebookInstructions(entry))
  const [goal, setGoal] = useState<NotebookGoal>(() => inferNotebookGoal(entry))
  const goalId = useId()
  const chosenGoal = goalOptions.find(option => option.value === goal)!
  const [choosingGoal, setChoosingGoal] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [phase, setPhase] = useState<'page' | 'guide' | 'mastery' | 'saving' | null>(null)
  const [error, setError] = useState('')
  const draft = data.lectures.find(item => item.id === draftId) ?? entry
  const selectedIds = draft?.notebookRequest !== undefined
    ? draft.selectedSourceFileIds ?? []
    : [...new Set([...(draft?.selectedSourceFileIds ?? []), ...(draft?.transcriptFileId ? [draft.transcriptFileId] : []), ...data.files.filter(file => draft && file.lectureId === draft.id && file.courseId === courseId).map(file => file.id)])]
  const files = data.files.filter(file => file.courseId === courseId && selectedIds.includes(file.id))
  const chunks = data.sourceChunks.filter(chunk => chunk.courseId === courseId && selectedIds.includes(chunk.fileId) && chunk.content.trim())
  const readableIds = new Set(chunks.map(chunk => chunk.fileId))
  const unreadable = files.filter(file => !readableIds.has(file.id))
  const tailored = goal !== 'review'
  const instructorIds = instructorSourceFileIds(files)
  const noteIds = personalNoteSourceFileIds(files)
  const primaryIds = [...instructorIds, ...noteIds]
  const prepared = selectGenerationSourceChunks(chunks, { preferredFileIds: primaryIds, priorityChunkIds: practiceQuestionChunkIds(files, chunks) })
  const tooLarge = prepared.length < chunks.length
  const sourceProblem = !chunks.length ? 'Add at least one readable material to continue.'
    : unreadable.length ? 'Replace or exclude unreadable materials before creating the entry; every selected file needs readable text.'
    : tooLarge ? 'These materials exceed the current build limit. Select a smaller set or split this work into entries; nothing will be silently left out.' : ''
  const library = data.files.filter(file => file.courseId === courseId)
  const defaultTitle = `Notebook entry ${data.lectures.filter(item => item.courseId === courseId).length + (draft ? 0 : 1)}`

  function saveDraft(ids = selectedIds, nextTitle = title, nextRequest = request, nextGoal = goal) {
    // Event handler only; saving never runs during render.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    useStore.getState().update(state => {
      const center = state.academics.classCenter
      const current = center.lectures.find(item => item.id === draftId)
      const values = { title: nextTitle.trim() || defaultTitle, notebookRequest: nextRequest, notebookGoal: nextGoal, selectedSourceFileIds: ids, updatedAt: now }
      if (current) Object.assign(current, values)
      else center.lectures.push({ id: draftId, courseId, ...values, inputPath: 'materials', processingState: 'ready', workspaceState: 'draft', occurredOn: new Date(now).toISOString().slice(0, 10), createdAt: now, order: center.lectures.filter(item => item.courseId === courseId).length })
    })
  }
  function changeSources(id: string, included: boolean) {
    saveDraft(included ? [...new Set([...selectedIds, id])] : selectedIds.filter(item => item !== id))
    setError('')
  }
  function goToStep(index: number) {
    if (phase || (index === 2 && sourceProblem)) return
    saveDraft()
    setError('')
    setChoosingGoal(index === 0)
    setReviewing(index === 2)
  }
  async function build() {
    if (phase || sourceProblem) return
    setError('')
    setPhase(tailored ? 'page' : 'guide')
    const attempt = Symbol(draftId)
    activeBuildAttempts.set(draftId, attempt)
    const isCurrentAttempt = () => activeBuildAttempts.get(draftId) === attempt
    try {
      const label = title.trim() || draft?.title || defaultTitle
      const primarySourceChunkIds = chunks.filter(chunk => instructorIds.includes(chunk.fileId)).map(chunk => chunk.id)
      const personalNoteChunkIds = chunks.filter(chunk => noteIds.includes(chunk.fileId)).map(chunk => chunk.id)
      const questionIds = practiceQuestionChunkIds(files, chunks)
      const guide = await generateStudyGuide({ courseId, chunks, label, notebookGoal: goal, notebookRequest: request.trim() || undefined, primarySourceChunkIds, personalNoteChunkIds, practiceQuestionChunkIds: questionIds })
      if (!isCurrentAttempt()) return
      if (!guide.ok || !guide.artifact) { setError(guide.message ?? 'The page could not be created. Your materials and any previous result are still saved.'); return }
      setPhase('saving')
      const generatedGuide = guide.artifact
      const usedIds = new Set(generatedGuide.sections.flatMap(section => section.blocks.flatMap(block => block.sourceRef ? [block.sourceRef.chunkId] : [])))
      const usedFiles = [...new Set(chunks.filter(chunk => usedIds.has(chunk.id)).map(chunk => chunk.fileId))]
      // Runs after the explicit Create entry action and successful generation.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now()
      useStore.getState().update(state => {
        const center = state.academics.classCenter
        const record = center.lectures.find(item => item.id === draftId)
        if (!record) return
        record.studyGuide = generatedGuide
        record.aiTitle = guide.suggestedTitle
        record.notebookOutput = tailored ? 'tailored-page' : 'study-package'
        record.notebookRequest = request
        record.notebookGeneratedRequest = request
        record.notebookGoal = goal
        record.notebookGeneratedGoal = goal
        record.selectedSourceFileIds = selectedIds
        record.generationAuditStatus = guide.auditStatus
        record.lectureBrief = { ...buildLectureBrief(chunks, selectedIds, center.files, now), usedSourceFileIds: usedFiles, unusedSourceFileIds: selectedIds.filter(id => !usedFiles.includes(id)) }
        // Persist the independently validated guide before attempting the map.
        // Keep a new draft in the composer until the map settles.
        record.processingError = tailored ? undefined : 'Study Guide is saved. Mastery Map generation has not completed.'
        if (tailored) record.workspaceState = 'complete'
        record.updatedAt = now
      })
      if (!tailored) {
        setPhase('mastery')
        let mastery: Awaited<ReturnType<typeof generateUnitMasteryOutline>>
        try {
          mastery = await generateUnitMasteryOutline({ courseId, chunks, unit: label, label, scope: 'lecture', notebookRequest: request.trim() || undefined, primarySourceChunkIds, personalNoteChunkIds, practiceQuestionChunkIds: questionIds })
        } catch {
          mastery = { ok: false }
        }
        // A student may reopen and rebuild while this request is still running.
        // Only attach the map to the exact guide produced by this attempt.
        if (!isCurrentAttempt() || useStore.getState().academics.classCenter.lectures.find(item => item.id === draftId)?.studyGuide !== generatedGuide) return
        const generatedMastery = mastery.ok ? mastery.artifact : undefined
        useStore.getState().update(state => {
          const center = state.academics.classCenter
          const record = center.lectures.find(item => item.id === draftId)
          if (!record) return
          if (generatedMastery) {
            const existing = center.generatedMasteryOutlines.find(outline => outline.id === record.masteryMapId)
            if (existing) Object.assign(existing, generatedMastery, { updatedAt: Date.now() })
            else {
              const id = uid()
              center.generatedMasteryOutlines.push({ ...generatedMastery, id, lectureId: draftId, scopeId: draftId, createdAt: now, updatedAt: now, order: center.generatedMasteryOutlines.length })
              record.masteryMapId = id
            }
            record.processingError = undefined
            const allUsedIds = new Set([...usedIds, ...generatedMastery.sourceChunkIds])
            const allUsedFiles = [...new Set(chunks.filter(chunk => allUsedIds.has(chunk.id)).map(chunk => chunk.fileId))]
            if (record.lectureBrief) {
              record.lectureBrief.usedSourceFileIds = allUsedFiles
              record.lectureBrief.unusedSourceFileIds = selectedIds.filter(id => !allUsedFiles.includes(id))
            }
          } else {
            record.processingError = record.masteryMapId
              ? 'Study Guide is saved. The Mastery Map could not be updated; your previous Mastery Map is still available and may reflect earlier materials.'
              : 'Study Guide is saved. The Mastery Map could not be created from this attempt. You can read the guide now.'
            if (mastery.message) record.processingError += ` ${mastery.message.replaceAll('Nothing was saved.', 'No new Mastery Map was saved.')}`
          }
          record.workspaceState = 'complete'
          record.updatedAt = Date.now()
        })
      }
      if (isCurrentAttempt()) onBuilt(draftId)
    } catch (failure) {
      if (!isCurrentAttempt()) return
      setError(failure instanceof Error ? failure.message : 'Creation stopped. Your materials and any previous result are still saved.')
    } finally {
      if (isCurrentAttempt()) activeBuildAttempts.delete(draftId)
      setPhase(null)
    }
  }

  return <section className="notebook-composer w-full min-w-0" aria-label="Notebook entry composer">
    {!phase && draft?.studyGuide && <Button variant="outline" onClick={() => {
      useStore.getState().update(state => {
        const saved = state.academics.classCenter.lectures.find(item => item.id === draftId)
        if (saved) saved.workspaceState = 'complete'
      })
      onBuilt(draftId)
    }}>Open saved entry</Button>}
    <header className="space-y-6 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-bold text-primary">{course?.code ?? 'Class'} · Notebook</p>
        <nav aria-label="Entry progress" className="w-full"><ol className="flex items-center gap-2 text-sm">
          {['Goal', 'Materials', 'Create'].map((label, index) => {
            const current = choosingGoal ? 0 : reviewing ? 2 : 1
            return <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="hidden h-px w-8 bg-border sm:block"/>}
              <button type="button" aria-label={`Go to ${label.toLowerCase()}`} disabled={Boolean(phase) || (index === 2 && Boolean(sourceProblem))} aria-current={index === current ? 'step' : undefined} onClick={() => goToStep(index)} className={cn('flex min-h-12 w-full items-center justify-center gap-1 rounded-lg border px-1 text-xs font-semibold sm:gap-2 sm:px-2 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', index === current ? 'border-primary bg-muted text-foreground' : 'border-border text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground')}>
                <span aria-hidden="true" className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', index === current ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{index + 1}</span>{label}
              </button>
            </li>
          })}
        </ol></nav>
      </div>
      <h1 className="font-display text-3xl font-extrabold">{choosingGoal ? 'What would you like to do?' : reviewing ? 'Ready to create' : 'Bring your materials'}</h1>
    </header>
    <div className="space-y-6 py-6">
      {choosingGoal ? <section aria-label="Notebook goal" className="space-y-5">
        <RadioGroup aria-label="What would you like to do?" value={goal} onValueChange={value => { const nextGoal = value as NotebookGoal; setGoal(nextGoal); saveDraft(selectedIds, title, request, nextGoal) }} className="gap-3 sm:grid-cols-3">
          {goalOptions.map(option => <label key={option.value} htmlFor={`${goalId}-${option.value}`} className={cn('flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring', goal === option.value ? 'border-primary bg-muted ring-1 ring-primary shadow-md' : 'border-border hover:bg-muted')}>
            {option.value === 'review' ? <BookOpen aria-hidden="true" className="size-5 shrink-0 text-primary"/> : option.value === 'assessment' ? <ClipboardCheck aria-hidden="true" className="size-5 shrink-0 text-primary"/> : <PenLine aria-hidden="true" className="size-5 shrink-0 text-primary"/>}<RadioGroupItem className="sr-only" id={`${goalId}-${option.value}`} value={option.value} aria-label={option.label}/><span className="flex-1 text-sm font-bold">{option.label}</span>{goal === option.value && <Check aria-hidden="true" className="size-4 shrink-0 text-primary"/>}
          </label>)}
        </RadioGroup>
        <label className="block text-sm font-bold">Anything specific? <span className="font-normal text-muted-foreground">Optional</span>
          <Textarea className="mt-2 min-h-20" maxLength={4000} value={request} onChange={event => { setRequest(event.target.value); saveDraft(selectedIds, title, event.target.value) }} placeholder="e.g., explain simply, give examples, focus on a topic…"/>
        </label>
      </section> : !reviewing ? <>
        <section aria-label="Entry materials" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3"><FileText className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true"/><div><p className="text-sm text-muted-foreground">Transcripts, readings, questions, or drafts.</p></div></div>
            <MaterialIntakeDialog minimumTextCharacters={1} courseId={courseId} onAdded={ids => { saveDraft([...new Set([...selectedIds, ...ids])]); setError('') }} trigger={<Button variant="outline"><FilePlus2 className="size-4"/>Upload or paste</Button>}/>
          </div>
          <details className="rounded-xl border border-border px-4 py-2" open={files.length === 0}>
            <summary className="cursor-pointer py-2 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Not sure what to upload?</summary>
            <p className="mt-2 text-sm leading-6">{uploadGuidance[goal].start}</p>
            <ul className="my-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{uploadGuidance[goal].suggestions.map(suggestion => <li key={suggestion}>{suggestion}</li>)}</ul>
            <p className="pb-2 text-xs leading-5 text-muted-foreground">Use Upload or paste, or choose files already saved for this class. Add only the relevant pages or excerpts; check that each selection says “Readable text ready.”</p>
          </details>
          {library.length > 0 && <div>
            <Button type="button" variant="ghost" className="px-0 text-primary" aria-expanded={libraryOpen} onClick={() => setLibraryOpen(!libraryOpen)}>Choose saved class materials</Button>
            {libraryOpen && <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-2" aria-label="Saved class materials">{library.map(file => <label key={file.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-muted focus-within:ring-2 focus-within:ring-ring"><input type="checkbox" className="mt-1 accent-primary" checked={selectedIds.includes(file.id)} onChange={event => changeSources(file.id, event.target.checked)}/><span className="min-w-0 break-words text-sm">{file.title}</span></label>)}</div>}
          </div>}
          {files.length > 0 && <ul aria-label="Selected materials" className="max-h-64 divide-y divide-border overflow-y-auto">{files.map(file => <li key={file.id} className="flex min-w-0 items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-muted-foreground"/><span className="min-w-0 flex-1"><b className="block break-words text-sm">{file.title}</b><span className="text-xs text-muted-foreground">{readableIds.has(file.id) ? 'Readable text ready' : 'No readable text · add a clearer copy'}</span><label className="mt-2 block text-xs text-muted-foreground">Material type<select aria-label={`Material type for ${file.title}`} value={file.type} disabled={Boolean(phase)} className="mt-1 block min-h-10 w-full max-w-64 rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={event => {
              const type = event.target.value
              if (!(type in STUDY_MATERIAL_TYPES)) return
              useStore.getState().update(state => {
                const material = state.academics.classCenter.files.find(item => item.id === file.id && item.courseId === courseId)
                if (material) { material.type = type as typeof file.type; material.updatedAt = Date.now() }
              })
            }}>{Object.entries(STUDY_MATERIAL_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></span><Button variant="ghost" size="icon" aria-label={`Exclude ${file.title}`} onClick={() => changeSources(file.id, false)}><X className="size-4"/></Button></li>)}</ul>}
        </section>
        <details><summary className="cursor-pointer py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring">Entry title <span className="font-normal text-muted-foreground">Optional</span></summary><label className="block pt-2"><span className="sr-only">Entry title</span><Input value={title} placeholder="Name it, or use the generated title" onChange={event => { setTitle(event.target.value); saveDraft(selectedIds, event.target.value, request) }}/></label></details>
      </> : <>
        <section aria-label="Creation plan" className="rounded-xl border-l-4 border-primary bg-muted p-5">
          <div className="flex items-center gap-2 text-primary"><NotebookPen className="size-5"/><h3 className="font-display text-lg font-bold">{chosenGoal.output}</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">{chosenGoal.label}</p>
          {request.trim() && <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-border pl-3 text-sm leading-6">{request}</blockquote>}
        </section>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><span><b>{files.length}</b> selected materials</span><span><b>{chunks.length}</b> readable passages</span><span className="inline-flex items-center gap-1 text-primary"><Check className="size-4"/>All readable passages included</span></div>
        {unreadable.length > 0 && <p className="text-sm text-destructive">{unreadable.length} selected {unreadable.length === 1 ? 'file has' : 'files have'} no readable text and cannot contribute to this result. Go back to replace or exclude them.</p>}
        {files.some(file => file.sourceCoverage?.unreadablePages?.length) && <p role="status" className="text-sm text-muted-foreground">Some selected pages remain unreadable. Only the readable text will be used; review the page counts below before creating.</p>}
        <details className="rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer font-semibold focus-visible:ring-2 focus-visible:ring-ring">Sources and AI use</summary><ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">{files.map(file => <li key={file.id} className="break-words">{file.title} · {fileCoverageLabel(file, chunks.filter(chunk => chunk.fileId === file.id).length)}{file.sourceCoverage?.figureStatus === 'not-interpreted' ? ' · Diagrams and figures are not interpreted' : ''}</li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">Readable source text and your request are sent when you create the entry. Signed-in account sync stores academic originals privately so you can open them in another browser. Generated explanations include source references you can open when needed.</p></details>
      </>}
      {!choosingGoal && sourceProblem && <p role="status" className="text-sm text-muted-foreground">{sourceProblem}</p>}
      {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {phase && <NotebookBuildProgress phase={phase} tailored={tailored} output={chosenGoal.output}/>}
      <footer className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {!choosingGoal ? <Button variant="outline" disabled={Boolean(phase)} onClick={() => goToStep(reviewing ? 1 : 0)}><ArrowLeft className="size-4"/>{reviewing ? 'Back to materials' : 'Back to goal'}</Button> : <p className="text-xs text-muted-foreground">{draft ? 'Draft saved' : ''}</p>}
        <Button className="ml-auto" disabled={Boolean(phase) || (!choosingGoal && Boolean(sourceProblem))} onClick={choosingGoal ? () => goToStep(1) : reviewing ? () => void build() : () => goToStep(2)}>{!choosingGoal && reviewing ? <Sparkles className="size-4"/> : <ArrowRight className="size-4"/>}{choosingGoal ? 'Continue to materials' : phase ? 'Creating…' : reviewing ? 'Create entry' : 'Review and create'}</Button>
      </footer>
    </div>
  </section>
}

function NotebookBuildProgress({ phase, tailored, output }: { phase: 'page' | 'guide' | 'mastery' | 'saving'; tailored: boolean; output: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const steps = tailored ? [output, 'Save entry'] : ['Study Guide', 'Mastery Map', 'Save entry']
  const current = phase === 'saving' ? steps.length - 1 : phase === 'mastery' ? 1 : 0
  return <section aria-label="Creation progress" className="rounded-xl border border-primary bg-card p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><p role="status" className="text-sm font-bold">{phase === 'saving' ? 'Saving your entry…' : `Creating ${steps[current]}…`}</p><span className="text-xs tabular-nums text-muted-foreground">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed</span></div>
    <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">{steps.map((label, index) => <li key={label} aria-current={index === current ? 'step' : undefined} className={cn('flex items-center gap-2', index > current ? 'text-muted-foreground' : 'text-primary')}>
      {index < current ? <Check aria-hidden="true" className="size-4"/> : index === current ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none"/> : <span aria-hidden="true" className="size-3 rounded-full border border-border"/>}<span>{label}<span className="sr-only">{index < current ? ': complete' : index === current ? ': in progress' : ': waiting'}</span></span>
    </li>)}</ol>
  </section>
}
