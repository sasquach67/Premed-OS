import type {
  AcademicFile, AcademicMistake, ClassAssignment, ClassCenterData, ClassNote, Course,
  FeedbackNote, ReviewEvent, SourceChunk, TermReportBlock, TermReportEvidenceItem,
  TermReport, TermReportSnapshot, Topic,
} from '@/lib/types'

export interface TermReportEvidenceInput {
  courses: Course[]
  center: Pick<ClassCenterData, 'assignments' | 'feedbackNotes' | 'mistakes' | 'notes' | 'reviewEvents' | 'topics' | 'files' | 'sourceChunks'>
  term: string
  /** Optional source review: only checked files become material evidence. */
  selectedFileIds?: string[]
  now?: number
}

export type TermReportEvidenceResult =
  | { eligible: true; snapshot: TermReportSnapshot; localBlocks: TermReportBlock[] }
  | { eligible: false; snapshot: TermReportSnapshot; reason: string; localBlocks: TermReportBlock[] }

const LIMIT = 'This report reads only the records you saved for this term. It cannot tell how much you studied, why a grade changed, or whether a method caused an outcome.'

function fact(
  id: string,
  course: Course,
  category: TermReportEvidenceItem['category'],
  kind: TermReportEvidenceItem['ref']['kind'],
  label: string,
  detail: string,
): TermReportEvidenceItem {
  return {
    id,
    category,
    ref: { kind, id, courseId: course.id, label },
    label,
    detail,
  }
}

function courseFor(id: string, courses: Course[]) {
  return courses.find((course) => course.id === id)
}

/**
 * Builds the closed local evidence set before any provider call. It deliberately
 * ignores files and raw material: having an upload is not evidence that the
 * student used a study method. Material becomes eligible only after the student
 * explicitly selects a source in the report's source review.
 */
export function termReportEvidence(input: TermReportEvidenceInput): TermReportEvidenceResult {
  const { courses, center, term, now = Date.now() } = input
  const includedCourses = courses.filter((course) => course.term === term && course.status === 'completed')
  const courseIds = includedCourses.map((course) => course.id)
  const included = new Set(courseIds)
  const facts: TermReportEvidenceItem[] = []

  for (const course of includedCourses) {
    if (course.grade) {
      facts.push(fact(`course:${course.id}`, course, 'course', 'course', `${course.code} final grade`, `You recorded ${course.grade} for ${course.title}.`))
    }
  }

  const assignments = center.assignments.filter((assignment) => included.has(assignment.courseId) && hasReturnedScore(assignment))
  for (const assignment of assignments) {
    const course = courseFor(assignment.courseId, includedCourses)
    if (!course) continue
    facts.push(fact(
      `assignment:${assignment.id}`,
      course,
      'returned-work',
      'assignment',
      `${course.code} · ${assignment.title}`,
      `Returned work recorded: ${assignment.pointsEarned} of ${assignment.pointsPossible} points.`,
    ))
  }

  const topicsById = new Map(center.topics.filter((topic) => included.has(topic.courseId)).map((topic) => [topic.id, topic]))
  appendReviewFacts(facts, center.reviewEvents, topicsById, includedCourses)
  appendMistakeFacts(facts, center.mistakes, includedCourses)
  appendNoteFacts(facts, center.notes, includedCourses)
  appendFeedbackFacts(facts, center.feedbackNotes, includedCourses)
  appendSelectedMaterialFacts(facts, center.files, center.sourceChunks, includedCourses, new Set(input.selectedFileIds ?? []))

  const snapshot: TermReportSnapshot = {
    term,
    courseIds,
    facts,
    compiledAt: now,
    evidenceLimit: LIMIT,
  }
  const supportFacts = facts.filter((item) => item.category !== 'course')
  const gradeFacts = facts.filter((item) => item.category === 'course')
  const localBlocks = localFactBlocks(snapshot)

  if (!courseIds.length) {
    return {
      eligible: false,
      snapshot,
      localBlocks,
      reason: 'No completed courses are recorded for this term yet.',
    }
  }
  if (!gradeFacts.length && !supportFacts.length) {
    return {
      eligible: false,
      snapshot,
      localBlocks,
      reason: 'You have completed courses, but no final grade, returned work, review, marked mistake, class note, or feedback record to read with them yet.',
    }
  }
  if (!supportFacts.length) {
    return {
      eligible: false,
      snapshot,
      localBlocks,
      reason: 'Final grades alone are not enough to describe what happened during the term. Add returned work, a review, a marked mistake, a class note, or feedback when you have it.',
    }
  }
  return { eligible: true, snapshot, localBlocks }
}

