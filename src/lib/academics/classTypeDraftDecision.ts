import type { ClassWorkspaceType } from '@/lib/types'
import { proposeClassType, type ClassTypeProposal } from '@/lib/academics/classTypeProposal'

export type ClassTypeDraftDecision = {
  selectedType?: ClassWorkspaceType
  proposal?: Extract<ClassTypeProposal, { kind: 'suggestion' }>
  selectionKind: 'saved' | 'suggestion' | 'student' | 'needs-choice'
}

/**
 * UI state around the one existing proposal contract. This never persists or
 * classifies a course itself: it only distinguishes a reversible suggestion
 * from a student's explicit choice while the add-class dialog is open.
 */
export function classTypeDraftDecision({
  isCreate,
  courseCode,
  savedType,
  studentChoice,
}: {
  isCreate: boolean
  courseCode: string
  savedType?: ClassWorkspaceType
  studentChoice?: ClassWorkspaceType
}): ClassTypeDraftDecision {
  if (!isCreate && savedType) return { selectedType: savedType, selectionKind: 'saved' }
  if (studentChoice) return { selectedType: studentChoice, selectionKind: 'student' }

  const proposal = proposeClassType({ courseCode })
  if (proposal.kind === 'suggestion') {
    return { selectedType: proposal.type, proposal, selectionKind: 'suggestion' }
  }
  return { selectionKind: 'needs-choice' }
}
