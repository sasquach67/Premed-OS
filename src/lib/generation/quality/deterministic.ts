/**
 * Deterministic quality checks (`08` §2.1) — **no model call**.
 *
 * Roughly two-thirds of the quality list is computable in TypeScript. `08` §2.3
 * gives the reason bluntly: asking a model to audit its own output for
 * hallucination is the weakest possible check, and asking it to count cloze
 * deletions is a waste of a call.
 *
 * ⚠️ Severity is not advisory decoration. `08` §2.4: a `blocking` finding means
 * **the artifact is not persisted** — one scoped regeneration, then surface the
 * error. Never ship a blocking-failed artifact.
 */
import type { GuideSection, StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { blocksMissingCitation } from '@/lib/generation/citations'
import type { SourceMode } from '@/lib/generation/types'
import { sourceModeSpec } from '@/lib/generation/layers/sourceModes'

export type Severity = 'blocking' | 'advisory'

export interface QualityFinding {
  check: string
  severity: Severity
  detail: string
  sectionId?: string
}

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

/** `VIS-2` — a section over eight blocks should have been split. */
function oversizedSections(sections: GuideSection[]): QualityFinding[] {
  return sections
    .filter((section) => section.blocks.length > 8)
    .map((section) => ({
      check: 'Oversized section',
      severity: 'advisory' as const,
      sectionId: section.id,
      detail: `${section.title} holds ${section.blocks.length} blocks without subsections.`,
    }))
}

/** `VIS-1` — more than two consecutive prose blocks is a wall. */
function proseRuns(sections: GuideSection[]): QualityFinding[] {
  const out: QualityFinding[] = []
  for (const section of sections) {
    let run = 0
    for (const block of section.blocks) {
      run = block.type === 'prose' ? run + 1 : 0
      if (run === 3) {
        out.push({
          check: 'Prose run',
          severity: 'advisory',
          sectionId: section.id,
          detail: `${section.title} runs three prose blocks together.`,
        })
        break
      }
    }
  }
  return out
}

/** `SG-6` — bullet nesting deeper than two levels. */
function bulletNesting(sections: GuideSection[]): QualityFinding[] {
  const out: QualityFinding[] = []
  for (const section of sections) {
    for (const block of section.blocks) {
      if ((block.depth ?? 0) > 2) {
        out.push({
          check: 'Bullet nesting',
          severity: 'blocking',
          sectionId: section.id,
          detail: `A list in ${section.title} nests ${block.depth} levels deep.`,
        })
      }
    }
  }
  return out
}

/** `G-EMPH-4` — emphasis over 8% of body words stops meaning anything. */
function emphasisDensity(artifact: StudyGuideArtifact): QualityFinding[] {
  let body = 0
  let emphasised = 0
  for (const section of artifact.sections) {
    for (const block of section.blocks) {
      const text = block.text?.content ?? ''
      body += words(text)
      for (const span of block.text?.emphasis ?? []) emphasised += words(span.text)
    }
  }
  if (!body || emphasised / body <= 0.08) return []
  return [{
    check: 'Emphasis density',
    severity: 'blocking',
    detail: `${Math.round((emphasised / body) * 100)}% of body words are emphasised; the ceiling is 8%.`,
  }]
}

/** §1.7 — over 20% of concepts marked high-yield means nothing is. */
function highYieldBudget(artifact: StudyGuideArtifact): QualityFinding[] {
  const blocks = artifact.sections.flatMap((section) => section.blocks)
  const concepts = blocks.filter((block) => block.conceptLabel)
  const flagged = concepts.filter((block) => block.highYield)
  if (!concepts.length || flagged.length / concepts.length <= 0.2) return []
  return [{
    check: 'High-yield budget',
    severity: 'blocking',
    detail: `${flagged.length} of ${concepts.length} concepts are marked high-yield; the ceiling is 20%.`,
  }]
}

/** §1.7 — a high-yield claim with no admissible basis is an assertion. */
function highYieldBasis(artifact: StudyGuideArtifact): QualityFinding[] {
  return artifact.sections.flatMap((section) => section.blocks
    .filter((block) => block.highYield && !block.basis)
    .map(() => ({
      check: 'High-yield basis',
      severity: 'blocking' as const,
      sectionId: section.id,
      detail: `A high-yield block in ${section.title} names no defensible basis.`,
    })))
}

/** Background can never be the high-yield point — it is not the course's own material. */
function backgroundAsHighYield(artifact: StudyGuideArtifact): QualityFinding[] {
  return artifact.sections.flatMap((section) => section.blocks
    .filter((block) => block.highYield && block.provenance === 'background')
    .map(() => ({
      check: 'Background as high-yield',
      severity: 'blocking' as const,
      sectionId: section.id,
      detail: `A background block in ${section.title} is marked high-yield.`,
    })))
}

/** `02` §2.5 — a block whose provenance the resolved mode forbids. */
function sourceModeCompliance(artifact: StudyGuideArtifact, mode: SourceMode): QualityFinding[] {
  const spec = sourceModeSpec(mode)
  return artifact.sections.flatMap((section) => section.blocks
    .filter((block) =>
      (block.provenance === 'clarification' && !spec.admitsClarification)
      || (block.provenance === 'background' && !spec.admitsBackground))
    .map((block) => ({
      check: 'Source-mode compliance',
      severity: 'blocking' as const,
      sectionId: section.id,
      detail: `A ${block.provenance} block appears under ${mode}, which forbids it.`,
    })))
}

/** `06` §9.1 — under 30% non-prose blocks means the representation decision was skipped. */
function representationVariety(artifact: StudyGuideArtifact): QualityFinding[] {
  const blocks = artifact.sections.flatMap((section) => section.blocks)
  if (blocks.length < 4) return []
  const nonProse = blocks.filter((block) => block.type !== 'prose')
  if (nonProse.length / blocks.length >= 0.3) return []
  return [{
    check: 'Representation variety',
    severity: 'advisory',
    detail: `Only ${Math.round((nonProse.length / blocks.length) * 100)}% of blocks are non-prose.`,
  }]
}

export function runDeterministicChecks(
  artifact: StudyGuideArtifact,
  { mode, closedCitationKeys }: { mode: SourceMode; closedCitationKeys?: ReadonlySet<string> },
): QualityFinding[] {
  const findings: QualityFinding[] = [
    ...artifact.sections
      .filter((section) => section.blocks.length === 0)
      .map((section) => ({
        check: 'Empty sections',
        severity: 'blocking' as const,
        sectionId: section.id,
        detail: `${section.title} renders with no blocks.`,
      })),
    ...oversizedSections(artifact.sections),
    ...proseRuns(artifact.sections),
    ...bulletNesting(artifact.sections),
    ...emphasisDensity(artifact),
    ...highYieldBudget(artifact),
    ...highYieldBasis(artifact),
    ...backgroundAsHighYield(artifact),
    ...sourceModeCompliance(artifact, mode),
    ...representationVariety(artifact),
    ...blocksMissingCitation(artifact).map((block) => ({
      check: 'Citation required',
      severity: 'blocking' as const,
      detail: `A ${block.type} block carries no citation.`,
    })),
  ]
  if (closedCitationKeys) {
    for (const section of artifact.sections) {
      for (const block of section.blocks) {
        if (!block.sourceRef) continue
        const key = `${block.sourceRef.chunkId}:${block.sourceRef.start}:${block.sourceRef.end}`
        if (!closedCitationKeys.has(key)) {
          findings.push({
            check: 'Citation integrity',
            severity: 'blocking',
            sectionId: section.id,
            detail: 'A citation is not in the verified set.',
          })
        }
      }
    }
  }
  return findings
}

/** `08` §2.4 — a blocking finding means the artifact is not persisted. */
export function isPersistable(findings: QualityFinding[]): boolean {
  return !findings.some((finding) => finding.severity === 'blocking')
}
