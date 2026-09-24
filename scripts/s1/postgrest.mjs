// S1 Revision 3: real local auth + PostgREST HTTP matrix. Disposable stack only.
// Synthetic admin-created users (no email is sent); all are deleted in `finally`.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
if (process.env.S1_LOCAL_CONFIRMED !== 'yes') throw new Error('Set S1_LOCAL_CONFIRMED=yes only for the disposable local stack')
const status = JSON.parse(readFileSync(new URL('./local/status.json', import.meta.url), 'utf8'))
const api = status.API_URL
assert.equal(api, 'http://127.0.0.1:55431', 'Refuse every non-isolated destination')
const { ANON_KEY: anon, SERVICE_ROLE_KEY: service } = status
assert.ok(anon && service, 'Expected local status keys')

async function request(path, method = 'GET', body, token = service, headers = {}) {
  const response = await fetch(api + path, { method, redirect: 'error', headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}
const results = []
const pass = label => { results.push(label); console.log(`PASS | ${label}`) }
const row = (user, path = `/rest/v1/dashboards?user_id=eq.${user.id}&select=data,updated_at,cloud_schema,write_rev`) => request(path, 'GET', undefined, user.token).then(r => r.body[0] ?? null)
const RETURN = { Prefer: 'return=representation' }
const guardRejected = (response, label) => {
  assert.equal(response.status, 400, `${label}: status ${response.status} ${JSON.stringify(response.body)}`)
  assert.equal(response.body.code, 'P0001'); assert.equal(response.body.details, 'S1_SCHEMA_GUARD')
  assert.match(response.body.message, /^This tab is out of date\. Your recent changes are still on this device\. Export them, then reopen Premed OS\.$/)
}
async function unchanged(user, before, label) { assert.deepEqual(await row(user), before, `${label}: row changed`) }

const users = []
async function newUser() {
  const email = `s1-http-${randomUUID()}@example.invalid`, password = randomUUID() + randomUUID()
  const created = await request('/auth/v1/admin/users', 'POST', { email, password, email_confirm: true })
  assert.equal(created.status, 200)
  const user = { id: created.body.id }; users.push(user)
  const login = await request('/auth/v1/token?grant_type=password', 'POST', { email, password }, anon)
  assert.equal(login.status, 200)
  user.token = login.body.access_token
  return user
}

try {
  const [a, b, c, d] = [await newUser(), await newUser(), await newUser(), await newUser()]
  const path = user => `/rest/v1/dashboards?user_id=eq.${user.id}`
  const legacyDoc = { profile: { name: 'Synthetic' }, notes: { a: 'legacy' }, futureCollection: [{ id: 'kept' }] }

  // Schema cache: the API already serves the new columns after the migration's NOTIFY.
  const cache = await request('/rest/v1/dashboards?select=cloud_schema,write_rev&limit=0', 'GET', undefined, a.token)
  assert.equal(cache.status, 200); pass('PostgREST schema cache serves cloud_schema/write_rev')

  // ---- Deployed-app request shapes on an unclaimed row: unchanged behavior ----
  let r = await request('/rest/v1/dashboards', 'POST', { user_id: a.id, data: legacyDoc, updated_at: '2026-01-01T00:00:00+00:00' }, a.token)
  assert.equal(r.status, 201); pass('old-app INSERT {user_id, data, updated_at} creates an unclaimed row')
  r = await request(`${path(a)}&updated_at=eq.${encodeURIComponent('2026-01-01T00:00:00+00:00')}&select=updated_at`, 'PATCH', { data: { ...legacyDoc, notes: { a: 'old edit' } }, updated_at: '2026-01-02T00:00:00+00:00' }, a.token, RETURN)
  assert.equal(r.status, 200); assert.equal(r.body.length, 1); pass('old-app conditional PATCH on an unclaimed row still succeeds')
  let before = await row(a)
  assert.equal(before.cloud_schema, null); assert.equal(before.write_rev, null); pass('unclaimed row reads back both columns NULL')

  // ---- The conditional first claim through the API ----
  r = await request(`${path(a)}&updated_at=eq.${encodeURIComponent('2026-01-01T00:00:00+00:00')}&cloud_schema=is.null&write_rev=is.null&select=data,updated_at,cloud_schema,write_rev`, 'PATCH',
    { data: { ...before.data, _schema: 1 }, updated_at: '2026-01-03T00:00:00+00:00', cloud_schema: 1, write_rev: 1 }, a.token, RETURN)
  assert.equal(r.status, 200); assert.deepEqual(r.body, []); pass('claim on a stale reviewed timestamp matches 0 rows (reconcile, not an error)')
  r = await request(`${path(a)}&updated_at=eq.${encodeURIComponent(before.updated_at)}&cloud_schema=is.null&write_rev=is.null&select=data,updated_at,cloud_schema,write_rev`, 'PATCH',
    { data: { ...before.data, _schema: 1 }, updated_at: '2026-01-03T00:00:00+00:00', cloud_schema: 1, write_rev: 1 }, a.token, RETURN)
  assert.equal(r.status, 200); assert.equal(r.body[0].cloud_schema, 1); assert.equal(r.body[0].write_rev, 1)
  assert.deepEqual(r.body[0].data, { ...before.data, _schema: 1 }); pass('conditional first claim returns the claimed metadata and exactly the reviewed document + _schema')
  before = await row(a)

  // ---- Every old/non-conforming shape is rejected on a claimed row, row unchanged ----
  r = await request(`${path(a)}&updated_at=eq.${encodeURIComponent(before.updated_at)}&select=updated_at`, 'PATCH', { data: { notes: { a: 'old tab drops sections' } }, updated_at: '2026-02-01T00:00:00+00:00' }, a.token, RETURN)
  guardRejected(r, 'old PATCH'); await unchanged(a, before, 'old PATCH'); pass('old-app PATCH {data, updated_at} on a claimed row: 400 P0001 S1_SCHEMA_GUARD, row unchanged')
  r = await request(path(a), 'PATCH', { data: { format: 'premed-os-dashboard-gzip-v1', gzip: 'H4sIAAAAAAAAA6uuBQBDv6ajAgAAAA==' }, updated_at: '2026-02-01T00:00:00+00:00' }, a.token)
  guardRejected(r, 'old gzip PATCH'); await unchanged(a, before, 'old gzip'); pass('old-app PATCH with a gzip-encoded payload: rejected, row unchanged')
  r = await request(path(a), 'PATCH', { data: { format: 'premed-os-dashboard-json-text-v1', json: '{}' }, updated_at: '2026-02-01T00:00:00+00:00' }, a.token)
  guardRejected(r, 'old text PATCH'); await unchanged(a, before, 'old text'); pass('old-app PATCH with a text-JSON payload: rejected, row unchanged')
  r = await request(path(a), 'PATCH', { data: {}, updated_at: '2026-02-01T00:00:00+00:00', cloud_schema: null, write_rev: null }, a.token)
  guardRejected(r, 'explicit NULLs'); await unchanged(a, before, 'nulls'); pass('PATCH sending NULL columns (unclaim): rejected, row unchanged')
  r = await request(path(a), 'PATCH', { cloud_schema: null, write_rev: null }, a.token)
  guardRejected(r, 'metadata-only unclaim'); await unchanged(a, before, 'meta unclaim'); pass('metadata-only unclaim: rejected')
  r = await request(path(a), 'PATCH', { write_rev: before.write_rev }, a.token)
  guardRejected(r, 'same counter'); pass('metadata-only PATCH with the same counter: rejected')
  r = await request('/rest/v1/dashboards?on_conflict=user_id', 'POST', { user_id: a.id, data: {}, updated_at: '2026-02-02T00:00:00+00:00' }, a.token, { Prefer: 'resolution=merge-duplicates' })
  guardRejected(r, 'merge upsert omitted'); await unchanged(a, before, 'upsert omitted'); pass('synthetic merge-duplicates upsert omitting columns: rejected, row unchanged')
  r = await request('/rest/v1/dashboards?on_conflict=user_id', 'POST', { user_id: a.id, data: {}, updated_at: '2026-02-02T00:00:00+00:00', cloud_schema: null, write_rev: null }, a.token, { Prefer: 'resolution=merge-duplicates' })
  guardRejected(r, 'merge upsert nulls'); await unchanged(a, before, 'upsert nulls'); pass('synthetic merge-duplicates upsert sending NULLs: rejected')
  r = await request('/rest/v1/dashboards?on_conflict=user_id&columns=user_id,data,updated_at,cloud_schema,write_rev', 'POST', { user_id: a.id, data: {}, updated_at: '2026-02-02T00:00:00+00:00' }, a.token, { Prefer: 'resolution=merge-duplicates, missing=default' })
  guardRejected(r, 'merge upsert defaults'); await unchanged(a, before, 'upsert defaults'); pass('synthetic merge-duplicates upsert with missing=default: rejected')

  // ---- Compare-and-set, races and the two-new-writers case ----
  const cas = (user, current, data, at) => request(`${path(user)}&updated_at=eq.${encodeURIComponent(current.updated_at)}&cloud_schema=eq.${current.cloud_schema}&write_rev=eq.${current.write_rev}&select=data,updated_at,cloud_schema,write_rev`, 'PATCH',
    { data, updated_at: at, cloud_schema: 1, write_rev: current.write_rev + 1 }, user.token, RETURN)
  const racers = await Promise.all([cas(a, before, { ...before.data, notes: { a: 'writer one' } }, '2026-03-01T00:00:00.001+00:00'), cas(a, before, { ...before.data, notes: { a: 'writer two' } }, '2026-03-01T00:00:00.002+00:00')])
  assert.deepEqual(racers.map(x => x.status), [200, 200])
  assert.equal(racers.filter(x => x.body.length === 1).length, 1, 'exactly one concurrent writer wins')
  assert.equal(racers.filter(x => x.body.length === 0).length, 1, 'the loser matches 0 rows')
  const winner = racers.find(x => x.body.length === 1).body[0]
  assert.equal(winner.write_rev, 2); assert.deepEqual(await row(a), winner); pass('two concurrent current writers: one wins with write_rev 2, the other gets 0 rows (no error, no overwrite)')

  // Lost response: the committed write's identical retry matches 0 rows; a reread proves it.
  before = await row(a)
  const attempt = { ...before.data, notes: { a: 'lost ack' } }, at = '2026-03-02T00:00:00.123+00:00'
  const first = await cas(a, before, attempt, at)
  assert.equal(first.body.length, 1)
  const retry = await cas(a, before, attempt, at)
  assert.deepEqual(retry.body, [])
  const reread = await row(a)
  assert.equal(reread.write_rev, before.write_rev + 1); assert.equal(Date.parse(reread.updated_at), Date.parse(at)); assert.deepEqual(reread.data, attempt)
  pass('lost response: the same-predicate retry matches 0 rows and the reread shows exactly the attempted revision (never incremented twice)')

  // Legacy -> claim racing an old writer, repeated to see both orderings. Invariant:
  // never a claimed row holding the old writer's content without its claim having lost.
  const orderings = new Set()
  for (let i = 0; i < 12; i++) {
    await request(`/rest/v1/dashboards?user_id=eq.${b.id}`, 'DELETE', undefined, service)
    await request('/rest/v1/dashboards', 'POST', { user_id: b.id, data: { notes: { b: `v${i}` } }, updated_at: '2026-04-01T00:00:00+00:00' }, b.token)
    const legacy = await row(b)
    const [claim, old] = await Promise.all([
      request(`${path(b)}&updated_at=eq.${encodeURIComponent(legacy.updated_at)}&cloud_schema=is.null&write_rev=is.null&select=updated_at`, 'PATCH', { data: { ...legacy.data, _schema: 1 }, updated_at: '2026-04-02T00:00:00+00:00', cloud_schema: 1, write_rev: 1 }, b.token, RETURN),
      request(path(b), 'PATCH', { data: { notes: { b: 'old writer' } }, updated_at: '2026-04-03T00:00:00+00:00' }, b.token),
    ])
    const final = await row(b)
    if (claim.body?.length === 1) {
      guardRejected(old, 'old writer after claim'); assert.deepEqual(final.data, { ...legacy.data, _schema: 1 }); assert.equal(final.write_rev, 1)
      orderings.add('claim first: old writer rejected')
    } else {
      assert.equal(old.status, 204); assert.deepEqual(claim.body, []); assert.equal(final.write_rev, null); assert.deepEqual(final.data, { notes: { b: 'old writer' } })
      orderings.add('old writer first: claim matched 0 rows, row stays unclaimed with the old write')
    }
  }
  pass(`legacy->claim vs old writer x12, both safe; orderings seen: ${[...orderings].join(' | ')}`)

  // Competing first inserts for a brand-new account.
  const inserts = await Promise.all([1, 2].map(n => request('/rest/v1/dashboards?select=write_rev', 'POST', { user_id: c.id, data: { _schema: 1, n }, updated_at: `2026-05-01T00:00:0${n}+00:00`, cloud_schema: 1, write_rev: 1 }, c.token, RETURN)))
  assert.deepEqual(inserts.map(x => x.status).sort(), [201, 409])
  assert.equal(inserts.find(x => x.status === 409).body.code, '23505'); pass('competing first-claim INSERTs: one 201, one 409/23505 (the client rereads)')
  r = await request('/rest/v1/dashboards', 'POST', { user_id: d.id, data: {}, updated_at: '2026-05-02T00:00:00+00:00', cloud_schema: 1, write_rev: 2 }, d.token)
  guardRejected(r, 'insert write_rev 2'); pass('INSERT claiming write_rev 2: rejected')
  r = await request('/rest/v1/dashboards', 'POST', { user_id: d.id, data: {}, updated_at: '2026-05-02T00:00:00+00:00', cloud_schema: 1, write_rev: 2 ** 53 }, d.token)
  assert.equal(r.status, 400); pass(`INSERT beyond the 2^53 - 1 cap: rejected (${r.body.code})`)

  // ---- RLS unchanged: account isolation ----
  assert.deepEqual((await request(`${path(a)}&select=user_id`, 'GET', undefined, b.token)).body, [])
  r = await request(`${path(a)}&select=user_id`, 'PATCH', { data: {}, cloud_schema: 1, write_rev: 99 }, b.token, RETURN)
  assert.equal(r.status, 200); assert.deepEqual(r.body, []); pass('account B cannot read or update account A (RLS unchanged)')

  // ---- Delete stays the declared limit ----
  r = await request(path(c), 'DELETE', undefined, c.token)
  assert.equal(r.status, 204); pass('DELETE of an own claimed row still allowed (declared limit)')
  console.log(`\n${results.length} HTTP checks passed against ${api} (PostgREST via local Kong).`)
} finally {
  for (const user of users) {
    const deleted = await request(`/auth/v1/admin/users/${user.id}`, 'DELETE')
    if (deleted.status !== 200) console.error(`cleanup: could not delete synthetic user ${user.id}`)
  }
}
