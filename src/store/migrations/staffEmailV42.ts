import type { AppData } from '@/lib/types'

/** Removes a legacy import error that copied the professor's email onto TA
 * cards. A distinct TA address, including a shared teaching-team address that
 * does not equal the professor's, remains untouched. */
export function migrateStaffEmailV42(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const professorEmails = new Map<string, Set<string>>()
  center.contacts.forEach((contact) => {
    if (contact.role !== 'professor' || !contact.email?.trim()) return
    const emails = professorEmails.get(contact.courseId) ?? new Set<string>()
    emails.add(contact.email.trim().toLowerCase())
    professorEmails.set(contact.courseId, emails)
  })
  let changed = false
  const contacts = center.contacts.map((contact) => {
    const email = contact.email?.trim().toLowerCase()
    if (contact.role !== 'TA' || !email || !professorEmails.get(contact.courseId)?.has(email)) return contact
    changed = true
    return { ...contact, email: undefined }
  })
  if (!changed) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, contacts },
    },
  }
}
