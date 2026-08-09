/* ============================================================
   PillarSceneHeader — the shared nested background-art hero used by
   every tab (via PageHeader) and by the experience-pillar layout. Art
   sits *behind* the title (+ optional summary) as one layered
   composition: image → dark overlay → gradient fade into the page
   background. Falls back to a warm accent gradient until real art
   lands (see pillarScenes.ts).
   ============================================================ */
import { type ReactNode, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PILLAR_SCENES, type SceneKey } from './pillarScenes'

export function PillarSceneHeader({
  scene, accent, title, titleAdornment, subtitle, addLabel, onAdd, actions, image, children, footer, compact, contentGlass = true,
}: {
  scene: SceneKey
  /** Override the scene's default accent. */
  accent?: string
  title: string
  /** Inline mark rendered before the title (e.g. a class colour dot). Kept
   *  separate from `title` so the string stays available for the aria-label. */
  titleAdornment?: ReactNode
  subtitle?: string
  /** Built-in "Add …" button (pillar layouts). */
  addLabel?: string
  onAdd?: () => void
  /** Arbitrary top-right controls (pages via PageHeader). Wins over onAdd. */
  actions?: ReactNode
  /** Override the scene's image. */
  image?: string
  children?: ReactNode
  /** Solid/underline navigation anchored to the banner's lower edge. */
  footer?: ReactNode
  contentGlass?: boolean
  /** Tighter vertical padding for dense utility pages. */
  compact?: boolean
}) {
  const cfg = PILLAR_SCENES[scene]
  const ink = accent ?? cfg.accent
  const src = image ?? cfg.image
  const [imgOk, setImgOk] = useState(Boolean(src))
  const isAcademicsRecipe = scene === 'academics'
  const academicsBackground = 'radial-gradient(340px 200px at 88% 6%, rgba(75,156,211,.34), transparent 70%), radial-gradient(260px 180px at 10% 130%, rgba(111,192,168,.18), transparent 70%), linear-gradient(115deg, #233448 0%, #2c3a4a 45%, #3a3730 100%)'

  return (
    <section
      className="relative isolate overflow-hidden rounded-[18px] border border-border/60 shadow-sm"
      aria-label={`${title} header`}
    >
      {/* base fallback gradient — always painted so a missing image still reads intentional */}
      <div className="absolute inset-0 -z-20" style={{ background: isAcademicsRecipe ? academicsBackground : cfg.fallbackGradient }} />

      {/* the artwork (hidden if it fails to load) */}
      {src && imgOk && (
        <img
          src={src}
          alt=""
          aria-hidden
          onError={() => setImgOk(false)}
          className="absolute inset-0 -z-10 size-full object-cover [object-position:var(--pos)] max-[380px]:[object-position:var(--pos-m)]"
          style={{ '--pos': cfg.position, '--pos-m': cfg.mobilePosition } as React.CSSProperties}
        />
      )}

      {/* readability: accent wash + top scrim + fade to page bg at the bottom */}
      {!isAcademicsRecipe && (
        <>
          <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: `linear-gradient(90deg, ${ink} 0%, transparent 42%)`, opacity: 0.16 }} />
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: `linear-gradient(180deg, rgba(20,17,13,${cfg.overlay * 0.7}) 0%, rgba(20,17,13,${cfg.overlay * 0.35}) 32%, transparent 55%), linear-gradient(180deg, transparent 55%, var(--background) 100%)` }}
          />
        </>
      )}

      <div className={cn(
        'flex min-h-[168px] flex-col justify-end gap-3.5 px-5 pb-4 pt-14 sm:px-7',
        compact && 'min-h-[168px]',
        isAcademicsRecipe && 'min-h-0 gap-0 px-6 pb-0 pt-[18px] sm:px-6',
      )}>
        {/* title row over the art */}
        <div className="flex flex-wrap items-start gap-3">
          {!isAcademicsRecipe && <span className="mt-1 h-7 w-2.5 shrink-0 rounded-full" style={{ background: ink }} />}
          <div className="min-w-0">
            <h1 className={cn(
              'flex min-w-0 items-center gap-2.5 font-display text-[1.7rem] font-extrabold leading-none text-[#f4ede0] drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] sm:text-3xl',
              isAcademicsRecipe && 'text-[30px] font-extrabold tracking-[-0.4px] text-white sm:text-[30px]',
            )}>{titleAdornment}{title}</h1>
            {subtitle && <p className="mt-1.5 text-[0.82rem] font-bold text-[#e7dccb]/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">{subtitle}</p>}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {actions ?? (onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4ede0]/70"
              >
                <Plus className="size-4" /> {addLabel}
              </button>
            ))}
          </div>
        </div>

        {/* nested summary strip — translucent surface overlapping the art's lower edge */}
        {children && (
          <div className={cn(
            isAcademicsRecipe && 'mt-[14px]',
            contentGlass && 'rounded-[14px] border border-white/10 bg-[rgba(24,20,16,0.42)] px-1 py-0.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md',
            contentGlass && '[&_.bg-card]:bg-transparent [&_section]:border-0 [&_section]:bg-transparent [&_section]:shadow-none [&_.text-muted-foreground]:text-[#e7dccb]/70 [&_strong]:text-[#f4ede0]',
          )}>
            {children}
          </div>
        )}
        {footer && <div className={cn('min-w-0', isAcademicsRecipe ? 'mt-[13px]' : '-mb-4')}>{footer}</div>}
      </div>
    </section>
  )
}
