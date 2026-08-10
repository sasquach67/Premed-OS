import { useState, type FormEvent } from 'react'
import { HelpCircle, Mail, MessageSquareText } from 'lucide-react'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const SUPPORT_EMAIL = 'elephon08@gmail.com'

export function HelpFeedbackLauncher() {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const toast = useToast()

  function send(event: FormEvent) {
    event.preventDefault()
    const body = feedback.trim()
    if (!body) return
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Premed OS feedback')}&body=${encodeURIComponent(body)}`
    toast({ title: 'Feedback email opened', description: `Addressed to ${SUPPORT_EMAIL}.`, tone: 'success' })
    setOpen(false)
    setFeedback('')
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 grid size-10 place-items-center rounded-full border border-border bg-card text-sm font-extrabold shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Help and feedback" title="Help and feedback (?)">?</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HelpCircle className="size-5 text-primary" /> Help & feedback</DialogTitle>
            <DialogDescription>Tell us what feels confusing, broken, or worth improving.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild><a href="#/help"><MessageSquareText className="size-4" /> Open help</a></Button>
            <Button variant="outline" asChild><a href={`mailto:${SUPPORT_EMAIL}`}><Mail className="size-4" /> Email support</a></Button>
          </div>
          <form onSubmit={send} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="shell-feedback">Feedback</Label>
              <Textarea id="shell-feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="What happened, and what would have helped?" className="min-h-28" />
            </div>
            <p className="text-xs text-muted-foreground">Send opens your email app, addressed to {SUPPORT_EMAIL}.</p>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!feedback.trim()}>Send</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
