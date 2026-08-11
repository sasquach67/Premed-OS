import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Archive as ArchiveIcon, Cloud, CloudOff, Download, Upload, RotateCcw, Check, AlertCircle,
  Palette, ExternalLink, CheckCircle2, Trash2, CalendarClock, RefreshCw, Unplug, Wifi, ShieldCheck, BellOff,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { useBackup } from '@/store/useBackup'
import { useCloudSync } from '@/store/useCloudSync'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import { ROUTE_MAP } from '@/app/routes'
import { exportJson, readJsonFile, looksLikeAppData } from '@/lib/dataIo'
import { resetPublicMeta, hasPreExistingData } from '@/lib/publicLayer'
import { fmtDate, fmtTimeAgo } from '@/lib/date'
import { VISUAL_THEMES } from '@/lib/themeAssets'
import type { AppData } from '@/lib/types'
import { PageHeader } from '@/components/common/PageHeader'
import { WeeklyCapacityCard } from '@/components/common/WeeklyCapacityCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { TimeField } from '@/components/common/DateField'
import { TrashRecovery } from '@/components/common/TrashRecovery'
import { mutedRecommendationRules } from '@/lib/intelligence'
import { clearStudySourceSyncCache, studyTools } from '@/lib/intelligence/studyTools'
import { isDemoMode, setDemoMode } from '@/lib/demoMode'

