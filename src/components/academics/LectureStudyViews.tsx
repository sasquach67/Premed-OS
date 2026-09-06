import { useId, useRef, type ReactNode } from 'react'
import { BookOpen, ArrowRight, Network } from 'lucide-react'
import type { AcademicFile, ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import type { ContentBlock, RichText, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadingContents } from './ReadingContents'
import { splitStudyTables } from './studyTable'
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

function StudyBlockText({ value }: { value: RichText }) {
  return <>{splitStudyTables(value.content).map((part, index) => part.type === 'text'
    ? <p key={index} className="whitespace-pre-wrap text-[15px] leading-8"><StudyText value={{ ...value, content: part.content }} /></p>
    : <div key={index} role="region" aria-label="Comparison table" tabIndex={0} className="my-4 max-w-full overflow-x-auto rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <table className="w-full border-collapse text-left text-sm leading-6">
        <thead className="bg-muted"><tr>{part.headers.map((content, column) => <th key={column} scope="col" className="min-w-32 border-b border-border px-4 py-3 font-bold"><StudyText value={{ ...value, content }} /></th>)}</tr></thead>
        <tbody>{part.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-0">{row.map((content, column) => <td key={column} className="px-4 py-3 align-top"><StudyText value={{ ...value, content }} /></td>)}</tr>)}</tbody>
      </table>
    </div>)}</>
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

function ConceptConnections({ map, chunks, files }: { map: NonNullable<NonNullable<LectureRecord['lectureBrief']>['conceptMap']>; chunks: SourceChunk[]; files: AcademicFile[] }) {
  return <details className="mb-6 border-b border-border pb-5">
    <summary className="cursor-pointer rounded py-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Network className="mr-2 inline size-4 text-primary" aria-hidden="true" />How the ideas connect</summary>
    <div className="mt-3 space-y-5">
      <h3 className="font-display text-xl font-bold">{map.title}</h3>
      <dl className="space-y-4">{map.nodes.map((node) => <div key={node.id} className="min-w-0 break-words">
        <dt className="font-bold">{node.label}</dt><dd className="mt-1 text-sm leading-7">{node.detail}</dd>
      </div>)}</dl>
      {map.edges.length > 0 && <ul aria-label="Concept relationships" className="space-y-3 border-l-2 border-success pl-4">{map.edges.map((edge) => {
        const from = map.nodes.find((node) => node.id === edge.fromNodeId)
        const to = map.nodes.find((node) => node.id === edge.toNodeId)
        return <li key={edge.id} className="break-words text-sm leading-7"><strong>{from?.label ?? 'Unavailable concept'}</strong><span className="mx-2 text-success" aria-hidden="true">→</span>{edge.label}<span className="mx-2 text-success" aria-hidden="true">→</span><strong>{to?.label ?? 'Unavailable concept'}</strong></li>
      })}</ul>}
      <SourceDetails ids={[...map.nodes.flatMap((node) => node.sourceChunkIds), ...map.edges.flatMap((edge) => edge.sourceChunkIds)]} chunks={chunks} files={files} />
    </div>
  </details>
}

function GuideBlock({ block }: { block: ContentBlock }) {
  const labels: Partial<Record<ContentBlock['type'], string>> = { must_understand: 'Understand this', must_memorize: 'Commit to memory', recall: 'Try without notes', contradiction: 'Conflicting explanations', gap: 'Still unclear', callout: 'Take note' }
  const examApplication = block.conceptLabel?.trim().toLowerCase() === 'generated exam application'
  const workedAnswer = block.conceptLabel?.trim().toLowerCase() === 'worked answer'
  const label = examApplication ? undefined : labels[block.type]
  const List = block.type === 'numbered' ? 'ol' : 'ul'
  return <div data-guide-block={examApplication ? 'exam-application' : workedAnswer ? 'worked-answer' : undefined} className={cn('min-w-0 break-words', label && 'rounded-xl border-l-4 border-primary bg-muted px-5 py-4', (block.type === 'gap' || block.type === 'contradiction') && 'border-warning', examApplication && 'lecture-guide-exam-application rounded-lg px-4 py-4', workedAnswer && 'lecture-guide-worked-answer')}>
    {label && <p className="mb-2 text-xs font-extrabold text-primary">{label}</p>}
    {block.conceptLabel && <h4 className="lecture-guide-concept-heading mb-2 text-lg font-bold text-foreground">{block.conceptLabel}</h4>}
    {examApplication && <Badge variant="outline" className="mb-3">Practice, not an exam prediction</Badge>}
    {block.basis === 'instructor-emphasis' && <Badge variant="secondary" className="mb-2">Professor emphasis</Badge>}
    {block.provenance === 'background' && <p className="mb-2 text-xs font-bold text-muted-foreground">Extra context</p>}
    {block.text?.content && <StudyBlockText value={block.text} />}
    {!!block.items?.length && <List className={cn('mt-3 space-y-3 pl-5 text-[15px] leading-7', block.type === 'numbered' ? 'list-decimal marker:font-extrabold marker:text-primary' : 'list-disc marker:text-primary')}>{block.items.map((item, index) => <li key={index} className="pl-1 whitespace-pre-wrap"><StudyText value={item} /></li>)}</List>}
  </div>
}

export function GeneratedLectureGuideView({ lecture, guide, brief, chunks, files, mastery, onOpenMastery, standalone = false }: { standalone?: boolean; lecture: LectureRecord; guide: StudyGuideArtifact; brief: NonNullable<LectureRecord['lectureBrief']>; chunks: SourceChunk[]; files: AcademicFile[]; mastery?: Outline; onOpenMastery: () => void }) {
  const sections = guide.sections.filter((section) => section.id.toLowerCase() !== 'title' && section.title.trim().toLowerCase() !== 'title')
  const prefix = useId()
  const headings = useRef(new Map<string, HTMLHeadingElement>())
  function jumpToSection(id: string) {
    const heading = headings.current.get(id)
    if (!heading) return
    scrollGuideHeadingIntoReadingPane(heading)
  }
  return <div className="lecture-study-guide @container mx-auto max-w-6xl" data-reader-page={standalone || undefined}>
    <header className="border-b border-border pb-6"><p className="flex items-center gap-2 text-sm font-bold text-primary"><BookOpen className="size-4" />Study Guide</p><h2 className="lecture-guide-heading mt-2 text-3xl">Read to understand.</h2><p className="mt-2 text-sm text-muted-foreground">Start with the big picture, work through the explanations, then test your recall.</p></header>
    <div className="lecture-guide-layout mt-6 grid items-start gap-8 @min-[52rem]:grid-cols-[13rem_minmax(0,1fr)] @min-[52rem]:gap-10">
      <aside className="min-w-0 @min-[52rem]:sticky @min-[52rem]:top-4">
        <ReadingContents label="Study guide sections" standalone={standalone} items={sections.map(section => ({ id: section.id, title: section.title, targetId: `${prefix}-${section.id}` }))} onNavigate={jumpToSection}/>
        <Button onClick={onOpenMastery} variant="outline" className="mt-4 h-auto min-h-11 w-full justify-between whitespace-normal">Practice recall<ArrowRight className="size-4" /></Button>
      </aside>
      <article data-guide-scroll-container={standalone || undefined} aria-label={standalone ? "Study guide text" : undefined} tabIndex={standalone ? 0 : undefined} className="lecture-study-guide-content min-w-0 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-9 sm:py-8">
        {brief.conceptMap && <ConceptConnections map={brief.conceptMap} chunks={chunks} files={files} />}
        {sections.map((section, index) => <section key={section.id} aria-labelledby={`${prefix}-${section.id}`} className="lecture-guide-section border-b border-border py-8 first:pt-0 last:border-0 last:pb-0"><div className="mb-5 flex items-baseline gap-3"><span className="lecture-guide-section-number text-sm font-extrabold tabular-nums text-primary" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3 id={`${prefix}-${section.id}`} ref={(node) => { if (node) headings.current.set(section.id, node); else headings.current.delete(section.id) }} tabIndex={-1} className="lecture-guide-heading min-w-0 break-words scroll-mt-6 rounded-sm text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{section.title}</h3></div><div className="space-y-6">{section.blocks.map((block) => <GuideBlock key={block.id} block={block} />)}</div><SourceDetails ids={section.blocks.flatMap((block) => block.sourceRef ? [block.sourceRef.chunkId] : [])} chunks={chunks} files={files} /></section>)}
        <footer className="mt-8 border-t border-border pt-6"><h3 className="lecture-guide-heading text-xl">Can you explain it without looking?</h3><p className="mt-2 text-sm text-muted-foreground">{mastery ? `${mastery.standards.length} objectives to work through at your own pace.` : 'Open Mastery Map to check which objectives are available.'}</p><Button className="mt-4" onClick={onOpenMastery}>Practice in Mastery Map<ArrowRight className="ml-2 size-4" /></Button></footer>
        <details className="mt-6 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded py-2 focus-visible:ring-2 focus-visible:ring-ring">About this guide</summary><p className="mt-2">Independent audit: {lecture.generationAuditStatus ?? 'Not recorded'}. Specification: {guide.specHash}.</p></details>
      </article>
    </div>
  </div>
}
export { MasteryMapView } from './MasteryLearningModes'

/** Uses the shared cited block renderer without imposing a lecture/recall structure. */
export function NotebookPageView({ lecture, guide, chunks, files, standalone = false }: {
  lecture: LectureRecord; guide: StudyGuideArtifact; chunks: SourceChunk[]; files: AcademicFile[]; standalone?: boolean
}) {
  const prefix = useId()
  const sections = guide.sections.filter(section => section.id.toLowerCase() !== 'title')
  return <article className="lecture-study-guide notebook-page mx-auto w-full max-w-4xl" data-notebook-page={standalone || undefined}>
    <header className="border-b border-border pb-5"><p className="flex items-center gap-2 text-sm font-bold text-primary"><BookOpen className="size-4"/>Notebook page</p><h2 className="mt-2 font-display text-2xl font-extrabold">{lecture.aiTitle || lecture.title}</h2><details className="mt-3 text-sm text-muted-foreground"><summary className="cursor-pointer py-2 focus-visible:ring-2 focus-visible:ring-ring">Your request</summary><p className="whitespace-pre-wrap break-words leading-6">{lecture.notebookGeneratedRequest ?? lecture.notebookRequest}</p></details></header>
    {sections.map(section => <section key={section.id} aria-labelledby={`${prefix}-${section.id}`} className="border-b border-border py-6 last:border-0"><h3 id={`${prefix}-${section.id}`} className="font-display text-xl font-extrabold">{section.title}</h3><div className="mt-4 space-y-5">{section.blocks.map(block => <GuideBlock key={block.id} block={block}/>)}</div><SourceDetails ids={section.blocks.flatMap(block => block.sourceRef ? [block.sourceRef.chunkId] : [])} chunks={chunks} files={files}/></section>)}
  </article>
}
