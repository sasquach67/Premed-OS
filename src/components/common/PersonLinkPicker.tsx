import type { Person } from '@/lib/types'
import { SelectField } from '@/components/ui/select-field'
import { Input } from '@/components/ui/input'

/** Explicit identity selection; creating another same-name person remains possible. */
export function PersonLinkPicker({ persons, personId, name, onPersonChange, onNameChange, disabled }: {
  persons: Person[]; personId: string; name: string; onPersonChange: (id: string) => void; onNameChange: (name: string) => void; disabled?: boolean
}) {
  return <div className="grid gap-2">
    <label className="text-xs font-bold">Person
      <SelectField aria-label="Person" disabled={disabled} value={personId} onValueChange={onPersonChange} options={[
        { value: '', label: 'Create a new person' },
        ...persons.filter(person => !person.archived && !person.deletedAt).map(person => ({ value: person.id, label: `${person.name}${person.email ? ` · ${person.email}` : ''} · ${person.id.slice(-6)}` })),
      ]} />
    </label>
    {!personId && <label className="text-xs font-bold">Name<Input required aria-label="Person name" value={name} onChange={event => onNameChange(event.target.value)} /></label>}
  </div>
}
