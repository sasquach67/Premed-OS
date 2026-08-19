/**
 * `07` §5.1 — stable identity.
 *
 * The model supplies a natural-language `conceptLabel`; the client derives the
 * id. **The model never invents an id**, the same principle as
 * `SourceRef.display`: anything that must be stable or verifiable is derived,
 * not generated.
 *
 * Reuses `normalizeEntityName` — the normalizer that already backs dedup — so
 * concept identity and record dedup cannot drift apart into two ideas of what
 * "the same thing" means.
 */
import { normalizeEntityName } from '@/lib/entityMatching'

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function conceptIdFor(
  { courseId, topicId, conceptLabel }: { courseId: string; topicId: string; conceptLabel: string },
): string {
  return `${courseId}:${topicId}:${slug(normalizeEntityName(conceptLabel))}`
}
