import { CalendarClock } from 'lucide-react'
import { StatStrip as SharedStatStrip, type StatStripMetric } from '@/components/common/StatStrip'
import type { Org } from '@/lib/types'
import { activeOrg, reflectionCount } from './ecsUtils'

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function meetingSortValue(info: string) {
  const lower = info.toLowerCase()
  const day = Object.entries(WEEKDAY_INDEX).find(([label]) => new RegExp(`\\b${label}\\b`).test(lower))?.[1]
  const time = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/)
  if (day === undefined || !time) return null
  let hour = Number(time[1])
  const minute = Number(time[2] ?? 0)
  if (time[3] === 'pm' && hour < 12) hour += 12
  if (time[3] === 'am' && hour === 12) hour = 0
  return day * 24 * 60 + hour * 60 + minute
}

function nextMeeting(orgs: Org[]) {
  return orgs
    .map((org) => ({ org, sort: meetingSortValue(org.meetingInfo) }))
    .filter((item): item is { org: Org; sort: number } => item.sort !== null)
    .sort((a, b) => a.sort - b.sort)[0]?.org
}

export function StatStrip({ orgs }: { orgs: Org[] }) {
  const active = orgs.filter(activeOrg)
  const reflected = active.filter((org) => reflectionCount(org) > 0).length
  const meeting = nextMeeting(orgs)
  const metrics: StatStripMetric[] = [
    {
      id: 'organizations',
      value: orgs.length,
      label: orgs.length === 1 ? 'organization' : 'organizations',
    },
    {
      id: 'leadership',
      value: orgs.filter((org) => org.status === 'leader').length,
      label: 'leadership role',
    },
    {
      id: 'reflections',
      value: `${reflected}/${active.length}`,
      label: 'reflections written',
      detail: active.length - reflected > 0 ? `${active.length - reflected} need one` : undefined,
    },
  ]

  if (meeting) {
    metrics.push({
      id: 'next-meeting',
      icon: <CalendarClock className="size-3.5" aria-hidden="true" />,
      value: 'Next',
      label: meeting.meetingInfo,
    })
  }

  return <SharedStatStrip metrics={metrics} />
}
