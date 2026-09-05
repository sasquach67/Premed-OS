import { useId, useRef, useState, type ReactNode } from 'react'
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { AcademicFile, ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import type { ContentBlock, RichText, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Outline = ClassCenterData['generatedMasteryOutlines'][number]
const readiness = { 'not-started': 'Not started', 'can-explain': 'Can explain', 'can-apply-without-notes': 'Can apply without notes' } as const

function studentText(text: string) { return text.replace(/\s+provenance:\s*(?:source|clarification|background)\s*$/i, '') }

function StudyText({ value }: { value: RichText }) {
  const terms = value.emphasis?.map((span) => span.text).filter(Boolean) ?? []
  if (!terms.length) return <>{value.content}</>
  const pieces: ReactNode[] = []
  let cursor = 0
  while (cursor < value.content.length) {
    const next = terms.map((term) => ({ term, at: value.content.indexOf(term, cursor) })).filter(({ at }) => at >= 0).sort((a, b) => a.at - b.at || b.term.length - a.term.length)[0]
    if (!next) { pieces.push(value.content.slice(cursor)); break }
    pieces.push(value.content.slice(cursor, next.at), <strong key={next.at} className="font-extrabold text-foreground">{next.term}</strong>)
    cursor = next.at + next.term.length
  }
  return <>{pieces}</>
}

function SourceDetails({ ids, chunks, files = [] }: { ids: string[]; chunks: SourceChunk[]; files?: AcademicFile[] }) {
  const storedFiles = useStore((state) => state.academics.classCenter.files)
  if (!ids.length) return null
  const sourceFiles = files.length ? files : storedFiles
  return <details className="mt-4 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded-md py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sources</summary><div className="mt-2 space-y-3">{[...new Set(ids)].map((id) => {
    const chunk = chunks.find((item) => item.id === id)
    const file = sourceFiles.find((item) => item.id === chunk?.fileId)
    return <blockquote key={id} data-source-chunk-id={id} className="border-l-2 border-border pl-3 leading-6"><p className="font-bold">{file?.fileName ?? file?.title ?? 'Source passage'}{chunk?.sourcePosition?.label ? ` · ${chunk.sourcePosition.label}` : ''}</p><p className="whitespace-pre-wrap break-words">{chunk?.content ?? 'This source is no longer available.'}</p></blockquote>
  })}</div></details>
}

function GuideBlock({ block }: { block: ContentBlock }) {
  const labels: Partial<Record<ContentBlock['type'], string>> = { must_understand: 'Understand this', must_memorize: 'Commit to memory', recall: 'Try without notes', contradiction: 'Conflicting explanations', gap: 'Still unclear', callout: 'Take note' }
  const label = labels[block.type]
  const List = block.type === 'numbered' ? 'ol' : 'ul'
  return <div className={cn('min-w-0 break-words', label && 'rounded-xl border-l-4 border-primary bg-muted px-5 py-4', (block.type === 'gap' || block.type === 'contradiction') && 'border-amber-500')}>
    {label && <p className="mb-2 text-xs font-extrabold text-primary">{label}</p>}
    {block.conceptLabel && <h4 className="mb-2 font-display text-lg font-bold text-foreground">{block.conceptLabel}</h4>}
    {block.basis === 'instructor-emphasis' && <Badge variant="secondary" className="mb-2">Professor emphasis</Badge>}
    {block.provenance === 'background' && <p className="mb-2 text-xs font-bold text-muted-foreground">Extra context</p>}
    {block.text?.content && <p className="whitespace-pre-wrap text-[15px] leading-8"><StudyText value={block.text} /></p>}
    {!!block.items?.length && <List className={cn('mt-3 space-y-3 pl-5 text-[15px] leading-7', block.type === 'numbered' ? 'list-decimal marker:font-extrabold marker:text-primary' : 'list-disc marker:text-primary')}>{block.items.map((item, index) => <li key={index} className="pl-1 whitespace-pre-wrap"><StudyText value={item} /></li>)}</List>}
  </div>
}