function appendSelectedMaterialFacts(
  facts: TermReportEvidenceItem[],
  files: AcademicFile[],
  chunks: SourceChunk[],
  courses: Course[],
  selectedFileIds: Set<string>,
) {
  if (!selectedFileIds.size) return
  const filesById = new Map(files.filter((file) => selectedFileIds.has(file.id)).map((file) => [file.id, file]))
  // Every selected span is retained; the edge function applies its 64KB request
  // guard rather than silently truncating a source and pretending it was whole.
  for (const chunk of chunks.filter((item) => filesById.has(item.fileId))) {
    const file = filesById.get(chunk.fileId)
    const course = courseFor(chunk.courseId, courses)
    if (!file || !course || !chunk.content.trim()) continue
    facts.push({
      id: `material:${chunk.id}`,
      category: 'selected-material',
      ref: {
        kind: 'material', id: file.id, courseId: course.id, label: file.title,
        fileId: file.id, chunkId: chunk.id, start: chunk.characterStart ?? 0,
        end: chunk.characterEnd ?? chunk.content.length,
      },
      label: `${course.code} · ${file.title}`,
      detail: 'Selected source excerpt.',
      sourceText: chunk.content,
    })
  }
}

function hasReturnedScore(assignment: ClassAssignment) {
  return Number.isFinite(assignment.pointsEarned) && Number.isFinite(assignment.pointsPossible)
    && (assignment.pointsPossible ?? 0) > 0
}

function appendReviewFacts(
  facts: TermReportEvidenceItem[],
  reviews: ReviewEvent[],
  topicsById: Map<string, Topic>,
  courses: Course[],
) {
  const byCourse = new Map<string, ReviewEvent[]>()
  for (const review of reviews) {
    const topic = topicsById.get(review.topicId)
    if (!topic) continue
    byCourse.set(topic.courseId, [...(byCourse.get(topic.courseId) ?? []), review])
  }
  for (const [courseId, rows] of byCourse) {
    const course = courseFor(courseId, courses)
    if (!course) continue
    facts.push(fact(
      `review-event:${courseId}`,
      course,
      'study-record',
      'review-event',
      `${course.code} review history`,
      `${rows.length} saved review ${rows.length === 1 ? 'event' : 'events'} across ${new Set(rows.map((row) => topicsById.get(row.topicId)?.id)).size} topic${new Set(rows.map((row) => topicsById.get(row.topicId)?.id)).size === 1 ? '' : 's'}.`,
    ))
  }
}

function appendMistakeFacts(facts: TermReportEvidenceItem[], mistakes: AcademicMistake[], courses: Course[]) {
  const grouped = new Map<string, AcademicMistake[]>()
  for (const mistake of mistakes) {
    if (!courseFor(mistake.courseId, courses)) continue
    grouped.set(mistake.courseId, [...(grouped.get(mistake.courseId) ?? []), mistake])
  }
  for (const [courseId, rows] of grouped) {
    const course = courseFor(courseId, courses)
    if (!course) continue
    const causes = rows.flatMap((row) => row.cause ? [humanCause(row.cause)] : [])
    const causeText = causes.length ? ` Marked causes: ${Array.from(new Set(causes)).join(', ')}.` : ''
    facts.push(fact(
      `mistake:${courseId}`,
      course,
      'study-record',
      'mistake',
      `${course.code} marked trouble spots`,
      `${rows.length} saved ${rows.length === 1 ? 'trouble spot' : 'trouble spots'} from returned work.${causeText}`,
    ))
  }
}

