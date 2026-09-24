// Runs scripts/s1/client.test.template inside an exact-revision fixture against the
// disposable local stack. Usage:
//   S1_LOCAL_CONFIRMED=yes node scripts/s1/hooks.mjs old-deployed|old-stale|current [missing-columns]
// Fixtures are `git archive` snapshots (committed code only) under the ignored
// scripts/s1/.runtime/, sharing this checkout's node_modules. No .env is copied.
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const [fixture, extra] = process.argv.slice(2)
const revisions = { 'old-deployed': 'd60f682946e264ea2d680c2c8e2914a86899c114', 'old-stale': '5c7a3e4f1c28c3b36392815c0a63fe3c963cb225', current: 'HEAD' }
if (!Object.hasOwn(revisions, fixture)) throw new Error('Use old-deployed|old-stale|current')
if (process.env.S1_LOCAL_CONFIRMED !== 'yes') throw new Error('Set S1_LOCAL_CONFIRMED=yes only for the disposable local stack')
const revision = execFileSync('git', ['rev-parse', revisions[fixture]], { cwd: root, encoding: 'utf8' }).trim()
const dir = resolve(root, 'scripts/s1/.runtime', `hooks-${fixture}`)
const stamp = resolve(dir, 'S1-SOURCE.txt')
if (!existsSync(stamp) || !readFileSync(stamp, 'utf8').includes(revision)) {
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true })
  const archive = execFileSync('git', ['archive', revision, 'src', 'public', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'scripts/pdfjs-assets.ts'], { cwd: root, maxBuffer: 200 * 1024 * 1024 })
  execFileSync('tar', ['-x', '-C', dir], { input: archive })
  symlinkSync(resolve(root, 'node_modules'), resolve(dir, 'node_modules'), 'dir')
  writeFileSync(stamp, `Exact source: ${revision} (git archive). Dependencies: this checkout's node_modules (same lockfile).\n`)
}
writeFileSync(resolve(dir, 'src/store/s1.local.integration.test.ts'), readFileSync(resolve(root, 'scripts/s1/client.test.template'), 'utf8').replaceAll('S1_FIXTURE', fixture).replaceAll('S1_REVISION', revision))
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(SUPABASE|PG|DATABASE|VITE_|AWS_|S3_)/.test(k)))
env.S1_STATUS_FILE = resolve(root, 'scripts/s1/local/status.json'); env.S1_LOCAL_CONFIRMED = 'yes'
const local = args => execFileSync('node', [resolve(root, 'scripts/s1/run-local.mjs'), ...args], { cwd: root, env: { ...env }, encoding: 'utf8' })
const psql = sql => execFileSync('/Applications/Docker.app/Contents/Resources/bin/docker', ['exec', '-i', '-e', 'PGPASSWORD=postgres', 'supabase_db_premed-s1-disposable', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres'], { input: sql, encoding: 'utf8' })
const vitest = filter => execFileSync(resolve(root, 'node_modules/.bin/vitest'), ['run', 'src/store/s1.local.integration.test.ts', '--maxWorkers=1', ...(filter ? ['-t', filter] : [])], { cwd: dir, env, stdio: 'inherit' })
console.log(`S1 hooks: ${fixture} @ ${revision}`)
if (extra === 'missing-columns') {
  if (fixture !== 'current') throw new Error('missing-columns applies to the current client only')
  // Disposable DB only: remove the S1 objects, prove fail-closed, then roll forward.
  psql(readFileSync(resolve(root, 'scripts/s1/rollback.sql'), 'utf8'))
  try { env.S1_MISSING_COLUMNS = 'yes'; vitest('without the columns') }
  finally { psql(readFileSync(resolve(root, 'supabase/migrations/20260924233000_s1_dashboard_write_guard.sql'), 'utf8')); console.log('Migration re-applied (roll forward).') }
} else vitest()
