import { BookOpen, GraduationCap, Presentation } from 'lucide-react'
import type { JournalStudyIntent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

export function JournalIntentFields({ value, onChange }: {
  value: JournalStudyIntent
  onChange: (value: JournalStudyIntent) => void
}) {
  const kind = value.entryKind ?? (value.purpose === 'exam-prep' ? 'exam-prep' : 'lecture')
  return <div className="space-y-4">
    <fieldset>
      <legend className="font-display text-lg font-extrabold">What are you adding?</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {([
          ['lecture', 'Lecture', 'Capture what your professor taught with a transcript, slides, or notes.', Presentation],
          ['readings', 'Readings', 'Work through assigned chapters, articles, and reading questions.', BookOpen],
          ['exam-prep', 'Exam prep', 'Bring a review sheet and the course material you want to revisit.', GraduationCap],
        ] as const).map(([entryKind, title, description, Icon]) => <label key={entryKind} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-ring', kind === entryKind ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30')}>
          <input className="mt-1 accent-primary" type="radio" name="journal-purpose" value={entryKind} checked={kind === entryKind} onChange={() => onChange({ ...value, entryKind, purpose: entryKind === 'exam-prep' ? 'exam-prep' : 'study', reviewSheetFileId: entryKind === 'exam-prep' ? value.reviewSheetFileId : undefined })} />
          <span><Icon className="mb-3 size-5 text-primary" aria-hidden="true"/><b className="block text-sm">{title}</b><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
        </label>)}
      </div>
    </fieldset>
    <label className="block text-sm font-bold">Anything you want to focus on? <span className="font-normal text-muted-foreground">Optional</span>
      <Textarea className="mt-2 min-h-20" maxLength={2000} value={value.instructions ?? ''} onChange={event => onChange({ ...value, instructions: event.target.value })} placeholder={value.purpose === 'exam-prep' ? 'Explain each review-sheet topic and connect it to the assigned readings. Help me prepare for short answers.' : kind === 'readings' ? 'Explain the main ideas and connect them to the assigned reading questions.' : 'Explain the steps I found confusing and keep the examples my professor emphasized.'} />
    </label>
  </div>
}
