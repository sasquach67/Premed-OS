/** The source validator and the independent model review are separate checks. */
export function GenerationReviewNotice({ status }: { status?: 'approved' | 'skipped' | 'unavailable' }) {
  if (status !== 'skipped' && status !== 'unavailable') return null
  return <p role="status" className="my-3 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">{status === 'unavailable' ? 'Independent review was unavailable' : 'Independent review was not run'} for this result. Check the linked sources when studying.</p>
}
