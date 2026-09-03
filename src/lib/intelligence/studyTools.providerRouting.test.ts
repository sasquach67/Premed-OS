import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
const generationStart = source.indexOf("if (body.action === 'generate')")
const generationEnd = source.indexOf('\n  try {', generationStart)
const generationBlock = source.slice(generationStart, generationEnd)

describe('study-tools provider routing', () => {
  it('uses OpenAI for primary generation and Anthropic only for optional review', () => {
    expect(generationStart).toBeGreaterThan(-1)
    expect(generationEnd).toBeGreaterThan(generationStart)

    const openAIPrimary = generationBlock.indexOf('callOpenAIGeneration(')
    const anthropicReview = generationBlock.indexOf('callAnthropicAudit(')

    expect(openAIPrimary).toBeGreaterThan(-1)
    expect(anthropicReview).toBeGreaterThan(openAIPrimary)
    expect(generationBlock).toContain("Deno.env.get('ANTHROPIC_API_KEY')")
    expect(generationBlock).toContain('auditStatus')
  })

  it('defaults the single-provider gap check to OpenAI', () => {
    expect(source).toContain("Deno.env.get('AI_PROVIDER') || 'openai'")
  })
})
