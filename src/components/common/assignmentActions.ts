import { uid } from '@/lib/id'
import type { TaskItem } from '@/lib/types'
import { useStore } from '@/store/store'

/** Timeline's existing class-less task shortcut; D3 assignments never call it. */
export function addTask(course?: string) {
  useStore.getState().addItem('tasks', {
    id: uid(),
    title: '',
    course,
    type: 'Task',
    progress: 'Not started',
    kanban: 'todo',
    archived: false,
    order: useStore.getState().tasks.length,
  } as TaskItem)
}
