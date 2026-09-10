import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { retainAssets } from './retain-assets.mjs'

async function fixture(run) {
  const dist = await mkdtemp(join(tmpdir(), 'premed-retention-test-'))
  await mkdir(join(dist, 'assets'))
  await writeFile(join(dist, 'index.html'), 'NEW HTML')
  await writeFile(join(dist, 'assets/new-abcdef.js'), 'new application')
  const site = new Map([
    ['/', '<script src="/assets/entry-123456.js"></script>'],
    ['/assets/entry-123456.js', 'import("./Academics-abcdef.js"); const deps=["assets/page-123456.css"]'],
    ['/assets/Academics-abcdef.js', 'export const page = "old compatible page"'],
    ['/assets/page-123456.css', 'body { color: black }'],
  ])
  const fetcher = async url => {
    const path = new URL(url).pathname
    return site.has(path) ? new Response(site.get(path), { headers: { 'content-type': path.endsWith('.js') ? 'application/javascript' : 'text/plain' } }) : new Response('missing', { status: 404 })
  }
  try { await run({ dist, site, fetcher }) } finally { await rm(dist, { recursive: true, force: true }) }
}

test('retains a complete prior entry/JS/CSS graph across two releases without replacing new HTML', () => fixture(async ({ dist, site, fetcher }) => {
  const first = await retainAssets({ dist, base: 'https://example.test', releaseId: 'first', fetcher })
  assert.equal(first.retained, 3)
  assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), 'NEW HTML')
  for (const path of site.keys()) if (path.startsWith('/assets/')) assert.equal(await readFile(join(dist, path.slice(1)), 'utf8'), site.get(path))
  site.set('/release-assets.json', await readFile(join(dist, 'release-assets.json')))
  site.set('/assets/new-abcdef.js', 'new application')
  await rm(join(dist, 'assets'), { recursive: true }); await mkdir(join(dist, 'assets'))
  await writeFile(join(dist, 'assets/next-abcdef.js'), 'next application')
  const second = await retainAssets({ dist, base: 'https://example.test', releaseId: 'second', fetcher })
  assert.equal(second.releases, 3); assert.equal(second.retained, 4)
  assert.equal(await readFile(join(dist, 'assets/Academics-abcdef.js'), 'utf8'), 'export const page = "old compatible page"')
}))

test('fails closed if an old dependency is missing', () => fixture(async ({ dist, site, fetcher }) => {
  site.delete('/assets/Academics-abcdef.js')
  await assert.rejects(retainAssets({ dist, base: 'https://example.test', releaseId: 'first', fetcher }), /HTTP 404/)
}))

test('rejects tampered retained bytes and unsafe manifest paths', () => fixture(async ({ dist, site, fetcher }) => {
  await retainAssets({ dist, base: 'https://example.test', releaseId: 'first', fetcher })
  const manifest = JSON.parse(await readFile(join(dist, 'release-assets.json'), 'utf8'))
  site.set('/release-assets.json', JSON.stringify(manifest)); site.set('/assets/new-abcdef.js', 'new application')
  site.set('/assets/Academics-abcdef.js', 'changed bytes')
  await rm(join(dist, 'assets'), { recursive: true }); await mkdir(join(dist, 'assets'))
  await writeFile(join(dist, 'assets/next-abcdef.js'), 'next application')
  await assert.rejects(retainAssets({ dist, base: 'https://example.test', releaseId: 'second', fetcher }), /integrity mismatch/)
  manifest.releases[0].files[0].path = '../index.html'
  site.set('/release-assets.json', JSON.stringify(manifest))
  await assert.rejects(retainAssets({ dist, base: 'https://example.test', releaseId: 'second', fetcher }), /Invalid retained asset/)
}))

test('retains exactly the most recent 30 releases and deduplicates shared assets', () => fixture(async ({ dist, site, fetcher }) => {
  await retainAssets({ dist, base: 'https://example.test', releaseId: 'first', fetcher })
  const manifest = JSON.parse(await readFile(join(dist, 'release-assets.json'), 'utf8'))
  const files = manifest.releases[1].files
  site.set('/release-assets.json', JSON.stringify({ version: 1, releases: Array.from({ length: 30 }, (_, i) => ({ id: `old-${i}`, files })) }))
  await rm(join(dist, 'assets'), { recursive: true }); await mkdir(join(dist, 'assets'))
  await writeFile(join(dist, 'assets/next-abcdef.js'), 'next application')
  const result = await retainAssets({ dist, base: 'https://example.test', releaseId: 'newest', fetcher })
  const saved = JSON.parse(await readFile(join(dist, 'release-assets.json'), 'utf8'))
  assert.equal(result.assets, 4)
  assert.equal(saved.releases.length, 30)
  assert.equal(saved.releases[0].id, 'newest')
  assert.equal(saved.releases.at(-1).id, 'old-28')
}))
