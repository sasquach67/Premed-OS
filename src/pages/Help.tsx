import {
  MessageCircle, Users, ExternalLink, ShieldCheck, Search, Sparkles, Keyboard,
} from 'lucide-react'
import { ROUTE_MAP } from '@/app/routes'
import { useStore } from '@/store/store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COMMUNITIES = [
  ['r/premed', 'https://www.reddit.com/r/premed/', 'The main hub — WAMC, cycle results, candid advice, the wiki.'],
  ['r/MCAT', 'https://www.reddit.com/r/Mcat/', 'MCAT Q&A, practice discussion, score-release threads.'],
  ['Student Doctor Network', 'https://forums.studentdoctor.net/forums/pre-medical-md.10/', 'Higher-signal moderated forum with adcoms/residents.'],
  ['College Confidential — UNC premed', 'https://talk.collegeconfidential.com/t/unc-premed-specific-questions/481935', 'UNC-specific premed questions.'],
]

const HOW = [
  [ShieldCheck, 'Your data is safe', 'Every edit autosaves to this browser instantly. Connect Google Drive in Settings for an off-device daily backup, and export a JSON copy anytime.'],
  [Search, 'Command search (⌘K)', 'Press ⌘K (or Ctrl+K) to find classes, notes, assignments, tasks, resources, contacts, and settings.'],
  [Sparkles, 'The ram’s daily tip', 'The mascot serves one tip a day from an editable pool — click it for another, or edit the pool with the pencil.'],
  [Keyboard, 'Everything is inline-editable', 'Tables edit in place — add, check off, drag to reorder, delete. Finishing an assignment clears it from the active table and the calendar.'],
]

export function Help() {
  const route = ROUTE_MAP.help
  const discord = useStore((s) => s.notes['discord-url'] ?? '')
  const setNote = useStore((s) => s.setNote)

  return (
    <div>
      <PageHeader title={route.label} />

      {/* Discord — the hub link */}
      <Card className="mb-6 overflow-hidden border-primary/30">
        <CardContent className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-secondary/60 to-card py-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><MessageCircle className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Your Discord</p>
          </div>
          <div className="flex items-center gap-2">
            <Input aria-label="Discord invite URL" defaultValue={discord} placeholder="https://discord.gg/…" onBlur={(e) => setNote('discord-url', e.target.value)} className="w-56" />
            {discord && (
              <a href={discord} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                Open <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4 text-primary" /> Communities</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {COMMUNITIES.map(([label, url, desc]) => (
              <div key={label} className="group relative flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40">
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                <div>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${desc}`} className="block text-sm font-semibold after:absolute after:inset-0 after:rounded-lg">{label}</a>
                  <details className="relative z-10 text-xs text-muted-foreground"><summary>Learn more</summary><p>{desc}</p></details>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>How this app works</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {HOW.map(([Icon, title, body]) => {
              const I = Icon as typeof Users
              return (
                <div key={title as string} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><I className="size-4" /></span>
                  <div><span className="block text-sm font-semibold">{title as string}</span>{Icon === Search || Icon === Sparkles
                    ? <details className="text-xs text-muted-foreground"><summary>Learn more</summary><p>{body as string}</p></details>
                    : <span className="block text-xs text-muted-foreground">{body as string}</span>}</div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Label className="mb-1 block">Note</Label>
        Reddit and SDN block automated tools, so community content is pulled in by you, not auto-synced. The North Star tab distills the r/premed wiki’s practical advice; these links take you to the live source.
      </div>
    </div>
  )
}
