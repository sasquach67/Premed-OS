import { cn } from '@/lib/utils'

/** Code-native planning mark: a course path reaching a checked waypoint.
 * It intentionally avoids UNC athletic marks while giving Tar Heel Tracker a
 * stable, visible identity in the Planning tab and its working surface. */
export function TarHeelTrackerMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('shrink-0', className)} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
      <path d="M5.5 16.8c2.5-5.7 4.5-2.1 6.5-6.5 1.2-2.6 2.7-2.4 5.8-3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="16.8" r="1.5" fill="currentColor" />
      <path d="m16.1 6.7 1.2 1.2 2.2-2.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
