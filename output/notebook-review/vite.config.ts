import { defineConfig, mergeConfig } from 'vite'
import appConfig from '../../vite.config'
export default mergeConfig(appConfig, defineConfig({
  base: './',
  define: { 'import.meta.env.VITE_NOTEBOOK_REVIEW': JSON.stringify('1') },
  build: {
    outDir: '/Users/andyquach/Documents/premed-os/output/notebook-workflows-v2/app/student-review',
    emptyOutDir: false,
    rollupOptions: { input: 'output/notebook-review/index.html' },
  },
}))
