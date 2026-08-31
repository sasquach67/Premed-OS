import {
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  FileText,
  FileUp,
  Mic2,
  NotebookPen,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const GOODNOTES_TRANSCRIPTION_GUIDE = 'https://support.goodnotes.com/hc/en-us/articles/10234247292303-Audio-Transcription-FAQs'
const APPLE_VOICE_MEMOS_GUIDE = 'https://support.apple.com/en-ie/guide/iphone/iph00953a982/ios'
const APPLE_UNIVERSAL_CLIPBOARD_GUIDE = 'https://support.apple.com/en-ie/102430'

export function LectureCaptureGuide({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto bg-card p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border bg-[linear-gradient(135deg,hsl(var(--primary)/0.13),transparent_58%)] px-5 pb-5 pt-6 text-left sm:px-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">First lecture setup</p>
          <DialogTitle className="mt-1 text-2xl sm:text-3xl">Record once. Bring the transcript here.</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm font-semibold leading-relaxed">
            Premed OS does not listen to or record your class. Use a recording or transcription app you trust, then paste or import its transcript into the numbered lecture record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          <section className="flex items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="font-display font-extrabold">Ask before you record.</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
                Follow your instructor&apos;s, school&apos;s, and classmates&apos; rules. If recording is not allowed, take notes and add a typed lecture summary instead.
              </p>
            </div>
          </section>

          <section aria-labelledby="capture-setup-heading">
            <div className="flex items-center gap-3">
              <StepNumber>1</StepNumber>
              <div>
                <h3 id="capture-setup-heading" className="font-display text-lg font-extrabold">Choose a capture setup</h3>
                <p className="text-sm font-semibold text-muted-foreground">You only need one tool that can give you transcript text.</p>
              </div>
            </div>
            <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-muted/20">
              <CaptureOption
                icon={NotebookPen}
                title="Goodnotes"
                description="Useful if you already take handwritten notes there. Record while writing, then review its transcript on supported devices."
                href={GOODNOTES_TRANSCRIPTION_GUIDE}
                linkLabel="Goodnotes transcription guide"
              />
              <CaptureOption
                icon={Mic2}
                title="iPhone Voice Memos"
                description="A built-in option on supported iPhones. Record the lecture, open the transcript, then copy all or part of the text."
                href={APPLE_VOICE_MEMOS_GUIDE}
                linkLabel="Apple transcription guide"
              />
              <CaptureOption
                icon={FileText}
                title="Another approved transcriber"
                description="Your school tool or another app is fine. Premed OS only needs copied text or an exported PDF, DOCX, TXT, or Markdown file."
              />
            </div>
          </section>

          <section aria-labelledby="during-class-heading">
            <div className="flex items-center gap-3">
              <StepNumber>2</StepNumber>
              <div>
                <h3 id="during-class-heading" className="font-display text-lg font-extrabold">During class</h3>
                <p className="text-sm font-semibold text-muted-foreground">Keep the record easy to recognize later.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <GuidePoint title="One lecture, one recording" detail="Start a new recording for each class meeting." />
              <GuidePoint title="Name it right away" detail="Use the course, lecture number, or class date." />
              <GuidePoint title="Take notes normally" detail="Your transcript and notes can be attached together later." />
            </div>
          </section>

          <section aria-labelledby="move-transcript-heading">
            <div className="flex items-center gap-3">
              <StepNumber>3</StepNumber>
              <div>
                <h3 id="move-transcript-heading" className="font-display text-lg font-extrabold">Move the transcript into Premed OS</h3>
                <p className="text-sm font-semibold text-muted-foreground">Choose the shortest handoff for your devices.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-primary/30 bg-primary/8 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Smartphone className="size-4" />
                  <ArrowRight className="size-4" />
                  <ClipboardPaste className="size-4" />
                  <p className="font-display font-extrabold">iPhone or iPad → Mac</p>
                </div>
                <ol className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
                  <li><b className="text-foreground">1.</b> Select and copy the transcript on your Apple device.</li>
                  <li><b className="text-foreground">2.</b> Open the lecture in Premed OS on your Mac.</li>
                  <li><b className="text-foreground">3.</b> Paste, then choose <span className="text-foreground">Add pasted transcript</span>.</li>
                </ol>
                <a className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-primary underline-offset-4 hover:underline" href={APPLE_UNIVERSAL_CLIPBOARD_GUIDE} target="_blank" rel="noreferrer">
                  Set up Universal Clipboard <ExternalLink className="size-3" />
                </a>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">Both devices must be nearby, signed into the same Apple Account, with Wi-Fi, Bluetooth, and Handoff on.</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/25 p-4">
                <div className="flex items-center gap-2">
                  <FileUp className="size-4 text-primary" />
                  <p className="font-display font-extrabold">Any device → file import</p>
                </div>
                <ol className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
                  <li><b className="text-foreground">1.</b> Export the transcript from your app.</li>
                  <li><b className="text-foreground">2.</b> In the lecture, choose <span className="text-foreground">Import transcript file</span>.</li>
                  <li><b className="text-foreground">3.</b> Select a PDF, DOCX, TXT, or Markdown file.</li>
                </ol>
              </div>
            </div>
          </section>

          <section aria-labelledby="finish-lecture-heading">
            <div className="flex items-center gap-3">
              <StepNumber>4</StepNumber>
              <div>
                <h3 id="finish-lecture-heading" className="font-display text-lg font-extrabold">Finish the lecture record</h3>
                <p className="text-sm font-semibold text-muted-foreground">The transcript comes first; everything else is optional.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" /> Transcript saved</span>
                <span className="inline-flex items-center gap-2"><span className="size-4 rounded-full border-2 border-muted-foreground/45" /> Add slides, screenshots, notes, or excerpts</span>
                <span className="inline-flex items-center gap-2"><span className="size-4 rounded-full border-2 border-muted-foreground/45" /> Create selected-source study resources</span>
              </div>
            </div>
          </section>

          <div className="flex justify-end border-t border-border pt-4">
            <Button className="font-display font-extrabold" onClick={() => onOpenChange(false)}>Got it</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary font-display text-sm font-extrabold text-primary-foreground shadow-sm">{children}</span>
}

function CaptureOption({
  icon: Icon,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: typeof Mic2
  title: string
  description: string
  href?: string
  linkLabel?: string
}) {
  return (
    <article className="grid gap-3 p-4 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="size-4" /></span>
      <div>
        <h4 className="font-display font-extrabold">{title}</h4>
        <p className="mt-0.5 text-sm font-semibold leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {href && linkLabel && (
        <Button asChild size="sm" variant="outline" className="w-fit">
          <a href={href} target="_blank" rel="noreferrer">{linkLabel}<ExternalLink className="size-3.5" /></a>
        </Button>
      )}
    </article>
  )
}

function GuidePoint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-l-2 border-primary/45 py-1 pl-3">
      <p className="font-display text-sm font-extrabold">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}
