import { useId, useState } from 'react'
import { BookOpen, Brain, CheckCircle2, EyeOff } from 'lucide-react'
import type { ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Outline = ClassCenterData['generatedMasteryOutlines'][number]
type Standard = Outline['standards'][number]
type MasteryState = NonNullable<Standard['masteryState']>
type LearningMode = 'outline' | 'recall'

const readiness: Record<MasteryState, string> = {
  'not-started': 'Not started',
  'can-explain': 'Can explain',
  'can-apply-without-notes': 'Can apply without notes',
}

function studentText(text: string) {
  return text.replace(/\s+provenance:\s*(?:source|clarification|background)\s*$/i, '')
}

function SourceDetails({ ids, chunks }: { ids: string[]; chunks: SourceChunk[] }) {
  const files = useStore((state) => state.academics.classCenter.files)
  if (!ids.length) return null

  return (
    <details className="mt-4 text-xs text-muted-foreground">
      <summary className="w-fit cursor-pointer rounded-md py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sources</summary>
      <div className="mt-2 space-y-3">
        {[...new Set(ids)].map((id) => {
          const chunk = chunks.find((item) => item.id === id)
          const file = files.find((item) => item.id === chunk?.fileId)
          return (
            <blockquote key={id} data-source-chunk-id={id} className="border-l-2 border-border pl-3 leading-6">
              <p className="font-bold">{file?.fileName ?? file?.title ?? 'Source passage'}{chunk?.sourcePosition?.label ? ` · ${chunk.sourcePosition.label}` : ''}</p>
              <p className="whitespace-pre-wrap break-words">{chunk?.content ?? 'This source is no longer available.'}</p>
            </blockquote>
          )
        })}
      </div>
    </details>
  )
}

function MasterySection({ label, items, caution = false }: { label: string; items: string[]; caution?: boolean }) {
  if (!items.length) return null
  return (
    <section className={cn(caution && 'rounded-xl border-l-4 border-amber-500 bg-muted p-4')}>
      <h4 className="text-sm font-extrabold">{label}</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 marker:text-primary">
        {items.map((item, index) => <li key={index}>{studentText(item)}</li>)}
      </ul>
    </section>
  )
}

function ObjectiveChecklist({ standard, chunks }: { standard: Standard; chunks: SourceChunk[] }) {
  return (
    <div className="space-y-6">
      <MasterySection label="Understand" items={standard.understand} />
      <MasterySection label="Be able to do" items={standard.beAbleToDo} />
      <MasterySection label="Watch for on an exam" items={standard.watchFor} caution />
      <section aria-label={`Exam practice for ${standard.title}`} data-testid={`exam-practice-${standard.id}`} className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-lg font-extrabold">Apply the objective</h4>
          <Badge variant="secondary">Generated practice</Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Original practice built from the selected sources—not an instructor-authored question, exam prediction, or readiness score.</p>
        {standard.examPractice?.length ? standard.examPractice.map((question, index) => (
          <article key={index} className="mt-4 rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-primary">Application {index + 1}</p>
            <p className="mt-2 whitespace-pre-wrap text-base leading-7">{studentText(question.prompt)}</p>
            <details data-testid={`practice-solution-${standard.id}-${index}`} className="mt-3">
              <summary className="w-fit cursor-pointer rounded py-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring">Show answer and working</summary>
              <div className="mt-2 space-y-3 text-sm leading-7">
                <p><b>Answer: </b>{studentText(question.answer)}</p>
                <p><b>Working: </b>{studentText(question.rationale)}</p>
                <SourceDetails ids={question.sourceChunkIds} chunks={chunks} />
              </div>
            </details>
          </article>
        )) : (
          <div data-testid={`legacy-practice-${standard.id}`} className="mt-3 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-bold">Use the application targets above</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">This earlier saved map has no generated application questions or worked answers. Its “Be able to do” targets remain available for practice.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function SelfAssessment({ standard, onChange }: { standard: Standard; onChange: (state: MasteryState) => void }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
      <div>
        <p className="text-sm font-bold">Record what you can do now</p>
        <p className="mt-1 text-xs text-muted-foreground">This is your judgment, not an automatic score.</p>
      </div>
      <Select value={standard.masteryState ?? 'not-started'} onValueChange={(value) => onChange(value as MasteryState)}>
        <SelectTrigger className="h-11 w-full sm:w-60" aria-label={`Mastery state for ${standard.title}`}><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(readiness).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

function ModeChoice({ mode, value, title, purpose, noteState, onChoose }: {
  mode: LearningMode
  value: LearningMode
  title: string
  purpose: string
  noteState: string
  onChoose: (value: LearningMode) => void
}) {
  const active = mode === value
  const Icon = value === 'outline' ? BookOpen : Brain
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChoose(value)}
      className={cn(
        'group min-h-28 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && value === 'outline' && 'border-primary bg-primary/5',
        active && value === 'recall' && 'border-amber-500 bg-amber-500/5',
        !active && 'border-border bg-card hover:bg-muted/60',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground', active && value === 'outline' && 'bg-primary text-primary-foreground', active && value === 'recall' && 'bg-amber-500 text-white')}><Icon className="size-4" /></span>
        <Badge variant="outline" className="shrink-0">{noteState}</Badge>
      </span>
      <span className="mt-3 block font-bold text-foreground">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{purpose}</span>
    </button>
  )
}

export function MasteryMapView({ outline, chunks, lecture }: { outline?: Outline; chunks: SourceChunk[]; lecture: LectureRecord }) {
  const [mode, setMode] = useState<LearningMode>('outline')
  const prefix = useId()

  if (!outline) {
    return <Card><CardContent className="p-6"><h2 className="text-xl font-extrabold">No Mastery Map yet</h2><p className="mt-2 text-sm text-muted-foreground">Add or link course objectives, then rebuild this lecture to create the outline and recall practice.</p></CardContent></Card>
  }

  const applied = outline.standards.filter((standard) => standard.masteryState === 'can-apply-without-notes').length
  const explained = outline.standards.filter((standard) => standard.masteryState === 'can-explain').length
  const scopeLabel = outline.scope ? `${outline.scope[0].toUpperCase()}${outline.scope.slice(1)} scope` : 'Legacy unit scope'
  const outlineId = outline.id

  function setMastery(id: string, state: MasteryState) {
    useStore.getState().update((draft) => {
      const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outlineId)
      const standard = record?.standards.find((item) => item.id === id)
      if (record && standard) {
        standard.masteryState = state
        record.updatedAt = Date.now()
      }
    })
  }

  function openObjective(id: string) {
    const target = document.getElementById(`${prefix}-${id}`)
    if (target?.getAttribute('data-state') === 'closed') target.click()
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-bold text-primary">Mastery Map</p>
        <h2 className="mt-2 text-3xl font-extrabold">{mode === 'outline' ? 'Learn the map' : 'Practice from memory'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {mode === 'outline'
            ? 'Keep your notes open. Learn what each objective means, what you must be able to do, and which traps to recognize.'
            : 'Close your notes. Answer first, reveal the teaching checklist afterward, then record what you can do.'}
        </p>
        <section aria-label="Choose how to study" className="mt-5 grid gap-3 sm:grid-cols-2">
          <ModeChoice mode={mode} value="outline" title="Mastery outline" purpose="Learn and check every concept, application, and exam trap." noteState="Notes open" onChoose={setMode} />
          <ModeChoice mode={mode} value="recall" title="Active recall" purpose="Attempt an objective from memory before seeing the checklist." noteState="Notes closed" onChoose={setMode} />
        </section>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <span>{applied} of {outline.standards.length} can apply without notes · {explained} can explain</span>
          <span>Student-recorded progress</span>
        </div>
        <Progress value={outline.standards.length ? applied / outline.standards.length * 100 : 0} aria-label="Objectives marked can apply without notes" className="mt-2 h-2" />
      </header>

      <nav aria-label="Mastery objectives" className="rounded-xl border border-border p-4">
        <p className="mb-3 text-xs font-bold text-muted-foreground">{mode === 'outline' ? 'Objectives in this outline' : 'Choose a closed-notes prompt'}</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {outline.standards.map((standard, index) => (
            <li key={standard.id}>
              <button type="button" className="flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openObjective(standard.id)}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-extrabold text-primary" aria-hidden="true">{index + 1}</span>
                <span>{standard.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Card>
        <CardContent className="px-4 py-0 sm:px-6">
          <Accordion key={`${outline.id}:${mode}`} type="multiple" defaultValue={mode === 'outline' ? outline.standards.map((standard) => standard.id) : outline.standards[0] ? [outline.standards[0].id] : []}>
            {outline.standards.map((standard, index) => (
              <AccordionItem key={standard.id} value={standard.id}>
                <AccordionTrigger id={`${prefix}-${standard.id}`} className="scroll-mt-4 items-center py-5 hover:no-underline">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-primary">{standard.masteryState === 'can-apply-without-notes' ? <CheckCircle2 className="size-4" /> : index + 1}</span>
                    <span className="min-w-0"><span className="block text-lg font-extrabold">{standard.title}</span><span className="mt-1 block text-xs text-muted-foreground">{readiness[standard.masteryState ?? 'not-started']}</span></span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  {mode === 'outline' ? (
                    <>
                      <ObjectiveChecklist standard={standard} chunks={chunks} />
                      <SelfAssessment standard={standard} onChange={(state) => setMastery(standard.id, state)} />
                      <SourceDetails ids={standard.sourceChunkIds} chunks={chunks} />
                    </>
                  ) : (
                    <>
                      <section aria-label={`Closed-notes prompt for ${standard.title}`} className="rounded-xl border-l-4 border-amber-500 bg-muted p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-extrabold">Try before you reveal</h3><Badge variant="outline"><EyeOff className="mr-1 size-3" />Notes closed</Badge></div>
                        <p className="mt-2 text-sm text-muted-foreground">Answer aloud or on a blank page. Explain the “why,” not only the vocabulary.</p>
                        <ul className="mt-3 space-y-3 text-base leading-7">{(standard.freeRecallCues?.length ? standard.freeRecallCues : [standard.title]).map((cue, cueIndex) => <li key={cueIndex}>{studentText(cue)}</li>)}</ul>
                      </section>
                      <details data-testid={`recall-reveal-${standard.id}`} className="mt-4 rounded-xl border border-border">
                        <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring">Reveal after trying</summary>
                        <div className="border-t border-border p-5">
                          <p className="mb-5 text-xs font-bold text-primary">Compare your answer with the teaching checklist</p>
                          <ObjectiveChecklist standard={standard} chunks={chunks} />
                          <SelfAssessment standard={standard} onChange={(state) => setMastery(standard.id, state)} />
                          <SourceDetails ids={standard.sourceChunkIds} chunks={chunks} />
                        </div>
                      </details>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{lecture.title} · {scopeLabel}</p>
    </div>
  )
}
