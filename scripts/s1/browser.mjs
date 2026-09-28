// S1 Revision 3 real-browser acceptance: headless Chrome over CDP (no new
// dependency) driving PRODUCTION BUILDS of the deployed app (d60f682), the
// stale-tab app (5c7a3e4) and this branch, against the disposable local stack.
//   S1_LOCAL_CONFIRMED=yes node scripts/s1/browser.mjs [build] [scenario-filter]
// Every browser request outside the local app origin and the local API is
// failed by CDP Fetch interception; nothing reaches a hosted service.
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { gunzipSync, gzipSync } from 'node:zlib'
import { randomBytes, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { isDeepStrictEqual } from 'node:util'

const root = fileURLToPath(new URL('../../', import.meta.url))
if (process.env.S1_LOCAL_CONFIRMED !== 'yes') throw new Error('Set S1_LOCAL_CONFIRMED=yes only for the disposable local stack')
const status = JSON.parse(readFileSync(resolve(root, 'scripts/s1/local/status.json'), 'utf8'))
assert.equal(status.API_URL, 'http://127.0.0.1:55431')
const [onlyBuild, onlyScenario] = process.argv.slice(2)
// S1_EVIDENCE_DIR keeps earlier runs' reports and screenshots as historical evidence.
const evidence = resolve(root, process.env.S1_EVIDENCE_DIR ?? 'premed-hq-documentation/implementation/evidence/S1-r3/browser')
mkdirSync(evidence, { recursive: true })
const builds = {
  'old-deployed': { rev: 'd60f682946e264ea2d680c2c8e2914a86899c114', port: 55441 },
  'old-stale': { rev: '5c7a3e4f1c28c3b36392815c0a63fe3c963cb225', port: 55442 },
  current: { rev: 'HEAD', port: 55443 },
  // S1 + Research (T4) integration at cloud schema 2 (codex/s1-research-r3), separate fixture.
  combined: { rev: '8dd37c6f5df5b39328eae7dc8029a70a2f081b36', port: 55444 },
}
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(SUPABASE|PG|DATABASE|VITE_|AWS_|S3_)/.test(k)))
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------- fixtures: exact-revision production builds pointed at the local API ----------
function prepare(name) {
  const { rev } = builds[name]
  const revision = execFileSync('git', ['rev-parse', rev], { cwd: root, encoding: 'utf8' }).trim()
  const dir = resolve(root, 'scripts/s1/.runtime', `web-${name}`), stamp = resolve(dir, 'S1-SOURCE.txt')
  if (existsSync(stamp) && readFileSync(stamp, 'utf8').includes(revision) && existsSync(resolve(dir, 'dist/index.html'))) return { dir, revision }
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true })
  const archive = execFileSync('git', ['archive', revision, 'src', 'public', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'scripts/pdfjs-assets.ts', 'premed-hq-documentation/specifications/generation', 'premed-hq-documentation/implementation/briefs'], { cwd: root, maxBuffer: 200 * 1024 * 1024 })
  execFileSync('tar', ['-x', '-C', dir], { input: archive })
  symlinkSync(resolve(root, 'node_modules'), resolve(dir, 'node_modules'), 'dir')
  // The production CSP (index.html meta) allows connect-src only to *.supabase.co and
  // upgrades http to https, so an unmodified build can never reach a loopback API:
  // fetch fails before any network event. That was the earlier "Failed to fetch".
  // Fixture copies only: allow exactly the local API and drop the upgrade.
  const html = resolve(dir, 'index.html'), original = readFileSync(html, 'utf8')
  const patched = original.replace("connect-src 'self' ", `connect-src 'self' ${status.API_URL} `).replace('; upgrade-insecure-requests', '')
  assert.ok(patched !== original && patched.includes(`connect-src 'self' ${status.API_URL} `) && !patched.includes('upgrade-insecure-requests'), `${name}: CSP fixture patch did not apply`)
  writeFileSync(html, patched)
  execFileSync(resolve(root, 'node_modules/.bin/vite'), ['build', '--logLevel', 'warn'], { cwd: dir, env: { ...cleanEnv, VITE_SUPABASE_URL: status.API_URL, VITE_SUPABASE_ANON_KEY: status.ANON_KEY }, stdio: 'inherit' })
  const bundle = readdirSync(resolve(dir, 'dist/assets')).filter(f => f.endsWith('.js')).map(f => readFileSync(resolve(dir, 'dist/assets', f), 'utf8')).join('\n')
  assert.ok(!/[a-z0-9]{20}\.supabase\.co/.test(bundle), `${name}: bundle references a hosted Supabase project`)
  assert.ok(bundle.includes('127.0.0.1:55431'), `${name}: bundle does not target the local API`)
  writeFileSync(stamp, `Exact source: ${revision} (git archive); vite build with VITE_SUPABASE_URL=${status.API_URL}; fixture CSP connect-src += ${status.API_URL}, upgrade-insecure-requests removed\n`)
  return { dir, revision }
}
function serve(name, dir) {
  const child = spawn(resolve(root, 'node_modules/.bin/vite'), ['preview', '--host', '127.0.0.1', '--port', String(builds[name].port), '--strictPort'], { cwd: dir, env: cleanEnv, stdio: 'ignore' })
  return child
}

