import { useId, useRef, type ReactNode } from 'react'
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
  if (!ids.length) return null
  return <details className="mt-4 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded-md py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sources</summary><div className="mt-2 space-y-3">{[...new Set(ids)].map((id) => {
    const chunk = chunks.find((item) => item.id === id)
    const file = files.find((item) => item.id === chunk?.fileId)
    return <blockquote key={id} className="border-l-2 border-border pl-3 leading-6"><p className="font-bold">{file?.fileName ?? file?.title ?? 'Source passage'}{chunk?.sourcePosition?.label ? ` · ${chunk.sourcePosition.label}` : ''}</p>{chunk?.content ?? 'This source is no longer available.'}</blockquote>
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
  function setMastery(id: string, state: keyof typeof readiness) { useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline?.id); const standard = record?.standards.find((item) => item.id === id); if (record && standard) { standard.masteryState = state; record.updatedAt = Date.now() } }) }
  if (!outline) return <Card><CardContent className="p-6"><h2 className="font-display text-xl font-extrabold">No Mastery Map yet</h2><p className="mt-2 text-sm text-muted-foreground">Add or link course objectives, then rebuild this lecture to create recall practice.</p></CardContent></Card>
  const applied = outline.standards.filter((standard) => standard.masteryState === 'can-apply-without-notes').length
  const explained = outline.standards.filter((standard) => standard.masteryState === 'can-explain').length
  return <div className="mx-auto max-w-4xl space-y-6"><header><p className="text-sm font-bold text-primary">Mastery Map</p><h2 className="mt-2 font-display text-3xl font-extrabold">What can you explain?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Try each prompt aloud or on a blank page. Reveal the checklist afterward, then record how you did.</p><div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold"><span>{applied} of {outline.standards.length} ready to apply · {explained} can explain</span><span>Your self-assessment</span></div><Progress value={outline.standards.length ? applied / outline.standards.length * 100 : 0} aria-label="Objectives you can apply without notes" className="mt-2 h-2" /></header>
    <Card><CardContent className="px-4 py-0 sm:px-6"><Accordion key={outline.id} type="multiple" defaultValue={outline.standards[0] ? [outline.standards[0].id] : []}>{outline.standards.map((standard, index) => <AccordionItem key={standard.id} value={standard.id}><AccordionTrigger className="items-center py-5 hover:no-underline"><span className="flex min-w-0 items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-primary">{standard.masteryState === 'can-apply-without-notes' ? <CheckCircle2 className="size-4" /> : index + 1}</span><span className="min-w-0"><span className="block font-display text-lg font-extrabold">{standard.title}</span><span className="mt-1 block text-xs text-muted-foreground">{readiness[standard.masteryState ?? 'not-started']}</span></span></span></AccordionTrigger><AccordionContent className="pb-6"><section className="rounded-xl border-l-4 border-primary bg-muted p-5"><h3 className="text-xs font-extrabold text-primary">Try without notes</h3><ul className="mt-3 space-y-3 text-base leading-7">{(standard.freeRecallCues?.length ? standard.freeRecallCues : [standard.title]).map((cue, i) => <li key={i}>{studentText(cue)}</li>)}</ul></section><details className="mt-4 rounded-xl border border-border"><summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reveal the checklist</summary><div className="space-y-5 border-t border-border p-5"><MasterySection label="Explain these ideas" items={standard.understand} /><MasterySection label="Apply what you know" items={standard.beAbleToDo} /><MasterySection label="Watch for these mistakes" items={standard.watchFor} /></div></details><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold">How did you do?</p><Select value={standard.masteryState ?? 'not-started'} onValueChange={(value) => setMastery(standard.id, value as keyof typeof readiness)}><SelectTrigger className="h-11 w-full sm:w-60" aria-label={`Mastery state for ${standard.title}`}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(readiness).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><SourceDetails ids={standard.sourceChunkIds} chunks={chunks} /></AccordionContent></AccordionItem>)}</Accordion></CardContent></Card>
    <details className="text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded py-2 focus-visible:ring-2 focus-visible:ring-ring">Practice settings</summary><p className="my-2">{lecture.title}</p><Select value={outline.scope ?? 'unit'} onValueChange={(value) => useStore.getState().update((draft) => { const record = draft.academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id); if (record) { record.scope = value as 'lecture' | 'unit' | 'exam'; record.updatedAt = Date.now() } })}><SelectTrigger aria-label="Mastery scope" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{['lecture', 'unit', 'exam'].map((scope) => <SelectItem key={scope} value={scope}>{scope[0].toUpperCase() + scope.slice(1)}</SelectItem>)}</SelectContent></Select></details>
  </div>
}
function MasterySection({ label, items }: { label: string; items: string[] }) { return items.length ? <section><h4 className="text-sm font-extrabold">{label}</h4><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 marker:text-primary">{items.map((item, index) => <li key={index}>{studentText(item)}</li>)}</ul></section> : null }
