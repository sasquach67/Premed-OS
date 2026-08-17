import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { MascotNoteProvider } from '@/components/common/MascotNote'
import { GoalTargetEditor, QuarterlyGoalEditor } from '@/components/overview/OverviewSupport'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/common/useToast'
import { useStore } from '@/store/store'

/**
 * A deep-linkable full-page form for a Quarterly Goal. This is the Expand
 * destination for the compact editor; it deliberately reuses the exact editor
 * rather than creating a second goals product.
 */
export function OverviewQuarterlyGoalsPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const goals = useStore((state) => state.quarterlyGoals)
  const softDeleteItems = useStore((state) => state.softDeleteItems)
  const goal = goalId && goalId !== 'new' && goalId !== 'targets'
    ? goals.find((item) => item.id === goalId && !item.deletedAt)
    : undefined

  if (!goalId || (goalId !== 'new' && goalId !== 'targets' && !goal)) return <Navigate to="/" replace />

  function goBack() {
    navigate('/')
  }

  return (
    <MascotNoteProvider>
      <div className="mx-auto max-w-5xl space-y-4">
        <nav aria-label="Breadcrumb">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="size-4" />Overview</Link>
          </Button>
        </nav>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {goalId === 'targets' ? (
            <GoalTargetEditor />
          ) : (
            <QuarterlyGoalEditor
              goal={goal}
              onDone={goBack}
              onArchive={goal ? () => {
                const recoveryId = softDeleteItems('quarterlyGoals', [goal.id], 'Archived quarterly goal')
                toast({ title: 'Goal archived', description: goal.text, onUndo: recoveryId ? () => useStore.getState().undoRecovery(recoveryId) : undefined })
                goBack()
              } : undefined}
            />
          )}
        </section>
      </div>
    </MascotNoteProvider>
  )
}
