import { sortNotebookLectures } from '@/lib/academics/notebook/catalogDate'
import { SelectField } from '@/components/ui/select-field'
import { useStudentGuide } from './UsingStudentGuide'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Download, NotebookText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/store'
import { buildFlashcardPrompt, flashcardNotebookEligibility } from '@/lib/academics/flashcards/prompt'

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
  const [copyBusy, setCopyBusy] = useState(false)
  const fallback = useRef<HTMLTextAreaElement>(null)
  const selection = lectureId ?? (chosenId || classLectures.find(lecture => flashcardNotebookEligibility(lecture).eligible)?.id)
  const lecture = classLectures.find(item => item.id === selection)
  const eligibility = lecture ? flashcardNotebookEligibility(lecture) : { eligible: false, reason: lectureId ? 'This lecture’s Class Journal is unavailable in this class.' : 'Create and save a completed Class Journal for this lecture first.' }
  const guide = useStudentGuide({ courseId, lessonIds: lecture ? [lecture.id] : [] })
  const prompt = lecture && eligibility.eligible ? buildFlashcardPrompt({ courseLabel, lecture, guideDirections: guide.directions }) : ''
  const currentFeedback = feedback?.prompt === prompt ? feedback : undefined

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
      const url = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `flashcards-${lecture!.id.replace(/[^a-zA-Z0-9_-]/g, '-')}-prompt.md`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setFeedback({ prompt, text: 'Prompt download requested. Open the file and paste its complete contents into your external AI.' })
    } catch {
      setFeedback({ prompt, text: 'The download could not start. Select and copy the complete prompt below.', fallback: true })
    }
  }

  return <section className="space-y-5" aria-label="Flashcard prompt">
    {showHeader && <header className="flex items-start justify-between gap-4">
      <div><h2 className="font-display text-xl font-bold">Create flashcards</h2><p className="mt-1 text-sm text-muted-foreground">{courseLabel} · From your completed Class Journal</p></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Close flashcard prompt" onClick={onClose}><X className="size-4" /></Button>
    </header>}
    <p className="text-sm leading-6">Your completed Class Journal is required. Download it from the Journal’s “Downloads, notes and history” and attach it in a new AI chat. Original lecture materials are optional and recommended.</p>
    {lectureId ? <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground">Selected Class Journal</p><p className="mt-1 font-semibold">{lecture?.title ?? 'Journal unavailable'}</p></div> : <label className="block space-y-2 text-sm font-semibold">
      <span>Class Journal</span>
      <SelectField aria-label="Class Journal" className="field-solid min-h-11 w-full" value={selection ?? ''} disabled={copyBusy} onValueChange={setChosenId} options={[
        ...(!selection ? [{ value: '', label: 'No completed Class Journal available' }] : []),
        ...classLectures.map(item => { const result = flashcardNotebookEligibility(item); return { value: item.id, disabled: !result.eligible, label: `${item.title}${result.eligible ? '' : ` — ${result.reason}`}` } }),
      ]} />
    </label>}
    {eligibility.eligible && guide.preview}
    {!eligibility.eligible ? <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p role="status" className="text-sm">{eligibility.reason}</p>
      <Button variant="outline" onClick={() => { onClose(); navigate(`/academics/classes/${encodeURIComponent(courseId)}/journal/new`) }}><NotebookText className="size-4" />Create or import Class Journal</Button>
    </div> : <>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6">
        <li><strong>Download your notebook.</strong> Open your Class Journal’s “Downloads, notes and history” and download the complete notebook file.</li>
        <li><strong>Open a new AI chat and attach your notebook.</strong> Attach the original lecture files too if you have them (recommended).</li>
        <li><strong>Copy the complete prompt and paste it into that chat.</strong> Use an AI that can run code and create downloadable files. Download the finished <code>.apkg</code> file and import it into Anki.</li>
      </ol>
      <p className="text-sm text-muted-foreground">Tip: Missed a practice or mock-exam question? Paste it into the same chat along with this prompt. The deck adds a card or two on the concept you missed, not a copy of the question.</p>
      <p className="text-sm text-muted-foreground">Premed OS supplies the prompt and stops here. The finished deck goes directly into Anki as one standalone deck. Rename it or move it under your own decks after importing.</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={copyBusy} onClick={() => void copyPrompt()}><Copy className="size-4" />{copyBusy ? 'Copying…' : 'Copy complete prompt'}</Button>
        <Button variant="outline" onClick={downloadPrompt}><Download className="size-4" />Download prompt</Button>
      </div>
      {currentFeedback && <p role="status" className="text-sm">{currentFeedback.text}</p>}
      <details key={`${selection}-${currentFeedback?.fallback ? 'fallback' : 'preview'}`} open={currentFeedback?.fallback || undefined} className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">View complete prompt / copy manually</summary>
        <div className="mt-3 space-y-2">
          <Button variant="outline" size="sm" onClick={() => { fallback.current?.focus(); fallback.current?.select() }}>Select all prompt text</Button>
          <Textarea ref={fallback} aria-label="Complete flashcard prompt" readOnly value={prompt} className="h-64 font-mono text-xs" />
        </div>
      </details>
    </>}
  </section>
}
