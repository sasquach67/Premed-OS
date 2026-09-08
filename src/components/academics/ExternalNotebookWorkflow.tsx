import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { composeNotebookPrompt, type PromptValues } from '@/lib/academics/notebook/prompt'
import type { NotebookGoal } from '@/lib/academics/notebook/types'
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

const STEPS = [
  { id: 'goal', label: 'Choose goal', title: 'Choose your goal', description: 'Pick what you want help with. We will prepare the prompt for your AI.' },
  { id: 'prompt', label: 'Copy prompt', title: 'Copy your prompt', description: 'Your class details are included. Copy the full prompt, then use it in your AI.' },
  { id: 'handoff', label: 'Use your AI', title: 'Use it in your AI', description: 'Finish in your preferred AI, then bring the notebook file back here.' },
  { id: 'import', label: 'Import notebook', title: 'Import your notebook', description: 'Preview the result, check what is missing, then save it to your class.' },
] as const

export function ExternalNotebookWorkflow({ courseId, onImported }: { courseId: string; onImported: (id: string) => void }) {
  const course = useStore(s => s.courses.find(c => c.id === courseId))
  const workspace = useStore(s => s.academics.classCenter.workspaces.find(w => w.courseId === courseId))
  const files = useStore(s => s.academics.classCenter.files)
  const [loaded] = useState(() => loadNotebookWorkflowDraft(courseId, { preferences: workspace?.externalNotebookPreferences ?? '', term: course?.term ?? '' }))
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
  const values: PromptValues = { COURSE_CODE: course?.code ?? '', COURSE_TITLE: course?.title ?? '', TERM: term || null, SCOPE: scope.trim() ? `${scope}\nScope authority: ${scopeSource || 'Not supplied; label provisional scope.'}` : null, MATERIALS: [...classFiles.filter(f => selected.includes(f.id)).map(f => `${f.title} (${f.type}; attach the actual original file in the AI conversation)`), materials].filter(Boolean).join('\n'), DEPTH: depth, CLASS_PREFERENCES: preferences, HELP_STAGE: stage, ASSESSMENT_FORMAT: goal === 'assessment' ? format || null : null, USER_REQUEST: request, REVISION_INPUT: null }
  const fullPrompt = goal ? composeNotebookPrompt(goal, values) : ''
  latestPrompt.current = fullPrompt
  const copyReady = hasCurrentPromptAcknowledgment(draft, fullPrompt)
  const step = notebookWorkflowStep(draft, fullPrompt)
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])
  useEffect(() => {
    if (!finished.current) setStorageWarning(persistNotebookWorkflowDraft({ ...draft, step, confirmedPrompt: copyReady ? draft.confirmedPrompt : null, acknowledgedBy: copyReady ? draft.acknowledgedBy : null, jsonReady: copyReady && draft.jsonReady }))
  }, [draft, step, copyReady])
  if (!course) return <p role="alert">Class not found.</p>

  const activeStep = step === 'details' ? 0 : STEPS.findIndex(item => item.id === step)
  const current = STEPS[activeStep]
  const goalInfo = GOALS[goal ?? 'review']
  const completed = [draft.goalAccepted, copyReady, copyReady && draft.jsonReady, false]
  function goTo(next: Step) {
    if (copyBusy || ((next === 'details' || next === 'prompt') && !goal) || (next === 'handoff' && !copyReady) || (next === 'import' && (!copyReady || !draft.jsonReady))) return
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
      setMessage('Clipboard unavailable. Copy from the full preview or download it, then acknowledge that you have the prompt.')
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
        <p className="en-flow-lead">{step === 'details' ? 'Optional. Add what you know, or go straight to the full prompt.' : current.description}</p>
      </div>
    </header>

    <nav className="en-flow-nav" aria-label="Notebook workflow progress">
      <ol>{STEPS.map((item, index) => { const state = activeStep === index ? 'current' : completed[index] ? 'completed' : 'upcoming'; return <li key={item.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
        <span className="en-step-number" aria-hidden="true">{state === 'completed' ? <Check /> : index + 1}</span>
        <span className="en-step-label">{item.label}</span>
        <span className="sr-only">, step {index + 1} of 4, {state}</span>
      </li> })}</ol>
    </nav>
    {loaded.restored && <p className="en-next-note">Your class draft is restored in this tab. Back keeps your inputs.</p>}
    {draft.confirmedPrompt && !copyReady && <p className="en-brief-note">The prompt has changed. Your inputs are kept; copy or acknowledge the current prompt before continuing.</p>}
    {storageWarning && <p className="en-brief-note" role="alert">{storageWarning}</p>}
    <p className={message ? 'en-feedback' : 'sr-only'} role="status" aria-live="polite">{message}</p>

    {step === 'goal' && <div className="en-stage-content">
      <fieldset>
        <legend className="sr-only">Notebook goal</legend>
        <div className="en-goals">{(Object.keys(GOALS) as NotebookGoal[]).map(g => <label key={g} className="en-goal-card">
          <input aria-label={GOALS[g].title} type="radio" name={`external-goal-${courseId}`} value={g} checked={goal === g} onChange={() => chooseGoal(g)} />
          <span><b>{GOALS[g].title}</b><span>{GOALS[g].description}</span></span>
        </label>)}</div>
      </fieldset>
      {goal && <section className="en-goal-guide" aria-label={`${goalInfo.title}: what to bring and expect`}>
        <dl><div><dt>Bring</dt><dd>{goalInfo.bring}</dd></div><div><dt>You will get</dt><dd>{goalInfo.result}</dd></div></dl>
        <details className="en-small-detail"><summary>Helpful materials and limits</summary>
          <p><b>Best for:</b> {goalInfo.bestFor}</p>
          <p><b>Helpful extras:</b> {goalInfo.ideal}</p>
          {goal === 'review' && <p>A transcript or recording can help. Use a recording only if your chosen AI can actually inspect it; otherwise supply a readable transcript.</p>}
          <p><b>Missing material?</b> {goalInfo.limit}</p>
          {goal === 'assessment' && <p><b>Large packet?</b> Work in smaller batches. Save the source details and what each batch covered, then ask your AI for the final study guide. Premed OS does not combine separate batches.</p>}
        </details>
      </section>}
      <label className="en-field en-flow-request">Additional instructions for your AI
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
        <p className="en-muted">This is a checklist only. Upload the original files in your AI conversation.</p>
        {classFiles.length > 0 && <details><summary>Select saved class materials</summary><div className="en-materials" aria-label="Saved class materials">{classFiles.map(f => <label key={f.id} className="en-check"><input type="checkbox" checked={selected.includes(f.id)} onChange={e => setSelected(e.target.checked ? [...selected, f.id] : selected.filter(id => id !== f.id))} />{f.title} / {f.type}</label>)}</div></details>}
        <label className="en-field">Other materials you will attach<textarea value={materials} onChange={e => setMaterials(e.target.value)} placeholder={goal === 'assignment' ? 'Assignment prompt, rubric, required reading, my draft or attempted solution...' : 'Review sheet, notes for each lesson, slides, readings, practice questions, answer keys...'} /></label>
      </section>
      <details className="en-stage-panel en-settings"><summary>Class preferences and style</summary>
        <label className="en-field">Class preferences<textarea value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="Instructor terminology, explanation style, connections, writing conventions..." /></label>
        <Button variant="outline" onClick={savePreferences}>Remember preferences for this class</Button>
        <label className="en-field">Term (optional)<input value={term} onChange={e => setTerm(e.target.value)} placeholder="Fall 2026" /></label>
        <label className="en-field">Help stage<select value={stage} onChange={e => setStage(e.target.value)}>{goalInfo.stages.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="en-field">Depth and style<input value={depth} onChange={e => setDepth(e.target.value)} /></label>
      </details>
      <label className="en-field en-flow-request">Additional instructions for your AI<span className="en-muted block">Optional. Included when you copy the prompt.</span><textarea aria-label="Additional instructions for your AI" value={request} onChange={e => setRequest(e.target.value)} /></label>
      <footer className="en-stage-footer"><div className="en-actions"><Button onClick={() => goTo('prompt')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('goal')}>Back to goal</Button></div>
        <p className="en-next-note">You can fill in missing details in your AI conversation.</p>
      </footer>
    </div>}

    {step === 'prompt' && <div className="en-stage-content">
      <section className="en-stage-panel en-prompt-card">
        <p className="en-eyebrow">Your prepared prompt</p>
        <h2>{goalInfo.title}</h2>
        <p>{course.code} / {course.title}</p>
        <p className="en-muted">Includes the full instructions, your class details, and the notebook file format.</p>
        <div className="en-actions"><Button variant={copyReady ? 'outline' : 'default'} disabled={copyBusy} onClick={() => void copyPrompt()}><Copy aria-hidden="true" />{copyBusy ? 'Copying prompt...' : 'Copy full prompt'}</Button>
          <Button variant="ghost" disabled={copyBusy} onClick={() => goTo('details')}>Edit class details</Button>
        </div>
        {copyReady && <p className="en-muted">Prompt ready. Nothing has been pasted into your AI by this app.</p>}
      </section>
      <details className="en-prompt-detail" open={fallbackOpen} onToggle={event => setFallbackOpen(event.currentTarget.open)}><summary>Preview, download, or copy manually</summary>
        <p className="en-muted">This is the exact text that the copy button uses.</p>
        <div className="en-actions"><Button variant="outline" disabled={copyBusy} onClick={() => { try { downloadNotebookText(`notebook-${goal}-prompt.md`, fullPrompt, 'text/markdown'); setDownloadRequested(true); setMessage('Download requested. Confirm below when you have the full prompt file.') } catch { setMessage('Download unavailable. Copy the full text from the preview instead.') } }}><Download aria-hidden="true" />Download full prompt</Button></div>
        <label className="en-field">Full customized prompt<textarea className="en-json" readOnly value={fullPrompt} /></label>
        <div className="en-actions"><Button variant="outline" disabled={copyBusy} onClick={() => acknowledgePrompt('manual')}>I copied it manually</Button>{downloadRequested && <Button variant="outline" disabled={copyBusy} onClick={() => acknowledgePrompt('download')}>I have the downloaded prompt</Button>}</div>
      </details>
      <footer className="en-stage-footer"><div className="en-actions"><Button variant={copyReady ? 'default' : 'outline'} disabled={!copyReady || copyBusy} onClick={() => goTo('handoff')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" disabled={copyBusy} onClick={() => goTo('goal')}><ArrowLeft aria-hidden="true" />Back to goal</Button></div><p className="en-next-note">Next: paste it into your AI and attach the materials there.</p></footer>
    </div>}

    {step === 'handoff' && <div className="en-stage-content">
      <p className="en-selected-goal">{goalInfo.title}</p>
      <ol className="en-handoff-list">
        <li><span className="en-task-number" aria-hidden="true">1</span><div><h2>Paste the prompt</h2><p>Open the class project or conversation you want to use in your AI. Paste the full prompt there.</p></div></li>
        <li><span className="en-task-number" aria-hidden="true">2</span><div><h2>Attach your materials</h2><p className="en-text">{values.MATERIALS || goalInfo.bring}</p><p className="en-muted">Upload the originals in your AI. An upload, connection or retrieved excerpt does not prove every file was read. Ask what was inspected and what remains unread.</p>{goal === 'review' && <p className="en-muted">Use a recording only if your AI can inspect it. Otherwise, use a readable transcript.</p>}</div></li>
        <li><span className="en-task-number" aria-hidden="true">3</span><div><h2>Get the notebook file</h2><p>Ask for a downloadable <strong>.json file</strong> containing the complete final notebook. If downloads are unavailable, ask for the complete JSON block.</p></div></li>
      </ol>
      <aside className="en-brief-note"><b>What to expect from your AI</b><p>Your AI should say what it can access and start when it has enough material. If something essential is missing, it should tell you exactly what to upload or answer next.</p></aside>
      {goal === 'assessment' ? <aside className="en-brief-note"><b>Lots of lessons?</b><p>Work in smaller batches. Save the source details and what each batch covered, then give that saved work to your AI for the final study guide. Premed OS does not combine separate batches.</p><p>Checkpoint files stay outside Premed OS. Import only the final, complete notebook JSON.</p><details className="en-small-detail"><summary>If some lessons are missing</summary><p>{goalInfo.limit}</p><p>A checkpoint is a saved file with source details, what is covered or unfinished, working explanations and the next step. Supply it to your AI when you resume; it does not prove the original sources were read again.</p></details></aside> : <aside className="en-brief-note"><b>Keep the limits visible</b><p>{goalInfo.limit}</p></aside>}
      <div className="en-actions"><Button variant={draft.jsonReady ? 'outline' : 'default'} aria-pressed={draft.jsonReady} onClick={() => { setDraft(previous => ({ ...previous, jsonReady: true })); setMessage('JSON readiness noted. Click Next to validate and preview it here.') }}>{draft.jsonReady && <Check aria-hidden="true" />}I have my JSON</Button></div>
      <p className="en-next-note">This is your confirmation. The app cannot check what happened in your AI.</p>
      <footer className="en-stage-footer"><div className="en-actions"><Button variant={draft.jsonReady ? 'default' : 'outline'} disabled={!draft.jsonReady} onClick={() => goTo('import')}>Next<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('prompt')}><ArrowLeft aria-hidden="true" />Back to prompt</Button></div>
        <p className="en-next-note">Materials go to your AI. The finished notebook JSON goes to Premed OS. Return to Class notebook and choose Add to notebook to resume this draft.</p>
      </footer>
      <details className="en-small-detail"><summary>Before you leave this page</summary><p>Your step and inputs are kept per class in this browser tab when storage is available. Closing the tab can lose this draft; keep your downloaded prompt and notebook JSON. Remembered class preferences are saved separately.</p><p>Working checkpoint files stay with your AI; they are not notebook imports. The 8 MiB input limit does not guarantee a save. Available browser storage can run out sooner, so keep your downloaded copy.</p></details>
    </div>}

    {step === 'import' && <div className="en-stage-content"><NotebookImportPanel courseId={courseId} initialRaw={draft.rawJson} onRawChange={rawJson => setDraft(previous => ({ ...previous, rawJson }))} onImported={id => { finished.current = true; clearNotebookWorkflowDraft(courseId); onImported(id) }} /><div className="en-actions"><Button variant="ghost" onClick={() => goTo('handoff')}><ArrowLeft aria-hidden="true" />Back to AI steps</Button></div></div>}
  </section>
}
