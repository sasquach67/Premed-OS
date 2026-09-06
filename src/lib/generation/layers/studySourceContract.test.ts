import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { STUDY_SOURCE_CONTRACT } from './studySourceContract'
import { assembleGenerationRequest } from '../assemble'
import { lectureSourcePriorityInstruction } from '../../academics/lectureSourcePriority'

it.each(['study-guide-v1', 'unit-mastery-outline-v1', 'notebook-assessment-v1', 'notebook-assignment-v1'])('%s receives the actual Markdown amendment and explicit source roles', (specId) => {
  const document = readFileSync('premed-hq-documentation/specifications/generation/19-study-source-and-format-contract.md', 'utf8').trim()
  expect(STUDY_SOURCE_CONTRACT).toBe(document)
  const request = assembleGenerationRequest({ specId, chunkIds: ['transcript', 'notes'], request: lectureSourcePriorityInstruction(['transcript'], ['notes']) })
  expect(request.systemPrompt).toContain(document)
  expect(request.systemPrompt).toContain('Instructor evidence chunk IDs: transcript.')
  expect(request.systemPrompt).toContain('Personal class-note chunk IDs: notes.')
})
