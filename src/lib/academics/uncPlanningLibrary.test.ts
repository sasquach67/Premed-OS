import { describe, expect, it } from 'vitest'
import { candidatePlanCoverage, UNC_PLANNING_LIBRARY, planningRequirementOutcome, planningRequirementSet } from './uncPlanningLibrary'

describe('UNC planning library', () => {
  it('keeps every record source-versioned and non-computational', () => {
    expect(UNC_PLANNING_LIBRARY).toHaveLength(46)
    for (const requirementSet of UNC_PLANNING_LIBRARY) {
      expect(requirementSet.catalogYear).toBe('2026-2027')
      expect(requirementSet.retrievedAt).toBe('2026-08-25')
      expect(requirementSet.sourceUrl).toMatch(/^https:\/\/catalog\.unc\.edu\//)
      expect(requirementSet.nodes.length).toBeGreaterThan(0)
      expect(planningRequirementOutcome(requirementSet)).toBe('official-audit-required')
      expect(requirementSet.nodes.every((node) => node.evaluation === 'official-audit-required')).toBe(true)
    }
  })

  it('labels a local neuroscience course as candidate-plan context, never completion', () => {
    const neuroscience = planningRequirementSet('neuroscience-bs')!
    const intro = candidatePlanCoverage(neuroscience, ['NSCI 175']).find((item) => item.node.id === 'intro')!
    const methods = candidatePlanCoverage(neuroscience, ['NSCI 175']).find((item) => item.node.id === 'methods')!
    expect(intro.state).toBe('scheduled')
    expect(intro.detail).toContain('not official fulfillment')
    expect(methods.state).toBe('manual-review')
  })

  it('keeps tracks and source gaps separate from a generic program', () => {
    expect(planningRequirementSet('nutrition-bsph-health-society')?.trackOrConcentration).toBe('Nutrition, Health and Society')
    expect(planningRequirementSet('nutrition-bsph-science-research')?.trackOrConcentration).toBe('Nutrition Science and Research')
    expect(planningRequirementSet('health-policy-management-bsph')?.sourceStatus).toBe('source-validated')
    expect(planningRequirementSet('psychology-bs')?.manualReview).toContain('PSYC/NSCI 45-hour cap')
  })
})
