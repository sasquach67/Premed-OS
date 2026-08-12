import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateClassTypesV10 } from './classTypesV10'

describe('class types v10', () => {
  it('adds view types and writing containers without removing existing study records', () => {
    const data = createSeedData()
    const english = data.courses.find((course) => course.code === 'ENGL 105')!
    const biology = data.courses.find((course) => course.code === 'BIOL 103')!
    const englishWorkspace = data.academics.classCenter.workspaces.find((workspace) => workspace.courseId === english.id)!
    const biologyWorkspace = data.academics.classCenter.workspaces.find((workspace) => workspace.courseId === biology.id)!
    delete (englishWorkspace as Partial<typeof englishWorkspace>).type
    delete (biologyWorkspace as Partial<typeof biologyWorkspace>).type
    const beforeTopics = structuredClone(data.academics.classCenter.topics)

    const migrated = migrateClassTypesV10(data)

    expect(migrated.academics.classCenter.workspaces.find((workspace) => workspace.courseId === english.id)?.type).toBe('writing')
    expect(migrated.academics.classCenter.workspaces.find((workspace) => workspace.courseId === biology.id)?.type).toBe('stem')
    expect(migrated.academics.classCenter.topics).toEqual(beforeTopics)
    expect(migrated.academics.classCenter.paperDrafts).toEqual([])
    expect(migrated.academics.classCenter.assignedReadings).toEqual([])
    expect(migrated.academics.classCenter.feedbackNotes).toEqual([])
  })

  it('is idempotent and does not mutate frozen input', () => {
    const data = createSeedData()
    Object.freeze(data.academics.classCenter.workspaces)
    Object.freeze(data.academics.classCenter)
    Object.freeze(data.academics)
    const once = migrateClassTypesV10(data)
    expect(() => migrateClassTypesV10(data)).not.toThrow()
    expect(migrateClassTypesV10(once)).toEqual(once)
  })
})
