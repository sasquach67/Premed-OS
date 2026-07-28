import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { classifyFileOwner, migrateFoundationV8 } from './foundationV8'
import type { AppData, LetterEntry, Person } from '@/lib/types'

function base(): AppData {
  const data = structuredClone(createSeedData())
  data.letters = []
  data.persons = []
  data.academics.classCenter.files = []
  return data
}

function person(id: string, name: string): Person {
  return { id, name, createdAt: 0, updatedAt: 0, archived: false, order: 0 }
}

function letter(id: string, recommender: string): LetterEntry {
  return { id, recommender, role: 'Professor', relationship: '', type: 'Science faculty', status: 'identified', order: 0 }
}

describe('migrateFoundationV8 — letters to Person links', () => {
  it('links a recommender that matches exactly one Person', () => {
    const data = base()
    data.persons = [person('p1', 'Dr. Elena Ruiz'), person('p2', 'Morgan Patel')]
    data.letters = [letter('l1', 'Dr. Elena Ruiz')]

    const out = migrateFoundationV8(data)
    expect(out.letters[0].recommenderId).toBe('p1')
    expect(out.letters[0].recommenderCandidateIds).toBeUndefined()
    // Lossless — the original string survives the link.
    expect(out.letters[0].recommender).toBe('Dr. Elena Ruiz')
    expect(out.persons).toHaveLength(2)
  })

  it('creates a Person when the recommender matches none', () => {
    const data = base()
    data.letters = [letter('l1', 'Dr. Samuel Green')]

    const out = migrateFoundationV8(data, 1000)
    expect(out.persons).toHaveLength(1)
    expect(out.persons[0].name).toBe('Dr. Samuel Green')
    expect(out.letters[0].recommenderId).toBe(out.persons[0].id)
    expect(out.persons[0].tags).toContain('letter-writer')
  })

  it('never merges silently when the recommender is ambiguous — it routes to review', () => {
    const data = base()
    data.persons = [person('p1', 'J. Chen'), person('p2', 'J. Chen')]
    data.letters = [letter('l1', 'J. Chen')]

    const out = migrateFoundationV8(data)
    expect(out.letters[0].recommenderId).toBeUndefined()
    expect(out.letters[0].recommenderCandidateIds).toEqual(['p1', 'p2'])
    // No new Person invented for an ambiguous name.
    expect(out.persons).toHaveLength(2)
  })

  it('is idempotent and leaves already-linked letters alone', () => {
    const data = base()
    data.persons = [person('p1', 'Dr. Elena Ruiz')]
    data.letters = [{ ...letter('l1', 'Dr. Elena Ruiz'), recommenderId: 'p1' }]

    const once = migrateFoundationV8(data)
    const twice = migrateFoundationV8(once)
    expect(twice.letters).toEqual(once.letters)
    expect(twice.persons).toHaveLength(1)
  })

  it('does not write to frozen input', () => {
    const data = base()
    data.letters = [letter('l1', 'Dr. Samuel Green')]
    Object.freeze(data.letters[0])
    Object.freeze(data.letters)
    Object.freeze(data.persons)

    expect(() => migrateFoundationV8(data)).not.toThrow()
    expect(data.letters[0].recommenderId).toBeUndefined()
  })
})

describe('migrateFoundationV8 — AcademicFile ownership', () => {
  it('classifies ownership structurally and backfills only missing values', () => {
    expect(classifyFileOwner({ type: 'study-guide', sourceType: 'upload' })).toBe('generated')
    expect(classifyFileOwner({ type: 'other', sourceType: 'upload' })).toBe('mine')
    expect(classifyFileOwner({ type: 'syllabus', sourceType: 'link' })).toBe('course')

    const data = base()
    data.academics.classCenter.files = [
      { id: 'f1', courseId: 'c1', sourceType: 'upload', title: 'Guide', type: 'study-guide', linkedTopicIds: [], createdAt: 0, updatedAt: 0, order: 0 },
      { id: 'f2', courseId: 'c1', sourceType: 'link', title: 'Syllabus', type: 'syllabus', owner: 'mine', linkedTopicIds: [], createdAt: 0, updatedAt: 0, order: 1 },
    ] as AppData['academics']['classCenter']['files']

    const out = migrateFoundationV8(data)
    expect(out.academics.classCenter.files[0].owner).toBe('generated')
    // An explicit value is never overwritten.
    expect(out.academics.classCenter.files[1].owner).toBe('mine')
  })
})
