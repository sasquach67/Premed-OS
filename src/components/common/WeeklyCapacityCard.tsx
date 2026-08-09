import { useState } from 'react'
import { CalendarRange, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { availableHours, slackHours } from '@/lib/capacity'
import { isCapacityCaptured, weeklyCapacityTotal } from '@/store/migrations/shellV9'
import { InfoTip } from '@/components/common/InfoTip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/common/DateField'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

/** Sunday of the current week, matching `hoursByWeekday`'s Sunday-first order. */
function thisWeekStart() {
  const date = new Date()
  date.setDate(date.getDate() - date.getDay())
  return date.toISOString().slice(0, 10)
}

/**
 * The only place the shell's hour pool is captured today (`00` §11b).
 *
 * §11b also expects MCAT intake and Academics term setup to write it, "since
 * both ask the same question and must not ask twice" — neither flow exists
 * yet, so this is the single capture point and those flows must read this
 * value rather than asking again.
 *
 * Deliberately not a calendar: a weekly shape plus exceptions. And deliberately
 * not a target — nothing here encourages raising the numbers.
 */
export function WeeklyCapacityCard() {
  const capacity = useStore((state) => state.settings.weeklyCapacity)
  const update = useStore((state) => state.update)
  const [draftLabel, setDraftLabel] = useState('')

  const captured = isCapacityCaptured(capacity)
  const total = weeklyCapacityTotal(capacity)
  const thisWeek = availableHours(capacity, thisWeekStart())
  const slack = slackHours(capacity)

  function setDay(index: number, raw: string) {
    const hours = Math.max(0, Math.min(24, Number(raw) || 0))
    update((draft) => {
      draft.settings.weeklyCapacity.hoursByWeekday[index] = hours
      draft.settings.weeklyCapacity.updatedAt = Date.now()
    })
  }

  function addBusyPeriod() {
    const label = draftLabel.trim() || 'Busy stretch'
    update((draft) => {
      draft.settings.weeklyCapacity.busyPeriods.push({
        id: uid(), label, startDate: isoToday(), endDate: isoToday(), hoursOverride: 0,
      })
      draft.settings.weeklyCapacity.updatedAt = Date.now()
    })
    setDraftLabel('')
  }

  function patchBusyPeriod(id: string, patch: Partial<{ label: string; startDate: string; endDate: string; hoursOverride: number }>) {
    update((draft) => {
      const period = draft.settings.weeklyCapacity.busyPeriods.find((item) => item.id === id)
      if (period) Object.assign(period, patch)
      draft.settings.weeklyCapacity.updatedAt = Date.now()
    })
  }

  function removeBusyPeriod(id: string) {
    update((draft) => {
      draft.settings.weeklyCapacity.busyPeriods = draft.settings.weeklyCapacity.busyPeriods.filter((item) => item.id !== id)
      draft.settings.weeklyCapacity.updatedAt = Date.now()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CalendarRange className="size-4 text-primary" /> Weekly study hours
            <InfoTip label="Roughly how many hours you have free to study on an ordinary day. Academics and MCAT both plan against this one number, so neither can book time the other already took." />
          </span>
          {captured
            ? <Badge variant="muted">{total}h a week</Badge>
            : <Badge variant="warning">Not set yet</Badge>}
        </CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {captured
            ? 'Academics and MCAT split these hours between them instead of each planning as if it had your whole week.'
            : 'Until you set this, study plans have nothing honest to plan against and will ask before generating.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day, index) => (
            <div key={day}>
              <Label htmlFor={`capacity-${day}`} className="mb-1 block text-center text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                {day}
              </Label>
              <Input
                id={`capacity-${day}`}
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={capacity.hoursByWeekday[index] || ''}
                placeholder="0"
                onChange={(event) => setDay(index, event.target.value)}
                className="text-center tabular-nums"
              />
            </div>
          ))}
        </div>

        {captured && (
          <p className="text-sm font-semibold text-muted-foreground">
            This week: <strong className="text-foreground tabular-nums">{thisWeek}h</strong>
            {' · '}
            <span className="inline-flex items-center gap-1">
              <strong className="text-foreground tabular-nums">{slack}h</strong> held back
              <InfoTip label="About one catch-up day, kept unclaimed by either plan so a week that slips has somewhere to go." />
            </span>
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Busy stretches</h3>
            <InfoTip label="Finals, travel, a heavier shift rota — a stretch where your usual week does not hold. Both plans bend around it, and nothing piles up as debt because of it." />
          </div>

          {capacity.busyPeriods.map((period) => (
            <div key={period.id} className="grid gap-2 rounded-xl border border-border bg-muted/25 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_5rem_auto] sm:items-end">
              <div>
                <Label className="mb-1 block text-xs font-bold text-muted-foreground">Label</Label>
                <Input value={period.label} onChange={(event) => patchBusyPeriod(period.id, { label: event.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-bold text-muted-foreground">From</Label>
                <DateField value={period.startDate} onChange={(iso) => patchBusyPeriod(period.id, { startDate: iso })} ariaLabel={`${period.label} start`} />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-bold text-muted-foreground">To</Label>
                <DateField value={period.endDate} onChange={(iso) => patchBusyPeriod(period.id, { endDate: iso })} ariaLabel={`${period.label} end`} />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-bold text-muted-foreground">Hours/day</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={period.hoursOverride}
                  onChange={(event) => patchBusyPeriod(period.id, { hoursOverride: Math.max(0, Math.min(24, Number(event.target.value) || 0)) })}
                  className="text-center tabular-nums"
                />
              </div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${period.label}`} onClick={() => removeBusyPeriod(period.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder="Finals week, travel, a heavier rota…"
              aria-label="New busy stretch"
              className="min-w-48 flex-1"
            />
            <Button variant="outline" onClick={addBusyPeriod}><Plus className="size-4" /> Add stretch</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
