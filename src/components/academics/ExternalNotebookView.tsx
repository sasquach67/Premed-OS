import { useId, useRef, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { STORAGE_KEY, useStore } from '@/store/store'
import { storageFailure } from '@/store/storageHealth'
import { exportNotebook, restoreNotebookVersion, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { createNotebookUpdateSession, notebookContentKey, notebookPracticePolicy, notebookStateKey } from '@/lib/academics/notebook/revision'
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
import { assertNotebookBackupFits } from '@/lib/academics/notebook/notebookBundle'
import { visualAssetReferences } from '@/lib/academics/notebook/visualPackage'
import type { NotebookAssetBinding, VisualNotebookBlock } from '@/lib/academics/notebook/visualTypes'
import './externalNotebook.css'
import './notebookVisuals.css'

export function notebookTransaction(mutator: (state: AppData) => void) {
  const previous = useStore.getState().academics
  const persisted = localStorage.getItem(STORAGE_KEY)
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
    if (canonical(diskEntries) !== canonical(memoryEntries) || canonical(diskClasses) !== canonical(memoryClasses)) throw new Error('A notebook or class changed in another tab. Reload this page before saving so its newer content and progress are not overwritten. Keep any unsaved text before reloading.')
  }
  useStore.getState().update(mutator)
  const failure = storageFailure()
  if (failure) {
    useStore.getState().update(state => { state.academics = structuredClone(previous) })
    throw new Error(`Browser storage could not save this notebook. ${failure} Free space or export your JSON and try again. No saved success was reported.`)
  }
}
export function downloadNotebookText(filename: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
type ChangeText = (path: (string | number)[], text: string) => void
function ContentText({ value, path, label, change, sourceIds, inlineSources = false, tables = false }: { value: string; path: (string | number)[]; label: string; change?: ChangeText; sourceIds?: string[]; inlineSources?: boolean; tables?: boolean }) {
  if (change) return <label className="en-field">{label}<textarea value={value} onChange={event => change(path, event.target.value)} /></label>
  if (tables) return <>{notebookPromptParts(value).map((part, index) => part.type === 'text' ? <p className="en-text" key={index}>{part.text}</p> : <div className="en-table-scroll nbr-prompt-table" role="region" aria-label="Practice prompt data" tabIndex={0} key={index}><table><thead><tr>{part.columns.map((column, ci) => <th scope="col" style={{ textAlign: part.align[ci] }} key={ci}>{column}</th>)}</tr></thead><tbody>{part.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td style={{ textAlign: part.align[ci] }} key={ci}>{cell}</td>)}</tr>)}</tbody></table></div>)}</>
  if (!sourceIds) return <p className="en-text">{value}</p>
  const { body, leading, trailing } = splitNotebookAnnotations(value, sourceIds)
  const annotation = (note: typeof leading[number], index: number) => note.kind === 'citation' && !inlineSources ? null : <div key={index} className={note.kind === 'limit' ? 'nbr-qualification en-text' : 'nbr-prov'}>{note.kind === 'limit' && <span className="sr-only">Qualification: </span>}<span>{note.displayText ?? note.text}</span></div>
  return <>{leading.map(annotation)}{body.trim() && <p className="en-text">{body}</p>}{trailing.map(annotation)}</>
}
function EvidenceView({ evidence, pkg }: { evidence: Evidence; pkg: NotebookPackage }) {
  const assetIds = visualAssetReferences(evidence), assets = pkg.version === 3 ? pkg.assets.filter(a => assetIds.includes(a.id)) : []
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
function BlockView({ block, path, change, pkg, progress, onProgress, reader = false, inlineSources = false, onShowEvidence }: { block: NotebookBlock; path: (string | number)[]; change?: ChangeText; pkg: NotebookPackage; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void; reader?: boolean; inlineSources?: boolean; onShowEvidence?: (id: string) => void }) {
  const [practiceSources, setPracticeSources] = useState(false)
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
    if (!split.body.trim() && [...split.leading, ...split.trailing].length > 0 && [...split.leading, ...split.trailing].every(note => note.kind === 'citation')) return null
  }
  return <div className={`en-block en-block-${block.type}`}>
    {(block.type === 'figure' || block.type === 'study-diagram') && <NotebookVisualBlock block={block} onChange={change ? changeVisual : undefined} />}
    {block.type === 'paragraph' && text(block.text, 'text', 'Explanation')}
    {block.type === 'gap' && <div className="en-notice"><b>Source gap</b>{text(block.text, 'text', 'Gap')}{text(block.nextStep, 'nextStep', 'Next step')}</div>}
    {(block.type === 'bullets' || block.type === 'steps') && (block.type === 'steps' ? <ol>{block.items.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'items', i]} label={`Step ${i + 1}`} change={change} /></li>)}</ol> : <ul>{block.items.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'items', i]} label={`Point ${i + 1}`} change={change} /></li>)}</ul>)}
    {block.type === 'table' && <div className="en-table-scroll" role="region" aria-label="Notebook table" tabIndex={0}><table><thead><tr>{block.columns.map((column, i) => <th key={i}><ContentText value={column} path={[...path, 'columns', i]} label={`Column ${i + 1}`} change={change} /></th>)}</tr></thead><tbody>{block.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}><ContentText value={cell} path={[...path, 'rows', ri, ci]} label={`Row ${ri + 1}, column ${ci + 1}`} change={change} /></td>)}</tr>)}</tbody></table></div>}
    {block.type === 'practice' && <><b>Try it yourself</b>{text(block.prompt, 'prompt', 'Practice prompt')}<NotebookPracticeStimulus block={block} /><p className="nbr-mental-cue">Answer it in your head first, then reveal.</p>{missing.length > 0 && !change ? <p role="status" className="en-notice">Required images are loading or unavailable: {missing.join(', ')}. Reveal stays closed until they are available. Your saved practice records have not changed.</p> : <details className="en-answer nbr-reveal"><summary>Reveal answer and explanation</summary>{text(block.answer, 'answer', 'Answer')}{text(block.rationale, 'rationale', 'Explanation')}{reader ? <><small className="en-muted">{block.provenance === 'source' ? 'Question from supplied course material' : 'Additional practice question'}</small><ReaderSources blocks={[block]} pkg={pkg} scope="item" inlineSources={practiceSources} onInlineSources={() => setPracticeSources(previous => !previous)} /></> : <EvidenceView evidence={block} pkg={pkg} />}{onProgress && <details className="nbr-earlier-work"><summary>Your earlier work on this item</summary><p className="en-text">{work.response || 'No saved response.'}</p><p>{work.complete ? 'Previously marked explainable without looking.' : 'Not previously marked explainable.'}</p></details>}</details>}</>}
    {reader ? block.type !== 'practice' && <div className="nbr-block-foot" hidden={!inlineSources}><button type="button" className="nbr-cite" onClick={() => onShowEvidence?.(block.id)}>{block.provenance.replaceAll('-', ' ')} / {block.excerptIds.length} excerpts</button></div> : <><small className="en-muted">{block.provenance.replaceAll('-', ' ')}</small>{block.type !== 'practice' && <EvidenceView evidence={block} pkg={pkg} />}</>}
  </div>
}
type ReadingMode = NotebookReadingMode
function ReaderSection({ section, index, entryIndex, mode, reader, headingId, change, pkg, progress, onProgress }: { section: NotebookEntry['sections'][number]; index: number; entryIndex: number; mode: ReadingMode; reader: boolean; headingId: string; change?: ChangeText; pkg: NotebookPackage; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void }) {
  const [inlineSources, setInlineSources] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const panel = useRef<HTMLDetailsElement>(null)
  const blocks = readerBlocks(section.blocks, mode)
  if (!blocks.length) return null
  const title = change ? <ContentText value={section.title} path={['entries', entryIndex, 'sections', index, 'title']} label="Section title" change={change} /> : section.title
  return <section aria-label={section.title} className={`en-section${reader ? ' nbr-section' : ''}`} data-purpose={section.purpose} data-sources={inlineSources ? 'on' : 'off'}>
    {reader ? <header className="nbr-section-head"><span className="nbr-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h2 id={headingId} tabIndex={-1}>{title}</h2></header> : <><p className="en-eyebrow">{section.purpose.replaceAll('-', ' ')}</p><h3>{title}</h3></>}
    <div className={reader ? 'nbr-blocks' : undefined}>{section.blocks.map((block, bi) => blocks.includes(block) && <BlockView key={block.id} block={block} path={['entries', entryIndex, 'sections', index, 'blocks', bi]} change={change} pkg={pkg} progress={progress} onProgress={onProgress} reader={reader} inlineSources={inlineSources} onShowEvidence={id => { setSelectedBlock(id); if (panel.current) { panel.current.open = true; panel.current.querySelector('summary')?.focus() } }} />)}</div>
    {reader && blocks.some(block => block.type !== 'practice') && <ReaderSources blocks={blocks} pkg={pkg} scope="section" inlineSources={inlineSources} onInlineSources={() => setInlineSources(previous => !previous)} selectedBlock={selectedBlock} panelRef={panel} />}
  </section>
}
function NotebookObjectives({ entry, entryIndex, headingId, pkg, change }: { entry: NotebookEntry; entryIndex: number; headingId?: string; pkg: NotebookPackage; change?: ChangeText }) {
  const ei = entryIndex
  const text = (value: string, path: (string | number)[], label: string) => <ContentText value={value} path={path} label={label} change={change} />
  return <section aria-label="Mastery objectives" className="nbr-objectives"><h3 id={headingId} tabIndex={headingId ? -1 : undefined}>Mastery objectives</h3>{entry.objectives.map((o, oi) => <details key={o.id}><summary>{o.title} / {o.origin}</summary>{change && text(o.title, ['entries', ei, 'objectives', oi, 'title'], 'Objective title')}<p>Requirement: {entry.requirements.find(r => r.id === o.requirementId)?.text}</p><h4>Try recalling first</h4>{o.freeRecallCues.map((cue, i) => <div key={i}>{text(cue, ['entries', ei, 'objectives', oi, 'freeRecallCues', i], 'Recall cue')}</div>)}<details><summary>Reveal understanding, application, and cautions</summary>{(['understand', 'beAbleToDo', 'watchFor'] as const).map(key => <div key={key}><h4>{key === 'understand' ? 'Understand' : key === 'beAbleToDo' ? 'Be able to do' : 'Watch for'}</h4>{o[key].map((item, i) => <div key={i}>{text(item, ['entries', ei, 'objectives', oi, key, i], key)}</div>)}</div>)}{o.evidenceLimit !== null && text(o.evidenceLimit, ['entries', ei, 'objectives', oi, 'evidenceLimit'], 'Evidence limit')}<p>Practice: {o.practiceBlockIds.map(id => entry.sections.flatMap(s => s.blocks).find(b => b.id === id)).map(b => b?.type === 'practice' ? b.prompt : '').join('; ') || 'None linked'}</p><EvidenceView evidence={o} pkg={pkg}/></details></details>)}</section>
}
function NotebookPackageContent({ pkg, entryId, change, progress, onProgress, mode = 'all', reader = false }: { pkg: NotebookPackage; entryId?: string; change?: ChangeText; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void; mode?: ReadingMode; reader?: boolean }) {
  const prefix = useId()
  const text = (value: string, path: (string | number)[], label: string) => <ContentText value={value} path={path} label={label} change={change} />
  const items = notebookReaderContents(pkg, entryId, mode, prefix)
  const document = <div className={`external-notebook en-document${reader ? ' nbr-doc' : ''}`} data-reader-mode={reader ? mode : undefined}>{!reader && <p className="en-badge">Package class: {pkg.course.code} / {pkg.course.title}{pkg.course.term ? ` / ${pkg.course.term}` : ''}</p>}
    {pkg.entries.map((entry, ei) => (!entryId || entry.id === entryId) && <article key={entry.id} aria-label={entry.title}>
      {!reader && <><h2>{change ? text(entry.title, ['entries', ei, 'title'], 'Entry title') : entry.title}</h2><p className="en-muted">{entry.goal} / Revision {entry.revision}{entry.baseRevision ? ` / Based on revision ${entry.baseRevision}` : ''}</p>
      <h3>Scope</h3>{text(entry.scope, ['entries', ei, 'scope'], 'Entry scope')}
      <details><summary>Request and class preferences</summary>{Object.entries(entry.request).map(([key, value]) => value !== null && <div key={key}><b>{key === 'helpStage' ? 'Help stage' : key === 'assessmentFormat' ? 'Assessment format' : 'Class preferences'}</b>{text(value, ['entries', ei, 'request', key], key)}</div>)}</details></>}
      {reader && (mode === 'all' || mode === 'practice') && entry.objectives.length > 0 && <NotebookObjectives entry={entry} entryIndex={ei} headingId={readerHeadingId(prefix, entry.id, 'objectives')} pkg={pkg} change={change} />}
      {entry.sections.map((section, si) => <ReaderSection key={`${section.id}-${mode}`} section={section} index={si} entryIndex={ei} mode={mode} reader={reader} headingId={readerHeadingId(prefix, entry.id, 'section', section.id)} change={change} pkg={pkg} progress={progress} onProgress={onProgress} />)}
      {!reader && (mode === 'all' || mode === 'study') && entry.objectives.length > 0 && <NotebookObjectives entry={entry} entryIndex={ei} pkg={pkg} change={change} />}
      {(!reader || mode === 'coverage' || mode === 'all' || mode === 'study') && entry.limitations.length > 0 && <section className="en-notice"><h3 id={readerHeadingId(prefix, entry.id, 'limits')} tabIndex={-1}>Limits of this entry</h3>{entry.limitations.map((item, i) => <div key={i}>{text(item, ['entries', ei, 'limitations', i], 'Entry limitation')}</div>)}</section>}
      {(mode === 'all' || mode === 'study' || mode === 'coverage') && <section aria-label="Requirement coverage">{reader && entry.requirements.some(r => r.status === 'partial' || r.status === 'missing') && <aside className="nbr-coverage-notice"><p>Some requested material is partly covered or missing.</p><button type="button" onClick={() => { const heading = window.document.getElementById(readerHeadingId(prefix, entry.id, 'coverage')), detail = heading?.closest('details'); if (detail) { detail.open = true; if (heading instanceof HTMLHeadingElement) scrollGuideHeadingIntoReadingPane(heading); detail.querySelector('summary')?.focus() } }}>See coverage and next steps</button></aside>}<details className="nbr-coverage-disclosure" open={mode === 'coverage' ? true : undefined}><summary><h3 id={readerHeadingId(prefix, entry.id, 'coverage')} tabIndex={-1}>What's covered and missing</h3></summary><div className="en-coverage">{(['supported', 'partial', 'missing', 'out-of-scope'] as const).map(status => <span key={status} data-status={status}>{{ supported: 'Covered', partial: 'Partly covered', missing: 'Missing', 'out-of-scope': 'Outside this notebook' }[status]}: {entry.requirements.filter(r => r.status === status).length}</span>)}</div>
        {entry.requirements.map((r, ri) => <details key={r.id} data-requirement-id={r.id} open={r.status !== 'supported'}><summary>{r.text} / {{ supported: 'Covered', partial: 'Partly covered', missing: 'Missing', 'out-of-scope': 'Outside this notebook' }[r.status]}</summary><small>{r.kind} / {r.authority}</small>{change && text(r.text, ['entries', ei, 'requirements', ri, 'text'], 'Requirement wording')}{text(r.basis, ['entries', ei, 'requirements', ri, 'basis'], 'Coverage basis')}{r.nextStep !== null && <div className="nbr-coverage-next"><b>What to do next</b>{text(r.nextStep, ['entries', ei, 'requirements', ri, 'nextStep'], 'Next step')}</div>}<p>Covered in: {r.sectionIds.map(id => entry.sections.find(s => s.id === id)?.title).join(', ') || 'No section'}</p><EvidenceView evidence={r} pkg={pkg} /></details>)}
      </details></section>}
    </article>)}
    {(mode === 'all' || mode === 'sources') && <details className="en-sources" open={mode === 'sources' ? true : undefined}><summary>All supplied sources and access limits ({pkg.sources.length})</summary>{pkg.sources.map((s, si) => <section key={s.id}><h3 id={readerHeadingId(prefix, 'sources', 'source', s.id)} tabIndex={-1}>{s.title}</h3><p>{s.role} / {s.access} / {s.used ? 'Used' : 'Not used'}</p>{text(s.inspected, ['sources', si, 'inspected'], 'What was inspected')}{s.limitations.map((item, i) => <div key={i}>{text(item, ['sources', si, 'limitations', i], 'Source limitation')}</div>)}{s.excerpts.map((e, i) => <blockquote key={e.id}><small>{e.location ?? 'Location not supplied'}</small>{text(e.text, ['sources', si, 'excerpts', i, 'text'], 'Supplied excerpt')}</blockquote>)}</section>)}</details>}
    <small className="en-muted">{pkg.instructionsVersion}. Externally created; structural validation does not verify teaching accuracy or source completeness.</small>
  </div>
  return reader ? <div className="nbr-layout"><aside className="nbr-aside"><ReadingContents key={mode} items={items} label="Notebook contents" onNavigate={id => { const item = items.find(item => item.id === id); const heading = item ? window.document.getElementById(item.targetId) : null; if (heading instanceof HTMLHeadingElement) { for (let parent = heading.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true; scrollGuideHeadingIntoReadingPane(heading) } }} /></aside>{document}</div> : document
}
export function NotebookPackageView(props: Parameters<typeof NotebookPackageContent>[0] & { assetBindings?: readonly NotebookAssetBinding[] }) {
  return <NotebookAssetsProvider pkg={props.pkg} bindings={props.assetBindings}><NotebookPackageContent {...props} />{(!props.mode || ['all', 'coverage', 'sources'].includes(props.mode)) && <NotebookVisualReview pkg={props.pkg} />}</NotebookAssetsProvider>
}
export function ExternalNotebookView({ lecture, courseCode, onNavigateEntry }: { lecture: LectureRecord; courseCode: string; onNavigateEntry?: (id: string) => void }) {
  const n = lecture.importedNotebook!
  const [draft, setDraft] = useState<NotebookPackage | null>(null)
  const [notes, setNotes] = useState(n.notes)
  const [notesBase, setNotesBase] = useState(n.notes)
  const [editBase, setEditBase] = useState(notebookContentKey(n))
  const [updating, setUpdating] = useState(Boolean(n.updateSession))
  const [restore, setRestore] = useState<{ id: string; state: string } | null>(null)
  const [mode, setMode] = useState<ReadingMode>('study')
  const [message, setMessage] = useState('')
  function updateText(path: (string | number)[], value: string) {
    setDraft(previous => {
      const next = structuredClone(previous ?? n.current)
      let node: unknown = next
      for (const key of path.slice(0, -1)) node = (node as Record<string | number, unknown>)[key]
      ;(node as Record<string | number, unknown>)[path.at(-1)!] = path.at(-1) === 'caption' && value === '' ? null : value
      return next
    })
  }
  function progress(id: string, response: string, complete: boolean) {
    try {
      notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target?.importedNotebook) throw new Error('Entry no longer exists.'); target.importedNotebook.progress = { ...target.importedNotebook.progress, [id]: { response, complete } }; target.updatedAt = Date.now() })
      setMessage('Response and progress saved.')
    } catch (error) { setMessage((error as Error).message) }
  }
  function save() {
    try {
      const policy = notebookPracticePolicy(n.current, draft ?? n.current, n.entryId)
      notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target) throw new Error('Entry no longer exists.'); saveNotebookEdits(target, draft ?? n.current, notes, Date.now(), { content: draft ? editBase : notebookContentKey(n), notes: notesBase }) })
      setDraft(null); setNotesBase(notes); setMessage(`Edits saved. Original import retained. ${policy.explanation}`)
    } catch (error) { setMessage((error as Error).message) }
  }
  function startUpdate(restart = false) {
    if (draft || notes !== n.notes) { setMessage('Save your edits and notes, or cancel the unsaved changes, before starting an update. Only saved content is exported.'); return }
    try {
      notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target?.importedNotebook || notebookStateKey(target.importedNotebook) !== notebookStateKey(n)) throw new Error('This notebook changed. Reopen its latest saved content before starting an update.')
        if (restart || !target.importedNotebook.updateSession) target.importedNotebook.updateSession = createNotebookUpdateSession(target.importedNotebook, target.id)
        if (target.importedNotebook.current.version === 3 || target.importedNotebook.assetBindings?.length) assertNotebookBackupFits(target.importedNotebook, target.courseId)
      })
      setUpdating(true); setMessage('')
    } catch (error) { setMessage((error as Error).message) }
  }
  function restoreVersion() {
    if (!restore) return
    if (draft || notes !== n.notes) { setMessage('Save or cancel unsaved edits and notes before restoring.'); return }
    try {
      notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target) throw new Error('Entry no longer exists.')
        restoreNotebookVersion(target, restore.id, restore.state)
      })
      const restored = useStore.getState().academics.classCenter.lectures.find(l => l.id === lecture.id)!.importedNotebook!
      setNotes(restored.notes); setNotesBase(restored.notes); setRestore(null); setMessage('Version restored with its notes and study records. The version it replaced is also retained in history.')
    } catch (error) { setMessage((error as Error).message) }
  }
  const staleUpdate = Boolean(n.updateSession && canonical(n.updateSession.baseline) !== notebookContentKey(n))
  if (updating && n.updateSession) return <section className="external-notebook" aria-label="Update saved notebook"><div className="en-actions"><Button variant="outline" onClick={() => setUpdating(false)}>Back to saved entry</Button><Button variant="ghost" onClick={() => startUpdate(true)}>Restart from latest saved entry</Button></div><p className="en-muted">Restart only when you need a newer baseline. Keep any unfinished prompt or proposal first; it starts a fresh update draft, not a new notebook.</p><p role="status">{message}</p><NotebookUpdateImageFiles lecture={lecture} revision={n.updateSession} disabled={staleUpdate} /><ExternalNotebookWorkflow key={n.updateSession.id} courseId={lecture.courseId} revision={n.updateSession} baselineFresh={!staleUpdate} onImported={id => { setUpdating(false); setMessage(id === lecture.id ? 'Notebook update saved. Previous versions remain in history.' : 'Separate entry saved. The original notebook remains unchanged.'); onNavigateEntry?.(id) }} /></section>
  const restoreVersionPreview = restore ? n.history?.find(v => v.id === restore.id) : undefined
  const entry = n.current.entries.find(entry => entry.id === n.entryId)!
  const practiceCount = entry.sections.flatMap(section => section.blocks).filter(block => block.type === 'practice').length
  return <section className="external-notebook nbr" aria-label="Saved external notebook"><header className="en-header nbr-head"><div className="nbr-head-main"><p className="en-eyebrow">Saved in {courseCode}</p><h1>{lecture.title}</h1><p className="nbr-scope en-text">{entry.scope}</p><details className="nbr-notebook-details"><summary>Notebook details</summary><p>{entry.goal} / Revision {entry.revision}{entry.baseRevision ? ` / Based on revision ${entry.baseRevision}` : ''}</p><p>{entry.sections.length} sections / {practiceCount} practice items / {entry.objectives.length} objectives / {n.current.sources.length} sources</p>{n.editedAt && <p>Updated locally</p>}</details></div><div className="en-actions nbr-head-actions">{(practiceCount > 0 || entry.objectives.length > 0) && <Button onClick={() => setMode('practice')}>Practice recall</Button>}<Button variant="outline" disabled={Boolean(draft)} onClick={() => { setDraft(structuredClone(n.current)); setEditBase(notebookContentKey(n)); setMessage('Editing a separate copy. Save to keep changes; the previous content stays in history.') }}>Edit entry</Button><Button variant="outline" onClick={() => startUpdate()}>Update this notebook</Button></div></header>
    <details className="nbr-tools"><summary>Downloads, notes and history</summary><div className="nbr-tools-body"><NotebookPortableExports lecture={lecture} />
    <details><summary>Request and class preferences</summary><p>Package class: {n.current.course.code} / {n.current.course.title}{n.current.course.term ? ` / ${n.current.course.term}` : ''}</p>{Object.entries(entry.request).map(([key, value]) => value !== null && <div key={key}><b>{key === 'helpStage' ? 'Help stage' : key === 'assessmentFormat' ? 'Assessment format' : 'Class preferences'}</b><p className="en-text">{value}</p></div>)}</details>
    <details className="en-small-detail"><summary>JSON-only exports</summary><div className="en-actions"><Button variant="outline" onClick={() => { try { downloadNotebookText('notebook-current.json', exportNotebook(lecture, 'current')) } catch (error) { setMessage((error as Error).message) } }}>Export current JSON</Button><Button variant="outline" onClick={() => downloadNotebookText('notebook-original.json', exportNotebook(lecture, 'original'))}>Export original</Button><Button variant="outline" onClick={() => downloadNotebookText('notebook-backup.json', exportNotebook(lecture, 'backup'))}>JSON records with progress</Button></div><p>These JSON files do not contain image bytes. Use the complete portable backup to move or preserve a visual notebook.</p></details>
    {n.revisedFromLectureId && <p className="en-notice">Saved as a separate revision. Your earlier entry, edits, and progress remain in the class notebook.</p>}
    <p className="en-muted">Current JSON contains saved content and source references for your AI. JSON records additionally contain notes, progress and the original import, but not image files.</p>
    <label className="en-field">My notes<textarea value={notes} onChange={event => setNotes(event.target.value)} /></label>{!draft && <div className="en-actions"><Button variant="outline" onClick={save}>Save notes</Button>{notes !== n.notes && <Button variant="ghost" onClick={() => { setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved notes discarded.') }}>Cancel note changes</Button>}</div>}
    <details className="en-history"><summary>Version history ({n.history?.length ?? 0})</summary><p>Saved versions retain content, sources, notes and study records. Restoring also retains the version it replaces. Storage is limited; backups include history.</p>{!(n.history?.length) && <p>No earlier versions yet.</p>}{[...(n.history ?? [])].reverse().map(version => <div className="en-history-row" key={version.id}><span>{new Date(version.savedAt).toLocaleString()} / before {version.reason} / {version.current.entries.find(e => e.id === n.entryId)?.title}</span><Button variant="outline" onClick={() => setRestore({ id: version.id, state: notebookStateKey(n) })}>Review this version</Button></div>)}{restoreVersionPreview && <section className="en-stage-panel" aria-label="Restore preview"><h3>Review before restoring</h3><p>This restores the shown content and its saved notes and study records. Your current version will remain recoverable.</p><p className="en-text">Saved notes: {restoreVersionPreview.notes || 'None'}</p><details><summary>Saved practice responses and checkmarks</summary>{Object.entries(restoreVersionPreview.progress).map(([id, work]) => <p className="en-text" key={id}>{id}: {work.response || 'No response'} / {work.complete ? 'Checked by you' : 'Not checked'}</p>)}</details><NotebookPackageView pkg={restoreVersionPreview.current} entryId={n.entryId} assetBindings={n.assetBindings} /><div className="en-actions"><Button disabled={Boolean(draft) || notes !== n.notes} onClick={restoreVersion}>Restore this version</Button><Button variant="outline" onClick={() => setRestore(null)}>Cancel restore</Button></div></section>}</details>
    </div></details>
    {draft && <div className="en-notice"><b>Editing your copy</b><p>Exports use the last saved content. Reveal collapsed sections to edit their text.</p><p>{notebookPracticePolicy(n.current, draft, n.entryId).explanation}</p><div className="en-actions"><Button onClick={save}>Save edits</Button><Button variant="outline" onClick={() => { setDraft(null); setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved content changes discarded.') }}>Cancel edits</Button></div></div>}
    <p className={message ? 'en-reader-status' : 'sr-only'} role="status" aria-live="polite">{message}</p>
    <nav className="en-actions nbr-views" aria-label="Notebook reading views">{(['study', 'practice', 'sources'] as const).map(view => <Button key={view} variant={mode === view ? 'default' : 'outline'} aria-pressed={mode === view} data-count={view === 'practice' ? practiceCount : view === 'sources' ? n.current.sources.length : undefined} onClick={() => setMode(view)}>{view === 'study' ? entry.goal === 'assessment' ? 'Assessment prep' : entry.goal === 'assignment' ? 'Assignment workspace' : 'Study guide' : view === 'practice' ? 'Practice' : 'Sources'}</Button>)}</nav>
    <NotebookPackageView mode={draft ? 'all' : mode} pkg={draft ?? n.current} entryId={n.entryId} change={draft ? updateText : undefined} progress={n.progress} onProgress={progress} reader={!draft} assetBindings={n.assetBindings} />
  </section>
}
export function notebookEntryLabel(entry: NotebookEntry) { return `${entry.title} / ${entry.goal} / revision ${entry.revision}` }
