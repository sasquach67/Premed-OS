import { sortNotebookLectures } from '@/lib/academics/notebook/catalogDate'
import { SelectField } from '@/components/ui/select-field'
import { useStudentGuide } from './UsingStudentGuide'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Download, NotebookText, X } from 'lucide-react'
import { NotebookAIFlow, NotebookAICopy } from './NotebookAIFlow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/store'
import { buildFlashcardPrompt, flashcardNotebookEligibility } from '@/lib/academics/flashcards/prompt'
import { exportNotebook } from '@/lib/academics/notebook/import'
import { notebookExportFilename } from '@/lib/academics/notebook/downloadFilename'
import { exportNotebookPackageBundle } from '@/lib/academics/notebook/notebookBundle'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function FlashcardPromptPanel({ courseId, courseLabel, lectureId, onClose, showHeader = true }: {
  courseId: string
  courseLabel: string
  lectureId?: string
  onClose: () => void
  showHeader?: boolean
}) {
  const navigate = useNavigate()
  const lectures = useStore(state => state.academics.classCenter.lectures)
  const classLectures = sortNotebookLectures(lectures, courseId)
  const [chosenId, setChosenId] = useState('')
  const [feedback, setFeedback] = useState<{ prompt: string; text: string; fallback?: boolean }>()
  const [promptOpen, setPromptOpen] = useState(false)
  const [deckName, setDeckName] = useState('')
  const [copyBusy, setCopyBusy] = useState(false)
  const [notebookBusy, setNotebookBusy] = useState(false)
  const [haveNotebookFor, setHaveNotebookFor] = useState('')
  const [notebookNote, setNotebookNote] = useState<{ lectureId: string; text: string }>()
  const fallback = useRef<HTMLTextAreaElement>(null)
  const selection = lectureId ?? (chosenId || classLectures.find(lecture => flashcardNotebookEligibility(lecture).eligible)?.id)
  const lecture = classLectures.find(item => item.id === selection)
  const eligibility = lecture ? flashcardNotebookEligibility(lecture) : { eligible: false, reason: lectureId ? 'This lecture’s Class Journal is unavailable in this class.' : 'Create and save a completed Class Journal for this lecture first.' }
  const guide = useStudentGuide({ courseId, lessonIds: lecture ? [lecture.id] : [] })
  const prompt = lecture && eligibility.eligible ? buildFlashcardPrompt({ courseLabel, lecture, guideDirections: guide.directions }) : ''
  const currentFeedback = feedback?.prompt === prompt ? feedback : undefined
  // Legacy Journals have no notebook file; their study guide travels inside the prompt.
  const hasNotebookFile = Boolean(lecture?.importedNotebook)
  const haveNotebook = Boolean(selection) && haveNotebookFor === selection
  const notebookReady = !hasNotebookFile || haveNotebook
  const currentNotebookNote = notebookNote && notebookNote.lectureId === selection ? notebookNote.text : ''

  async function downloadNotebook() {
    if (!lecture || notebookBusy) return
    const lectureId = lecture.id
    setNotebookBusy(true)
    setNotebookNote(undefined)
    try {
      const current = useStore.getState().academics.classCenter.lectures.find(item => item.id === lectureId)
      const notebook = current?.importedNotebook
      if (!current || !notebook) throw new Error('This saved notebook is no longer available.')
      const raw = exportNotebook(current, 'current')
      const hasImages = Boolean((JSON.parse(raw) as { assets?: unknown[] }).assets?.length)
      let text = 'Notebook downloaded.'
      let bundle: Blob | undefined
      if (hasImages) {
        try {
          bundle = await exportNotebookPackageBundle(raw, notebook.assetBindings ?? [], notebookAssetRepository())
          text = 'Notebook and its images downloaded.'
        } catch {
          // Figures are optional for flashcards, so a missing image never blocks the notebook itself.
          text = 'Notebook downloaded without its images.'
        }
      }
      saveBlob(notebookExportFilename(notebook, 'current', bundle ? 'zip' : 'json'), bundle ?? new Blob([raw], { type: 'application/json;charset=utf-8' }))
      setHaveNotebookFor(lectureId)
      setNotebookNote({ lectureId, text })
    } catch (error) {
      setNotebookNote({ lectureId, text: error instanceof Error ? error.message : 'The notebook could not be downloaded.' })
    } finally {
      setNotebookBusy(false)
    }
  }

  async function copyPrompt() {
    if (!prompt || copyBusy) return
    setCopyBusy(true)
    try {
      await navigator.clipboard.writeText(prompt)
      setFeedback({ prompt, text: 'Complete prompt copied. Paste it into your external AI conversation.' })
    } catch {
      setFeedback({ prompt, text: 'Clipboard access was unavailable. Select and copy the complete prompt below, or download it.', fallback: true })
    } finally {
      setCopyBusy(false)
    }
  }

  function downloadPrompt() {
    if (!prompt) return
    try {
      saveBlob(`flashcards-${lecture!.id.replace(/[^a-zA-Z0-9_-]/g, '-')}-prompt.md`, new Blob([prompt], { type: 'text/markdown;charset=utf-8' }))
      setFeedback({ prompt, text: 'Prompt download requested. Open the file and paste its complete contents into your external AI.' })
    } catch {
      setFeedback({ prompt, text: 'The download could not start. Select and copy the complete prompt below.', fallback: true })
    }
  }

  return <section className="space-y-5 nai-flashcards" aria-label="Flashcard prompt">
    {showHeader && <header className="flex items-start justify-between gap-4">
      <div><h2 className="font-display text-xl font-bold">Create flashcards</h2><p className="mt-1 text-sm text-muted-foreground">{courseLabel} · From your completed Class Journal</p></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Close flashcard prompt" onClick={onClose}><X className="size-4" /></Button>
    </header>}
    {lectureId ? <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground">Selected Class Journal</p><p className="mt-1 font-semibold">{lecture?.title ?? 'Journal unavailable'}</p></div> : <label className="block space-y-2 text-sm font-semibold">
      <span>Class Journal</span>
      <SelectField aria-label="Class Journal" className="field-solid min-h-11 w-full" value={selection ?? ''} disabled={copyBusy} onValueChange={id => { setChosenId(id); setDeckName('') }} options={[
        ...(!selection ? [{ value: '', label: 'No completed Class Journal available' }] : []),
        ...classLectures.map(item => { const result = flashcardNotebookEligibility(item); return { value: item.id, disabled: !result.eligible, label: `${item.title}${result.eligible ? '' : ` — ${result.reason}`}` } }),
      ]} />
    </label>}
    {eligibility.eligible && guide.preview}
    {!eligibility.eligible ? <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p role="status" className="text-sm">{eligibility.reason}</p>
      <Button variant="outline" onClick={() => { onClose(); navigate(`/academics/classes/${encodeURIComponent(courseId)}/journal/new`) }}><NotebookText className="size-4" />Create or import Class Journal</Button>
    </div> : <>
      <NotebookAIFlow gather={<>
        <div className="nai-files" aria-label="What to attach in your AI chat"><div className="nai-file"><span><b>Notebook</b><small>{hasNotebookFile ? 'JSON + images' : 'Included in your prompt'}</small></span>{hasNotebookFile && <Button variant="outline" disabled={notebookBusy} onClick={() => void downloadNotebook()}><Download aria-hidden="true" />{notebookBusy ? 'Preparing…' : 'Download'}</Button>}</div><div className="nai-file"><span><b>Lecture materials</b></span><span>Recommended</span></div><div className="nai-file"><span><b>Current deck</b><small>Only when updating a deck</small></span><span>Optional</span></div></div>
        {hasNotebookFile && <Button variant="ghost" aria-pressed={haveNotebook} onClick={() => setHaveNotebookFor(selection ?? '')}>{haveNotebook && <Check aria-hidden="true" />}I already have it</Button>}
        {currentNotebookNote && <p role="status" className="nai-hint">{currentNotebookNote}</p>}
        <p className="nai-hint">To update a deck, export it from Anki as .apkg first. Your notes, practice answers and checkmarks stay in Premed OS.</p>
      </>} copy={<NotebookAICopy flashcards copyBusy={copyBusy} disabled={!notebookReady} onCopy={() => void copyPrompt()} onDownload={downloadPrompt} onView={() => setPromptOpen(value => !value)}>
        {!notebookReady && <p className="nai-hint">Get your notebook first.</p>}
        {currentFeedback && <p role="status" className="nai-hint">{currentFeedback.text}</p>}
        <details key={`${selection}-${currentFeedback?.fallback ? 'fallback' : 'preview'}`} open={promptOpen || currentFeedback?.fallback || undefined} onToggle={event => setPromptOpen(event.currentTarget.open)} className="nai-prompt"><summary>View complete prompt / copy manually</summary><div className="mt-3 space-y-2"><Button variant="outline" size="sm" onClick={() => { fallback.current?.focus(); fallback.current?.select() }}>Select all prompt text</Button><Textarea ref={fallback} aria-label="Complete flashcard prompt" readOnly value={prompt} className="h-64 font-mono text-xs" /></div></details>
      </NotebookAICopy>} bringTitle="Bring the deck back" bring={<>
        <label className="nai-file cursor-pointer"><span><b>Choose the .apkg your AI made</b><small>Usually in your class folder, or Downloads</small></span><input aria-label="Choose the .apkg your AI made" type="file" accept=".apkg" onChange={event => { const file=event.target.files?.[0]; setDeckName(file?.name.endsWith('.apkg') ? file.name : ''); }} /></label>
        {deckName && <p role="status" className="nai-hint">{deckName} selected. Open this file from its saved folder in Anki to import the deck.</p>}
        <p className="nai-hint">The finished .apkg goes directly into Anki. Premed OS does not import or save Anki decks.</p>
      </>} help={<><p>Tip: Missed a practice or mock-exam question? Paste it into the same chat along with this prompt. The deck adds a card or two on the concept you missed, not a copy of the question.</p><p><b>The AI cannot create a file:</b> use a chat that can run code and create downloadable files.</p><p><b>You are updating a deck:</b> attach the current exported .apkg and check the AI’s result in Anki before replacing or deleting existing cards.</p><p>If the AI cannot reach your class folder, it should save the .apkg to Downloads and tell you where.</p></>} />
    </>}
  </section>
}
