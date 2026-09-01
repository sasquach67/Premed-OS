/* Part 3 — duplicate detection.
 *
 * Extends the existing Person/Organization matchers (`lib/entityMatching.ts`)
 * into a general pass over people, organizations, courses, and schools.
 *
 * DETECTION ONLY. This module never merges, never mutates, and never picks a
 * winner — general.md requires merges be reversible with a preview and undo,
 * which is its own feature. Here we surface candidates, a qualitative
 * confidence, and exactly which fields differ, then let the user decide.
 *
 * Dedup is the one place in this layer that carries confidence at all: name
 * similarity is genuinely uncertain, unlike the objective checks elsewhere.
 */
import type {
  AppData, CollectionRecord, Course, Organization, Person, SchoolEntry,
} from '@/lib/types'
import { normalizeEntityName } from '@/lib/entityMatching'
import type { ConfidenceLevel } from './types'

export type DedupKind = 'person' | 'organization' | 'course' | 'school'

export interface DedupCandidate {
  /** Stable, order-independent identity so dismissals survive re-sorting. */
  id: string
  kind: DedupKind
  confidence: ConfidenceLevel
  /** Plain-language reason these two look like the same thing. */
  why: string
  left: { id: string; label: string }
  right: { id: string; label: string }
  /** Field labels whose values disagree — what a merge would have to reconcile. */
  differingFields: string[]
  route: string
}

function pairId(kind: DedupKind, a: string, b: string): string {
  const [first, second] = [a, b].sort()
  return `duplicate-${kind}:${first}:${second}`
}

function reviewRoute(id: string): string {
  return `/review?item=${encodeURIComponent(id)}`
}

function differing(fields: { label: string; a?: string | number; b?: string | number }[]): string[] {
  return fields
    .filter(({ a, b }) => {
      const left = String(a ?? '').trim().toLocaleLowerCase()
      const right = String(b ?? '').trim().toLocaleLowerCase()
      return left && right && left !== right
    })
    .map(({ label }) => label)
}

/** Name-similarity verdict shared by the entity passes. */
function nameConfidence(a: string, b: string): ConfidenceLevel | null {
  const left = normalizeEntityName(a)
  const right = normalizeEntityName(b)
  if (!left || !right) return null
  if (left === right) return 'high'
  // Containment catches "Dr. Sarah Kwon" vs "Sarah Kwon" and "UNC Hospitals"
  // vs "UNC Hospital" — likely, but not certain enough to call high.
  if (left.includes(right) || right.includes(left)) return 'moderate'
  return null
}

function activeRows<T extends { archived?: boolean; deletedAt?: number }>(rows: T[]): T[] {
  return rows.filter((row) => !row.archived && !row.deletedAt)
}

function personCandidates(persons: CollectionRecord<Person>[]): DedupCandidate[] {
  const rows = activeRows(persons)
  const out: DedupCandidate[] = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      const sameEmail = Boolean(a.email && b.email && normalizeEntityName(a.email) === normalizeEntityName(b.email))
      const byName = nameConfidence(a.name, b.name)
      if (!sameEmail && !byName) continue
      const confidence: ConfidenceLevel = sameEmail ? 'high' : byName ?? 'low'
      const id = pairId('person', a.id, b.id)
      out.push({
        id,
        kind: 'person',
        confidence,
        why: sameEmail
          ? `${a.name} and ${b.name} share the email ${a.email}.`
          : `${a.name} and ${b.name} have nearly identical names.`,
        left: { id: a.id, label: a.name },
        right: { id: b.id, label: b.name },
        differingFields: differing([
          { label: 'Email', a: a.email, b: b.email },
          { label: 'Phone', a: a.phone, b: b.phone },
          { label: 'Role', a: a.role, b: b.role },
          { label: 'Title', a: a.title, b: b.title },
        ]),
        route: reviewRoute(id),
      })
    }
  }
  return out
}

function organizationCandidates(organizations: CollectionRecord<Organization>[]): DedupCandidate[] {
  const rows = activeRows(organizations)
  const out: DedupCandidate[] = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      const sameSite = Boolean(a.website && b.website && normalizeEntityName(a.website) === normalizeEntityName(b.website))
      const byName = nameConfidence(a.name, b.name)
      if (!sameSite && !byName) continue
      const id = pairId('organization', a.id, b.id)
      out.push({
        id,
        kind: 'organization',
        confidence: sameSite ? 'high' : byName ?? 'low',
        why: sameSite
          ? `${a.name} and ${b.name} point at the same website.`
          : `${a.name} and ${b.name} have nearly identical names.`,
        left: { id: a.id, label: a.name },
        right: { id: b.id, label: b.name },
        differingFields: differing([
          { label: 'Type', a: a.type, b: b.type },
          { label: 'Location', a: a.location, b: b.location },
          { label: 'Website', a: a.website, b: b.website },
        ]),
        route: reviewRoute(id),
      })
    }
  }
  return out
}

function courseCandidates(courses: CollectionRecord<Course>[]): DedupCandidate[] {
  const rows = courses.filter((course) => !course.deletedAt && course.code.trim())
  const out: DedupCandidate[] = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      if (normalizeEntityName(a.code) !== normalizeEntityName(b.code)) continue
      // Same code in a DIFFERENT term is a legitimate retake — AMCAS averages
      // repeats rather than replacing them, so both rows must survive.
      if (normalizeEntityName(a.term) !== normalizeEntityName(b.term)) continue
      const id = pairId('course', a.id, b.id)
      out.push({
        id,
        kind: 'course',
        confidence: 'high',
        why: `${a.code} is listed twice in ${a.term}. (A retake in a different term is not a duplicate.)`,
        left: { id: a.id, label: `${a.code} · ${a.term}` },
        right: { id: b.id, label: `${b.code} · ${b.term}` },
        differingFields: differing([
          { label: 'Title', a: a.title, b: b.title },
          { label: 'Credits', a: a.credits, b: b.credits },
          { label: 'Grade', a: a.grade, b: b.grade },
          { label: 'Status', a: a.status, b: b.status },
        ]),
        route: reviewRoute(id),
      })
    }
  }
  return out
}

function schoolCandidates(schools: CollectionRecord<SchoolEntry>[]): DedupCandidate[] {
  const rows = schools.filter((school) => !school.deletedAt && school.name.trim())
  const out: DedupCandidate[] = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      const byName = nameConfidence(a.name, b.name)
      if (!byName) continue
      const id = pairId('school', a.id, b.id)
      out.push({
        id,
        kind: 'school',
        confidence: byName,
        why: `${a.name} and ${b.name} look like the same school on your list.`,
        left: { id: a.id, label: a.name },
        right: { id: b.id, label: b.name },
        differingFields: differing([
          { label: 'Type', a: a.type, b: b.type },
          { label: 'Category', a: a.category, b: b.category },
          { label: 'Status', a: a.status, b: b.status },
          { label: 'State', a: a.state, b: b.state },
        ]),
        route: reviewRoute(id),
      })
    }
  }
  return out
}

/** All duplicate candidates across the workspace, most confident first. */
export function dedupCandidates(data: AppData): DedupCandidate[] {
  const order: Record<ConfidenceLevel, number> = { high: 0, moderate: 1, low: 2 }
  return [
    ...personCandidates(data.persons),
    ...organizationCandidates(data.organizations),
    ...courseCandidates(data.courses),
    ...schoolCandidates(data.schools),
  ].sort((a, b) => order[a.confidence] - order[b.confidence])
}
