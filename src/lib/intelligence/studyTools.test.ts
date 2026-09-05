import { describe, expect, it } from 'vitest'
import { createStudyToolsClient, isGapCheckResult, studySourceFingerprint } from './studyTools'

describe('study tools boundary', () => {
  it('keeps a zero-Supabase clone fully deterministic and offline', async () => {
    const result = await createStudyToolsClient(null).gapCheck({
      action: 'gap-check',
      courseId: 'course-1',
      topicId: 'topic-1',
      evidence: { text: 'My recall' },
      chunkIds: ['chunk-1'],
    })
    expect(result).toEqual({
      ok: false,
      code: 'unconfigured',
      message: 'AI study tools are not configured. Local study workflows remain available.',
    })
  })

  it('keeps source content out of the generation request', async () => {
    const requests: unknown[] = []
    const client = {
      auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) },
      functions: {
        invoke: async (_name: string, options: { body: unknown }) => {
          requests.push(options.body)
          return { data: { covered: [], missed: [], wrong: [], suggestedGrade: 'good' }, error: null }
        },
      },
    }
    const result = await createStudyToolsClient(client as never).gapCheck({
      action: 'gap-check', courseId: 'course-1', topicId: 'topic-1', evidence: { text: 'Recall' }, chunkIds: ['chunk-1'],
    })
    expect(result.ok).toBe(true)
    expect(requests).toEqual([{
      action: 'gap-check', courseId: 'course-1', topicId: 'topic-1', evidence: { text: 'Recall' }, chunkIds: ['chunk-1'],
    }])
    expect(JSON.stringify(requests)).not.toContain('source content')
  })

  it('sends a bounded recording only to the transcription action', async () => {
    const requests: unknown[] = []
    const client = {
      auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) },
      functions: {
        invoke: async (_name: string, options: { body: unknown }) => {
          requests.push(options.body)
          return { data: { transcript: 'ATP transfers energy.' }, error: null }
        },
      },
    }
    const result = await createStudyToolsClient(client as never).transcribeResponse({
      action: 'transcribe-response', courseId: 'course-1', topicId: 'topic-1',
      audio: { name: 'recall.webm', mimeType: 'audio/webm', size: 3, dataBase64: 'YWJj' },
    })
    expect(result).toEqual({ ok: true, data: { transcript: 'ATP transfers energy.' } })
    expect(requests).toEqual([{
      action: 'transcribe-response', courseId: 'course-1', topicId: 'topic-1',
      audio: { name: 'recall.webm', mimeType: 'audio/webm', size: 3, dataBase64: 'YWJj' },
    }])
  })

  it('fingerprints content changes without storing the content itself', () => {
    const first = studySourceFingerprint([{ chunkId: 'c', fileId: 'f', content: 'alpha', start: 0, end: 5 }])
    const second = studySourceFingerprint([{ chunkId: 'c', fileId: 'f', content: 'omega', start: 0, end: 5 }])
    expect(first).not.toBe(second)
    expect(first).not.toContain('alpha')
  })

  it('rejects malformed model output instead of accepting prose', () => {
    expect(isGapCheckResult('Looks good!')).toBe(false)
    expect(isGapCheckResult({ covered: [], missed: [], wrong: [], suggestedGrade: 'great' })).toBe(false)
  })

  it('surfaces exhausted Anthropic credits without falling back', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) },
      functions: { invoke: async () => ({ data: null, error: { context: { status: 402 } } }) },
    }
    const result = await createStudyToolsClient(client as never).generate({
      action: 'generate', courseId: 'course-1', topicId: 'topic-1', chunkIds: ['chunk-1'],
      specId: 'unit-question-bank-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Generate a bank.',
    })
    expect(result).toEqual({
      ok: false,
      code: 'anthropic-credit-exhausted',
      message: 'Anthropic credits are exhausted. Add credits before generating another question bank.',
    })
  })

  it('surfaces the independent reviewer reason for a rejected artifact', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) },
      functions: {
        invoke: async () => ({
          data: null,
          error: {
            context: {
              status: 502,
              clone: () => ({
                json: async () => ({
                  error: {
                    code: 'audit-rejected',
                    message: 'The secondary review found a source or specification problem.',
                    issues: ['A required section is missing.'],
                  },
                }),
              }),
            },
          },
        }),
      },
    }

    const result = await createStudyToolsClient(client as never).generate({
      action: 'generate', courseId: 'course-1', topicId: 'topic-1', chunkIds: ['chunk-1'],
      specId: 'study-guide-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Generate a guide.',
    })

    expect(result).toEqual({
      ok: false,
      code: 'audit-rejected',
      message: 'The independent provider review found a source or format problem. Nothing was saved. Review note: A required section is missing.',
    })
  })

  it('shows the exact shared-budget limit and reset time from the server', async () => {
    const resetAt = '2026-09-07T04:00:00.000Z'
    const client = {
      auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) },
      functions: {
        invoke: async () => ({
          data: null,
          error: {
            context: {
              status: 429,
              clone: () => ({
                json: async () => ({
                  error: {
                    code: 'weekly-budget-limit',
                    message: 'The shared beta AI budget is used for this week.',
                    resetAt,
                  },
                }),
              }),
            },
          },
        }),
      },
    }
    const result = await createStudyToolsClient(client as never).generate({
      action: 'generate', courseId: 'course-1', topicId: 'topic-1', chunkIds: ['chunk-1'],
      specId: 'unit-question-bank-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Generate a bank.',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('weekly-budget-limit')
      expect(result.message).toContain('shared beta AI budget')
      expect(result.message).toContain('resets')
    }
  })

  it('accepts only typed results with valid material ranges', () => {
    expect(isGapCheckResult({
      covered: [{ text: 'ATP is used', citation: { kind: 'material', fileId: 'f', chunkId: 'c', start: 4, end: 12 } }],
      missed: [],
      wrong: [],
      suggestedGrade: 'good',
    })).toBe(true)
  })
})