// ---------- minimal CDP client ----------
async function launchChrome() {
  const profile = mkdtempSync(resolve(tmpdir(), 's1-chrome-'))
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=55450', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
  let version
  for (let i = 0; i < 60 && !version; i++) { await sleep(250); version = await fetch('http://127.0.0.1:55450/json/version').then(r => r.json()).catch(() => undefined) }
  const ws = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail })
  let id = 0
  const pending = new Map(), listeners = new Set()
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id && pending.has(message.id)) { const { ok, fail } = pending.get(message.id); pending.delete(message.id); message.error ? fail(new Error(message.error.message)) : ok(message.result) }
    else listeners.forEach(fn => fn(message))
  }
  const send = (method, params = {}, sessionId) => new Promise((ok, fail) => { const n = ++id; pending.set(n, { ok, fail }); ws.send(JSON.stringify({ id: n, method, params, sessionId })) })
  return { send, listeners, close() { ws.close(); chrome.kill('SIGTERM'); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 1000) } }
}

// ---------- local fixtures ----------
async function admin(path, method = 'GET', body, token = status.SERVICE_ROLE_KEY) {
  const r = await fetch(status.API_URL + path, { method, redirect: 'error', headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await r.text(); if (!r.ok) throw new Error(`fixture ${method} ${path}: ${r.status} ${text}`)
  return text ? JSON.parse(text) : null
}
const GZIP = 'premed-os-dashboard-gzip-v1', TEXT = 'premed-os-dashboard-json-text-v1'
const encode = (v, as) => as === 'gzip' ? { format: GZIP, gzip: gzipSync(Buffer.from(JSON.stringify(v))).toString('base64') } : as === 'text' ? { format: TEXT, json: JSON.stringify(v) } : v
const decode = v => v?.format === GZIP ? JSON.parse(gunzipSync(Buffer.from(v.gzip, 'base64')).toString('utf8')) : v?.format === TEXT ? JSON.parse(v.json) : v
const encodingOf = v => v?.format === GZIP ? 'gzip' : v?.format === TEXT ? 'text' : 'bare'
const LARGE = randomBytes(860_000).toString('base64')
const initial = await import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(readFileSync(resolve(root, 'src/data/personalInitialData.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64'))
function workspace(email, as) {
  const doc = initial.createPersonalInitialData()
  doc.profile.name = 'S1 browser'; doc.profile.email = email; doc.settings.quotesApi = false; doc.settings.theme = 'light'
  doc.notes.s1Seed = 'seed'
  if (as === 'gzip') doc.notes.s1Large = LARGE
  if (as === 'text') doc.notes.s1Odd = '\uD800 lone surrogate'
  doc.futureCollection = [{ id: 'opaque', nested: { kept: [1, 2, 3] } }]
  return doc
}

const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
/** Unmarked synthetic T4 workspace: all four Research collections and every nested field. */
function t4Workspace(email, as) {
  const doc = workspace(email, as)
  doc.experiences = [{ id: 'lab-a', category: 'research', org: 'Synthetic lab', role: 'Observer', description: 'Synthetic', hours: 60, estimatedHoursDeletedAt: 42, tags: [], status: 'active', order: 0, research: { department: 'Biology', institution: 'Synthetic institution', researchType: 'Cell biology', since: '2026-09-01', lastPiContact: '2026-09-23', current: true } }]
  doc.persons = [{ ...envelope, id: 'person-a', name: 'Synthetic mentor', bio: 'Nested T4 bio' }]
  doc.researchUpcomingItems = [{ ...envelope, id: 'upcoming', experienceId: 'lab-a', date: '2026-09-25', title: 'Training', note: 'Synthetic' }]
  doc.researchReminders = [{ ...envelope, id: 'reminder', experienceId: 'lab-a', text: 'Ask before handling samples' }]
  doc.researchTimelineNotes = [{ ...envelope, id: 'timeline', experienceId: 'lab-a', date: '2026-09-24', text: 'Synthetic timeline' }]
  doc.researchMemberships = [{ ...envelope, id: 'membership', experienceId: 'lab-a', personId: 'person-a', roleInLab: 'Mentor', projectText: 'Synthetic project' }]
  doc.experienceHourEntries = [
    { ...envelope, id: 'logged', experienceId: 'lab-a', kind: 'logged', date: '2026-09-24', hours: 1.5, note: 'Synthetic', thoughts: 'Why did the signal change?' },
    { ...envelope, id: 'orphan', experienceId: 'lab-gone', kind: 'logged', date: '2026-09-20', hours: 1, parentDeletedAt: 99 },
  ]
  return doc
}
const T4_KEYS = ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']
function t4Kept(doc, seed) {
  const lab = doc.experiences?.find(x => x.id === 'lab-a'), hours = doc.experienceHourEntries ?? []
  return T4_KEYS.every(k => same(doc[k], seed[k])) && same(lab?.research, seed.experiences[0].research) && lab?.estimatedHoursDeletedAt === 42
    && hours.find(x => x.id === 'logged')?.thoughts === 'Why did the signal change?' && hours.find(x => x.id === 'orphan')?.parentDeletedAt === 99
    && doc.persons?.find(x => x.id === 'person-a')?.bio === 'Nested T4 bio'
}

// ---------- one scenario ----------
async function scenario(cdp, build, spec) {
  const origin = `http://127.0.0.1:${builds[build].port}`
  const email = `s1-browser-${randomUUID()}@example.invalid`, password = randomUUID() + randomUUID()
  const out = { build, scenario: spec.name, checks: [] }
  const check = (label, ok, detail) => { out.checks.push({ label, ok: !!ok, ...(detail === undefined ? {} : { detail }) }); if (!ok) out.failed = true }
  let contextId, targetId, user
  try {
    // Setup failures (API down, fixture rejected) are this scenario's failure, not a crash.
    user = await admin('/auth/v1/admin/users', 'POST', { email, password, email_confirm: true })
    await spec.seed(user.id, email)
    const before = (await admin(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data,updated_at,cloud_schema,write_rev`))[0]
    const login = await admin('/auth/v1/token?grant_type=password', 'POST', { email, password }, status.ANON_KEY)
    const session = { ...login, expires_at: login.expires_at ?? Math.floor(Date.now() / 1000) + login.expires_in }
    ;({ browserContextId: contextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true }))
    ;({ targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId: contextId }))
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    const s = (method, params) => cdp.send(method, params, sessionId)
    const requests = [], blocked = new Set(), console_ = []
    out.requests = requests; out.console = console_
    const listener = async message => {
      if (message.sessionId !== sessionId) return
      const p = message.params
      if (message.method === 'Fetch.requestPaused') {
        const url = new URL(p.request.url)
        const allowed = url.origin === origin || url.origin === status.API_URL || url.protocol === 'data:' || url.protocol === 'blob:'
        if (!allowed) { blocked.add(url.origin); return s('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' }).catch(() => {}) }
        if (spec.failClaim && p.request.method === 'PATCH' && url.pathname === '/rest/v1/dashboards' && url.search.includes('write_rev=is.null')) {
          requests.push({ method: 'PATCH', url: url.search, status: 'network-failed (harness)' })
          return s('Fetch.failRequest', { requestId: p.requestId, errorReason: 'ConnectionReset' }).catch(() => {})
        }
        return s('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {})
      }
      if (message.method === 'Network.requestWillBeSent' && p.request.url.startsWith(status.API_URL) && !p.request.url.startsWith(status.API_URL + '/rest/v1/dashboards')) console_.push(`api ${p.request.method} ${new URL(p.request.url).pathname}`)
      if (message.method === 'Network.requestWillBeSent' && p.request.url.startsWith(status.API_URL + '/rest/v1/dashboards')) {
        requests.push({ requestId: p.requestId, method: p.request.method, url: new URL(p.request.url).search })
      }
      if (message.method === 'Network.responseReceived') {
        const entry = requests.find(r => r.requestId === p.requestId)
        if (entry) entry.status = p.response.status
      }
      if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(p.type)) console_.push(p.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300))
      if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(p.entry.level)) console_.push('log: ' + p.entry.text.slice(0, 300))
      if (message.method === 'Runtime.exceptionThrown') console_.push('exception: ' + (p.exceptionDetails.exception?.description ?? p.exceptionDetails.text).slice(0, 300))
      if (message.method === 'Network.loadingFailed' && requests.some(r => r.requestId === p.requestId)) { const e = requests.find(r => r.requestId === p.requestId); e.failed = p.errorText + (p.corsErrorStatus ? ' cors:' + JSON.stringify(p.corsErrorStatus) : '') + (p.blockedReason ? ' blocked:' + p.blockedReason : '') }
      if (message.method === 'Network.loadingFinished') {
        const entry = requests.find(r => r.requestId === p.requestId && r.status >= 400)
        if (entry) { const body = await s('Network.getResponseBody', { requestId: p.requestId }).catch(() => null); if (body) { try { const e = JSON.parse(body.body); entry.code = e.code; entry.details = e.details } catch { /* not JSON */ } } }
      }
    }
    cdp.listeners.add(listener)
    try {
      await s('Network.enable'); await s('Page.enable'); await s('Runtime.enable'); await s('Log.enable')
      await s('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
      await s('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === ${JSON.stringify(origin)} && !localStorage.getItem('sb-127-auth-token')) localStorage.setItem('sb-127-auth-token', ${JSON.stringify(JSON.stringify(session))})` })
      const text = async () => (await s('Runtime.evaluate', { expression: 'document.body ? document.body.innerText : ""', returnByValue: true })).result.value
      const waitFor = async (predicate, label, timeout = 30_000) => {
        const end = Date.now() + timeout
        for (;;) {
          const t = await text(); if (predicate(t)) return t
          if (Date.now() > end) {
            const storage = (await s('Runtime.evaluate', { awaitPromise: true, expression: `(async () => JSON.stringify({ href: location.href, visibility: document.visibilityState, keys: Object.keys(localStorage), dbs: await indexedDB.databases() }))()`, returnByValue: true })).result.value
            check(`timeout: ${label}`, false, { page: t.slice(Math.max(0, t.indexOf('Cloud sync') - 50), t.indexOf('Cloud sync') + 700), storage }); return t
          }
          await sleep(250)
        }
      }
      const methodOf = r => r.method
      const writes = () => requests.filter(r => r.status !== undefined && ['PATCH', 'POST'].includes(methodOf(r)))
      await s('Page.navigate', { url: `${origin}/#/settings` })
      const settled = t => /Signed in/.test(t) && (/Synced|Cloud protection|out of date|newer version|Research data|Sync paused|could not|server has not/i.test(t))
      let page = await waitFor(settled, 'settings loaded and first sync settled')
      await sleep(1500); page = await text()
      out.loadWrites = writes().map(r => ({ method: methodOf(r), status: r.status }))
      await spec.afterLoad?.({ check, page, before, writes, readRow: () => admin(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data,updated_at,cloud_schema,write_rev`).then(r => r[0]) })
      if (spec.shot) { const png = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(resolve(evidence, `${build}-${spec.name}-loaded.png`), Buffer.from(png.data, 'base64')) }
      if (spec.edit !== false) {
        const loadCount = writes().length
        const clicked = (await s('Runtime.evaluate', { expression: `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase() === 'dark'); if (!b) return false; b.click(); return true })()`, returnByValue: true })).result.value
        check('clicked the Dark theme button (an ordinary synced settings edit)', clicked)
        const end = Date.now() + 20_000
        while (writes().length === loadCount && Date.now() < end) await sleep(250)
        await sleep(2000)
        out.editWrites = writes().slice(loadCount).map(r => ({ method: methodOf(r), status: r.status, code: r.code, details: r.details }))
        page = await text()
        if (spec.shot) { const png = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(resolve(evidence, `${build}-${spec.name}-after-edit.png`), Buffer.from(png.data, 'base64')) }
        out.darkBeforeReload = (await s('Runtime.evaluate', { expression: `document.documentElement.classList.contains('dark')`, returnByValue: true })).result.value
        await s('Page.reload')
        await waitFor(t => /premedOS/.test(t), 'reload (any app screen; the app may route to its own review page)')
        // Persistence is checked in the browser's durable workspace storage, not on
        // screen: after a reload the app may route to its own device/account review.
        const persisted = `(async () => {
          const hits = []
          for (const info of await indexedDB.databases()) {
            if (!info.name.startsWith('premed-os-workspaces')) continue
            const db = await new Promise((ok, fail) => { const r = indexedDB.open(info.name); r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error) })
            for (const name of db.objectStoreNames) {
              const rows = await new Promise((ok, fail) => { const r = db.transaction(name).objectStore(name).getAll(); r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error) })
              for (const row of rows) { const text = JSON.stringify(row).split(String.fromCharCode(92)).join(''); if (text.includes('account:') && text.includes('"theme":"dark"')) hits.push(name) }
            }
            db.close()
          }
          return hits.length > 0 || Object.keys(localStorage).some(k => k.startsWith('hq:app-data:account:') && (localStorage.getItem(k) || '').includes('"theme":"dark"'))
        })()`
        let kept = false
        for (const end = Date.now() + 15_000; !kept && Date.now() < end; await sleep(500)) kept = (await s('Runtime.evaluate', { expression: persisted, awaitPromise: true, returnByValue: true })).result.value
        const afterReload = await text()
        out.afterReloadRoute = /You've got work on this device/.test(afterReload) ? 'device/account review page' : /Cloud sync/.test(afterReload) ? 'settings' : 'other'
        check('after reload the edit is still saved on this device (durable workspace storage)', kept, { darkBeforeReload: out.darkBeforeReload })
      }
      out.blockedOrigins = [...blocked]
      const after = (await admin(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data,updated_at,cloud_schema,write_rev`))[0]
      await spec.verify({ check, page, before, after, out })
      out.row = { before: { cloud_schema: before.cloud_schema, write_rev: before.write_rev, encoding: encodingOf(before.data) }, after: { cloud_schema: after.cloud_schema, write_rev: after.write_rev, encoding: encodingOf(after.data) } }
    } finally { cdp.listeners.delete(listener) }
  } catch (error) { out.failed = true; out.error = String(error?.stack ?? error) }
  finally {
    if (targetId) await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    if (contextId) await cdp.send('Target.disposeBrowserContext', { browserContextId: contextId }).catch(() => {})
    if (user) await admin(`/auth/v1/admin/users/${user.id}`, 'DELETE').catch(() => {})
  }
  // A scenario that asserted nothing proves nothing.
  if (!out.checks.length) { out.failed = true; out.error ??= 'no checks ran' }
  return out
}

