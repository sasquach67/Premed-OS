import { useMemo, useRef, useState } from 'react'
import { Check, FileText, FolderOpen, Sparkles, X } from 'lucide-react'
import type { AcademicFile, ClassWorkspaceType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateFlashcards } from '@/lib/academics/generateFlashcards'
import { generateRevisedNotes } from '@/lib/academics/generateRevisedNotes'
import { generateUnitMasteryOutline } from '@/lib/academics/generateUnitMasteryOutline'
import { generateUnitQuestionBank } from '@/lib/academics/generateUnitQuestionBank'
import { blueprintForCourse } from '@/lib/academics/unitQuestionBank'
import {
  materialGenerationChoices,
  practiceQuestionChunkIds,
  selectedMaterialChunks,
  selectedNotesBaseline,
} from '@/lib/academics/materialGenerationIntake'
import { useStore } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MaterialIntakeDialog } from '@/components/academics/MaterialIntakeDialog'
import { TranscriptImport } from '@/components/academics/TranscriptImport'
import { applicableCourseLens } from '@/lib/academics/courseLens'
import { selectGenerationSourceChunks } from '@/lib/academics/syncGenerationSources'
import { MAX_QUESTION_BANK_VISUAL_SOURCES, isQuestionBankVisualFile } from '@/lib/academics/questionBankVisualSources'
import { GenerationProgress } from '@/components/academics/GenerationProgress'
import { startGenerationProgress, waitForGenerationProgress, type GenerationPhase } from '@/lib/generation/progress'

export type MaterialArtifact = 'flashcards' | 'study-guide' | 'study-outline' | 'revised-notes' | 'unit-mastery-outline' | 'unit-question-bank'

const ARTIFACT: Record<MaterialArtifact, { title: string; detail: string; action: string }> = {
  flashcards: { title: 'Flashcards', detail: 'Create a source-grounded deck from only the material you select.', action: 'Create flashcards' },
  'study-guide': { title: 'Study guide', detail: 'Organize only the material you select.', action: 'Generate study guide' },
  'study-outline': { title: 'Study outline', detail: 'Turn selected evidence into a concise objective-led outline.', action: 'Create study outline' },
  'revised-notes': { title: 'Revised Notes', detail: 'Repair your chosen notes without replacing the original.', action: 'Create revised notes' },
  'unit-mastery-outline': { title: 'Unit mastery outline', detail: 'Map each syllabus standard to understand, do, and watch-for checkpoints.', action: 'Create mastery outline' },
  'unit-question-bank': { title: 'Unit question bank', detail: 'Build Claude-authored, application-first practice with source-scoped visuals and a printable PDF.', action: 'Create question bank' },
}

