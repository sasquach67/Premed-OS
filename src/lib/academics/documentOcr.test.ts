import { afterEach, describe, expect, it, vi } from 'vitest'

const tesseract = vi.hoisted(() => ({ createWorker: vi.fn() }))

vi.mock('tesseract.js', () => ({
  createWorker: tesseract.createWorker,
  OEM: { LSTM_ONLY: 1 },
  PSM: { AUTO: 3 },
}))

import { createLocalOcrSession, OCR_OPERATION_TIMEOUT_MS, OCR_STARTUP_TIMEOUT_MS } from './documentOcr'

describe('local OCR startup', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('ends stalled image recognition so later files in the import can continue', async () => {
    vi.useFakeTimers()
    const worker = { setParameters: vi.fn().mockResolvedValue(undefined), recognize: vi.fn(() => new Promise(() => {})), terminate: vi.fn().mockResolvedValue(undefined) }
    tesseract.createWorker.mockResolvedValue(worker)
    const session = await createLocalOcrSession()
    const recognition = session.recognizeImage(new Blob(['image']))
    const rejection = expect(recognition).rejects.toThrow(/too long/i)
    await vi.advanceTimersByTimeAsync(OCR_OPERATION_TIMEOUT_MS)
    await rejection
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('cancels recognition immediately instead of waiting for the OCR worker', async () => {
    const worker = { setParameters: vi.fn().mockResolvedValue(undefined), recognize: vi.fn(() => new Promise(() => {})), terminate: vi.fn().mockResolvedValue(undefined) }
    tesseract.createWorker.mockResolvedValue(worker)
    const controller = new AbortController()
    const session = await createLocalOcrSession(undefined, controller.signal)
    const rejection = expect(session.recognizeImage(new Blob(['image']))).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejection
    await session.terminate()
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('releases the worker when configuration fails after startup', async () => {
    const worker = { setParameters: vi.fn().mockRejectedValue(new Error('Worker configuration failed')), terminate: vi.fn().mockResolvedValue(undefined) }
    tesseract.createWorker.mockResolvedValue(worker)
    await expect(createLocalOcrSession()).rejects.toThrow(/configuration failed/)
    expect(worker.terminate).toHaveBeenCalledOnce()
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
