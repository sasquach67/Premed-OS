import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

type SelectFieldProps = Omit<ComponentProps<typeof SelectTrigger>, 'value' | 'onChange' | 'children' | 'name'> & {
  value: string
  onValueChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: ReactNode; disabled?: boolean }>
  placeholder?: string
  name?: string
}

/** A themed field for simple choice lists. Empty values remain valid choices. */
export function SelectField({ value, onValueChange, options, placeholder, disabled, name, className, ...triggerProps }: SelectFieldProps) {
  // Encode every choice so an empty option and the placeholder stay distinct.
  const selected = options.some(option => option.value === value) ? `choice:${value}` : ''
  return <>
    {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    <Select value={selected} onValueChange={next => onValueChange(next.slice(7))} disabled={disabled}>
      <SelectTrigger {...triggerProps} className={cn('h-auto min-h-9 min-w-0 text-left [&>span]:min-w-0 [&>span]:whitespace-normal [&>span]:break-words [&>svg]:shrink-0', className)}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] max-h-[min(18rem,var(--radix-select-content-available-height))]">
        {options.map(option => <SelectItem key={option.value} value={`choice:${option.value}`} disabled={option.disabled} className="whitespace-normal break-words">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </>
}
