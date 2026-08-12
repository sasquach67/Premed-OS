import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Ram } from '@/components/mascot/Ram'
import { Button } from '@/components/ui/button'
import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

export type MascotNoteVariant = 'tip' | 'banner' | 'teaching' | 'empty-state' | 'milestone'
export type MascotNoteTone = 'default' | 'dark'

interface MascotNoteScopeValue {
  activeId: string | null
  register: (id: string, priority: number) => () => void
}

const MascotNoteScope = createContext<MascotNoteScopeValue | null>(null)

/**
 * Enforces the global "one mascot per view" restraint while letting each
 * collection keep the same explanation/empty-state component and actions.
 */
export function MascotNoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Array<{ id: string; priority: number; order: number }>>([])

  const register = useCallback((id: string, priority: number) => {
    setNotes((current) => {
      if (current.some((note) => note.id === id)) return current
      return [...current, { id, priority, order: current.length }]
    })
    return () => setNotes((current) => current.filter((note) => note.id !== id))
  }, [])

  const activeId = useMemo(() => {
    return [...notes].sort((a, b) => a.priority - b.priority || a.order - b.order)[0]?.id ?? null
  }, [notes])

  return (
    <MascotNoteScope.Provider value={{ activeId, register }}>
      {children}
    </MascotNoteScope.Provider>
  )
}

interface MascotNoteBaseProps {
  children: ReactNode
  source?: string
  actions?: ReactNode
  className?: string
  /** Lower values win when several notes exist in one view. */
  priority?: number
  title?: string
  /** Explicitly opt into ink glass only when the immediate backdrop is dark. */
  tone?: MascotNoteTone
}

type MascotNoteProps = MascotNoteBaseProps & (
  | { variant: 'teaching'; noteId: string; dismissible?: true }
  | { variant?: Exclude<MascotNoteVariant, 'teaching'>; noteId: string; dismissible: true }
  | { variant?: Exclude<MascotNoteVariant, 'teaching'>; noteId?: string; dismissible?: false }
)

const VARIANT_STYLES: Record<MascotNoteVariant, string> = {
  tip: 'border-border bg-muted/55',
  banner: 'border-white/65 bg-card/78 text-foreground shadow-xl shadow-stone-900/10 backdrop-blur-md dark:border-white/15 dark:bg-slate-950/45 dark:text-white dark:shadow-black/15',
  teaching: 'border-[color-mix(in_srgb,var(--cat-mcat)_32%,var(--border))] bg-[color-mix(in_srgb,var(--cat-mcat)_10%,var(--card))]',
  'empty-state': 'border-dashed border-border bg-transparent',
  milestone: 'border-[color-mix(in_srgb,var(--success)_34%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,var(--card))]',
}

export function MascotNote({
  children,
  variant = 'tip',
  source,
  actions,
  className,
  noteId,
  dismissible = false,
  priority = 100,
  title,
  tone = 'default',
}: MascotNoteProps) {
  const generatedId = useId()
  const instanceId = noteId ?? generatedId
  const scope = useContext(MascotNoteScope)
  const register = scope?.register
  const reduceMotion = useReducedMotion()
  const dismissed = useStore((state) => Boolean(noteId && state.settings.mascotNoteDismissals[noteId]))
  const update = useStore((state) => state.update)
  const canDismiss = Boolean(noteId && (dismissible || variant === 'teaching'))
  const isDarkBanner = variant === 'banner' && tone === 'dark'

  useEffect(() => {
    if (dismissed) return
    return register?.(instanceId, priority)
  }, [dismissed, instanceId, priority, register])

  const showMascot = !scope || scope.activeId === instanceId

  function dismiss() {
    if (!noteId) return
    update((draft) => {
      draft.settings.mascotNoteDismissals[noteId] = Date.now()
    })
  }

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <m.div
          role="note"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
          className={cn(
            'flex min-w-0 items-start gap-3 rounded-2xl border p-3.5',
            VARIANT_STYLES[variant],
            isDarkBanner && 'glass-surface glass-surface--dark border-white/16 text-white shadow-black/20',
            className,
          )}
        >
          {showMascot && (
            <Ram
              size={variant === 'empty-state' ? 46 : 38}
              className="pointer-events-none shrink-0 drop-shadow-sm"
            />
          )}
          <div className="min-w-0 flex-1 self-center">
            {title && <p className="font-display text-sm font-extrabold leading-tight">{title}</p>}
            <div className={cn(
              'text-sm font-semibold leading-snug',
              variant === 'banner' ? (isDarkBanner ? 'text-white/88' : 'text-foreground/88 dark:text-white/88') : 'text-foreground',
            )}>
              {children}
            </div>
            {source && (
              <p className={cn(
                'mt-1 text-[10px] font-extrabold uppercase tracking-[0.11em]',
                variant === 'banner' ? (isDarkBanner ? 'text-white/55' : 'text-muted-foreground dark:text-white/55') : 'text-muted-foreground',
              )}>
                {source}
              </p>
            )}
            {actions && <div className="mt-2.5 flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {canDismiss && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={dismiss}
              aria-label="Dismiss note"
              className={cn(
                'size-7 shrink-0',
                variant === 'banner' && (isDarkBanner
                  ? 'text-white/65 hover:bg-white/10 hover:text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'),
              )}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
