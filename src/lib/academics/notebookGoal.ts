import type { LectureRecord, NotebookGoal } from '@/lib/types'

const LEGACY_GOAL_REQUESTS: Readonly<Record<string, NotebookGoal>> = {
  'Help me prepare for an assessment using my class materials.': 'assessment',
  'Prepare for my exam using the selected review sheet and course materials.': 'assessment',
  'Help me work through an assignment using its instructions and my class materials.': 'assignment',
}

type GoalEntry = Pick<LectureRecord, 'notebookGoal' | 'notebookRequest' | 'studyIntent'>

/** Resolve old drafts at read time without changing saved content or guessing a subject.
 * Unknown custom requests keep the review default and remain available as instructions. */
export function inferNotebookGoal(entry?: GoalEntry): NotebookGoal {
  if (entry?.notebookGoal) return entry.notebookGoal
  if (entry?.studyIntent?.purpose === 'exam-prep' || entry?.studyIntent?.entryKind === 'exam-prep') return 'assessment'
  const request = entry?.notebookRequest ?? entry?.studyIntent?.instructions ?? ''
  return Object.hasOwn(LEGACY_GOAL_REQUESTS, request) ? LEGACY_GOAL_REQUESTS[request] : 'review'
}

/** Only old, exact preset text moves into the goal selector. Once a goal has been
 * saved explicitly, every character in the student's instruction field is theirs. */
export function initialNotebookInstructions(entry?: GoalEntry): string {
  const request = entry?.notebookRequest ?? entry?.studyIntent?.instructions ?? ''
  if (entry?.notebookGoal === undefined && Object.hasOwn(LEGACY_GOAL_REQUESTS, request)) return ''
  return request
}
