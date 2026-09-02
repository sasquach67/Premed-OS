import type { AppData } from '@/lib/types'
import { normalizeInstructorName } from '@/lib/academics/classIdentity'

/** Applies the name-plus-credential display rule to existing classes without
 * replacing course ids or any work linked to them. */
export function migrateInstructorIdentityV44(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  let changed = false
  const workspaces = center.workspaces.map((workspace) => {
    const instructor = workspace.instructor == null ? workspace.instructor : normalizeInstructorName(workspace.instructor)
    if (instructor === workspace.instructor) return workspace
    changed = true
    return { ...workspace, instructor }
  })
  const contacts = center.contacts.map((contact) => {
    const name = normalizeInstructorName(contact.name)
    if (name === contact.name) return contact
    changed = true
    return { ...contact, name }
  })
  if (!changed) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, workspaces, contacts },
    },
  }
}
