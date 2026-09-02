import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Clipboard, Download, FileText, NotebookPen } from 'lucide-react'
import type { AcademicFile, ClassCenterData, SourceChunk } from '@/lib/types'
import { generateRevisedNotes } from '@/lib/academics/generateRevisedNotes'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GenerationProgress } from '@/components/academics/GenerationProgress'
import { startGenerationProgress, waitForGenerationProgress, type GenerationPhase } from '@/lib/generation/progress'

type MaterialChoice = { file: AcademicFile; chunks: SourceChunk[] }

function roleFor(file: AcademicFile) {
  if (file.type === 'transcript') return 'Lecture transcript'
  if (file.owner === 'mine') return 'My material'
  if (file.type === 'lecture-slides') return 'Course slides'
  return file.owner === 'course' ? 'Course material' : 'My material'
}

function downloadText(filename: string, text: string) {
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(anchor.href)
}

function renderNote(note: ClassCenterData['generatedRevisedNotes'][number]) {
  const lines = [
    `# ${note.title}`,
    '',
    `Generated from ${note.usedFileIds.length} of ${note.selectedFileIds.length} selected files · ${note.specId} (${note.specHash})`,
    note.baselineFileId ? `Baseline notes file: ${note.baselineFileId}` : '',
    '',
  ]
  for (const section of note.sections) {
    lines.push(`## ${section.title}`, '')
    for (const passage of section.passages) lines.push(passage.title ? `**${passage.title}**\n${passage.content}` : passage.content, '')
  }
  for (const difference of note.unresolvedDifferences) lines.push(`## ${difference.label}`, '', difference.detail, '')
  return lines.join('\n').trim()
}

