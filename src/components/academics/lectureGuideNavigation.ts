import { preferredScrollBehavior } from '@/lib/scroll'

export function scrollGuideHeadingIntoReadingPane(heading: HTMLHeadingElement) {
  const readingPane = heading.closest<HTMLElement>('[aria-label="Lecture reading area"]')
  if (!readingPane) {
    heading.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' })
    heading.focus({ preventScroll: true })
    return
  }
  const top = readingPane.scrollTop + heading.getBoundingClientRect().top - readingPane.getBoundingClientRect().top - 24
  readingPane.scrollTo({ top: Math.max(0, top), behavior: preferredScrollBehavior() })
  heading.focus({ preventScroll: true })
}
