import { useState } from 'react'
import {
  ArrowLeft, Bot, Check, CheckCircle2, ChevronRight, Cloud, Copy, FileText, Folder, Globe, GraduationCap, HelpCircle, ListChecks, Search, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/common/useToast'
import { cn } from '@/lib/utils'
import { defaultFolderName, filingPrompt, folderRoot } from '@/lib/academics/classFolder'
import type { ClassFolderSetup } from '@/lib/types'
import './classFolder.css'

type Answers = Pick<ClassFolderSetup, 'site' | 'place' | 'mover'>

const QUESTIONS = [
  { key: 'site', q: 'Where does your class post files?', options: [
    { value: 'canvas', label: 'Canvas', note: 'Shows the Canvas steps', Icon: GraduationCap },
    { value: 'other', label: 'Somewhere else', note: 'One general line instead', Icon: Globe },
  ] },
  { key: 'place', q: 'Where do you keep schoolwork?', options: [
    { value: 'documents', label: 'Documents', note: 'Most common', Icon: Folder },
    { value: 'cloud', label: 'A cloud drive', note: 'Google Drive, OneDrive or iCloud', Icon: Cloud },
    { value: 'not-sure', label: 'Not sure', note: 'We’ll use Documents', Icon: HelpCircle },
  ] },
  { key: 'mover', q: 'Who moves the files?', options: [
    { value: 'me', label: 'Me', note: 'Four short steps', Icon: User },
    { value: 'ai', label: 'My AI app', note: 'Needs an AI app that can open folders', Icon: Bot },
  ] },
] as const

const DEFAULTS: Answers = { site: 'canvas', place: 'documents', mover: 'me' }
const picture = (file: string) => `${import.meta.env.BASE_URL}academics/folder-guide/${file}`

/**
 * Class folder setup (walkthrough "Set up a class", steps 6–7, Oct 18 2026):
 * three questions, then four short steps, or a filing prompt for an AI app
 * that can open folders. Finishing or skipping saves `ClassFolderSetup`.
 */
export function ClassFolderGuide({ courseCode, initial, onFinish, onSkip, onBack }: {
  courseCode: string
  initial?: ClassFolderSetup
  onFinish: (setup: Omit<ClassFolderSetup, 'updatedAt' | 'state'>) => void
  onSkip: () => void
  onBack: () => void
}) {
  const [answers, setAnswers] = useState<Partial<Answers>>(initial ? { site: initial.site, place: initial.place, mover: initial.mover } : {})
  const [question, setQuestion] = useState<number | null>(initial ? null : 0)
  const name = initial?.name ?? defaultFolderName(courseCode)
  const done = { ...DEFAULTS, ...answers } as Answers
  const finish = () => onFinish({ ...done, name })

  if (question !== null) {
    const q = QUESTIONS[question]
    const answer = (value: string) => {
      const next = { ...answers, [q.key]: value === 'not-sure' ? 'documents' : value } as Partial<Answers>
      setAnswers(next)
      setQuestion(question + 1 < QUESTIONS.length ? question + 1 : null)
    }
    return <div className="class-folder">
      <Crumbs onBack={onBack} />
      <section className="class-folder-panel">
        <header className="class-folder-panel-head">
          <div><p className="class-folder-kicker">Class folder · question {question + 1} of {QUESTIONS.length}</p><h2>{q.q}</h2></div>
          <button type="button" className="class-folder-quiet" onClick={() => setQuestion(null)}>Skip the questions</button>
        </header>
        <div className="class-folder-body">
          <div className={cn('class-folder-options', q.options.length === 3 && 'is-three')}>
            {q.options.map(({ value, label, note, Icon }) => <button key={value} type="button" className={cn('class-folder-option', answers[q.key as keyof Answers] === value && 'is-on')} onClick={() => answer(value)}>
              <Icon aria-hidden="true" /><b>{label}</b><span>{note}</span>
            </button>)}
          </div>
          <div className="class-folder-qfoot">
            <Button variant="ghost" size="sm" disabled={!question} onClick={() => setQuestion(question - 1)}><ArrowLeft aria-hidden="true" /> Back</Button>
            <span className="class-folder-dots" aria-hidden="true">{QUESTIONS.map((_, i) => <i key={i} className={i <= question ? 'is-on' : ''} />)}</span>
          </div>
        </div>
      </section>
    </div>
  }

  const summary = [done.site === 'canvas' ? 'Canvas' : 'Somewhere else', done.place === 'cloud' ? 'Cloud drive' : 'Documents', done.mover === 'ai' ? 'My AI app' : 'Doing it myself']
  const top = <>
    <Crumbs onBack={onBack} />
    <div className="class-folder-summary">{summary.map((s) => <span key={s}>{s}</span>)}<button type="button" onClick={() => setQuestion(0)}>Change</button></div>
  </>

  if (done.mover === 'ai') return <div className="class-folder">{top}<AiFiling code={courseCode} name={name} answers={done} onManual={() => setAnswers({ ...done, mover: 'me' })} onDone={finish} /></div>
  return <div className="class-folder">{top}<FolderSteps code={courseCode} name={name} answers={done} onSkip={onSkip} onDone={finish} /></div>
}

function Crumbs({ onBack }: { onBack: () => void }) {
  return <nav className="class-folder-crumbs" aria-label="Breadcrumb"><button type="button" onClick={onBack}>Lessons</button><ChevronRight aria-hidden="true" /><span>Class folder</span></nav>
}

function AiFiling({ code, name, answers, onManual, onDone }: { code: string; name: string; answers: Answers; onManual: () => void; onDone: () => void }) {
  const toast = useToast()
  const prompt = filingPrompt({ code, folderName: name, place: answers.place, site: answers.site })
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); toast({ title: 'Filing prompt copied', description: 'Paste it into your AI app.', tone: 'success' }) }
    catch { toast({ title: 'Couldn’t copy', description: 'Open “See the full prompt” and copy it from there.', tone: 'error' }) }
  }
  const track = [[Search, 'Finds', 'your files in Downloads'], [ListChecks, 'Plans', 'every folder and file'], [User, 'Waits', 'for your yes'], [Copy, 'Copies', 'never moves or overwrites'], [CheckCircle2, 'Reports', 'what it wrote']] as const
  return <section className="class-folder-panel">
    <header className="class-folder-panel-head"><div><p className="class-folder-kicker">Class folder</p><h2>Your AI app files things for you</h2><p>Download the class files{answers.site === 'canvas' ? ' from Canvas' : ''} first. Then paste this into your AI app.</p></div></header>
    <div className="class-folder-body class-folder-stack">
      <ol className="class-folder-track" aria-label="What your AI will do">
        {track.map(([Icon, t, d]) => <li key={t} className={t === 'Waits' ? 'is-stop' : undefined}><span className="dot"><Icon aria-hidden="true" /></span><div><b>{t}</b><span>{d}</span></div></li>)}
      </ol>
      <details className="class-folder-fold"><summary><ChevronRight aria-hidden="true" />See the full prompt</summary><pre className="class-folder-prompt">{prompt}</pre></details>
      <div className="class-folder-actions">
        <Button variant="ghost" onClick={onManual}>Do it myself instead</Button>
        <div className="flex gap-2"><Button onClick={copy}><Copy aria-hidden="true" /> Copy filing prompt</Button><Button variant="outline" onClick={onDone}>Done</Button></div>
      </div>
    </div>
  </section>
}

