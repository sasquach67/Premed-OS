/** JSONB cannot store NUL or unpaired UTF-16 surrogates, even as JSON escapes.
 * Keep affected workspaces as escaped JSON text; decode before any app validation,
 * comparison or restoration. Ordinary rows retain their existing shape. */
const FORMAT = 'premed-os-dashboard-json-text-v1'
const COMPRESSED_FORMAT = 'premed-os-dashboard-gzip-v1'
const MAX_DECODED_BYTES = 256 * 1024 * 1024
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
function needsEncoding(value: unknown): boolean {
  // Unicode mode matches lone surrogates, but leaves valid emoji pairs alone.
  if (typeof value === 'string') return value.includes('\u0000') || /[\uD800-\uDFFF]/u.test(value)
  return !!value && typeof value === 'object' && Object.entries(value).some(([key, item]) => needsEncoding(key) || needsEncoding(item))
}
function base64(bytes: Uint8Array): string {
  const parts: string[] = []
  for (let offset = 0; offset < bytes.length; offset += 32768) parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)))
  return btoa(parts.join(''))
}
async function encode(value: unknown): Promise<unknown> {
  const json = JSON.stringify(value)
  if (json && json.length >= 1024 * 1024) {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
    return { format: COMPRESSED_FORMAT, gzip: base64(bytes) }
  }
  return needsEncoding(value) ? { format: FORMAT, json } : value
}
async function decode(value: unknown): Promise<unknown> {
  if (!record(value)) return value
  if (value.format === COMPRESSED_FORMAT) {
    if (typeof value.gzip !== 'string' || Object.keys(value).length !== 2 || value.gzip.length > MAX_DECODED_BYTES * 2) throw new Error('The compressed cloud workspace is invalid. Nothing was restored.')
    const binary = atob(value.gzip)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
    const chunks: Uint8Array<ArrayBuffer>[] = []
    let size = 0
    try {
      for (;;) {
        const { value: chunk, done } = await reader.read()
        if (done) break
        size += chunk.byteLength
        if (size > MAX_DECODED_BYTES) throw new Error('The cloud workspace exceeds the supported recovery size. Nothing was restored.')
        chunks.push(chunk)
      }
    } finally { await reader.cancel(); reader.releaseLock() }
    return JSON.parse(await new Blob(chunks).text())
  }
  if (value.format !== FORMAT) return value
  if (typeof value.json !== 'string' || Object.keys(value).length !== 2) throw new Error('The cloud workspace encoding is invalid. Nothing was restored.')
  return JSON.parse(value.json)
}
async function rows(value: unknown, transform: (data: unknown) => Promise<unknown>): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(row => rows(row, transform)))
  if (!record(value) || !Object.hasOwn(value, 'data')) return value
  const data = await transform(value.data)
  return data === value.data ? value : { ...value, data }
}

/** Cover every SDK dashboard read/write, including first-login and recovery paths.
 * Authentication, file uploads, other tables and conditional-write filters are untouched. */
export function createDashboardFetch(databaseUrl: string, request: typeof fetch = fetch): typeof fetch {
  const endpoint = new URL('/rest/v1/dashboards', databaseUrl)
  return async (input, init) => {
    const address = new URL(input instanceof Request ? input.url : String(input))
    if (address.origin !== endpoint.origin || address.pathname !== endpoint.pathname) return request(input, init)
    let outgoing = new Request(input, init)
    if (['POST', 'PATCH', 'PUT'].includes(outgoing.method)) {
      const original: unknown = await outgoing.clone().json()
      const encoded = await rows(original, encode)
      if (encoded !== original) {
        const headers = new Headers(outgoing.headers)
        headers.delete('content-length')
        outgoing = new Request(outgoing, { headers, body: JSON.stringify(encoded) })
      }
    }
    const response = await request(outgoing)
    if (!response.ok || response.status === 204 || outgoing.method === 'HEAD' || !response.headers.get('content-type')?.includes('json')) return response
    const original: unknown = await response.clone().json()
    const decoded = await rows(original, decode)
    if (decoded === original) return response
    const headers = new Headers(response.headers)
    headers.delete('content-length'); headers.delete('content-encoding')
    return new Response(JSON.stringify(decoded), { status: response.status, statusText: response.statusText, headers })
  }
}
