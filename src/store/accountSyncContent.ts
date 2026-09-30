import type { AppData } from '@/lib/types'
import { dataForRemote } from '@/lib/storyPrivacy'
import { prepareWorkspaceData } from '@/lib/workspaceSchema'

// Stable JSON order is needed because JSONB may reorder object keys.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]))
  return value
}
/** Content identity for sync comparisons. The portable `_schema` marker is version
 *  metadata (the server's `cloud_schema` is authoritative), so it is left out: the
 *  same content hashes exactly as it did before S1 (d60f682), and baselines those
 *  apps recorded stay valid. The version gate still runs first. */
export function syncContent(data: AppData) {
  const { _schema: _marker, ...remote } = dataForRemote(prepareWorkspaceData(data)) as AppData & { _schema?: unknown }
  const settings = { ...remote.settings, backup: undefined }
  return JSON.stringify(canonical({ ...remote, settings }))
}
