import { useStudentGuide } from './UsingStudentGuide'
import { preferencesWithGuide, withoutGuideSnapshot } from '@/lib/academics/studentGuide'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, Check, Download, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { composeNotebookPrompt, type PromptValues } from '@/lib/academics/notebook/prompt'
import type { NotebookGoal, NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { revisionInput, notebookUpdateBaselineFilename } from '@/lib/academics/notebook/revision'
import { clearNotebookWorkflowDraft, hasCurrentPromptAcknowledgment, loadNotebookWorkflowDraft, notebookWorkflowStep, persistNotebookWorkflowDraft, type NotebookWorkflowDraft, type PromptAcknowledgment } from '@/lib/academics/notebook/workflowDraft'
import { NotebookImportPanel } from './NotebookImportPanel'
import { downloadNotebookText, notebookTransaction } from './ExternalNotebookView'
import { NotebookAIFlow, NotebookAICopy } from './NotebookAIFlow'
import { exportNotebookPackageBundle } from '@/lib/academics/notebook/notebookBundle'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { lessonTarget, saveLocationSection, type NotebookTarget } from '@/lib/academics/lessonContext'

const GOALS = {
  review: {
    title: 'Review a lesson',
    description: 'Review a lecture or lesson.',
    bring: 'Readable material for the topic you want help with.',
    result: 'A study guide, a recall outline (Mastery Map), practice questions, and what is covered or missing.',
    limit: 'Thin or unreadable material limits the result. Add a readable source or narrow the lesson scope.',
    bestFor: 'Review a lecture or lesson, catch up, preview, or understand a confusing topic.',
    ideal: 'After a lecture, use the lecture itself plus slides, notes and related readings; learning objectives if available. These are helpful options, not an all-required list.',
    stages: ['Understand and connect', 'Practice questions', 'Revisit weak areas'],
  },
  assessment: {
    title: 'Prepare for an exam',
    description: 'Study for a quiz or exam.',
    bring: 'The scope or your named study request, plus readable material for the topics you want to prepare.',
    result: 'A study guide or outline, practice questions with explained answers, and what is covered or missing.',
    limit: 'Week 3 material can support a Week 3 quiz or partial preparation, not a complete Weeks 1-6 guide. Add missing lessons or explicitly narrow the scope; keep the gaps visible.',
    bestFor: 'Study for a quiz or exam covering one or more lessons.',
    ideal: 'The review sheet, known format, and relevant lectures, readings and notes across the required lessons. Past exams, practice papers, answer keys and your graded exams set how the questions are written.',
    stages: ['Establish scope and coverage', 'Explain difficult topics', 'Practice and identify gaps'],
  },
  assignment: {
    title: 'Work on an assignment',
    description: 'Get help with the stage you are on.',
    bring: 'The task, your requested help stage and the sources needed for it; include your draft or data when needed.',
    result: 'Hints, a plan, explanations or feedback, plus a check against the task requirements.',
    limit: 'A hint stays a hint. Missing rubric details, drafts or data stay unknown; split a large task into named stages.',
    bestFor: 'Get help with the task at the stage you choose.',
    ideal: 'The prompt, rubric, required sources or methods, and your work so far.',
    stages: ['Understand the task', 'Plan an approach', 'Get a hint', 'Review my attempt', 'Revise my draft'],
  },
}

export function ExternalNotebookWorkflow({ courseId, onImported, revision, baselineFresh = true, initialGoal, initialScope, workflowId, target }: { initialGoal?: NotebookGoal; initialScope?: string; workflowId?: string; courseId: string; onImported: (id: string, destinationCourseId?: string) => void; revision?: NotebookUpdateSession; baselineFresh?: boolean; /** The lesson or reading this notebook is for, when started from one. */ target?: NotebookTarget }) {
  const course = useStore(s => s.courses.find(c => c.id === courseId))
  const workspace = useStore(s => s.academics.classCenter.workspaces.find(w => w.courseId === courseId))
  const files = useStore(s => s.academics.classCenter.files)
  // An update keeps the notebook's own lesson, so it saves beside the first version.
  const revisedLesson = useStore(s => revision ? s.academics.classCenter.lectures.find(l => l.id === revision.localId)?.lesson : undefined)
  const saveTarget = target ?? (revisedLesson !== undefined ? lessonTarget(workspace?.syllabusSchedule, revisedLesson) : undefined)
  const storageId = revision ? `${courseId}:update:${revision.localId}:${revision.id}` : workflowId ? `${courseId}:${workflowId}` : courseId
  const [loaded] = useState(() => {
    const loaded = loadNotebookWorkflowDraft(courseId, { preferences: workspace?.externalNotebookPreferences ?? '', term: course?.term ?? '' }, storageId)
    if (!loaded.restored && initialGoal && !revision) Object.assign(loaded.draft, { goal: initialGoal, goalAccepted: true, stage: GOALS[initialGoal].stages[0], scope: initialScope ?? '' })
    if (revision) {
      const entry = revision.baseline.entries[0]
      if (!loaded.restored) Object.assign(loaded.draft, { scope: entry.scope, preferences: withoutGuideSnapshot(entry.request.classPreferences), stage: entry.request.helpStage ?? '', format: entry.request.assessmentFormat ?? '', term: revision.baseline.course.term ?? '' })
      loaded.draft.goal = entry.goal
    }
    return loaded
  })
  const [draft, setDraft] = useState(loaded.draft)
  const { goal, preferences, scope, scopeSource, materials, selected, stage, format, depth, request, term } = draft
  const [message, setMessage] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [storageWarning, setStorageWarning] = useState(loaded.warning)
  const [copyBusy, setCopyBusy] = useState(false)
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [downloadRequested, setDownloadRequested] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const finished = useRef(false)
  const latestPrompt = useRef('')
  const classFiles = files.filter(file => file.courseId === courseId)
  const guideSelection = useStudentGuide({ courseId, lessonIds: classFiles.filter(file => selected.includes(file.id)).map(file => file.lectureId).filter((id): id is string => Boolean(id)), choice: { target: draft.guideTarget ?? '', excludedIds: draft.excludedGuideIds ?? [] }, onChange: choice => setDraft(previous => ({ ...previous, guideTarget: choice.target, excludedGuideIds: choice.excludedIds, confirmedPrompt: null, acknowledgedBy: null, jsonReady: false })) })
  const values: PromptValues = { COURSE_CODE: revision?.baseline.course.code ?? course?.code ?? '', COURSE_TITLE: revision?.baseline.course.title ?? course?.title ?? '', TERM: revision ? revision.baseline.course.term : term || null, SCOPE: scope.trim() ? `${scope}\nScope authority: ${scopeSource || 'Not supplied; label provisional scope.'}` : null, MATERIALS: [revision ? `${notebookUpdateBaselineFilename(revision)}: attach this exact saved baseline plus the new material; retained excerpts do not imply complete original files.` : '', ...classFiles.filter(f => selected.includes(f.id)).map(f => `${f.title} (${f.type}; attach the actual original file in the AI conversation)`), materials].filter(Boolean).join('\n'), DEPTH: depth, CLASS_PREFERENCES: preferencesWithGuide(preferences, guideSelection.directions, goal === 'assessment' ? 'assessment' : 'notebook'), HELP_STAGE: revision ? stage || null : stage, ASSESSMENT_FORMAT: goal === 'assessment' ? format || null : null, USER_REQUEST: request, REVISION_INPUT: revision ? revisionInput(revision) : null }
  const fullPrompt = goal ? composeNotebookPrompt(goal, values, revision ? 'update' : 'new') + saveLocationSection(workspace?.classFolder, saveTarget, 'notebook') : ''
  useLayoutEffect(() => { latestPrompt.current = fullPrompt }, [fullPrompt])
  const copyReady = hasCurrentPromptAcknowledgment(draft, fullPrompt)
  const baselineBlocked = Boolean(revision && !baselineFresh)
  const requestedStep = notebookWorkflowStep(draft, fullPrompt)
  const step = revision && !draft.baselineReady && (requestedStep === 'handoff' || requestedStep === 'import') ? 'prompt' : requestedStep
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])
  useEffect(() => {
    if (!finished.current) setStorageWarning(persistNotebookWorkflowDraft({ ...draft, step, confirmedPrompt: copyReady ? draft.confirmedPrompt : null, acknowledgedBy: copyReady ? draft.acknowledgedBy : null, jsonReady: copyReady && draft.jsonReady }))
  }, [draft, step, copyReady])
  if (!course) return <p role="alert">Class not found.</p>

  const promptFilename = `notebook-${revision ? 'update-' : ''}${goal}-prompt.md`
  const goalInfo = GOALS[goal ?? 'review']
  function updateField<K extends 'preferences' | 'scope' | 'scopeSource' | 'materials' | 'selected' | 'stage' | 'format' | 'depth' | 'request' | 'term'>(field: K, value: NotebookWorkflowDraft[K]) {
    setDraft(previous => ({ ...previous, [field]: value, confirmedPrompt: null, acknowledgedBy: null, jsonReady: false }))
    setMessage(''); setDownloadRequested(false)
  }
  const setPreferences = (value: string) => updateField('preferences', value)
  const setScope = (value: string) => updateField('scope', value)
  const setScopeSource = (value: string) => updateField('scopeSource', value)
  const setMaterials = (value: string) => updateField('materials', value)
  const setSelected = (value: string[]) => updateField('selected', value)
  const setStage = (value: string) => updateField('stage', value)
  const setFormat = (value: string) => updateField('format', value)
  const setDepth = (value: string) => updateField('depth', value)
  const setRequest = (value: string) => updateField('request', value)
  const setTerm = (value: string) => updateField('term', value)
  function chooseGoal(value: NotebookGoal) {
    if (value === goal) return
    setDraft(previous => ({ ...previous, goal: value, stage: GOALS[value].stages[0], goalAccepted: true, confirmedPrompt: null, acknowledgedBy: null, jsonReady: false }))
    setMessage(''); setDownloadRequested(false)
  }
  function acknowledgePrompt(method: PromptAcknowledgment) {
    if (!goal || !fullPrompt || baselineBlocked || (revision && !draft.baselineReady)) return
    setDraft(previous => ({ ...previous, goalAccepted: true, step: 'handoff', confirmedPrompt: fullPrompt, acknowledgedBy: method, jsonReady: false }))
    setMessage(method === 'clipboard' ? 'Prompt copied. Paste it into a new AI chat with your files.' : 'Prompt copy acknowledged.')
  }
  async function copyPrompt() {
    if (!fullPrompt || copyBusy || baselineBlocked || (revision && !draft.baselineReady)) return
    const copying = fullPrompt; setCopyBusy(true)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(copying)
      if (latestPrompt.current === copying) acknowledgePrompt('clipboard')
    } catch {
      setFallbackOpen(true)
      setMessage('Clipboard unavailable. Select the prompt above and copy it, or download it, then confirm you have it.')
    } finally { setCopyBusy(false) }
  }
  async function savePreferences() {
    try { await notebookTransaction(state => { const target = state.academics.classCenter.workspaces.find(w => w.courseId === courseId); if (!target) throw new Error('Open the class notebook once to initialize its preferences.'); target.externalNotebookPreferences = preferences }); setMessage('Class preferences saved for future prompts.') } catch (error) { setMessage((error as Error).message) }
  }

  async function downloadBaseline() {
    if (!revision || baselineBlocked) return
    try {
      const raw = JSON.stringify(revision.baseline, null, 2)
      if ('assets' in revision.baseline && (revision.baseline.assets as unknown[]).length) {
        const notebook = useStore.getState().academics.classCenter.lectures.find(item => item.id === revision.localId)?.importedNotebook
        const bundle = await exportNotebookPackageBundle(raw, notebook?.assetBindings ?? [], notebookAssetRepository())
        const url = URL.createObjectURL(bundle), anchor = document.createElement('a')
        anchor.href = url; anchor.download = notebookUpdateBaselineFilename(revision).replace(/\.json$/i, '.zip'); anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else downloadNotebookText(notebookUpdateBaselineFilename(revision), raw)
      setDraft(previous => ({ ...previous, baselineReady: true }))
      setMessage('Current notebook download requested. Keep its JSON and images together.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The notebook could not be downloaded. Recover missing original images before continuing.') }
  }
  function downloadPrompt() {
    if (!fullPrompt || baselineBlocked) return
    try { downloadNotebookText(promptFilename, fullPrompt, 'text/markdown'); setDownloadRequested(true); setFallbackOpen(true); setMessage('Download requested. Confirm when you have the complete prompt.') }
    catch { setFallbackOpen(true); setMessage('Download unavailable. Copy the complete prompt manually.') }
  }
  const promptBlocked = !goal || baselineBlocked || Boolean(revision && !draft.baselineReady)
  return <section className="external-notebook en-flow" aria-label="External AI notebook workflow"><div hidden={reviewing}>
    <header className="en-header en-flow-header"><div><p className="en-eyebrow">{course.code} · {revision ? revision.baseline.entries[0].title : 'New notebook'}</p><h1 ref={heading} tabIndex={-1}>{revision ? 'Update notebook' : 'Create notebook'}</h1></div></header>
    {loaded.restored && <p className="nai-hint">Your draft is restored in this tab.</p>}
    {storageWarning && <p role="alert" className="en-brief-note">{storageWarning}</p>}
    <p role="status" aria-live="polite" className={message ? 'en-feedback' : 'sr-only'}>{message}</p>
    {baselineBlocked && <div role="alert" className="en-notice"><p>The saved notebook changed after this update started. Restart from the latest saved version before downloading or copying the prompt. Your saved notes and progress are kept.</p>{draft.rawJson.trim() && <Button variant="outline" onClick={() => setDraft(previous => ({ ...previous, step: 'import' }))}>Review pending proposal</Button>}</div>}
    {!revision && <section className="nai-goal"><h2>What’s this notebook for?</h2><fieldset><legend className="sr-only">Notebook goal</legend><div className="en-goals">{(['review','assessment'] as const).map(value => { const Icon = value === 'review' ? BookOpen : Target; return <label key={value} className="en-goal-card"><input type="radio" name={`external-goal-${courseId}`} value={value} checked={goal === value} onChange={() => chooseGoal(value)} /><Icon aria-hidden="true" /><span className="en-goal-copy"><b>{GOALS[value].title}</b><span>{GOALS[value].description}</span></span></label> })}</div></fieldset>
      {goal && <><div className="nai-focus" aria-label="Focus">{goalInfo.stages.map(value => <button key={value} type="button" aria-pressed={stage === value} onClick={() => setStage(value)}>{value}</button>)}</div><label className="en-field">{goal === 'assessment' ? 'What does the exam cover?' : 'What are you working on?'}<input value={scope} onChange={event => setScope(event.target.value)} placeholder={goal === 'assessment' ? 'Exam 2: Lessons 9–14, from the review sheet' : 'Lesson, reading or topics'} /></label>{goal === 'assessment' && <label className="en-field">Exam format, if known<input value={format} onChange={event => setFormat(event.target.value)} placeholder="Multiple choice, short answer…" /></label>}{goal === 'assessment' && <p className="nai-hint">Add past exams or practice papers if you have them. Your AI will study how your instructor writes questions and write new ones the same way.</p>}</>}
    </section>}
    </div><NotebookAIFlow reviewing={reviewing} gather={<>
      {revision ? <div className="nai-files"><div className="nai-file"><span><b>Current notebook</b><small>JSON + images</small></span><Button variant="outline" disabled={baselineBlocked} onClick={() => void downloadBaseline()}><Download aria-hidden="true" />Download</Button></div><div className="nai-file"><span><b>New materials</b><small>Notes, slides, screenshots</small></span><strong>Required</strong></div><Button variant="ghost" disabled={baselineBlocked} aria-pressed={Boolean(draft.baselineReady)} onClick={() => setDraft(previous => ({ ...previous, baselineReady: true }))}>{draft.baselineReady && <Check aria-hidden="true" />}I already have the current notebook and images</Button><details className="en-small-detail"><summary>View saved notebook JSON</summary><textarea aria-label="Saved baseline JSON" className="en-json" readOnly value={baselineBlocked ? '' : JSON.stringify(revision.baseline,null,2)} /><p className="nai-hint">If there are images, download the bundle and keep notebook.json, bindings.json and assets together.</p></details></div> : <><div className="nai-materials">{['Slides','Captions','Class outline','GRQ','Readings','Your notes'].map(material => <span key={material}>{material}</span>)}</div><p className="nai-hint">A checklist only: attach the actual files in your AI chat. Lessons that build on each other can share one notebook.</p></>}
      <p className="nai-hint">Your notes, practice answers and checkmarks stay in Premed OS.</p>
      <details className="en-small-detail"><summary>Customize (optional)</summary>
        <label className="en-field">Source defining the scope<textarea value={scopeSource} onChange={event => setScopeSource(event.target.value)} /></label>
        {classFiles.length > 0 && <details><summary>Select saved class materials</summary><div className="en-materials">{classFiles.map(file => <label className="en-check" key={file.id}><input type="checkbox" checked={selected.includes(file.id)} onChange={event => setSelected(event.target.checked ? [...selected,file.id] : selected.filter(id => id !== file.id))} />{file.title}</label>)}</div></details>}
        <label className="en-field">Other materials you will attach<textarea value={materials} onChange={event => setMaterials(event.target.value)} /></label>
        <label className="en-field">Depth and style<input value={depth} onChange={event => setDepth(event.target.value)} /></label>
        <label className="en-field">Additional instructions for your AI<textarea aria-label="Additional instructions for your AI" value={request} onChange={event => setRequest(event.target.value)} /></label>
        <label className="en-field">Class preferences<textarea value={preferences} onChange={event => setPreferences(event.target.value)} /></label><Button variant="outline" onClick={() => void savePreferences()}>Remember preferences for this class</Button>
        <label className="en-field">Term (optional)<input value={term} onChange={event => setTerm(event.target.value)} /></label>
      </details>{goal && guideSelection.preview}
    </>} copy={<NotebookAICopy copyBusy={copyBusy} disabled={promptBlocked} onCopy={() => void copyPrompt()} onDownload={downloadPrompt} onView={() => setFallbackOpen(value => !value)}>
      {copyReady && !baselineBlocked && <p className="nai-hint"><Check aria-hidden="true" className="inline size-4" />Current prompt copied or acknowledged.</p>}
      {!goal && <p className="nai-hint">Choose a goal to prepare your prompt.</p>}
      {revision && !draft.baselineReady && <p className="nai-hint">Get the current notebook and its images first.</p>}
      <details className="nai-prompt en-prompt-detail" open={fallbackOpen} onToggle={event => setFallbackOpen(event.currentTarget.open)}><summary>View complete prompt / copy manually</summary><textarea className="en-json" aria-label="Full customized prompt" readOnly value={baselineBlocked ? '' : fullPrompt} /><div className="nai-actions"><Button variant="outline" disabled={promptBlocked} onClick={() => acknowledgePrompt('manual')}>I copied it manually</Button>{downloadRequested && <Button variant="outline" disabled={promptBlocked} onClick={() => acknowledgePrompt('download')}>I have the downloaded prompt</Button>}</div></details>
    </NotebookAICopy>} bring={<>
      <p className="nai-hint" hidden={reviewing}>Choose the folder your AI made. Usually in your class folder, or Downloads.</p>
      {step === 'import' ? <NotebookImportPanel onReviewChange={setReviewing} courseId={courseId} revision={revision} initialRaw={draft.rawJson} onRawChange={rawJson => setDraft(previous => ({ ...previous, rawJson }))} onImported={(id: string, destinationCourseId?: string) => { finished.current = true; clearNotebookWorkflowDraft(storageId); onImported(id, destinationCourseId) }} /> : <><Button variant="outline" disabled={!copyReady || promptBlocked} onClick={() => setDraft(previous => ({ ...previous, jsonReady: true, step: 'import' }))}>Choose the folder your AI made</Button>{!copyReady && <p className="nai-hint">Copy or acknowledge the current prompt first.</p>}</>}
    </>} help={<><p><b>A file is unreadable or the packet is too large:</b> send smaller batches, paste readable text or supply clear page images. Import only the final complete notebook.</p><p><b>Missing images:</b> keep every referenced original PNG/JPEG with the JSON. Recover exact originals; a filename does not contain image bytes.</p><p><b>Premed OS rejects the notebook:</b> give the same AI chat the actual error and ask for a corrected complete folder.</p>{revision && <><p><b>I lost the AI chat:</b> start a new chat with the same prompt, current notebook and new materials.</p><p><b>I edited after downloading:</b> restart from the latest saved notebook and download it again before updating.</p></>}<p>If the AI cannot reach your class folder, it should save to Downloads and tell you where. Keep a complete copy before leaving this tab.</p></>} />
  </section>
}
