/* v8 — two additive, lossless backfills.
 *
 * 1. Letters → canonical Person records. Letters historically stored the
 *    recommender as a bare string, so the same human existed twice with no
 *    link between them. We resolve each string against `data.persons`:
 *      · exactly one match  → link `recommenderId`
 *      · no match           → create the Person, then link
 *      · several matches    → link NOTHING, record the candidates for review
 *    The original `recommender` string is always kept, so the migration can be
 *    re-run and nothing is lost. Ambiguity is never resolved by guessing.
 *
 * 2. `AcademicFile.owner` — materials ownership becomes structural. Existing
 *    rows are classified once, here, instead of being re-inferred at read time.
 *
 * Pure: never writes to `data` (state may be frozen by immer).
 */
import type { AcademicFile, AcademicFileOwner, AppData, LetterEntry, Person } from '@/lib/types'
import { findPersonMatches } from '@/lib/entityMatching'

/** App-produced material. Everything else defaults to course-issued unless the
 *  student clearly authored it. */
const GENERATED_TYPES = new Set(['study-guide'])
const MINE_TYPES = new Set(['other'])

export function classifyFileOwner(file: Pick<AcademicFile, 'type' | 'sourceType'>): AcademicFileOwner {
  if (GENERATED_TYPES.has(file.type)) return 'generated'
  // A student's own upload of an untyped document is their work, not the class's.
  if (MINE_TYPES.has(file.type) && file.sourceType === 'upload') return 'mine'
  return 'course'
}

function personFromLetter(letter: LetterEntry, now: number): Person {
  return {
    id: `person-from-letter-${letter.id}`,
    name: letter.recommender.trim(),
    role: letter.role || undefined,
    title: letter.type || undefined,
    notes: letter.relationship || undefined,
    tags: ['letter-writer'],
    createdAt: now,
    updatedAt: now,
    archived: false,
    source: { type: 'import', provider: 'letters-v8' },
    order: 0,
  }
}

export function migrateFoundationV8(data: AppData, now = Date.now()): AppData {
  const existingPersons = data.persons ?? []
  const createdPersons: Person[] = []

  const letters = (data.letters ?? []).map((letter) => {
    const name = letter.recommender?.trim()
    // Already linked, or nothing to link from.
    if (!name || letter.recommenderId) return letter

    const pool = [...existingPersons, ...createdPersons]
    const matches = findPersonMatches(name, pool)

    if (matches.length === 1) {
      return { ...letter, recommenderId: matches[0].id, recommenderCandidateIds: undefined }
    }
    if (matches.length > 1) {
      // Ambiguous — surface it, never merge silently.
      return { ...letter, recommenderCandidateIds: matches.map((person) => person.id) }
    }
    const person = personFromLetter(letter, now)
    createdPersons.push(person)
    return { ...letter, recommenderId: person.id, recommenderCandidateIds: undefined }
  })

  const files = (data.academics?.classCenter?.files ?? []).map((file) =>
    file.owner ? file : { ...file, owner: classifyFileOwner(file) })

  // Note kind becomes structural. Legacy rows are classified once, here: a note
  // written against a specific file is "on the material"; everything else is
  // "about the class". After this, the screen never decides the kind.
  const notes = (data.academics?.classCenter?.notes ?? []).map((note) =>
    note.kind ? note : { ...note, kind: note.linkedFileIds?.length ? 'on-material' as const : 'about-class' as const })

  return {
    ...data,
    letters,
    persons: createdPersons.length ? [...existingPersons, ...createdPersons] : existingPersons,
    academics: {
      ...data.academics,
      classCenter: { ...data.academics.classCenter, files, notes },
    },
  }
}