/** Materials-owned repair of notes, not a second study-tools control strip. */
export function RevisedNotesPanel({ courseId, files, data }: {
  courseId: string
  files: AcademicFile[]
  data: ClassCenterData
}) {
  const toast = useToast()
  const allChunks = useStore((state) => state.academics.classCenter.sourceChunks)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [baselineFileId, setBaselineFileId] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const generationLock = useRef(false)
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [generationError, setGenerationError] = useState('')
  const choices = useMemo<MaterialChoice[]>(() => files.map((file) => ({
    file,
    chunks: allChunks.filter((chunk) => chunk.courseId === courseId && chunk.fileId === file.id && Boolean(chunk.content.trim())),
  })).filter((choice) => choice.chunks.length), [allChunks, courseId, files])
  const selectedChoices = choices.filter((choice) => selectedFileIds.includes(choice.file.id))
  const selectedChunks = selectedChoices.flatMap((choice) => choice.chunks)
  const baselineChoices = choices.filter((choice) => choice.file.owner === 'mine')
  const baselineChoice = baselineChoices.find((choice) => choice.file.id === baselineFileId)
  const notes = data.generatedRevisedNotes.filter((note) => note.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt)
  const latest = notes[0]

  function toggle(fileId: string) {
    setSelectedFileIds((current) => {
      if (fileId === baselineFileId) return current
      return current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]
    })
  }

  function chooseBaseline(fileId: string) {
    setBaselineFileId(fileId)
    setSelectedFileIds((current) => current.includes(fileId) ? current : [...current, fileId])
  }

  async function generate() {
    if (!baselineChoice || busy || generationLock.current) return
    generationLock.current = true
    setBusy(true)
    setGenerationError('')
    startGenerationProgress(setGenerationPhase)
    try {
      const outcome = await generateRevisedNotes({
        courseId,
        chunks: selectedChunks,
        baselineFileId: baselineChoice.file.id,
        baselineChunks: baselineChoice.chunks,
        label: selectedChoices.map((choice) => choice.file.title).join(', ') || 'Selected lecture material',
      })
      if (!outcome.ok || !outcome.artifact) {
        const description = outcome.message ?? 'The selected material could not be turned into a source-linked note.'
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
      setGenerationPhase('complete')
      toast({ title: 'Revised notes created', description: 'Saved as a separate material with its baseline and selected-source trace.' })
    } catch (error) {
      const description = error instanceof Error && error.message ? error.message : 'Generation stopped unexpectedly. Nothing was saved.'
      setGenerationPhase('error')
      setGenerationError(description)
      toast({ title: 'Revised notes were not saved', description, tone: 'error' })
    } finally {
      generationLock.current = false
      setBusy(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Study output</p>
          <CardTitle className="mt-1">Revise your lecture notes</CardTitle>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Choose the notes you wrote as the baseline, then select the transcript, course material, or excerpt that may fill supported gaps. Your original stays unchanged.</p>
        </div>
        {latest && <Badge variant="outline">{notes.length} saved</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        {!choices.length ? (
          <div className="rounded-[13px] border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
            Add or process your lecture material first. Revised Notes needs text from material you supplied; Premed OS will not fill a lecture with general course content.
          </div>
        ) : !baselineChoices.length ? (
          <div className="rounded-[13px] border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
            Add your own notes first, then return here to select them as the revision baseline. Other material remains available for a Study Guide or Mastery Map.
          </div>
        ) : <>
          <div className="rounded-[13px] border border-border bg-muted/45 p-3.5">
            <Label htmlFor="revised-notes-baseline" className="font-display text-sm font-extrabold">Your notes baseline</Label>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">This is an explicit choice. Premed OS does not guess which material represents your notes.</p>
            <Select value={baselineFileId} onValueChange={chooseBaseline}>
              <SelectTrigger id="revised-notes-baseline" className="mt-3 max-w-xl"><SelectValue placeholder="Choose the notes you wrote" /></SelectTrigger>
              <SelectContent>{baselineChoices.map(({ file, chunks }) => <SelectItem key={file.id} value={file.id}>{file.title} · {chunks.length} {chunks.length === 1 ? 'passage' : 'passages'}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div aria-label="Select supporting sources for revised notes">
            <div className="flex items-baseline justify-between gap-3"><p className="font-display text-sm font-extrabold">Supporting sources</p><p className="text-xs font-semibold text-muted-foreground">Select only what this revision may use.</p></div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {choices.map(({ file, chunks }) => {
                const selected = selectedFileIds.includes(file.id)
                const baseline = file.id === baselineFileId
                return <button key={file.id} type="button" aria-pressed={selected} onClick={() => toggle(file.id)} className={cn(
                  'rounded-[13px] border bg-muted p-3 text-left transition duration-150 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                  selected ? 'border-[color-mix(in_srgb,var(--cat-gpa)_48%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--cat-gpa)_18%,transparent)]' : 'border-border hover:border-[color-mix(in_srgb,var(--cat-gpa)_45%,var(--border))]',
                )}>
                  <div className="flex items-start justify-between gap-2"><FileText className="size-4 text-[var(--cat-gpa)]" />{baseline ? <Badge className="text-[9px]">Baseline</Badge> : selected && <Check className="size-4 text-[var(--cat-gpa)]" />}</div>
                  <p className="mt-3 truncate font-display text-sm font-extrabold">{file.title}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{roleFor(file)} · {chunks.length} {chunks.length === 1 ? 'passage' : 'passages'}</p>
                </button>
              })}
            </div>
          </div>

          {generationPhase !== 'idle' && <GenerationProgress phase={generationPhase} outputLabel="Revised notes" errorMessage={generationError} />}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[13px] border border-border bg-muted/25 p-3.5">
            <p className="text-sm font-semibold text-muted-foreground">{baselineChoice ? <><b className="text-foreground">{baselineChoice.file.title}</b> stays the starting record. {selectedChoices.length} selected {selectedChoices.length === 1 ? 'source' : 'sources'} may support it.</> : 'Choose your notes baseline to begin.'}</p>
            <Button size="sm" onClick={() => void generate()} disabled={busy || !baselineChoice || !selectedChunks.length}><NotebookPen className="size-4" /> {busy ? 'Creating…' : 'Create revised notes'}</Button>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">Study Guide and Mastery Map remain separate source-backed outputs in Materials.</p>
        </>}

        {latest && <RevisedNotesResult note={latest} files={files} onToast={(title, description) => toast({ title, description })} />}
      </CardContent>
    </Card>
  )
}

function RevisedNotesResult({ note, files, onToast }: {
  note: ClassCenterData['generatedRevisedNotes'][number]
  files: AcademicFile[]
  onToast: (title: string, description: string) => void
}) {
  const byId = new Map(files.map((file) => [file.id, file]))
  const sourceLabel = (fileId: string) => byId.get(fileId)?.title ?? 'Selected source'
  const content = renderNote(note)
  async function copy() {
    try {
      await navigator.clipboard.writeText(content)
      onToast('Copied revised notes', 'The source-linked text is on your clipboard.')
    } catch {
      onToast('Copy could not start', 'Use the local Markdown download instead.')
    }
  }
  return <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--success)]">Generated · source-linked</p><h3 className="mt-1 font-display text-xl font-extrabold">{note.title}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Built from {note.usedFileIds.length} of {note.selectedFileIds.length} selected files.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void copy()}><Clipboard className="size-4" /> Copy</Button><Button size="sm" variant="outline" onClick={() => downloadText(`${note.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'revised-notes'}.md`, content)}><Download className="size-4" /> Markdown</Button></div></div>
      <div className="mt-5 space-y-5">
        {note.sections.map((section) => <section key={section.id}><h4 className="font-display text-base font-extrabold">{section.title}</h4><div className="mt-2 space-y-3">{section.passages.map((passage) => <div key={passage.id} className="rounded-r-xl border-l-2 border-[color-mix(in_srgb,var(--success)_55%,transparent)] bg-white/[0.025] px-3 py-2.5"><p className="text-sm font-semibold leading-relaxed">{passage.title && <strong className="font-display">{passage.title} · </strong>}{passage.content}</p><p className="mt-2 text-xs font-bold text-muted-foreground">Sources: {[...new Set(passage.sourceRefs.map((ref) => sourceLabel(ref.fileId)))].join(' · ')}</p></div>)}</div></section>)}
        {note.unresolvedDifferences.map((difference) => <div key={difference.id} className="rounded-xl border border-amber-500/35 bg-amber-500/8 p-3"><div className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" /><div><p className="font-display text-sm font-extrabold">{difference.label}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{difference.detail}</p><p className="mt-2 text-xs font-bold text-muted-foreground">Compare: {[...new Set(difference.sourceRefs.map((ref) => sourceLabel(ref.fileId)))].join(' · ')}</p></div></div></div>)}
      </div>
    </article>
    <aside className="rounded-[13px] border border-border bg-muted p-4 text-sm"><p className="font-display font-extrabold">Source trace</p><p className="mt-1 text-xs font-bold text-muted-foreground">{note.specId} · {note.specHash}</p>{note.baselineFileId && <div className="mt-4"><p className="font-extrabold">Notes baseline</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{sourceLabel(note.baselineFileId)}</p></div>}<div className="mt-4 space-y-3"><div><p className="font-extrabold">Used</p>{note.usedFileIds.map((id) => <p key={id} className="mt-1 text-xs font-semibold text-muted-foreground">{sourceLabel(id)}</p>)}</div>{note.unusedFileIds.length > 0 && <div><p className="font-extrabold">Selected, not used</p>{note.unusedFileIds.map((id) => <p key={id} className="mt-1 text-xs font-semibold text-muted-foreground">{sourceLabel(id)}</p>)}</div>}</div><p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">This is a generated record beside your materials. It never overwrites them.</p></aside>
  </div>
}
