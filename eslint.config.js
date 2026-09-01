import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'Atlas/**',
    'mockup-lab/**',
    // Legacy nested application mirror. The deployable application is the
    // root src/ tree and this copy owns its own package and lint config.
    'premed-hq/**',
    'premed-hq-documentation/**',
    'output/**',
    'tmp/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // These React 19 compiler-readiness checks identify worthwhile future
      // refactors, but this app still intentionally synchronizes route and
      // persisted state in effects. Keep them visible without making the
      // established architecture fail the release lint gate.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      // Supabase's generated database types are intentionally not checked into
      // this static client repository; Edge Function query builders therefore
      // keep a narrow untyped boundary and validate request data at runtime.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
