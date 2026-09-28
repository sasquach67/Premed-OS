// Disposable LOCAL S2 acceptance. Reuses the S1 production-build/CDP pattern.
// Run S1_LOCAL_CONFIRMED=yes node scripts/s2/browser.mjs [scenario-filter]
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync, cpSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
import { randomUUID, createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
if (process.env.S1_LOCAL_CONFIRMED !== 'yes') throw new Error('Disposable local stack confirmation required')
const status = JSON.parse(readFileSync(resolve(root, 'scripts/s1/local/status.json'), 'utf8'))
assert.equal(status.API_URL, 'http://127.0.0.1:55431')
const filter = process.argv[2]
const origin = 'http://127.0.0.1:55461'
const evidence = resolve(root, process.env.S2_EVIDENCE_DIR ?? 'premed-hq-documentation/implementation/evidence/S2/browser')
mkdirSync(evidence, { recursive: true })
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(SUPABASE|PG|DATABASE|VITE_|AWS_|S3_)/.test(k)))
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function launchChrome() {
  const profile = mkdtempSync(resolve(tmpdir(), 's2-chrome-'))
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=55460', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--window-size=1280,900', 'about:blank'], { stdio: ['ignore','ignore','inherit'] })
  let version
  for (let i = 0; i < 240 && !version; i++) { await sleep(250); version = await fetch('http://127.0.0.1:55460/json/version').then(r => r.json()).catch(() => undefined) }
  if (!version) { chrome.kill('SIGTERM'); throw new Error('Headless Chrome did not expose local CDP') }
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
  return { send, listeners, close() { ws.close(); chrome.kill('SIGTERM'); setTimeout(() => { try { rmSync(profile, { recursive: true, force: true, maxRetries:5,retryDelay:500 }) } catch {} }, 1500) } }
}

