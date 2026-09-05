import { ExternalLink, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactElement } from 'react'

import type { ClassCenterData, LectureRecord } from '@/lib/types'
import { useStore } from '@/store/store'
import { RecordActionMenu, type RecordAction } from '@/components/common/RecordActionMenu'
import { useToast } from '@/components/common/useToast'
import { DateField } from '@/components/common/DateField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface LectureDeletionSnapshot {
  lecture: LectureRecord
  fileLinks: Array<{ id: string; lectureId: string }>
  findings: ClassCenterData['lectureFindings']
  materialProposals: ClassCenterData['lectureMaterialProposals']
  noteProposals: ClassCenterData['lectureNoteProposals']
  guideProposals: ClassCenterData['guideProposals']
  masteryOutlines: ClassCenterData['generatedMasteryOutlines']
}

function lectureDeletionSnapshot(center: ClassCenterData, lectureId: string): LectureDeletionSnapshot | undefined {
  const lecture = center.lectures.find((item) => item.id === lectureId)
  if (!lecture) return undefined
  return structuredClone({
    lecture,
    fileLinks: center.files.filter((file) => file.lectureId === lectureId).map((file) => ({ id: file.id, lectureId })),
    findings: center.lectureFindings.filter((item) => item.lectureId === lectureId),
    materialProposals: center.lectureMaterialProposals.filter((item) => item.lectureId === lectureId),
    noteProposals: center.lectureNoteProposals.filter((item) => item.lectureId === lectureId),
    guideProposals: center.guideProposals.filter((item) => item.source.sourceKind === 'lecture' && item.source.sourceId === lectureId),
    masteryOutlines: center.generatedMasteryOutlines.filter((item) => item.lectureId === lectureId || (item.scope === 'lecture' && item.scopeId === lectureId)),
  })
}

function removeLecture(center: ClassCenterData, lectureId: string) {
  center.lectures = center.lectures.filter((item) => item.id !== lectureId)
  center.files.forEach((file) => { if (file.lectureId === lectureId) file.lectureId = undefined })
  center.lectureFindings = center.lectureFindings.filter((item) => item.lectureId !== lectureId)
  center.lectureMaterialProposals = center.lectureMaterialProposals.filter((item) => item.lectureId !== lectureId)
  center.lectureNoteProposals = center.lectureNoteProposals.filter((item) => item.lectureId !== lectureId)
  center.guideProposals = center.guideProposals.filter((item) => item.source.sourceKind !== 'lecture' || item.source.sourceId !== lectureId)
  center.generatedMasteryOutlines = center.generatedMasteryOutlines.filter((item) => item.lectureId !== lectureId && (item.scope !== 'lecture' || item.scopeId !== lectureId))
}

function restoreLecture(center: ClassCenterData, snapshot: LectureDeletionSnapshot) {
  if (!center.lectures.some((item) => item.id === snapshot.lecture.id)) center.lectures.push(snapshot.lecture)
  for (const link of snapshot.fileLinks) {
    const file = center.files.find((item) => item.id === link.id)
    if (file) file.lectureId = link.lectureId
  }
  for (const [key, records] of [
    ['lectureFindings', snapshot.findings],
    ['lectureMaterialProposals', snapshot.materialProposals],
    ['lectureNoteProposals', snapshot.noteProposals],
    ['guideProposals', snapshot.guideProposals],
    ['generatedMasteryOutlines', snapshot.masteryOutlines],
  ] as const) {
    for (const record of records) {
      if (!center[key].some((item) => item.id === record.id)) center[key].push(record as never)
    }
  }
}

