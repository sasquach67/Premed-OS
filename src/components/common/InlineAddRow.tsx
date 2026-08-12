import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function InlineAddRow({
  label,
  fields,
  onAdd,
  className,
}: {
  label: string
  fields: string[]
  onAdd: (values: string[]) => void
  className?: string
}) {
  const blank = () => fields.map(() => '')
  const [values, setValues] = useState(blank)
  const hasValue = values.some((value) => value.trim())

  return (
    <form
      className={cn(
        'grid min-w-0 gap-2 rounded-xl border border-dashed border-border bg-muted/10 p-3 md:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))_auto]',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault()
        if (!hasValue) return
        onAdd(values)
        setValues(blank())
      }}
    >
      {fields.map((field, index) => (
        <Input
          key={`${field}-${index}`}
          aria-label={field}
          value={values[index]}
          onChange={(event) => setValues((current) => current.map((item, itemIndex) => (
            itemIndex === index ? event.currentTarget.value : item
          )))}
          placeholder={field}
          type={field.toLowerCase().includes('hour') ? 'number' : 'text'}
        />
      ))}
      <Button type="submit" disabled={!hasValue}>
        <Plus className="size-4" aria-hidden="true" /> {label}
      </Button>
    </form>
  )
}