async function api(path, method = 'GET', body, token = status.SERVICE_ROLE_KEY) {
  const response = await fetch(status.API_URL + path, { method, redirect: 'error', headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const value = await response.text()
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${value}`)
  return value ? JSON.parse(value) : null
}
const decode = v => v?.format === 'premed-os-dashboard-gzip-v1' ? JSON.parse(gunzipSync(Buffer.from(v.gzip, 'base64')).toString('utf8')) : v?.format === 'premed-os-dashboard-json-text-v1' ? JSON.parse(v.json) : v
const fixture = resolve(root, 'scripts/s2/.runtime/browser')
if (process.env.S2_REUSE_BUILD !== 'yes') {
rmSync(fixture, { recursive: true, force: true }); mkdirSync(fixture, { recursive: true })
const paths = ['src', 'public', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'scripts/pdfjs-assets.ts', 'premed-hq-documentation/specifications/generation', 'premed-hq-documentation/implementation/briefs']
for (const path of paths) cpSync(resolve(root, path), resolve(fixture, path), { recursive: true })
symlinkSync(resolve(root, 'node_modules'), resolve(fixture, 'node_modules'), 'dir')
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
// The fixture-only bridge constructs synthetic account data using the actual app helpers.
// It is never included in the application or release bundle.
writeFileSync(resolve(fixture, 'src/s2-fixture.ts'), `
setTimeout(async () => {
while (!document.querySelector('#root')?.firstElementChild) await new Promise(r=>setTimeout(r,50))
const [{createPersonalInitialData},{prepareWorkspaceData},{syncContent,syncDigest},{createWorkspaceRepository},{snapshotData,migrateAll},{compareAccountCopies}] = await Promise.all([
 import('./data/personalInitialData'), import('./lib/workspaceSchema'), import('./store/accountSyncSafety'), import('./store/workspaceRepository'), import('./store/store'), import('./store/accountCopyComparison')
])
window.__s2 = {
 snapshot: snapshotData, compare:compareAccountCopies,
 async seed(id, email, session, scenario, theme) {
  let base = structuredClone(prepareWorkspaceData(snapshotData()))
  base.profile.name = 'Synthetic S2'; base.profile.email = email; base.settings.quotesApi = false; base.settings.theme = theme
  const task = (id, title) => ({ id, title, type:'Other', progress:'Not started', kanban:'todo', archived:false, horizon:'now', important:false, typeId:'type-other', order:0 })
  base.tasks = [task('base-task','Shared task')]; base.notes = { retained: 'Shared note' }; base = structuredClone(migrateAll(base))
  const local = structuredClone(base), remote = structuredClone(base)
  if (scenario === 'ordinary-device-edit') local.tasks[0].title = 'Ordinary device edit'
  if (scenario === 'device-add') local.tasks.push(task('device-add','Device addition'))
  if (scenario === 'cloud-add') remote.tasks.push(task('cloud-add','Cloud addition'))
  if (scenario.startsWith('both-add')) { local.tasks.push(task('device-add','Device addition')); remote.tasks.push(task('cloud-add','Cloud addition')) }
  if (scenario === 'both-edit') { local.tasks[0].title = 'Device edit'; remote.tasks[0].title = 'Cloud edit' }
  if (scenario === 'device-delete') local.tasks = []
  if (scenario === 'divergent-delete') { local.tasks = []; remote.tasks[0].title = 'Cloud edited shared task' }
  if (scenario === 'cloud-delete') remote.tasks = []
  if (scenario === 'note-delete') delete remote.notes.retained
  if (scenario === 'housekeeping-only') {
   local.meta.lastOpenedAt = 200; remote.meta.lastOpenedAt = 100
   local.meta.recentRoutes = ['/settings']; remote.meta.recentRoutes = ['/research']
   local.settings.calendar = {...local.settings.calendar, lastSyncedAt:200}
   remote.settings.calendar = {...remote.settings.calendar, lastSyncedAt:100}
  }
  for (const [label,copy] of [['base',base],['local',local],['remote',remote]]) {
   const differences = compareAccountCopies(copy, migrateAll(structuredClone(copy)))
   if (differences.length) throw new Error('Fixture hydration is not stable: ' + label + ' ' + JSON.stringify(differences))
  }
  const key = 'hq:app-data:account:' + id
  const repository = createWorkspaceRepository()
  const raw = JSON.stringify({ state: local, version: 52 })
  const staged = await repository.stage(key, raw, raw)
  const record = await repository.activate(key, staged.revision)
  repository.close()
  localStorage.setItem(key, 'premed-os:workspace:idb:v1:' + record.migrationId)
  localStorage.setItem('hq:workspace-owner', 'account:' + id)
  localStorage.setItem('hq:demo-mode','off')
  localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
  localStorage.setItem('premed_hq_public', JSON.stringify({ entered: true, mergeDecidedFor:[id] }))
  const baseline = { digest: await syncDigest(syncContent(base)), updatedAt:'2026-01-01T00:00:00+00:00', claim:{cloudSchema:2,writeRev:1} }
  localStorage.setItem('premed-os:sync-baseline:v2:' + id, JSON.stringify(baseline))
  return { base, local, remote, raw }
 }
}
}, 0)
`)
let html = readFileSync(resolve(fixture, 'index.html'), 'utf8')
html = html.replace("connect-src 'self' ", `connect-src 'self' ${status.API_URL} `).replace('; upgrade-insecure-requests', '').replace('</body>', '<script type="module" src="/src/s2-fixture.ts"></script></body>')
writeFileSync(resolve(fixture, 'index.html'), html)
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding:'utf8' }).trim().split('\n')
const hashes = Object.fromEntries(files.map(p => [p, createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex')]))
writeFileSync(resolve(evidence, 'source.json'), JSON.stringify({ revision, note:'Working-tree snapshot; fixture-only bridge and CSP loopback patch, no app-source modification.', hashes }, null, 2))
execFileSync(resolve(root,'node_modules/.bin/vite'), ['build','--logLevel','warn'], { cwd: fixture, env:{...cleanEnv,VITE_SUPABASE_URL:status.API_URL,VITE_SUPABASE_ANON_KEY:status.ANON_KEY,VITE_RESEARCH_PREVIEW:'true'}, stdio:'inherit' })
const bundle = readdirSync(resolve(fixture,'dist/assets')).filter(p=>p.endsWith('.js')).map(p=>readFileSync(resolve(fixture,'dist/assets',p),'utf8')).join('\n')
assert.ok(!/[a-z0-9]{20}\.supabase\.co/.test(bundle), 'No hosted project in fixture bundle')
}
console.log('Fixture production build ready')
const server = spawn(resolve(root,'node_modules/.bin/vite'), ['preview','--host','127.0.0.1','--port','55461','--strictPort'], { cwd:fixture, env:cleanEnv,stdio:'ignore' })
let chrome
const results = []
const recoveryExpression = `(async()=>{const dbs=await indexedDB.databases();if(!dbs.some(d=>d.name==='premed-os-workspace-recovery-v1'))return [];return await new Promise((ok,fail)=>{const req=indexedDB.open('premed-os-workspace-recovery-v1');req.onerror=()=>fail(req.error);req.onsuccess=()=>{const db=req.result;const t=db.transaction('snapshots');const r=t.objectStore('snapshots').getAll();r.onsuccess=()=>ok(r.result);t.oncomplete=()=>db.close()}})})()`
async function scenario(name, theme, width) {
 console.log('Starting', name, theme, width)
 const report={name,theme,width,checks:[],writes:[]}; results.push(report)
 const check=(label,condition,detail)=>{report.checks.push({label,pass:!!condition,...(detail===undefined?{}:{detail})});if(!condition)throw new Error(label)}
 let user,contextId,listener,diagnostic
 try {
  const email=`s2-${randomUUID()}@example.invalid`, password=randomUUID()+randomUUID()
  user=await api('/auth/v1/admin/users','POST',{email,password,email_confirm:true})
  const login=await api('/auth/v1/token?grant_type=password','POST',{email,password},status.ANON_KEY)
  const session={...login,expires_at:Math.floor(Date.now()/1000)+login.expires_in}
  ;({browserContextId:contextId}=await chrome.send('Target.createBrowserContext',{disposeOnDetach:true}))
  const {targetId}=await chrome.send('Target.createTarget',{url:'about:blank',browserContextId:contextId})
  const {sessionId}=await chrome.send('Target.attachToTarget',{targetId,flatten:true})
  const s=(method,params)=>chrome.send(method,params,sessionId)
  const evaluate=async expression=>{const r=await s('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value}
  const readRecovery=()=>evaluate(recoveryExpression)
  listener=async message=>{
   if(message.sessionId!==sessionId)return
   const p=message.params
   if(message.method==='Fetch.requestPaused'){
    const url=new URL(p.request.url)
    if(![origin,status.API_URL].includes(url.origin)&&!['blob:','data:'].includes(url.protocol))return s('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'}).catch(()=>{})
    if(url.origin===status.API_URL&&url.pathname==='/rest/v1/dashboards'&&['PATCH','POST'].includes(p.request.method)){
     const copies=await readRecovery(); const digests=await Promise.all(copies.map(async c=>createHash('sha256').update(JSON.stringify(c.stored)).digest('hex')===c.sha256))
     report.writes.push({method:p.request.method,query:url.search,recoveryCount:copies.length,recoveryVerified:copies.length>=2&&digests.every(Boolean)})
    }
    return s('Fetch.continueRequest',{requestId:p.requestId}).catch(()=>{})
   }
  }
  chrome.listeners.add(listener)
  await s('Network.enable');await s('Page.enable');await s('Runtime.enable');await s('Fetch.enable',{patterns:[{urlPattern:'*'}]})
  await s('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
  const wait=async(fn,label)=>{const end=Date.now()+45000;while(Date.now()<end){if(await fn())return;await sleep(200)}throw new Error('Timeout '+label+': '+(await evaluate('document.body.innerText')).slice(-2200))}
  await s('Page.navigate',{url:origin+'/#/settings'})
  await wait(()=>evaluate('!!window.__s2'),'fixture ready')
  const seed=await evaluate(`window.__s2.seed(${JSON.stringify(user.id)},${JSON.stringify(email)},${JSON.stringify(session)},${JSON.stringify(name)},${JSON.stringify(theme)})`)
  diagnostic=()=>evaluate(`window.__s2.compare(window.__s2.snapshot(),${JSON.stringify(seed.remote)})`)
  const changedCloud=!['device-add','device-delete','ordinary-device-edit'].includes(name)
  // Device-newest is ordinary local time; a synthetic future cloud timestamp tests cloud-newest.
  const savedAt=name==='both-add-cloud-newest'?'2090-01-01T00:00:00+00:00':changedCloud?'2026-02-01T00:00:00+00:00':'2026-01-01T00:00:00+00:00'
  await api('/rest/v1/dashboards','POST',{user_id:user.id,data:seed.remote,cloud_schema:2,write_rev:1,updated_at:savedAt})
  await s('Page.reload',{ignoreCache:true})
  const silent=['device-add','cloud-add','housekeeping-only','device-delete','cloud-delete','note-delete','ordinary-device-edit'].includes(name)
  const archiveExpected=!['housekeeping-only','ordinary-device-edit'].includes(name)
  await wait(()=>evaluate(silent?`document.body.innerText.includes('Cloud protection: on') && document.body.innerText.includes('Synced') && !document.querySelector('section[aria-label="Choose an account copy"]')`:`!!document.querySelector('section[aria-label="Choose an account copy"]')`),'resolution ready')
  await sleep(700)
  let page=await evaluate('document.body.innerText')
  check('No horizontal page overflow',await evaluate('document.documentElement.scrollWidth<=innerWidth'),await evaluate('({scroll:document.documentElement.scrollWidth,width:innerWidth})'))
  check('Requested theme applied',await evaluate(`document.documentElement.classList.contains('dark')===${theme==='dark'}`))
  if(silent){
   check('No choice panel',!page.includes('Choose an account copy')&&!page.includes('Keep newest'))
   if(['device-add','cloud-add'].includes(name)) check('Additive recovery notice is visible',page.includes('Kept the copy with your newest work'))
   else if(name==='housekeeping-only') check('Matching-work notice is visible',page.includes('Your saved work matches'))
   else check('Ordinary one-sided sync shows no recovery notice',!page.toLowerCase().includes('other copy is saved under settings') && !page.includes('Kept the copy with your newest work'))
   const expectedCount=['device-delete','cloud-delete'].includes(name)?0:['housekeeping-only','note-delete','ordinary-device-edit'].includes(name)?1:2
   await wait(async()=>decode((await api(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data`))[0].data).tasks.length===expectedCount,'authored cloud work retained')
   if(name==='ordinary-device-edit') await wait(async()=>decode((await api(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data`))[0].data).tasks[0].title==='Ordinary device edit','ordinary edit synced')
   const local=await evaluate('window.__s2.snapshot()')
   check('Authored device work retained',local.tasks.length===expectedCount)
   if(name==='housekeeping-only') check('Authored notes retained',isDeepStrictEqual(local.notes,seed.base.notes))
   if(name==='note-delete') check('One-sided note deletion retained',!Object.hasOwn(local.notes,'retained'))
  }else{
   check('Conflict caused no automatic write',report.writes.length===0)
   check('Detailed comparison initially collapsed',await evaluate(`![...document.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='See differences').open`))
   const newest=name==='both-add-cloud-newest'?'cloud':'this device'
   check('Keep newest accessible name identifies timestamp winner',await evaluate(`!!document.querySelector('button[aria-label="Keep newest — ${newest}"]')`))
   // Native Tab delivery verifies the primary control is in the keyboard sequence.
   await evaluate('document.activeElement?.blur()')
   let reached=false
   for(let i=0;i<100;i++){await s('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await s('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});if(await evaluate(`document.activeElement?.getAttribute('aria-label')==='Keep newest — ${newest}'`)){reached=true;break}}
   check('Keep newest reachable by keyboard',reached)
   const shot=await s('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(evidence,`${name}-${theme}-${width}.png`),Buffer.from(shot.data,'base64'))
   const copies=await readRecovery()
   check('Both recovery copies persisted before user choice',copies.length>=2)
   await s('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await s('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
   await wait(()=>evaluate(`document.body.innerText.includes('Your choice was saved')`),'choice saved')
   const kept=decode((await api(`/rest/v1/dashboards?user_id=eq.${user.id}&select=data`))[0].data)
   const expected=newest==='cloud'?seed.remote:seed.local
   check('Keep newest used saved timestamp winner',isDeepStrictEqual(kept.tasks,expected.tasks)&&isDeepStrictEqual(kept.notes,expected.notes))
  }
  const copies=await readRecovery()
  if(archiveExpected){
   check('Verified recovery snapshots exist',copies.length>=2&&copies.every(c=>createHash('sha256').update(JSON.stringify(c.stored)).digest('hex')===c.sha256))
   check('Recovery retains both prior task collections', [seed.local.tasks,seed.remote.tasks].every(tasks=>copies.some(c=>{try{return isDeepStrictEqual(JSON.parse(c.stored).state.tasks,tasks)}catch{return false}})))
   check('Every cloud replacement followed verified recovery',report.writes.every(w=>w.recoveryVerified))
  }else{
   check('No unnecessary recovery snapshots',copies.length===0)
   if(name==='housekeeping-only') check('Matching authored work causes no PATCH',report.writes.length===0)
   else check('Ordinary edit uploads without archive churn',report.writes.length>0&&report.writes.every(w=>w.recoveryCount===0))
  }
  const after=await s('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(evidence,`${name}-${theme}-${width}-after.png`),Buffer.from(after.data,'base64'))
  report.pass=true
 }catch(error){report.pass=false;report.error=String(error);if(diagnostic)report.differences=await diagnostic().catch(()=>null);console.error(name,report.error)}
 finally{if(listener)chrome.listeners.delete(listener);if(contextId)await chrome.send('Target.disposeBrowserContext',{browserContextId:contextId});if(user)await api('/auth/v1/admin/users/'+user.id,'DELETE')}
 console.log(`${report.pass?'PASS':'FAIL'} ${name} ${theme} ${width}: ${report.checks.length} checks`)
 writeFileSync(resolve(evidence,'results.json'),JSON.stringify(results,null,2))
}
try{
 for(let i=0;i<60;i++){if(await fetch(origin).then(r=>r.ok).catch(()=>false))break;await sleep(250)}
 chrome=await launchChrome()
 for(const spec of [['device-add','dark',375],['cloud-add','light',375],['both-add','dark',375],['both-add-cloud-newest','light',375],['both-edit','dark',1280],['device-delete','light',375],['cloud-delete','dark',375],['note-delete','light',375],['housekeeping-only','dark',375],['divergent-delete','light',375],['ordinary-device-edit','light',375]])if(!filter||filter.split(',').some(f=>spec[0]===f))await scenario(...spec)
 console.log(JSON.stringify({pass:results.filter(r=>r.pass).length,total:results.length,checks:results.reduce((n,r)=>n+r.checks.length,0)}))
 if(results.some(r=>!r.pass))process.exitCode=1
}finally{chrome?.close();server.kill('SIGTERM')}
