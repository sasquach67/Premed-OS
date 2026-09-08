import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, Copy, Download, FileCode2, FileText, FolderOpen, HelpCircle, Info, ListChecks, MessageSquare, NotebookText, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { composeNotebookPrompt, type PromptValues } from '@/lib/academics/notebook/prompt'
import type { NotebookGoal, NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { revisionInput, UPDATE_BASELINE_FILE } from '@/lib/academics/notebook/revision'
import { clearNotebookWorkflowDraft, hasCurrentPromptAcknowledgment, loadNotebookWorkflowDraft, notebookWorkflowStep, persistNotebookWorkflowDraft, type NotebookWorkflowDraft, type NotebookWorkflowStep as Step, type PromptAcknowledgment } from '@/lib/academics/notebook/workflowDraft'
import { NotebookImportPanel } from './NotebookImportPanel'
import { downloadNotebookText, notebookTransaction } from './ExternalNotebookView'

const GOALS = {
  review: {
    title: 'Review class material',
    description: 'Review a lecture or lesson.',
    bring: 'Readable material for the topic you want help with.',
    result: 'A study guide, a recall outline (Mastery Map), practice questions, and what is covered or missing.',
    limit: 'Thin or unreadable material limits the result. Add a readable source or narrow the lesson scope.',
    bestFor: 'Review a lecture or lesson, catch up, preview, or understand a confusing topic.',
    ideal: 'After a lecture, use the lecture itself plus slides, notes and related readings; learning objectives if available. These are helpful options, not an all-required list.',
    stages: ['Understand and connect', 'Practice recall', 'Revisit weak areas'],
  },
  assessment: {
    title: 'Prepare for an assessment',
    description: 'Study for a quiz or exam.',
    bring: 'The scope or your named study request, plus readable material for the topics you want to prepare.',
    result: 'A study guide or outline, practice questions with explained answers, and what is covered or missing.',
    limit: 'Week 3 material can support a Week 3 quiz or partial preparation, not a complete Weeks 1-6 guide. Add missing lessons or explicitly narrow the scope; keep the gaps visible.',
    bestFor: 'Study for a quiz or exam covering one or more lessons.',
    ideal: 'The review sheet, known format, and relevant lectures, readings and notes across the required lessons. Practice questions, answer keys and your attempts are optional.',
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

const GOAL_PRESENTATION = {
  review: { icon: BookOpen, material: 'Lesson material', outputs: [
    { icon: BookOpen, label: 'Study guide' }, { icon: Brain, label: 'Recall outline' },
    { icon: HelpCircle, label: 'Practice questions' }, { icon: ListChecks, label: 'Covered / missing' },
  ] },
  assessment: { icon: Target, material: 'Scope + lesson material', outputs: [
    { icon: NotebookText, label: 'Study guide / outline' }, { icon: HelpCircle, label: 'Practice questions' },
    { icon: MessageSquare, label: 'Explained answers' }, { icon: ListChecks, label: 'Covered / missing' },
  ] },
  assignment: { icon: FileText, material: 'Assignment task', outputs: [
    { icon: Target, label: 'Hints or a plan' }, { icon: MessageSquare, label: 'Explanations or feedback' },
    { icon: ListChecks, label: 'Requirement check' },
  ] },
}

const STEPS = [
  { id: 'goal', label: 'Choose goal', title: 'Choose your goal' },
  { id: 'prompt', label: 'Copy prompt', title: 'Copy your prompt' },
  { id: 'handoff', label: 'Use your AI', title: 'Use it in your AI' },
  { id: 'import', label: 'Import notebook', title: 'Import your notebook' },
] as const

export function ExternalNotebookWorkflow({ courseId, onImported, revision }: { courseId: string; onImported: (id: string) => void; revision?: NotebookUpdateSession }) {
  const course = useStore(s => s.courses.find(c => c.id === courseId))
  const workspace = useStore(s => s.academics.classCenter.workspaces.find(w => w.courseId === courseId))
  const files = useStore(s => s.academics.classCenter.files)
  const storageId = revision ? `${courseId}:update:${revision.localId}:${revision.id}` : courseId
  const [loaded] = useState(() => {
    const loaded = loadNotebookWorkflowDraft(courseId, { preferences: workspace?.externalNotebookPreferences ?? '', term: course?.term ?? '' }, storageId)
    if (revision) {
      const entry = revision.baseline.entries[0]
      if (!loaded.restored) Object.assign(loaded.draft, { scope: entry.scope, preferences: entry.request.classPreferences, stage: entry.request.helpStage ?? '', format: entry.request.assessmentFormat ?? '', term: revision.baseline.course.term ?? '' })
      loaded.draft.goal = entry.goal
    }
    return loaded
  })
  const [draft, setDraft] = useState(loaded.draft)
  const { goal, preferences, scope, scopeSource, materials, selected, stage, format, depth, request, term } = draft
  const [message, setMessage] = useState('')
  const [storageWarning, setStorageWarning] = useState(loaded.warning)
  const [copyBusy, setCopyBusy] = useState(false)
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [downloadRequested, setDownloadRequested] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const finished = useRef(false)
  const latestPrompt = useRef('')
  const classFiles = files.filter(file => file.courseId === courseId)
  const values: PromptValues = { COURSE_CODE: revision?.baseline.course.code ?? course?.code ?? '', COURSE_TITLE: revision?.baseline.course.title ?? course?.title ?? '', TERM: revision ? revision.baseline.course.term : term || null, SCOPE: scope.trim() ? `${scope}\nScope authority: ${scopeSource || 'Not supplied; label provisional scope.'}` : null, MATERIALS: [revision ? `${UPDATE_BASELINE_FILE}: attach this exact saved baseline plus the new material; retained excerpts do not imply complete original files.` : '', ...classFiles.filter(f => selected.includes(f.id)).map(f => `${f.title} (${f.type}; attach the actual original file in the AI conversation)`), materials].filter(Boolean).join('\n'), DEPTH: depth, CLASS_PREFERENCES: preferences, HELP_STAGE: revision ? stage || null : stage, ASSESSMENT_FORMAT: goal === 'assessment' ? format || null : null, USER_REQUEST: request, REVISION_INPUT: revision ? revisionInput(revision) : null }
  const fullPrompt = goal ? composeNotebookPrompt(goal, values) : ''
  const promptLines = fullPrompt ? fullPrompt.split('\n').length : 0
  latestPrompt.current = fullPrompt
  const copyReady = hasCurrentPromptAcknowledgment(draft, fullPrompt)
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

  const activeStep = step === 'details' ? 0 : STEPS.findIndex(item => item.id === step)
  const current = revision && activeStep === 0 ? { ...STEPS[0], title: 'Update with new material' } : STEPS[activeStep]
  const goalInfo = GOALS[goal ?? 'review']
  const completed = [draft.goalAccepted, copyReady, copyReady && draft.jsonReady, false]
  function goTo(next: Step) {
    if (copyBusy || ((next === 'details' || next === 'prompt') && !goal) || (next === 'handoff' && (!copyReady || (revision && !draft.baselineReady))) || (next === 'import' && (!copyReady || !draft.jsonReady || (revision && !draft.baselineReady)))) return
    setMessage('')
    setDraft(previous => ({ ...previous, step: next, goalAccepted: next === 'prompt' ? true : previous.goalAccepted }))
  }
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
    setDraft(previous => ({ ...previous, goal: value, stage: GOALS[value].stages[0], goalAccepted: false, confirmedPrompt: null, acknowledgedBy: null, jsonReady: false }))
    setMessage(''); setDownloadRequested(false)
  }
  function acknowledgePrompt(method: PromptAcknowledgment) {
    if (!goal || !fullPrompt) return
    setDraft(previous => ({ ...previous, confirmedPrompt: fullPrompt, acknowledgedBy: method, jsonReady: false }))
    setMessage(method === 'clipboard' ? 'Full prompt copied. Click Next when you are ready.' : 'Prompt copy acknowledged. Click Next to use it in your AI.')
  }
  async function copyPrompt() {
    if (!fullPrompt || copyBusy) return
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
  function savePreferences() {
    try { notebookTransaction(state => { const target = state.academics.classCenter.workspaces.find(w => w.courseId === courseId); if (!target) throw new Error('Open the class notebook once to initialize its preferences.'); target.externalNotebookPreferences = preferences }); setMessage('Class preferences saved for future prompts.') } catch (error) { setMessage((error as Error).message) }
  }

  return <section className="external-notebook en-flow" aria-label="External AI notebook workflow">
    <header className="en-header en-flow-header">
      <div>
        <p className="en-eyebrow">{course.code} / Class notebook</p>
        <h1 ref={heading} tabIndex={-1}>{step === 'details' ? 'Add class details' : current.title}</h1>
      </div>
    </header>

    <nav className="en-flow-nav" aria-label="Notebook workflow progress">
      <ol>{STEPS.map((item, index) => { const state = activeStep === index ? 'current' : completed[index] ? 'completed' : 'upcoming'; return <li key={item.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
        <span className="en-step-number" aria-hidden="true">{state === 'completed' ? <Check /> : index + 1}</span>
        <span className="en-step-label">{revision && index === 0 ? 'Update details' : item.label}</span>
        <span className="sr-only">, step {index + 1} of 4, {state}</span>
      </li> })}</ol>
    </nav>
    {loaded.restored && <p className="en-next-note">Your class draft is restored in this tab. Back keeps your inputs.</p>}
    {draft.confirmedPrompt && !copyReady && <p className="en-brief-note">The prompt has changed. Your inputs are kept; copy or acknowledge the current prompt before continuing.</p>}
    {storageWarning && <p className="en-brief-note" role="alert">{storageWarning}</p>}
    <p className={message ? 'en-feedback' : 'sr-only'} role="status" aria-live="polite">{message}</p>

    {step === 'goal' && <div className="en-stage-content">
      {revision ? <p className="en-selected-goal">Updating {revision.baseline.entries[0].title} / {goalInfo.title}</p> : <fieldset>
        <legend className="sr-only">Notebook goal</legend>
        <div className="en-goals">{(Object.keys(GOALS) as NotebookGoal[]).map(g => { const GoalIcon = GOAL_PRESENTATION[g].icon; return <label key={g} className="en-goal-card">
          <input aria-label={GOALS[g].title} type="radio" name={`external-goal-${courseId}`} value={g} checked={goal === g} onChange={() => chooseGoal(g)} />
          <span className="en-goal-symbol"><GoalIcon aria-hidden="true" /></span>
          <span className="en-goal-copy"><b>{GOALS[g].title}</b><span>{GOALS[g].description}</span></span>
        </label> })}</div>
      </fieldset>}
      {goal && <section className="en-goal-guide" aria-label={`${goalInfo.title}: what to bring and expect`}>
        <dl>
          <div className="en-guide-input"><dt><FolderOpen aria-hidden="true" />Bring</dt><dd><strong className="en-material-label">{GOAL_PRESENTATION[goal].material}</strong><p>{goalInfo.bring}</p></dd></div>
          <div className="en-guide-output"><dt><NotebookText aria-hidden="true" />You'll get</dt><dd><ul className="en-output-list" aria-label={goalInfo.result}>{GOAL_PRESENTATION[goal].outputs.map(({ icon: OutputIcon, label }) => <li key={label}><OutputIcon aria-hidden="true" /><span>{label}</span></li>)}</ul></dd></div>
        </dl>
        <p className="en-guide-limit"><Info aria-hidden="true" /><span><b>Missing material?</b> {goalInfo.limit}</span></p>
        <details className="en-small-detail"><summary>Materials that help most</summary>
          <p><b>Best for:</b> {goalInfo.bestFor}</p>
          <p><b>Helpful extras:</b> {goalInfo.ideal}</p>
          {goal === 'review' && <p>A transcript or recording can help. Use a recording only if your chosen AI can actually inspect it; otherwise supply a readable transcript.</p>}
          {goal === 'assessment' && <p><b>Large packet?</b> Work in smaller batches. Save the source details and what each batch covered, then ask your AI for the final study guide. Premed OS does not combine separate batches.</p>}
        </details>
      </section>}
      <label className="en-field en-flow-request en-optional">Additional instructions for your AI
        <span className="en-muted block">Optional. Included when you copy the prompt.</span>
        <textarea aria-label="Additional instructions for your AI" rows={2} value={request} onChange={e => setRequest(e.target.value)} placeholder="e.g., explain simply, give examples, focus on a topic..." />
      </label>
      <footer className="en-stage-footer"><div className="en-actions">
        <Button disabled={!goal} onClick={() => goTo('prompt')}>Next<ArrowRight aria-hidden="true" /></Button>
        <Button variant="ghost" disabled={!goal} onClick={() => goTo('details')}>Customize prompt <span className="en-muted">(optional)</span></Button>
      </div><p className="en-next-note">Next: copy the prompt. Your AI will create the notebook, not this page.</p></footer>
    </div>}

    {step === 'details' && <div className="en-stage-content">
      <p className="en-selected-goal">{goalInfo.title}</p>
      <section className="en-stage-panel">
        <h2>What are you working on?</h2>
        {goal === 'assessment' && <p className="en-brief-note">Start with the instructor's review sheet if you have one. Missing lessons and an unknown exam format should stay visible.</p>}
        <label className="en-field">{goal === 'assessment' ? 'Included lessons, readings, and assessment topics' : 'Scope for this entry'}<textarea value={scope} onChange={e => setScope(e.target.value)} placeholder={goal === 'assessment' ? 'Lessons 1-5; readings A and B; every item on the Exam 1 review sheet...' : 'Name the lesson, reading, task, or topic you want to work through.'} /></label>
        <label className="en-field">{goal === 'assignment' ? 'Assignment prompt or rubric defining the task' : 'Source defining the scope'}<textarea value={scopeSource} onChange={e => setScopeSource(e.target.value)} placeholder={goal === 'assessment' ? 'Instructor review sheet, dated topic list, or my provisional topic selection...' : 'Official objectives, instructor instructions, or my own selected topics...'} /></label>
        {goal === 'assessment' && <label className="en-field">Assessment format (leave blank if unknown)<input value={format} onChange={e => setFormat(e.target.value)} placeholder="Multiple choice, short answer, essay, problem solving..." /></label>}
      </section>
      <section className="en-stage-panel">
        <h2>What will you attach?</h2>
        <p className="en-muted">This is a checklist only. Attach supported individual files, clear images or pasted text in your AI chat. A project is optional; naming a folder does not upload its contents.</p>
        {classFiles.length > 0 && <details><summary>Select saved class materials</summary><div className="en-materials" aria-label="Saved class materials">{classFiles.map(f => <label key={f.id} className="en-check"><input type="checkbox" checked={selected.includes(f.id)} onChange={e => setSelected(e.target.checked ? [...selected, f.id] : selected.filter(id => id !== f.id))} />{f.title} / {f.type}</label>)}</div></details>}
        <label className="en-field">Other materials you will attach<textarea value={materials} onChange={e => setMaterials(e.target.value)} placeholder={goal === 'assignment' ? 'Assignment prompt, rubric, required reading, my draft or attempted solution...' : 'Review sheet, notes for each lesson, slides, readings, practice questions, answer keys...'} /></label>
      </section>
      <details className="en-stage-panel en-settings"><summary>Class preferences and style</summary>
        <label className="en-field">Class preferences<textarea value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="Instructor terminology, explanation style, connections, writing conventions..." /></label>
        <Button variant="outline" onClick={savePreferences}>Remember preferences for this class</Button>
        <label className="en-field">Term (optional)<input value={term} onChange={e => setTerm(e.target.value)} placeholder="Fall 2026" /></label>
        <label className="en-field">Help stage<select value={stage} onChange={e => setStage(e.target.value)}>{revision && <option value="">Not specified</option>}{revision && stage && !goalInfo.stages.includes(stage) && <option value={stage}>{stage}</option>}{goalInfo.stages.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="en-field">Depth and style<input value={depth} onChange={e => setDepth(e.target.value)} /></label>
      </details>
      <label className="en-field en-flow-request">Additional instructions for your AI<span className="en-muted block">Optional. Included when you copy the prompt.</span><textarea aria-label="Additional instructions for your AI" value={request} onChange={e => setRequest(e.target.value)} /></label>
      <footer className="en-stage-footer"><div className="en-actions"><Button onClick={() => goTo('prompt')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('goal')}>{revision ? 'Back to update details' : 'Back to goal'}</Button></div>
        <p className="en-next-note">You can fill in missing details in your AI conversation.</p>
      </footer>
    </div>}

    {step === 'prompt' && <div className="en-stage-content">
      <p className="en-selected-goal">{goalInfo.title} / {course.code} / {course.title}</p>
      {revision && <section className="en-stage-panel" aria-label="Saved update baseline"><h2>Bring the saved notebook too</h2><p>This baseline contains saved content and retained source excerpts. Notes, practice progress and unsaved edits stay outside the AI handoff.</p><div className="en-actions"><Button variant="outline" onClick={() => { try { downloadNotebookText(UPDATE_BASELINE_FILE, JSON.stringify(revision.baseline, null, 2)); setMessage('Baseline download requested. Confirm when you have the file.') } catch { setMessage('Download unavailable. Expand the saved baseline and copy its complete JSON instead.') } }}>Download saved baseline</Button><Button variant="outline" aria-pressed={Boolean(draft.baselineReady)} onClick={() => setDraft(previous => ({ ...previous, baselineReady: true }))}>I have the baseline file or full JSON</Button></div><details className="en-small-detail"><summary>Show saved baseline JSON</summary><textarea className="en-json" aria-label="Saved baseline JSON" readOnly value={JSON.stringify(revision.baseline, null, 2)} /></details></section>}
      <section className="en-code-panel" aria-label="Your prepared prompt">
        <header className="en-code-head">
          <p className="en-code-name"><FileCode2 aria-hidden="true" />notebook-{goal}-prompt.md</p>
          <p className="en-code-meta">{promptLines} lines / {fullPrompt.length.toLocaleString()} characters</p>
          {copyReady && <p className="en-code-ack"><Check aria-hidden="true" />{draft.acknowledgedBy === 'clipboard' ? 'Copied to your clipboard' : draft.acknowledgedBy === 'download' ? 'You have the downloaded file' : 'You marked this as copied'}</p>}
          <Button className="en-code-copy" variant={copyReady ? 'outline' : 'default'} disabled={copyBusy} onClick={() => void copyPrompt()}><Copy aria-hidden="true" />{copyBusy ? 'Copying prompt...' : 'Copy full prompt'}</Button>
        </header>
        <label className="en-code-body"><span className="sr-only">Full customized prompt</span>
          <textarea className="en-json" readOnly spellCheck={false} value={fullPrompt} />
        </label>
        <footer className="en-code-foot">
          <p className="en-muted">This is the exact text the copy button sends: the full instructions, your class details, your added instructions, and the notebook file format.</p>
          <Button variant="link" disabled={copyBusy} onClick={() => goTo('details')}>Edit class details</Button>
        </footer>
      </section>
      {copyReady && <p className="en-next-note">Premed OS has not pasted anything into your AI. You paste it there yourself.</p>}
      <details className="en-prompt-detail" open={fallbackOpen} onToggle={event => setFallbackOpen(event.currentTarget.open)}><summary>Copy did not work? Download it or confirm you copied it manually</summary>
        <p className="en-muted">Select the text above to copy it by hand, or download the same text as a file. Then tell us which you used so Next can open.</p>
        <div className="en-actions"><Button variant="outline" disabled={copyBusy} onClick={() => { try { downloadNotebookText(`notebook-${goal}-prompt.md`, fullPrompt, 'text/markdown'); setDownloadRequested(true); setMessage('Download requested. Confirm below when you have the full prompt file.') } catch { setMessage('Download unavailable. Select and copy the full text from the panel above instead.') } }}><Download aria-hidden="true" />Download full prompt</Button>
          <Button variant="outline" disabled={copyBusy} onClick={() => acknowledgePrompt('manual')}>I copied it manually</Button>{downloadRequested && <Button variant="outline" disabled={copyBusy} onClick={() => acknowledgePrompt('download')}>I have the downloaded prompt</Button>}</div>
      </details>
      <footer className="en-stage-footer"><div className="en-actions"><Button variant={copyReady ? 'default' : 'outline'} disabled={!copyReady || copyBusy || Boolean(revision && !draft.baselineReady)} onClick={() => goTo('handoff')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" disabled={copyBusy} onClick={() => goTo('goal')}><ArrowLeft aria-hidden="true" />{revision ? 'Back to update details' : 'Back to goal'}</Button></div><p className="en-next-note">Next: paste it into your AI and attach the materials there.{revision && ' Confirm you have both the full prompt and saved baseline first.'}</p></footer>
    </div>}

    {step === 'handoff' && <div className="en-stage-content">
      <p className="en-selected-goal">{goalInfo.title}</p>
      <ol className="en-handoff-list">
        <li><span className="en-task-number" aria-hidden="true">1</span><div><h2>Paste the prompt</h2><p>Use a normal AI chat with your files or pasted material. A class project is optional. Paste the full prompt there.</p></div></li>
        <li><span className="en-task-number" aria-hidden="true">2</span><div><h2>Attach your materials</h2><p className="en-text">{values.MATERIALS || goalInfo.bring}</p><p className="en-muted">Upload the originals in your AI. An upload, connection or retrieved excerpt does not prove every file was read. Ask what was inspected and what remains unread.</p><p className="en-muted">Use supported individual files, direct images or pasted text. For unclear scans, handwriting or embedded figures, add clear page images or crops and type unclear text or formulas. Keep the full question, options and diagram together. Batch by topic when needed; projects and connections are optional.</p>{goal === 'review' && <p className="en-muted">Use a recording only if your AI can inspect it. Otherwise, use a readable transcript.</p>}</div></li>
        <li><span className="en-task-number" aria-hidden="true">3</span><div><h2>Review, then get the notebook file</h2><p>You can ask relevant questions or request changes to the actual content. Substantive edits need an updated summary and accessible revised draft before confirmation. Ask for a downloadable <strong>.json file</strong> containing the complete approved notebook. If downloads are unavailable, ask for the complete JSON block.</p></div></li>
      </ol>
      <details className="en-brief-note">
        <summary>What to expect from your AI</summary>
        <p>Your AI should show the full readable draft with a brief summary of its actual topics, practice and gaps. Ask for changes, or say "Create the JSON" when you are happy with that version; equivalent clear approval works too.</p>
        <p>Lots of files? Send them in batches. Tell your AI when you are done uploading, then review and approve your notebook before downloading JSON. Done uploading ends intake; it is not approval to make JSON.</p>
        <p>{goalInfo.limit}</p>
        {goal === 'assessment' && <details className="en-small-detail"><summary>Too much material for one conversation?</summary>
          <p>Work in smaller batches. Save the source details and what each batch covered, then give that saved work to your AI for the final study guide. Premed OS does not combine separate batches.</p>
          <p>Checkpoint files stay outside Premed OS. Import only the final, complete notebook JSON. A checkpoint is a saved file with source details, what is covered or unfinished, working explanations and the next step. Supply it to your AI when you resume; it does not prove the original sources were read again.</p>
        </details>}
      </details>
      <details className="en-small-detail"><summary>Before you leave this page</summary>
        <p>Your step and inputs are kept per class in this browser tab when storage is available. Closing the tab can lose this draft; keep your downloaded prompt and notebook JSON. Remembered class preferences are saved separately.</p>
        <p>To come back, open Class notebook and choose Add to notebook. Working checkpoint files stay with your AI; they are not notebook imports. The 8 MiB input limit does not guarantee a save, because browser storage can run out sooner.</p>
      </details>
      <div className="en-gate">
        <div><p className="en-gate-title">Do you have the notebook JSON file?</p><p className="en-muted">This is your confirmation. Premed OS cannot check what happened in your AI.</p></div>
        <Button variant={draft.jsonReady ? 'outline' : 'default'} aria-pressed={draft.jsonReady} onClick={() => { setDraft(previous => ({ ...previous, jsonReady: true })); setMessage('JSON readiness noted. Click Next to validate and preview it here.') }}>{draft.jsonReady && <Check aria-hidden="true" />}I have my JSON</Button>
      </div>
      <footer className="en-stage-footer"><div className="en-actions"><Button variant={draft.jsonReady ? 'default' : 'outline'} disabled={!draft.jsonReady} onClick={() => goTo('import')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('prompt')}><ArrowLeft aria-hidden="true" />Back to prompt</Button></div>
        <p className="en-next-note">Materials go to your AI. The finished notebook JSON comes back to Premed OS.</p>
      </footer>
    </div>}

    {step === 'import' && <div className="en-stage-content"><NotebookImportPanel courseId={courseId} revision={revision} initialRaw={draft.rawJson} onRawChange={rawJson => setDraft(previous => ({ ...previous, rawJson }))} onImported={id => { finished.current = true; clearNotebookWorkflowDraft(storageId); onImported(id) }} /><div className="en-actions"><Button variant="ghost" onClick={() => goTo('handoff')}><ArrowLeft aria-hidden="true" />Back to AI steps</Button></div></div>}
  </section>
}
