import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { composeNotebookPrompt, type PromptValues } from '@/lib/academics/notebook/prompt'
import type { NotebookGoal } from '@/lib/academics/notebook/types'
import { NotebookImportPanel } from './NotebookImportPanel'
import { downloadNotebookText, notebookTransaction } from './ExternalNotebookView'

const GOALS = {
  review: {
    title: 'Review class material',
    description: 'Understand a lesson and practice recall.',
    bring: 'Readable lesson material. Add notes, slides, and learning objectives if you have them.',
    result: 'A study guide, learning goals, practice questions, and a check of what your sources cover.',
    limit: 'Missing material means gaps in the guide. Add readable sources, or work through unrelated lessons separately.',
    more: 'Use this to review, catch up, preview a lesson, or understand a confusing concept. Notes or a transcript, slides, readings, and learning objectives help, but you do not need every type of material.',
    stages: ['Understand and connect', 'Practice recall', 'Revisit weak areas'],
  },
  assessment: {
    title: 'Prepare for an assessment',
    description: 'Study across the lessons on your exam.',
    bring: 'A review sheet or topic list, relevant lesson materials, and the exam format if known.',
    result: 'A study guide, explained practice questions, and a checklist of covered and missing topics.',
    limit: 'One lesson cannot cover a whole exam. Missing or unreadable lessons must stay marked as gaps.',
    more: 'Start with the instructor\'s review sheet when available. Include the lectures, notes, and readings for the exam. Practice questions, answer keys, and your attempts can help, but they are not required.',
    stages: ['Establish scope and coverage', 'Explain difficult topics', 'Practice and identify gaps'],
  },
  assignment: {
    title: 'Work on an assignment',
    description: 'Get help with the stage you are on.',
    bring: 'The task, the help you want, and relevant sources. Include your draft or data when needed.',
    result: 'Help for your chosen stage and a check against the assignment requirements.',
    limit: 'A hint stays a hint. Missing rubric details or data stay unknown; work through large tasks in named stages.',
    more: 'Bring the assignment instructions and rubric if available, required sources, and any attempt you want reviewed. Tell your AI whether you want a plan, a hint, feedback, or revision help.',
    stages: ['Understand the task', 'Plan an approach', 'Get a hint', 'Review my attempt', 'Revise my draft'],
  },
}

