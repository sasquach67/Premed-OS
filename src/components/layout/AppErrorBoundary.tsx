/* ============================================================
   AppErrorBoundary — the app's crash airbag.

   Without this, one render error blanks the whole app; and since
   state hydrates from localStorage on boot, a bad migration could
   crash-loop with no way to reach Settings → Export. This screen
   always offers a raw data export + recovery actions.

   Independent of the app UI: no store import, no UI kit, no
   router — so it still renders when any of those are the problem.
   The small demoMode helper selects the active workspace storage key.
   ============================================================ */
import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { activeStorageKey } from '@/lib/demoMode'
import { decodeWorkspaceStorage } from '@/store/workspaceStorageCodec'
import { appRecoveryUrl, isAppLoadError } from '@/lib/appLoadRecovery'

function rawStorageKey() {
  return activeStorageKey()
}

interface Props { children: ReactNode }
interface State { error: Error | null; loadError?: Error | null; copied?: boolean }

function downloadRawData(): void {
  const raw = localStorage.getItem(rawStorageKey())
  if (!raw) {
    window.alert('No saved data found in this browser.')
    return
  }
  let exported = raw, extension = 'json'
  try { exported = decodeWorkspaceStorage(raw) } catch { extension = 'txt' }
  // Even a damaged cache remains downloadable verbatim for recovery.
  const blob = new Blob([exported], { type: extension === 'json' ? 'application/json' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `premedos-raw-backup-${stamp}.${extension}`
  a.click()
  URL.revokeObjectURL(url)
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  private componentStack = ''

  private handlePreloadError = (event: Event): void => {
    const error = (event as Event & { payload?: unknown }).payload
    if (isAppLoadError(error)) this.setState({ loadError: error as Error })
    // Keep normal rejection semantics so callers can handle their own failure.
    // Never reload, reset storage, or discard mounted forms from this event.
  }

  componentDidMount(): void { window.addEventListener('vite:preloadError', this.handlePreloadError) }
  componentWillUnmount(): void { window.removeEventListener('vite:preloadError', this.handlePreloadError) }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for debugging; there is no telemetry in this app by design.
    this.componentStack = info.componentStack ?? ''
    console.error('Premed OS crashed:', error, info.componentStack)
  }

  private handleReset = (): void => {
    const sure = window.confirm(
      'This deletes the saved data in this browser and restarts with defaults.\n\n' +
      'Export your data first if you have not already. Continue?'
    )
    if (!sure) return
    localStorage.removeItem(rawStorageKey())
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.error) return <>{this.props.children}{this.state.loadError && <AppLoadRecovery compact onDismiss={() => this.setState({ loadError: null })} />}</>
    if (isAppLoadError(this.state.error)) return <AppLoadRecovery />
    const dark = document.documentElement.classList.contains('dark')
    const surface = dark ? '#2b2722' : '#fff'
    const border = dark ? '#3c352d' : '#e5e7eb'
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        fontFamily: 'system-ui, sans-serif', background: dark ? '#211e1a' : '#faf7f2', color: dark ? '#ece3d4' : '#1f2937', padding: 24,
      }}>
        <div style={{ maxWidth: 520, background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
            Premed OS hit an unexpected error. Your data is still saved in this browser —
            export a copy below, then try reloading.
          </p>
          <pre style={{ background: dark ? '#322e28' : '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 12, overflow: 'auto', maxHeight: 120 }}>
            {this.state.error.message}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={async () => {
              try { await navigator.clipboard.writeText(`${this.state.error?.stack ?? this.state.error?.message}\n${this.componentStack}`); this.setState({ copied: true }) } catch { this.setState({ copied: false }) }
            }} style={btn('#374151')}>{this.state.copied ? 'Copied' : 'Copy error details'}</button>
            <button onClick={downloadRawData} style={btn('#0f766e')}>Export my data (JSON)</button>
            <button onClick={() => window.location.reload()} style={btn('#1d4ed8')}>Reload</button>
            <button onClick={this.handleReset} style={btn('#b91c1c')}>Reset to defaults…</button>
          </div>
        </div>
      </div>
    )
  }
}

function AppLoadRecovery({ compact = false, onDismiss }: { compact?: boolean; onDismiss?: () => void }) {
  const dark = document.documentElement.classList.contains('dark')
  return <section role="alert" aria-labelledby="app-load-recovery-title" style={compact
    ? { position: 'fixed', zIndex: 10000, bottom: 20, right: 20, maxWidth: 520, maxHeight: '80vh', overflow: 'auto', marginLeft: 20 }
    : { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
    <div style={{ maxWidth: 520, border: '1px solid #8b8278', borderRadius: 12, padding: 24, fontFamily: 'system-ui, sans-serif', background: dark ? '#2b2722' : '#fff', color: dark ? '#ece3d4' : '#1f2937' }}>
      <h1 id="app-load-recovery-title" style={{ fontSize: 20, marginTop: 0 }}>Part of Premed OS couldn’t load</h1>
      <p style={{ lineHeight: 1.5 }}>{navigator.onLine === false ? 'You appear to be offline. Reconnect, then open the app again.' : 'This can happen after an app update or a connection problem.'} Your saved data has not been reset.</p>
      <p style={{ lineHeight: 1.5 }}>Open the current app in a new tab to keep this tab in place. Copy any unsaved work you can still access before reloading this tab.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <a href={appRecoveryUrl(window.location.href)} target="_blank" rel="noopener" style={{ ...btn('#1d4ed8'), textDecoration: 'none' }}>Open current app in new tab</a>
        <button style={btn('#374151')} onClick={() => {
          if (window.confirm('Reload this tab? Unsaved work may be lost. Copy or save it first. Saved notebooks and stored drafts will not be reset.')) window.location.assign(appRecoveryUrl(window.location.href))
        }}>Reload this tab…</button>
        <button style={btn('#0f766e')} onClick={downloadRawData}>Export saved data</button>
        {onDismiss && <button style={btn('#374151')} onClick={onDismiss}>Keep working here</button>}
      </div>
    </div>
  </section>
}

function btn(bg: string): CSSProperties {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  }
}