export function GeneratedLectureGuideView({ lecture, guide, chunks, files, mastery, onOpenMastery }: { lecture: LectureRecord; guide: StudyGuideArtifact; brief: NonNullable<LectureRecord['lectureBrief']>; chunks: SourceChunk[]; files: AcademicFile[]; mastery?: Outline; onOpenMastery: () => void }) {
  const sections = guide.sections.filter((section) => section.id.toLowerCase() !== 'title' && section.title.trim().toLowerCase() !== 'title')
  const prefix = useId()
  const headings = useRef(new Map<string, HTMLHeadingElement>())
  return <div className="lecture-study-guide @container mx-auto max-w-6xl">
    <header className="border-b border-border pb-6"><p className="flex items-center gap-2 text-sm font-bold text-primary"><BookOpen className="size-4" />Study Guide</p><h2 className="mt-2 font-display text-3xl font-extrabold">Read to understand.</h2><p className="mt-2 text-sm text-muted-foreground">Start with the big picture, work through the explanations, then test your recall.</p></header>
    <div className="mt-6 grid items-start gap-8 @min-[52rem]:grid-cols-[13rem_minmax(0,1fr)] @min-[52rem]:gap-10">
      <aside className="min-w-0 @min-[52rem]:sticky @min-[52rem]:top-4"><nav aria-label="Study guide sections"><p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">In this guide</p><div className="flex gap-1 overflow-x-auto pb-2 @min-[52rem]:flex-col @min-[52rem]:overflow-visible">{sections.map((section) => <Button key={section.id} variant="ghost" className="h-auto min-h-11 shrink-0 justify-start whitespace-normal px-3 py-2 text-left text-xs @min-[52rem]:w-full" onClick={() => { const heading = headings.current.get(section.id); heading?.scrollIntoView({ block: 'start' }); heading?.focus({ preventScroll: true }) }}>{section.title}</Button>)}</div></nav><Button onClick={onOpenMastery} variant="outline" className="mt-4 w-full justify-between">Practice recall<ArrowRight className="size-4" /></Button></aside>
      <article className="lecture-study-guide-content min-w-0 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-9 sm:py-8">
        {sections.map((section, index) => <section key={section.id} aria-labelledby={`${prefix}-${section.id}`} className="border-b border-border py-8 first:pt-0 last:border-0 last:pb-0"><div className="mb-5 flex items-baseline gap-3"><span className="text-sm font-extrabold tabular-nums text-primary" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3 id={`${prefix}-${section.id}`} ref={(node) => { if (node) headings.current.set(section.id, node); else headings.current.delete(section.id) }} tabIndex={-1} className="scroll-mt-6 rounded-sm font-display text-2xl font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{section.title}</h3></div><div className="space-y-6">{section.blocks.map((block) => <GuideBlock key={block.id} block={block} />)}</div><SourceDetails ids={section.blocks.flatMap((block) => block.sourceRef ? [block.sourceRef.chunkId] : [])} chunks={chunks} files={files} /></section>)}
        <footer className="mt-8 border-t border-border pt-6"><h3 className="font-display text-xl font-extrabold">Can you explain it without looking?</h3><p className="mt-2 text-sm text-muted-foreground">{mastery ? `${mastery.standards.length} objectives to work through at your own pace.` : 'Open Mastery Map to check which objectives are available.'}</p><Button className="mt-4" onClick={onOpenMastery}>Practice in Mastery Map<ArrowRight className="ml-2 size-4" /></Button></footer>
        <details className="mt-6 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded py-2 focus-visible:ring-2 focus-visible:ring-ring">About this guide</summary><p className="mt-2">Independent audit: {lecture.generationAuditStatus ?? 'Not recorded'}. Specification: {guide.specHash}.</p></details>
      </article>
    </div>
  </div>
}
export function MasteryMapView({ outline, chunks, lecture }: { outline?: Outline; chunks: SourceChunk[]; lecture: LectureRecord }) {
  const [mode, setMode] = useState<'outline' | 'recall'>('outline')
  const prefix = useId()
  function setMastery(id: string, state: keyof typeof readiness) { useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline?.id); const standard = record?.standards.find((item) => item.id === id); if (record && standard) { standard.masteryState = state; record.updatedAt = Date.now() } }) }
  if (!outline) return <Card><CardContent className="p-6"><h2 className="font-display text-xl font-extrabold">No Mastery Map yet</h2><p className="mt-2 text-sm text-muted-foreground">Add or link course objectives, then rebuild this lecture to create the outline and recall practice.</p></CardContent></Card>
  const applied = outline.standards.filter((standard) => standard.masteryState === 'can-apply-without-notes').length
  const explained = outline.standards.filter((standard) => standard.masteryState === 'can-explain').length
  const scopeLabel = outline.scope ? `${outline.scope[0].toUpperCase()}${outline.scope.slice(1)} scope` : 'Legacy unit scope'
  function openObjective(id: string) {
    const target = document.getElementById(`${prefix}-${id}`)
    if (target?.getAttribute('data-state') === 'closed') target.click()
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  }
  const checklist = (standard: Outline['standards'][number]) => <div className="space-y-6">
    <MasterySection label="Understand" items={standard.understand} />
    <MasterySection label="Be able to do" items={standard.beAbleToDo} />
    <section className="rounded-xl border-l-4 border-amber-500 bg-muted p-4"><MasterySection label="Watch for on an exam" items={standard.watchFor} /></section>
    <section aria-label={`Exam practice for ${standard.title}`} data-testid={`exam-practice-${standard.id}`} className="border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-display text-lg font-extrabold">Apply it on an exam</h4><Badge variant="secondary">Generated practice</Badge></div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Original practice built from your selected sources—not an instructor-authored question or a prediction of the actual exam.</p>
      {standard.examPractice?.length ? standard.examPractice.map((question, i) => <article key={i} className="mt-4 rounded-xl border border-border p-4">
        <p className="text-xs font-bold text-primary">Application {i + 1}</p>
        <p className="mt-2 whitespace-pre-wrap text-base leading-7">{studentText(question.prompt)}</p>
        <details data-testid={`practice-solution-${standard.id}-${i}`} className="mt-3"><summary className="w-fit cursor-pointer rounded py-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring">Show answer and working</summary><div className="mt-2 space-y-3 text-sm leading-7"><p><b>Answer: </b>{studentText(question.answer)}</p><p><b>Working: </b>{studentText(question.rationale)}</p><SourceDetails ids={question.sourceChunkIds} chunks={chunks} /></div></details>
      </article>) : <div data-testid={`legacy-practice-${standard.id}`} className="mt-3 rounded-xl border border-dashed border-border p-4"><p className="text-sm font-bold">Use the application targets above</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This earlier saved map has no generated exam-style questions or worked answers, so none are shown. Its Be able to do targets remain available for practice.</p></div>}
    </section>
  </div>
  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="text-sm font-bold text-primary">Mastery Map</p><h2 className="mt-2 font-display text-3xl font-extrabold">{mode === 'outline' ? 'Your mastery outline' : 'What can you explain?'}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === 'outline' ? 'Work through every objective: understand the ideas, apply them, and recognize the traps. Then practice without notes.' : 'Try each prompt aloud or on a blank page. Reveal the checklist afterward, then record how you did.'}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Mastery study mode">
        <Button variant={mode === 'outline' ? 'default' : 'outline'} aria-pressed={mode === 'outline'} onClick={() => setMode('outline')}>Mastery outline</Button>
        <Button variant={mode === 'recall' ? 'default' : 'outline'} aria-pressed={mode === 'recall'} onClick={() => setMode('recall')}>What can you explain?</Button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold"><span>{applied} of {outline.standards.length} ready to apply · {explained} can explain</span><span>Your self-assessment</span></div>
      <Progress value={outline.standards.length ? applied / outline.standards.length * 100 : 0} aria-label="Objectives you can apply without notes" className="mt-2 h-2" />
    </header>
    <nav aria-label="Mastery objectives" className="rounded-xl border border-border p-4"><p className="mb-3 text-xs font-bold text-muted-foreground">{mode === 'outline' ? 'Things to master' : 'Choose a recall objective'}</p><ol className="grid gap-2 sm:grid-cols-2">{outline.standards.map((standard, index) => <li key={standard.id}><button type="button" className="flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openObjective(standard.id)}><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-extrabold text-primary" aria-hidden="true">{index + 1}</span><span>{standard.title}</span></button></li>)}</ol></nav>
    <Card><CardContent className="px-4 py-0 sm:px-6"><Accordion key={`${outline.id}:${mode}`} type="multiple" defaultValue={mode === 'outline' ? outline.standards.map((standard) => standard.id) : outline.standards[0] ? [outline.standards[0].id] : []}>
      {outline.standards.map((standard, index) => <AccordionItem key={standard.id} value={standard.id}>
        <AccordionTrigger id={`${prefix}-${standard.id}`} className="scroll-mt-4 items-center py-5 hover:no-underline"><span className="flex min-w-0 items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-primary">{standard.masteryState === 'can-apply-without-notes' ? <CheckCircle2 className="size-4" /> : index + 1}</span><span className="min-w-0"><span className="block font-display text-lg font-extrabold">{standard.title}</span><span className="mt-1 block text-xs text-muted-foreground">{readiness[standard.masteryState ?? 'not-started']}</span></span></span></AccordionTrigger>
        <AccordionContent className="pb-6">
          {mode === 'outline' ? checklist(standard) : <><section className="rounded-xl border-l-4 border-primary bg-muted p-5"><h3 className="text-xs font-extrabold text-primary">Try without notes</h3><p className="mt-2 text-sm text-muted-foreground">Answer aloud or on a blank page before revealing the checklist.</p><ul className="mt-3 space-y-3 text-base leading-7">{(standard.freeRecallCues?.length ? standard.freeRecallCues : [standard.title]).map((cue, i) => <li key={i}>{studentText(cue)}</li>)}</ul></section><details data-testid={`recall-checklist-${standard.id}`} className="mt-4 rounded-xl border border-border"><summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring">Reveal the checklist</summary><div className="border-t border-border p-5">{checklist(standard)}</div></details></>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold">How did you do?</p><Select value={standard.masteryState ?? 'not-started'} onValueChange={(value) => setMastery(standard.id, value as keyof typeof readiness)}><SelectTrigger className="h-11 w-full sm:w-60" aria-label={`Mastery state for ${standard.title}`}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(readiness).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <SourceDetails ids={standard.sourceChunkIds} chunks={chunks} />
        </AccordionContent>
      </AccordionItem>)}
    </Accordion></CardContent></Card>
    <p className="text-xs text-muted-foreground">{lecture.title} · {scopeLabel}</p>
  </div>
}
function MasterySection({ label, items }: { label: string; items: string[] }) { return items.length ? <section><h4 className="text-sm font-extrabold">{label}</h4><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 marker:text-primary">{items.map((item, index) => <li key={index}>{studentText(item)}</li>)}</ul></section> : null }
