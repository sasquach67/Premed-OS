export type BackupLedger = {
  reserve(cents: number): Promise<string | null>
  settle(id: string, cents: number): Promise<void>
}

/** No provider switch on timeouts, auth failures, invalid output, or rate limits. */
export class AstraRouteError extends Error {
  code: 'wallet-unavailable' | 'backup-budget-limit'
  constructor(code: 'wallet-unavailable' | 'backup-budget-limit', message: string) { super(message); this.code = code }
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

export async function postAstraResponse(
  payload: Record<string, unknown>,
  config: { openAIKey: string; walletKey?: string; ledger: BackupLedger },
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (payload.model !== 'gpt-6-astra' || payload.store !== false) throw new Error('Invalid Astra route request')
  const body = JSON.stringify(payload)
  const post = (url: string, key: string) => fetcher(url, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body,
  })
  // Until a wallet key is configured, preserve the existing direct connection.
  if (!config.walletKey) return post('https://api.openai.com/v1/responses', config.openAIKey)
  const wallet = await post('https://api.cheaperinference.com/v1/responses', config.walletKey)
  if (wallet.ok) return wallet
  const error = await wallet.clone().json().catch(() => null)
  if (wallet.status !== 402 || error?.error?.code !== 'insufficient_balance') {
    throw new AstraRouteError('wallet-unavailable', 'Cheaper Inference could not complete this request. No OpenAI backup request was sent.')
  }
  // The spend bound is for bounded text requests with no external tool calls.
  const max = payload.max_output_tokens
  if (!Number.isInteger(max) || Number(max) < 1 || Number(max) > 10_000
    || payload.tools !== undefined || /"type"\s*:\s*"(?:input_image|input_file)"/.test(body)) {
    throw new AstraRouteError('backup-budget-limit', 'The wallet is empty. This request cannot be bounded safely for the $10 weekly OpenAI backup allowance.')
  }
  const reserved = backupReservationCents(payload)
  const id = await config.ledger.reserve(reserved)
  if (!id) throw new AstraRouteError('backup-budget-limit', 'The wallet is empty and the $10 weekly OpenAI backup allowance cannot cover this request. Top up Cheaper Inference or wait until Monday 00:00 UTC.')
  // Keep the reservation on transport errors or missing usage: work may be billed.
  const direct = await post('https://api.openai.com/v1/responses', config.openAIKey)
  const data = await direct.clone().json().catch(() => null)
  const usage = data?.usage
  let cents: number | undefined
  if (Number.isInteger(usage?.input_tokens) && usage.input_tokens >= 0
    && Number.isInteger(usage?.output_tokens) && usage.output_tokens >= 0) {
    cents = priceCents(usage.input_tokens, usage.output_tokens)
  } else if ([400, 401, 402, 403, 404, 429].includes(direct.status)) cents = 0
  if (cents !== undefined) {
    // A failed accounting write must not turn a billed success into a retry.
    await config.ledger.settle(id, cents).catch(() => { console.error('Astra backup settlement failed; reservation retained') })
  }
  return direct
}
