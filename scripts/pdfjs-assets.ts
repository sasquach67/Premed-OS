import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'

/** Serve PDF.js support files from the same installed version as the worker.
 * The worker loads these by URL; bundling its JS alone does not include them. */
export function pdfjsAssets(): Plugin {
  const root = dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'))
  const assets = new Map<string, Buffer>()
  for (const directory of ['cmaps', 'standard_fonts']) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      if (entry.isFile()) assets.set(`pdfjs/${directory}/${entry.name}`, readFileSync(join(root, directory, entry.name)))
    }
  }
  let base = '/'
  return {
    name: 'pdfjs-support-assets',
    configResolved(config) { base = config.base },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        if (!pathname.startsWith(base)) return next()
        const asset = assets.get(pathname.slice(base.length))
        if (!asset) return next()
        response.setHeader('Content-Type', 'application/octet-stream')
        response.setHeader('Content-Length', asset.length)
        response.end(request.method === 'HEAD' ? undefined : asset)
      })
    },
    generateBundle() {
      for (const [fileName, source] of assets) this.emitFile({ type: 'asset', fileName, source })
    },
  }
}
