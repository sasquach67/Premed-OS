import { useState } from 'react'
import { AlertTriangle, ArrowLeft, FileText, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnimatedFileUpload } from '@/components/motion'
import { cn } from '@/lib/utils'
import { extractSyllabusFiles, parseSyllabusText, type SyllabusProposal } from '@/lib/academics/syllabusParser'

type Props = {
  open: boolean
  semester: string
  onOpenChange: (open: boolean) => void
  onParsed: (proposal: SyllabusProposal, files: File[]) => void
  onManual: () => void
}

/**
 * Cold-start syllabus intake. This is intentionally a small first surface:
 * the student supplies evidence here, then the existing class-details sheet
 * becomes the place where identity, type, and logistics are reviewed before
 * the class is written. Scoped imports continue using SyllabusImportMode.
 */
export function SyllabusImportDialog({ open, semester, onOpenChange, onParsed, onManual }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [pastedText, setPastedText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsingMessage, setParsingMessage] = useState('Reading syllabus…')
  const [error, setError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<SyllabusProposal | null>(null)

  function resetDraft() {
    setFiles([])
    setPastedText('')
    setParsing(false)
    setParsingMessage('Reading syllabus…')
    setError(null)
    setDiagnosis(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetDraft()
    onOpenChange(nextOpen)
  }

  async function readSyllabus() {
    setError(null)
    setDiagnosis(null)
    setParsing(true)
    try {
      const proposal = pastedText.trim()
        ? parseSyllabusText(pastedText, 'Pasted syllabus')
        : await extractSyllabusFiles(files, { onProgress: (progress) => setParsingMessage(progress.message) })
      if (proposal.documentKind === 'unrecognized' || proposal.scanDetected) {
        setDiagnosis(proposal)
        return
      }
      const selectedFiles = files
      resetDraft()
      onParsed(proposal, selectedFiles)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This file could not be read.')
    } finally {
      setParsing(false)
      setParsingMessage('Reading syllabus…')
    }
  }

  function continueWithProposal() {
    if (!diagnosis) return
    const selectedFiles = files
    const reviewedDiagnosis = diagnosis
    resetDraft()
    onParsed(reviewedDiagnosis, selectedFiles)
  }

  const hasSource = files.length > 0 || pastedText.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto !rounded-2xl !border-border !bg-card !shadow-[0_22px_55px_-27px_rgba(0,0,0,0.8)] ![backdrop-filter:none]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">Add class · {semester}</p>
              <DialogTitle>{diagnosis ? 'Check this source' : 'Import a syllabus'}</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl">
                {diagnosis
                  ? 'This file was read, but it does not contain the course structure needed to create a class.'
                  : 'Start with the syllabus. After it is read, you’ll review the class details before anything is saved.'}
              </DialogDescription>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
              Nothing saved
            </span>
          </div>
        </DialogHeader>

        {diagnosis ? (
          <section className="rounded-xl border border-warning/40 bg-warning/8 p-4" aria-live="polite">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold">
                  {diagnosis.scanDetected ? 'I couldn’t read this file yet' : 'This looks like course material, not a syllabus'}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
                  {diagnosis.scanDetected
                    ? 'Try a clearer PDF or paste the syllabus text. You can still continue to the class-details sheet and fill it in manually.'
                    : 'Nothing will be created from this source automatically. You can review it as a syllabus anyway, or choose a different file.'}
                </p>
                {!diagnosis.scanDetected && (
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    Nothing to apply · Choose a class first is only relevant to a scoped Materials import.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={continueWithProposal}><FileText className="size-4" /> Review class details anyway</Button>
              <Button variant="outline" onClick={() => { setDiagnosis(null); setError(null) }}><ArrowLeft className="size-4" /> Try another file</Button>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            <AnimatedFileUpload
              accept=".pdf,.docx,.txt,text/plain"
              multiple
              onFiles={(next) => { setFiles(next); setError(null) }}
              label="Drop a syllabus or course schedule here"
              description="Text-based PDF, DOCX, or TXT. The source file stays on this device."
            />
            <div className="rounded-xl border border-border bg-muted/45 p-4">
              <p className="font-display text-sm font-extrabold">Or paste the text instead</p>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Copying from Canvas works just as well.</p>
              <Textarea
                className="mt-2 min-h-28"
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                placeholder="Paste syllabus text from Canvas…"
              />
            </div>
            {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold" role="alert">{error} Try a different file or paste the text instead.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground">Reading happens on this device. Reviewed records can sync after you save if cloud sync is enabled.</p>
              <Button disabled={!hasSource || parsing} onClick={readSyllabus}>
                <Upload className={cn('size-4', parsing && 'animate-pulse')} />
                {parsing ? parsingMessage : 'Read syllabus'}
              </Button>
            </div>
          </div>
        )}

        {/* Ruled 2026-08-27 (Andy) — academics-syllabus-import.md, "Action
            hierarchy". `Read syllabus` is primary on the action line above.
            Here `Enter details manually` is the LARGER left secondary, because
            a student without a readable file must not feel pushed out of the
            flow, and `Cancel` is the smaller quiet button on the right. These
            emphases were previously inverted.
            `outline`, not `secondary`: the mockup fills this button with
            var(--muted), but the app's `secondary` token is blue-tinted in the
            paper theme (#e6f2fb), which would put an off-palette hue on a
            neutral control. Outline keeps the size and position the rule asks
            for without inventing a colour. */}
        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => { resetDraft(); onManual() }}>Enter details manually</Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
