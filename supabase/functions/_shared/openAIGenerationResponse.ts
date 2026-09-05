/** Keep response diagnostics separate from source text and provider error messages. */
export class OpenAIGenerationResponseError extends Error {
  readonly code: string
  readonly rejected: boolean
  constructor(code: string, message: string, rejected = false) {
    super(message)
    this.name = 'OpenAIGenerationResponseError'
    this.code = code
    this.rejected = rejected
  }
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}

export async function readOpenAIGenerationResponse(response: Response): Promise<unknown> {
  let payload: Record<string, unknown>
  try {
    payload = record(await response.json())
  } catch {
    throw new OpenAIGenerationResponseError('openai-invalid-response', 'OpenAI returned an unreadable response.', !response.ok)
  }
  if (!response.ok) {
    const code = record(payload.error).code
    if (code === 'insufficient_quota') {
      throw new OpenAIGenerationResponseError('openai-quota-exhausted', 'The app’s OpenAI account has reached its credit or spending limit.', true)
    }
    if (response.status === 429) {
      throw new OpenAIGenerationResponseError('openai-rate-limited', 'OpenAI temporarily rate-limited this build. Wait a minute before retrying.', true)
    }
    if ([401, 403, 404].includes(response.status)) {
      throw new OpenAIGenerationResponseError('openai-access-denied', 'The app’s OpenAI credential or model access needs attention.', true)
    }
    if (code === 'context_length_exceeded') {
      throw new OpenAIGenerationResponseError('openai-context-limit', 'The build exceeds the configured AI model’s input limit.', true)
    }
    throw new OpenAIGenerationResponseError('openai-request-rejected', `OpenAI rejected the build request (HTTP ${response.status}).`, true)
  }
  if (payload.status === 'incomplete') {
    const reason = record(payload.incomplete_details).reason
    throw new OpenAIGenerationResponseError(
      reason === 'max_output_tokens' ? 'openai-output-limit' : 'openai-incomplete',
      reason === 'max_output_tokens'
        ? 'The generated document exceeded the build’s output limit before it finished.'
        : 'OpenAI stopped before completing the document.',
    )
  }
  if (payload.status === 'failed') {
    throw new OpenAIGenerationResponseError('openai-response-failed', 'OpenAI accepted the request but failed to complete the document.')
  }
  const blocks = Array.isArray(payload.output)
    ? payload.output.flatMap(item => Array.isArray(record(item).content) ? record(item).content as unknown[] : [])
    : []
  if (blocks.some(block => record(block).type === 'refusal')) {
    throw new OpenAIGenerationResponseError('openai-refused', 'OpenAI declined this generation request.')
  }
  const text = typeof payload.output_text === 'string' ? payload.output_text : blocks
    .filter(block => ['output_text', 'text'].includes(String(record(block).type)))
    .map(block => typeof record(block).text === 'string' ? record(block).text : '').join('')
  if (!text.trim()) {
    throw new OpenAIGenerationResponseError('openai-empty-output', 'OpenAI returned no document text.')
  }
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  try {
    try { return JSON.parse(cleaned) } catch {
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start < 0 || end <= start) throw new Error('No object')
      return JSON.parse(cleaned.slice(start, end + 1))
    }
  } catch {
    throw new OpenAIGenerationResponseError('openai-invalid-json', 'OpenAI returned a document with invalid formatting.')
  }
}
