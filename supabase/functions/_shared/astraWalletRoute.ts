export type BackupLedger = {
  reserve(cents: number): Promise<string | null>
  settle(id: string, cents: number): Promise<void>
}

export type AstraRoute = 'wallet' | 'openai-backup'

export type AstraRouteConfig = {
  openAIKey: string
  walletKey?: string
  ledger: BackupLedger
  /** Aborts the underlying fetch so a step can never outlive its worker. */
  signal?: AbortSignal
  /**
   * Best-effort duplicate-charge protection for a retried request. Sent as the
   * conventional `Idempotency-Key` header; a route that ignores it simply
   * proceeds, so this is a mitigation and NOT the control that bounds paid
   * work — the task lease and the attempt cap are.
   */
  idempotencyKey?: string
}

/** Routing outcomes only. A step that ran out of worker budget raises
 *  `StepTimeoutError` instead; the route itself never times a request out. */
export type AstraRouteErrorCode = 'wallet-unavailable' | 'backup-budget-limit'

/** No provider switch on timeouts, auth failures, invalid output, or rate limits. */
export class AstraRouteError extends Error {
  code: AstraRouteErrorCode
  /** Upstream HTTP status, when the failure had one. Never a response body. */
  status?: number
  /** Provider-side correlation id, safe to log and to show in a support note. */
  requestId?: string
  constructor(code: AstraRouteErrorCode, message: string, detail: { status?: number; requestId?: string } = {}) {
    super(message)
    this.code = code
    this.status = detail.status
    this.requestId = detail.requestId
  }
}

const WALLET_BASE = 'https://api.cheaperinference.com/v1/responses'
const OPENAI_BASE = 'https://api.openai.com/v1/responses'

/**
 * The provider's own correlation id. Recorded so a failed build can be traced
 * with Cheaper Inference or OpenAI without keeping any request or study text.
 */
export function providerRequestId(response: { headers: Headers }): string | undefined {
  for (const header of ['x-request-id', 'x-requestid', 'request-id', 'cf-ray']) {
    const value = response.headers.get(header)
    if (value) return value.slice(0, 120)
  }
  return undefined
}

// Conservative highest input rates (including cache writes), including Astra's long-context surcharge.
// Output tokens include reasoning. Rounded up; never credit cache discounts.
function priceCents(input: number, output: number) {
  return Math.ceil((input * (input > 272_000 ? 25 : 12.5) + output * (input > 272_000 ? 75 : 50)) / 10_000)
}
export function backupReservationCents(payload: Record<string, unknown>) {
  // Text-only API wire bytes upper-bound BPE tokens, with framing allowance.
  // Image requests cannot use this text bound and therefore fail closed below.
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length
  return priceCents(bytes + 8192, Number(payload.max_output_tokens))
}

/** Settled cents for a finished direct-backup response, or undefined when the
 *  outcome is ambiguous and the reservation must be retained. */
export function backupSettlementCents(status: number, usage: unknown): number | undefined {
  const record = usage && typeof usage === 'object' ? usage as Record<string, unknown> : null
  if (record && Number.isInteger(record.input_tokens) && Number(record.input_tokens) >= 0
    && Number.isInteger(record.output_tokens) && Number(record.output_tokens) >= 0) {
    return priceCents(Number(record.input_tokens), Number(record.output_tokens))
  }
  return [400, 401, 402, 403, 404, 429].includes(status) ? 0 : undefined
}

function assertAstraPayload(payload: Record<string, unknown>) {
  if (payload.model !== 'gpt-6-astra' || payload.store !== false) throw new Error('Invalid Astra route request')
}

/**
 * Did the route reject `background` itself, rather than fail?
 *
 * A proxy that does not implement asynchronous responses answers the submit
 * with an unknown-parameter error. That is a capability answer, not an outage,
 * and it must not be mistaken for a broken wallet — the caller falls back to a
 * bounded synchronous call instead of failing the build.
 */
export async function isBackgroundParameterRejection(response: Response) {
  if (![400, 404, 422].includes(response.status)) return false
  const body = await response.clone().json().catch(() => null)
  const error = body && typeof body === 'object' ? (body as Record<string, unknown>).error : null
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const text = `${record.param ?? ''} ${record.message ?? ''} ${record.code ?? ''}`.toLowerCase()
  return text.includes('background')
    || (text.includes('unknown') && text.includes('parameter'))
    || (text.includes('unsupported') && text.includes('parameter'))
}

async function isEmptyWallet(response: Response) {
  if (response.status !== 402) return false
  const error = await response.clone().json().catch(() => null)
  return error?.error?.code === 'insufficient_balance'
}

/**
 * The $10/week direct-OpenAI backup covers only requests whose cost can be
 * bounded up front: bounded output, text-only, no external tool calls.
 */
function assertBackupBoundable(payload: Record<string, unknown>, body: string) {
  const max = payload.max_output_tokens
  if (!Number.isInteger(max) || Number(max) < 1 || Number(max) > 10_000
    || payload.tools !== undefined || /"type"\s*:\s*"(?:input_image|input_file)"/.test(body)) {
    throw new AstraRouteError('backup-budget-limit', 'The wallet is empty. This request cannot be bounded safely for the $10 weekly OpenAI backup allowance.')
  }
}

