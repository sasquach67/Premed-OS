import { useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactElement } from 'react'
import { ClipboardPaste, FileUp, ImagePlus, X } from 'lucide-react'
import { buildPastedExcerpt, MIN_PASTED_EXCERPT_CHARACTERS } from '@/lib/academics/pastedExcerpt'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import { extractDocumentText } from '@/lib/academics/documentText'
import { parseTranscript } from '@/lib/academics/transcriptImport'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** One local intake surface for files, clipboard screenshots, and exact pasted text. */
export function MaterialIntakeDialog({ courseId, lectureId, linkedTopicIds = [], trigger, initialOpen = false }: {
  courseId: string
  lectureId?: string
  linkedTopicIds?: string[]
  trigger: ReactElement
  initialOpen?: boolean
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(initialOpen)
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [sectionLabel, setSectionLabel] = useState('')
  const [text, setText] = useState('')
  const canSaveText = text.trim().length >= MIN_PASTED_EXCERPT_CHARACTERS
  const canSave = files.length > 0 || canSaveText

  function addFiles(next: Iterable<File>) {
    const additions = [...next]
    if (!additions.length) return
    setFiles((current) => {
      const known = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
      return [...current, ...additions.filter((file) => !known.has(`${file.name}:${file.size}:${file.lastModified}`))]
    })
  }

  function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    const images = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
    if (!images.length) return
    event.preventDefault()
    addFiles(images)
  }

  function activateScreenshotPicker(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    inputRef.current?.click()
  }

  async function save() {
    if (!canSave) return
    const center = useStore.getState().academics.classCenter
    const retained = await Promise.all(files.map(async (file) => {
      const id = uid()
      const blobRef = await retainLocalMaterial(file, id)
      try {
        const extracted = await extractDocumentText(file)
        return { file, id, blobRef, extracted, extractionError: '' }
      } catch (error) {
        return { file, id, blobRef, extracted: undefined, extractionError: error instanceof Error ? error.message : 'This file could not be read as text.' }
      }
    }))
    const excerpt = canSaveText ? buildPastedExcerpt({
      courseId, lectureId, linkedTopicIds, text, title, sourceLabel, sectionLabel,
      order: center.files.filter((file) => file.courseId === courseId).length + retained.length,
    }) : undefined
    const now = Date.now()
    useStore.getState().update((draft) => {
      const records = draft.academics.classCenter.files
      retained.forEach(({ file, id, blobRef, extracted, extractionError }) => {
        const parsed = extracted?.text.trim() ? parseTranscript(extracted.text) : undefined
        records.unshift({
        id, courseId, lectureId, title: file.name.replace(/\.[^.]+$/, '') || file.name,
        type: 'other', sourceType: 'upload', owner: 'mine', url: '', blobRef, fileName: file.name, mimeType: file.type,
        notes: '', linkedTopicIds,
        processingStatus: parsed?.segments.length ? 'ready' : 'failed',
        processingError: parsed?.segments.length ? undefined : extractionError || (extracted?.scanDetected ? 'This file has no readable text layer. It remains available to open.' : 'No readable text was found. The file remains available to open.'),
        createdAt: now, updatedAt: now, order: records.length,
        })
        if (parsed?.segments.length) draft.academics.classCenter.sourceChunks.push(...parsed.segments.map((segment, index) => ({
          id: uid(), fileId: id, courseId, content: segment.text,
          characterStart: segment.start, characterEnd: segment.end,
          sourcePosition: { index, label: segment.label },
          assignmentMethod: linkedTopicIds.length === 1 ? 'manual' as const : 'pending' as const,
          assignmentConfirmed: linkedTopicIds.length === 1,
          topicId: linkedTopicIds.length === 1 ? linkedTopicIds[0] : undefined,
          coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: index,
        })))
      })
      if (excerpt) {
        records.unshift(excerpt.file)
        draft.academics.classCenter.sourceChunks.push(...excerpt.chunks)
      }
    })
    const count = retained.length + (excerpt ? 1 : 0)
    const unreadable = retained.filter((item) => !item.extracted?.text.trim()).length
    toast({ title: count === 1 ? 'Material added' : `${count} materials added`, description: unreadable
      ? `${unreadable} ${unreadable === 1 ? 'file remains' : 'files remain'} available to open but cannot be used as a text study source yet.`
      : lectureId ? 'Saved with this lecture and indexed on this device.' : 'Saved and indexed in Materials on this device.' })
    setOpen(false); setFiles([]); setTitle(''); setSourceLabel(''); setSectionLabel(''); setText('')
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="max-w-xl bg-card">
      <DialogHeader><DialogTitle>Add material</DialogTitle><DialogDescription>Choose files, paste a screenshot from your clipboard, or paste the textbook text you want to study. Everything stays local.</DialogDescription></DialogHeader>
      <div className="grid gap-4">
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files ?? []); event.currentTarget.value = '' }} />
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-left hover:border-primary/55" onClick={() => inputRef.current?.click()}><FileUp className="size-5 text-primary" /><p className="mt-2 font-bold">Attach files</p><p className="mt-1 text-xs text-muted-foreground">PDFs, slides, notes, or images</p></button>
          <div role="button" tabIndex={0} onPaste={pasteImage} onClick={() => inputRef.current?.click()} onKeyDown={activateScreenshotPicker} className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-left outline-none hover:border-primary/55 focus-visible:ring-2 focus-visible:ring-ring"><ImagePlus className="size-5 text-primary" /><p className="mt-2 font-bold">Paste a screenshot</p><p className="mt-1 text-xs text-muted-foreground">Click here, then press ⌘/Ctrl + V</p></div>
        </div>
        {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs font-semibold">{file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, candidate) => candidate !== index))}><X className="size-3" /></button></span>)}</div>}
        <div className="border-t border-border pt-4"><p className="font-semibold">Or paste textbook text</p><p className="mt-1 text-xs text-muted-foreground">Only the excerpt you paste becomes a study source.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="grid gap-1"><Label htmlFor="material-title">Material title <span className="text-muted-foreground">(optional)</span></Label><Input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter 4 reading" /></div><div className="grid gap-1"><Label htmlFor="material-section">Section <span className="text-muted-foreground">(optional)</span></Label><Input id="material-section" value={sectionLabel} onChange={(event) => setSectionLabel(event.target.value)} placeholder="4.2 Synaptic signaling" /></div></div><Textarea className="mt-3 min-h-36" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the specific textbook passage, notes, or reading excerpt…" /><p className="mt-1 text-xs font-semibold text-muted-foreground">{text.trim().length} / {MIN_PASTED_EXCERPT_CHARACTERS} characters for a text source</p></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void save()} disabled={!canSave}><ClipboardPaste className="size-4" /> Add material</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
