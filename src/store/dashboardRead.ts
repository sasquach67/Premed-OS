/** Store-free read shared by normal sync and the pre-hydration recovery screen. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppData } from '@/lib/types'
import { assertSupportedRemote, cloudClaim, type CloudClaim } from '@/lib/workspaceSchema'
import { validateAppData } from '@/lib/validateAppData'
import { cloudRequest } from './cloudRequest'

export const DASHBOARD_SELECT = 'data, updated_at, cloud_schema, write_rev'
export type RemoteDashboard = { data: AppData; updatedAt: string; claim: CloudClaim | null }
export function parseDashboardRow(row: Record<string, unknown>): RemoteDashboard {
  const claim = cloudClaim(row)
  if (typeof row.updated_at !== 'string' || !row.updated_at) throw new Error('The cloud copy has no usable revision. Nothing was replaced.')
  assertSupportedRemote(row.data, claim)
  if (validateAppData(row.data).length) throw new Error('The cloud copy has an invalid structure. Nothing was replaced and sync is paused.')
  return { data: row.data, updatedAt: row.updated_at, claim }
}
export function readDashboardRow(client: SupabaseClient, userId: string, assertFresh: () => void | Promise<void>) {
  return cloudRequest(() => client.from('dashboards').select(DASHBOARD_SELECT).eq('user_id', userId).maybeSingle(), assertFresh)
}
export async function readDashboardForBootRecovery(client: SupabaseClient, userId: string, assertFresh: () => void | Promise<void>) {
  const { data, error } = await readDashboardRow(client, userId, assertFresh)
  await assertFresh()
  if (error) throw error
  return data?.data ? parseDashboardRow(data as Record<string, unknown>) : null
}
