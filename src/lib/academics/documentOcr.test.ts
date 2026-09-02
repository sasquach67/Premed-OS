import { afterEach, describe, expect, it, vi } from 'vitest'

const tesseract = vi.hoisted(() => ({ createWorker: vi.fn() }))

vi.mock('tesseract.js', () => ({
  createWorker: tesseract.createWorker,
  OEM: { LSTM_ONLY: 1 },
  PSM: { AUTO: 3 },
}))

import { createLocalOcrSession, OCR_STARTUP_TIMEOUT_MS } from './documentOcr'

describe('local OCR startup', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('ends a stalled worker startup instead of leaving document import pending forever', async () => {
    vi.useFakeTimers()
    tesseract.createWorker.mockReturnValue(new Promise(() => {}))

    const session = createLocalOcrSession()
    const rejection = expect(session).rejects.toThrow(/could not start/i)
    await vi.advanceTimersByTimeAsync(OCR_STARTUP_TIMEOUT_MS)

    await rejection
    expect(tesseract.createWorker).toHaveBeenCalledWith('eng', 1, expect.objectContaining({ workerBlobURL: false }))
  })
})
