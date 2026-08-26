import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateOverviewV13 } from '@/store/migrations/overviewV13'

describe('migrateOverviewV13 approved quarterly-goal types', () => {
  it('preserves cumulative and period goals across hydration', () => {
    const data = createSeedData()
    data.quarterlyGoals = [
      {
        id: 'cumulative', quarter: 'Current term', text: 'Reach 100 clinical hours',
        done: false, kind: 'cumulative', standingTarget: 'clinical', order: 0,
      },
      {
        id: 'period', quarter: 'Current term', text: 'Complete 150 questions each week',
        done: false, kind: 'period', currentValue: 132, targetValue: 150,
        unit: 'questions', periodLabel: 'Current week', evidenceLabel: 'Practice log', order: 1,
      },
    ]

    expect(migrateOverviewV13(data)).toBe(data)
  })
})
