import type { ClassWorkspaceType } from '@/lib/types'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

/**
 * A proposal is deliberately distinct from a saved ClassWorkspace.type.
 *
 * The form may use this to preselect a chip and explain why, but the proposal
 * never writes storage or changes an existing workspace.  Keeping it pure
 * makes the no-network, no-hidden-inference boundary testable.
 */
export type ClassTypeProposal =
  | {
    kind: 'suggestion'
    type: ClassWorkspaceType
    reason: string
    source: 'syllabus' | 'course-code' | 'course-metadata'
  }
  | { kind: 'needs-choice' }

export interface ClassTypeProposalInput {
  /** The entered or parsed catalogue code, not a freeform course title. */
  courseCode?: string
  /** Explicit course metadata. BCPM is an attributable science signal. */
  bcpm?: boolean
  /** Already parsed syllabus facts only. A file name or raw file type is not evidence. */
  syllabusItems?: readonly Pick<SyllabusItem, 'kind' | 'label' | 'value' | 'confidence'>[]
}

const WRITING_CODE = /^\s*(?:ENGL|WRIT|COMP|RHET|LIT)\b/i
const WRITING_WEIGHT = /\b(?:paper|essay|composition|writing)\b/i
const STAGED_WRITING = /\b(?:draft|revision|revise|peer review)\b/i

function highConfidence(items: readonly Pick<SyllabusItem, 'kind' | 'label' | 'value' | 'confidence'>[]) {
  return items.filter((item) => item.confidence === 'high')
}

function hasWritingSyllabusSignal(items: readonly Pick<SyllabusItem, 'kind' | 'label' | 'value' | 'confidence'>[]) {
  return items.some((item) => (
    (item.kind === 'weights' && WRITING_WEIGHT.test(item.label))
    || ((item.kind === 'deadlines' || item.kind === 'units') && STAGED_WRITING.test(item.label))
  ))
}

/** A cumulative STEM structure needs more than one generic week heading. */
function hasStemSyllabusSignal(items: readonly Pick<SyllabusItem, 'kind' | 'label' | 'value' | 'confidence'>[]) {
  const units = items.filter((item) => item.kind === 'units').length
  const exams = items.some((item) => item.kind === 'exams')
  return units >= 2 && exams
}

/**
 * Offer an attributable class-study-layer type without deciding it for the
 * student. Evidence is intentionally conservative and ordered by strength:
 * parsed syllabus, then entered course code/explicit metadata, then no choice.
 */
export function proposeClassType(input: ClassTypeProposalInput): ClassTypeProposal {
  const syllabus = highConfidence(input.syllabusItems ?? [])

  // A staged paper/explicit writing category takes precedence over a generic
  // units-and-exams structure. It is the more specific syllabus evidence.
  if (hasWritingSyllabusSignal(syllabus)) {
    return {
      kind: 'suggestion',
      type: 'writing',
      source: 'syllabus',
      reason: 'Suggested Writing — this syllabus includes writing work.',
    }
  }

  if (hasStemSyllabusSignal(syllabus)) {
    return {
      kind: 'suggestion',
      type: 'stem',
      source: 'syllabus',
      reason: 'Suggested STEM — this syllabus has units and exams to review.',
    }
  }

  if (input.courseCode && WRITING_CODE.test(input.courseCode)) {
    return {
      kind: 'suggestion',
      type: 'writing',
      source: 'course-code',
      reason: 'Suggested Writing — this course code is usually writing-intensive.',
    }
  }

  if (input.bcpm === true) {
    return {
      kind: 'suggestion',
      type: 'stem',
      source: 'course-metadata',
      reason: 'Suggested STEM — this course is marked BCPM.',
    }
  }

  return { kind: 'needs-choice' }
}
