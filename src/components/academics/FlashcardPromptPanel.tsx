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
  const classLectures = lectures.filter(lecture => lecture.courseId === courseId)
  const [chosenId, setChosenId] = useState('')
  const [feedback, setFeedback] = useState<{ prompt: string; text: string; fallback?: boolean }>()
  const [copyBusy, setCopyBusy] = useState(false)
  const fallback = useRef<HTMLTextAreaElement>(null)
  const selection = lectureId ?? (chosenId || classLectures.find(lecture => flashcardNotebookEligibility(lecture).eligible)?.id)
  const lecture = classLectures.find(item => item.id === selection)
  const eligibility = lecture ? flashcardNotebookEligibility(lecture) : { eligible: false, reason: lectureId ? 'This lecture’s Class Journal is unavailable in this class.' : 'Create and save a completed Class Journal for this lecture first.' }
  const prompt = lecture && eligibility.eligible ? buildFlashcardPrompt({ courseLabel, lecture }) : ''
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
    <p className="text-sm leading-6">Your lecture’s Class Journal must already be made and saved here. The flashcards use its learning targets and the same original materials as its study guide and Mastery Map.</p>
    {lectureId ? <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground">Selected Class Journal</p><p className="mt-1 font-semibold">{lecture?.title ?? 'Journal unavailable'}</p></div> : <label className="block space-y-2 text-sm font-semibold">
      <span>Class Journal</span>
      <select className="field-solid w-full rounded-md border p-3" value={selection ?? ''} disabled={copyBusy} onChange={event => setChosenId(event.target.value)}>
        {!selection && <option value="">No completed Class Journal available</option>}
        {classLectures.map(item => { const result = flashcardNotebookEligibility(item); return <option key={item.id} value={item.id} disabled={!result.eligible}>{item.title}{result.eligible ? '' : ` — ${result.reason}`}</option> })}
      </select>
    </label>}
    {!eligibility.eligible ? <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p role="status" className="text-sm">{eligibility.reason}</p>
      <Button variant="outline" onClick={() => { onClose(); navigate(`/academics/classes/${encodeURIComponent(courseId)}/journal/new`) }}><NotebookText className="size-4" />Create or import Class Journal</Button>
    </div> : <>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6">
        <li><strong>Copy the complete prompt.</strong> It includes the card instructions, simple explanations and examples, formatting, and Anki styling.</li>
        <li><strong>Try to find the chat where you uploaded the materials for this Class Notebook.</strong> Paste the complete prompt there. If you cannot find that chat, re-upload the same materials in a new chat and paste the prompt. It includes the selected Journal context; attach the complete Journal too if the AI asks for missing content.</li>
        <li><strong>Use an AI that can run code and create downloadable files.</strong> Once it has the materials, it will start making the deck. If files are missing or no longer accessible, it will ask you to re-upload them or return to the original chat and paste the prompt there. Download the finished <code>.apkg</code> file and import it into Anki.</li>
      </ol>
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
