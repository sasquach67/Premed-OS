/** JSONB cannot store NUL or unpaired UTF-16 surrogates, even as JSON escapes.
 * Keep affected workspaces as escaped JSON text; decode before any app validation,
 * comparison or restoration. Ordinary rows retain their existing shape. */
const FORMAT = 'premed-os-dashboard-json-text-v1'
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
function needsEncoding(value: unknown): boolean {
  // Unicode mode matches lone surrogates, but leaves valid emoji pairs alone.
  if (typeof value === 'string') return value.includes('\u0000') || /[\uD800-\uDFFF]/u.test(value)
  return !!value && typeof value === 'object' && Object.entries(value).some(([key, item]) => needsEncoding(key) || needsEncoding(item))
}
function encode(value: unknown): unknown {
  return needsEncoding(value) ? { format: FORMAT, json: JSON.stringify(value) } : value
}
function decode(value: unknown): unknown {
  if (!record(value) || value.format !== FORMAT) return value
  if (typeof value.json !== 'string' || Object.keys(value).length !== 2) throw new Error('The cloud workspace encoding is invalid. Nothing was restored.')
  return JSON.parse(value.json)
}
function rows(value: unknown, transform: (data: unknown) => unknown): unknown {
  if (Array.isArray(value)) return value.map(row => rows(row, transform))
  if (!record(value) || !Object.hasOwn(value, 'data')) return value
  const data = transform(value.data)
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
      const encoded = rows(original, encode)
      if (encoded !== original) {
        const headers = new Headers(outgoing.headers)
        headers.delete('content-length')
        outgoing = new Request(outgoing, { headers, body: JSON.stringify(encoded) })
      }
    }
    const response = await request(outgoing)
    if (!response.ok || response.status === 204 || outgoing.method === 'HEAD' || !response.headers.get('content-type')?.includes('json')) return response
    const original: unknown = await response.clone().json()
    const decoded = rows(original, decode)
    if (decoded === original) return response
    const headers = new Headers(response.headers)
    headers.delete('content-length'); headers.delete('content-encoding')
    return new Response(JSON.stringify(decoded), { status: response.status, statusText: response.statusText, headers })
  }
}