function appendNoteFacts(facts: TermReportEvidenceItem[], notes: ClassNote[], courses: Course[]) {
  for (const note of notes) {
    const course = courseFor(note.courseId, courses)
    if (!course || !note.content.trim() || (note.type !== 'exam-review' && note.kind !== 'about-class')) continue
    facts.push(fact(
      `note:${note.id}`,
      course,
      'class-note',
      'note',
      `${course.code} · ${note.title}`,
      note.type === 'exam-review' ? 'Saved as an exam-review note.' : 'Saved as a class note.',
    ))
  }
}

function appendFeedbackFacts(facts: TermReportEvidenceItem[], feedback: FeedbackNote[], courses: Course[]) {
  for (const note of feedback) {
    const course = courseFor(note.courseId, courses)
    if (!course || !note.theme.trim()) continue
    facts.push(fact(
      `feedback:${note.id}`,
      course,
      'feedback',
      'feedback',
      `${course.code} feedback · ${note.theme}`,
      note.quote?.trim() ? 'Saved instructor feedback with a student-kept quote.' : 'Saved instructor feedback theme.',
    ))
  }
}

function humanCause(cause: NonNullable<AcademicMistake['cause']>) {
  return ({
    'didnt-know': 'did not know it',
    'knew-it-but-blanked': 'knew it, but blanked',
    'misread-the-question': 'misread the question',
    arithmetic: 'arithmetic',
    'ran-out-of-time': 'ran out of time',
    'wrong-method': 'used the wrong method',
  } as const)[cause]
}

/** Facts are readable even when a provider is unavailable. They intentionally
 * make no study advice or causal conclusion. */
export function localFactBlocks(snapshot: TermReportSnapshot): TermReportBlock[] {
  const courseFacts = snapshot.facts.filter((fact) => fact.category === 'course')
  const supportFacts = snapshot.facts.filter((fact) => fact.category !== 'course')
  return [
    ...(courseFacts.length ? [{
      id: 'local-final-grades', kind: 'fact' as const, title: 'Final grades recorded',
      text: courseFacts.map((item) => item.detail).join(' '),
      evidenceIds: courseFacts.map((item) => item.id), source: 'deterministic' as const,
    }] : []),
    ...(supportFacts.length ? [{
      id: 'local-term-record', kind: 'fact' as const, title: 'Your saved term record',
      text: supportFacts.map((item) => item.detail).join(' '),
      evidenceIds: supportFacts.map((item) => item.id), source: 'deterministic' as const,
    }] : []),
    {
      id: 'local-limit', kind: 'limit', title: 'What this can say',
      text: snapshot.evidenceLimit, evidenceIds: [], source: 'deterministic',
    },
  ]
}

/** Creates a new report revision from the current records. It intentionally
 * stores the compiler's snapshot rather than a live selector, so reopening the
 * report later cannot silently rewrite what it said at the end of the term. */
export function createTermReport({
  id,
  input,
  order,
}: {
  id: string
  input: TermReportEvidenceInput
  order: number
}): TermReport {
  const result = termReportEvidence(input)
  return {
    id,
    term: input.term,
    courseIds: result.snapshot.courseIds,
    status: result.eligible ? 'draft' : 'insufficient-evidence',
    snapshot: result.snapshot,
    blocks: result.localBlocks,
    selectedFileIds: [...(input.selectedFileIds ?? [])],
    providerMessage: result.eligible ? undefined : result.reason,
    createdAt: result.snapshot.compiledAt,
    updatedAt: result.snapshot.compiledAt,
    order,
  }
}
