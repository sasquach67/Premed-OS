import { describe, expect, it } from 'vitest'
import gapCheckDocument from '../../../../premed-hq-documentation/specifications/generation/14-gap-check-v1.md?raw'
import studyGuideDocument from '../../../../premed-hq-documentation/specifications/generation/03-study-guide-v1.md?raw'
import flashcardsDocument from '../../../../premed-hq-documentation/specifications/generation/04-flashcards-v1.md?raw'
import revisedNotesDocument from '../../../../premed-hq-documentation/specifications/generation/15-revised-notes-v1.md?raw'
import classFullMockDocument from '../../../../premed-hq-documentation/specifications/generation/16-class-full-mock-v1.md?raw'
import termReportDocument from '../../../../premed-hq-documentation/specifications/generation/17-term-report-v1.md?raw'
import masteryMapDocument from '../../../../premed-hq-documentation/specifications/generation/11-unit-mastery-outline-v1.md?raw'
import questionBankDocument from '../../../../premed-hq-documentation/specifications/generation/12-unit-question-bank-v1.md?raw'
import { assembleGenerationRequest } from '@/lib/generation/assemble'
import { ARTIFACT_REGISTRY } from './registry'

const briefings = {
  'gap-check-v1': { path: 'premed-hq-documentation/specifications/generation/14-gap-check-v1.md', document: gapCheckDocument },
  'study-guide-v1': { path: 'premed-hq-documentation/specifications/generation/03-study-guide-v1.md', document: studyGuideDocument },
  'flashcards-v1': { path: 'premed-hq-documentation/specifications/generation/04-flashcards-v1.md', document: flashcardsDocument },
  'revised-notes-v1': { path: 'premed-hq-documentation/specifications/generation/15-revised-notes-v1.md', document: revisedNotesDocument },
  'class-full-mock-v1': { path: 'premed-hq-documentation/specifications/generation/16-class-full-mock-v1.md', document: classFullMockDocument },
  'term-report-v1': { path: 'premed-hq-documentation/specifications/generation/17-term-report-v1.md', document: termReportDocument },
  'unit-mastery-outline-v1': { path: 'premed-hq-documentation/specifications/generation/11-unit-mastery-outline-v1.md', document: masteryMapDocument },
  'unit-question-bank-v1': { path: 'premed-hq-documentation/specifications/generation/12-unit-question-bank-v1.md', document: questionBankDocument },
} as const

function normalized(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

describe('registered generators keep a Markdown briefing in lockstep', () => {
  it('has exactly one briefing for every registered API artifact', () => {
    expect(Object.keys(briefings).sort()).toEqual(Object.keys(ARTIFACT_REGISTRY).sort())
  })

  it.each(Object.entries(ARTIFACT_REGISTRY))('%s names and mirrors its briefing', (specId, spec) => {
    const briefing = briefings[specId as keyof typeof briefings]
    expect(briefing).toBeDefined()
    expect(spec.authorityDocument).toBe(briefing.path)
    expect(briefing.document).toContain(specId)
    expect(normalized(briefing.document)).toContain(normalized(spec.objective))
    for (const rule of spec.rules) {
      expect(briefing.document).toContain(`\`${rule.id}\``)
      expect(normalized(briefing.document)).toContain(normalized(rule.text))
    }
    const assembled = assembleGenerationRequest({ specId, chunkIds: ['source-chunk'] })
    expect(assembled.systemPrompt).toContain(`Versioned briefing: ${briefing.path}`)
  })
})