function poster(body: string | undefined, config: AstraRouteConfig) {
  return (fetcher: typeof fetch, url: string, key: string, method: 'POST' | 'GET') => fetcher(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(config.idempotencyKey && method === 'POST' ? { 'Idempotency-Key': config.idempotencyKey } : {}),
    },
    ...(method === 'POST' ? { body } : {}),
    ...(config.signal ? { signal: config.signal } : {}),
  })
}

export async function postAstraResponse(
  payload: Record<string, unknown>,
  config: AstraRouteConfig,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  assertAstraPayload(payload)
  const body = JSON.stringify(payload)
  const send = poster(body, config)
  const post = (url: string, key: string) => send(fetcher, url, key, 'POST')
  // Until a wallet key is configured, preserve the existing direct connection.
  if (!config.walletKey) return post(OPENAI_BASE, config.openAIKey)
  const wallet = await post(WALLET_BASE, config.walletKey)
  if (wallet.ok) return wallet
  if (!await isEmptyWallet(wallet)) {
    throw new AstraRouteError(
      'wallet-unavailable',
      'Cheaper Inference could not complete this request. No OpenAI backup request was sent.',
      { status: wallet.status, requestId: providerRequestId(wallet) },
    )
  }
  // The spend bound is for bounded text requests with no external tool calls.
  assertBackupBoundable(payload, body)
  const reserved = backupReservationCents(payload)
  const id = await config.ledger.reserve(reserved)
  if (!id) throw new AstraRouteError('backup-budget-limit', 'The wallet is empty and the $10 weekly OpenAI backup allowance cannot cover this request. Top up Cheaper Inference or wait until Monday 00:00 UTC.')
  // Keep the reservation on transport errors or missing usage: work may be billed.
  const direct = await post(OPENAI_BASE, config.openAIKey)
  const data = await direct.clone().json().catch(() => null)
  const cents = backupSettlementCents(direct.status, data?.usage)
  if (cents !== undefined) {
    // A failed accounting write must not turn a billed success into a retry.
    await config.ledger.settle(id, cents).catch(() => { console.error('Astra backup settlement failed; reservation retained') })
  }
  return direct
}

/**
 * Durable path — submit only.
 *
 * The caller sends `background: true`, so the provider returns a response id in
 * seconds and does the multi-minute work on its own infrastructure. That is the
 * whole point: no Edge worker holds an open socket across its wall-clock
 * lifetime, so a retired worker can no longer destroy in-flight generation.
 *
 * Routing policy is unchanged from `postAstraResponse`: Cheaper Inference is
 * primary, and the capped direct-OpenAI backup is reached ONLY on an explicit
 * `insufficient_balance` 402. The reservation id comes back so the poll step
 * can settle real usage once the background response reaches a terminal state.
 */
export async function submitAstraBackgroundResponse(
  payload: Record<string, unknown>,
  config: AstraRouteConfig,
  fetcher: typeof fetch = fetch,
): Promise<{ response: Response; route: AstraRoute; reservationId: string | null }> {
  assertAstraPayload(payload)
  if (payload.background !== true) throw new Error('Invalid Astra background request')
  const body = JSON.stringify(payload)
  const post = (url: string, key: string) => poster(body, config)(fetcher, url, key, 'POST')
  if (!config.walletKey) {
    return { response: await post(OPENAI_BASE, config.openAIKey), route: 'openai-backup', reservationId: null }
  }
  const wallet = await post(WALLET_BASE, config.walletKey)
  if (wallet.ok) return { response: wallet, route: 'wallet', reservationId: null }
  // A route that cannot do background responses is answered, not broken. Hand
  // that rejection back so the caller can fall back rather than fail the build.
  if (await isBackgroundParameterRejection(wallet)) return { response: wallet, route: 'wallet', reservationId: null }
  if (!await isEmptyWallet(wallet)) {
    throw new AstraRouteError(
      'wallet-unavailable',
      'Cheaper Inference could not accept this build. No OpenAI backup request was sent.',
      { status: wallet.status, requestId: providerRequestId(wallet) },
    )
  }
  assertBackupBoundable(payload, body)
  const reservationId = await config.ledger.reserve(backupReservationCents(payload))
  if (!reservationId) throw new AstraRouteError('backup-budget-limit', 'The wallet is empty and the $10 weekly OpenAI backup allowance cannot cover this request. Top up Cheaper Inference or wait until Monday 00:00 UTC.')
  return { response: await post(OPENAI_BASE, config.openAIKey), route: 'openai-backup', reservationId }
}

/** Read one in-flight background response from the route that created it. */
export async function getAstraResponse(
  responseId: string,
  route: AstraRoute,
  config: AstraRouteConfig,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!/^[A-Za-z0-9_.:-]{1,200}$/.test(responseId)) throw new Error('Invalid Astra response id')
  const base = route === 'wallet' ? WALLET_BASE : OPENAI_BASE
  const key = route === 'wallet' ? config.walletKey : config.openAIKey
  if (!key) throw new AstraRouteError('wallet-unavailable', 'The route that started this build is no longer configured.')
  return poster(undefined, config)(fetcher, `${base}/${encodeURIComponent(responseId)}`, key, 'GET')
}

/** Settle the capped backup allowance once a background response is terminal. */
export async function settleAstraBackground(
  reservationId: string,
  status: number,
  usage: unknown,
  ledger: BackupLedger,
) {
  const cents = backupSettlementCents(status, usage)
  if (cents === undefined) return
  await ledger.settle(reservationId, cents).catch(() => { console.error('Astra backup settlement failed; reservation retained') })
}
