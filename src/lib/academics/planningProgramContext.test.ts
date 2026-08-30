import { describe, expect, it } from 'vitest'
import { validatePlanningProgramContext } from './planningProgramContext'

describe('Planning program context write validation', () => {
  it('trims and timestamps an explicit source-backed selection', () => {
    expect(validatePlanningProgramContext({
      selectedProgramId: ' neuroscience-bs ',
      matriculationTerm: ' Fall 2026 ',
      ideasCatalogYear: ' 2026-2027 ',
    }, 42)).toEqual({
      ok: true,
      errors: [],
      value: {
        selectedProgramId: 'neuroscience-bs',
        matriculationTerm: 'Fall 2026',
        ideasCatalogYear: '2026-2027',
        updatedAt: 42,
      },
    })
  })

  it('keeps an empty first-use context genuinely empty', () => {
    expect(validatePlanningProgramContext({}, 42)).toEqual({ ok: true, errors: [], value: {} })
  })

  it('rejects unknown program ids and unsupported admission context', () => {
    expect(validatePlanningProgramContext({ selectedProgramId: 'made-up-major' }).ok).toBe(false)
    expect(validatePlanningProgramContext({
      selectedProgramId: 'neuroscience-bs',
      gillingsAdmissionTerm: 'Fall 2027',
    }).errors).toContain('Admission-term context is only accepted for a program with a recorded admission gate.')
  })

  it('accepts admission context for an admission-gated program', () => {
    const result = validatePlanningProgramContext({
      selectedProgramId: 'nutrition-bsph-science-research',
      gillingsAdmissionTerm: 'Fall 2027',
      programAdmissionStatus: 'planning',
    }, 99)
    expect(result.ok).toBe(true)
    expect(result.value?.updatedAt).toBe(99)
  })
})
