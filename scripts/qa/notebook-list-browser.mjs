// Run against `npm run dev -- --host 127.0.0.1 --port 4179`.
// Disposable Chrome profile and synthetic, signed-out data only.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
const seedOrigin = 'http://127.0.0.1:4179'
const origin = process.env.NOTEBOOK_QA_ORIGIN ?? seedOrigin
const live = origin === 'https://premedos.app'
assert.ok(origin === seedOrigin || live, 'Use the local app or the approved production origin')
const expectedSha = process.env.NOTEBOOK_QA_EXPECTED_SHA
let releaseFiles
if (live) {
  assert.match(expectedSha ?? '', /^[a-f0-9]{40}$/)
  const manifest = await fetch(`${origin}/release-assets.json?verify=${expectedSha}`, {cache:'no-store'}).then(r => r.json())
  assert.equal(manifest.releases[0].id, expectedSha, 'Live release must match the authorized commit')
  releaseFiles = manifest.releases[0].files
}
const evidence = resolve('premed-hq-documentation/implementation/evidence/notebook-list', live ? 'live' : '.')
const profile = mkdtempSync(resolve(tmpdir(), 'notebook-list-chrome-'))
mkdirSync(evidence, { recursive: true })
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let ws
try {
  let targets
  for (let i = 0; i < 80 && !targets; i++) {
    await sleep(250)
    try {
      const port = readFileSync(resolve(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]
      targets = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json())
    } catch { /* Chrome has not published this profile's endpoint yet. */ }
  }
  const target = targets?.find(item => item.type === 'page')
  assert.ok(target)
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail })
  let id = 0
  const pending = new Map()
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data), call = pending.get(msg.id)
    if (msg.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(msg.params))
    if (call) { pending.delete(msg.id); msg.error ? call.fail(new Error(JSON.stringify(msg.error))) : call.ok(msg.result) }
  }
  const send = (method, params = {}) => new Promise((ok, fail) => { const n = ++id; pending.set(n, { ok, fail }); ws.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const waitFor = async expression => { for (let i = 0; i < 500; i++) { if (await evaluate(`Boolean(${expression})`)) return; await sleep(100) } throw new Error(`Timed out: ${expression}; ${await evaluate("location.href + String(document.body.innerText).slice(0,2500)")}`) }
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('premed_hq_public',JSON.stringify({entered:true}));localStorage.setItem('hq:demo-mode','off');localStorage.setItem('hq:workspace-owner','guest');" })
  await send('Page.navigate', { url: seedOrigin })
  await waitFor("document.querySelector('#root')?.firstElementChild")
  await sleep(1500)
  await evaluate(`(async () => {
    const {useStore} = await import('/src/store/store.ts')
    const {createPersonalInitialData} = await import('/src/data/personalInitialData.ts')
    const data = createPersonalInitialData()
    data.profile.name = 'Notebook verification'; data.settings.theme = 'light'; data.settings.quotesApi = false
    data.courses = [{id:'synthetic-course',term:'Fall 2026',code:'PSYC 101',title:'General Psychology',credits:3,grade:'',bcpm:false,status:'In progress',inResidence:true,satisfies:[],order:0}]
    data.academics.classCenter.workspaces = [{id:'synthetic-workspace',courseId:'synthetic-course',color:'blue',icon:'book',type:'stem',status:'active',createdAt:1,updatedAt:1,order:0}]
    const row = (id,title,occurredOn,order) => ({id,courseId:'synthetic-course',title,occurredOn,order,inputPath:'materials',processingState:'ready',workspaceState:'draft',createdAt:Date.UTC(2026,8,28,12),updatedAt:Date.UTC(2026,8,28,12)})
    data.academics.classCenter.lectures = [row('second','Research methods','2026-09-03',0),row('undated','Attention and memory review with a longer notebook title',undefined,1),row('first','Foundations of psychology','2026-09-01',2)]
    useStore.getState().replaceAll(data)
  })()`)
  await sleep(1000)
  if (live) {
    const fixture = await evaluate("(async()=>{const {snapshotData,CURRENT_STORE_VERSION}=await import('/src/store/store.ts');return JSON.stringify({state:snapshotData(),version:CURRENT_STORE_VERSION})})()")
    await send('Page.addScriptToEvaluateOnNewDocument', {source:`if(location.origin === ${JSON.stringify(origin)} && !localStorage.getItem('hq:app-data:guest')) localStorage.setItem('hq:app-data:guest', ${JSON.stringify(fixture)});`})
    await send('Page.navigate', {url:`${origin}/#/academics/classes/synthetic-course`})
    await waitFor("document.querySelectorAll('[data-notebook-row]').length===3")
  }
  await evaluate("location.hash = '/academics/classes/synthetic-course'")
  await waitFor("document.querySelectorAll('[data-notebook-row]').length===3")
  async function editDate(title, date) {
    await evaluate(`document.querySelector('button[aria-label="Actions for ${title}"]').focus()`)
    await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
    await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
    await waitFor("Array.from(document.querySelectorAll('[role=menuitem]')).some(b=>b.textContent==='Edit lecture')")
    await evaluate("Array.from(document.querySelectorAll('[role=menuitem]')).find(b=>b.textContent==='Edit lecture').click()")
    await waitFor("document.querySelector('input[aria-label=\"Lecture title\"]')")
    await evaluate("document.querySelector('button[aria-label=\"Lecture date\"]').click()")
    await waitFor(`document.querySelector('button[data-date="${date}"]')`)
    await evaluate(`document.querySelector('button[data-date="${date}"]').click()`)
    await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save changes').click()")
    await waitFor("!document.querySelector('input[aria-label=\"Lecture title\"]')")
  }
  const order = () => evaluate("Array.from(document.querySelectorAll('[data-notebook-row]')).map(e=>e.dataset.notebookRow)")
  assert.deepEqual(await order(), ['first','second','undated'])
  const results = []
  for (const theme of ['light','dark']) {
    if (!live) await evaluate(`(async()=>{const {useStore}=await import('/src/store/store.ts');useStore.getState().update(d=>{d.settings.theme='${theme}'})})()`)
    else await evaluate(`(() => { const dark = document.documentElement.classList.contains('dark'); if (dark !== ${theme === 'dark'}) document.querySelector('button[aria-label=\"Switch to ${theme} appearance\"]').click() })()`)
    for (const width of [1280,375]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false })
      await sleep(400)
      await evaluate("document.querySelector('.lecture-journal').scrollIntoView({block:'center'})")
      const measurements = await evaluate(`(() => {
        const row=document.querySelector('[data-notebook-row]'), handle=row.querySelector('.notebook-drag-handle'), menu=row.querySelector('[aria-haspopup="menu"]'), list=document.querySelector('.lecture-journal')
        const computed=getComputedStyle(list), root=getComputedStyle(document.documentElement), reset=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Sort by class date')
        return {theme:document.documentElement.classList.contains('dark')?'dark':'light',width:innerWidth,scrollWidth:document.documentElement.scrollWidth,handleWidth:handle.getBoundingClientRect().width,handleHeight:handle.getBoundingClientRect().height,menuWidth:menu.getBoundingClientRect().width,menuHeight:menu.getBoundingClientRect().height,resetVisible:Boolean(reset),background:computed.backgroundColor,cardToken:root.getPropertyValue('--card').trim(),font:getComputedStyle(row.querySelector('b')).fontFamily,added:document.querySelector('[data-notebook-row="undated"] time').textContent}
      })()`)
      assert.equal(measurements.theme, theme)
      assert.ok(measurements.scrollWidth <= width, JSON.stringify(measurements))
      assert.ok(measurements.handleWidth >= 44 && measurements.handleHeight >= 44)
      assert.ok(measurements.menuWidth >= 44 && measurements.menuHeight >= 44, JSON.stringify(measurements))
      assert.equal(measurements.resetVisible, false)
      assert.match(measurements.added, /^Added Sep 28/)
      results.push(measurements)
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(resolve(evidence, `${theme}-${width}.png`), Buffer.from(shot.data, 'base64'))
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false })
  await evaluate("document.querySelector('.lecture-journal').scrollIntoView({block:'center'})")
  await sleep(800)
  await editDate('Research methods', '2026-09-25')
  assert.deepEqual(await order(), ['first','second','undated'])
  await evaluate("document.querySelector('.notebook-drag-handle').scrollIntoView({block:'center',behavior:'instant'})")
  await sleep(400)
  // Real pointer drag through Chrome's input channel.
  const boxes = await evaluate("Array.from(document.querySelectorAll('.notebook-drag-handle')).map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})")
  const start = boxes[0], end = boxes[1]
  await send('Input.dispatchMouseEvent', {type:'mouseMoved',x:start.x,y:start.y})
  await sleep(50)
  await send('Input.dispatchMouseEvent', {type:'mousePressed',x:start.x,y:start.y,button:'left',clickCount:1})
  for(let step=1;step<=12;step++) { await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x,y:start.y+(end.y-start.y)*step/12,button:'left',buttons:1}); await sleep(30) }
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',x:end.x,y:end.y,button:'left',clickCount:1})
  await sleep(400)
  assert.deepEqual(await order(), ['second','first','undated'], await evaluate("location.href + document.body.innerText.slice(0,1000)"))
  assert.ok(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Sort by class date').getBoundingClientRect().height >= 44"))
  await editDate('Research methods', '2026-09-02')
  assert.deepEqual(await order(), ['second','first','undated'])
  await evaluate('window.__notebookBeforeReload = true')
  await send('Page.reload')
  await waitFor("window.__notebookBeforeReload !== true && document.querySelectorAll('[data-notebook-row]').length===3")
  assert.deepEqual(await order(), ['second','first','undated'])
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Sort by class date').click()")
  await sleep(300)
  assert.deepEqual(await order(), ['first','second','undated'])
  assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Sort by class date')"), false)
  await send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'reduce'}] })
  assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-notebook-row]')).transitionDuration"), '0s')
  // Empty state on the same isolated synthetic workspace.
  if (live) {
    while ((await order()).length) {
      const title = await evaluate("document.querySelector('.notebook-drag-handle').getAttribute('aria-label').slice('Reorder '.length)")
      await evaluate(`document.querySelector('button[aria-label="Actions for ${title}"]').focus()`)
      await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
      await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
      await waitFor("Array.from(document.querySelectorAll('[role=menuitem]')).some(b=>b.textContent==='Delete lecture')")
      await evaluate("Array.from(document.querySelectorAll('[role=menuitem]')).find(b=>b.textContent==='Delete lecture').click()")
      await waitFor("document.querySelector('[role=alertdialog]')")
      const count = (await order()).length
      await evaluate("Array.from(document.querySelectorAll('[role=alertdialog] button')).find(b=>b.textContent==='Delete lecture').click()")
      await waitFor(`document.querySelectorAll('[data-notebook-row]').length === ${count - 1}`)
    }
  } else {
    await evaluate("(async()=>{const {useStore}=await import('/src/store/store.ts');useStore.getState().update(d=>{d.academics.classCenter.lectures=[]})})()")
  }
  await waitFor("document.querySelector('.lecture-journal-empty')")
  assert.equal(await evaluate("document.querySelectorAll('[data-notebook-row]').length"), 0)
  const verifiedBundles = []
  if (live) {
    const loaded = await evaluate("performance.getEntriesByType('resource').map(r=>r.name).filter(url=>url.startsWith(location.origin+'/assets/') && /\\.(js|css)(\\?|$)/.test(url))")
    for (const url of [...new Set(loaded)]) {
      const path = new URL(url).pathname.slice(1)
      const expected = releaseFiles.find(file => file.path === path)
      assert.ok(expected, `Loaded bundle must belong to exact release: ${path}`)
      const response = await fetch(url, {cache:'no-store'})
      assert.ok(response.ok)
      const bytes = Buffer.from(await response.arrayBuffer())
      assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256)
      assert.equal(bytes.length, expected.size)
      verifiedBundles.push(path)
    }
    assert.ok(verifiedBundles.length > 0)
  }
  writeFileSync(resolve(evidence,'browser-results.json'), JSON.stringify({checkedAt:new Date().toISOString(),origin,verifiedBundles,releaseSha:live ? expectedSha : undefined,mode:'signed-out, synthetic, disposable Chrome profile',results,pointerDrag:true,metadataEdit:true,persistedReload:true,reset:true,reducedMotion:true,emptyState:true}, null, 2)+'\n')
  console.log('PASS: both themes at 1280/375px, touch targets, pointer drag, persistence reload, reset, reduced motion, empty state')
} finally {
  ws?.close(); chrome.kill('SIGTERM'); await sleep(500)
  rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:500})
}
