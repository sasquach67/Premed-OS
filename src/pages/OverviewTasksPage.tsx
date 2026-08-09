import { MascotNoteProvider } from '@/components/common/MascotNote'
import { PageHeader } from '@/components/common/PageHeader'
import { OverviewTasks } from '@/components/overview/OverviewTasks'
import { ROUTE_MAP } from '@/app/routes'

/**
 * `/overview/tasks` — the task list with room, per `03-overview` §6.4.
 *
 * The URL states the ownership: tasks are Overview's, so the full-screen list
 * is a sub-route of Overview rather than a sidebar destination (precedent:
 * `/academics/classes/:courseId`).
 *
 * It renders the *same component* as the widget. The expansion adds filtering
 * and search and nothing else — "one list at two sizes, not two
 * implementations", and any capability on only one of them is a defect.
 */
export function OverviewTasksPage() {
  const route = ROUTE_MAP['overview/tasks']

  return (
    <MascotNoteProvider>
      <PageHeader title={route?.label ?? 'Tasks'} subtitle={route?.tagline} />
      <OverviewTasks expanded />
    </MascotNoteProvider>
  )
}
