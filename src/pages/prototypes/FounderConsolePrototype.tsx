import { isTypingTarget } from '@/lib/keyboard'
/*
 * PROTOTYPE ONLY — Three founder-console directions, switchable with
 * `?variant=command|desk|pulse` at /prototype/founder-console.
 *
 * Question: What should a private Premed OS owner console feel like before
 * real roles, analytics, feedback storage, or support access exist?
 */
import { useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BellRing, Check, ChevronRight, Clock3, Gauge,
  HeartPulse, MessageSquareText, ShieldCheck, UsersRound,
} from 'lucide-react'

type Variant = 'command' | 'desk' | 'pulse'

const VARIANTS: Array<{ id: Variant; label: string }> = [
  { id: 'command', label: 'A · Command center' },
  { id: 'desk', label: 'B · Investigation desk' },
  { id: 'pulse', label: 'C · Pulseboard' },
]

const metrics = [
  { label: 'Active beta testers', value: '42', note: '+8 this week', color: 'text-primary' },
  { label: 'Calendar connected', value: '11', note: 'verification pending', color: 'text-[#8c7bd4]' },
  { label: 'AI budget reserved', value: '$3.25', note: 'of $10 this week', color: 'text-[#d59b6a]' },
  { label: 'Needs a reply', value: '6', note: 'oldest · 18h ago', color: 'text-[#e08b9b]' },
]

const signals = [
  { tone: 'bg-[#e08b9b]', title: 'Calendar connection stopped at Google consent', body: 'Three people hit the unverified-app screen this afternoon.', action: 'Review setup' },
  { tone: 'bg-primary', title: 'New feedback: “Academics feels like an actual plan now.”', body: 'Sent from Class Hub · 14 minutes ago', action: 'Annotate' },
  { tone: 'bg-[#d59b6a]', title: 'AI weekly guardrail is at 32%', body: 'No individual user is close to the hourly limit.', action: 'View usage' },
]

const events = [
  ['09:41', 'A tester connected Google Calendar', 'safe'],
  ['09:26', 'AI study guide completed', 'safe'],
  ['08:53', 'Feedback reported from Academics', 'note'],
  ['Yesterday', 'One failed Drive-material connection', 'warn'],
]

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' }) {
  const color = tone === 'good' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : tone === 'warn' ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-border bg-muted/70 text-muted-foreground'
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-[0.08em] ${color}`}>{children}</span>
}

function PrototypeHeader({ mode }: { mode: string }) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"><ShieldCheck className="size-4" /> Founder console · prototype</div>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">Keep the beta honest.</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{mode} · Mock data only · No student records are exposed here.</p>
      </div>
      <div className="flex items-center gap-2"><Badge tone="good">systems calm</Badge><button className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground"><BellRing className="mr-1.5 inline size-3.5" />6 to review</button></div>
    </header>
  )
}

function MetricRow({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'divide-y divide-border border-y border-border' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'}>{metrics.map((metric) => <div key={metric.label} className={compact ? 'flex items-center justify-between py-3' : 'rounded-2xl border border-border bg-card p-4 shadow-sm'}><div><p className="text-xs font-bold text-muted-foreground">{metric.label}</p><p className={`mt-1 font-display text-3xl font-extrabold ${metric.color}`}>{metric.value}</p></div><p className="max-w-24 text-right text-[11px] font-semibold text-muted-foreground">{metric.note}</p></div>)}</div>
}

function CommandCenter() {
  return <div className="mx-auto max-w-7xl p-5 sm:p-8"><PrototypeHeader mode="A calm operational overview" /><MetricRow /><div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">Founder’s next moves</p><h2 className="font-display text-2xl font-extrabold">What deserves attention</h2></div><Badge>live feed</Badge></div><div className="mt-4 divide-y divide-border">{signals.map((signal) => <div key={signal.title} className="flex gap-3 py-4"><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${signal.tone}`} /><div className="min-w-0 flex-1"><p className="font-bold">{signal.title}</p><p className="mt-1 text-sm text-muted-foreground">{signal.body}</p></div><button className="self-center text-xs font-extrabold text-primary">{signal.action} <ChevronRight className="inline size-3" /></button></div>)}</div></section>
    <aside className="rounded-3xl border border-border bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_11%,var(--card)),var(--card))] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">Trust checklist</p><h2 className="mt-1 font-display text-xl font-extrabold">Public beta posture</h2><div className="mt-5 space-y-3">{[['Sign-in', 'Google handoff works', true], ['Calendar', 'Sensitive-scope review next', false], ['AI budget', '$10 weekly cap active', true], ['Data access', 'No founder data browser', true]].map(([label, note, done]) => <div key={label as string} className="flex gap-3"><span className={`grid size-6 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-400/15 text-emerald-400' : 'bg-amber-300/15 text-amber-300'}`}>{done ? <Check className="size-3.5" /> : <Clock3 className="size-3.5" />}</span><span><b className="block text-sm">{label as string}</b><small className="text-xs text-muted-foreground">{note as string}</small></span></div>)}</div></aside>
  </div></div>
}

