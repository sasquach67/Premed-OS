/* ============================================================
   AppErrorBoundary — the app's crash airbag.

   Without this, one render error blanks the whole app; and since
   state hydrates from localStorage on boot, a bad migration could
   crash-loop with no way to reach Settings → Export. This screen
   always offers a raw data export + recovery actions.

   Deliberately dependency-free: no store import, no UI kit, no
   router — so it still renders when any of those are the problem.
   ============================================================ */
import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { activeStorageKey } from '@/lib/demoMode'

function rawStorageKey() {
  return activeStorageKey()
}

interface Props { children: ReactNode }
interface State { error: Error | null }

function downloadRawData(): void {
  const raw = localStorage.getItem(rawStorageKey())
  if (!raw) {
    window.alert('No saved data found in this browser.')
    return
  }
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `premedos-raw-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for debugging; there is no telemetry in this app by design.
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
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        fontFamily: 'system-ui, sans-serif', background: '#faf7f2', color: '#1f2937', padding: 24,
      }}>
        <div style={{ maxWidth: 520, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
            Premed OS hit an unexpected error. Your data is still saved in this browser —
            export a copy below, then try reloading.
          </p>
          <pre style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 12, overflow: 'auto', maxHeight: 120 }}>
            {this.state.error.message}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={downloadRawData} style={btn('#0f766e')}>Export my data (JSON)</button>
            <button onClick={() => window.location.reload()} style={btn('#1d4ed8')}>Reload</button>
            <button onClick={this.handleReset} style={btn('#b91c1c')}>Reset to defaults…</button>
          </div>
        </div>
      </div>
    )
  }
}

function btn(bg: string): CSSProperties {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  }
}
