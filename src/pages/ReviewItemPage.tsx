import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, ExternalLink, Users } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dedupCandidates, type DedupCandidate } from '@/lib/intelligence'
import type { Person } from '@/lib/types'
import { useStore } from '@/store/store'

type PersonDraft = Pick<Person, 'name' | 'email' | 'phone' | 'role' | 'title'>

function personDraft(person: Person): PersonDraft {
  return {
    name: person.name,
    email: person.email ?? '',
    phone: person.phone ?? '',
    role: person.role ?? '',
    title: person.title ?? '',
  }
}

function sourceRoute(candidate: DedupCandidate): string {
  if (candidate.kind === 'person') return '/profile'
  if (candidate.kind === 'course') return '/academics?mode=planning&tab=planner'
  if (candidate.kind === 'school') return '/schools'
  return '/ecs'
}

export function ReviewItemPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const store = useStore()
  const update = useStore((state) => state.update)
  const selectedId = params.get('item') ?? ''
  const candidates = useMemo(() => dedupCandidates(store), [store])
  const candidate = candidates.find((item) => item.id === selectedId)
  const leftPerson = candidate?.kind === 'person'
    ? store.persons.find((person) => person.id === candidate.left.id)
    : undefined
  const rightPerson = candidate?.kind === 'person'
    ? store.persons.find((person) => person.id === candidate.right.id)
    : undefined
  const [left, setLeft] = useState<PersonDraft | null>(leftPerson ? personDraft(leftPerson) : null)
  const [right, setRight] = useState<PersonDraft | null>(rightPerson ? personDraft(rightPerson) : null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    setLeft(leftPerson ? personDraft(leftPerson) : null)
    setRight(rightPerson ? personDraft(rightPerson) : null)
    setResolved(false)
  }, [selectedId, leftPerson?.id, rightPerson?.id])

  function keepSeparate() {
    if (!candidate) return
    update((draft) => {
      draft.settings.attentionSnoozedUntil[candidate.id] = Number.MAX_SAFE_INTEGER
    })
    setResolved(true)
  }

  function savePeople() {
    if (!candidate || !leftPerson || !rightPerson || !left || !right) return
    update((draft) => {
      const first = draft.persons.find((person) => person.id === leftPerson.id)
      const second = draft.persons.find((person) => person.id === rightPerson.id)
      const now = Date.now()
      if (first) Object.assign(first, left, { updatedAt: now })
      if (second) Object.assign(second, right, { updatedAt: now })
    })
    setResolved(true)
  }

  if (resolved || !candidate) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Review complete" subtitle="This item no longer needs your attention." />
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-8">
            <CheckCircle2 className="size-8 text-emerald-500" aria-hidden="true" />
            <div>
              <p className="font-display text-xl font-extrabold">You’re all set.</p>
              <p className="mt-1 text-sm text-muted-foreground">The smart action now resolves here instead of sending you to an unrelated settings page.</p>
            </div>
            <Button onClick={() => navigate('/')}><ArrowLeft className="size-4" /> Back to Overview</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Review possible duplicate"
        subtitle="Compare the exact records that triggered this smart action. Nothing is merged automatically."
        actions={<Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /> Back</Button>}
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-muted">
          <CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> {candidate.left.label} and {candidate.right.label}</CardTitle>
          <p className="text-sm text-muted-foreground">{candidate.why}</p>
        </CardHeader>
        <CardContent className="space-y-5 py-5">
          {left && right ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PersonEditor label="First record" value={left} onChange={setLeft} />
              <PersonEditor label="Second record" value={right} onChange={setRight} />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <RecordSummary label="First record" value={candidate.left.label} />
              <RecordSummary label="Second record" value={candidate.right.label} />
            </div>
          )}

          {!!candidate.differingFields.length && (
            <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
              Fields to compare: {candidate.differingFields.join(', ')}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            {left && right && <Button onClick={savePeople}>Save corrections</Button>}
            <Button variant="outline" onClick={keepSeparate}>These are different people</Button>
            <Button variant="ghost" onClick={() => navigate(sourceRoute(candidate))}>Open source area <ExternalLink className="size-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PersonEditor({ label, value, onChange }: { label: string; value: PersonDraft; onChange: (value: PersonDraft) => void }) {
  const fields: { key: keyof PersonDraft; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'title', label: 'Title' },
    { key: 'phone', label: 'Phone' },
  ]
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-wide text-primary">{label}</p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${label}-${field.key}`}>{field.label}</Label>
            <Input
              id={`${label}-${field.key}`}
              value={value[field.key] ?? ''}
              onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function RecordSummary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-primary">{label}</p><p className="mt-2 font-display text-lg font-extrabold">{value}</p></div>
}
