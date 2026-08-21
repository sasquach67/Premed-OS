import { useMemo, useState } from 'react'
import { Check, FileText, Sparkles, X } from 'lucide-react'
import type { AcademicFile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateFlashcards } from '@/lib/academics/generateFlashcards'
import { generateRevisedNotes } from '@/lib/academics/generateRevisedNotes'
import { useStore } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PastedExcerptDialog } from '@/components/academics/PastedExcerptDialog'

export type MaterialArtifact = 'study-guide' | 'flashcards' | 'revised-notes'

const ARTIFACT: Record<MaterialArtifact, { title: string; detail: string; action: string }> = {
  'study-guide': { title: 'Study guide', detail: 'Organize only the material you select.', action: 'Generate study guide' },
  flashcards: { title: 'Flashcards', detail: 'Create a source-grounded deck for one-way Anki export.', action: 'Generate flashcards' },
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
  artifact, courseId, courseLabel, files, onClose, onAddMaterial,
}: {
  artifact: MaterialArtifact
  courseId: string
  courseLabel: string
  files: AcademicFile[]
  onClose: () => void
  onAddMaterial: () => void
}) {
  const toast = useToast()
  const allChunks = useStore((state) => state.academics.classCenter.sourceChunks)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [baselineFileId, setBaselineFileId] = useState('')
  const [busy, setBusy] = useState(false)
  const choices = useMemo(() => files.map((file) => ({
    file,
    chunks: allChunks.filter((chunk) => chunk.courseId === courseId && chunk.fileId === file.id && Boolean(chunk.content.trim())),
  })), [allChunks, courseId, files])
  const ready = choices.filter((choice) => choice.chunks.length)
  const notReady = choices.filter((choice) => !choice.chunks.length)
  const selected = ready.filter((choice) => selectedFileIds.includes(choice.file.id))
  const selectedChunks = selected.flatMap((choice) => choice.chunks)
  const baseline = ready.find((choice) => choice.file.id === baselineFileId && choice.file.owner === 'mine')
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
      if (artifact === 'study-guide') {
        const outcome = await generateStudyGuide({ courseId, chunks: selectedChunks, label: courseLabel })
        if (!outcome.ok) return toast({ title: 'Nothing was saved', description: outcome.message ?? 'The guide could not be generated.', tone: 'error' })
        useStore.getState().update((draft) => {
          const notes = draft.academics.classCenter.notes
          notes.unshift({ id: uid(), courseId, title: outcome.title!, type: 'study-guide', kind: 'about-class', date: isoToday(), unit: '', topicIds: [], content: `${outcome.content}\n\n---\nGenerated from your selected material · spec ${outcome.specHash}`, syncStatus: 'local-only', linkedFileIds: outcome.fileIds ?? [], createdAt: Date.now(), updatedAt: Date.now(), order: notes.length })
        })
        toast({ title: 'Study guide generated', description: 'Saved with its selected-source trace.' })
      } else if (artifact === 'flashcards') {
        const outcome = await generateFlashcards({ courseId, chunks: selectedChunks, label: courseLabel })
        if (!outcome.ok || !outcome.cards || !outcome.specHash) return toast({ title: 'Nothing was saved', description: outcome.message ?? 'Flashcards could not be generated.', tone: 'error' })
        useStore.getState().update((draft) => {
          const decks = draft.academics.classCenter.generatedFlashcardDecks
          decks.unshift({ id: uid(), courseId, title: `${courseLabel} flashcards`, sourceChunkIds: selectedChunks.map((chunk) => chunk.id), specId: 'flashcards-v1', specHash: outcome.specHash!, cards: outcome.cards!, createdAt: Date.now(), updatedAt: Date.now(), order: decks.length })
        })
        toast({ title: 'Flashcards generated', description: 'Saved as a source-grounded deck. Export it to Anki when ready.' })
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
          <aside className="rounded-2xl border border-border bg-card p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">Add a source</p><p className="mt-1 font-display text-sm font-extrabold">Stay in this output</p><p className="mt-1 text-xs font-semibold text-muted-foreground">New material returns here; it is never silently selected.</p><div className="mt-4 grid gap-2"><Button size="sm" variant="outline" onClick={onAddMaterial}>Add course material</Button><PastedExcerptDialog courseId={courseId} triggerClassName="w-full" /></div><p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">Flashcards export one way to Anki. Premed OS never reviews or schedules them.</p></aside>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"><p className="text-sm font-semibold text-muted-foreground">{artifact === 'revised-notes' && !baseline ? 'Choose your notes baseline to continue.' : selectedChunks.length ? `${selected.length} selected ${selected.length === 1 ? 'source' : 'sources'} will ground this output.` : 'Choose at least one ready source.'}</p><Button onClick={() => void generate()} disabled={busy || !canGenerate}><Sparkles className="size-4" /> {busy ? 'Creating…' : ARTIFACT[artifact].action}</Button></div>
      </CardContent>
    </Card>
  )
}
