import { useId, useRef, type ReactNode } from 'react'
import { BookOpen, ArrowRight } from 'lucide-react'
import type { AcademicFile, ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import type { ContentBlock, RichText, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { scrollGuideHeadingIntoReadingPane } from './lectureGuideNavigation'

type Outline = ClassCenterData['generatedMasteryOutlines'][number]


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
  const examApplication = block.conceptLabel?.trim().toLowerCase() === 'generated exam application'
  const workedAnswer = block.conceptLabel?.trim().toLowerCase() === 'worked answer'
  const label = examApplication ? undefined : labels[block.type]
  const List = block.type === 'numbered' ? 'ol' : 'ul'
  return <div data-guide-block={examApplication ? 'exam-application' : workedAnswer ? 'worked-answer' : undefined} className={cn('min-w-0 break-words', label && 'rounded-xl border-l-4 border-primary bg-muted px-5 py-4', (block.type === 'gap' || block.type === 'contradiction') && 'border-amber-500', examApplication && 'lecture-guide-exam-application', workedAnswer && 'lecture-guide-worked-answer')}>
    {label && <p className="mb-2 text-xs font-extrabold text-primary">{label}</p>}
    {block.conceptLabel && <h4 className="lecture-guide-concept-heading mb-2 text-lg font-bold text-foreground">{block.conceptLabel}</h4>}
    {examApplication && <Badge variant="outline" className="mb-3">Practice, not an exam prediction</Badge>}
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
    <header className="border-b border-border pb-6"><p className="flex items-center gap-2 text-sm font-bold text-primary"><BookOpen className="size-4" />Study Guide</p><h2 className="lecture-guide-heading mt-2 text-3xl">Read to understand.</h2><p className="mt-2 text-sm text-muted-foreground">Start with the big picture, work through the explanations, then test your recall.</p></header>
    <div className="mt-6 grid items-start gap-8 @min-[52rem]:grid-cols-[13rem_minmax(0,1fr)] @min-[52rem]:gap-10">
      <aside className="min-w-0 @min-[52rem]:sticky @min-[52rem]:top-4"><nav aria-label="Study guide sections"><p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">In this guide</p><div className="flex gap-1 overflow-x-auto pb-2 @min-[52rem]:flex-col @min-[52rem]:overflow-visible">{sections.map((section) => <Button key={section.id} variant="ghost" className="lecture-guide-nav-link h-auto min-h-11 shrink-0 justify-start whitespace-normal px-3 py-2 text-left text-xs @min-[52rem]:w-full" onClick={() => { const heading = headings.current.get(section.id); if (heading) scrollGuideHeadingIntoReadingPane(heading) }}>{section.title}</Button>)}</div></nav><Button onClick={onOpenMastery} variant="outline" className="mt-4 w-full justify-between">Practice recall<ArrowRight className="size-4" /></Button></aside>
      <article className="lecture-study-guide-content min-w-0 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-9 sm:py-8">
        {sections.map((section, index) => <section key={section.id} aria-labelledby={`${prefix}-${section.id}`} className="lecture-guide-section border-b border-border py-8 first:pt-0 last:border-0 last:pb-0"><div className="mb-5 flex items-baseline gap-3"><span className="lecture-guide-section-number text-sm font-extrabold tabular-nums text-primary" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3 id={`${prefix}-${section.id}`} ref={(node) => { if (node) headings.current.set(section.id, node); else headings.current.delete(section.id) }} tabIndex={-1} className="lecture-guide-heading scroll-mt-6 rounded-sm text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{section.title}</h3></div><div className="space-y-6">{section.blocks.map((block) => <GuideBlock key={block.id} block={block} />)}</div><SourceDetails ids={section.blocks.flatMap((block) => block.sourceRef ? [block.sourceRef.chunkId] : [])} chunks={chunks} files={files} /></section>)}
        <footer className="mt-8 border-t border-border pt-6"><h3 className="lecture-guide-heading text-xl">Can you explain it without looking?</h3><p className="mt-2 text-sm text-muted-foreground">{mastery ? `${mastery.standards.length} objectives to work through at your own pace.` : 'Open Mastery Map to check which objectives are available.'}</p><Button className="mt-4" onClick={onOpenMastery}>Practice in Mastery Map<ArrowRight className="ml-2 size-4" /></Button></footer>
        <details className="mt-6 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded py-2 focus-visible:ring-2 focus-visible:ring-ring">About this guide</summary><p className="mt-2">Independent audit: {lecture.generationAuditStatus ?? 'Not recorded'}. Specification: {guide.specHash}.</p></details>
      </article>
    </div>
  </div>
}
export { MasteryMapView } from './MasteryLearningModes'
