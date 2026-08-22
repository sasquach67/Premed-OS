/**
 * Lecture transcript import (§4.1-Q) — the paste surface.
 *
 * Brief: implementation/briefs/T1-academics-build-10.md.
 *
 * GoodNotes records and transcribes on the iPad; Universal Clipboard carries
 * the text to the Mac; this pastes it in. **No audio ever reaches Premed OS**,
 * which is why there is no recorder, no provider, and no consent flow here.
 *
 * ⚠️ The timestamp disclosure is not decoration. A transcript with no time
 * anchors is still worth importing, but the student must know before saving
 * that quoted moments will not carry a time — that is precisely what they lose.
 */
import { useMemo, useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function TranscriptImport({ courseId, triggerClassName }: { courseId: string; triggerClassName?: string }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const preview = useMemo(() => (text.trim() ? parseTranscript(text) : undefined), [text])

  function save() {
    const built = buildTranscriptImport({
      courseId,
      title,
      text,
      order: useStore.getState().academics.classCenter.files.filter((file) => file.courseId === courseId).length,
    })
    if (!built) {
      toast({ title: 'Nothing to import', description: 'Paste the transcript text first.' })
      return
    }
    useStore.getState().update((draft) => {
      draft.academics.classCenter.files.push(built.file)
      draft.academics.classCenter.sourceChunks.push(...built.chunks)
    })
    toast({
      title: 'Transcript imported',
      description: built.hasTimestamps
        ? `${built.chunks.length} timestamped segments filed under Materials.`
        : `${built.chunks.length} segments filed under Materials, without time anchors.`,
    })
    setTitle('')
    setText('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className={triggerClassName} onClick={() => setOpen(true)}>
        <ClipboardPaste className="size-4" /> Paste lecture transcript
      </Button>
      <DialogContent className="bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Paste a lecture transcript</DialogTitle>
          <DialogDescription>
            Record and transcribe in GoodNotes, use Copy All on its transcript, then paste here. Audio stays on your device; Premed OS stores only the text you provide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lecture 18 — enolate chemistry" />
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={'22:14 If you only take one thing from this unit…\n31:08 These mechanisms look alike until the leaving group changes.'} rows={9} className="w-full rounded-xl border border-border bg-muted p-3 text-sm font-semibold outline-none focus-visible:border-[var(--cat-gpa)]" />
          {preview && <div className={cn('rounded-xl border p-3 text-[11.5px] font-bold', preview.hasTimestamps ? 'border-[color-mix(in_srgb,var(--cat-gpa)_38%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_8%,transparent)]' : 'border-dashed border-amber-500/45 bg-amber-500/5')}><b className="font-display">{preview.segments.length} {preview.segments.length === 1 ? 'segment' : 'segments'} detected</b><p className="mt-0.5 text-muted-foreground">{preview.hasTimestamps ? 'Timestamps found — each segment keeps the time it came from, so a quoted moment can point back at it.' : 'No timestamps found. This still imports and stays searchable, but quoted moments will carry no time.'}</p></div>}
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => { setOpen(false); setText(''); setTitle('') }}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={!preview?.segments.length}>Import transcript</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
