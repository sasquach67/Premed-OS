import { useMemo, useRef, useState } from 'react'
import { IdCard, FileText, Target, GraduationCap, Camera, Trash2 } from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { gpaStats, fmtGpa, hourTotals, bestMcat } from '@/lib/selectors'
import type { ExperienceCategory, Goals, Profile as ProfileT } from '@/lib/types'
import { fmtDate } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { DocEmbed } from '@/components/common/DocEmbed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  clinical: 'Clinical Experience', volunteering: 'Volunteering & Service',
  shadowing: 'Physician Shadowing', research: 'Research', leadership: 'Leadership & Activities',
}

export function Profile() {
  const route = ROUTE_MAP.profile
  return (
    <div>
      <PageHeader title={route.label} />
      <IdentityHeader />
      <Tabs defaultValue="cv">
        <TabsList>
          <TabsTrigger value="cv"><IdCard className="size-4" /> Auto-CV</TabsTrigger>
          <TabsTrigger value="resume"><FileText className="size-4" /> Resume Doc</TabsTrigger>
          <TabsTrigger value="goals"><Target className="size-4" /> Goals & Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="cv"><AutoCv /></TabsContent>
        <TabsContent value="resume"><ResumeDoc /></TabsContent>
        <TabsContent value="goals"><GoalsEditor /></TabsContent>
      </Tabs>
    </div>
  )
}

/** Sectioned identity header with editable avatar + at-a-glance stats (I1, I4). */
function IdentityHeader() {
  const profile = useStore((s) => s.profile)
  const courses = useStore((s) => s.courses)
  const experiences = useStore((s) => s.experiences)
  const mcat = useStore((s) => s.mcat)
  const update = useStore((s) => s.update)
  const gpa = useMemo(() => gpaStats(courses), [courses])
  const hours = hourTotals(experiences)
  const best = bestMcat(mcat)
  const totalHours = Math.round(hours.clinical + hours.volunteering + hours.shadowing + hours.research + hours.leadership)

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
        <AvatarUpload value={profile.avatarDataUrl} name={profile.name} onChange={(v) => update((d) => { d.profile.avatarDataUrl = v })} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.major} · {profile.track} · {profile.school}</p>
          <p className="text-xs text-muted-foreground">{profile.classYear} · matriculate {profile.matriculationTarget} · {profile.applicationCycle}</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Stat label="GPA" value={fmtGpa(gpa.cum)} />
          <Stat label="MCAT" value={best ? String(best) : '—'} />
          <Stat label="Total hrs" value={String(totalHours)} />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-bold text-primary">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

/** Editable avatar: click to pick, or drag-and-drop an image; stored locally as a data URL (I4). */
function AvatarUpload({ value, name, onChange }: { value?: string; name: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  function handleFile(file?: File) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]) }}
      className={cn('group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed', drag ? 'border-primary bg-secondary' : 'border-border bg-muted')}
    >
      {value
        ? <img src={value} alt="" className="size-full object-cover" />
        : <span className="font-display text-3xl font-bold text-muted-foreground">{name.slice(0, 1)}</span>}
      <button onClick={() => inputRef.current?.click()} className="absolute inset-0 grid place-items-center bg-foreground/40 text-background opacity-0 transition-opacity group-hover:opacity-100" title="Upload or drag a photo">
        <Camera className="size-5" />
      </button>
      {value && <button onClick={() => onChange('')} className="absolute bottom-0 right-0 rounded-full bg-card p-1 text-destructive shadow" title="Remove photo"><Trash2 className="size-3.5" /></button>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  )
}

