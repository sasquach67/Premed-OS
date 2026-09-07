import { describe, expect, it, vi } from 'vitest'
import { postAstraResponse, backupReservationCents, getAstraResponse, settleAstraBackground, submitAstraBackgroundResponse } from '../../../supabase/functions/_shared/astraWalletRoute'
const payload = { model: 'gpt-6-astra', store: false, max_output_tokens: 10000, input: 'Synthetic test content.' }
const emptyWallet = () => new Response(JSON.stringify({error:{code:'insufficient_balance'}}),{status:402})
function setup() {
  const ledger = {reserve:vi.fn(async()=> 'reservation-1'),settle:vi.fn(async()=>{})}
  return {ledger, config:{openAIKey:'direct-test-only',walletKey:'wallet-test-only',ledger}}
}
describe('Astra wallet routing',()=>{
  it('uses the wallet only on success, retaining the selected model and payload',async()=>{
    const {config,ledger}=setup();const fetcher=vi.fn<typeof fetch>(async()=>new Response('{}'))
    await postAstraResponse(payload,config,fetcher)
    expect(fetcher).toHaveBeenCalledOnce();expect(fetcher.mock.calls[0]).toEqual(['https://api.cheaperinference.com/v1/responses',expect.objectContaining({body:JSON.stringify(payload)})]);expect(ledger.reserve).not.toHaveBeenCalled()
  })
  it('reserves before exactly one direct retry on explicit empty wallet, then settles usage',async()=>{
    const {config,ledger}=setup();let calls=0
    const fetcher=vi.fn<typeof fetch>(async()=>++calls===1?emptyWallet():new Response(JSON.stringify({usage:{input_tokens:1000,output_tokens:1000}})))
    await postAstraResponse(payload,config,fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2);expect(ledger.reserve).toHaveBeenCalledWith(backupReservationCents(payload));expect(ledger.settle).toHaveBeenCalledWith('reservation-1',7)
    expect(ledger.reserve.mock.invocationCallOrder[0]).toBeLessThan(fetcher.mock.invocationCallOrder[1])
  })
  it.each([401,403,429,500,502,503])('never falls back for HTTP %s',async status=>{
    const {config,ledger}=setup();const fetcher=vi.fn<typeof fetch>(async()=>new Response('{}',{status}))
    await expect(postAstraResponse(payload,config,fetcher)).rejects.toMatchObject({code:'wallet-unavailable'});expect(fetcher).toHaveBeenCalledOnce();expect(ledger.reserve).not.toHaveBeenCalled()
  })
  it('does not mistake another 402 reason or network timeout for empty funds',async()=>{
    const {config,ledger}=setup()
    await expect(postAstraResponse(payload,config,vi.fn(async()=>new Response('{"error":{"code":"payment_required"}}',{status:402})))).rejects.toThrow()
    const fetcher=vi.fn<typeof fetch>(async()=>{throw new Error('timeout')});await expect(postAstraResponse(payload,config,fetcher)).rejects.toThrow('timeout');expect(fetcher).toHaveBeenCalledOnce();expect(ledger.reserve).not.toHaveBeenCalled()
  })
  it('blocks direct spending when the atomic ledger refuses',async()=>{
    const {config,ledger}=setup();ledger.reserve.mockResolvedValue(null as never);const fetcher=vi.fn<typeof fetch>(async()=>emptyWallet())
    await expect(postAstraResponse(payload,config,fetcher)).rejects.toMatchObject({code:'backup-budget-limit'});expect(fetcher).toHaveBeenCalledOnce()
  })
  it('retains reservations after ambiguous direct transport failure',async()=>{
    const {config,ledger}=setup();let calls=0;const fetcher=vi.fn<typeof fetch>(async()=>{if(++calls===1)return emptyWallet();throw new Error('timeout')})
    await expect(postAstraResponse(payload,config,fetcher)).rejects.toThrow();expect(ledger.settle).not.toHaveBeenCalled();expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('preserves direct routing before a wallet key is configured',async()=>{
    const {config,ledger}=setup();const fetcher=vi.fn<typeof fetch>(async()=>new Response('{}'))
    await postAstraResponse(payload,{...config,walletKey:undefined},fetcher);expect(fetcher.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');expect(ledger.reserve).not.toHaveBeenCalled()
  })
  it('refuses unbounded image backup without blocking the first wallet attempt',async()=>{
    const {config,ledger}=setup();const fetcher=vi.fn<typeof fetch>(async()=>emptyWallet())
    await expect(postAstraResponse({...payload,input:[{type:'input_image'}]},config,fetcher)).rejects.toMatchObject({code:'backup-budget-limit'});expect(fetcher).toHaveBeenCalledOnce();expect(ledger.reserve).not.toHaveBeenCalled()
  })
})

/**
 * The durable submit reuses the same routing policy as the synchronous call.
 * That is the point of these: adding background mode must not quietly widen the
 * $10/week direct-OpenAI backup, which activates only on an explicit empty
 * wallet, and never on a timeout, an auth failure, or a rate limit.
 */
describe('Astra background routing', () => {
  const background = { ...payload, background: true }

  it('submits to the wallet and reports the route, reserving nothing', async () => {
    const { config, ledger } = setup()
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: 'resp_1', status: 'queued' })))
    const result = await submitAstraBackgroundResponse(background, config, fetcher)
    expect(result.route).toBe('wallet')
    expect(result.reservationId).toBeNull()
    expect(fetcher.mock.calls[0][0]).toBe('https://api.cheaperinference.com/v1/responses')
    expect(ledger.reserve).not.toHaveBeenCalled()
  })

  it.each([401, 403, 429, 500, 503])('never reaches the paid backup on HTTP %s', async status => {
    const { config, ledger } = setup()
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}', { status, headers: { 'x-request-id': 'req_1' } }))
    await expect(submitAstraBackgroundResponse(background, config, fetcher))
      .rejects.toMatchObject({ code: 'wallet-unavailable', status, requestId: 'req_1' })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(ledger.reserve).not.toHaveBeenCalled()
  })

  it('reserves before the one direct retry on an explicit empty wallet', async () => {
    const { config, ledger } = setup()
    let calls = 0
    const fetcher = vi.fn<typeof fetch>(async () => ++calls === 1
      ? emptyWallet()
      : new Response(JSON.stringify({ id: 'resp_1', status: 'queued' })))
    const result = await submitAstraBackgroundResponse(background, config, fetcher)
    expect(result.route).toBe('openai-backup')
    expect(result.reservationId).toBe('reservation-1')
    expect(ledger.reserve).toHaveBeenCalledWith(backupReservationCents(background))
    // Settlement waits for the terminal poll, when real usage is known.
    expect(ledger.settle).not.toHaveBeenCalled()
  })

  it('refuses a request the weekly allowance cannot bound', async () => {
    const { config, ledger } = setup()
    const fetcher = vi.fn<typeof fetch>(async () => emptyWallet())
    await expect(submitAstraBackgroundResponse({ ...background, tools: [{ type: 'web_search' }] }, config, fetcher))
      .rejects.toMatchObject({ code: 'backup-budget-limit' })
    expect(ledger.reserve).not.toHaveBeenCalled()
  })

  it('polls the route that created the response, and refuses a forged id', async () => {
    const { config } = setup()
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}'))
    await getAstraResponse('resp_1', 'wallet', config, fetcher)
    expect(fetcher.mock.calls[0][0]).toBe('https://api.cheaperinference.com/v1/responses/resp_1')
    await getAstraResponse('resp_1', 'openai-backup', config, fetcher)
    expect(fetcher.mock.calls[1][0]).toBe('https://api.openai.com/v1/responses/resp_1')
    await expect(getAstraResponse('../../admin', 'wallet', config, fetcher)).rejects.toThrow('Invalid Astra response id')
  })

  it('settles the allowance from real usage once the response is terminal', async () => {
    const { ledger } = setup()
    await settleAstraBackground('reservation-1', 200, { input_tokens: 1000, output_tokens: 1000 }, ledger)
    expect(ledger.settle).toHaveBeenCalledWith('reservation-1', 7)
  })

  it('retains the reservation when usage is unknown, because the work may be billed', async () => {
    const { ledger } = setup()
    await settleAstraBackground('reservation-1', 200, undefined, ledger)
    expect(ledger.settle).not.toHaveBeenCalled()
  })

  it('carries an abort signal into the request, so no call outlives its worker', async () => {
    const { config } = setup()
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: 'resp_1', status: 'queued' })))
    await submitAstraBackgroundResponse(background, { ...config, signal: controller.signal }, fetcher)
    expect(fetcher.mock.calls[0][1]).toMatchObject({ signal: controller.signal })
  })

  it('keeps the model and no-store invariants', async () => {
    const { config } = setup()
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}'))
    await expect(submitAstraBackgroundResponse({ ...background, model: 'gpt-4o' }, config, fetcher)).rejects.toThrow('Invalid Astra route request')
    await expect(submitAstraBackgroundResponse({ ...background, store: true }, config, fetcher)).rejects.toThrow('Invalid Astra route request')
    await expect(submitAstraBackgroundResponse(payload, config, fetcher)).rejects.toThrow('Invalid Astra background request')
  })
})
