import { useEffect, useRef, useState, type ClipboardEvent, type ReactElement, type SyntheticEvent } from 'react'
import { ClipboardPaste, FileText, FileUp, ImagePlus, Maximize2, X } from 'lucide-react'
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

const GENERIC_CLIPBOARD_IMAGE_NAME = /^(?:image|clipboard|blob)(?:[-_ ]?\d+)?\.(?:png|jpe?g|gif|webp|heic)$/i

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

function pastedScreenshotName(date: Date, extension: string, copy = 1) {
  const hour = date.getHours()
  const period = hour >= 12 ? 'PM' : 'AM'
  const clockHour = hour % 12 || 12
  const suffix = copy > 1 ? ` ${copy}` : ''
  return `Screenshot ${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} at ${clockHour}.${padDatePart(date.getMinutes())}.${padDatePart(date.getSeconds())} ${period}${suffix}.${extension}`
}

function imageExtension(file: File) {
  const fromName = file.name.match(/\.([a-z0-9]+)$/i)?.[1]
  if (fromName) return fromName.toLocaleLowerCase() === 'jpeg' ? 'jpg' : fromName.toLocaleLowerCase()
  const fromType = file.type.split('/')[1]
  return fromType === 'jpeg' ? 'jpg' : fromType || 'png'
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function imageTypeLabel(file: File) {
  const subtype = file.type.split('/')[1]?.toLocaleUpperCase()
  return `${subtype === 'JPEG' ? 'JPG' : subtype || 'Image'} image`
}

type PendingFile = { file: File; previewUrl: string }

function PendingFilePreview({ file, previewUrl, onRemove }: PendingFile & { onRemove: () => void }) {
  const [dimensions, setDimensions] = useState('')
  const [expanded, setExpanded] = useState(false)
  const isImage = file.type.startsWith('image/')

  function captureDimensions(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget
    if (image.naturalWidth && image.naturalHeight) setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`)
  }

  return <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
    <div className="flex min-w-0 items-center gap-3 p-2.5">
      {isImage && previewUrl
        ? <button type="button" aria-label={`Preview ${file.name}`} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="group relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={previewUrl} alt="" onLoad={captureDimensions} className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-foreground/0 text-background opacity-0 transition group-hover:bg-foreground/45 group-hover:opacity-100 group-focus-visible:bg-foreground/45 group-focus-visible:opacity-100"><Maximize2 className="size-5" /></span>
          </button>
        : <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-border bg-background"><FileText className="size-6 text-primary" /></span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" title={file.name}>{file.name}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{isImage ? imageTypeLabel(file) : file.type || 'File'}{dimensions ? ` · ${dimensions}` : ''} · {formatFileSize(file.size)}</p>
        {isImage && <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 min-h-11 text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{expanded ? 'Hide preview' : 'Preview image'}</button>}
      </div>
      <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove} className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button>
    </div>
    {isImage && expanded && previewUrl && <div className="border-t border-border bg-background/60 p-3"><img src={previewUrl} alt={`Preview of ${file.name}`} onLoad={captureDimensions} className="mx-auto max-h-72 max-w-full rounded-lg object-contain" /></div>}
  </div>
}

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
  const pendingFilesRef = useRef<PendingFile[]>([])
  const [open, setOpen] = useState(initialOpen)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [title, setTitle] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [sectionLabel, setSectionLabel] = useState('')
  const [text, setText] = useState('')
  const canSaveText = text.trim().length >= MIN_PASTED_EXCERPT_CHARACTERS
  const files = pendingFiles.map((item) => item.file)
  const canSave = pendingFiles.length > 0 || canSaveText

  useEffect(() => {
    pendingFilesRef.current = pendingFiles
  }, [pendingFiles])

  useEffect(() => () => {
    pendingFilesRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
  }, [])

  function clearPendingFiles() {
    pendingFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setPendingFiles([])
  }

  function addFiles(next: Iterable<File>, source: 'upload' | 'paste' = 'upload') {
    const additions = [...next]
    if (!additions.length) return
    setPendingFiles((current) => {
      const known = new Set(current.map(({ file }) => `${file.name}:${file.size}:${file.lastModified}`))
      const usedNames = new Set(current.map(({ file }) => file.name))
      const capturedAt = new Date()
      const prepared = additions.map((file) => {
        if (source !== 'paste' || !GENERIC_CLIPBOARD_IMAGE_NAME.test(file.name)) {
          usedNames.add(file.name)
          return file
        }
        const extension = imageExtension(file)
        let copy = 1
        let name = pastedScreenshotName(capturedAt, extension, copy)
        while (usedNames.has(name)) name = pastedScreenshotName(capturedAt, extension, ++copy)
        usedNames.add(name)
        return new File([file], name, { type: file.type, lastModified: capturedAt.getTime() + copy - 1 })
      })
      const unique = prepared.flatMap((file) => {
        const identity = `${file.name}:${file.size}:${file.lastModified}`
        if (known.has(identity)) return []
        known.add(identity)
        return [{ file, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '' }]
      })
      return [...current, ...unique]
    })
  }

  function pasteImage(event: ClipboardEvent<HTMLButtonElement>) {
    const images = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
    if (!images.length) return
    event.preventDefault()
    addFiles(images, 'paste')
  }

  async function save() {
    if (!canSave) return
    const center = useStore.getState().academics.classCenter
    const retained = await Promise.all(files.map(async (file) => {
      const id = uid()
      const blobRef = await retainLocalMaterial(file, id)
      try {
        const extracted = await extractDocumentText(file, { recoverScannedPdfPages: true })
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
        const pageSegments = extracted?.pages?.flatMap((page) => page.text.trim()
          ? parseTranscript(page.text).segments.map((segment) => ({ ...segment, pageNumber: page.pageNumber }))
          : []) ?? []
        const segments = pageSegments.length ? pageSegments : parsed?.segments ?? []
        const lowerName = file.name.toLocaleLowerCase()
        const materialType = /slide|deck/.test(lowerName) ? 'lecture-slides' as const
          : /lab/.test(lowerName) ? 'lab-handout' as const
            : /read|chapter|textbook/.test(lowerName) ? 'reading' as const
              : 'other' as const
        records.unshift({
        id, courseId, lectureId, title: file.name.replace(/\.[^.]+$/, '') || file.name,
        type: materialType, sourceType: 'upload', owner: 'mine', url: '', blobRef, fileName: file.name, mimeType: file.type,
        notes: '', linkedTopicIds,
        processingStatus: segments.length ? 'ready' : 'failed',
        processingError: segments.length ? undefined : extractionError || (extracted?.scanDetected ? 'On-device OCR could not recover readable text. Try a clearer scan or paste the relevant passage.' : 'No readable text was found. Try another file or paste the relevant passage.'),
        sourceCoverage: {
          pageCount: extracted?.pageCount,
          readablePages: extracted?.pages?.filter((page) => page.readable).map((page) => page.pageNumber),
          ocrRecoveredPages: extracted?.pages?.filter((page) => page.ocrRecovered).map((page) => page.pageNumber),
          unreadablePages: extracted?.pages?.filter((page) => !page.readable).map((page) => page.pageNumber),
          readableCharacterCount: extracted?.text.trim().length ?? 0,
          figureStatus: 'not-interpreted' as const,
        },
        createdAt: now, updatedAt: now, order: records.length,
        })
        if (segments.length) draft.academics.classCenter.sourceChunks.push(...segments.map((segment, index) => ({
          id: uid(), fileId: id, courseId, content: segment.text,
          characterStart: segment.start, characterEnd: segment.end,
          sourcePosition: { index, label: 'pageNumber' in segment ? `Page ${segment.pageNumber}${segment.label ? ` · ${segment.label}` : ''}` : segment.label },
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
    const recovered = retained.reduce((total, item) => total + (item.extracted?.ocrPageCount ?? 0), 0)
    toast({ title: count === 1 ? 'Material added' : `${count} materials added`, description: unreadable
      ? `${unreadable} ${unreadable === 1 ? 'file needs' : 'files need'} a clearer copy or pasted text.${recovered ? ` ${recovered} scanned ${recovered === 1 ? 'page was' : 'pages were'} recovered on this device.` : ''}`
      : `${lectureId ? 'Saved with this lecture' : 'Saved in Materials'} and indexed on this device.${recovered ? ` ${recovered} scanned ${recovered === 1 ? 'page was' : 'pages were'} recovered with on-device OCR.` : ''} Figures were not interpreted.` })
    setOpen(false); clearPendingFiles(); setTitle(''); setSourceLabel(''); setSectionLabel(''); setText('')
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="max-w-xl bg-card">
      <DialogHeader><DialogTitle>Add material</DialogTitle><DialogDescription>Choose files, paste a screenshot, or paste textbook text. Text and scanned pages are read on this device. File bytes stay local; only sources you later select for an AI output are copied to your private server workspace after disclosure.</DialogDescription></DialogHeader>
      <div className="grid gap-4">
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files ?? [], 'upload'); event.currentTarget.value = '' }} />
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-left hover:border-primary/55" onClick={() => inputRef.current?.click()}><FileUp className="size-5 text-primary" /><p className="mt-2 font-bold">Attach files</p><p className="mt-1 text-xs text-muted-foreground">PDFs, slides, notes, or images</p></button>
          <button type="button" onPaste={pasteImage} onClick={(event) => event.currentTarget.focus()} className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-left outline-none hover:border-primary/55 focus-visible:border-primary/55 focus-visible:ring-2 focus-visible:ring-ring"><ImagePlus className="size-5 text-primary" /><p className="mt-2 font-bold">Paste a screenshot</p><p className="mt-1 text-xs text-muted-foreground">Click here, then press ⌘/Ctrl + V</p></button>
        </div>
        {pendingFiles.length > 0 && <div className="grid gap-2" aria-label="Files ready to add">{pendingFiles.map(({ file, previewUrl }, index) => <PendingFilePreview key={`${file.name}-${file.size}-${file.lastModified}-${index}`} file={file} previewUrl={previewUrl} onRemove={() => setPendingFiles((current) => {
          const removed = current[index]
          if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
          return current.filter((_, candidate) => candidate !== index)
        })} />)}</div>}
        <div className="border-t border-border pt-4"><p className="font-semibold">Or paste textbook text</p><p className="mt-1 text-xs text-muted-foreground">Only the excerpt you paste becomes a study source.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="grid gap-1"><Label htmlFor="material-title">Material title <span className="text-muted-foreground">(optional)</span></Label><Input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter 4 reading" /></div><div className="grid gap-1"><Label htmlFor="material-section">Section <span className="text-muted-foreground">(optional)</span></Label><Input id="material-section" value={sectionLabel} onChange={(event) => setSectionLabel(event.target.value)} placeholder="4.2 Synaptic signaling" /></div></div><Textarea className="mt-3 min-h-36" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the specific textbook passage, notes, or reading excerpt…" /><p className="mt-1 text-xs font-semibold text-muted-foreground">{text.trim().length} / {MIN_PASTED_EXCERPT_CHARACTERS} characters for a text source</p></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void save()} disabled={!canSave}><ClipboardPaste className="size-4" /> Add material</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
