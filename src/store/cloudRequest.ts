/** Retry transport failures only. Account/storage guards run outside the retry catch. */
export class CloudRequestError extends Error {
  readonly retryable: boolean
  constructor(message: string, retryable: boolean) { super(message); this.retryable = retryable }
}

function transportError(error: unknown, status?: number) {
  const detail = error && typeof error === 'object' ? error as { message?: unknown; code?: unknown } : undefined
  const message = typeof detail?.message === 'string' ? detail.message : 'Cloud request failed.'
  const retryable = status === 408 || status === 429 || (status !== undefined && status >= 500 && status <= 599)
    || (status === 0 && /fetch|network|connection|timeout/i.test(message))
    || (error instanceof TypeError && /fetch|network|load failed/i.test(message))
    || (typeof detail?.code === 'string' && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(detail.code))
  return new CloudRequestError(message, retryable)
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
