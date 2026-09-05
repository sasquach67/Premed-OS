import { describe, expect, it } from 'vitest'
import { readOpenAIGenerationResponse } from '../../../supabase/functions/_shared/openAIGenerationResponse'

describe('OpenAI generation response boundary', () => {
  it('identifies a token-limited response before attempting to parse partial JSON', async () => {
    await expect(readOpenAIGenerationResponse(new Response(JSON.stringify({
      status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' },
      output: [{ content: [{ type: 'output_text', text: '{"sections":[' }] }],
    })))).rejects.toMatchObject({ code: 'openai-output-limit', rejected: false })
  })

  it.each([
    [429, 'insufficient_quota', 'openai-quota-exhausted'],
    [429, 'rate_limit_exceeded', 'openai-rate-limited'],
    [401, 'invalid_api_key', 'openai-access-denied'],
    [400, 'context_length_exceeded', 'openai-context-limit'],
  ])('classifies HTTP %s with code %s without exposing provider text', async (status, code, expected) => {
    await expect(readOpenAIGenerationResponse(new Response(JSON.stringify({
      error: { code, message: 'private source or credential content' },
    }), { status: Number(status) }))).rejects.toMatchObject({ code: expected, rejected: true })
  })

  it('parses completed output and rejects malformed completed JSON distinctly', async () => {
    const response = (text: string) => new Response(JSON.stringify({
      status: 'completed', output: [{ content: [{ type: 'output_text', text }] }],
    }))
    await expect(readOpenAIGenerationResponse(response('{"title":"DNA"}'))).resolves.toEqual({ title: 'DNA' })
    await expect(readOpenAIGenerationResponse(response('{"private":'))).rejects.toMatchObject({
      code: 'openai-invalid-json', rejected: false,
    })
  })
})