type Step = 'goal' | 'details' | 'prompt' | 'handoff' | 'import'
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
  const [step, setStep] = useState<Step>('goal')
  const [goal, setGoal] = useState<NotebookGoal>('review')
  const [preferences, setPreferences] = useState(workspace?.externalNotebookPreferences ?? '')
  const [scope, setScope] = useState('')
  const [scopeSource, setScopeSource] = useState('')
  const [materials, setMaterials] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [stage, setStage] = useState(GOALS.review.stages[0])
  const [format, setFormat] = useState('')
  const [depth, setDepth] = useState('Full explanation with connections, examples, and practice')
  const [request, setRequest] = useState('')
  const [term, setTerm] = useState(course?.term ?? '')
  const [message, setMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])
  if (!course) return <p role="alert">Class not found.</p>

  const activeStep = step === 'details' ? 0 : STEPS.findIndex(item => item.id === step)
  const current = STEPS[activeStep]
  const goalInfo = GOALS[goal]
  const classFiles = files.filter(file => file.courseId === courseId)
  const values: PromptValues = { COURSE_CODE: course.code, COURSE_TITLE: course.title, TERM: term || null, SCOPE: scope.trim() ? `${scope}\nScope authority: ${scopeSource || 'Not supplied; label provisional scope.'}` : null, MATERIALS: [...classFiles.filter(f => selected.includes(f.id)).map(f => `${f.title} (${f.type}; attach the actual original file in the AI conversation)`), materials].filter(Boolean).join('\n'), DEPTH: depth, CLASS_PREFERENCES: preferences, HELP_STAGE: stage, ASSESSMENT_FORMAT: goal === 'assessment' ? format || null : null, USER_REQUEST: request, REVISION_INPUT: null }
  const fullPrompt = composeNotebookPrompt(goal, values)
  function goTo(next: Step) { setMessage(''); setStep(next) }
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
      {step !== 'import' && <Button variant="ghost" className="en-return-link" onClick={() => goTo('import')}>Already have JSON? Import directly</Button>}
    </header>

    <nav className="en-flow-nav" aria-label="Notebook workflow progress">
      <ol>{STEPS.map((item, index) => <li key={item.id}>
        <button type="button" aria-current={activeStep === index ? 'step' : undefined} onClick={() => goTo(item.id)}>
          <span className="en-step-number" aria-hidden="true">{index + 1}</span>
          <span>{item.label}</span>
          <span className="sr-only">, step {index + 1} of 4</span>
        </button>
      </li>)}</ol>
    </nav>
    <p className={message ? 'en-feedback' : 'sr-only'} role="status" aria-live="polite">{message}</p>

    {step === 'goal' && <div className="en-stage-content">
      <fieldset>
        <legend className="sr-only">Notebook goal</legend>
        <div className="en-goals">{(Object.keys(GOALS) as NotebookGoal[]).map(g => <label key={g} className="en-goal-card">
          <input aria-label={GOALS[g].title} type="radio" name={`external-goal-${courseId}`} value={g} checked={goal === g} onChange={() => { setGoal(g); setStage(GOALS[g].stages[0]) }} />
          <span><b>{GOALS[g].title}</b><span>{GOALS[g].description}</span></span>
        </label>)}</div>
      </fieldset>
      <section className="en-goal-guide" aria-label={`${goalInfo.title}: what to bring and expect`}>
        <dl><div><dt>Bring</dt><dd>{goalInfo.bring}</dd></div><div><dt>You will get</dt><dd>{goalInfo.result}</dd></div></dl>
        <details className="en-small-detail"><summary>When to use this and what may be missing</summary><p>{goalInfo.more}</p><p>{goalInfo.limit}</p></details>
      </section>
      <label className="en-field en-flow-request">Additional instructions for your AI
        <span className="en-muted block">Optional. Included when you copy the prompt.</span>
        <textarea aria-label="Additional instructions for your AI" rows={2} value={request} onChange={e => setRequest(e.target.value)} placeholder="e.g., explain simply, give examples, focus on a topic..." />
      </label>
      <footer className="en-stage-footer"><div className="en-actions">
        <Button onClick={() => goTo('prompt')}>View full prompt<ArrowRight aria-hidden="true" /></Button>
        <Button variant="ghost" onClick={() => goTo('details')}>Customize prompt <span className="en-muted">(optional)</span></Button>
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
      <footer className="en-stage-footer"><div className="en-actions"><Button onClick={() => goTo('prompt')}>View full prompt<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('goal')}>Back to goal</Button></div>
        <p className="en-next-note">You can fill in missing details in your AI conversation.</p>
      </footer>
    </div>}

    {step === 'prompt' && <div className="en-stage-content">
      <section className="en-stage-panel en-prompt-card">
        <p className="en-eyebrow">Your prepared prompt</p>
        <h2>{goalInfo.title}</h2>
        <p>{course.code} / {course.title}</p>
        <p className="en-muted">Includes the full instructions, your class details, and the notebook file format.</p>
        <div className="en-actions"><Button onClick={() => { void navigator.clipboard.writeText(fullPrompt).then(() => { goTo('handoff'); setMessage('Full prompt copied. Paste it into your AI.') }, () => setMessage('Clipboard unavailable. Download the full prompt or select it in the preview below.')) }}><Copy aria-hidden="true" />Copy full prompt</Button>
          <Button variant="ghost" onClick={() => goTo('details')}>Edit class details</Button>
        </div>
      </section>
      <details className="en-prompt-detail"><summary>Preview or download the full prompt</summary>
        <p className="en-muted">This is the exact text that the copy button uses.</p>
        <div className="en-actions"><Button variant="outline" onClick={() => { downloadNotebookText(`notebook-${goal}-prompt.md`, fullPrompt, 'text/markdown'); setMessage('Prompt download requested. Open the file and paste its full contents into your AI.') }}><Download aria-hidden="true" />Download full prompt</Button></div>
        <label className="en-field">Full customized prompt<textarea className="en-json" readOnly value={fullPrompt} /></label>
      </details>
      <footer className="en-stage-footer"><div className="en-actions"><Button variant="ghost" onClick={() => goTo('handoff')}>I have copied or downloaded it<ArrowRight aria-hidden="true" /></Button></div><p className="en-next-note">Next: paste it into your AI and attach the materials there.</p></footer>
    </div>}

    {step === 'handoff' && <div className="en-stage-content">
      <p className="en-selected-goal">{goalInfo.title}</p>
      <ol className="en-handoff-list">
        <li><span className="en-task-number" aria-hidden="true">1</span><div><h2>Paste the prompt</h2><p>Open the class project or conversation you want to use in your AI. Paste the full prompt there.</p></div></li>
        <li><span className="en-task-number" aria-hidden="true">2</span><div><h2>Attach your materials</h2><p className="en-text">{values.MATERIALS || goalInfo.bring}</p><p className="en-muted">Upload the original files there. Ask your AI to confirm what it could actually read.</p></div></li>
        <li><span className="en-task-number" aria-hidden="true">3</span><div><h2>Get the notebook file</h2><p>Ask for a downloadable <strong>.json file</strong>. If downloads are unavailable, ask for the complete JSON block.</p></div></li>
      </ol>
      {goal === 'assessment' ? <aside className="en-brief-note"><b>Lots of lessons?</b><p>Work through them in batches and save each batch outside the app. Then ask your AI for one final study guide using the saved work. The app does not merge batches; missing lessons must stay marked.</p></aside> : <aside className="en-brief-note"><b>Keep the limits visible</b><p>{goalInfo.limit}</p></aside>}
      <footer className="en-stage-footer"><div className="en-actions"><Button onClick={() => goTo('import')}>I have the JSON<ArrowRight aria-hidden="true" /></Button><Button variant="ghost" onClick={() => goTo('prompt')}><ArrowLeft aria-hidden="true" />Back to prompt</Button></div>
        <p className="en-next-note">Working elsewhere? Return to Class notebook and choose Import JSON when the file is ready.</p>
      </footer>
      <details className="en-small-detail"><summary>Before you leave this page</summary><p>Keep your downloaded prompt and notebook file. Unsaved prompt details are not kept when you leave; class preferences are kept only if you choose to remember them.</p><p>Import a complete JSON file, up to 8 MiB of raw text. Browser storage may run out earlier, so keep the original download until saving succeeds.</p></details>
    </div>}

    {step === 'import' && <div className="en-stage-content"><NotebookImportPanel courseId={courseId} onImported={onImported} /><div className="en-actions"><Button variant="ghost" onClick={() => goTo('goal')}><ArrowLeft aria-hidden="true" />Create a prompt instead</Button></div></div>}
  </section>
}
