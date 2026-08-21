/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config for Premed OS.
// - @tailwindcss/vite  : Tailwind v4 (no separate tailwind.config; tokens live in index.css)
// - '@' alias          : maps to /src so imports read like "@/components/ui/button"
export default defineConfig({
  // The app is served from the root of its GitHub Pages custom domain:
  // https://premedos.app/. The Pages repository path is no longer part of
  // public asset URLs, so this must stay '/'.
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // This Vite project owns the root src/ app. Atlas has its own runner,
    // aliases, and Playwright suites, so the app gate must not collect it.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
