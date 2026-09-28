import { useState, type ReactNode, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function InlineAddRow({
  label,
  fields = [],
  onAdd,
  className,
  children,
  onSubmit,
}: {
  label: string
  fields?: string[]
  onAdd?: (values: string[]) => void
  className?: string
  /** Controlled capture keeps draft/reset and durable acknowledgment with its caller. */
  children?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}) {
  const blank = () => fields.map(() => '')
  const [values, setValues] = useState(blank)
  const hasValue = values.some((value) => value.trim())

  return (
    <form
      className={cn(
        'grid min-w-0 gap-2 rounded-xl border border-dashed border-border bg-muted p-3 md:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))_auto]',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault()
        if (onSubmit) { onSubmit(event); return }
        if (!hasValue) return
        onAdd?.(values)
        setValues(blank())
      }}
    >
      {children ?? <>
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
      </>}
    </form>
  )
}
