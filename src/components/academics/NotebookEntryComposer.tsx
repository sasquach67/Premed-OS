import { useId, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, FilePlus2, FileText, Loader2, NotebookPen, Sparkles, X } from 'lucide-react'
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
import { instructorSourceFileIds } from '@/lib/academics/lectureSourcePriority'
import { practiceQuestionChunkIds } from '@/lib/academics/materialGenerationIntake'
import { buildLectureBrief } from '@/lib/academics/lectureWorkspace'

const goalOptions: { value: NotebookGoal; label: string; output: string; description: string }[] = [
  { value: 'review', label: 'Review class material', output: 'Study Guide + Mastery Map', description: 'Connect ideas, work through examples, and build recall from your class material.' },
  { value: 'assessment', label: 'Prepare for an assessment', output: 'Assessment study guide', description: 'Organize the topics to know, connect the supporting materials, and identify gaps in preparation.' },
  { value: 'assignment', label: 'Work on an assignment', output: 'Assignment workspace', description: 'Work through the task using its instructions, your materials, and any draft or attempt.' },
]

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
  const [phase, setPhase] = useState<'page' | 'guide' | 'mastery' | null>(null)
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
  const primaryIds = instructorSourceFileIds(files)
  const prepared = selectGenerationSourceChunks(chunks, { preferredFileIds: primaryIds, priorityChunkIds: practiceQuestionChunkIds(files, chunks) })
  const tooLarge = prepared.length < chunks.length
  const sourceProblem = !chunks.length ? 'Add at least one readable material to continue.'
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
  function review() {
    if (sourceProblem) return
    saveDraft()
    setError('')
    setReviewing(true)
  }
  async function build() {
    if (phase || sourceProblem) return
    setError('')
    setPhase(tailored ? 'page' : 'guide')
    try {
      const label = title.trim() || draft?.title || defaultTitle
      const primarySourceChunkIds = chunks.filter(chunk => primaryIds.includes(chunk.fileId)).map(chunk => chunk.id)
      const questionIds = practiceQuestionChunkIds(files, chunks)
      const guide = await generateStudyGuide({ courseId, chunks, label, notebookGoal: goal, notebookRequest: request.trim() || undefined, primarySourceChunkIds: tailored ? [] : primarySourceChunkIds, practiceQuestionChunkIds: questionIds })
      if (!guide.ok || !guide.artifact) { setError(guide.message ?? 'The page could not be created. Your materials and any previous result are still saved.'); return }
      let mastery: Awaited<ReturnType<typeof generateUnitMasteryOutline>> | undefined
      if (!tailored) {
        setPhase('mastery')
        mastery = await generateUnitMasteryOutline({ courseId, chunks, unit: label, label, scope: 'lecture', notebookRequest: request.trim() || undefined, primarySourceChunkIds, practiceQuestionChunkIds: questionIds })
        if (!mastery.ok || !mastery.artifact) { setError(mastery.message ?? 'The Mastery Map could not be created. Your previous result is unchanged.'); return }
      }
      const generatedGuide = guide.artifact
      const generatedMastery = mastery?.artifact
      const usedIds = new Set([...generatedGuide.sections.flatMap(section => section.blocks.flatMap(block => block.sourceRef ? [block.sourceRef.chunkId] : [])), ...(generatedMastery?.sourceChunkIds ?? [])])
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
        if (generatedMastery) {
          const existing = center.generatedMasteryOutlines.find(outline => outline.id === record.masteryMapId)
          if (existing) Object.assign(existing, generatedMastery, { updatedAt: now })
          else {
            const id = uid()
            center.generatedMasteryOutlines.push({ ...generatedMastery, id, lectureId: draftId, scopeId: draftId, createdAt: now, updatedAt: now, order: center.generatedMasteryOutlines.length })
            record.masteryMapId = id
          }
        }
        // Old mastery work is retained in the store if a rebuild now requests a tailored page.
        record.workspaceState = 'complete'
        record.updatedAt = now
      })
      onBuilt(draftId)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Creation stopped. Your materials and any previous result are still saved.')
    } finally { setPhase(null) }
  }

  return <section className="notebook-composer w-full min-w-0" aria-label="Notebook entry composer">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 pt-2">
      <div><p className="text-xs font-bold text-primary">{course?.code ?? 'Class'} · Notebook</p><h2 className="mt-1 font-display text-xl font-extrabold">{choosingGoal ? 'What would you like to do?' : reviewing ? 'Ready to create' : 'Bring your materials'}</h2></div>
      <p className="text-xs text-muted-foreground">{choosingGoal ? '1 of 3 · Your goal' : reviewing ? '3 of 3 · Review' : '2 of 3 · Materials'}</p>
    </header>
    <div className="space-y-6 py-6">
      {choosingGoal ? <section aria-label="Notebook goal" className="space-y-5">
        <p className="text-sm text-muted-foreground">Choose what you want to create. Add any further instructions below.</p>
        <RadioGroup aria-label="What would you like to do?" value={goal} onValueChange={value => { const nextGoal = value as NotebookGoal; setGoal(nextGoal); saveDraft(selectedIds, title, request, nextGoal) }} className="gap-3 sm:grid-cols-3">
          {goalOptions.map(option => <label key={option.value} htmlFor={`${goalId}-${option.value}`} className={cn('flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring', goal === option.value ? 'border-primary bg-muted ring-1 ring-primary' : 'border-border hover:bg-muted')}>
            <RadioGroupItem id={`${goalId}-${option.value}`} value={option.value} aria-label={option.label}/><span className="text-sm font-bold">{option.label}</span>
          </label>)}
        </RadioGroup>
        <p className="text-sm text-muted-foreground" aria-live="polite">{chosenGoal.description}</p>
        <label className="block text-sm font-bold">Anything specific? <span className="font-normal text-muted-foreground">Optional</span>
          <Textarea className="mt-2 min-h-24" maxLength={4000} value={request} onChange={event => { setRequest(event.target.value); saveDraft(selectedIds, title, event.target.value) }} placeholder="e.g., explain simply, give examples, focus on a topic…"/>
          <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">Optional refinements: make it easier to digest, add examples, or emphasize lecture material. Your selected goal stays the same.</span>
        </label>
        <p className="text-xs text-muted-foreground">Next, bring whatever supports your goal. A transcript is optional.</p>
      </section> : !reviewing ? <>
        <section aria-label="Entry materials" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div className="flex items-start gap-3"><FileText className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true"/><div><h3 className="font-display text-lg font-bold">Bring what you have</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Transcripts, slides, readings, questions, drafts—anything relevant.</p></div></div>
            <MaterialIntakeDialog minimumTextCharacters={1} courseId={courseId} onAdded={ids => { saveDraft([...new Set([...selectedIds, ...ids])]); setError('') }} trigger={<Button variant="outline"><FilePlus2 className="size-4"/>Upload or paste</Button>}/>
          </div>
          {library.length > 0 && <div>
            <Button type="button" variant="ghost" className="px-0 text-primary" aria-expanded={libraryOpen} onClick={() => setLibraryOpen(!libraryOpen)}>Choose saved class materials</Button>
            {libraryOpen && <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-2" aria-label="Saved class materials">{library.map(file => <label key={file.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-muted focus-within:ring-2 focus-within:ring-ring"><input type="checkbox" className="mt-1 accent-primary" checked={selectedIds.includes(file.id)} onChange={event => changeSources(file.id, event.target.checked)}/><span className="min-w-0 break-words text-sm">{file.title}</span></label>)}</div>}
          </div>}
          {files.length > 0 && <ul aria-label="Selected materials" className="max-h-64 divide-y divide-border overflow-y-auto">{files.map(file => <li key={file.id} className="flex min-w-0 items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-muted-foreground"/><span className="min-w-0 flex-1"><b className="block break-words text-sm">{file.title}</b><span className="text-xs text-muted-foreground">{readableIds.has(file.id) ? 'Readable text ready' : 'No readable text · add a clearer copy'}</span></span><Button variant="ghost" size="icon" aria-label={`Exclude ${file.title}`} onClick={() => changeSources(file.id, false)}><X className="size-4"/></Button></li>)}</ul>}
        </section>
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4"><div className="min-w-0 flex-1"><p className="text-xs font-bold text-primary">Your goal</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{chosenGoal.label}</p>{request.trim() && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{request}</p>}</div><Button variant="ghost" onClick={() => setChoosingGoal(true)}>Edit goal</Button></div>
        <details className="border-t border-border pt-3"><summary className="cursor-pointer py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring">Entry title <span className="font-normal text-muted-foreground">Optional</span></summary><label className="block pt-2"><span className="sr-only">Entry title</span><Input value={title} placeholder="Name it, or use the generated title" onChange={event => { setTitle(event.target.value); saveDraft(selectedIds, event.target.value, request) }}/></label></details>
      </> : <>
        <section aria-label="Creation plan" className="rounded-xl border-l-4 border-primary bg-muted p-5">
          <div className="flex items-center gap-2 text-primary"><NotebookPen className="size-5"/><h3 className="font-display text-lg font-bold">{chosenGoal.output}</h3></div>
          <p className="mt-3 text-sm leading-6">{chosenGoal.label}: {chosenGoal.description}</p>
          {request.trim() && <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-border pl-3 text-sm leading-6">{request}</blockquote>}
        </section>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><span><b>{files.length}</b> selected materials</span><span><b>{chunks.length}</b> readable passages</span><span className="inline-flex items-center gap-1 text-primary"><Check className="size-4"/>All readable passages included</span></div>
        {unreadable.length > 0 && <p className="text-sm text-destructive">{unreadable.length} selected {unreadable.length === 1 ? 'file has' : 'files have'} no readable text and cannot contribute to this result. Go back to replace or exclude them.</p>}
        <details className="rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer font-semibold focus-visible:ring-2 focus-visible:ring-ring">Sources and AI use</summary><ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">{files.map(file => <li key={file.id} className="break-words">{file.title} · {readableIds.has(file.id) ? 'Text included' : 'Unreadable'}</li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">Readable source text and your request are sent when you create the entry. Original files stay on this device. Generated explanations include source references you can open when needed.</p></details>
      </>}
      {!choosingGoal && sourceProblem && <p role="status" className="text-sm text-muted-foreground">{sourceProblem}</p>}
      {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {phase && <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin motion-reduce:animate-none"/>{phase === 'page' ? 'Creating your notebook page…' : phase === 'guide' ? 'Creating the Study Guide…' : 'Creating the Mastery Map…'}</p>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {!choosingGoal && reviewing ? <Button variant="ghost" disabled={Boolean(phase)} onClick={() => { setReviewing(false); setError('') }}><ArrowLeft className="size-4"/>Edit materials or request</Button> : <p className="text-xs text-muted-foreground">{draft ? 'Draft saved in this class' : 'No transcript required'}</p>}
        <Button disabled={Boolean(phase) || (!choosingGoal && Boolean(sourceProblem))} onClick={choosingGoal ? () => { saveDraft(); setReviewing(false); setChoosingGoal(false) } : reviewing ? () => void build() : review}>{!choosingGoal && reviewing ? <Sparkles className="size-4"/> : <ArrowRight className="size-4"/>}{choosingGoal ? 'Continue to materials' : phase ? 'Creating…' : reviewing ? 'Create entry' : 'Review and create'}</Button>
      </footer>
    </div>
  </section>
}