function InvestigationDesk() {
  return <div className="mx-auto max-w-7xl p-5 sm:p-8"><PrototypeHeader mode="A triage desk for feedback and incidents" /><div className="grid gap-5 xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
    <aside className="rounded-2xl border border-border bg-card p-3"><p className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Queues</p>{[['Everything', '12'], ['Needs a founder', '6'], ['Calendar', '3'], ['AI & generation', '2'], ['Suggestion', '1']].map(([label, count], index) => <button key={label} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold ${index === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{label}<span className="text-xs">{count}</span></button>)}<div className="mt-6 border-t border-border px-2 pt-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Tools</p><button className="mt-2 text-sm font-bold text-muted-foreground"><Gauge className="mr-2 inline size-4" />Beta health</button><button className="mt-3 text-sm font-bold text-muted-foreground"><UsersRound className="mr-2 inline size-4" />Roles & access</button></div></aside>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><p className="text-xs font-bold text-muted-foreground">6 items · newest first</p><h2 className="font-display text-2xl font-extrabold">Needs a founder</h2></div>{signals.concat([{ tone: 'bg-[#8c7bd4]', title: 'A tester asked where their data goes after sign-out', body: 'Settings · 52 minutes ago', action: 'Reply' }]).map((signal, index) => <button key={signal.title} className={`flex w-full gap-3 border-b border-border p-5 text-left transition hover:bg-muted/45 ${index === 0 ? 'border-l-4 border-l-[#e08b9b] bg-muted/30' : ''}`}><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${signal.tone}`} /><span className="min-w-0"><b className="block">{signal.title}</b><span className="mt-1 block text-sm text-muted-foreground">{signal.body}</span><span className="mt-2 inline-flex gap-2"><Badge>{index === 0 ? 'calendar' : 'feedback'}</Badge><Badge tone={index === 0 ? 'warn' : 'neutral'}>{index === 0 ? 'needs decision' : 'new'}</Badge></span></span></button>)}</section>
    <aside className="rounded-2xl border border-border bg-card p-5"><Badge tone="warn">selected item</Badge><h2 className="mt-3 font-display text-xl font-extrabold">Calendar consent feels sketchy</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">“I got to Google but the name looked weird, so I backed out.”</p><div className="mt-5 rounded-xl bg-muted p-3"><p className="text-xs font-bold text-muted-foreground">Founder note</p><p className="mt-1 text-sm font-semibold">Brand verification submitted. Do not ask users to reconnect until Google shows premedOS.</p></div><button className="mt-5 w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-extrabold text-primary-foreground">Mark addressed</button><button className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-extrabold">Save private note</button></aside>
  </div></div>
}

function Pulseboard() {
  return <div className="mx-auto max-w-6xl p-5 sm:p-8"><PrototypeHeader mode="A daily founder briefing" /><section className="overflow-hidden rounded-[2rem] border border-[#264154] bg-[#102333] text-[#eef4f5] shadow-xl"><div className="border-b border-white/10 px-6 py-5 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ab9dc]">Sunday briefing</p><h2 className="font-display text-3xl font-extrabold">The beta is quiet enough to learn.</h2></div><span className="rounded-full bg-[#5fb49c]/15 px-3 py-1 text-xs font-extrabold text-[#9fe0cb]"><HeartPulse className="mr-1 inline size-3.5" />healthy</span></div></div><div className="grid xl:grid-cols-[1.1fr_.9fr]"><div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#91a8b6]">Today’s story</p><p className="mt-3 max-w-xl font-display text-2xl font-extrabold leading-tight">People are finding the right doors. The only trust friction is Google Calendar.</p><div className="mt-7 space-y-0">{events.map(([time, event, tone]) => <div key={event} className="grid grid-cols-[5rem_1fr] border-t border-white/10 py-3 text-sm"><span className="font-bold text-[#8ab9dc]">{time}</span><span className={tone === 'warn' ? 'font-bold text-[#f1c47c]' : 'text-[#d7e4e7]'}>{event}</span></div>)}</div></div><div className="border-t border-white/10 bg-white/[0.035] p-6 sm:border-l sm:border-t-0 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#91a8b6]">Four numbers that matter</p><div className="mt-3">{metrics.map((metric) => <div key={metric.label} className="flex items-end justify-between border-b border-white/10 py-3"><span><b className="block text-sm">{metric.label}</b><small className="text-[#91a8b6]">{metric.note}</small></span><strong className="font-display text-3xl text-[#c8e6f2]">{metric.value}</strong></div>)}</div><button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4b9cd3] px-4 py-2.5 text-sm font-extrabold text-[#0d1c28]"><MessageSquareText className="size-4" />Read beta feedback</button></div></div></section></div>
}

function Switcher({ variant }: { variant: Variant }) {
  const navigate = useNavigate()
  const index = VARIANTS.findIndex((item) => item.id === variant)
  const move = useCallback((step: number) => navigate(`/prototype/founder-console?variant=${VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length].id}`), [index, navigate])
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.isComposing || event.defaultPrevented || isTypingTarget(event.target)) return; if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [move])
  if (!import.meta.env.DEV) return null
  return <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center"><div className="flex items-center gap-2 rounded-full border border-border bg-background/95 p-1.5 shadow-2xl backdrop-blur"><button aria-label="Previous prototype" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-full hover:bg-muted"><ArrowLeft className="size-4" /></button><span className="min-w-44 text-center text-xs font-extrabold">{VARIANTS[index].label}</span><button aria-label="Next prototype" onClick={() => move(1)} className="grid size-9 place-items-center rounded-full hover:bg-muted"><ArrowRight className="size-4" /></button></div></div>
}

export function FounderConsolePrototype() {
  const [params] = useSearchParams()
  const raw = params.get('variant')
  const variant: Variant = raw === 'desk' || raw === 'pulse' ? raw : 'command'
  return <div className="min-h-screen bg-background pb-24">{variant === 'command' ? <CommandCenter /> : variant === 'desk' ? <InvestigationDesk /> : <Pulseboard />}<Switcher variant={variant} /></div>
}
