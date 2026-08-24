import type { AssignedReading, FeedbackNote, ReadingListState } from '@/lib/types'

export const READING_LIST_STATE_COPY: Record<ReadingListState, string> = {
  unknown: 'No full reading list recorded.',
  partial: 'You’re adding the list as you go.',
  complete: 'Your full reading list is recorded.',
  'not-applicable': 'This class has no assigned readings.',
}

export function normalizeFeedbackTheme(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

export type FeedbackTheme = {
  key: string
  label: string
  notes: FeedbackNote[]
  paperIds: string[]
}

/** Raw feedback is always retained; only repeated exact student labels become
 * an aggregate theme. We intentionally do not use semantic/AI matching here. */
export function recurringFeedbackThemes(notes: FeedbackNote[]): FeedbackTheme[] {
  const grouped = new Map<string, FeedbackTheme>()
  for (const note of notes) {
    const key = normalizeFeedbackTheme(note.theme)
    if (!key) continue
    const group = grouped.get(key) ?? { key, label: note.theme.trim(), notes: [], paperIds: [] }
    group.notes.push(note)
    if (note.assignmentId && !group.paperIds.includes(note.assignmentId)) group.paperIds.push(note.assignmentId)
    grouped.set(key, group)
  }
  return [...grouped.values()].filter((group) => group.notes.length >= 2)
}

export function readingDebt(readings: AssignedReading[], state: ReadingListState | undefined, today: string) {
  if (state !== 'complete') return 0
  return readings.filter((item) => item.status === 'not-started' && Boolean(item.dueForDiscussion) && item.dueForDiscussion! < today).length
}

export function nextIncompleteReading(readings: AssignedReading[]) {
  return readings.find((item) => item.status !== 'read')
}