function artifactCopy(artifact: MaterialArtifact, classType: ClassWorkspaceType) {
  if (artifact === 'unit-mastery-outline' && classType !== 'stem') return {
    title: 'Learning objectives & mastery map',
    detail: 'Organize syllabus objectives and selected evidence into understand, do, and watch-for checkpoints.',
    action: 'Create objectives map',
  }
  if (artifact === 'study-outline' && classType === 'writing') return {
    title: 'Argument & source outline',
    detail: 'Organize the selected readings, claims, evidence, and tensions without inventing an argument.',
    action: 'Create source outline',
  }
  if (artifact === 'unit-question-bank' && classType === 'general') return {
    title: 'Practice questions',
    detail: 'Build source-grounded recall and application questions in the language of this course.',
    action: 'Create practice questions',
  }
  return ARTIFACT[artifact]
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function roleFor(file: AcademicFile) {
  if (file.type === 'transcript') return 'Lecture transcript'
  if (file.owner === 'mine') return 'My notes'
  if (file.type === 'lecture-slides') return 'Course slides'
  return file.owner === 'course' ? 'Course material' : 'My material'
}

type MaterialGenerationIntakeProps = {
  artifact: MaterialArtifact
  courseId: string
  courseLabel: string
  files: AcademicFile[]
  lectureId?: string
  course?: { code?: string; title?: string; type?: string }
  onClose: () => void
}

export function MaterialGenerationIntake(props: MaterialGenerationIntakeProps) {
  // Legacy deep links remain valid, but Study Outline is no longer a separate
  // user-facing resource. Route the old request into the unified Mastery Map.
  return <MaterialGenerationIntakeCore {...props} artifact={props.artifact === 'study-outline' ? 'unit-mastery-outline' : props.artifact} />
}

function MaterialGenerationIntakeCore({ artifact, courseId, courseLabel, files, lectureId, course, onClose }: MaterialGenerationIntakeProps) {
  const toast = useToast()
  const allChunks = useStore((state) => state.academics.classCenter.sourceChunks)
  const workspace = useStore((state) => state.academics.classCenter.workspaces.find((item) => item.courseId === courseId))
  const classType: ClassWorkspaceType = workspace?.type ?? (course?.type === 'stem' || course?.type === 'writing' || course?.type === 'general' ? course.type : 'general')
  const presentation = artifactCopy(artifact, classType)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [baselineFileId, setBaselineFileId] = useState('')
  const [busy, setBusy] = useState(false)
  const generationLock = useRef(false)
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [generationError, setGenerationError] = useState('')
  const [useCourseLens, setUseCourseLens] = useState(false)
  const [currentUnitPercent, setCurrentUnitPercent] = useState(() => blueprintForCourse(course ?? { code: courseLabel, title: courseLabel }).defaultCurrentUnitPercent)
  const [unitLabel, setUnitLabel] = useState('')
  const [masteryScope, setMasteryScope] = useState<'lecture' | 'unit' | 'exam'>('unit')
  const choices = useMemo(() => materialGenerationChoices({ courseId, files, chunks: allChunks }), [allChunks, courseId, files])
  const ready = choices.filter((choice) => choice.chunks.length)
  const notReady = choices.filter((choice) => !choice.chunks.length)
  const allMasteryOutlines = useStore((state) => state.academics.classCenter.generatedMasteryOutlines)
  const masteryOutlines = useMemo(() => allMasteryOutlines.filter((outline) => outline.courseId === courseId), [allMasteryOutlines, courseId])
  const selectedUnit = unitLabel.trim()
  const matchingMasteryOutline = masteryOutlines.find((outline) => outline.unit.trim().toLowerCase() === selectedUnit.toLowerCase())
  const lens = workspace?.courseLens
  const lensSourceFileIds = useMemo(() => lens?.sourceFileIds ?? [], [lens?.sourceFileIds])
  const lensSourceChunkIds = useMemo(() => new Set(lens?.sourceChunkIds ?? []), [lens?.sourceChunkIds])
  const lensAvailable = Boolean(lens?.text.trim() && lensSourceFileIds.length && lensSourceChunkIds.size
    && lensSourceFileIds.every((id) => ready.some((choice) => choice.file.id === id))
    && [...lensSourceChunkIds].every((id) => allChunks.some((chunk) => chunk.id === id && chunk.courseId === courseId)))
  const effectiveSelectedFileIds = useMemo(() => (artifact === 'study-guide' || artifact === 'study-outline') && useCourseLens && lensAvailable
    ? [...new Set([...selectedFileIds, ...lensSourceFileIds])]
    : selectedFileIds, [artifact, lensAvailable, lensSourceFileIds, selectedFileIds, useCourseLens])
  const selectedChunks = selectedMaterialChunks(choices, effectiveSelectedFileIds)
  const selected = ready.filter((choice) => effectiveSelectedFileIds.includes(choice.file.id))
  const selectedVisualFileCount = Math.min(
    MAX_QUESTION_BANK_VISUAL_SOURCES,
    selected.filter((choice) => isQuestionBankVisualFile(choice.file)).length,
  )
  const baseline = selectedNotesBaseline(choices, baselineFileId, effectiveSelectedFileIds)
  const allQuestionReferenceChunkIds = practiceQuestionChunkIds(selected.map((choice) => choice.file), selectedChunks)
  const preferredGenerationFileIds = [
    ...(baselineFileId ? [baselineFileId] : []),
    ...selected.filter((choice) => choice.file.type === 'transcript').map((choice) => choice.file.id),
    ...lensSourceFileIds,
  ]
  const generationChunks = artifact === 'unit-question-bank'
    ? selectedChunks
    : selectGenerationSourceChunks(selectedChunks, {
        preferredFileIds: preferredGenerationFileIds,
        priorityChunkIds: allQuestionReferenceChunkIds,
      })
  const questionReferenceChunkIds = practiceQuestionChunkIds(selected.map((choice) => choice.file), generationChunks)
  const generationChunkIds = new Set(generationChunks.map((chunk) => chunk.id))
  const generationBaselineChunks = baseline?.chunks.filter((chunk) => generationChunkIds.has(chunk.id))
  const courseLens = artifact === 'study-guide' || artifact === 'study-outline'
    ? applicableCourseLens(lens, generationChunks, Object.fromEntries(choices.map((choice) => [choice.file.id, choice.file.title])))
    : undefined
  const fullCorpusMessage = artifact === 'unit-question-bank' && selectedChunks.length > 0
    ? `${selectedChunks.length} passages will be reviewed. Claude receives the full selected text corpus; the saved bank will cite only the passages it actually uses.${selectedVisualFileCount ? ` ${selectedVisualFileCount} selected image ${selectedVisualFileCount === 1 ? 'page' : 'pages'} will also receive a Claude visual pass.` : ''} Claude also checks official public assessment patterns on the web without copying them.`
    : undefined
  const representativePassMessage = artifact !== 'unit-question-bank' && selectedChunks.length > generationChunks.length
    ? `All ${selectedChunks.length.toLocaleString()} selected passages stay in Materials. This output will automatically use ${generationChunks.length} representative passages across the selected sources.`
    : undefined
  const fullPacketMessage = artifact !== 'unit-question-bank' && selectedChunks.length > 24
    ? `All ${selectedChunks.length.toLocaleString()} selected passages will be reviewed for this output.`
    : undefined
  const unitScopeRequired = artifact === 'unit-question-bank' || artifact === 'unit-mastery-outline'
  const canGenerate = generationChunks.length > 0
    && (!unitScopeRequired || Boolean(selectedUnit))
    && (artifact !== 'revised-notes' || Boolean(baseline && generationBaselineChunks?.length))

  function toggle(fileId: string) {
    // A Revised Notes baseline is itself evidence. Keep it selected so the
    // submitted source set cannot silently omit the student's original notes.
    if (fileId === baselineFileId) return
    setSelectedFileIds((current) => current.includes(fileId)
      ? current.filter((id) => id !== fileId)
      : [...current, fileId])
  }

  function chooseBaseline(fileId: string) {
    setBaselineFileId(fileId)
    setSelectedFileIds((current) => current.includes(fileId) ? current : [...current, fileId])
  }

  async function generate() {
    if (!canGenerate || busy || generationLock.current) return
    generationLock.current = true
    setBusy(true)
    setGenerationError('')
    startGenerationProgress(setGenerationPhase)

    function failGeneration(description: string) {
      setGenerationPhase('error')
      setGenerationError(description)
      toast({ title: 'Nothing was saved', description, tone: 'error' })
    }

    try {
      if (artifact === 'flashcards') {
        const outcome = await generateFlashcards({ courseId, chunks: generationChunks, label: courseLabel })
        if (!outcome.ok || !outcome.cards || !outcome.specHash) return failGeneration(outcome.message ?? 'Flashcards could not be generated.')
        setGenerationPhase('saving')
        await waitForGenerationProgress()
        useStore.getState().update((draft) => {
          const decks = draft.academics.classCenter.generatedFlashcardDecks
          decks.unshift({ id: uid(), courseId, title: `${courseLabel} flashcards`, sourceChunkIds: generationChunks.map((chunk) => chunk.id), specId: 'flashcards-v1', specHash: outcome.specHash!, cards: outcome.cards!, createdAt: Date.now(), updatedAt: Date.now(), order: decks.length })
        })
        toast({ title: 'Flashcards created', description: 'Saved in Materials with the selected-source trace.' })
      } else if (artifact === 'study-guide' || artifact === 'study-outline') {
        const outcome = await generateStudyGuide({ courseId, chunks: generationChunks, label: courseLabel, courseLens, practiceQuestionChunkIds: questionReferenceChunkIds })
        if (!outcome.ok) return failGeneration(outcome.message ?? 'The study material could not be generated.')
        setGenerationPhase('saving')
        await waitForGenerationProgress()
        useStore.getState().update((draft) => {
          const notes = draft.academics.classCenter.notes
          const lensTrace = outcome.courseLens
            ? `\n\nCourse lens used\n${outcome.courseLens.text}\nSourceable from: ${outcome.courseLens.sourceLabels.join(' · ')}`
            : ''
          const isOutline = artifact === 'study-outline'
          notes.unshift({ id: uid(), courseId, title: isOutline ? `Study outline · ${outcome.title!}` : outcome.title!, type: 'study-guide', kind: 'on-material', date: isoToday(), unit: '', topicIds: [], content: `${isOutline ? 'STUDY OUTLINE\n\n' : ''}${outcome.content}${lensTrace}\n\n---\nGenerated from your selected material · spec ${outcome.specHash}`, syncStatus: 'local-only', linkedFileIds: outcome.fileIds ?? [], createdAt: Date.now(), updatedAt: Date.now(), order: notes.length })
        })
        toast({ title: artifact === 'study-outline' ? 'Study outline created' : 'Study guide generated', description: outcome.courseLens ? 'Saved with its selected-source and Course lens traces.' : 'Saved with its selected-source trace.' })
      } else if (artifact === 'unit-mastery-outline') {
        const outcome = await generateUnitMasteryOutline({ courseId, chunks: generationChunks, unit: selectedUnit, label: courseLabel, scope: masteryScope, practiceQuestionChunkIds: questionReferenceChunkIds })
        if (!outcome.ok || !outcome.artifact) return failGeneration(outcome.message ?? 'The Mastery Map could not be generated.')
        setGenerationPhase('saving')
        await waitForGenerationProgress()
        useStore.getState().update((draft) => {
          const records = draft.academics.classCenter.generatedMasteryOutlines
          records.unshift({ ...outcome.artifact!, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), order: records.length })
        })
        toast({ title: 'Mastery Map created', description: 'Saved in Materials with its selected-source trace.' })
      } else if (artifact === 'unit-question-bank') {
        const outcome = await generateUnitQuestionBank({ courseId, chunks: generationChunks, unit: selectedUnit, label: courseLabel, course: course ?? { code: courseLabel, title: courseLabel }, currentUnitPercent, practiceQuestionChunkIds: questionReferenceChunkIds, masteryStandardIds: matchingMasteryOutline?.standards.map((standard) => standard.id), visualFiles: selected.map((choice) => choice.file) })
        if (!outcome.ok || !outcome.artifact) return failGeneration(outcome.message ?? 'The question bank could not be generated.')
        setGenerationPhase('saving')
        await waitForGenerationProgress()
        useStore.getState().update((draft) => {
          const records = draft.academics.classCenter.generatedUnitQuestionBanks
          records.unshift({ ...outcome.artifact!, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), order: records.length })
          for (const fileId of outcome.artifact!.visualSourceFileIds ?? []) {
            const file = draft.academics.classCenter.files.find((item) => item.id === fileId)
            if (file?.sourceCoverage) {
              file.sourceCoverage.figureStatus = 'question-bank-reviewed'
              file.updatedAt = Date.now()
            }
          }
        })
        toast({ title: 'Question bank created', description: 'Saved in Materials with source, course-style, and integration traces.' })
      } else if (baseline) {
        const outcome = await generateRevisedNotes({ courseId, chunks: generationChunks, baselineFileId: baseline.file.id, baselineChunks: generationBaselineChunks, label: courseLabel })
        if (!outcome.ok || !outcome.artifact) {
          const description = outcome.message ?? 'The selected material could not be turned into source-linked notes.'
          setGenerationPhase('error')
          setGenerationError(description)
          toast({ title: 'Revised notes were not saved', description, tone: 'error' })
          return
        }
        setGenerationPhase('saving')
        await waitForGenerationProgress()
        useStore.getState().update((draft) => {
          const records = draft.academics.classCenter.generatedRevisedNotes
          records.unshift({ ...outcome.artifact!, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), order: records.length })
        })
        toast({ title: 'Revised notes created', description: 'Saved separately with its baseline and source trace.' })
      }
      setGenerationPhase('complete')
      await waitForGenerationProgress(520)
      onClose()
    } catch {
      failGeneration('Generation stopped unexpectedly. Nothing was saved, and your selected sources are still here.')
    } finally {
      generationLock.current = false
      setBusy(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-[0_16px_36px_-20px_rgba(0,0,0,0.62)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Create from selected material</p><h3 className="mt-1 font-display text-xl font-extrabold">{presentation.title}</h3><p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">{presentation.detail} Nothing outside this selection is used.</p></div>
          <Button size="icon" variant="ghost" aria-label="Close material selection" disabled={busy} onClick={onClose}><X className="size-4" /></Button>
        </div>

        {(artifact === 'study-guide' || artifact === 'study-outline') && lens && <section className="mt-4 rounded-2xl border border-border bg-muted/30 p-3.5" aria-label="Course lens for this output">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How this class reads material</p><p className="mt-1 font-display text-sm font-extrabold">Course lens</p><p className="mt-1 max-w-3xl text-sm font-semibold text-muted-foreground">{lens.text}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Sourceable from: {lensSourceFileIds.map((id) => choices.find((choice) => choice.file.id === id)?.file.title ?? 'Unavailable material').join(' · ')}</p></div><Button size="sm" variant={useCourseLens ? 'default' : 'outline'} aria-pressed={useCourseLens} disabled={!lensAvailable} onClick={() => setUseCourseLens((current) => !current)}>{useCourseLens ? 'Course lens included' : 'Include course lens'}</Button></div>
          {!lensAvailable && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Its supporting material is not ready in this output. Review the lens in Guide before using it.</p>}
          {useCourseLens && lensAvailable && <p className="mt-2 text-xs font-semibold text-muted-foreground">Its named evidence sources were added to this selected output and the saved guide will disclose the lens.</p>}
        </section>}

        {(artifact === 'unit-question-bank' || artifact === 'unit-mastery-outline') && <section className="mt-4 rounded-2xl border border-border bg-muted/30 p-3.5" aria-label="Resource scope settings">
          <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-[14rem] flex-1"><p className="font-display text-sm font-extrabold">{classType === 'writing' ? 'Assignment or reading scope' : 'Lecture, unit, or exam scope'}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{classType === 'stem' ? 'Name the lecture, unit, or exam scope. The Mastery Map is the standard map; the question bank uses it without duplicating the resource.' : 'Name the part of the course this resource should cover. Syllabus objectives stay primary; selected readings and class material provide the evidence.'}</p><div className="mt-3 flex gap-2">{artifact === 'unit-mastery-outline' && <label className="text-xs font-extrabold"><span className="sr-only">Mastery Map scope type</span><select aria-label="Mastery Map scope type" className="h-full rounded-lg border border-border bg-card px-2 py-2 text-sm" value={masteryScope} onChange={(event) => setMasteryScope(event.target.value as 'lecture' | 'unit' | 'exam')}><option value="lecture">Lecture</option><option value="unit">Unit</option><option value="exam">Exam</option></select></label>}<label className="block min-w-0 flex-1 text-xs font-extrabold"><span className="sr-only">Resource scope label</span><input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold" value={unitLabel} onChange={(event) => setUnitLabel(event.target.value)} placeholder={classType === 'writing' ? 'Essay 1 · Sources and evidence' : classType === 'general' ? 'Week 4 · Global institutions' : 'Unit 2 · Transcription and translation'} /></label></div>{artifact === 'unit-question-bank' && masteryOutlines.length > 0 && <p className="mt-2 text-xs font-semibold text-muted-foreground">{matchingMasteryOutline ? `Mastery Map linked · ${matchingMasteryOutline.standards.length} syllabus standards covered.` : 'Create or select a matching Mastery Map first for a closed standard-coverage check.'}</p>}</div>{artifact === 'unit-question-bank' && <label className="flex items-center gap-2 text-xs font-extrabold"><span>Current scope</span><select className="rounded-lg border border-border bg-card px-2 py-1.5" value={currentUnitPercent} onChange={(event) => setCurrentUnitPercent(Number(event.target.value))}><option value={100}>100%</option><option value={70}>70% · 30% prior</option><option value={50}>50% · 50% prior</option></select></label>}</div>
        </section>}
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <section className="rounded-2xl border border-border bg-muted/30 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-display font-extrabold">Choose evidence</p><p className="text-xs font-semibold text-muted-foreground">Ready sources form the map. Select only what may support this output.</p></div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" disabled={!ready.length || ready.every((choice) => selectedFileIds.includes(choice.file.id))} onClick={() => setSelectedFileIds(ready.map((choice) => choice.file.id))}>Select all ready</Button><Button size="sm" variant="ghost" disabled={!selectedFileIds.length} onClick={() => { setSelectedFileIds([]); setBaselineFileId('') }}>Clear</Button><Badge variant="outline">{selected.length} selected</Badge></div></div>
            {artifact === 'revised-notes' && <div className="mt-3 rounded-xl border border-border bg-card p-3"><p className="font-display text-sm font-extrabold">Your notes baseline</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Revised Notes starts from the notes you chose. It never guesses or replaces them.</p><div className="mt-3 flex flex-wrap gap-2">{ready.filter((choice) => choice.file.owner === 'mine').map((choice) => <Button key={choice.file.id} size="sm" variant={baselineFileId === choice.file.id ? 'default' : 'outline'} onClick={() => chooseBaseline(choice.file.id)}>{choice.file.title}</Button>)}{!ready.some((choice) => choice.file.owner === 'mine') && <p className="text-sm text-muted-foreground">Add your own notes as readable material, then return here.</p>}</div></div>}
            {ready.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{ready.map((choice) => {
              const chosen = selectedFileIds.includes(choice.file.id)
              const isBaseline = baselineFileId === choice.file.id
              return <button key={choice.file.id} type="button" aria-pressed={chosen} onClick={() => toggle(choice.file.id)} className={cn('rounded-[var(--radius-md)] border bg-card p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none', chosen ? 'border-primary shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_22%,transparent)]' : 'border-border hover:border-primary/45')}><div className="flex items-start justify-between gap-2"><FileText className="size-4 text-primary" />{isBaseline ? <Badge>Baseline</Badge> : chosen && <Check className="size-4 text-primary" />}</div><p className="mt-3 truncate font-display text-sm font-extrabold">{choice.file.title}</p><p className="mt-1 text-xs font-bold text-muted-foreground">{roleFor(choice.file)} · {choice.chunks.length} {choice.chunks.length === 1 ? 'passage' : 'passages'}</p></button>
            })}</div> : <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">No readable class material is ready yet. Add material inside this flow or paste one bounded excerpt. Premed OS will not fill the gap with general course content.</div>}
            {!!notReady.length && <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-3"><p className="font-display text-sm font-extrabold">Not ready for generation</p>{notReady.map((choice) => <p key={choice.file.id} className="mt-1 text-xs font-semibold text-muted-foreground"><b className="text-foreground">{choice.file.title}</b> is kept in Materials, but has no readable text yet. Add readable text or choose another source.</p>)}</div>}
          </section>
          <aside className="rounded-2xl border border-border bg-card p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">Add sources</p><p className="mt-1 font-display text-sm font-extrabold">Stay in this output</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Add individual files or a whole folder, then select exactly what this output may use.</p><div className="mt-4 grid gap-2"><MaterialIntakeDialog courseId={courseId} lectureId={lectureId} trigger={<Button size="sm" variant="outline" className="w-full"><FolderOpen className="size-4" /> Add files or folder</Button>} />{!lectureId && <TranscriptImport courseId={courseId} triggerClassName="w-full" />}</div><p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">Every saved output keeps its selected-source trace.</p></aside>
        </div>
        {generationPhase !== 'idle' && <div className="mt-4"><GenerationProgress phase={generationPhase} outputLabel={presentation.title} errorMessage={generationError} /></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"><p className="text-sm font-semibold text-muted-foreground">{unitScopeRequired && !selectedUnit ? 'Name the course scope to keep this resource organized.' : artifact === 'revised-notes' && !baseline ? 'Choose your notes baseline to continue.' : fullCorpusMessage ?? representativePassMessage ?? fullPacketMessage ?? (selectedChunks.length ? `${selected.length} selected ${selected.length === 1 ? 'source' : 'sources'} will ground this output.${courseLens ? ' Course lens included with its cited source trace.' : ''}` : 'Choose at least one ready source.')}</p><Button onClick={() => void generate()} disabled={busy || !canGenerate}><Sparkles className="size-4" /> {busy ? 'Creating…' : presentation.action}</Button></div>
      </CardContent>
    </Card>
  )
}
