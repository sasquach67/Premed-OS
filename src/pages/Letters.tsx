import { useMemo } from 'react'
import { Plus, Mail } from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import type { LetterEntry } from '@/lib/types'
import { uid } from '@/lib/id'
import { PageHeader } from '@/components/common/PageHeader'
import { TrackerTable, type ColumnDef } from '@/components/common/TrackerTable'
import { EmptyState } from '@/components/common/EmptyState'
import { StatTile } from '@/components/common/StatTile'
import { Button } from '@/components/ui/button'

const COLUMNS: ColumnDef[] = [
  { key: 'recommender', header: 'Recommender', type: 'text', width: '180px', placeholder: 'Name', wrap: true },
  { key: 'role', header: 'Role', type: 'text', width: '180px', placeholder: 'Professor, PI, advisor…', wrap: true },
  {
    key: 'type',
    header: 'Type',
    type: 'select',
    width: '190px',
    options: ['Science faculty', 'Non-science faculty', 'Research PI', 'Physician', 'Committee', 'Other'],
    optionDots: {
      'Science faculty': 'bg-primary',
      'Non-science faculty': 'bg-violet-400',
      'Research PI': 'bg-success',
      Physician: 'bg-cyan-400',
      Committee: 'bg-warning',
      Other: 'bg-muted-foreground',
    },
  },
  {
    key: 'status',
    header: 'Status',
    type: 'select',
    width: '135px',
    options: ['identified', 'asked', 'agreed', 'submitted', 'declined'],
    optionDots: {
      identified: 'bg-muted-foreground',
      asked: 'bg-warning',
      agreed: 'bg-success',
      submitted: 'bg-primary',
      declined: 'bg-destructive',
    },
  },
  { key: 'dateAsked', header: 'Asked', type: 'date', width: '132px' },
  { key: 'notes', header: 'Notes', type: 'longtext', width: '300px', placeholder: 'Context or follow-up…', wrap: true },
]

/** A contact counts as a letter prospect when it carries one of these tags. */
const LETTER_TAGS = ['letter', 'letter-writer', 'potential letter']

export function Letters() {
  const route = ROUTE_MAP.letters
  const letters = useStore((s) => s.letters)
  const persons = useStore((s) => s.persons)
  const addItem = useStore((s) => s.addItem)
  const patchItem = useStore((s) => s.patchItem)

  const submitted = letters.filter((l) => l.status === 'submitted').length
  const agreed = letters.filter((l) => l.status === 'agreed' || l.status === 'submitted').length

  /** Contacts tagged as letter prospects that aren't tracked here yet. */
  const prospects = useMemo(() => {
    const tracked = new Set(letters.map((entry) => entry.recommenderId).filter(Boolean) as string[])
    return (persons ?? []).filter((person) =>
      !person.archived && !person.deletedAt
      && !tracked.has(person.id)
      && (person.tags ?? []).some((tag) => LETTER_TAGS.includes(tag.toLowerCase())))
  }, [persons, letters])

  /** Letters whose recommender string matched several people — the v8 migration
   *  refuses to guess, so the choice surfaces here instead. */
  const needsReview = letters.filter((entry) => (entry.recommenderCandidateIds?.length ?? 0) > 1)
  const personName = (id: string) => persons?.find((person) => person.id === id)?.name ?? 'Unknown contact'

  function add() {
    addItem('letters', { id: uid(), recommender: '', role: '', relationship: '', type: 'Science faculty', status: 'identified', order: 0 } as LetterEntry)
  }

  function trackProspect(personId: string) {
    const person = persons.find((entry) => entry.id === personId)
    if (!person) return
    addItem('letters', {
      id: uid(), recommender: person.name, recommenderId: person.id,
      role: person.role ?? '', relationship: person.notes ?? '',
      type: person.title || 'Science faculty', status: 'identified', order: 0,
    } as LetterEntry)
  }

  function resolveRecommender(letterId: string, personId: string) {
    patchItem('letters', letterId, { recommenderId: personId, recommenderCandidateIds: undefined } as Partial<LetterEntry>)
  }

  return (
    <div>
      <PageHeader title={route.label} actions={<Button onClick={add}><Plus className="size-4" /> Add recommender</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={Mail} label="Recommenders" value={String(letters.length)} sub="identified so far" />
        <StatTile icon={Mail} label="Agreed" value={String(agreed)} sub="committed to write" accent="var(--cat-volunteer)" />
        <StatTile icon={Mail} label="Submitted" value={String(submitted)} sub="letters in hand" accent="var(--success)" />
      </div>
      {needsReview.length > 0 && (
        <div className="mb-6 space-y-2 rounded-xl border border-warning/40 bg-warning/8 p-4">
          <h3 className="text-sm font-bold">Which contact is this?</h3>
          <p className="text-xs text-muted-foreground">
            More than one contact matches this name, so nothing was linked automatically. Pick the right person.
          </p>
          {needsReview.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{entry.recommender}</span>
              {(entry.recommenderCandidateIds ?? []).map((candidateId) => (
                <Button key={candidateId} size="sm" variant="outline" onClick={() => resolveRecommender(entry.id, candidateId)}>
                  {personName(candidateId)}
                </Button>
              ))}
            </div>
          ))}
        </div>
      )}

      {prospects.length > 0 && (
        <div className="mb-6 space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold">Contacts flagged as potential letter writers</h3>
          <div className="flex flex-wrap gap-2">
            {prospects.map((person) => (
              <Button key={person.id} size="sm" variant="outline" onClick={() => trackProspect(person.id)}>
                <Plus className="size-3.5" /> {person.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-bold">Recommender tracker</h3>
        <TrackerTable
          collection="letters" rows={letters} columns={COLUMNS} listId="letters.tracker"
          empty={<EmptyState icon={Mail} title="No recommenders yet" hint="Most schools want science faculty + others; some want a committee letter. Build relationships early — a letter writer needs to actually know you." action={<Button size="sm" onClick={add}><Plus className="size-4" /> Add your first</Button>} />}
        />
      </div>
    </div>
  )
}
