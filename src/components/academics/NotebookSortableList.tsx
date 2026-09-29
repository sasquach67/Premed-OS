import type { ReactNode } from 'react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { LectureRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'

/** Handles are separate from the row's open/edit controls. */
export function NotebookSortableList({ lectures, onMove, children }: {
  lectures: LectureRecord[]
  onMove: (id: string, targetId: string) => void
  children: (lecture: LectureRecord, index: number) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const title = (id: string | number) => lectures.find(item => item.id === id)?.title ?? 'Notebook entry'
  return <DndContext sensors={sensors} collisionDetection={closestCenter}
    accessibility={{
      screenReaderInstructions: { draggable: 'Press Space to pick up a notebook entry, arrow keys to move, Space to drop, or Escape to cancel. Move up and Move down are also available in each entry menu.' },
      announcements: {
        onDragStart: ({ active }) => `Picked up ${title(active.id)}.`,
        onDragOver: ({ active, over }) => over ? `${title(active.id)}, position ${lectures.findIndex(item => item.id === over.id) + 1} of ${lectures.length}.` : undefined,
        onDragEnd: ({ active, over }) => over ? `Dropped ${title(active.id)}, position ${lectures.findIndex(item => item.id === over.id) + 1} of ${lectures.length}.` : 'Reorder cancelled.',
        onDragCancel: () => 'Reorder cancelled.',
      },
    }}
    onDragEnd={({ active, over }) => { if (over && active.id !== over.id) onMove(String(active.id), String(over.id)) }}>
    <SortableContext items={lectures.map(item => item.id)} strategy={verticalListSortingStrategy}>
      {lectures.map((lecture, index) => <NotebookSortableRow key={lecture.id} lecture={lecture}>{children(lecture, index)}</NotebookSortableRow>)}
    </SortableContext>
  </DndContext>
}

function NotebookSortableRow({ lecture, children }: { lecture: LectureRecord; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: lecture.id,
    transition: { duration: 200, easing: 'cubic-bezier(.16,1,.3,1)' },
  })
  return <div ref={setNodeRef} data-notebook-row={lecture.id} className="notebook-sortable-row"
    style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 20 : undefined }}>
    <Button ref={setActivatorNodeRef} variant="ghost" size="icon" type="button" className="notebook-drag-handle"
      // Finish the previous control's blur before dnd-kit starts its sensor.
      // Motion's keyboard press cleanup emits pointercancel on that blur.
      onPointerDownCapture={event => {
        if (event.isPrimary && event.button === 0) event.currentTarget.focus({ preventScroll: true })
      }}
      {...attributes} {...listeners} aria-label={`Reorder ${lecture.title}`}><GripVertical aria-hidden="true" className="size-4" /></Button>
    <div className="min-w-0">{children}</div>
  </div>
}
