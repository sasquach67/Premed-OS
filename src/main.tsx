// FIRST import, deliberately: publicLayer samples localStorage at module
// load to tell a first-time visitor from a returning one, and that has to
// happen before the zustand persist wrapper writes its key for the first
// time. Moving this line down hides the landing page from everybody.
import '@/lib/publicLayer'
// Adopt pre-namespacing secondary caches before any component reads them, so
// an upgrading beta user does not see re-prompted disclosures or empty
// recents on the first render. Cheap, synchronous, and idempotent.
import { migrateLegacyWorkspaceKeys } from '@/lib/workspaceKeyMigration'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'
import { AppMotionProvider } from '@/components/providers/MotionProvider'

migrateLegacyWorkspaceKeys()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppMotionProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppMotionProvider>
  </StrictMode>,
)
