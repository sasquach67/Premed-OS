/** Retry transport failures only. Account/storage guards run outside the retry catch. */
export class CloudRequestError extends Error {
  readonly retryable: boolean
  readonly status?: number
  constructor(message: string, retryable: boolean, options?: ErrorOptions & { status?: number }) {
    super(message, options); this.name = 'CloudRequestError'; this.retryable = retryable; this.status = options?.status
  }
}

/** Storage SDK errors carry HTTP status separately from their sometimes textual statusCode. */
export function cloudErrorStatus(error: unknown, responseStatus?: number): number | undefined {
  const detail = error && typeof error === 'object' ? error as { status?: unknown; statusCode?: unknown } : undefined
  for (const value of [responseStatus, detail?.status, detail?.statusCode]) {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d{3}$/.test(value))) continue
    const status = Number(value)
    if (Number.isInteger(status) && (status === 0 || status >= 100 && status <= 599)) return status
  }
}
function networkError(error: unknown): boolean {
  const detail = error && typeof error === 'object' ? error as { code?: unknown; name?: unknown; originalError?: unknown } : undefined
  if (detail?.name === 'StorageUnknownError') return networkError(detail.originalError)
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message)
    || typeof detail?.code === 'string' && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(detail.code)
}
function transportError(error: unknown, responseStatus?: number) {
  if (error instanceof CloudRequestError) return error
  const detail = error && typeof error === 'object' ? error as { message?: unknown } : undefined
  const message = typeof detail?.message === 'string' ? detail.message : 'Cloud request failed.'
  const status = cloudErrorStatus(error, responseStatus)
  const retryable = status === 408 || status === 429 || (status !== undefined && status >= 500 && status <= 599)
    || ((status === undefined || status === 0) && (networkError(error) || status === 0 && /fetch|network|connection|timeout/i.test(message)))
  return new CloudRequestError(message, retryable, { cause: error, status })
}

/** Callers must use reads or conditional writes, then check freshness after recording any server acknowledgement. */
export async function cloudRequest<T extends { error?: unknown; status?: number }>(
  request: () => PromiseLike<T>,
  assertFresh: () => void | Promise<void>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await assertFresh()
    let result: T | undefined, failure: CloudRequestError | undefined
    try {
      result = await request()
      if (result.error) failure = transportError(result.error, result.status)
    } catch (error) { failure = transportError(error) }
    if (!failure) return result!
    await assertFresh()
    if (!failure.retryable || attempt === 3) throw failure
    await new Promise(resolve => setTimeout(resolve, 2000 * 2 ** attempt))
  }
}
