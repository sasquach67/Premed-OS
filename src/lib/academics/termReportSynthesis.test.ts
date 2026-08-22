import { describe, expect, it } from 'vitest'
import { validateTermReportArtifact } from '@/lib/academics/termReportSynthesis'

const allowed = new Set(['course:chem', 'mistake:chem', 'review-event:chem'])
const valid = () => ({
  takeaways: [
    { title: 'Returned-work record', text: 'You saved two trouble spots from CHEM 262 returned work.', evidenceIds: ['mistake:chem'] },
    { title: 'Review record', text: 'Your saved CHEM 262 review history covers three topics.', evidenceIds: ['review-event:chem'] },
  ],
  experiments: [{ title: 'Try next term', text: 'You could try a short returned-work check before reopening notes.', evidenceIds: ['mistake:chem'] }],
  limit: 'This report reads only the records you saved.',
})

describe('validateTermReportArtifact', () => {
  it('accepts a bounded artifact whose refs are in the submitted snapshot', () => {
    expect(validateTermReportArtifact(valid(), allowed)).toBe(true)
  })

  it('rejects unsupported local refs', () => {
    const artifact = valid()
    artifact.takeaways[0].evidenceIds = ['made-up']
    expect(validateTermReportArtifact(artifact, allowed)).toBe(false)
  })

  it('rejects causal claims rather than softening them', () => {
    const artifact = valid()
    artifact.takeaways[0].text = 'Retrieval practice improved your CHEM grade.'
    expect(validateTermReportArtifact(artifact, allowed)).toBe(false)
  })

  it('rejects a block without evidence', () => {
    const artifact = valid()
    artifact.experiments[0].evidenceIds = []
    expect(validateTermReportArtifact(artifact, allowed)).toBe(false)
  })
})
