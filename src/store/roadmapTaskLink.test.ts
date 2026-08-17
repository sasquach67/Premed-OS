import { afterEach, describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { overviewTasks } from '@/lib/overview'
import { useStore } from '@/store/store'

function reset() {
  const data = createSeedData()
  data.tasks = []
  data.timelineMilestones = [{ id: 'milestone', title: 'Draft personal statement', completed: false, order: 0 }]
  useStore.getState().replaceAll(data)
}

afterEach(reset)

describe('createRoadmapImplementationTask', () => {
  it('creates one ordinary Overview task and one durable milestone link atomically', () => {
    reset()

    const taskId = useStore.getState().createRoadmapImplementationTask('milestone', 'Draft a first outline')
    const state = useStore.getState()

    expect(taskId).toEqual(expect.any(String))
    expect(state.timelineMilestones[0].implementationTaskId).toBe(taskId)
    expect(state.tasks).toEqual([expect.objectContaining({
      id: taskId,
      title: 'Draft a first outline',
      type: 'Task',
      progress: 'Not started',
      kanban: 'todo',
      horizon: 'soon',
      important: false,
      archived: false,
    })])
    expect(state.tasks[0]).not.toHaveProperty('milestone')
    expect(state.tasks[0]).not.toHaveProperty('timelineMilestoneId')
    expect(overviewTasks(state.tasks, 'soon').map((task) => task.id)).toEqual([taskId])
    expect(useStore.getState().createRoadmapImplementationTask('milestone', 'A duplicate')).toBeNull()
    expect(useStore.getState().tasks).toHaveLength(1)
  })

  it('keeps the milestone relationship after task lifecycle changes and never recreates it', () => {
    reset()
    const taskId = useStore.getState().createRoadmapImplementationTask('milestone', 'Draft a first outline')!

    useStore.getState().patchItem('tasks', taskId, { progress: 'Finished', kanban: 'done', archived: true })
    expect(useStore.getState().timelineMilestones[0].implementationTaskId).toBe(taskId)

    const recoveryId = useStore.getState().softDeleteItems('tasks', [taskId], 'Deleted linked task')
    expect(recoveryId).toEqual(expect.any(String))
    expect(useStore.getState().timelineMilestones[0].implementationTaskId).toBe(taskId)
    const trashId = useStore.getState().trash.find((entry) => entry.collection === 'tasks' && entry.record.id === taskId)?.id
    expect(trashId).toBeTruthy()

    useStore.getState().restoreTrashItems([trashId!])
    expect(useStore.getState().timelineMilestones[0].implementationTaskId).toBe(taskId)
    expect(useStore.getState().createRoadmapImplementationTask('milestone', 'A replacement')).toBeNull()
  })
})
