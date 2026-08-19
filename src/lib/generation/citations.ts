/**
 * The closed citation set (`01` §5.1) — **the hardest technical claim in the
 * design**, and the reason `09` §6 names Phase 2 as the one to de-risk first.
 *
 * The pipeline is: pass 1 drafts with provider-attested citations → the server
 * verifies each against real chunk offsets → **only the survivors are passed
 * forward as a closed set** → pass 2 is told it may reference these and no
 * others → after pass 2 the server re-verifies.
 *
 * ⚠️ **A citation in the structured output that is not in the closed set
 * rejects the artifact. It is never repaired.** Repairing would mean choosing a
 * citation on the model's behalf, which is precisely the fabrication the whole
 * mechanism exists to make impossible.
 *
 * All of this is pure. It needs no model, which is what makes the claim
 * testable before a single token is spent.
 */
import type { ContentBlock, SourceRef, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { CITATION_REQUIRED } from '@/lib/generation/schemas/studyGuide.v1'

export interface VerifiableChunk {
  chunkId: string
  fileId: string
  content: string
}

/** A citation identity, order-independent and stable to compare. */
export function citationKey(ref: Pick<SourceRef, 'chunkId' | 'start' | 'end'>): string {
  return `${ref.chunkId}:${ref.start}:${ref.end}`
}

/**
 * Verify attested citations against the chunks the server owns.
 *
 * A citation survives only if its chunk exists and its offsets fall inside that
 * chunk's real content. An offset past the end of a chunk is the classic
 * fabrication and is dropped rather than clamped — clamping would invent a
 * quotation the source does not contain.
 */
export function closedCitationSet(
  attested: SourceRef[],
  chunks: VerifiableChunk[],
): { survivors: SourceRef[]; keys: ReadonlySet<string>; dropped: SourceRef[] } {
  const byId = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]))
  const survivors: SourceRef[] = []
  const dropped: SourceRef[] = []

  for (const ref of attested) {
    const chunk = byId.get(ref.chunkId)
    const valid = chunk != null
      && Number.isFinite(ref.start) && Number.isFinite(ref.end)
      && ref.start >= 0 && ref.end > ref.start && ref.end <= chunk.content.length
      && chunk.fileId === ref.fileId
    if (valid) survivors.push(ref)
    else dropped.push(ref)
  }
  return { survivors, keys: new Set(survivors.map(citationKey)), dropped }
}

export interface CitationVerdict {
  ok: boolean
  /** Citations pass 2 emitted that were never in the closed set. */
  minted: SourceRef[]
}

/**
 * The post-pass-2 invariant, made mechanical. Pass 2 may **carry** citations;
 * it may never **mint** one.
 */
export function verifyStructuredCitations(
  artifact: StudyGuideArtifact,
  closed: ReadonlySet<string>,
): CitationVerdict {
  const minted: SourceRef[] = []
  for (const section of artifact.sections) {
    for (const block of section.blocks) {
      if (!block.sourceRef) continue
      if (!closed.has(citationKey(block.sourceRef))) minted.push(block.sourceRef)
    }
  }
  return { ok: minted.length === 0, minted }
}

/** Blocks that require a citation and do not carry one (`01` §4.2). */
export function blocksMissingCitation(artifact: StudyGuideArtifact): ContentBlock[] {
  const out: ContentBlock[] = []
  for (const section of artifact.sections) {
    for (const block of section.blocks) {
      if (!CITATION_REQUIRED.has(block.type)) continue
      // Background is admitted by the mode, not by a citation — it has none by
      // definition, and demanding one would make the mode unusable.
      if (block.provenance === 'background') continue
      if (!block.sourceRef) out.push(block)
    }
  }
  return out
}
