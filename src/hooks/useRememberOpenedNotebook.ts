import { useEffect } from 'react'
import { useStore } from '@/store/store'

/** Record reader visits, including direct links, without treating creation as a visit. */
export function useRememberOpenedNotebook(courseId?: string, entryId?: string) {
  useEffect(() => {
    if (!courseId || !entryId || entryId === 'new') return
    const state = useStore.getState()
    const center = state.academics.classCenter
    if (!center.lectures.some(entry => entry.id === entryId && entry.courseId === courseId)) return
    const workspace = center.workspaces.find(item => item.courseId === courseId)
    if (!workspace || workspace.lastOpenedLectureId === entryId) return
    state.update(draft => {
      const target = draft.academics.classCenter.workspaces.find(item => item.courseId === courseId)
      if (target) target.lastOpenedLectureId = entryId
    })
  }, [courseId, entryId])
}
