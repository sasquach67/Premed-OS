// Local-only check, never committed: runs the app's importer parser on notebook files.
import { readFileSync } from 'node:fs'
import { it, expect } from 'vitest'
import { parsePortableNotebook } from './visualPackage'
const files = (process.env.NB_FILES ?? '').split('|').filter(Boolean)
it.each(files.length ? files : ['(none)'])('parses %s', f => {
  if (f === '(none)') return
  let msg = 'ok'
  try { parsePortableNotebook(readFileSync(f, 'utf8')) } catch (e) { msg = `${(e as {path?:string}).path ?? ''} ${(e as Error).message}` }
  expect(msg).toBe('ok')
})
