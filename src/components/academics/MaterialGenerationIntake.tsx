import { useMemo, useState } from 'react'
import { Check, FileText, Sparkles, X } from 'lucide-react'
import type { AcademicFile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateFlashcards } from '@/lib/academics/generateFlashcards'
import { generateRevisedNotes } from '@/lib/academics/generateRevisedNotes'
import {
  materialGenerationChoices,
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

export type MaterialArtifact = 'flashcards' | 'study-guide' | 'study-outline' | 'revised-notes'

const ARTIFACT: Record<MaterialArtifact, { title: string; detail: string; action: string }> = {
  flashcards: { title: 'Flashcards', detail: 'Create a source-grounded deck from only the material you select.', action: 'Create flashcards' },
  'study-guide': { title: 'Study guide', detail: 'Organize only the material you select.', action: 'Generate study guide' },
  'study-outline': { title: 'Study outline', detail: 'Turn selected evidence into a concise objective-led outline.', action: 'Create study outline' },
  'revised-notes': { title: 'Revised Notes', detail: 'Repair your chosen notes without replacing the original.', action: 'Create revised notes' },
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

export function MaterialGenerationIntake({
  artifact, courseId, courseLabel, files, lectureId, onClose,
}: {
  artifact: MaterialArtifact
  courseId: string
  courseLabel: string
  files: AcademicFile[]
  lectureId?: string
  onClose: () => void
}) {
  const toast = useToast()
  const allChunks = useStore((state) => state.academics.classCenter.sourceChunks)
  const workspace = useStore((state) => state.academics.classCenter.workspaces.find((item) => item.courseId === courseId))
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [baselineFileId, setBaselineFileId] = useState('')
  const [busy, setBusy] = useState(false)
  const [useCourseLens, setUseCourseLens] = useState(false)
  const choices = useMemo(() => materialGenerationChoices({ courseId, files, chunks: allChunks }), [allChunks, courseId, files])
  const ready = choices.filter((choice) => choice.chunks.length)
  const notReady = choices.filter((choice) => !choice.chunks.length)
  const lens = workspace?.courseLens
  const lensSourceFileIds = lens?.sourceFileIds ?? []
  const lensSourceChunkIds = new Set(lens?.sourceChunkIds ?? [])
  const lensAvailable = Boolean(lens?.text.trim() && lensSourceFileIds.length && lensSourceChunkIds.size
    && lensSourceFileIds.every((id) => ready.some((choice) => choice.file.id === id))
    && [...lensSourceChunkIds].every((id) => allChunks.some((chunk) => chunk.id === id && chunk.courseId === courseId)))
  const effectiveSelectedFileIds = useMemo(() => (artifact === 'study-guide' || artifact === 'study-outline') && useCourseLens && lensAvailable
    ? [...new Set([...selectedFileIds, ...lensSourceFileIds])]
    : selectedFileIds, [artifact, lensAvailable, lensSourceFileIds, selectedFileIds, useCourseLens])
  const selectedChunks = selectedMaterialChunks(choices, effectiveSelectedFileIds)
  const selected = ready.filter((choice) => effectiveSelectedFileIds.includes(choice.file.id))
  const baseline = selectedNotesBaseline(choices, baselineFileId, effectiveSelectedFileIds)
  const courseLens = artifact === 'study-guide' || artifact === 'study-outline'
    ? applicableCourseLens(lens, selectedChunks, Object.fromEntries(choices.map((choice) => [choice.file.id, choice.file.title])))
    : undefined
  const canGenerate = selectedChunks.length > 0 && (artifact !== 'revised-notes' || Boolean(baseline))

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
    if (!canGenerate) return
    setBusy(true)
    try {
      if (artifact === 'flashcards') {
        const outcome = await generateFlashcards({ courseId, chunks: selectedChunks, label: courseLabel })
        if (!outcome.ok || !outcome.cards || !outcome.specHash) return toast({ title: 'Nothing was saved', description: outcome.message ?? 'Flashcards could not be generated.', tone: 'error' })
        useStore.getState().update((draft) => {
          const decks = draft.academics.classCenter.generatedFlashcardDecks
          decks.unshift({ id: uid(), courseId, title: `${courseLabel} flashcards`, sourceChunkIds: selectedChunks.map((chunk) => chunk.id), specId: 'flashcards-v1', specHash: outcome.specHash!, cards: outcome.cards!, createdAt: Date.now(), updatedAt: Date.now(), order: decks.length })
        })
        toast({ title: 'Flashcards created', description: 'Saved in Materials with the selected-source trace.' })
      } else if (artifact === 'study-guide' || artifact === 'study-outline') {
        const outcome = await generateStudyGuide({ courseId, chunks: selectedChunks, label: courseLabel, courseLens })
        if (!outcome.ok) return toast({ title: 'Nothing was saved', description: outcome.message ?? 'The study material could not be generated.', tone: 'error' })
        useStore.getState().update((draft) => {
          const notes = draft.academics.classCenter.notes
          const lensTrace = outcome.courseLens
            ? `\n\nCourse lens used\n${outcome.courseLens.text}\nSourceable from: ${outcome.courseLens.sourceLabels.join(' · ')}`
            : ''
          const isOutline = artifact === 'study-outline'
          notes.unshift({ id: uid(), courseId, title: isOutline ? `Study outline · ${outcome.title!}` : outcome.title!, type: 'study-guide', kind: 'on-material', date: isoToday(), unit: '', topicIds: [], content: `${isOutline ? 'STUDY OUTLINE\n\n' : ''}${outcome.content}${lensTrace}\n\n---\nGenerated from your selected material · spec ${outcome.specHash}`, syncStatus: 'local-only', linkedFileIds: outcome.fileIds ?? [], createdAt: Date.now(), updatedAt: Date.now(), order: notes.length })
        })
        toast({ title: artifact === 'study-outline' ? 'Study outline created' : 'Study guide generated', description: outcome.courseLens ? 'Saved with its selected-source and Course lens traces.' : 'Saved with its selected-source trace.' })
      } else if (baseline) {
        const outcome = await generateRevisedNotes({ courseId, chunks: selectedChunks, baselineFileId: baseline.file.id, baselineChunks: baseline.chunks, label: courseLabel })
        if (!outcome.ok || !outcome.artifact) return toast({ title: 'Revised notes were not saved', description: outcome.message ?? 'The selected material could not be turned into source-linked notes.', tone: 'error' })
        useStore.getState().update((draft) => {
          const records = draft.academics.classCenter.generatedRevisedNotes
          records.unshift({ ...outcome.artifact!, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), order: records.length })
        })
        toast({ title: 'Revised notes created', description: 'Saved separately with its baseline and source trace.' })
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-[0_16px_36px_-20px_rgba(0,0,0,0.62)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Create from selected material</p><h3 className="mt-1 font-display text-xl font-extrabold">{ARTIFACT[artifact].title}</h3><p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">{ARTIFACT[artifact].detail} Nothing outside this selection is used.</p></div>
          <Button size="icon" variant="ghost" aria-label="Close material selection" onClick={onClose}><X className="size-4" /></Button>
        </div>

        {(artifact === 'study-guide' || artifact === 'study-outline') && lens && <section className="mt-4 rounded-2xl border border-border bg-muted/30 p-3.5" aria-label="Course lens for this output">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How this class reads material</p><p className="mt-1 font-display text-sm font-extrabold">Course lens</p><p className="mt-1 max-w-3xl text-sm font-semibold text-muted-foreground">{lens.text}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">Sourceable from: {lensSourceFileIds.map((id) => choices.find((choice) => choice.file.id === id)?.file.title ?? 'Unavailable material').join(' · ')}</p></div><Button size="sm" variant={useCourseLens ? 'default' : 'outline'} aria-pressed={useCourseLens} disabled={!lensAvailable} onClick={() => setUseCourseLens((current) => !current)}>{useCourseLens ? 'Course lens included' : 'Include course lens'}</Button></div>
          {!lensAvailable && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Its supporting material is not ready in this output. Review the lens in Guide before using it.</p>}
          {useCourseLens && lensAvailable && <p className="mt-2 text-xs font-semibold text-muted-foreground">Its named evidence sources were added to this selected output and the saved guide will disclose the lens.</p>}
        </section>}

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <section className="rounded-2xl border border-border bg-muted/30 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-display font-extrabold">Choose evidence</p><p className="text-xs font-semibold text-muted-foreground">Ready sources form the map. Select only what may support this output.</p></div><Badge variant="outline">{selected.length} selected</Badge></div>
            {artifact === 'revised-notes' && <div className="mt-3 rounded-xl border border-border bg-card p-3"><p className="font-display text-sm font-extrabold">Your notes baseline</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Revised Notes starts from the notes you chose. It never guesses or replaces them.</p><div className="mt-3 flex flex-wrap gap-2">{ready.filter((choice) => choice.file.owner === 'mine').map((choice) => <Button key={choice.file.id} size="sm" variant={baselineFileId === choice.file.id ? 'default' : 'outline'} onClick={() => chooseBaseline(choice.file.id)}>{choice.file.title}</Button>)}{!ready.some((choice) => choice.file.owner === 'mine') && <p className="text-sm text-muted-foreground">Add your own notes as readable material, then return here.</p>}</div></div>}
            {ready.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{ready.map((choice) => {
              const chosen = selectedFileIds.includes(choice.file.id)
              const isBaseline = baselineFileId === choice.file.id
              return <button key={choice.file.id} type="button" aria-pressed={chosen} onClick={() => toggle(choice.file.id)} className={cn('rounded-[var(--radius-md)] border bg-card p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none', chosen ? 'border-primary shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_22%,transparent)]' : 'border-border hover:border-primary/45')}><div className="flex items-start justify-between gap-2"><FileText className="size-4 text-primary" />{isBaseline ? <Badge>Baseline</Badge> : chosen && <Check className="size-4 text-primary" />}</div><p className="mt-3 truncate font-display text-sm font-extrabold">{choice.file.title}</p><p className="mt-1 text-xs font-bold text-muted-foreground">{roleFor(choice.file)} · {choice.chunks.length} {choice.chunks.length === 1 ? 'passage' : 'passages'}</p></button>
            })}</div> : <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">No readable class material is ready yet. Add material inside this flow or paste one bounded excerpt. Premed OS will not fill the gap with general course content.</div>}
            {!!notReady.length && <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-3"><p className="font-display text-sm font-extrabold">Not ready for generation</p>{notReady.map((choice) => <p key={choice.file.id} className="mt-1 text-xs font-semibold text-muted-foreground"><b className="text-foreground">{choice.file.title}</b> is kept in Materials, but has no readable text yet. Add readable text or choose another source.</p>)}</div>}
          </section>
          <aside className="rounded-2xl border border-border bg-card p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">Add a source</p><p className="mt-1 font-display text-sm font-extrabold">Stay in this output</p><p className="mt-1 text-xs font-semibold text-muted-foreground">New material returns here; it is never silently selected.</p><div className="mt-4 grid gap-2"><MaterialIntakeDialog courseId={courseId} lectureId={lectureId} trigger={<Button size="sm" variant="outline" className="w-full">Add material</Button>} />{!lectureId && <TranscriptImport courseId={courseId} triggerClassName="w-full" />}</div><p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">Every saved output keeps its selected-source trace.</p></aside>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"><p className="text-sm font-semibold text-muted-foreground">{artifact === 'revised-notes' && !baseline ? 'Choose your notes baseline to continue.' : selectedChunks.length ? `${selected.length} selected ${selected.length === 1 ? 'source' : 'sources'} will ground this output.${courseLens ? ' Course lens included with its cited source trace.' : ''}` : 'Choose at least one ready source.'}</p><Button onClick={() => void generate()} disabled={busy || !canGenerate}><Sparkles className="size-4" /> {busy ? 'Creating…' : ARTIFACT[artifact].action}</Button></div>
      </CardContent>
    </Card>
  )
}
