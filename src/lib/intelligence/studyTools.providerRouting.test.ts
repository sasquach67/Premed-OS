import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
const generationStart = source.indexOf("if (body.action === 'generate')")
const generationEnd = source.indexOf('\n  try {', generationStart)
const generationBlock = source.slice(generationStart, generationEnd)

describe('study-tools provider routing', () => {
  it('routes Question Bank V1 to Anthropic only and fails closed', () => {
    expect(generationStart).toBeGreaterThan(-1)
    expect(generationEnd).toBeGreaterThan(generationStart)

    expect(source).toContain("const isQuestionBankGeneration = isGeneration && body.specId === 'unit-question-bank-v1'")
    expect(generationBlock).toContain('const isQuestionBank = isQuestionBankGeneration')
    expect(generationBlock).toContain('callAnthropicGeneration(')
    expect(generationBlock).not.toContain('callOpenAIAudit(')
    expect(generationBlock).not.toContain('using OpenAI fallback')
    expect(generationBlock).toContain('anthropic-unconfigured')
    expect(generationBlock).toContain('anthropic-credit-exhausted')
    expect(generationBlock).toContain('callOpenAIGeneration(')
    expect(generationBlock).toContain('callAnthropicAudit(')
    expect(generationBlock).toContain("Deno.env.get('ANTHROPIC_API_KEY')")
    expect(generationBlock).toContain('primaryProvider')
    expect(generationBlock).toContain('auditStatus')
  })

  it('defaults the single-provider gap check to OpenAI', () => {
    expect(source).toContain("Deno.env.get('AI_PROVIDER') || 'openai'")
  })

  it('keeps the larger question-bank corpus on the Anthropic-only path', () => {
    expect(source).toContain('const MAX_QUESTION_BANK_CHUNKS = 1_000')
    expect(source).toContain('const MAX_QUESTION_BANK_SOURCE_CHARS = 700_000')
    expect(source).toContain("const isQuestionBankSync = body.purpose === 'unit-question-bank'")
    expect(source).toContain('{ embed: !isQuestionBankSync }')
    expect(source).toContain('isQuestionBankGeneration ? MAX_QUESTION_BANK_CHUNKS : MAX_CHUNKS')
    expect(source).toContain('CHUNK_RETRIEVAL_BATCH_SIZE')
    expect(source).toContain('isQuestionBankGeneration && chunks.length !== chunkIds.length')
    expect(source).toContain("type: 'web_search_20250305'")
    expect(source).toContain("allowed_domains: ['apcentral.collegeboard.org', 'ocw.mit.edu']")
    expect(source).toContain('primary.webSearchRequests < 1')
    expect(source).toContain('validateQuestionBankVisualSources(body.visualSources)')
    expect(source).toContain("type: 'image'")
    expect(source).toContain('visualSourceFileIds: isQuestionBank')
  })
})
