/**
 * The artifact version registry (`01` §2.1).
 *
 * One entry per shipped L2. A generator that is specified but unbuilt is
 * deliberately absent — `04` flashcards arrives in Phase 4, and `10` reading
 * summaries is still PROPOSED. Registering a spec whose engine does not exist
 * would let the assembler produce a prompt for an artifact nothing can
 * generate.
 */
import { GAP_CHECK_V1 } from '@/lib/generation/artifacts/gapCheck.v1'
import { STUDY_GUIDE_V1 } from '@/lib/generation/artifacts/studyGuide.v1'
import type { ArtifactSpec } from '@/lib/generation/types'

export const ARTIFACT_REGISTRY: Record<string, ArtifactSpec> = {
  [GAP_CHECK_V1.specId]: GAP_CHECK_V1,
  [STUDY_GUIDE_V1.specId]: STUDY_GUIDE_V1,
}

export function artifactSpec(specId: string): ArtifactSpec {
  const spec = ARTIFACT_REGISTRY[specId]
  if (!spec) throw new Error(`No generator registered for "${specId}".`)
  return spec
}
