import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateAcademicsEvidenceV27 } from './academicsEvidenceV27'

describe('migrateAcademicsEvidenceV27', () => {
  it('adds only empty v27 homes to a frozen v26 store', () => {
    const legacy = structuredClone(createSeedData()) as any
    delete legacy.academics.classCenter.professorEvidence
    delete legacy.academics.classCenter.conceptCanvases
    delete legacy.academics.classCenter.assessmentMaterials
    delete legacy.academics.classCenter.assessmentAttempts
    delete legacy.academics.classCenter.transcriptRecords
    Object.freeze(legacy)
    Object.freeze(legacy.academics)
    Object.freeze(legacy.academics.classCenter)
    const out = migrateAcademicsEvidenceV27(legacy)
    expect(out.academics.classCenter.professorEvidence).toEqual([])
    expect(out.academics.classCenter.conceptCanvases).toEqual([])
    expect(out.academics.classCenter.assessmentMaterials).toEqual([])
    expect(out.academics.classCenter.assessmentAttempts).toEqual([])
    expect(out.academics.classCenter.transcriptRecords).toEqual([])
    expect(out.courses).toEqual(legacy.courses)
    expect(out.academics.classCenter.topics).toBe(legacy.academics.classCenter.topics)
  })

  it('maps legacy blanked losslessly and is idempotent', () => {
    const legacy = structuredClone(createSeedData()) as any
    legacy.academics.classCenter.mistakes = [{
      id: 'mistake-1', courseId: 'course-1', label: 'Forgot the unit', cause: 'blanked',
      note: 'kept', createdAt: 1, updatedAt: 2, order: 0,
    }]
    const once = migrateAcademicsEvidenceV27(legacy)
    expect(once.academics.classCenter.mistakes[0]).toMatchObject({
      id: 'mistake-1', note: 'kept', cause: 'knew-it-but-blanked',
    })
    expect(migrateAcademicsEvidenceV27(once)).toBe(once)
  })
})
