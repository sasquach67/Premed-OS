import { studentGuideInstruction, type GuideDirection } from './studentGuide'
import { journalStudyInstruction } from './journalStudyIntent'
import { lectureSourcePriorityInstruction } from './lectureSourcePriority'
import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { generateWithSourceRecovery, prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { validateMasteryOutline } from '@/lib/academics/unitQuestionBank'
import type { GeneratedMasteryOutline, JournalStudyIntent, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface UnitMasteryOutlineOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  artifact?: Omit<GeneratedMasteryOutline, 'id' | 'createdAt' | 'updatedAt' | 'order'>
}

function failureFor(code: string): GenerateFailure {
  if (code === 'no-sources') return 'no-sources'
  if (code === 'sign-in-required') return 'sign-in-required'
  if (code === 'citation-not-carried') return 'citation-not-carried'
  if (code === 'invalid-response') return 'invalid-response'
  return 'provider-unavailable'
}

export async function generateUnitMasteryOutline({ courseId, chunks, unit, label, guideDirections = [], scope = 'unit', practiceQuestionChunkIds = [], primarySourceChunkIds = [], personalNoteChunkIds = [], studyIntent, notebookRequest }: { guideDirections?: readonly GuideDirection[]; courseId: string; chunks: SourceChunk[]; unit: string; label: string; scope?: 'lecture' | 'unit' | 'exam'; practiceQuestionChunkIds?: readonly string[]; primarySourceChunkIds?: readonly string[]; personalNoteChunkIds?: readonly string[]; studyIntent?: JournalStudyIntent; notebookRequest?: string }): Promise<UnitMasteryOutlineOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Select processed course material first. The mastery map stays empty rather than guessing.' }
  try {
    assertGenerationAllowed({ scope: 'academics', artifact: 'unit-mastery-outline', courseId, groundedIn: chunks.map((chunk) => chunk.id) })
  } catch (error) {
    return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' }
  }
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Selected material could not be prepared.' }
  const preparedIds = new Set(prepared.chunkIds)
  const sourcePriority = lectureSourcePriorityInstruction(primarySourceChunkIds.filter(id => preparedIds.has(id)), personalNoteChunkIds.filter(id => preparedIds.has(id)))
  const journalInstruction = journalStudyInstruction(studyIntent, chunks.filter(chunk => preparedIds.has(chunk.id)))
  const refinements = notebookRequest?.trim() ? `Additional student instructions (preferences, not factual evidence): ${JSON.stringify(notebookRequest.trim().slice(0, 4000))}. Apply within the Mastery Map contract and selected evidence; preserve objective depth and do not invent support.` : ''
  const questionReferenceIds = [...new Set(practiceQuestionChunkIds.filter((id) => preparedIds.has(id)))]
  const validationEvidence = {
    requireSourcedMastery: true,
    sourceContent: new Map(chunks.filter(chunk => preparedIds.has(chunk.id)).map(chunk => [chunk.id, chunk.content])),
  }
  const examInstruction = 'Each objective has exactly How it is tested, Be able to do, Understand. Supply howTested with one setup line and questions quoting actual selected class-outline, live-response, GRQ or lecture text. Each question has id, text, sourceChunkIds from its objective; never invent a question. If no actual question is present use questions:[] and a concrete noQuestionsReason. Keep question source references for collapsed evidence, not source tags in the question text. applicationSkills contains observable text and questionIds referencing those same questions; use at least one reference when real questions exist, empty references only when none exist. Keep beAbleToDo strings equal to the skill text. Understand contains factual answers in exam vocabulary, preserving supported instructor answers and resolving any conflict explicitly. Required legacy freeRecallCues, watchFor and examPractice are empty arrays for new authoring; do not delete old saved data. Preserve every supported objective and subpoint without numeric quotas. Keep exact closed source evidence and specific limitations; absence of a real question alone is not a conceptual evidence limitation.'
  const assembled = assembleGenerationRequest({
    specId: 'unit-mastery-outline-v1', chunkIds: prepared.chunkIds, controls: { source_mode: 'SOURCE_ONLY' },
    request: [
      sourcePriority,
      studentGuideInstruction(guideDirections),
      journalInstruction,
      refinements,
      examInstruction,

      `Scope: ${scope}. Unit: ${unit}. Topic label: ${label}. Build the detailed mastery map from the selected sources. Preserve every explicit objective relevant to this scope and its distinct factual understanding and observable application skills, with real quoted course questions first.`,
      questionReferenceIds.length ? `Reference-question chunk IDs: ${questionReferenceIds.join(', ')}. Quote actual relevant questions faithfully in howTested and link skills to their question IDs. Never treat distractors as facts or invent an answer key.` : '',
    ].filter(Boolean).join('\n'),
  })
  const result = await generateWithSourceRecovery(courseId, chunks, { action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `${studentGuideInstruction(guideDirections)} ${sourcePriority} ${journalInstruction} ${refinements} Scope: ${scope}. Unit: ${unit}. Build a source-grounded three-part Mastery Map with actual course questions, referenced skills and factual answers. Preserve the relevant objective structure and subpoints; do not summarize a detailed outline. ${examInstruction}${questionReferenceIds.length ? ' Quote the actual relevant marked questions; retain their source evidence.' : ''}` })

  if (!result.ok) return { ok: false, failure: failureFor(result.code), message: result.message }
  let generationAuditStatus = result.data.auditStatus
  const issues: string[] = []
  let artifact = validateMasteryOutline(result.data.artifact, assembled.chunkIds, issues, false, validationEvidence)
  if (!artifact) {
    const repair = await generateWithSourceRecovery(courseId, chunks, {
      action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds,
      specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt,
      request: `${studentGuideInstruction(guideDirections)} ${sourcePriority} ${journalInstruction} ${refinements} Scope: ${scope}. Unit: ${unit}. Topic label: ${label}. Rebuild the complete Mastery Map from the same selected evidence. A prior attempt failed these deterministic checks: ${issues.join('; ')}. Correct every listed requirement. Keep all required fields, nonempty supported factual understanding, observable skills and real question references. Only mark a genuine conceptual evidence gap with evidenceLimit; never invent a question to fill missing course material. ${examInstruction} Source IDs must come only from the supplied evidence. Do not invent missing facts or repeat points to satisfy counts. Return the full valid artifact, not a patch.`,

    })
    if (!repair.ok) return { ok: false, failure: failureFor(repair.code), message: repair.message }
    generationAuditStatus = repair.data.auditStatus
    issues.length = 0
    artifact = validateMasteryOutline(repair.data.artifact, assembled.chunkIds, issues, false, validationEvidence)
  }
  if (!artifact) return { ok: false, failure: 'invalid-response', message: `The mastery outline did not pass its source-trace and section checks. Nothing was saved. Check: ${issues.join('; ')}` }
  return {
    ok: true,
    artifact: {
      courseId, title: generatedTitle(artifact.title), unit: artifact.unit, scope, specId: 'unit-mastery-outline-v1', specHash: assembled.specHash, generationAuditStatus,
      standards: artifact.standards.map((standard) => ({ ...standard, masteryState: 'not-started' as const })), sourceChunkIds: [...new Set(artifact.standards.flatMap((standard) => standard.sourceChunkIds))],
    },
  }
}