// ---------- scenarios ----------
const insert = (id, data, extra = {}) => admin('/rest/v1/dashboards', 'POST', { user_id: id, data, updated_at: '2026-01-01T00:00:00+00:00', ...extra })
// JSONB does not keep object key order; compare structure, not serialization.
const same = (a, b) => isDeepStrictEqual(a, b)
function matrix(build) {
  if (build === 'combined') return ['bare', 'gzip', 'text'].map(encoding => ({
    name: `t4-legacy-${encoding}`, shot: encoding === 'bare',
    seed: (id, email) => insert(id, encode(t4Workspace(email, encoding), encoding)),
    afterLoad: async ({ check, page, before, writes, readRow }) => {
      const claimed = await readRow()
      check('opening claimed the unmarked T4 row once, at cloud schema 2', writes().length === 1 && claimed.cloud_schema === 2 && claimed.write_rev === 1, writes())
      check('the claim is exactly the reviewed document plus _schema: 2', same(decode(claimed.data), { ...decode(before.data), _schema: 2 }))
      check(`claim keeps the stored encoding (${encoding})`, encodingOf(claimed.data) === encoding)
      check('Settings shows "Cloud protection: on"', /Cloud protection: on/.test(page))
    },
    verify: ({ check, before, after, out }) => {
      const doc = decode(after.data)
      check('the save succeeded: schema 2, write_rev 2', out.editWrites.some(w => w.status === 200) && after.cloud_schema === 2 && after.write_rev === 2, out.editWrites)
      check('edit saved', doc.settings.theme === 'dark' && doc._schema === 2)
      check('every T4 collection and nested field kept exactly', t4Kept(doc, decode(before.data)))
      check(`stored encoding stays ${encoding}`, encodingOf(after.data) === encoding)
    },
  }))
  const old = build !== 'current', list = []
  for (const encoding of ['bare', 'gzip', 'text']) {
    list.push({
      name: `claimed-${encoding}`, shot: encoding === 'bare',
      seed: (id, email) => insert(id, encode({ ...workspace(email, encoding), _schema: 1 }, encoding), { cloud_schema: 1, write_rev: 1 }),
      afterLoad: ({ check, page, writes }) => {
        check('opening a claimed row sends no write', writes().length === 0)
        if (!old) check('Settings shows "Cloud protection: on"', /Cloud protection: on/.test(page))
      },
      verify: ({ check, page, before, after, out }) => {
        if (old) {
          check('the old save was rejected: HTTP 400 P0001 S1_SCHEMA_GUARD', out.editWrites.some(w => w.status === 400 && w.code === 'P0001' && w.details === 'S1_SCHEMA_GUARD'), out.editWrites)
          check('the old app shows the guard message', /This tab is out of date\. Your recent changes are still on this device\./.test(page))
          check('cloud row unchanged (data, updated_at, cloud_schema, write_rev)', same(after, before))
        } else {
          check('the current save succeeded', out.editWrites.some(w => w.status === 200), out.editWrites)
          check('write_rev 1 -> 2, schema 1', after.cloud_schema === 1 && after.write_rev === 2)
          check(`stored encoding stays ${encoding}`, encodingOf(after.data) === encoding)
          const doc = decode(after.data)
          check('edit saved and unknown section kept', doc.settings.theme === 'dark' && same(doc.futureCollection, decode(before.data).futureCollection))
        }
      },
    })
    list.push({
      name: `legacy-${encoding}`, shot: !old && encoding === 'bare',
      seed: (id, email) => insert(id, encode(workspace(email, encoding), encoding)),
      afterLoad: async ({ check, page, before, writes, readRow }) => {
        if (old) { check('the old app does not write on open', writes().length === 0); return }
        const claimed = await readRow()
        check('opening claimed the row with one conditional PATCH', writes().length === 1 && claimed.cloud_schema === 1 && claimed.write_rev === 1, writes())
        check('the claim is exactly the reviewed cloud document plus _schema', same(decode(claimed.data), { ...decode(before.data), _schema: 1 }))
        check(`claim keeps the stored encoding (${encoding})`, encodingOf(claimed.data) === encoding)
        check('Settings shows "Cloud protection: on" after the claim', /Cloud protection: on/.test(page))
      },
      verify: ({ check, after }) => {
        const doc = decode(after.data)
        check('edit saved', doc.settings.theme === 'dark')
        if (old) {
          check('unclaimed row keeps today\'s behavior: old save accepted, row stays unclaimed', after.cloud_schema === null && after.write_rev === null)
          check('(known pre-claim exposure, recorded) the old app dropped the unknown section', !('futureCollection' in doc))
        } else {
          check('write_rev 1 -> 2 after the edit', after.cloud_schema === 1 && after.write_rev === 2)
          check('unknown section kept', same(doc.futureCollection, [{ id: 'opaque', nested: { kept: [1, 2, 3] } }]))
          check(`stored encoding stays ${encoding}`, encodingOf(after.data) === encoding)
        }
      },
    })
  }
  if (!old) {
    list.push({
      name: 'future-schema', shot: true, edit: false,
      seed: (id, email) => insert(id, { ...workspace(email, 'bare'), _schema: 2, profile: { ...workspace(email, 'bare').profile, name: 'Future cloud' } }, { cloud_schema: 2, write_rev: 1 }),
      verify: ({ check, page, before, after, out }) => {
        check('blocked before hydration with the newer-version message', /needs a newer version of Premed OS/.test(page))
        check('no write of any kind', out.loadWrites.length === 0)
        check('protection not shown as on', !/Cloud protection: on/.test(page))
        check('cloud row unchanged', same(after, before))
      },
    })
    list.push({
      name: 'schema2-t4-row', edit: false,
      seed: (id, email) => insert(id, { ...t4Workspace(email, 'bare'), _schema: 2 }, { cloud_schema: 2, write_rev: 1 }),
      verify: ({ check, page, before, after, out }) => {
        check('schema-1 app blocks a schema-2 Research row', /needs a newer version of Premed OS/.test(page))
        check('no write of any kind', out.loadWrites.length === 0)
        check('cloud row unchanged', same(after, before))
      },
    })
    list.push({
      name: 't4-unmarked', edit: false,
      seed: (id, email) => insert(id, { ...workspace(email, 'bare'), researchReminders: [{ id: 'r', experienceId: 'e', text: 'Synthetic', createdAt: 1, updatedAt: 1 }] }),
      verify: ({ check, page, before, after, out }) => {
        check('schema-1 app refuses the Research (T4) row', /Research data/.test(page))
        check('no claim or other write', out.loadWrites.length === 0)
        check('cloud row unchanged and unclaimed', same(after, before) && after.write_rev === null)
      },
    })
    list.push({
      name: 'claim-not-confirmed', edit: false, failClaim: true,
      seed: (id, email) => insert(id, workspace(email, 'bare')),
      verify: ({ check, page, after }) => {
        check('without a server-confirmed claim the app never says protection is on', !/Cloud protection: on/.test(page))
        check('row stays unclaimed', after.write_rev === null)
      },
    })
  }
  return list
}

