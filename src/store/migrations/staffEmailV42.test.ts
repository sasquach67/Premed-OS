import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateStaffEmailV42 } from './staffEmailV42'

describe('migrateStaffEmailV42', () => {
  it('clears professor emails copied onto TAs while preserving real TA and shared-team addresses', () => {
    const legacy = structuredClone(createSeedData())
    const courseId = legacy.academics.classCenter.workspaces[0].courseId
    legacy.academics.classCenter.contacts = [
      { id: 'prof', courseId, name: 'Professor', role: 'professor', email: 'Professor@unc.edu', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'copied', courseId, name: 'Copied TA', role: 'TA', email: 'professor@unc.edu', createdAt: 1, updatedAt: 1, order: 1 },
      { id: 'real', courseId, name: 'Real TA', role: 'TA', email: 'real-ta@unc.edu', createdAt: 1, updatedAt: 1, order: 2 },
      { id: 'team', courseId, name: 'Team TA', role: 'TA', email: 'teaching-team@unc.edu', createdAt: 1, updatedAt: 1, order: 3 },
    ]

    const out = migrateStaffEmailV42(legacy)
    expect(out.academics.classCenter.contacts.find((contact) => contact.id === 'prof')?.email).toBe('Professor@unc.edu')
    expect(out.academics.classCenter.contacts.find((contact) => contact.id === 'copied')?.email).toBeUndefined()
    expect(out.academics.classCenter.contacts.find((contact) => contact.id === 'real')?.email).toBe('real-ta@unc.edu')
    expect(out.academics.classCenter.contacts.find((contact) => contact.id === 'team')?.email).toBe('teaching-team@unc.edu')
    expect(migrateStaffEmailV42(out)).toBe(out)
  })
})
