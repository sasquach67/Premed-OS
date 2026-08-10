/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config for Premed OS.
// - @tailwindcss/vite  : Tailwind v4 (no separate tailwind.config; tokens live in index.css)
// - '@' alias          : maps to /src so imports read like "@/components/ui/button"
export default defineConfig({
  // base must match the GitHub Pages URL path: https://sasquach67.github.io/Premed-OS/
  // (If you later move to Netlify/Vercel or a custom domain, change this back to '/')
  base: '/Premed-OS/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
  },
})