interface Beat { text: string; picture?: string; drawing?: 'layout' | 'moved' | 'saved' }

function FolderSteps({ code, name, answers, onSkip, onDone }: { code: string; name: string; answers: Answers; onSkip: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [beat, setBeat] = useState(0)
  const root = folderRoot(answers.place)
  const steps: { tab: string; when: string; title: string; beats: Beat[]; result: string | 'tree' }[] = [
    { tab: 'Download', when: answers.site === 'canvas' ? 'From Canvas' : 'From your class site', title: 'Download the class files',
      beats: answers.site === 'canvas'
        ? [{ text: 'In Canvas, open Files.', picture: 'canvas-files-start.png' }, { text: 'Tick the box at the top, then click Download.', picture: 'canvas-files-end.png' }, { text: 'The files land in Downloads. Double-click the zip to open it.', picture: '06-downloads-selected.png' }]
        : [{ text: 'Download the lesson’s files from your class site. They land in Downloads.', picture: '06-downloads-selected.png' }],
      result: 'The lesson’s files are in Downloads.' },
    { tab: 'Make folders', when: 'Once per class', title: 'Make the folders',
      beats: [
        { text: answers.place === 'cloud' ? 'Open your cloud drive folder.' : 'Open Documents.', picture: '01-documents-empty.png' },
        { text: 'Make a new folder.', picture: '02-more-menu.png' },
        { text: `Name it “${name}”.`, picture: '04-course-named.png' },
        { text: 'Inside it, make one folder per lesson (Lesson 1, Lesson 2…), one per exam, and one called premedOS.', drawing: 'layout' },
      ], result: 'tree' },
    { tab: 'Move files in', when: 'Each lesson', title: 'Move the lesson’s files in',
      beats: [{ text: 'Open Downloads and select the lesson’s files.', picture: '06-downloads-selected.png' }, { text: 'Drag them into that lesson’s folder.', drawing: 'moved' }],
      result: 'Slides, outline, transcript and readings sit in Lesson 1.' },
    { tab: 'AI saves here', when: 'Automatic', title: 'Your AI saves into premedOS',
      beats: [{ text: 'Notebooks, flashcards and practice sets land here.', drawing: 'saved' }],
      result: 'Every prompt already points here. Nothing to move.' },
  ]
  const s = steps[step], b = s.beats[Math.min(beat, s.beats.length - 1)]
  const go = (n: number) => { setStep(n); setBeat(0) }
  return <article className="class-folder-steps">
    <div className="class-folder-steps-head"><div><p className="class-folder-kicker">{step === 0 && answers.site === 'canvas' ? 'Canvas' : `Class folder · ${code}`}</p><h2>{s.title}</h2></div><span className="class-folder-pill">Step {step + 1} of 4</span></div>
    <div className="class-folder-tabs" role="tablist" aria-label="Folder steps">
      {steps.map((x, i) => <button key={x.tab} type="button" role="tab" aria-selected={i === step} className={i === step ? 'is-current' : undefined} onClick={() => go(i)}><b>{i + 1} · {x.tab}</b><span>{x.when}</span></button>)}
    </div>
    <div className="class-folder-picture">
      {b.picture
        ? <img src={picture(b.picture)} width={b.picture.startsWith('canvas') ? 950 : 1498} height={b.picture.startsWith('canvas') ? 446 : 816} alt={`${b.picture.startsWith('canvas') ? 'Canvas Files page' : 'Finder window'}: ${b.text}`} />
        : <FinderDrawing kind={b.drawing!} root={root} name={name} />}
    </div>
    <div className="class-folder-beat"><p>{b.text}</p>{s.beats.length > 1 && <span className="class-folder-dots">{s.beats.map((_, i) => <button key={i} type="button" aria-label={`Picture ${i + 1}`} aria-current={i === beat ? 'true' : undefined} className={i === beat ? 'is-on' : ''} onClick={() => setBeat(i)} />)}</span>}</div>
    {s.result === 'tree'
      ? <div className="class-folder-tree"><div><Folder aria-hidden="true" />{name}</div><div className="d1"><Folder aria-hidden="true" />Lesson 1</div><div className="d1"><Folder aria-hidden="true" />Lesson 2</div><div className="d1"><Folder aria-hidden="true" />Exam 1</div><div className="d1"><Folder aria-hidden="true" />premedOS</div><div className="d2"><Folder aria-hidden="true" />Lesson 1 - your AI’s files</div></div>
      : <p className="class-folder-result"><CheckCircle2 aria-hidden="true" />{s.result}</p>}
    <div className="class-folder-step-actions">
      <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
      <div className="flex gap-2">{step > 0 && <Button variant="outline" onClick={() => go(step - 1)}>Back</Button>}{step < 3 ? <Button onClick={() => go(step + 1)}>Next step</Button> : <Button onClick={onDone}><Check aria-hidden="true" /> Done</Button>}</div>
    </div>
    <p className="class-folder-later"><b>Later:</b> download each new lesson’s files when they’re posted, and drop them in that lesson’s folder.</p>
  </article>
}

/** A Finder-style list drawn in the class's real layout (the screenshots show an older one). */
function FinderDrawing({ kind, root, name }: { kind: 'layout' | 'moved' | 'saved'; root: string; name: string }) {
  const rows: [number, 'folder' | 'file', string][] = kind === 'layout'
    ? [[0, 'folder', 'Lesson 1'], [0, 'folder', 'Lesson 2'], [0, 'folder', 'Exam 1'], [0, 'folder', 'premedOS']]
    : kind === 'moved'
      ? [[0, 'folder', 'Lesson 1'], [1, 'file', 'Outline.docx'], [1, 'file', 'Readings.pdf'], [1, 'file', 'Slides.pdf'], [1, 'file', 'Transcript.txt'], [0, 'folder', 'Lesson 2'], [0, 'folder', 'premedOS']]
      : [[0, 'folder', 'Lesson 1'], [0, 'folder', 'premedOS'], [1, 'folder', 'Lesson 1 - Title'], [2, 'file', 'Lesson 1 notebook.json'], [2, 'file', 'Lesson 1 flashcards.apkg'], [2, 'file', 'Lesson 1 practice set.json']]
  return <div className="class-folder-finder" role="img" aria-label={`${root} › ${name}: ${rows.map((r) => r[2]).join(', ')}`}>
    <div className="bar"><span>{root} › {name}</span></div>
    <div className="head"><span>Name</span><span>Kind</span></div>
    {rows.map(([depth, type, label]) => <div key={label} className="row" style={{ paddingLeft: `${0.9 + depth * 1.4}rem` }}>
      {type === 'folder' ? <Folder aria-hidden="true" className="is-folder" /> : <FileText aria-hidden="true" />}<span>{label}</span><span className="kind">{type === 'folder' ? 'Folder' : 'Document'}</span>
    </div>)}
  </div>
}
