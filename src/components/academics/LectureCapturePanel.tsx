import '@/pages/LecturePage.css'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useMemo, useState, type ReactNode } from 'react'
import { BookOpen, Brain, ChevronDown, CircleHelp, FileSearch, FileStack, FileText, ListChecks, MoreHorizontal, NotebookText, Search, Sparkles } from 'lucide-react'
import type { AcademicFile, ClassCenterData, Course, LectureBriefTrace, LectureRecord, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { analyzeLectureTranscript } from '@/lib/academics/lectureAnalysis'
import { buildLectureGuideProposal } from '@/lib/academics/guideContract'
import { buildLectureBrief, fileCoverageLabel, sourceChunksForLecture } from '@/lib/academics/lectureWorkspace'
import { completedLectureTitle } from '@/lib/academics/lectureLabels'
import { NotebookEntryComposer } from './NotebookEntryComposer'
import { LectureCaptureGuide } from '@/components/academics/LectureCaptureGuide'
import { LectureRecordMenu } from '@/components/academics/LectureRecordMenu'
import { QuestionBankPdfButton } from '@/components/academics/QuestionBankPdfButton'
import { useToast } from '@/components/common/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { GeneratedLectureGuideView, MasteryMapView, NotebookPageView } from './LectureStudyViews'

export type LectureDestination = 'overview' | 'transcript' | 'evidence' | 'study-work'
type WorkspaceView = 'brief' | 'mastery' | 'materials' | 'sources'

function fileKind(file: AcademicFile) {
  if (file.type === 'transcript') return 'Transcript'
  if (file.type === 'lecture-slides') return 'Professor slides'
  if (file.type === 'reading') return 'Reading'
  if (file.type === 'lab-handout') return 'Lab handout'
  if (file.type === 'syllabus') return 'Learning objectives / syllabus'
  if (file.owner === 'mine') return 'Personal notes or material'
  return file.type.replace(/-/g, ' ')
}
function fileExtension(file: Pick<AcademicFile, 'fileName' | 'title' | 'mimeType' | 'sourceType'>) {
  const name = file.fileName ?? file.title
  const ext = name?.split('.').pop()
  if (ext && ext !== name) return ext.toLocaleUpperCase()
  if (file.mimeType?.startsWith('image/')) return 'IMAGE'
  if (file.sourceType === 'paste') return 'PASTED TEXT'
  return 'FILE'
}

export function LectureCapturePanel({ courseId, course, data, onOpenNotes, initialLectureId, initialDestination = 'overview', displayMode = 'dialog', onNavigateLecture, onDeletedLecture }: {
  courseId: string; course?: Pick<Course, 'code' | 'title'>; data: ClassCenterData; onOpenNotes: () => void; initialLectureId?: string; initialDestination?: LectureDestination; displayMode?: 'dialog' | 'embedded' | 'page'; onNavigateLecture?: (id: string) => void; onDeletedLecture?: () => void
}) {
  const lectures = useMemo(() => data.lectures.filter((lecture) => lecture.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt), [courseId, data.lectures])
  const [activeLectureId, setActiveLectureId] = useState<string | undefined>(initialLectureId)
  const activeLecture = lectures.find((lecture) => lecture.id === activeLectureId)
  const [rebuildingLectureId, setRebuildingLectureId] = useState<string>()
  const [view, setView] = useState<WorkspaceView>(initialDestination === 'transcript' || initialDestination === 'evidence' ? 'sources' : initialDestination === 'study-work' ? 'materials' : 'brief')
  const [captureGuideOpen, setCaptureGuideOpen] = useState(false)
  if (activeLecture?.workspaceState === 'complete' && rebuildingLectureId !== activeLecture.id) return <LectureWorkspace course={course} courseId={courseId} data={data} lectures={lectures} activeLecture={activeLecture} view={view} onView={setView} onSelect={(lecture) => { if (onNavigateLecture) { onNavigateLecture(lecture.id); return }; setActiveLectureId(lecture.id); setRebuildingLectureId(undefined); setView('brief') }} onDeleted={(lectureId) => { if (activeLectureId !== lectureId) return; if (onDeletedLecture) { onDeletedLecture(); return }; setActiveLectureId(lectures.find((lecture) => lecture.id !== lectureId)?.id); setRebuildingLectureId(undefined); setView('brief') }} onRebuild={() => { setRebuildingLectureId(activeLecture.id) }} onOpenNotes={onOpenNotes} onHelp={() => setCaptureGuideOpen(true)} help={<LectureCaptureGuide open={captureGuideOpen} onOpenChange={setCaptureGuideOpen} />} embedded={displayMode === 'embedded'} standalone={displayMode === 'page'} />
  return <NotebookEntryComposer courseId={courseId} course={course} data={data} entry={activeLecture} onBuilt={id => { setActiveLectureId(id); setRebuildingLectureId(undefined); setView('brief'); onNavigateLecture?.(id) }} />

}

function LectureMaterialStatus({ file, chunks }: { file: AcademicFile; chunks: SourceChunk[] }) {
  const ready = file.processingStatus === 'ready' && chunks.length > 0
  return <div className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3"><span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', ready ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="truncate">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge><Badge variant={ready ? 'default' : 'outline'}>{ready ? 'Ready' : 'Needs attention'}</Badge></span><span className="mt-1 block text-xs font-bold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.length)}{file.sourceCoverage?.figureStatus === 'not-interpreted' ? ' · figures not interpreted' : file.sourceCoverage?.figureStatus === 'question-bank-reviewed' ? ' · visually inspected by Claude for a question bank' : ''}</span>{!ready && <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">Fix: {file.processingError ?? 'Add readable text or a clearer scan.'}</span>}</span></div>
}

