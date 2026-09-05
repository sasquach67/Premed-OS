import type { JournalStudyIntent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

export function JournalIntentFields({ value, onChange }: {
  value: JournalStudyIntent
  onChange: (value: JournalStudyIntent) => void
}) {
  return <div className="space-y-4">
    <fieldset>
      <legend className="font-display text-lg font-extrabold">What do you want to create?</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {([
          ['study', 'Understand material', 'Connect ideas from readings, notes, discussions, or a lecture.'],
          ['exam-prep', 'Prepare for an exam', 'Build around a review sheet, course examples, and questions.'],
        ] as const).map(([purpose, title, description]) => <label key={purpose} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-ring', value.purpose === purpose ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30')}>
          <input className="mt-1 accent-primary" type="radio" name="journal-purpose" value={purpose} checked={value.purpose === purpose} onChange={() => onChange({ ...value, purpose, reviewSheetFileId: purpose === 'exam-prep' ? value.reviewSheetFileId : undefined })} />
          <span><b className="block text-sm">{title}</b><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
        </label>)}
      </div>
    </fieldset>
    <label className="block text-sm font-bold">Anything you want to focus on? <span className="font-normal text-muted-foreground">Optional</span>
      <Textarea className="mt-2 min-h-20" maxLength={2000} value={value.instructions ?? ''} onChange={event => onChange({ ...value, instructions: event.target.value })} placeholder={value.purpose === 'exam-prep' ? 'Explain each review-sheet topic and connect it to the assigned readings. Help me prepare for short answers.' : 'Help me compare the authors’ arguments, with examples from the readings.'} />
    </label>
  </div>
}
