import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
const generationStart = source.indexOf("if (body.action === 'generate')")
const generationEnd = source.indexOf('\n  try {', generationStart)
const generationBlock = source.slice(generationStart, generationEnd)

describe('study-tools provider routing', () => {
  it('routes Question Bank V1 to Anthropic primary with an OpenAI audit and safe fallback', () => {
    expect(generationStart).toBeGreaterThan(-1)
    expect(generationEnd).toBeGreaterThan(generationStart)

    expect(generationBlock).toContain("body.specId === 'unit-question-bank-v1'")
    expect(generationBlock).toContain('callAnthropicGeneration(')
    expect(generationBlock).toContain('callOpenAIAudit(')
    expect(generationBlock).toContain('using OpenAI fallback')
    expect(generationBlock).toContain('callOpenAIGeneration(')
    expect(generationBlock).toContain('callAnthropicAudit(')
    expect(generationBlock).toContain("Deno.env.get('ANTHROPIC_API_KEY')")
    expect(generationBlock).toContain('primaryProvider')
    expect(generationBlock).toContain('auditStatus')
  })

  it('defaults the single-provider gap check to OpenAI', () => {
    expect(source).toContain("Deno.env.get('AI_PROVIDER') || 'openai'")
  })
})