function LectureWorkspace({ course, courseId, data, lectures, activeLecture, view, onView, onSelect, onDeleted, onRebuild, onOpenNotes, onHelp, help, embedded = false, standalone = false }: { course?: Pick<Course, 'code' | 'title'>; courseId: string; data: ClassCenterData; lectures: LectureRecord[]; activeLecture: LectureRecord; view: WorkspaceView; onView: (view: WorkspaceView) => void; onSelect: (lecture: LectureRecord) => void; onDeleted: (lectureId: string) => void; onRebuild: () => void; onOpenNotes: () => void; onHelp: () => void; help: ReactNode; embedded?: boolean; standalone?: boolean }) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const selectedIds = activeLecture.selectedSourceFileIds ?? (activeLecture.transcriptFileId ? [activeLecture.transcriptFileId] : [])
  const files = data.files.filter((file) => selectedIds.includes(file.id)); const chunks = sourceChunksForLecture(data, activeLecture)
  const brief = activeLecture.lectureBrief ?? buildLectureBrief(chunks, selectedIds, data.files)
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === activeLecture.masteryMapId || outline.lectureId === activeLecture.id)
  const chronological = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (id: string) => chronological.findIndex((lecture) => lecture.id === id) + 1
  const moreMenu = <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={embedded ? 'More lecture tools' : undefined} className={cn(!embedded && 'mr-8')}><MoreHorizontal className="size-4" /><span className={cn(embedded && 'hidden sm:inline')}>More</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Lecture tools</DropdownMenuLabel><DropdownMenuItem onClick={() => onView('sources')}><Search className="size-4" /> Search sources</DropdownMenuItem><DropdownMenuItem onClick={onOpenNotes}><NotebookText className="size-4" /> Open class Guide</DropdownMenuItem><DropdownMenuItem onClick={onHelp}><CircleHelp className="size-4" /> Transcript help</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  const tailored = activeLecture.notebookOutput === 'tailored-page'
  const views: Array<[WorkspaceView, string]> = tailored ? [['brief', 'Notebook page'], ['materials', 'Materials'], ['sources', 'Sources']] : [['brief', 'Study Guide'], ['mastery', 'Mastery Map'], ['materials', 'Materials'], ['sources', 'Sources']]
  const tabs = <nav className={cn('lecture-workspace-tabs flex min-w-0 gap-1 overflow-x-auto', !embedded && 'mt-4')} aria-label="Lecture workspace views">{views.map(([value, label]) => <button key={value} type="button" aria-current={view === value ? 'page' : undefined} onClick={() => onView(value)} className={cn('whitespace-nowrap border-b-2 py-2 font-extrabold', embedded ? 'px-2 text-xs sm:px-3 sm:text-sm' : 'px-3 text-sm', view === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{label}</button>)}</nav>
  const content = <>{activeLecture.studyGuide && activeLecture.processingError && <p role="status" className="mb-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">{activeLecture.processingError}</p>}{view === 'brief' && (activeLecture.studyGuide
    ? tailored ? <NotebookPageView lecture={activeLecture} guide={activeLecture.studyGuide} chunks={chunks} files={files} standalone={standalone} /> : <GeneratedLectureGuideView standalone={standalone} lecture={activeLecture} guide={activeLecture.studyGuide} brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />
    : <LectureBriefView brief={brief} chunks={chunks} files={files} mastery={mastery} onOpenMastery={() => onView('mastery')} />)}{view === 'mastery' && <MasteryMapView outline={mastery} chunks={chunks} lecture={activeLecture} />}{view === 'materials' && <LectureMaterialsView data={data} lecture={activeLecture} files={data.files.filter((file) => file.lectureId === activeLecture.id || selectedIds.includes(file.id))} onOpenBrief={() => onView('brief')} onOpenMastery={() => onView('mastery')} />}{view === 'sources' && <LectureSourcesView courseId={courseId} lecture={activeLecture} files={files} chunks={chunks} data={data} />}</>

  if (embedded) return <section className="min-w-0 overflow-hidden border-t border-border bg-card" aria-label="Embedded lecture workspace"><div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-1 sm:px-2"><div className="min-w-0 flex-1">{tabs}</div><div className="shrink-0">{moreMenu}</div></div><div role="region" aria-label="Lecture reading area" tabIndex={0} className="max-h-[38rem] min-w-0 overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5">{content}</div>{help}</section>

  const catalog = <aside className="lecture-workspace-catalog min-h-0 min-w-0 border-b border-border bg-muted/25 lg:border-b-0 lg:border-r" aria-label="Lecture catalog">
      <div className="lecture-workspace-catalog-header flex items-center justify-between gap-2 px-4 py-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{course?.code ?? 'Class'}</p><h2 className="font-display text-base font-extrabold">Lectures</h2></div>
        <Badge variant="outline">{lectures.length}</Badge>
      </div>
      <div className="lecture-workspace-catalog-list flex min-h-0 gap-2 px-3 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:block lg:space-y-1.5" role="region" aria-label="Lecture list" tabIndex={0}>
        {lectures.map((lecture) => <LectureRecordMenu key={lecture.id} lecture={lecture} onOpen={() => { setCatalogOpen(false); onSelect(lecture) }} onDeleted={onDeleted}><button type="button" aria-current={lecture.id === activeLecture.id ? 'page' : undefined} onClick={() => { setCatalogOpen(false); onSelect(lecture) }} className={cn('lecture-workspace-catalog-record min-w-56 rounded-xl border p-3 pr-9 text-left lg:min-w-0 lg:w-full', lecture.id === activeLecture.id ? 'border-primary bg-card shadow-sm' : 'border-transparent hover:border-border hover:bg-card/70')}><span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{lecture.notebookRequest !== undefined ? 'Notebook entry' : lecture.studyIntent ? lecture.studyIntent.purpose === 'exam-prep' ? 'Exam prep' : 'Study guide' : `Lecture ${lectureNumber(lecture.id)}`}  · {lecture.occurredOn ?? 'Date not set'}</span><b className="mt-1 block line-clamp-2 font-display text-sm">{completedLectureTitle(lectureNumber(lecture.id), lecture)}</b><span className="lecture-workspace-catalog-status mt-1 block text-[11px] font-bold text-muted-foreground">{lecture.notebookOutput === 'tailored-page' ? 'Notebook page' : lecture.studyGuide && lecture.masteryMapId ? 'Generated Guide + Mastery' : lecture.workspaceState === 'complete' ? 'Local preview · rebuild available' : 'Import in progress'}</span></button></LectureRecordMenu>)}
      </div>
    </aside>
  return <div className={cn("lecture-workspace grid w-full min-w-0 max-w-full overflow-hidden", standalone && "lecture-workspace-standalone")} data-layout="independent-scroll">
    {!standalone && catalog}
    <div className="lecture-workspace-main min-w-0 bg-card">
      <header className="lecture-workspace-header border-b border-border px-4 py-4 sm:px-6" aria-label="Lecture header">
        <div className="lecture-workspace-heading-row flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{activeLecture.notebookRequest !== undefined ? 'Notebook entry' : activeLecture.studyIntent ? activeLecture.studyIntent.purpose === 'exam-prep' ? 'Exam prep' : 'Study guide' : `Lecture ${lectureNumber(activeLecture.id)}`}  · {activeLecture.occurredOn ?? 'Date not set'}</p><h1 className="mt-1 break-words font-display text-2xl font-extrabold">{completedLectureTitle(lectureNumber(activeLecture.id), activeLecture)}</h1><p className="lecture-workspace-source-summary mt-1 text-sm font-semibold text-muted-foreground">{files.length} selected {files.length === 1 ? 'source' : 'sources'} · {chunks.length} readable {chunks.length === 1 ? 'passage' : 'passages'}</p></div>
          <div className="lecture-workspace-actions flex flex-wrap items-center gap-2">{standalone && <Sheet open={catalogOpen} onOpenChange={setCatalogOpen}><SheetTrigger asChild><Button size="sm" variant="outline"><BookOpen className="size-4" />Switch lecture</Button></SheetTrigger><SheetContent side="left" className="lecture-switcher"><SheetHeader><SheetTitle>Class lectures</SheetTitle><SheetDescription>Choose a lecture to open its study workspace.</SheetDescription></SheetHeader>{catalog}</SheetContent></Sheet>}<Button size="sm" onClick={onRebuild}><Sparkles className="size-4" /> Rebuild with AI</Button>{moreMenu}</div>
        </div>
        {tabs}
      </header>
      <div key={`${activeLecture.id}:${view}`} role="region" aria-label="Lecture reading area" tabIndex={0} className="lecture-workspace-reading min-w-0 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6">{content}</div>
      {help}
    </div>
  </div>

}

function BriefSection({ eyebrow, title, items, chunks, empty, tone = 'plain' }: {
  eyebrow: string
  title: string
  items: LectureBriefTrace[]
  chunks: SourceChunk[]
  empty: string
  tone?: 'plain' | 'emphasis' | 'caution'
}) {
  const [open, setOpen] = useState(false)
  const evidence = [...new Set(items.map((item) => item.sourceChunkId))]
    .map((id) => chunks.find((chunk) => chunk.id === id))
    .filter((chunk): chunk is SourceChunk => Boolean(chunk))
  return <section className={cn(
    'border-b border-border py-6 first:pt-0 last:border-0 last:pb-0',
    tone === 'emphasis' && 'rounded-2xl border border-primary/25 bg-primary/6 px-5',
    tone === 'caution' && 'rounded-2xl border border-amber-500/25 bg-amber-500/7 px-5',
  )}>
    <p className={cn('text-[10px] font-extrabold uppercase tracking-[0.13em]', tone === 'caution' ? 'text-amber-700 dark:text-amber-300' : 'text-primary')}>{eyebrow}</p>
    <h3 className="mt-1 font-display text-lg font-extrabold">{title}</h3>
    {items.length ? <div className="mt-3 space-y-3">{items.map((item, index) => <p key={item.id} className={cn('font-semibold leading-7', title === 'Lecture in one page' ? 'text-[15px] sm:text-base' : 'text-sm')}>
      {item.text}<sup className="ml-1 text-[9px] font-extrabold text-primary">{index + 1}</sup>
    </p>)}</div> : <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">{empty}</p>}
    {evidence.length > 0 && <div className="mt-3">
      <Button className="h-auto px-0 text-xs" variant="link" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? 'Hide source passages' : `Show source passages (${evidence.length})`}</Button>
      {open && <div className="mt-2 space-y-2" aria-label={`${title} source passages`}>{evidence.map((chunk, index) => <blockquote key={chunk.id} className="rounded-xl border border-border bg-card/75 p-3 text-xs font-semibold leading-relaxed text-muted-foreground"><b className="text-foreground">{index + 1}. {chunk.sourcePosition?.label ?? 'Source passage'}:</b> {chunk.content}</blockquote>)}</div>}
    </div>}
  </section>
}

function ConceptMapView({ map, chunks, files }: {
  map: NonNullable<NonNullable<LectureRecord['lectureBrief']>['conceptMap']>
  chunks: SourceChunk[]
  files: AcademicFile[]
}) {
  const [open, setOpen] = useState(false)
  const flow = map.nodes.filter((node) => node.lane === 'flow')
  const evidenceNodes = map.nodes.filter((node) => node.lane === 'evidence')
  const chunkIds = [...new Set([
    ...map.nodes.flatMap((node) => node.sourceChunkIds),
    ...map.edges.flatMap((edge) => edge.sourceChunkIds),
  ])]
  const evidence = chunkIds.map((id) => chunks.find((chunk) => chunk.id === id)).filter((chunk): chunk is SourceChunk => Boolean(chunk))
  const outgoing = (nodeId: string) => map.edges.find((edge) => edge.fromNodeId === nodeId && flow.some((node) => node.id === edge.toNodeId))
  return <section className="border-b border-border py-6" aria-labelledby="lecture-concept-map-title">
    <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How the ideas fit</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-2"><div><h3 id="lecture-concept-map-title" className="font-display text-lg font-extrabold">{map.title}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Follow the information, then see where experimental evidence attaches.</p></div><Badge variant="outline">Connected model</Badge></div>
    <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label={`${map.title} flow`}>
      {flow.map((node, index) => {
        const edge = outgoing(node.id)
        return <li key={node.id} className="relative flex min-h-44 flex-col rounded-2xl border border-border bg-muted/25 p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">Stage {index + 1}</span>
          <b className="mt-1 font-display text-base">{node.label}</b>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">{node.detail}</p>
          {edge && <p className="mt-auto border-t border-border pt-3 text-[11px] font-extrabold leading-relaxed text-primary"><span aria-hidden="true">→ </span>{edge.label}</p>}
        </li>
      })}
    </ol>
    {evidenceNodes.length > 0 && <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/6 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">How you observe the flow</p><div className="mt-3 grid gap-3 md:grid-cols-2">{evidenceNodes.map((node) => {
      const incoming = map.edges.filter((edge) => edge.toNodeId === node.id)
      return <article key={node.id} className="rounded-xl border border-border bg-card p-4"><b className="font-display text-sm">{node.label}</b><p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{node.detail}</p>{incoming.map((edge) => <p key={edge.id} className="mt-2 text-[11px] font-extrabold text-primary">{edge.label}</p>)}</article>
    })}</div></div>}
    {evidence.length > 0 && <div className="mt-3"><Button className="h-auto px-0 text-xs" variant="link" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? 'Hide concept sources' : `Show concept sources (${evidence.length})`}</Button>{open && <div className="mt-2 space-y-2" aria-label="Concept map source passages">{evidence.map((chunk, index) => { const file = files.find((item) => item.id === chunk.fileId); return <blockquote key={chunk.id} className="rounded-xl border border-border bg-card/75 p-3 text-xs font-semibold leading-relaxed text-muted-foreground"><b className="text-foreground">{index + 1}. {file?.fileName ?? file?.title ?? 'Source'} · {chunk.sourcePosition?.label ?? 'passage'}:</b> {chunk.content}</blockquote> })}</div>}</div>}
  </section>
}

