import { build } from 'vite'
import { resolve } from 'node:path'
await build({ define: { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' }, build: { outDir: process.env.PREMED_QA_OUT_DIR || '/private/tmp/premed-idb-frozen-review', emptyOutDir: true, rollupOptions: { input: [resolve('index.html'), resolve('output/idb-storage-review/index.html')] } } })
