import { NotebookArgumentChain } from './NotebookExplanation'
import { useNotebookChangedText } from './NotebookTextChanges'
import { NotebookReadGuard } from './NotebookReadGuard'
import { workspacePersistence } from '@/store/workspacePersistence'
import { commitWorkspaceMutation } from '@/store/workspaceTransaction'
import { NotebookImportAdjustments } from './NotebookImportAdjustments'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Ellipsis, Layers, RefreshCw, Pencil, Download, History, Info, StickyNote } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FlashcardPromptPanel } from './FlashcardPromptPanel'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { readStoredWorkspace, storageFailure, WorkspaceChangedError, WorkspaceSaveError } from '@/store/storageHealth'
import { exportNotebook, restoreNotebookVersion, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { notebookExportFilename } from '@/lib/academics/notebook/downloadFilename'
import { createNotebookUpdateSession, notebookContentKey, notebookHistoryRetentionNote, notebookPracticePolicy, notebookStateKey } from '@/lib/academics/notebook/revision'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import type { NotebookBlock, NotebookEntry, NotebookPackage, NotebookProgress, Evidence } from '@/lib/academics/notebook/types'
import type { AppData, LectureRecord } from '@/lib/types'
import { canonical } from '@/lib/academics/notebook/package'
import { notebookPromptParts } from '@/lib/academics/notebook/promptTables'
import { collectReaderAnnotations, collectReaderEvidence, notebookReaderContents, readerBlocks, readerHeadingId, splitNotebookAnnotations, type NotebookReadingMode } from '@/lib/academics/notebook/readerPresentation'
import { ReadingContents } from './ReadingContents'
import { scrollGuideHeadingIntoReadingPane } from './lectureGuideNavigation'
import { NotebookAssetsProvider, NotebookPracticeStimulus, NotebookVisualBlock, NotebookVisualReview, useNotebookPracticeImages } from './NotebookVisuals'
import { NotebookPortableExports, NotebookUpdateImageFiles } from './NotebookPortableExports'
import { NotebookIllustration } from './NotebookIllustration'
import { useNotebookReadingDetail, type NotebookReadingDetail } from './useNotebookReadingDetail'
import { assertNotebookBackupFits } from '@/lib/academics/notebook/notebookBundle'
import { visualAssetReferences } from '@/lib/academics/notebook/visualPackage'
import type { NotebookAssetBinding, VisualNotebookBlock } from '@/lib/academics/notebook/visualTypes'
import { isLearningVisualBlock } from '@/lib/academics/notebook/learningVisualTypes'
import { NotebookPracticeCard } from './NotebookPracticeCard'
import { practicePromptDisplay } from './notebookPracticePrompt'
import { NotebookCallout, NotebookGlossary, NotebookInlineText, NotebookSummary, NotebookTermsProvider, ProfessorStressed, printNotebookSummary, guideTerms, isGroupedGuide, sectionPracticeIds, useGuideBlockId, isLinesFirstGuide } from './NotebookStudyGuide'
import { NotebookMasteryObjectives } from './NotebookMasteryObjectives'
import './externalNotebook.css'
import './notebookVisuals.css'
import './notebookPractice.css'
import './notebookLessonHeader.css'
import './notebookLinesFirst.css'

export function notebookTransaction(mutator: (state: AppData) => void) {
  if (workspacePersistence()) return commitWorkspaceMutation(mutator)
  const previous = useStore.getState().academics
  const storageKey = useStore.persist.getOptions().name
  if (!storageKey) throw new Error('Notebook storage is not ready. No changes were saved.')
  let persisted: string | null
  try { persisted = readStoredWorkspace(localStorage, storageKey) }
  catch (failure) { throw new WorkspaceSaveError(failure) }
  if (persisted) {
    const saved = JSON.parse(persisted) as { state?: Partial<AppData> }
    const diskEntries = saved.state?.academics?.classCenter?.lectures?.filter(l => l.importedNotebook) ?? []
    const memoryEntries = previous.classCenter.lectures.filter(l => l.importedNotebook)
    // Hydration may refresh unrelated workspace timestamps/defaults. Compare
    // the destination identity and notebook preferences, not those derived fields.
    const classSnapshot = (courses: AppData['courses'], workspaces: AppData['academics']['classCenter']['workspaces']) => ({
      courses: courses.map(({ id, code, title, term }) => ({ id, code, title, term })),
      preferences: workspaces.map(({ courseId, externalNotebookPreferences }) => ({ courseId, externalNotebookPreferences })),
    })
    const diskClasses = classSnapshot(saved.state?.courses ?? [], saved.state?.academics?.classCenter?.workspaces ?? [])
    const memoryClasses = classSnapshot(useStore.getState().courses, previous.classCenter.workspaces)
    if (canonical(diskEntries) !== canonical(memoryEntries) || canonical(diskClasses) !== canonical(memoryClasses)) throw new WorkspaceChangedError('A notebook or class changed in another tab. Reload this page before saving so its newer content and progress are not overwritten. Keep any unsaved text before reloading.')
  }
  useStore.getState().update(mutator)
  const failure = storageFailure()
  if (failure) {
    useStore.getState().update(state => { state.academics = structuredClone(previous) })
    throw new WorkspaceSaveError(failure)
  }
}
export function downloadNotebookText(filename: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
type ChangeText = (path: (string | number)[], text: string | null) => void
function ContentText({ value, path, label, change, sourceIds, inlineSources = false, tables = false }: { value: string; path: (string | number)[]; label: string; change?: ChangeText; sourceIds?: string[]; inlineSources?: boolean; tables?: boolean }) {
  const changedText = useNotebookChangedText(path, value)
  if (!change && changedText) return <p className="en-text">{changedText}</p>
  if (change) return <label className="en-field">{label}<textarea value={value} onChange={event => change(path, ['caption', 'timeLabel', 'check', 'more'].includes(String(path.at(-1))) && event.target.value === '' ? null : event.target.value)} /></label>
  const textRole = path.at(-1) === 'prompt' ? 'question' : path.at(-1) === 'answer' ? 'answer' : path.at(-1) === 'rationale' ? 'reasoning' : undefined
  if (tables) return <>{notebookPromptParts(value).map((part, index) => part.type === 'text' ? <div key={index}>{part.text.split(/\n[ \t]*\n/).filter(paragraph => paragraph.trim()).map((paragraph, pi) => <p className="en-text" data-reader-role={textRole} key={pi}>{paragraph}</p>)}</div> : <div className="en-table-scroll nbr-prompt-table" role="region" aria-label="Practice prompt data" tabIndex={0} key={index}><table><thead><tr>{part.columns.map((column, ci) => <th scope="col" style={{ textAlign: part.align[ci] }} key={ci}>{column}</th>)}</tr></thead><tbody>{part.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td style={{ textAlign: part.align[ci] }} key={ci}>{cell}</td>)}</tr>)}</tbody></table></div>)}</>
  if (!sourceIds) return <p className="en-text" data-reader-role={textRole}><NotebookInlineText text={value} /></p>
  const { body, leading, trailing } = splitNotebookAnnotations(value, sourceIds)
  const annotation = (note: typeof leading[number], index: number) => note.kind === 'citation' && !inlineSources ? null : <div key={index} className={note.kind === 'limit' ? 'nbr-qualification en-text' : 'nbr-prov'}>{note.kind === 'limit' && <span className="sr-only">Qualification: </span>}<span>{note.displayText ?? note.text}</span></div>
  return <>{leading.map(annotation)}{body.trim() && <p className="en-text" data-reader-role={textRole}><NotebookInlineText text={body} /></p>}{trailing.map(annotation)}</>
}
function EvidenceView({ evidence, pkg }: { evidence: Evidence; pkg: NotebookPackage }) {
  const assetIds = visualAssetReferences(evidence), assets = pkg.version !== 2 ? pkg.assets.filter(a => assetIds.includes(a.id)) : []
  if (!evidence.sourceIds.length && !evidence.excerptIds.length) return <small className="en-muted">No linked source evidence</small>
  return <details className="en-evidence"><summary>Source evidence ({evidence.excerptIds.length} excerpts{assets.length ? ` / ${assets.length} images` : ''})</summary>{evidence.sourceIds.map(id => {
    const source = pkg.sources.find(s => s.id === id)!
    return <div key={id}><b>{source.title}</b><p>{source.role} / {source.access} / {source.used ? 'Used' : 'Not used'}</p>{assets.filter(a => a.sourceId === id).map(a => <p key={a.id}>Visual evidence: {a.fileName} / {a.location}</p>)}{source.excerpts.filter(excerpt => evidence.excerptIds.includes(excerpt.id)).map(excerpt => <blockquote key={excerpt.id}><small>{excerpt.location ?? 'Location not supplied'}</small><p className="en-text">{excerpt.text}</p></blockquote>)}</div>
  })}</details>
}
function ReaderSources({ blocks, pkg, scope, inlineSources, onInlineSources, selectedBlock, panelRef }: { blocks: NotebookBlock[]; pkg: NotebookPackage; scope: 'section' | 'item'; inlineSources: boolean; onInlineSources: () => void; selectedBlock?: string | null; panelRef?: RefObject<HTMLDetailsElement | null> }) {
  const sources = collectReaderEvidence(blocks, pkg, scope)
  const count = sources.reduce((total, source) => total + source.excerpts.length, 0)
  const annotations = collectReaderAnnotations(blocks, pkg, scope)
  return <details ref={panelRef} className={`nbr-sources-panel ${scope === 'section' ? 'nbr-srcpanel' : 'nbr-srcpanel-practice'}`}>
    <summary>Sources for this {scope}<span className="nbr-source-count">{sources.length} sources / {count} excerpts</span></summary>
    <div className="nbr-sources-body">
      <button type="button" className="nbr-provtoggle" aria-pressed={inlineSources} onClick={onInlineSources}>Show these sources beside the text</button>
      {annotations.length > 0 && <details className="nbr-reference-notes"><summary>Original reference notes ({annotations.length})</summary>{annotations.map((note, index) => <p key={index} data-block-id={note.blockId}><small>Linked sources: {note.sourceIds.join(', ')}</small><span>{note.text}</span>{note.unlinkedSourceIds.length > 0 && <small>Named in this note but not linked to this item: {note.unlinkedSourceIds.join(', ')}. No additional evidence is supplied here.</small>}</p>)}</details>}
      {!sources.length && <p className="en-muted">No linked source evidence</p>}
      {sources.map(({ source, excerpts }) => <section className="nbr-source" key={source.id}><h4>{source.title}</h4><p className="en-muted">{source.id} / {source.role} / {source.access} / {source.used ? 'Used' : 'Not used'}</p>{source.limitations.map((limit, index) => <p className="en-text" key={index}>{limit}</p>)}{!excerpts.length && <p className="en-muted">No linked excerpts</p>}{excerpts.map(excerpt => <blockquote key={excerpt.id} data-blocks={JSON.stringify(excerpt.blockIds)} data-highlight={Boolean(selectedBlock && excerpt.blockIds.includes(selectedBlock)) || undefined}><small>{excerpt.location ?? 'Location not supplied'}</small><p className="en-text">{excerpt.text}</p></blockquote>)}</section>)}
    </div>
  </details>
}
function BlockView({ block, path, change, pkg, progress, onProgress, reader = false, inlineSources = false, onShowEvidence, readingDetail = 'full' }: { block: NotebookBlock; path: (string | number)[]; change?: ChangeText; pkg: NotebookPackage; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void; reader?: boolean; inlineSources?: boolean; onShowEvidence?: (id: string) => void; readingDetail?: NotebookReadingDetail }) {
  const guideBlockId = useGuideBlockId(block.id)
  const [practiceSources, setPracticeSources] = useState(false)
  const practiceDisplay = block.type === 'practice' ? practicePromptDisplay(block.prompt) : null
  const { missing } = useNotebookPracticeImages(block)
  const text = (value: string, key: string, label: string) => <ContentText value={value} path={[...path, key]} label={label} change={change} sourceIds={reader && (block.type === 'paragraph' || (block.type === 'practice' && key !== 'prompt')) ? pkg.sources.map(source => source.id) : undefined} inlineSources={block.type === 'practice' ? practiceSources : inlineSources} tables={block.type === 'practice' && key === 'prompt'} />
  const work = progress && Object.hasOwn(progress, block.id) ? progress[block.id] : { response: '', complete: false }
  function changeVisual(next: VisualNotebookBlock) {
    if (!change) return
    if (next.type === 'figure' && block.type === 'figure') for (const key of ['caption', 'alt', 'context'] as const) if (next[key] !== block[key]) change([...path, key], next[key] ?? '')
    if (next.type === 'study-diagram' && block.type === 'study-diagram') {
      if (next.title !== block.title) change([...path, 'title'], next.title)
      next.nodes.forEach((node, i) => { if (node.label !== block.nodes[i].label) change([...path, 'nodes', i, 'label'], node.label) })
      next.edges.forEach((edge, i) => { if (edge.label !== block.edges[i].label) change([...path, 'edges', i, 'label'], edge.label) })
    }
  }
  if (reader && !change && !inlineSources && block.type === 'paragraph') {
    const split = splitNotebookAnnotations(block.text, pkg.sources.map(source => source.id))
    if (!block.more && !split.body.trim() && [...split.leading, ...split.trailing].length > 0 && [...split.leading, ...split.trailing].every(note => note.kind === 'citation')) return null
  }
  if (reader && !change && pkg.version === 4 && readingDetail === 'condensed' && (block.detail === 'extra' || (block.type === 'paragraph' && block.role === 'deeper'))) return null
  return <div id={guideBlockId} data-guide-block={block.id} tabIndex={-1} className={`en-block en-block-${block.type}${block.type === 'practice' && !change ? ' en-practice-unit' : ''}`}>
    {(block.type === 'figure' || block.type === 'study-diagram' || (isLearningVisualBlock(block) && block.type !== 'worked-example' && block.type !== 'illustration')) && <NotebookVisualBlock block={block} onChange={change ? changeVisual : undefined} changeText={change ? (relative, value) => change([...path, ...relative], value) : undefined} />}
    {block.stressed && <ProfessorStressed />}
    {block.type === 'callout' && (change ? text(block.text, 'text', 'Callout text') : <NotebookCallout block={block} />)}
    {block.type === 'illustration' && <NotebookIllustration key={readingDetail} block={block} path={path} change={change} readingDetail={reader ? readingDetail : undefined} />}
    {block.type === 'paragraph' && (block.role && !change ? <section className={block.role === 'connects' ? 'lf-link' : 'lf-why'} aria-label={{connects: 'How this connects',why: 'Why it works',deeper: 'Go deeper'}[block.role]}><h4>{{connects: 'How this connects',why: 'Why it works',deeper: 'Go deeper'}[block.role]}</h4>{text(block.text, 'text', 'Explanation')}</section> : text(block.text, 'text', 'Explanation'))}
    {block.type === 'claim' && <section className="lf-cer" aria-label="Claim, evidence and so what"><div className="lf-cer-row"><h4>Claim</h4>{text(block.claim, 'claim', 'Claim')}</div><div className="lf-cer-row"><h4>Evidence</h4><ul>{block.evidence.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'evidence', i]} label={`Evidence ${i + 1}`} change={change} /></li>)}</ul></div><div className="lf-cer-row"><h4>So what</h4>{text(block.soWhat, 'soWhat', 'So what')}</div></section>}
    {block.type === 'gap' && <div className="en-notice"><b>Source gap</b>{text(block.text, 'text', 'Gap')}{text(block.nextStep, 'nextStep', 'Next step')}</div>}
    {(block.type === 'bullets' || block.type === 'steps') && (block.type === 'steps' ? <ol>{block.items.map((item, i) => <li key={i}><ContentText value={typeof item === 'string' ? item : item.text} path={typeof item === 'string' ? [...path, 'items', i] : [...path, 'items', i, 'text']} label={`Step ${i + 1}`} change={change} />{typeof item !== 'string' && item.reason && <span className="lf-sw"><ContentText value={item.reason} path={[...path, 'items', i, 'reason']} label={`Step ${i + 1} reason`} change={change} /></span>}</li>)}</ol> : <ul>{block.items.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'items', i]} label={`Point ${i + 1}`} change={change} />{block.nestedItems?.filter(group => group.parentIndex === i).map((group, gi) => <ul key={gi}>{group.items.map((child, ci) => <li key={ci}><ContentText value={child} path={[...path, 'nestedItems', block.nestedItems!.indexOf(group), 'items', ci]} label={`Nested point ${ci + 1}`} change={change} /></li>)}</ul>)}</li>)}</ul>)}
    {(block.type === 'paragraph' || block.type === 'bullets') && pkg.version === 4 && (change ? text(block.more ?? '', 'more', 'Additional explanation (leave empty for none)') : block.more && <div className="nbr-additional-detail" hidden={reader && readingDetail === 'condensed'}>{text(block.more, 'more', 'Additional explanation')}</div>)}
    {block.type === 'table' && <div className="en-table-scroll" role="region" aria-label="Notebook table" tabIndex={0}><table><thead><tr>{block.columns.map((column, i) => <th key={i}><ContentText value={column} path={[...path, 'columns', i]} label={`Column ${i + 1}`} change={change} /></th>)}</tr></thead><tbody>{block.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}><ContentText value={cell} path={[...path, 'rows', ri, ci]} label={`Row ${ri + 1}, column ${ci + 1}`} change={change} /></td>)}</tr>)}</tbody></table></div>}
    {block.type === 'practice' && (change ? <>{text(block.prompt, 'prompt', 'Practice prompt')}<NotebookPracticeStimulus block={block} />{text(block.answer, 'answer', 'Answer')}{text(block.rationale, 'rationale', 'Explanation')}<EvidenceView evidence={block} pkg={pkg} /></> : <NotebookPracticeCard
      number={pkg.entries[Number(path[1])].sections.flatMap(section => section.blocks).filter(item => item.type === 'practice').findIndex(item => item.id === block.id) + 1}
      origin={practiceDisplay?.label ?? (block.provenance === 'source' ? 'Question from supplied course material' : 'Additional practice question')}
      prompt={text(practiceDisplay?.body ?? block.prompt, 'prompt', 'Practice prompt')} stimulus={<NotebookPracticeStimulus block={block} />} hasStimulus={Boolean(block.stimulusBlockIds?.length)}
      answer={text(block.answer, 'answer', 'Answer')} rationale={text(block.rationale, 'rationale', 'Explanation')} original={block.prompt} missing={missing} options={block.options} correctIndex={block.correctIndex}
      sources={reader ? <ReaderSources blocks={[block]} pkg={pkg} scope="item" inlineSources={practiceSources} onInlineSources={() => setPracticeSources(previous => !previous)} /> : <EvidenceView evidence={block} pkg={pkg} />}
      earlierWork={onProgress && <details className="nbr-earlier-work"><summary>Your earlier work on this item</summary><p className="en-text">{work.response || 'No saved response.'}</p><p>{work.complete ? 'Previously marked explainable without looking.' : 'Not previously marked explainable.'}</p></details>}
    />)}
    {block.type === 'worked-example' && <section className="nbr-learning-visual nbr-worked-example" aria-label={block.title} data-visual-type="worked-example"><h4>{change ? text(block.title, 'title', 'Worked example title') : block.title}</h4>{text(block.problem, 'problem', 'Worked example problem')}<NotebookPracticeStimulus block={block} />{missing.length && !change ? <p role="status" className="en-notice">Required images are loading or unavailable: {missing.join(', ')}. The worked solution stays closed until its images are available.</p> : <details className="en-answer nbr-reveal"><summary>Reveal worked solution</summary><ol className="nbr-worked-steps">{block.steps.map((step, index) => <li key={step.id}><ContentText value={step.label} path={[...path, 'steps', index, 'label']} label={`Worked step ${index + 1} label`} change={change} /><ContentText value={step.explanation} path={[...path, 'steps', index, 'explanation']} label={`Worked step ${index + 1} explanation`} change={change} /></li>)}</ol><div className="nbr-worked-answer"><b>Answer</b>{text(block.answer, 'answer', 'Worked answer')}{(block.check !== null || change) && <><b>Check</b>{text(block.check ?? '', 'check', 'Worked example check')}</>}</div>{reader ? <ReaderSources blocks={[block]} pkg={pkg} scope="item" inlineSources={practiceSources} onInlineSources={() => setPracticeSources(previous => !previous)} /> : <EvidenceView evidence={block} pkg={pkg} />}</details>}</section>}
    {reader ? block.type !== 'practice' && block.type !== 'worked-example' && <div className="nbr-block-foot" hidden={!inlineSources}><button type="button" className="nbr-cite" onClick={() => onShowEvidence?.(block.id)}>{block.provenance.replaceAll('-', ' ')} / {block.excerptIds.length} excerpts</button></div> : block.type !== 'practice' && <><small className="en-muted">{block.provenance.replaceAll('-', ' ')}</small>{block.type !== 'worked-example' && <EvidenceView evidence={block} pkg={pkg} />}</>}
  </div>
}
type ReadingMode = NotebookReadingMode
function ReaderSection({ section, index, entryIndex, mode, reader, headingId, change, pkg, progress, onProgress, readingDetail, onCheckPractice, changeStatus }: { changeStatus?: 'added' | 'changed'; section: NotebookEntry['sections'][number]; index: number; entryIndex: number; mode: ReadingMode; reader: boolean; readingDetail: NotebookReadingDetail; onCheckPractice?: (ids: string[]) => void; headingId: string; change?: ChangeText; pkg: NotebookPackage; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void }) {
  const [inlineSources, setInlineSources] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const panel = useRef<HTMLDetailsElement>(null)
  const blocks = readerBlocks(section.blocks, mode, reader && !change ? section.purpose : undefined)
  if (!blocks.length) return null
  const entry = pkg.entries[entryIndex]
  const grouped = isGroupedGuide(entry), linesFirst = isLinesFirstGuide(entry)
  const practiceIds = sectionPracticeIds(entry, section)
  const title = change ? <ContentText value={section.title} path={['entries', entryIndex, 'sections', index, 'title']} label="Section title" change={change} /> : section.title
  return <section aria-label={section.title} className={`en-section${reader ? ' nbr-section' : ''}`} data-purpose={section.purpose} data-change-status={changeStatus} data-sources={inlineSources ? 'on' : 'off'}>
    {reader ? <header className="nbr-section-head">{!linesFirst && !blocks.every(block => block.type === 'practice') && <span className="nbr-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>}<h2 id={headingId} tabIndex={-1}>{title}</h2></header> : <><p className="en-eyebrow">{section.purpose.replaceAll('-', ' ')}</p><h3>{title}</h3></>}
    {reader && !linesFirst && section.learningObjectiveIds?.length ? <div className="nsg-lo-chips" aria-label="Learning objectives covered">{section.learningObjectiveIds.map(id => { const objective = entry.objectives.find(item => item.id === id); return objective ? <span key={id}>{objective.title}</span> : null })}</div> : null}
    <div className={reader ? 'nbr-blocks' : undefined}>{section.blocks.map((block, bi) => blocks.includes(block) && <BlockView key={block.id} block={block} path={['entries', entryIndex, 'sections', index, 'blocks', bi]} change={change} pkg={pkg} progress={progress} onProgress={onProgress} reader={reader} readingDetail={mode === 'study' ? readingDetail : 'full'} inlineSources={inlineSources} onShowEvidence={id => { setSelectedBlock(id); if (panel.current) { panel.current.open = true; panel.current.querySelector('summary')?.focus() } }} />)}</div>
    {reader && grouped && mode === 'study' && onCheckPractice && practiceIds.length > 0 && <button type="button" className="nsg-check" onClick={() => onCheckPractice(practiceIds)}>Check yourself</button>}
    {reader && blocks.some(block => block.type !== 'practice' && block.type !== 'worked-example') && <ReaderSources blocks={blocks} pkg={pkg} scope="section" inlineSources={inlineSources} onInlineSources={() => setInlineSources(previous => !previous)} selectedBlock={selectedBlock} panelRef={panel} />}
  </section>
}
function NotebookObjectives({ entry, entryIndex, headingId, pkg, change }: { entry: NotebookEntry; entryIndex: number; headingId?: string; pkg: NotebookPackage; change?: ChangeText }) {
  return <NotebookMasteryObjectives entry={entry} entryIndex={entryIndex} headingId={headingId} renderEvidence={objective => <EvidenceView evidence={objective} pkg={pkg} />} renderText={change ? (value, path, label) => <ContentText value={value} path={path} label={label} change={change} /> : undefined} />
}
function NotebookPackageContent({ pkg, entryId, change, progress, onProgress, mode = 'all', reader = false, practiceFilter, onCheckPractice, summary = false, showReadingDetailControl = true, sectionChanges }: { sectionChanges?: Record<string, 'added' | 'changed'>; showReadingDetailControl?: boolean; practiceFilter?: string[]; onCheckPractice?: (ids: string[]) => void; summary?: boolean; pkg: NotebookPackage; entryId?: string; change?: ChangeText; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void; mode?: ReadingMode; reader?: boolean }) {
  const prefix = useId()
  const { detail, choose, temporary, available } = useNotebookReadingDetail()
  const detailControl = showReadingDetailControl && reader && !change && (mode === 'study' || mode === 'all') && pkg.entries.some(entry => (!entryId || entry.id === entryId) && entry.sections.some(section => readerBlocks(section.blocks, mode, section.purpose).some(block => (block.type === 'paragraph' || block.type === 'bullets' || block.type === 'illustration') && block.more)))
  const text = (value: string, path: (string | number)[], label: string) => <ContentText value={value} path={path} label={label} change={change} />
  const grouped = pkg.entries.some(entry => (!entryId || entry.id === entryId) && isGroupedGuide(entry))
  const contentsPackage = mode === 'practice' && practiceFilter ? { ...pkg, entries: pkg.entries.map(entry => ({ ...entry, sections: entry.sections.map(section => ({ ...section, blocks: section.blocks.filter(block => block.type !== 'practice' || practiceFilter.includes(block.id)) })) })) } : pkg
  const items = notebookReaderContents(contentsPackage, entryId, mode, prefix).filter(item => !grouped || (!item.id.includes('-limits-') && !item.id.includes('-coverage-')))
  if (reader && !summary && (mode === 'study' || mode === 'all')) for (const entry of pkg.entries.filter(entry => !entryId || entry.id === entryId)) if (guideTerms(entry).length) { const id = readerHeadingId(prefix, entry.id, 'glossary'); items.push({ id, title: 'Glossary', targetId: id }) }
  const document = <div className={`external-notebook en-document${reader ? ' nbr-doc' : ''}${pkg.entries.some(isLinesFirstGuide) ? ' lf-document' : ''}`} data-reader-mode={reader ? mode : undefined}>{!reader && <p className="en-badge">Package class: {pkg.course.code} / {pkg.course.title}{pkg.course.term ? ` / ${pkg.course.term}` : ''}</p>}
    {pkg.entries.map((entry, ei) => (!entryId || entry.id === entryId) && <NotebookTermsProvider key={entry.id} entry={entry}><article aria-label={entry.title} data-grouped-guide={isGroupedGuide(entry)}>
      {!reader && <><h2>{change ? text(entry.title, ['entries', ei, 'title'], 'Entry title') : entry.title}</h2><p className="en-muted">{entry.goal} / Revision {entry.revision}{entry.baseRevision ? ` / Based on revision ${entry.baseRevision}` : ''}</p>
      <h3>Scope</h3>{text(entry.scope, ['entries', ei, 'scope'], 'Entry scope')}
      <details><summary>Request and class preferences</summary>{Object.entries(entry.request).map(([key, value]) => value !== null && <div key={key}><b>{key === 'helpStage' ? 'Help stage' : key === 'assessmentFormat' ? 'Assessment format' : 'Class preferences'}</b>{text(value, ['entries', ei, 'request', key], key)}</div>)}</details></>}
      {reader && (mode === 'all' || mode === 'study') && entry.argumentChain && <NotebookArgumentChain items={entry.argumentChain} targetId={id => readerHeadingId(prefix, entry.id, 'section', id)} />}
      {reader && (mode === 'all' || mode === 'mastery') && entry.objectives.length > 0 && <NotebookObjectives entry={practiceFilter ? { ...entry, objectives: entry.objectives.filter(objective => objective.practiceBlockIds.some(id => practiceFilter.includes(id))) } : entry} entryIndex={ei} headingId={readerHeadingId(prefix, entry.id, 'objectives')} pkg={pkg} change={change} />}
      {!change && (mode === 'practice' || mode === 'all') && entry.sections.some(section => section.blocks.some(block => block.type === 'practice')) && (isLinesFirstGuide(entry) ? <header className="lf-practice-head"><h2>Practice set · {entry.title.match(/(?:Lesson|Lecture)\s+\d+/i)?.[0] ?? entry.title}</h2><p className="np-set-cue">Answer each question in your head first, then reveal.</p><span>{entry.sections.flatMap(section => section.blocks).filter(block => block.type === 'practice' && !block.options).length} free response · {entry.sections.flatMap(section => section.blocks).filter(block => block.type === 'practice' && block.options).length} multiple choice</span></header> : <p className="np-set-cue">Answer each question in your head first, then reveal.</p>)}
      {summary ? <NotebookSummary entry={entry} renderMap={block => <NotebookVisualBlock block={block} />} /> : entry.sections.map((section, si) => <ReaderSection key={`${section.id}-${mode}`} changeStatus={sectionChanges?.[section.id]} section={mode === 'practice' && practiceFilter ? { ...section, blocks: section.blocks.filter(block => block.type !== 'practice' || practiceFilter.includes(block.id)) } : section} index={si} entryIndex={ei} mode={mode} reader={reader} readingDetail={detail} onCheckPractice={onCheckPractice} headingId={readerHeadingId(prefix, entry.id, 'section', section.id)} change={change} pkg={pkg} progress={progress} onProgress={onProgress} />)}
      {!summary && reader && (mode === 'study' || mode === 'all') && <NotebookGlossary entry={entry} headingId={readerHeadingId(prefix, entry.id, 'glossary')} />}
      {!reader && (mode === 'all' || mode === 'study') && entry.objectives.length > 0 && <NotebookObjectives entry={entry} entryIndex={ei} pkg={pkg} change={change} />}
      {!summary && (!reader || mode === 'coverage' || mode === 'all' || mode === 'study') && entry.limitations.length > 0 && (grouped ? <details className="en-notice"><summary>Source limits</summary>{entry.limitations.map((item, i) => <div key={i}>{text(item, ['entries', ei, 'limitations', i], 'Entry limitation')}</div>)}</details> : <section className="en-notice"><h3 id={readerHeadingId(prefix, entry.id, 'limits')} tabIndex={-1}>Limits of this entry</h3>{entry.limitations.map((item, i) => <div key={i}>{text(item, ['entries', ei, 'limitations', i], 'Entry limitation')}</div>)}</section>)}
      {!summary && (mode === 'all' || mode === 'study' || mode === 'coverage') && <section aria-label="Requirement coverage">{reader && entry.requirements.some(r => r.status === 'partial' || r.status === 'missing') && <aside className="nbr-coverage-notice"><p>Some requested material is partly covered or missing.</p><button type="button" onClick={() => { const heading = window.document.getElementById(readerHeadingId(prefix, entry.id, 'coverage')), detail = heading?.closest('details'); if (detail) { detail.open = true; if (heading instanceof HTMLHeadingElement) scrollGuideHeadingIntoReadingPane(heading); detail.querySelector('summary')?.focus() } }}>See coverage and next steps</button></aside>}<details className="nbr-coverage-disclosure" open={mode === 'coverage' ? true : undefined}><summary><h3 id={readerHeadingId(prefix, entry.id, 'coverage')} tabIndex={-1}>What's covered and missing</h3></summary><div className="en-coverage">{(['supported', 'partial', 'missing', 'out-of-scope'] as const).map(status => <span key={status} data-status={status}>{{ supported: 'Covered', partial: 'Partly covered', missing: 'Missing', 'out-of-scope': 'Outside this notebook' }[status]}: {entry.requirements.filter(r => r.status === status).length}</span>)}</div>
        {entry.requirements.map((r, ri) => <details key={r.id} data-requirement-id={r.id} open={r.status !== 'supported'}><summary>{r.text} / {{ supported: 'Covered', partial: 'Partly covered', missing: 'Missing', 'out-of-scope': 'Outside this notebook' }[r.status]}</summary><small>{r.kind} / {r.authority}</small>{change && text(r.text, ['entries', ei, 'requirements', ri, 'text'], 'Requirement wording')}{text(r.basis, ['entries', ei, 'requirements', ri, 'basis'], 'Coverage basis')}{r.nextStep !== null && <div className="nbr-coverage-next"><b>What to do next</b>{text(r.nextStep, ['entries', ei, 'requirements', ri, 'nextStep'], 'Next step')}</div>}<p>Covered in: {r.sectionIds.map(id => entry.sections.find(s => s.id === id)?.title).join(', ') || 'No section'}</p><EvidenceView evidence={r} pkg={pkg} /></details>)}
      </details></section>}
    </article></NotebookTermsProvider>)}
    {(mode === 'all' || mode === 'sources') && <details className="en-sources" open={mode === 'sources' ? true : undefined}><summary>All supplied sources and access limits ({pkg.sources.length})</summary>{pkg.sources.map((s, si) => <section key={s.id}><h3 id={readerHeadingId(prefix, 'sources', 'source', s.id)} tabIndex={-1}>{s.title}</h3><p>{s.role} / {s.access} / {s.used ? 'Used' : 'Not used'}</p>{text(s.inspected, ['sources', si, 'inspected'], 'What was inspected')}{s.limitations.map((item, i) => <div key={i}>{text(item, ['sources', si, 'limitations', i], 'Source limitation')}</div>)}{s.excerpts.map((e, i) => <blockquote key={e.id}><small>{e.location ?? 'Location not supplied'}</small>{text(e.text, ['sources', si, 'excerpts', i, 'text'], 'Supplied excerpt')}</blockquote>)}</section>)}</details>}
    <small className="en-muted">{pkg.instructionsVersion}. Externally created; structural validation does not verify teaching accuracy or source completeness.</small>
  </div>
  return reader && summary ? document : reader ? <>{detailControl && <section className="nbr-reading-detail" aria-label="Guide reading detail"><div><strong>Reading detail</strong><p id={`${prefix}-detail-status`} role="status">{detail === 'full' ? 'All explanations are visible.' : 'Key ideas only. Switch to Full detail for every explanation.'}{temporary && ' This choice could not be remembered after closing this session.'}{!available && ' Browser preferences are unavailable.'}</p></div><div className="nbr-detail-options" role="group" aria-label="Reading detail">{(['condensed', 'full'] as const).map(value => <Button key={value} variant="ghost" disabled={!available} aria-pressed={detail === value} aria-describedby={`${prefix}-detail-status`} onClick={() => choose(value)}>{value === 'full' ? 'Full detail' : 'Condensed'}</Button>)}</div></section>}<div className="nbr-layout"><aside className="nbr-aside"><ReadingContents key={mode} items={items} label="Notebook contents" onNavigate={id => { const item = items.find(item => item.id === id); const heading = item ? window.document.getElementById(item.targetId) : null; if (heading instanceof HTMLHeadingElement) { for (let parent = heading.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true; scrollGuideHeadingIntoReadingPane(heading) } }} /></aside>{document}</div></> : document
}
export function NotebookPackageView(props: Parameters<typeof NotebookPackageContent>[0] & { assetBindings?: readonly NotebookAssetBinding[] }) {
  return <NotebookAssetsProvider pkg={props.pkg} bindings={props.assetBindings}><NotebookPackageContent {...props} />{(!props.mode || ['all', 'coverage', 'sources'].includes(props.mode)) && <NotebookVisualReview pkg={props.pkg} />}</NotebookAssetsProvider>
}
type ExternalNotebookViewProps = { lecture: LectureRecord; courseCode: string; onNavigateEntry?: (id: string, destinationCourseId?: string) => void }
export function ExternalNotebookView(props: ExternalNotebookViewProps) {
  return <NotebookReadGuard lecture={props.lecture} downloadRecovery={text => downloadNotebookText('notebook-recovery.json', text)}><ValidatedExternalNotebookView {...props} /></NotebookReadGuard>
}
function ValidatedExternalNotebookView({ lecture, courseCode, onNavigateEntry }: ExternalNotebookViewProps) {
  const n = lecture.importedNotebook!
  const [draft, setDraft] = useState<NotebookPackage | null>(null)
  const [notes, setNotes] = useState(n.notes)
  const [notesBase, setNotesBase] = useState(n.notes)
  const [editBase, setEditBase] = useState(notebookContentKey(n))
  // A retained draft is available through the explicit update action; it is not the default reader mode.
  const [updating, setUpdating] = useState(false)
  const [restore, setRestore] = useState<{ id: string; state: string } | null>(null)
  const [mode, setMode] = useState<ReadingMode>('study')
  const [practiceFilter, setPracticeFilter] = useState<string[]>()
  const [summary, setSummary] = useState(false)
  const [flashcards, setFlashcards] = useState(false)
  const [practiceFlow, setPracticeFlow] = useState(false)
  const classCenter = useStore(state => state.academics.classCenter)
  const [tools, setTools] = useState<'download' | 'history' | 'details' | 'notes' | null>(null)
  const reading = useNotebookReadingDetail()
  const [message, setMessage] = useState('')
  function updateText(path: (string | number)[], value: string | null) {
    setDraft(previous => {
      const next = structuredClone(previous ?? n.current)
      let node: unknown = next
      for (const key of path.slice(0, -1)) node = (node as Record<string | number, unknown>)[key]
      ;(node as Record<string | number, unknown>)[path.at(-1)!] = ['caption', 'timeLabel', 'check', 'more'].includes(String(path.at(-1))) && value === '' ? null : value
      return next
    })
  }
  async function progress(id: string, response: string, complete: boolean) {
    try {
      await notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target?.importedNotebook) throw new Error('Entry no longer exists.'); target.importedNotebook.progress = { ...target.importedNotebook.progress, [id]: { response, complete } }; target.updatedAt = Date.now() })
      setMessage('Response and progress saved.')
    } catch (error) { setMessage((error as Error).message) }
  }
  async function save() {
    try {
      const policy = notebookPracticePolicy(n.current, draft ?? n.current, n.entryId)
      await notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target) throw new Error('Entry no longer exists.'); saveNotebookEdits(target, draft ?? n.current, notes, Date.now(), { content: draft ? editBase : notebookContentKey(n), notes: notesBase }) })
      if (draft) setMode('study')
      setDraft(null); setNotesBase(notes); setMessage(`Edits saved. Original import retained. ${policy.explanation}`)
    } catch (error) { setMessage((error as Error).message) }
  }
  async function startUpdate(restart = false) {
    if (draft || notes !== n.notes) { setMessage('Save your edits and notes, or cancel the unsaved changes, before starting an update. Only saved content is exported.'); return }
    // Reopening an existing draft is navigation. The import/acceptance step
    // still verifies the saved baseline and acknowledges its durable commit.
    if (!restart && n.updateSession) { setUpdating(true); setMessage(''); return }
    try {
      await notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target?.importedNotebook || notebookStateKey(target.importedNotebook) !== notebookStateKey(n)) throw new Error('This notebook changed. Reopen its latest saved content before starting an update.')
        if (restart || !target.importedNotebook.updateSession) target.importedNotebook.updateSession = createNotebookUpdateSession(target.importedNotebook, target.id)
        if (target.importedNotebook.current.version !== 2 || target.importedNotebook.assetBindings?.length) assertNotebookBackupFits(target.importedNotebook, target.courseId)
      })
      setUpdating(true); setMessage('')
    } catch (error) { setMessage((error as Error).message) }
  }
  // Class days' Update link (#/…/journal/<id>?update=1): a lesson's later class goes straight
  // into this notebook's update. Read once from the hash URL, then dropped from it.
  useEffect(() => {
    const hash = typeof window === 'undefined' ? '' : window.location.hash
    if (!/[?&]update=1\b/.test(hash)) return
    window.history.replaceState(window.history.state, '', hash.replace(/([?&])update=1&?/, '$1').replace(/[?&]$/, ''))
    void startUpdate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  async function restoreVersion() {
    if (!restore) return
    if (draft || notes !== n.notes) { setMessage('Save or cancel unsaved edits and notes before restoring.'); return }
    try {
      await notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target) throw new Error('Entry no longer exists.')
        restoreNotebookVersion(target, restore.id, restore.state)
      })
      const restored = useStore.getState().academics.classCenter.lectures.find(l => l.id === lecture.id)!.importedNotebook!
      setNotes(restored.notes); setNotesBase(restored.notes); setRestore(null); setMessage('Version restored with its notes and study records. The version it replaced is also retained in history.')
    } catch (error) { setMessage((error as Error).message) }
  }
  if (practiceFlow) return <section className="external-notebook"><Button variant="outline" onClick={() => setPracticeFlow(false)}>Back to notebook</Button><NotebookPortableExports lecture={lecture} /><ExternalNotebookWorkflow courseId={lecture.courseId} initialGoal="assessment" initialScope={lecture.title} workflowId={`practice:${lecture.id}`} onImported={(id, courseId) => { setPracticeFlow(false); onNavigateEntry?.(id, courseId) }} /></section>
  if (flashcards) return <section className="external-notebook"><FlashcardPromptPanel courseId={lecture.courseId} courseLabel={courseCode} lectureId={lecture.id} onClose={() => setFlashcards(false)} /></section>
  const staleUpdate = Boolean(n.updateSession && canonical(n.updateSession.baseline) !== notebookContentKey(n))
  if (updating && n.updateSession) return <section className="external-notebook" aria-label="Update saved notebook"><div className="en-actions"><Button variant="outline" onClick={() => { setUpdating(false); setMode('study') }}>Back to saved entry</Button><Button variant="ghost" onClick={() => startUpdate(true)}>Restart from latest saved entry</Button></div><p className="en-muted">Restart only when you need a newer baseline. Keep any unfinished prompt or proposal first; it starts a fresh update draft, not a new notebook.</p><p role="status">{message}</p><NotebookUpdateImageFiles lecture={lecture} revision={n.updateSession} disabled={staleUpdate} /><ExternalNotebookWorkflow key={n.updateSession.id} courseId={lecture.courseId} revision={n.updateSession} baselineFresh={!staleUpdate} onImported={(id, destinationCourseId) => { setUpdating(false); setMode('study'); setMessage(id === lecture.id ? 'Notebook update saved. Previous versions remain in history.' : 'Separate entry saved. The original notebook remains unchanged.'); onNavigateEntry?.(id, destinationCourseId) }} /></section>
  const restoreVersionPreview = restore ? n.history?.find(v => v.id === restore.id) : undefined
  const entry = n.current.entries.find(entry => entry.id === n.entryId)!
  const practiceCount = entry.sections.flatMap(section => section.blocks).filter(block => block.type === 'practice').length
  const shortScope = entry.scope.trim().split(/\r?\n|(?<=[.!?])\s/)[0]
  const lessonLabel = lecture.title.match(/(?:Lesson|Lecture)\s+\d+/i)?.[0]
  const lessonTitle = lecture.title.replace(/^(Lesson|Lecture)\s+(\d+)\s*[—–:.-]\s*/i, '$1 $2 · ')
  const fileIds = new Set(classCenter.files.filter(file => file.lectureId === lecture.id).map(file => file.id))
  const chunkIds = new Set(classCenter.sourceChunks.filter(chunk => fileIds.has(chunk.fileId)).map(chunk => chunk.id))
  const hasFlashcards = classCenter.generatedFlashcardDecks.some(deck => deck.courseId === lecture.courseId && deck.sourceChunkIds.some(id => chunkIds.has(id)))
  return <section className={`external-notebook nbr${isLinesFirstGuide(entry) ? ' lf-reader' : ''}`} aria-label="Saved external notebook"><header className="en-header nbr-head"><div className="nbr-head-main"><p className="en-eyebrow">{[courseCode, lessonLabel, lecture.occurredOn].filter(Boolean).join(' · ')}</p><h1>{lessonTitle}</h1><p className="nbr-scope en-text" title={entry.scope}>{shortScope}</p></div><div className="en-actions nbr-head-actions"><Button variant="outline" onClick={() => startUpdate()}><RefreshCw size={17} aria-hidden="true" />Update</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More notebook actions"><Ellipsis size={20} aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled={Boolean(draft)} onSelect={() => { setDraft(structuredClone(n.current)); setEditBase(notebookContentKey(n)); setMessage('Editing a separate copy. Save to keep changes; the previous content stays in history.') }}><Pencil size={16} />Edit notebook</DropdownMenuItem><DropdownMenuItem onSelect={() => setTools('download')}><Download size={16} />Download</DropdownMenuItem><DropdownMenuItem onSelect={() => setTools('history')}><History size={16} />Version history</DropdownMenuItem><DropdownMenuItem onSelect={() => setTools('details')}><Info size={16} />Notebook details</DropdownMenuItem><DropdownMenuItem onSelect={() => setTools('notes')}><StickyNote size={16} />My notes</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header>
    {!draft && (!hasFlashcards || !practiceCount) && <div className="lf-next-steps" aria-label="Next steps">{!hasFlashcards && <div><Layers aria-hidden="true" /><span><strong>Make flashcards</strong><small>From this notebook, with your AI.</small></span><Button onClick={() => setFlashcards(true)} aria-label="Start making flashcards">Start</Button></div>}{!practiceCount && <div><Layers aria-hidden="true" /><span><strong>Make a practice set</strong><small>Exam-style questions from this notebook.</small></span><Button variant="outline" onClick={() => setPracticeFlow(true)} aria-label="Start making a practice set">Start</Button></div>}</div>}
    <Dialog open={tools !== null} onOpenChange={open => { if (!open) setTools(null) }}><DialogContent className="nbr-tools-dialog external-notebook"><DialogHeader><DialogTitle>{{download: 'Download notebook',history: 'Version history',details: 'Notebook details',notes: 'My notes'}[tools ?? 'details']}</DialogTitle></DialogHeader><NotebookImportAdjustments raw={n.acceptedRaw ?? n.originalRaw} /><div className="nbr-tools-body"><NotebookPortableExports lecture={lecture} />
    <details open={tools === 'details'}><summary>Request and class preferences</summary><p className="en-text">{entry.scope}</p><p>{entry.goal} / Revision {entry.revision} / {entry.sections.length} sections / {practiceCount} practice items / {entry.objectives.length} objectives / {n.current.sources.length} sources</p><p>Package class: {n.current.course.code} / {n.current.course.title}{n.current.course.term ? ` / ${n.current.course.term}` : ''}</p>{Object.entries(entry.request).map(([key, value]) => value !== null && <div key={key}><b>{key === 'helpStage' ? 'Help stage' : key === 'assessmentFormat' ? 'Assessment format' : 'Class preferences'}</b><p className="en-text"><NotebookInlineText text={value} /></p></div>)}</details>
    <details className="en-small-detail"><summary>JSON-only exports</summary><div className="en-actions"><Button variant="outline" onClick={() => { try { downloadNotebookText(notebookExportFilename(n, 'current'), exportNotebook(lecture, 'current')) } catch (error) { setMessage((error as Error).message) } }}>Export current JSON</Button><Button variant="outline" onClick={() => downloadNotebookText(notebookExportFilename(n, 'original'), exportNotebook(lecture, 'original'))}>Export original</Button><Button variant="outline" onClick={() => downloadNotebookText(notebookExportFilename(n, 'backup'), exportNotebook(lecture, 'backup'))}>JSON records with progress</Button></div><p>These JSON files do not contain image bytes. Use the complete portable backup to move or preserve a visual notebook.</p></details>
    {n.revisedFromLectureId && <p className="en-notice">Saved as a separate revision. Your earlier entry, edits, and progress remain in the class notebook.</p>}
    <p className="en-muted">Current JSON contains saved content and source references for your AI. JSON records additionally contain notes, progress and the original import, but not image files.</p>
    <label className="en-field">My notes<textarea value={notes} onChange={event => setNotes(event.target.value)} /></label>{!draft && <div className="en-actions"><Button variant="outline" onClick={save}>Save notes</Button>{notes !== n.notes && <Button variant="ghost" onClick={() => { setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved notes discarded.') }}>Cancel note changes</Button>}</div>}
    <details className="en-history" open={tools === 'history'}><summary>Version history ({n.history?.length ?? 0})</summary><p>Saved versions retain content, sources, notes and study records. Restoring also retains the version it replaces. Backups include history.</p>{notebookHistoryRetentionNote(n) && <p className="en-muted">{notebookHistoryRetentionNote(n)}</p>}{!(n.history?.length) && <p>No earlier versions yet.</p>}{[...(n.history ?? [])].reverse().map(version => <div className="en-history-row" key={version.id}><span>{new Date(version.savedAt).toLocaleString()} / before {version.reason} / {version.current.entries.find(e => e.id === n.entryId)?.title}</span><Button variant="outline" onClick={() => setRestore({ id: version.id, state: notebookStateKey(n) })}>Review this version</Button></div>)}{restoreVersionPreview && <section className="en-stage-panel" aria-label="Restore preview"><h3>Review before restoring</h3><p>This restores the shown content and its saved notes and study records. Your current version will remain recoverable.</p><p className="en-text">Saved notes: {restoreVersionPreview.notes || 'None'}</p><details><summary>Saved practice responses and checkmarks</summary>{Object.entries(restoreVersionPreview.progress).map(([id, work]) => <p className="en-text" key={id}>{id}: {work.response || 'No response'} / {work.complete ? 'Checked by you' : 'Not checked'}</p>)}</details><NotebookPackageView pkg={restoreVersionPreview.current} entryId={n.entryId} assetBindings={n.assetBindings} /><div className="en-actions"><Button disabled={Boolean(draft) || notes !== n.notes} onClick={restoreVersion}>Restore this version</Button><Button variant="outline" onClick={() => setRestore(null)}>Cancel restore</Button></div></section>}</details>
    </div></DialogContent></Dialog>
    {draft && <div className="en-notice"><b>Editing your copy</b><p>Exports use the last saved content. Reveal collapsed sections to edit their text.</p><p>{notebookPracticePolicy(n.current, draft, n.entryId).explanation}</p><div className="en-actions"><Button onClick={save}>Save edits</Button><Button variant="outline" onClick={() => { setDraft(null); setMode('study'); setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved content changes discarded.') }}>Cancel edits</Button></div></div>}
    <p className={message ? 'en-reader-status' : 'sr-only'} role="status" aria-live="polite">{message}</p>
    <nav className="en-actions nbr-views" aria-label="Notebook reading views"><div className="nbr-tab-buttons">{(['study', 'mastery', 'practice', 'sources'] as const).map(view => <Button asChild key={view} variant={mode === view ? 'default' : 'outline'} aria-pressed={mode === view} data-count={view === 'practice' ? practiceCount : view === 'sources' ? n.current.sources.length : undefined} onClick={() => { setMode(view); setSummary(false); setPracticeFilter(undefined) }}><button type="button" className="nbr-view-button">{view === 'study' ? entry.goal === 'assessment' ? 'Assessment prep' : entry.goal === 'assignment' ? 'Assignment workspace' : 'Study guide' : view === 'mastery' ? 'Mastery objectives' : view === 'practice' ? 'Practice set' : 'Sources'}</button></Button>)}</div>{mode === 'study' && <div className="nbr-header-detail" role="group" aria-label="Reading detail">{(['condensed', 'full'] as const).map(value => <button key={value} type="button" disabled={!reading.available} aria-pressed={reading.detail === value} onClick={() => reading.choose(value)}>{value === 'full' ? 'Full' : 'Condensed'}</button>)}</div>}</nav>
    {isGroupedGuide(entry) && !draft && <div className="en-actions"><Button variant="outline" aria-pressed={summary} onClick={() => { setSummary(previous => !previous); setMode('study') }}>{summary ? 'Back to study guide' : 'One-page summary'}</Button>{summary && <Button variant="outline" onClick={() => void printNotebookSummary()}>Print summary</Button>}{practiceFilter && mode === 'practice' && <Button variant="ghost" onClick={() => setPracticeFilter(undefined)}>Show all practice</Button>}</div>}
    <NotebookPackageView showReadingDetailControl={false} summary={summary && !draft} practiceFilter={practiceFilter} onCheckPractice={ids => { setPracticeFilter(ids); setSummary(false); setMode('practice') }} mode={draft ? 'all' : mode} pkg={draft ?? n.current} entryId={n.entryId} change={draft ? updateText : undefined} progress={n.progress} onProgress={progress} reader={!draft} assetBindings={n.assetBindings} />
  </section>
}
export function notebookEntryLabel(entry: NotebookEntry) { return `${entry.title} / ${entry.goal} / revision ${entry.revision}` }