export function Settings() {
  const route = ROUTE_MAP.settings
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.update)
  const replaceAll = useStore((s) => s.replaceAll)
  const resetToSeed = useStore((s) => s.resetToSeed)
  const backup = useBackup()
  const fileRef = useRef<HTMLInputElement>(null)
  const archiveRef = useRef<HTMLDivElement>(null)
  const [params] = useSearchParams()
  const [msg, setMsg] = useState('')
  const [deletingAiSources, setDeletingAiSources] = useState(false)
  const archiveRequested = params.get('tab') === 'archive'
  const origin = window.location.origin
  const isFileOrigin = window.location.protocol === 'file:'
  const isLocalOrigin = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const isHostedOrigin = window.location.protocol === 'https:' && !isLocalOrigin
  const originOk = !isFileOrigin && (window.location.protocol === 'https:' || isLocalOrigin)
  const backupReady = backup.enabled && backup.configured && backup.connected && Boolean(backup.lastBackupAt)
  const demoActive = isDemoMode()

  useEffect(() => {
    if (archiveRequested) archiveRef.current?.scrollIntoView({ block: 'start' })
  }, [archiveRequested])

  async function onImport(file: File) {
    try {
      const data = await readJsonFile(file)
      replaceAll(data)
      setMsg('Imported successfully.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  async function restoreFromDrive() {
    try {
      const data = await backup.restore()
      if (looksLikeAppData(data)) { replaceAll(data as AppData); setMsg('Restored from Google Drive.') }
      else setMsg('No backup found on Drive.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Restore failed.')
    }
  }

  async function deleteAiSources() {
    if (!confirm('Delete every class-source chunk copied to your private Premed OS server workspace? Your local notes, files, and study history will stay intact.')) return
    setDeletingAiSources(true)
    const result = await studyTools.deleteSources()
    setDeletingAiSources(false)
    if (!result.ok) {
      setMsg(result.message)
      return
    }
    clearStudySourceSyncCache()
    setMsg('Server-side AI source copies deleted. Your local class data was not changed.')
  }

  return (
    <div>
      <PageHeader title={route.label} />

      {msg && <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm"><Check className="size-4 text-primary" /> {msg}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={cn(demoActive && 'border-primary/35 bg-primary/7')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Demo data</span>
              <Badge variant={demoActive ? 'default' : 'muted'}>{demoActive ? 'Active' : 'Off'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="normal-case">Use the fictional UNC student</Label>
                <p className="mt-1 text-sm text-muted-foreground">Switches to a fully separate local namespace. Your real data is not read, merged, or changed.</p>
              </div>
              <Switch checked={demoActive} onCheckedChange={setDemoMode} aria-label="Demo data" />
            </div>
            {demoActive && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Reset only the demo namespace to its fresh relative-date state?')) {
                    resetToSeed()
                    setMsg('Demo data reset to a fresh state.')
                  }
                }}
              >
                <RotateCcw className="size-4" /> Reset to fresh demo
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Local data</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Everything autosaves to this browser instantly. Export a JSON copy for safekeeping, or import one to restore.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportJson}><Download className="size-4" /> Export JSON</Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import JSON</Button>
              <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f) }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> AI study data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              AI study tools copy only the source chunks you explicitly use to your private server workspace. Your browser data stays canonical.
            </p>
            <Button variant="outline" onClick={deleteAiSources} disabled={deletingAiSources}>
              <Trash2 className="size-4" /> {deletingAiSources ? 'Deleting...' : 'Delete server source copies'}
            </Button>
          </CardContent>
        </Card>

        <Card className={cn(backupReady ? 'border-success/40' : 'border-warning/40')}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Cloud className="size-4 text-primary" /> Google Drive backup</span>
              <Badge variant={backupReady ? 'success' : backup.enabled ? 'warning' : 'muted'}>
                {backupReady ? 'Configured' : backup.enabled ? 'Needs reconnect' : 'Not configured'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <BackupCheck
                ok={originOk}
                label={isHostedOrigin ? 'Hosted origin' : isLocalOrigin ? 'Local test origin' : 'Origin'}
                detail={isFileOrigin ? 'Drive backup cannot run from file://. Deploy or run a dev server.' : origin}
              />
              <BackupCheck
                ok={backup.configured}
                label="OAuth Client ID"
                detail={backup.configured ? `Loaded from ${backup.clientIdSource === 'env' ? 'VITE_GOOGLE_CLIENT_ID' : 'Settings'}` : 'Add a Web application Client ID.'}
              />
              <BackupCheck
                ok={backup.enabled && backup.connected}
                label="Drive session"
                detail={backup.enabled ? (backup.connected ? 'Connected for this browser session.' : 'Saved, but reconnect needed after reload or token expiry.') : 'Click Connect Drive after adding the Client ID.'}
              />
              <BackupCheck
                ok={Boolean(backup.lastBackupAt)}
                label="Latest backup"
                detail={backup.lastBackupAt ? `Backed up ${fmtTimeAgo(backup.lastBackupAt)}.` : 'No Drive backup has been written yet.'}
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
              Add this exact origin in Google Cloud → OAuth client → Authorized JavaScript origins:
              <code className="mt-1 block select-all rounded-md bg-card px-2 py-1 font-mono text-foreground">{origin}</code>
            </div>

            <div className="space-y-1.5">
              <Label>Google OAuth Client ID</Label>
              <Input
                defaultValue={settings.backup.googleClientId || (backup.clientIdSource === 'env' ? backup.clientId : '')}
                placeholder="xxxxxx.apps.googleusercontent.com or VITE_GOOGLE_CLIENT_ID"
                onBlur={(e) => update((d) => { d.settings.backup.googleClientId = e.target.value.trim() })}
              />
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Google Cloud Console <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {backup.enabled
                ? <Button variant="outline" onClick={backup.disconnect}>Disconnect</Button>
                : <Button onClick={backup.connect} disabled={!backup.configured}><Cloud className="size-4" /> Connect Drive</Button>}
              <Button variant="outline" onClick={backup.backupNow} disabled={!backup.configured}>Back up now</Button>
              <Button variant="ghost" onClick={restoreFromDrive} disabled={!backup.configured}>Restore</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {backup.lastBackupAt ? <>Last backed up {fmtTimeAgo(backup.lastBackupAt)}.</> : 'Not backed up to Drive yet.'}
              {backup.error && <span className="ml-1 inline-flex items-center gap-1 text-destructive"><AlertCircle className="size-3" /> {backup.error}</span>}
            </p>
          </CardContent>
        </Card>

        <CloudSyncSection onMessage={setMsg} />

        <CalendarIntegrationSection onMessage={setMsg} />

        <WeeklyCapacityCard />

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="size-4 text-primary" /> Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="normal-case">Mode</Label>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button key={t} onClick={() => update((d) => { d.settings.theme = t })} className={cn('rounded-md px-3 py-1 text-xs font-semibold capitalize', settings.theme === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}>{t}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="normal-case">Artwork</Label>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {VISUAL_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    title={theme.description}
                    onClick={() => update((d) => { d.settings.visualTheme = theme.id })}
                    className={cn('inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold', settings.visualTheme === theme.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                  >
                    <span className={cn('size-2.5 rounded-full', theme.id === 'doraemon' ? 'bg-[#1e9bd7]' : 'bg-leaf')} />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div><Label className="normal-case">Live daily quote</Label><p className="text-xs text-muted-foreground">Pull from the web source when available.</p></div>
              <Switch checked={settings.quotesApi} onCheckedChange={(v) => update((d) => { d.settings.quotesApi = v })} />
            </div>

            {settings.dismissedAlertKey && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/35 px-3 py-2">
                <span className="text-sm font-semibold">Due-soon task strip hidden</span>
                <Button size="sm" variant="outline" onClick={() => update((d) => { d.settings.dismissedAlertKey = '' })}>Restore</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <MutedSuggestionsSection />

        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-destructive">Danger zone</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{demoActive ? 'Reset only the isolated demo namespace.' : 'Reset everything back to the seeded UNC plan. Export first if you want a copy.'}</p>
            <Button
              variant="destructive"
              onClick={() => { if (confirm(demoActive ? 'Reset the demo namespace to a fresh state?' : 'Reset all data to the seeded plan? This cannot be undone.')) { resetToSeed(); setMsg(demoActive ? 'Demo data reset.' : 'Reset to the seeded plan.') } }}
            >
              <RotateCcw className="size-4" /> {demoActive ? 'Reset demo' : 'Reset to seed'}
            </Button>
          </CardContent>
        </Card>

        <div ref={archiveRef} id="archive" className="scroll-mt-24 lg:col-span-2">
          <ArchiveSettingsSection highlight={archiveRequested} />
        </div>
      </div>
    </div>
  )
}

function BackupCheck({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  const Icon = ok ? ShieldCheck : CloudOff
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <Icon className={cn('mt-0.5 size-4 shrink-0', ok ? 'text-success' : 'text-warning')} />
      <div className="min-w-0">
        <p className="font-bold">{label}</p>
        <p className="break-words text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function CloudSyncSection({ onMessage }: { onMessage: (msg: string) => void }) {
  const cloud = useCloudSync()
  const [email, setEmail] = useState('')

  if (!cloud.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cloud className="size-4 text-primary" /> Cloud sync &amp; login
            <Badge variant="muted">Not configured</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set <code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code> (see <code className="rounded bg-muted px-1 py-0.5">.env.example</code>) to enable login and cross-device sync.
          </p>
        </CardContent>
      </Card>
    )
  }

  const busy = cloud.status === 'signing-in' || cloud.status === 'syncing'

  async function sendLink() {
    if (!email.trim()) { onMessage('Enter your email first.'); return }
    const ok = await cloud.signIn(email)
    if (ok) onMessage(`Magic sign-in link sent to ${email.trim()}. Open it in this browser.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Cloud className="size-4 text-primary" /> Cloud sync &amp; login
          <Badge variant={cloud.user ? 'success' : 'muted'}>{cloud.user ? 'Signed in' : 'Signed out'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cloud.user ? (
          <>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <ShieldCheck className="mt-0.5 size-4 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold break-words">{cloud.user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {cloud.status === 'syncing' ? 'Syncing…'
                    : cloud.lastSyncAt ? `Synced ${fmtTimeAgo(cloud.lastSyncAt)}.`
                    : 'Connected — first sync pending.'}
                  {cloud.error && <span className="ml-1 inline-flex items-center gap-1 text-destructive"><AlertCircle className="size-3" /> {cloud.error}</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void cloud.pullNow()} disabled={busy}><Download className="size-4" /> Pull from cloud</Button>
              <Button size="sm" variant="outline" onClick={() => void cloud.pushNow()} disabled={busy}><Upload className="size-4" /> Push now</Button>
              <Button size="sm" variant="ghost" onClick={() => void cloud.signOut()} className="ml-auto">Sign out</Button>
            </div>
            <PublicLayerReset />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Sign in with a one-time email link to sync this dashboard across your devices. No password.</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1 space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void sendLink() }} />
              </div>
              <Button onClick={() => void sendLink()} disabled={busy}><Cloud className="size-4" /> Send magic link</Button>
            </div>
            {cloud.error && <p className="inline-flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" /> {cloud.error}</p>}
            <PublicLayerReset />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CalendarIntegrationSection({ onMessage }: { onMessage: (msg: string) => void }) {
  const sync = useCalendarSync()
  const update = useStore((s) => s.update)
  const calendar = sync.calendar

  async function connect() {
    try {
      await sync.connect()
      onMessage('Google Calendar connected read-only.')
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'Calendar connection failed.')
    }
  }

  async function refresh() {
    try {
      await sync.refresh()
      onMessage('Calendar refreshed.')
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'Calendar refresh failed.')
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" /> Google Calendar schedule</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/25 px-3 py-2 text-sm">
            <p className="font-bold">{sync.connected ? `Connected${calendar.connectedAccount ? ` · ${calendar.connectedAccount}` : ''}` : calendar.enabled ? 'Reconnect needed' : 'Not connected'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Premed OS requests read-only Calendar access only. It cannot edit events.</p>
            {calendar.lastSyncedAt && <p className="mt-1 text-xs text-muted-foreground">Last synced {fmtTimeAgo(calendar.lastSyncedAt)}.</p>}
            {(sync.error || calendar.lastError) && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" /> {sync.error || calendar.lastError}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-bold">
              OAuth Client ID
              <Input
                defaultValue={calendar.googleClientId}
                placeholder="VITE_GOOGLE_CLIENT_ID or paste client ID"
                onBlur={(e) => update((d) => { d.settings.calendar.googleClientId = e.target.value.trim() })}
              />
            </label>
            <label className="block text-sm font-bold">
              API key
              <Input
                defaultValue={calendar.googleApiKey}
                placeholder="Optional VITE_GOOGLE_API_KEY"
                onBlur={(e) => update((d) => { d.settings.calendar.googleApiKey = e.target.value.trim() })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {sync.connected
              ? <Button variant="outline" onClick={sync.disconnect}><Unplug className="size-4" /> Disconnect</Button>
              : <Button onClick={connect} disabled={!sync.configured || sync.status === 'connecting'}><Wifi className="size-4" /> Connect Google Calendar</Button>}
            <Button variant="outline" onClick={refresh} disabled={!sync.connected || sync.status === 'syncing'}>
              <RefreshCw className={cn('size-4', sync.status === 'syncing' && 'animate-spin')} /> Refresh
            </Button>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-primary hover:underline">
              OAuth setup <ExternalLink className="size-3" />
            </a>
          </div>

          {!sync.configured && <p className="text-xs text-muted-foreground">Authorized JavaScript origin for local setup: <code className="font-mono">http://localhost:5180</code>. The current dev preview can still show mock schedule data.</p>}
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Timeline start
              <TimeField value={calendar.timelineStart} onChange={(value) => update((d) => { d.settings.calendar.timelineStart = value || '06:00' })} ariaLabel="Timeline start" />
            </label>
            <label className="block text-sm font-bold">
              Timeline end
              <TimeField value={calendar.timelineEnd} onChange={(value) => update((d) => { d.settings.calendar.timelineEnd = value || '23:00' })} ariaLabel="Timeline end" />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label className="normal-case">Time format</Label>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(['12h', '24h'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => update((d) => { d.settings.calendar.timeFormat = format })}
                  className={cn('rounded-md px-3 py-1 text-xs font-semibold uppercase', calendar.timeFormat === format ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ToggleRow label="Locations" checked={calendar.showLocations} onChange={(v) => update((d) => { d.settings.calendar.showLocations = v })} />
            <ToggleRow label="All-day" checked={calendar.showAllDayEvents} onChange={(v) => update((d) => { d.settings.calendar.showAllDayEvents = v })} />
            <ToggleRow label="Mock preview" checked={calendar.useMockPreview} onChange={(v) => update((d) => { d.settings.calendar.useMockPreview = v })} />
          </div>

          <div className="rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
            Selected calendar: <b className="text-foreground">Primary</b>. Additional visible calendars can be added later without changing the hero renderer.
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
      <span className="text-sm font-bold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ArchiveSettingsSection({ highlight }: { highlight: boolean }) {
  const tasks = useStore((s) => s.tasks)
  const focusTargets = useStore((s) => s.focusTargets)
  const patchItem = useStore((s) => s.patchItem)
  const removeItem = useStore((s) => s.removeItem)

  // Milestones live in `tasks` with `milestone: true`; a completed roadmap
  // node is not a finished task and must not be restorable from here (S7).
  const doneTasks = tasks.filter((t) => !t.milestone && (t.archived || t.progress === 'Finished'))
  const doneFocus = focusTargets.filter((f) => f.done)

  return (
    <Card className={cn(highlight && 'ring-2 ring-primary/35')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ArchiveIcon className="size-4 text-primary" /> Archive</CardTitle>
      </CardHeader>
      <CardContent>
        {doneTasks.length === 0 && doneFocus.length === 0 ? (
          <EmptyState icon={ArchiveIcon} title="Nothing archived yet" hint="Finished tasks and completed focus targets land here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-muted/20 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="size-4 text-success" /> Finished tasks <span className="text-xs font-normal text-muted-foreground">({doneTasks.length})</span></h3>
              <div className="space-y-1.5">
                {doneTasks.length === 0 && <p className="py-2 text-sm text-muted-foreground">No finished tasks.</p>}
                {doneTasks.map((t) => (
                  <div key={t.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-card/70">
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through">{t.title || 'Untitled'}</span>
                    {t.deadline && <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(t.deadline)}</span>}
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => patchItem('tasks', t.id, { archived: false, progress: 'Working on', kanban: 'doing' })}>
                      <RotateCcw className="size-3.5" /> Restore
                    </Button>
                    <button onClick={() => removeItem('tasks', t.id)} className="rounded-md p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete ${t.title || 'task'}`}><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-muted/20 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="size-4 text-success" /> Completed focus <span className="text-xs font-normal text-muted-foreground">({doneFocus.length})</span></h3>
              <div className="space-y-1.5">
                {doneFocus.length === 0 && <p className="py-2 text-sm text-muted-foreground">No completed focus targets.</p>}
                {doneFocus.map((f) => (
                  <div key={f.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-card/70">
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through">{f.text}</span>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => patchItem('focusTargets', f.id, { done: false })}>
                      <RotateCcw className="size-3.5" /> Restore
                    </Button>
                    <button onClick={() => removeItem('focusTargets', f.id)} className="rounded-md p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete ${f.text}`}><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        <div className="mt-6 border-t border-border pt-6">
          <TrashRecovery />
        </div>
      </CardContent>
    </Card>
  )
}

/** Muted suggestions (foundation L6 alert-fatigue guard).
 *
 *  Muting a rule must never be a silent black hole: anything the engine has
 *  stopped suggesting is listed here and can be turned back on in one click.
 *  Blocking items are never mutable, so they can never appear in this list. */
function MutedSuggestionsSection() {
  const data = useStore()
  const unmute = useStore((s) => s.unmuteRecommendationRule)
  const muted = mutedRecommendationRules(data)
  if (!muted.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BellOff className="size-4 text-primary" /> Muted suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          These suggestions stopped appearing after you dismissed them repeatedly. Urgent and blocking items are never muted.
        </p>
        <div className="space-y-1.5">
          {muted.map((rule) => (
            <div key={rule.ruleId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{rule.label}</p>
                <p className="text-xs text-muted-foreground">Muted {fmtTimeAgo(rule.at)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => unmute(rule.ruleId)}>
                <RotateCcw className="size-3.5" /> Turn back on
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


/* ── Front door ──────────────────────────────────────────────────────────
   `/` shows the landing page to a first-time visitor and the dashboard to
   everyone else, and that decision is sticky: once this browser has used
   Premed OS, the landing page, the sign-in screens and the local→account merge
   become unreachable from the address bar.

   That is correct for a visitor and unworkable for anyone checking that
   the flow still works. This block is the way back:

     - "View the landing page" opens `/landing`, which always renders it.
     - "Reset the front door" clears the two convenience flags in
       publicLayer.ts — nothing else. It does not sign anyone out, does not
       touch the store, and cannot lose work. After it, `/` shows the
       landing page again and the merge screen will be offered once more.

   Deliberately in Settings rather than behind a dev flag: it is a real
   control with an honest description, and a hidden one would rot.        */
function PublicLayerReset() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  return (
    <div className="space-y-2 rounded-lg border border-dashed bg-muted/40 p-3">
      <p className="text-xs font-semibold">Front door</p>
      <p className="text-xs text-muted-foreground">
        The landing page only greets first-time visitors. Reset it to see that flow again —
        this clears two display flags and nothing else. Your data, your session, and your
        settings are untouched.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate('/landing')}>
          View the landing page
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            resetPublicMeta()
            setDone(true)
          }}
        >
          Reset the front door
        </Button>
        {done && (
          <span className="text-xs text-success">
            Reset{hasPreExistingData() ? ' — this browser has data from before the landing page existed, so “/” still opens your dashboard. Use the button above.' : ' — “/” will show the landing page again.'}
          </span>
        )}
      </div>
    </div>
  )
}
