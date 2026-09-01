import type { ClassCenterData, ID } from '@/lib/types'

export interface RemovedCourseLocalData {
  blobRefs: string[]
}

/**
 * Removes every course-owned Academics record from the persisted model.
 * Device-local bytes are returned so the caller can delete them after the
 * state transaction succeeds. Prior-credit transcript rows remain untouched
 * because they deliberately have no courseId.
 */
export function removeCourseCascade(center: ClassCenterData, courseId: ID): RemovedCourseLocalData {
  const topicIds = new Set(center.topics.filter((item) => item.courseId === courseId).map((item) => item.id))
  const fileRows = center.files.filter((item) => item.courseId === courseId)
  const lectureRows = center.lectures.filter((item) => item.courseId === courseId)
  const sourceIds = new Set(center.watchedNoteSources.filter((item) => item.courseId === courseId).map((item) => item.id))

  center.workspaces = center.workspaces.filter((item) => item.courseId !== courseId)
  center.topics = center.topics.filter((item) => item.courseId !== courseId)
  center.notes = center.notes.filter((item) => item.courseId !== courseId)
  center.assignments = center.assignments.filter((item) => item.courseId !== courseId)
  center.files = center.files.filter((item) => item.courseId !== courseId)
  center.sourceChunks = center.sourceChunks.filter((item) => item.courseId !== courseId)
  center.retrievabilityPredictions = center.retrievabilityPredictions.filter((item) => item.courseId !== courseId)
  center.focusSessions = center.focusSessions.filter((item) => item.courseId !== courseId)
  center.contacts = center.contacts.filter((item) => item.courseId !== courseId)
  center.weakAreas = center.weakAreas.filter((item) => item.courseId !== courseId)
  center.practiceExams = center.practiceExams.filter((item) => item.courseId !== courseId)
  center.practiceQuestions = center.practiceQuestions.filter((item) => item.courseId !== courseId)
  center.paperDrafts = center.paperDrafts.filter((item) => item.courseId !== courseId)
  center.assignedReadings = center.assignedReadings.filter((item) => item.courseId !== courseId)
  center.feedbackNotes = center.feedbackNotes.filter((item) => item.courseId !== courseId)
  center.gradeCategories = center.gradeCategories.filter((item) => item.courseId !== courseId)
  center.mistakes = center.mistakes.filter((item) => item.courseId !== courseId)
  center.topicPredictions = center.topicPredictions.filter((item) => item.courseId !== courseId)
  center.examPrepPlans = center.examPrepPlans.filter((item) => item.courseId !== courseId)
  center.generatedFlashcardDecks = center.generatedFlashcardDecks.filter((item) => item.courseId !== courseId)
  center.generatedMockAttempts = center.generatedMockAttempts.filter((item) => item.courseId !== courseId)
  center.generatedRevisedNotes = center.generatedRevisedNotes.filter((item) => item.courseId !== courseId)
  center.generatedMasteryOutlines = center.generatedMasteryOutlines.filter((item) => item.courseId !== courseId)
  center.generatedUnitQuestionBanks = center.generatedUnitQuestionBanks.filter((item) => item.courseId !== courseId)
  center.professorEvidence = center.professorEvidence.filter((item) => item.courseId !== courseId)
  center.conceptCanvases = center.conceptCanvases.filter((item) => item.courseId !== courseId)
  center.assessmentMaterials = center.assessmentMaterials.filter((item) => item.courseId !== courseId)
  center.assessmentAttempts = center.assessmentAttempts.filter((item) => item.courseId !== courseId)
  center.transcriptRecords = center.transcriptRecords.filter((item) => item.courseId !== courseId)
  center.lectures = center.lectures.filter((item) => item.courseId !== courseId)
  center.lectureFindings = center.lectureFindings.filter((item) => item.courseId !== courseId)
  center.lectureMaterialProposals = center.lectureMaterialProposals.filter((item) => item.courseId !== courseId)
  center.lectureNoteProposals = center.lectureNoteProposals.filter((item) => item.courseId !== courseId)
  center.guideProposals = center.guideProposals.filter((item) => item.courseId !== courseId)
  center.watchedNoteSources = center.watchedNoteSources.filter((item) => item.courseId !== courseId)
  center.termReports = center.termReports.filter((item) => !item.courseIds.includes(courseId))

  center.keyPoints = center.keyPoints.filter((item) => !topicIds.has(item.topicId))
  center.reviewEvents = center.reviewEvents.filter((item) => !topicIds.has(item.topicId))
  center.topicLinks = center.topicLinks.filter((item) => !topicIds.has(item.fromTopicId) && !topicIds.has(item.toTopicId))
  center.watchedNoteProposals = center.watchedNoteProposals.filter((item) => !sourceIds.has(item.sourceId))
  center.savedPlans = center.savedPlans.map((plan) => ({
    ...plan,
    placements: plan.placements.filter((placement) => placement.courseId !== courseId),
  }))

  return {
    blobRefs: [...new Set([
      ...fileRows.map((item) => item.blobRef),
      ...lectureRows.map((item) => item.audioBlobRef),
    ].filter((value): value is string => Boolean(value)))],
  }
}