const cdp = await launchChrome()
const servers = []
const report = []
try {
  for (const build of Object.keys(builds)) {
    if (onlyBuild && onlyBuild !== build) continue
    const { dir, revision } = prepare(build)
    servers.push(serve(build, dir))
    for (let i = 0; i < 40; i++) { await sleep(250); if (await fetch(`http://127.0.0.1:${builds[build].port}/`).then(r => r.ok).catch(() => false)) break }
    for (const spec of matrix(build)) {
      if (onlyScenario && !spec.name.includes(onlyScenario)) continue
      const result = await scenario(cdp, build, spec)
      result.revision = revision
      report.push(result)
      console.log(`${result.failed ? 'FAIL' : 'PASS'} | ${build} | ${spec.name} | ${result.checks.filter(c => c.ok).length}/${result.checks.length} checks${result.error ? ' | ' + result.error.split('\n')[0] : ''}`)
      for (const c of result.checks.filter(c => !c.ok)) console.log(`      x ${c.label} ${c.detail === undefined ? '' : JSON.stringify(c.detail).slice(0, 400)}`)
    }
  }
} finally {
  cdp.close(); servers.forEach(child => child.kill('SIGTERM'))
  const file = resolve(evidence, `browser-report${onlyBuild ? '-' + onlyBuild : ''}.json`)
  writeFileSync(file, JSON.stringify({ ranAt: new Date().toISOString(), api: status.API_URL, report }, null, 2))
  const failed = report.filter(r => r.failed).length
  console.log(`\n${report.length - failed}/${report.length} browser scenarios passed. Report: ${file}`)
  // Acceptance fails on any failed scenario, and on a run that selected none.
  if (failed || !report.length) {
    console.error(report.length ? `S1 browser acceptance FAILED: ${failed} scenario(s).` : 'S1 browser acceptance FAILED: no scenario ran (check the build/scenario filter).')
    process.exitCode = 1
  }
}