function LectureBriefView({ brief, chunks, files, mastery, onOpenMastery }: { brief: NonNullable<LectureRecord['lectureBrief']>; chunks: SourceChunk[]; files: AcademicFile[]; mastery?: ClassCenterData['generatedMasteryOutlines'][number]; onOpenMastery: () => void }) {
  return <div className="mx-auto max-w-5xl">
    <section className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Study Guide preview</p><h2 className="mt-1 font-display text-2xl font-extrabold">At a glance</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground">This source-grounded preview becomes the opening of the full Study Guide after generation.</p></div><Badge variant="outline">{brief.usedSourceFileIds.length}/{brief.selectedSourceFileIds.length} sources used</Badge></div></section>

    <article className="mt-6 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-7">
      <BriefSection eyebrow="Start here" title="Lecture in one page" items={brief.summary} chunks={chunks} empty="No readable summary is available yet. Add a clearer transcript or another processed source." />
      {brief.conceptMap ? <ConceptMapView map={brief.conceptMap} chunks={chunks} files={files} /> : <BriefSection eyebrow="How the ideas fit" title="Concept map & connections" items={brief.connections} chunks={chunks} empty="No explicit connection was found in the selected sources." />}
      <BriefSection eyebrow="What your professor signaled" title="Professor emphasis & examples" items={brief.professorEmphasis} chunks={chunks} empty="No source-supported emphasis was detected. Nothing was guessed." tone="emphasis" />
      <BriefSection eyebrow="What changes and why" title="Processes & comparisons" items={brief.processesAndComparisons} chunks={chunks} empty="No explicit process or comparison was found." />
      <BriefSection eyebrow="Common trap" title="Misconceptions to correct" items={brief.misconceptions} chunks={chunks} empty="No source-supported misconception was found." tone="caution" />
    </article>

    <section className="mt-5 rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Language of the lecture</p><h3 className="mt-1 font-display text-lg font-extrabold">Important vocabulary in context</h3></div><p className="text-xs font-semibold text-muted-foreground">Meaning first, term second</p></div>{brief.vocabulary.length ? <dl className="mt-4 divide-y divide-border">{brief.vocabulary.map((item) => <div key={item.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"><dt className="text-sm font-extrabold capitalize text-primary">{item.term}</dt><dd className="text-sm font-semibold leading-relaxed text-muted-foreground">{item.text}</dd></div>)}</dl> : <p className="mt-3 text-sm font-semibold text-muted-foreground">No repeated source term was strong enough to label without guessing.</p>}</section>

    <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Check yourself next</p><h3 className="mt-1 font-display text-lg font-extrabold">Mastery Map preview</h3></div><Button size="sm" variant="outline" onClick={onOpenMastery}>Open full map</Button></div>{mastery ? <div className="mt-4 space-y-2">{mastery.standards.slice(0, 3).map((standard) => <div key={standard.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3"><b className="text-sm">{standard.title}</b><Badge variant="outline">{standard.masteryState === 'can-apply-without-notes' ? 'Can apply' : standard.masteryState === 'can-explain' ? 'Can explain' : 'Not started'}</Badge></div>)}</div> : <p className="mt-3 text-sm font-semibold text-muted-foreground">Add or link syllabus objectives to create the map. Transcript concepts are not silently promoted into course objectives.</p>}</div><SourceCoverage files={files} chunks={chunks} brief={brief} /></section>
  </div>
}

function SourceCoverage({ files, chunks, brief }: { files: AcademicFile[]; chunks: SourceChunk[]; brief: NonNullable<LectureRecord['lectureBrief']> }) {
  return <details className="rounded-2xl border border-border bg-card p-4"><summary className="cursor-pointer rounded py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-ring">Source coverage</summary><aside className="pt-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Source coverage</p><div className="mt-3 space-y-3">{files.map((file) => <div key={file.id}><div className="flex items-center justify-between gap-2"><b className="truncate text-xs">{file.fileName ?? file.title}</b><Badge variant={brief.usedSourceFileIds.includes(file.id) ? 'default' : 'outline'}>{brief.usedSourceFileIds.includes(file.id) ? 'Used' : 'Not used'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p></div>)}</div><p className="mt-4 border-t border-border pt-3 text-[11px] font-semibold text-muted-foreground">Figures and diagrams were not interpreted. Readable captions may appear as ordinary text passages.</p></aside></details>
}

function GeneratedMaterialRow({ icon: Icon, title, detail, onOpen, children }: {
  icon: typeof BookOpen
  title: string
  detail: string
  onOpen?: () => void
  children?: ReactNode
}) {
  const heading = <><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="font-display text-sm">{title}</b><Badge variant="outline">Generated</Badge></span><span className="mt-0.5 block text-xs font-semibold text-muted-foreground">{detail}</span></span></>
  if (onOpen) return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">{heading}<Button size="sm" variant="outline" className="shrink-0" onClick={onOpen}>Open</Button></div>
  return <details className="group rounded-xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{heading}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="border-t border-border px-4 py-3">{children}</div></details>
}

function LectureMaterialsView({ data, lecture, files, onOpenBrief, onOpenMastery }: {
  data: ClassCenterData
  lecture: LectureRecord
  files: AcademicFile[]
  onOpenBrief: () => void
  onOpenMastery: () => void
}) {
  const explicitLectureFileIds = new Set(files.filter((file) => file.lectureId === lecture.id || file.id === lecture.transcriptFileId).map((file) => file.id))
  const fileIds = explicitLectureFileIds.size > 0 ? explicitLectureFileIds : new Set(files.map((file) => file.id))
  const chunkFile = new Map(data.sourceChunks.map((chunk) => [chunk.id, chunk.fileId]))
  const usesLectureSource = (chunkIds: string[]) => chunkIds.some((id) => fileIds.has(chunkFile.get(id) ?? ''))
  const mastery = data.generatedMasteryOutlines.find((outline) => outline.id === lecture.masteryMapId || outline.lectureId === lecture.id)
  const decks = data.generatedFlashcardDecks.filter((deck) => deck.courseId === lecture.courseId && usesLectureSource(deck.sourceChunkIds))
  const revisedNotes = data.generatedRevisedNotes.filter((notes) => notes.courseId === lecture.courseId && notes.selectedFileIds.some((id) => fileIds.has(id)))
  const banks = data.generatedUnitQuestionBanks.filter((bank) => bank.courseId === lecture.courseId && usesLectureSource(bank.sourceChunkIds))
  const guideNotes = data.notes.filter((note) => note.courseId === lecture.courseId && note.type === 'study-guide' && note.linkedFileIds?.some((id) => fileIds.has(id)))
  const generatedCount = Number(Boolean(lecture.studyGuide)) + Number(Boolean(mastery)) + decks.length + revisedNotes.length + banks.length + guideNotes.length

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="border-b border-border pb-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Lecture library</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Materials</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Everything attached to this lecture, separated by origin.</p></div><p className="text-xs font-extrabold text-muted-foreground">{generatedCount} generated · {files.length} {files.length === 1 ? 'source' : 'sources'}</p></div>
    </header>

    <section aria-labelledby="generated-lecture-materials">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Made from this lecture</p><h3 id="generated-lecture-materials" className="mt-1 font-display text-lg font-extrabold">Generated resources</h3></div><p className="text-xs font-semibold text-muted-foreground">Create new resources from Class Materials.</p></div>
      <div className="mt-3 space-y-2">
        {lecture.studyGuide && <GeneratedMaterialRow icon={BookOpen} title={lecture.notebookOutput === 'tailored-page' ? 'Notebook page' : 'Study Guide'} detail={`${lecture.studyGuide.sections.length} sections · At a glance through full depth · source traced`} onOpen={onOpenBrief} />}
        {mastery && <GeneratedMaterialRow icon={ListChecks} title="Mastery Map" detail={`${mastery.standards.length} learning ${mastery.standards.length === 1 ? 'objective' : 'objectives'} · ${mastery.scope ?? 'unit'} scope`} onOpen={onOpenMastery} />}
        {guideNotes.map((note) => <GeneratedMaterialRow key={note.id} icon={BookOpen} title={note.title} detail={`${note.linkedFileIds?.length ?? 0} linked sources`}><p className="whitespace-pre-wrap text-sm font-semibold leading-6">{note.content}</p></GeneratedMaterialRow>)}
        {decks.map((deck) => <GeneratedMaterialRow key={deck.id} icon={Brain} title={deck.title} detail={`${deck.cards.length} cards · ${deck.sourceChunkIds.length} source passages`}><div className="divide-y divide-border">{deck.cards.map((card, index) => <div key={card.id} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3"><span className="text-xs font-extrabold text-primary">{index + 1}</span><p className="text-sm font-bold">{card.cloze ?? card.front}</p><p className="text-sm font-semibold text-muted-foreground">{card.back ?? card.extra ?? 'Cloze answer retained in the card.'}</p></div>)}</div></GeneratedMaterialRow>)}
        {revisedNotes.map((notes) => <GeneratedMaterialRow key={notes.id} icon={NotebookText} title={notes.title} detail={`${notes.sections.length} sections · ${notes.usedFileIds.length}/${notes.selectedFileIds.length} sources used`}><div className="space-y-4">{notes.sections.map((section) => <section key={section.id}><h4 className="font-display text-sm font-extrabold">{section.title}</h4><div className="mt-2 space-y-2">{section.passages.map((passage) => <p key={passage.id} className="text-sm font-semibold leading-6 text-muted-foreground">{passage.content}</p>)}</div></section>)}</div></GeneratedMaterialRow>)}
        {banks.map((bank) => <GeneratedMaterialRow key={bank.id} icon={FileStack} title={bank.title} detail={`${bank.questions.length} questions · ${bank.integrationPercent}% prior-unit integration${bank.visualSourceFileIds?.length ? ` · ${bank.visualSourceFileIds.length} images inspected` : ''}${bank.webPatternSearchCount ? ` · ${bank.webPatternSearchCount} official web ${bank.webPatternSearchCount === 1 ? 'search' : 'searches'}` : ''}`}><div className="mb-3 flex justify-end"><QuestionBankPdfButton bank={bank} /></div><div className="divide-y divide-border">{bank.questions.map((question, index) => <div key={question.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)]"><span className="text-xs font-extrabold text-primary">{index + 1}</span><div><p className="text-sm font-bold">{question.prompt}</p><p className="mt-1 text-sm font-semibold text-muted-foreground"><b className="text-foreground">Answer:</b> {question.answer}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{question.rationale}</p></div></div>)}</div></GeneratedMaterialRow>)}
        {!generatedCount && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No generated resources for this lecture yet. Use Create study resources in Class Materials when your sources are ready.</p>}
      </div>
    </section>

    <section aria-labelledby="source-lecture-materials">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Imported for this lecture</p>
      <h3 id="source-lecture-materials" className="mt-1 font-display text-lg font-extrabold">Your sources</h3>
      <div className="mt-3 space-y-2">{files.map((file) => <LectureMaterialStatus key={file.id} file={file} chunks={data.sourceChunks.filter((chunk) => chunk.fileId === file.id)} />)}{!files.length && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No sources are attached to this lecture.</p>}</div>
    </section>
  </div>
}

function LectureSourcesView({ courseId, lecture, files, chunks, data }: { courseId: string; lecture: LectureRecord; files: AcademicFile[]; chunks: SourceChunk[]; data: ClassCenterData }) {
  const toast = useToast(); const [query, setQuery] = useState(''); const [finding, setFinding] = useState(false)
  const results = chunks.filter((chunk) => !query.trim() || chunk.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  async function findRemarks() {
    if (!chunks.length || finding) return; setFinding(true)
    try {
      const outcome = await analyzeLectureTranscript({ courseId, chunks }); if (!outcome.ok) return toast({ title: 'No class remarks were saved', description: outcome.message, tone: 'error' })
      const now = Date.now(); let count = 0
      useStore.getState().update((draft) => { const center = draft.academics.classCenter; outcome.findings.forEach((item) => { if (center.lectureFindings.some((existing) => existing.lectureId === lecture.id && existing.sourceChunkId === item.sourceChunkId && existing.quote === item.quote)) return; const saved = { ...item, id: uid(), courseId, lectureId: lecture.id, createdAt: now, updatedAt: now, order: center.lectureFindings.filter((row) => row.lectureId === lecture.id).length }; center.lectureFindings.push(saved); const proposal = buildLectureGuideProposal({ center, courseId, lectureId: lecture.id, finding: saved, now }); if (proposal) center.guideProposals.push(proposal); count += 1 }) })
      toast({ title: count ? 'Class remarks ready for review' : 'No new remarks found', description: count ? 'Review them in the class Guide before they affect saved context.' : 'No weak guesses were created.' })
    } finally { setFinding(false) }
  }
  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Inspect on demand</p><h2 className="mt-1 font-display text-xl font-extrabold">Sources</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">The transcript and supporting evidence stay searchable here, behind the lecture’s study front.</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><FileSearch className="size-4" /> More source tools <ChevronDown className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Uses an external AI provider</DropdownMenuLabel><DropdownMenuItem onClick={() => void findRemarks()} disabled={finding}><Sparkles className="size-4" /> {finding ? 'Checking lecture passages…' : 'Find class remarks'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="rounded-xl border border-border bg-muted/25 p-3 text-xs font-semibold text-muted-foreground">“Find class remarks” copies only these readable lecture passages to your private server workspace, then invokes the configured external AI provider. Results remain proposals until reviewed.</p><label className="relative block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact words across transcript and sources" /></label><div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]"><aside className="space-y-2">{files.map((file) => <div key={file.id} className="rounded-xl border border-border bg-card p-3"><div className="flex flex-wrap items-center gap-2"><FileText className="size-4 text-primary" /><b className="min-w-0 truncate text-sm">{file.fileName ?? file.title}</b><Badge variant="outline">{fileExtension(file)}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{fileKind(file)} · {fileCoverageLabel(file, chunks.filter((chunk) => chunk.fileId === file.id).length)}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">Attached and processed · {lecture.lectureBrief?.usedSourceFileIds.includes(file.id) ? 'used in Guide' : 'not used in Guide'}</p>{file.sourceCoverage?.figureStatus === 'not-interpreted' && <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Figures not interpreted</p>}</div>)}</aside><article className="space-y-3">{results.map((chunk) => <section key={chunk.id} className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-extrabold text-primary">{files.find((file) => file.id === chunk.fileId)?.fileName ?? files.find((file) => file.id === chunk.fileId)?.title ?? 'Source'} · {chunk.sourcePosition?.label ?? 'passage'}</p><p className="mt-2 text-sm font-semibold leading-relaxed">{chunk.content}</p></section>)}{!results.length && <p className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm font-semibold text-muted-foreground">No lecture source contains that exact text.</p>}</article></div><p className="sr-only">{data.lectureFindings.filter((item) => item.lectureId === lecture.id).length} saved class remarks</p></div>
}