export function LectureRecordMenu({
  lecture,
  onOpen,
  onOpenFullScreen,
  onDeleted,
  rail,
  children,
}: {
  lecture: LectureRecord
  onOpen: () => void
  onOpenFullScreen?: () => void
  onDeleted?: (lectureId: string) => void
  rail?: boolean
  children: ReactElement
}) {
  const update = useStore((state) => state.update)
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [title, setTitle] = useState(lecture.title)
  const [occurredOn, setOccurredOn] = useState(lecture.occurredOn ?? '')

  function beginEdit() {
    setTitle(lecture.title)
    setOccurredOn(lecture.occurredOn ?? '')
    setEditOpen(true)
  }

  function save() {
    const nextTitle = title.trim()
    if (!nextTitle) return
    update((draft) => {
      const record = draft.academics.classCenter.lectures.find((item) => item.id === lecture.id)
      if (!record) return
      record.title = nextTitle
      record.occurredOn = occurredOn || undefined
      record.updatedAt = Date.now()
    })
    setEditOpen(false)
    toast({ title: 'Lecture updated', tone: 'success' })
  }

  function remove() {
    const snapshot = lectureDeletionSnapshot(useStore.getState().academics.classCenter, lecture.id)
    if (snapshot) update((draft) => { removeLecture(draft.academics.classCenter, lecture.id) })
    setDeleteOpen(false)
    if (!snapshot) return
    onDeleted?.(lecture.id)
    const saved = snapshot
    toast({
      title: 'Lecture deleted',
      description: 'Its attached files remain in Class Materials.',
      onUndo: () => {
        update((draft) => restoreLecture(draft.academics.classCenter, saved))
        toast({ title: 'Lecture restored', tone: 'success' })
      },
    })
  }

  const actions: RecordAction[] = [
    { id: 'open', label: 'Open lecture', icon: <FolderOpen className="size-4" />, onSelect: onOpen },
    ...(onOpenFullScreen ? [{ id: 'open-full', label: 'Open full screen', icon: <ExternalLink className="size-4" />, onSelect: onOpenFullScreen }] : []),
    { id: 'edit', label: 'Edit lecture', icon: <Pencil className="size-4" />, onSelect: beginEdit },
    { id: 'delete', label: 'Delete lecture', icon: <Trash2 className="size-4" />, destructive: true, separatorBefore: true, onSelect: () => setDeleteOpen(true) },
  ]

  return (
    <>
      <RecordActionMenu actions={actions} label={`Actions for ${lecture.title}`}>
        {(overflow) => (
          <div
            data-lecture-actions={lecture.id}
            className={rail
              ? 'group/lecture-record lecture-record--rail grid w-full min-w-0 grid-cols-[minmax(0,1fr)_1.75rem] items-start gap-1'
              : 'group/lecture-record relative w-full min-w-0 [&>.lecture-rail-entry]:pr-9'}
          >
            {children}
            {rail
              ? <div data-lecture-rail-controls className="lecture-rail-controls pointer-events-none flex shrink-0 items-center pt-1 opacity-0 transition-opacity group-hover/lecture-record:pointer-events-auto group-hover/lecture-record:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 [&_button]:size-7 [&_button]:bg-card/85 [&_button]:shadow-sm">
                  {overflow}
                </div>
              : <div className="absolute right-1 top-1 z-10 opacity-65 transition-opacity hover:opacity-100 focus-within:opacity-100 group-hover/lecture-record:opacity-100 [&_button]:size-7 [&_button]:bg-card/85 [&_button]:shadow-sm">
                  {overflow}
                </div>}
          </div>
        )}
      </RecordActionMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit lecture</DialogTitle>
            <DialogDescription>Change the lecture name or class date. Sources and generated study work stay attached.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block text-sm font-bold">Lecture title<Input aria-label="Lecture title" className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="block text-sm font-bold">Class date<DateField ariaLabel="Lecture date" className="mt-2 rounded-lg" value={occurredOn} onChange={setOccurredOn} placeholder="Date not set" /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!title.trim()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lecture?</AlertDialogTitle>
            <AlertDialogDescription>The lecture page, generated Study Guide, Mastery Map, and lecture-only suggestions will be removed. Attached files will stay in Class Materials, and you can undo immediately afterward.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Delete lecture</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
