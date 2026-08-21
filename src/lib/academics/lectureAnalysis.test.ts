import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: null }))

import { analyzeLectureTranscript } from './lectureAnalysis'

describe('lecture analysis caller', () => {
  it('keeps the local-only recovery explicit when no server integration is configured', async () => {
    await expect(analyzeLectureTranscript({ courseId: 'course', chunks: [] })).resolves.toEqual({
      ok: false,
      failure: 'unconfigured',
      message: 'Lecture analysis is not configured. Your transcript remains available locally.',
    })
  })
})