/** A live CV assembled from logged roles — updates as you log experiences. */
function AutoCv() {
  const profile = useStore((s) => s.profile)
  const experiences = useStore((s) => s.experiences)
  const persons = useStore((s) => s.persons)
  const letters = useStore((s) => s.letters)
  const update = useStore((s) => s.update)

  /** Contacts feed the CV from the canonical Person records. Anyone already
   *  carrying a letter request is marked, so both surfaces tell one story. */
  const references = useMemo(() => {
    const letterPersonIds = new Set((letters ?? []).map((entry) => entry.recommenderId).filter(Boolean) as string[])
    return (persons ?? [])
      .filter((person) => !person.archived && !person.deletedAt)
      .map((person) => ({ person, isLetterWriter: letterPersonIds.has(person.id) }))
      .sort((a, b) => Number(b.isLetterWriter) - Number(a.isLetterWriter) || a.person.name.localeCompare(b.person.name))
  }, [persons, letters])

  const byCat = useMemo(() => {
    const map = new Map<ExperienceCategory, typeof experiences>()
    for (const e of experiences) { const arr = map.get(e.category) ?? []; arr.push(e); map.set(e.category, arr) }
    return map
  }, [experiences])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Edit CV header</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['name', 'major', 'track', 'school', 'classYear', 'matriculationTarget', 'applicationCycle'] as (keyof ProfileT)[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label>{key.replace(/([A-Z])/g, ' $1')}</Label>
              <Input value={String(profile[key] ?? '')} onChange={(e) => update((d) => { (d.profile[key] as string) = e.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="prose-sm mx-auto max-w-3xl space-y-6 py-8">
          <header className="border-b border-border pb-4 text-center">
            <h2 className="font-display text-3xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.major} · {profile.track} · {profile.school} · {profile.classYear}</p>
          </header>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary"><GraduationCap className="size-4" /> Education</h3>
            <p className="text-sm font-semibold">{profile.school} — {profile.major}</p>
            <p className="text-sm text-muted-foreground">Expected {profile.classYear}</p>
          </section>

          {[...byCat.entries()].map(([cat, items]) => (
            <section key={cat}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{CATEGORY_LABEL[cat]}</h3>
              <ul className="space-y-2">
                {items.map((e) => (
                  <li key={e.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{e.role || 'Role'}{e.org ? `, ${e.org}` : ''}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{e.startDate ? fmtDate(e.startDate) : ''}{e.hours ? ` · ${e.hours}h` : ''}</span>
                    </div>
                    {e.description && <p className="text-muted-foreground">{e.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {references.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">References &amp; contacts</h3>
              <ul className="space-y-2">
                {references.map(({ person, isLetterWriter }) => (
                  <li key={person.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {person.name}{person.role ? `, ${person.role}` : ''}
                      </span>
                      {isLetterWriter && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                          Letter requested
                        </span>
                      )}
                    </div>
                    {(person.title || person.email) && (
                      <p className="text-muted-foreground">
                        {[person.title, person.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {experiences.length === 0 && references.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Log roles in the experience pillars and they’ll appear here automatically, formatted as a CV.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ResumeDoc() {
  const url = useStore((s) => s.profile.resumeDocUrl ?? '')
  const update = useStore((s) => s.update)
  return (
    <Card>
      <CardHeader><CardTitle>Your editable resume</CardTitle></CardHeader>
      <CardContent>
        <DocEmbed title="Resume / CV (Google Doc)" value={url} onChange={(u) => update((d) => { d.profile.resumeDocUrl = u })} height={560} />
      </CardContent>
    </Card>
  )
}

const GOAL_FIELDS: { key: keyof Goals; label: string; suffix?: string }[] = [
  { key: 'clinical', label: 'Clinical hours goal', suffix: 'h' },
  { key: 'volunteering', label: 'Volunteering hours goal', suffix: 'h' },
  { key: 'shadowing', label: 'Shadowing hours goal', suffix: 'h' },
  { key: 'research', label: 'Research hours goal', suffix: 'h' },
  { key: 'activities', label: 'Activities count goal' },
  { key: 'gpaTarget', label: 'GPA target' },
  { key: 'mcatTarget', label: 'MCAT target' },
]
const PROFILE_FIELDS: { key: keyof ProfileT; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'school', label: 'School' },
  { key: 'major', label: 'Major' },
  { key: 'classYear', label: 'Class year' },
  { key: 'startTerm', label: 'Start term' },
  { key: 'matriculationTarget', label: 'Matriculation target' },
]

function GoalsEditor() {
  const goals = useStore((s) => s.goals)
  const profile = useStore((s) => s.profile)
  const update = useStore((s) => s.update)
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Goals (drive your progress rings)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {GOAL_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input type="number" step="any" defaultValue={goals[f.key]} onBlur={(e) => update((d) => { d.goals[f.key] = Number(e.target.value) || 0 })} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input defaultValue={String(profile[f.key] ?? '')} onBlur={(e) => update((d) => { (d.profile[f.key] as string) = e.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
