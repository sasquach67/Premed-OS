import { build } from 'vite'
import { resolve } from 'node:path'
await build({ build: { outDir: '/private/tmp/premed-idb-frozen-review', emptyOutDir: true, rollupOptions: { input: resolve('output/idb-storage-review/index.html') } } })
