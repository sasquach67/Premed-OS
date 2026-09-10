import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const manifestName = 'release-assets.json'
const maxReleases = 30
const maxBytes = 700 * 1024 * 1024
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const validPath = path => typeof path === 'string' && /^assets\/(?:[\w-]+\/)*[\w.-]+-[\w-]{6,}\.[\w.]+$/.test(path)

export function assetReferences(text, from, origin) {
  const paths = new Set()
  for (const match of text.matchAll(/["'`(]\s*((?:\.?\.?\/)?assets\/[\w./-]+|\.\/[\w.-]+\.(?:js|css|wasm|woff2?|png|jpe?g|svg))(?=["'`)\s?])/g)) {
    // Vite's preload dependency arrays use root-relative "assets/..." values.
    const url = new URL(match[1].startsWith('assets/') ? `/${match[1]}` : match[1], from)
    const path = url.pathname.slice(1)
    if (url.origin === origin && validPath(path)) paths.add(path)
  }
  return [...paths]
}

function validateManifest(value) {
  if (value?.version !== 1 || !Array.isArray(value.releases) || !value.releases.length || value.releases.length > maxReleases) throw new Error('Invalid retained-release manifest')
  for (const release of value.releases) {
    if (typeof release.id !== 'string' || !Array.isArray(release.files) || !release.files.length || release.files.length > 5000) throw new Error('Invalid retained release')
    for (const file of release.files) if (!validPath(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > maxBytes) throw new Error('Invalid retained asset metadata')
  }
  return value.releases
}

async function eachBatch(items, fn) {
  for (let i = 0; i < items.length; i += 8) await Promise.all(items.slice(i, i + 8).map(fn))
}

/** Carry exact hashed files forward; never replace current HTML or current assets. */
export async function retainAssets({ dist, base, releaseId, fetcher = fetch }) {
  const origin = new URL(base).origin
  const cached = new Map()
  const request = async (path, allowMissing = false) => {
    const response = await fetcher(new URL(path, `${origin}/`), { redirect: 'error', signal: AbortSignal.timeout(30000), cache: 'no-store' })
    if (allowMissing && response.status === 404) return null
    if (!response.ok) throw new Error(`Cannot retain ${path}: HTTP ${response.status}. Retry deployment; do not publish without the prior assets.`)
    if (path.startsWith('assets/') && response.headers.get('content-type')?.includes('text/html')) throw new Error(`Expected an asset, received HTML: ${path}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > maxBytes) throw new Error('Retained asset exceeds size limit')
    return bytes
  }
  const fileRecord = (path, bytes) => ({ path, size: bytes.length, sha256: hash(bytes) })
  const currentFiles = []
  for (const name of await readdir(join(dist, 'assets'), { recursive: true })) {
    const path = `assets/${name}`
    if (validPath(path)) currentFiles.push(fileRecord(path, await readFile(join(dist, path))))
  }
  if (!currentFiles.length) throw new Error('Build has no hashed assets')
  const rawManifest = await request(`${manifestName}?release=${encodeURIComponent(releaseId)}`, true)
  let previous
  if (rawManifest) previous = validateManifest(JSON.parse(rawManifest.toString()))
  else {
    // First adoption: walk the deployed entry's hashed JS/CSS dependency graph.
    const html = await request(`?release-assets=${encodeURIComponent(releaseId)}`)
    let pending = assetReferences(html.toString(), `${origin}/`, origin)
    if (!pending.length) throw new Error('Cannot discover the currently deployed assets')
    const seen = new Set()
    while (pending.length) {
      const next = new Set()
      await eachBatch(pending, async path => {
        if (seen.has(path)) return
        seen.add(path)
        if (seen.size > 5000) throw new Error('Deployed dependency graph exceeds limit')
        const bytes = await request(path)
        cached.set(path, bytes)
        if (/\.(js|css)$/.test(path)) for (const ref of assetReferences(bytes.toString(), `${origin}/${path}`, origin)) if (!seen.has(ref)) next.add(ref)
      })
      pending = [...next]
    }
    previous = [{ id: `bootstrap-${hash(html).slice(0, 16)}`, files: [...cached].map(([path, bytes]) => fileRecord(path, bytes)) }]
  }
  const releases = [{ id: releaseId, files: currentFiles }, ...previous.filter(item => item.id !== releaseId)].slice(0, maxReleases)
  const files = new Map()
  for (const release of releases) for (const file of release.files) {
    const existing = files.get(file.path)
    if (existing && (existing.sha256 !== file.sha256 || existing.size !== file.size)) throw new Error(`Hashed asset collision: ${file.path}`)
    files.set(file.path, file)
  }
  if ([...files.values()].reduce((sum, file) => sum + file.size, 0) > maxBytes) throw new Error('Retained assets exceed 700 MiB. Review retention before deployment; no assets were dropped silently.')
  const current = new Set(currentFiles.map(file => file.path))
  await eachBatch([...files.values()].filter(file => !current.has(file.path)), async file => {
    const bytes = cached.get(file.path) ?? await request(file.path)
    if (bytes.length !== file.size || hash(bytes) !== file.sha256) throw new Error(`Retained asset integrity mismatch: ${file.path}`)
    const destination = join(dist, file.path)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, bytes)
  })
  await writeFile(join(dist, manifestName), JSON.stringify({ version: 1, releases }))
  return { releases: releases.length, assets: files.size, retained: files.size - current.size }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await retainAssets({ dist: resolve(process.argv[2] ?? 'dist'), base: process.argv[3] ?? 'https://premedos.app', releaseId: process.env.GITHUB_SHA ?? `local-${Date.now()}` })
  console.log('Retained release assets:', result)
}
