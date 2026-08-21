import { useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { buildPastedExcerpt, MIN_PASTED_EXCERPT_CHARACTERS } from '@/lib/academics/pastedExcerpt'
import { useStore } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** A bounded source intake, deliberately nested inside Materials—not a route. */
export function PastedExcerptDialog({ courseId, triggerClassName }: { courseId: string; triggerClassName?: string }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [sectionLabel, setSectionLabel] = useState('')
  const [text, setText] = useState('')
  const enoughText = text.trim().length >= MIN_PASTED_EXCERPT_CHARACTERS

  function save() {
    const center = useStore.getState().academics.classCenter
    const built = buildPastedExcerpt({
      courseId,
      text,
      title,
      sourceLabel,
      sectionLabel,
      order: center.files.filter((file) => file.courseId === courseId).length,
    })
    if (!built) {
      toast({
        title: 'Add a little more of the section',
        description: `Paste at least ${MIN_PASTED_EXCERPT_CHARACTERS} characters so this can support a source-linked output. Your text is still here.`,
        tone: 'error',
      })
      return
    }
    useStore.getState().update((draft) => {
      draft.academics.classCenter.files.push(built.file)
      draft.academics.classCenter.sourceChunks.push(...built.chunks)
    })
    toast({ title: 'Pasted excerpt added', description: 'Filed in Materials as your source. It is used only when you select it.' })
    setOpen(false)
    setTitle('')
    setSourceLabel('')
    setSectionLabel('')
    setText('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" className={triggerClassName} onClick={() => setOpen(true)}>
        <ClipboardPaste className="size-4" /> Paste excerpt
      </Button>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Paste a bounded excerpt</DialogTitle>
          <DialogDescription>
            Add one section you have access to. Premed OS keeps the exact text you paste as your source; it does not search or upload a whole textbook.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="excerpt-title">Material title</Label><Input id="excerpt-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reading 3 — synaptic transmission" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="excerpt-source">Source label <span className="text-muted-foreground">(optional)</span></Label><Input id="excerpt-source" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Textbook or course pack" /></div>
            <div className="grid gap-1.5"><Label htmlFor="excerpt-section">Section <span className="text-muted-foreground">(optional)</span></Label><Input id="excerpt-section" value={sectionLabel} onChange={(event) => setSectionLabel(event.target.value)} placeholder="Chapter 4.2" /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="excerpt-text">Section or excerpt</Label><Textarea id="excerpt-text" rows={9} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the specific passage you want to use…" /><p className="text-xs font-semibold text-muted-foreground">{text.trim().length} / {MIN_PASTED_EXCERPT_CHARACTERS} characters · only this text can be selected for study outputs.</p></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={save} disabled={!enoughText}>Add excerpt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
