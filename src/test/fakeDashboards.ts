/* Test double for `supabase.from('dashboards')` with PostgREST semantics that
 * matter to S1: a write assigns only the columns it sends, filters are eq/is,
 * zero matched rows is `data: null`, and the S1 write guard from
 * supabase/migrations/*_s1_dashboard_write_guard.sql runs on every insert and
 * update. Rows seeded without the columns are unclaimed (both NULL). */
export type FakeRow = { user_id: string; data: unknown; updated_at: string; cloud_schema?: number | null; write_rev?: number | null }
export type FakeDashboardsState = {
  rows: Map<string, unknown>
  /** Delay a read of one account until the promise settles. */
  pending?: Map<string, Promise<unknown>>
  /** Each write attempt consumes one queued failure before touching the row. */
  failures?: Array<{ status: number; error: Record<string, unknown> }>
  /** Called with the columns a write sent and the row (user id) it changed. */
  writes?: (value: unknown, userId: string) => void
  attempts?: () => void
  /** Commit the write, then fail its response (a lost acknowledgement). */
  loseResponses?: number
  /** Simulates the migration not being applied yet. */
  missingColumns?: boolean
}

const MAX_REV = Number.MAX_SAFE_INTEGER
export const S1_GUARD_ERROR = { code: 'P0001', details: 'S1_SCHEMA_GUARD', message: 'This tab is out of date. Your recent changes are still on this device. Export them, then reopen Premed OS.', hint: null }
const S1_COLUMNS = ['cloud_schema', 'write_rev']

/** Mirrors public.guard_dashboard_write(). Returns a rejection reason or null. */
export function s1GuardRejects(before: FakeRow | undefined, after: FakeRow): string | null {
  const legacy = (row: FakeRow) => (row.cloud_schema ?? null) === null && (row.write_rev ?? null) === null
  const claimed = (row: FakeRow) => Number.isInteger(row.cloud_schema) && row.cloud_schema! >= 1 && row.cloud_schema! <= 2147483647
    && Number.isSafeInteger(row.write_rev) && row.write_rev! >= 1 && row.write_rev! <= MAX_REV
  if (!before || legacy(before)) return legacy(after) || (claimed(after) && after.write_rev === 1) ? null : 'unclaimed row accepts only a legacy write or a first claim'
  if (!claimed(before)) return 'stored version metadata is invalid'
  return claimed(after) && after.write_rev === before.write_rev! + 1 && after.cloud_schema! >= before.cloud_schema! ? null : 'claimed row requires write_rev = previous + 1'
}

function columns(list: string | undefined) {
  return !list || list.trim() === '*' ? null : list.split(',').map(column => column.trim())
}
function project(row: FakeRow, list: string[] | null) {
  const full: Record<string, unknown> = { ...row, cloud_schema: row.cloud_schema ?? null, write_rev: row.write_rev ?? null }
  return list ? Object.fromEntries(list.map(column => [column, full[column]])) : full
}
function missing(state: FakeDashboardsState, list: string[] | null, values?: Record<string, unknown>) {
  if (!state.missingColumns) return null
  const used = [...(list ?? []), ...Object.keys(values ?? {})].find(column => S1_COLUMNS.includes(column))
  return used ? { status: 400, error: { code: values ? 'PGRST204' : '42703', details: null, hint: null, message: values ? `Could not find the '${used}' column of 'dashboards' in the schema cache` : `column dashboards.${used} does not exist` } } : null
}

export function fakeDashboardsTable(state: FakeDashboardsState) {
  return {
    select(list?: string) {
      const wanted = columns(list)
      const filters: Array<(row: FakeRow) => boolean> = []
      let userId: string | undefined
      const query = {
        eq(column: string, value: unknown) { if (column === 'user_id') userId = value as string; filters.push(row => (row as Record<string, unknown>)[column] === value); return query },
        async maybeSingle() {
          const failure = missing(state, wanted)
          if (failure) return { data: null, ...failure }
          const row = await (userId !== undefined && state.pending?.get(userId) || state.rows.get(userId!)) as FakeRow | undefined
          return { data: row && filters.every(test => test({ ...row, user_id: userId! })) ? project({ ...row, user_id: userId! }, wanted) : null, error: null, status: 200 }
        },
      }
      return query
    },
    update(values: Record<string, unknown>) {
      const filters: Array<(row: FakeRow) => boolean> = []
      let userId: string | undefined, wanted: string[] | null = null
      const query = {
        eq(column: string, value: unknown) {
          if (column === 'user_id') userId = value as string
          filters.push(row => column === 'updated_at' ? typeof value === 'string' && Date.parse(row.updated_at) === Date.parse(value) : (row as Record<string, unknown>)[column] === value)
          return query
        },
        is(column: string, value: null) { filters.push(row => ((row as Record<string, unknown>)[column] ?? null) === value); return query },
        select(list?: string) { wanted = columns(list); return query },
        async maybeSingle() {
          state.attempts?.()
          const failure = state.failures?.shift() ?? missing(state, wanted, values)
          if (failure) return { data: null, ...failure }
          const stored = state.rows.get(userId!) as FakeRow | undefined
          const current = stored && { ...stored, user_id: userId!, cloud_schema: stored.cloud_schema ?? null, write_rev: stored.write_rev ?? null }
          if (!current || !filters.every(test => test(current))) return { data: null, error: null, status: 200 }
          const next = { ...current, ...values } as FakeRow
          if (s1GuardRejects(current, next)) return { data: null, status: 400, error: { ...S1_GUARD_ERROR } }
          state.writes?.(values, userId!); state.rows.set(userId!, next)
          if (state.loseResponses && state.loseResponses-- > 0) return { data: null, status: 0, error: { message: 'TypeError: Failed to fetch' } }
          return { data: project(next, wanted), error: null, status: 200 }
        },
      }
      return query
    },
    insert(values: FakeRow) {
      let wanted: string[] | null = null
      const run = async () => {
        state.attempts?.()
        const failure = state.failures?.shift() ?? missing(state, wanted, values as unknown as Record<string, unknown>)
        if (failure) return { data: null, ...failure }
        if (state.rows.has(values.user_id)) return { data: null, status: 409, error: { code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "dashboards_pkey"' } }
        const next = { cloud_schema: null, write_rev: null, ...values }
        if (s1GuardRejects(undefined, next)) return { data: null, status: 400, error: { ...S1_GUARD_ERROR } }
        state.writes?.(values, values.user_id); state.rows.set(values.user_id, next)
        if (state.loseResponses && state.loseResponses-- > 0) return { data: null, status: 0, error: { message: 'TypeError: Failed to fetch' } }
        return { data: wanted ? project(next, wanted) : null, error: null, status: 201 }
      }
      const query = {
        select(list?: string) { wanted = columns(list); return query },
        maybeSingle: run,
        then<T>(resolve: (value: Awaited<ReturnType<typeof run>>) => T, reject?: (reason: unknown) => T) { return run().then(resolve, reject) },
      }
      return query
    },
  }
}

/** A claimed row as a current app leaves it: marker and column agree. */
export function claimedRow(data: Record<string, unknown>, updatedAt: string, writeRev = 1, cloudSchema = 1): FakeRow {
  return { user_id: '', data: { ...data, _schema: cloudSchema }, updated_at: updatedAt, cloud_schema: cloudSchema, write_rev: writeRev }
}
