import { afterEach, expect, it, vi } from 'vitest'
import { cloudRequest, CloudRequestError } from './cloudRequest'

afterEach(() => vi.useRealTimers())
it('backs off and bounds repeated server failures', async () => {
  vi.useFakeTimers()
  const request = vi.fn(async () => ({ error: { message: 'Server unavailable' }, status: 503 }))
  const work = cloudRequest(request, () => {})
  const failed = expect(work).rejects.toMatchObject({ message: 'Server unavailable', retryable: true })
  await vi.advanceTimersByTimeAsync(1999); expect(request).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1); expect(request).toHaveBeenCalledTimes(2)
  await vi.advanceTimersByTimeAsync(12_000); await failed
  expect(request).toHaveBeenCalledTimes(4)
})
it('does not retry authorization, validation, or unknown application errors', async () => {
  for (const status of [400, 401, 403, 409, 422]) {
    const request = vi.fn(async () => ({ status, error: { message: 'Rejected' } }))
    await expect(cloudRequest(request, () => {})).rejects.toMatchObject({ retryable: false })
    expect(request).toHaveBeenCalledTimes(1)
  }
  const request = vi.fn(async () => { throw new Error('Invalid saved image') })
  await expect(cloudRequest(request, () => {})).rejects.toMatchObject({ retryable: false })
  expect(request).toHaveBeenCalledTimes(1)
})
it('checks account ownership again after waiting, before any retry request', async () => {
  vi.useFakeTimers(); let changed = false
  const request = vi.fn(async () => ({ status: 500, error: { message: 'Temporary' } }))
  const work = cloudRequest(request, () => { if (changed) throw new Error('Account changed') })
  const failed = expect(work).rejects.toThrow('Account changed')
  await vi.advanceTimersByTimeAsync(1); changed = true
  await vi.advanceTimersByTimeAsync(2000); await failed
  expect(request).toHaveBeenCalledTimes(1)
})
it('recovers from fetch failures but never retries a failed freshness guard', async () => {
  vi.useFakeTimers()
  const request = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue({ error: null, data: 'saved' })
  const work = cloudRequest(request, () => {})
  await vi.advanceTimersByTimeAsync(2000)
  expect(await work).toEqual({ error: null, data: 'saved' })
  const guard = () => { throw new CloudRequestError('Guard failure', true) }
  await expect(cloudRequest(request, guard)).rejects.toThrow('Guard failure')
  expect(request).toHaveBeenCalledTimes(2)
})
