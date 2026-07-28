import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import {
  migrateAcademicsV5,
  normalizePersonEmail,
  normalizePersonName,
  resolveAcademicContactMigration,
} from '@/store/migrations/academicsV5'

describe('Academics v5 migration', () => {
  it('normalizes and links duplicate contact identities idempotently', () => {
    const data = structuredClone(createSeedData())
    const original = data.academics.classCenter.contacts[0]
    original.email = 'ott@example.com'
    data.academics.classCenter.contacts.push({
      ...original,
      id: 'contact-duplicate',
      name: '  PROF.   OTT ',
      email: 'OTT@EXAMPLE.COM ',
      order: 1,
    })

    const first = migrateAcademicsV5(data, 100)
    const once = JSON.stringify(first)
    const second = migrateAcademicsV5(first, 200)

    expect(normalizePersonName(' Prof.   Ott ')).toBe('prof. ott')
    expect(normalizePersonEmail(' OTT@Example.com ')).toBe('ott@example.com')
    expect(second.persons).toHaveLength(1)
    expect(second.academics.classCenter.contacts.every((contact) => contact.personId === second.persons[0].id)).toBe(true)
    expect(JSON.stringify(second)).toBe(once)
  })

  it('requires review for the same name with a different email', () => {
    const data = structuredClone(createSeedData())
    data.persons.push({
      id: 'existing-prof',
      name: 'Prof. Ott',
      email: 'first@example.com',
      createdAt: 100,
      updatedAt: 100,
      archived: false,
      order: 0,
    })
    const contact = data.academics.classCenter.contacts[0]
    contact.email = 'second@example.com'

    const out = migrateAcademicsV5(data, 100)
    const pending = out.academics.migrationJournal.find((entry) => entry.kind === 'contact-conflict')

    expect(out.academics.classCenter.contacts[0].personId).toBeUndefined()
    expect(pending).toMatchObject({
      status: 'pending',
      legacyContactId: contact.id,
      candidatePersonIds: ['existing-prof'],
    })
    expect(pending?.legacyContact).toMatchObject({ email: 'second@example.com' })

    resolveAcademicContactMigration(out, pending!.id, { type: 'create-person' }, 200)
    const resolved = out.academics.classCenter.contacts[0]
    expect(resolved.personId).toBeTruthy()
    expect(resolved.personId).not.toBe('existing-prof')
    expect(pending?.status).toBe('resolved')
    expect(out.persons).toHaveLength(2)
  })

  it('adds append-only review history in signed-out mode', () => {
    const data = structuredClone(createSeedData())
    data.profile.email = ''
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).reviewEvents
    const out = migrateAcademicsV5(data)
    expect(out.academics.classCenter.reviewEvents).toEqual([])
  })
})
