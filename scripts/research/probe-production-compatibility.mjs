import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Intentionally pinned: the release-assets.json production revision observed on
// September 24, 2026. This is a local reproduction, not a live account operation.
const revision = '5c7a3e4f1c28c3b36392815c0a63fe3c963cb225'
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const dependencies = join(root, 'node_modules')
if (!existsSync(dependencies)) throw new Error('Install this checkout\'s dependencies with npm ci before running the probe.')
const scratch = mkdtempSync(join(tmpdir(), 't4-production-compatibility-'))
const archive = execFileSync('git', ['archive', revision, 'src', 'scripts', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
execFileSync('tar', ['-xf', '-', '-C', scratch], { input: archive })
if (readFileSync(join(root, 'package-lock.json'), 'utf8') !== readFileSync(join(scratch, 'package-lock.json'), 'utf8')) {
  throw new Error(`Dependency lock differs from the pinned production revision. Install its dependencies separately in ${scratch}, then run its fixture; do not silently reuse a different runtime.`)
}
symlinkSync(realpathSync(dependencies), join(scratch, 'node_modules'), 'dir')
copyFileSync(join(root, 'scripts/research/fixtures/production-compatibility-probe.test.ts'), join(scratch, 'src/store/t4OldClientProbe.test.ts'))
const result = spawnSync('npm', ['test', '--', 'src/store/t4OldClientProbe.test.ts', 'src/store/indexeddbWorkspace.integration.test.ts', 'src/store/useCloudSync.safety.test.ts', '--maxWorkers=2', '--reporter=verbose'], { cwd: scratch, encoding: 'utf8' })
const evidence = `Pinned production source: ${revision}\nIsolated archive: ${scratch}\nOne compatibility probe plus 47 existing persistence/sync tests. No live remote reads or writes.\n\n${result.stdout ?? ''}${result.stderr ?? ''}`
writeFileSync(join(scratch, 'evidence.log'), evidence)
process.stdout.write(evidence)
console.log(`Evidence retained at ${join(scratch, 'evidence.log')}`)
if (result.error) throw result.error
process.exitCode = result.status ?? 1
