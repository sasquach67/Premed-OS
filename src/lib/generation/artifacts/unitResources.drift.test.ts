import { describe, expect, it } from 'vitest'
import masterySpecDocument from '../../../../premed-hq-documentation/specifications/generation/11-unit-mastery-outline-v1.md?raw'
import questionBankSpecDocument from '../../../../premed-hq-documentation/specifications/generation/12-unit-question-bank-v1.md?raw'
import blueprintSpecDocument from '../../../../premed-hq-documentation/specifications/generation/13-course-question-blueprints.md?raw'
import { UNIT_MASTERY_OUTLINE_V1 } from './unitMasteryOutline.v1'
import { UNIT_QUESTION_BANK_V1 } from './unitQuestionBank.v1'
import { ARTIFACT_REGISTRY } from './registry'
import { blueprintForCourse } from '@/lib/academics/unitQuestionBank'

function markdownRuleIds(document: string) {
  return [...document.matchAll(/^\| `(UMO|UQB)-[A-Z-]+` \|/gm)].map((match) => match[0].match(/`([^`]+)`/)![1])
}

describe('unit resource specs stay synchronized with their Markdown authorities', () => {
  it('keeps the mastery outline rules and registry entry in lockstep', () => {
    expect(markdownRuleIds(masterySpecDocument)).toEqual(UNIT_MASTERY_OUTLINE_V1.rules.map((rule) => rule.id))
    expect(masterySpecDocument).toContain(UNIT_MASTERY_OUTLINE_V1.objective)
    expect(ARTIFACT_REGISTRY['unit-mastery-outline-v1']).toBe(UNIT_MASTERY_OUTLINE_V1)
  })

  it('keeps the question bank rules and registry entry in lockstep', () => {
    expect(markdownRuleIds(questionBankSpecDocument)).toEqual(UNIT_QUESTION_BANK_V1.rules.map((rule) => rule.id))
    expect(questionBankSpecDocument).toContain(UNIT_QUESTION_BANK_V1.objective)
    expect(ARTIFACT_REGISTRY['unit-question-bank-v1']).toBe(UNIT_QUESTION_BANK_V1)
  })

  it('keeps course blueprint defaults and moves visible in the Markdown authority', () => {
    const biology = blueprintForCourse({ code: 'BIOL 103', title: 'How Cells Function' })
    const psychology = blueprintForCourse({ code: 'PSYC 101', title: 'Introduction to Psychology' })
    expect(blueprintSpecDocument).toContain('| `courseStyle` | `biology` |')
    expect(blueprintSpecDocument).toContain('| `defaultCurrentUnitPercent` | `70` |')
    expect(blueprintSpecDocument).toContain('| `defaultIntegrationPercent` | `30` |')
    expect(blueprintSpecDocument).toContain(biology.moves.join(', '))
    expect(blueprintSpecDocument).toContain('| `courseStyle` | `psychology` |')
    expect(blueprintSpecDocument).toContain('| `defaultCurrentUnitPercent` | `100` |')
    expect(blueprintSpecDocument).toContain(psychology.moves.join(', '))
    expect(biology.defaultCurrentUnitPercent).toBe(70)
    expect(biology.defaultIntegrationPercent).toBe(30)
    expect(psychology.defaultCurrentUnitPercent).toBe(100)
    expect(psychology.defaultIntegrationPercent).toBe(0)
  })
})
