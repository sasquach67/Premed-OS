/** The report is a contextual Archive document, never a fourth Archive tab. */
export function termReportRoute(reportId: string) {
  return `/academics?mode=planning&tab=archive&gradeView=ledger&termReport=${encodeURIComponent(reportId)}`
}

/** A missing identifier must not silently fall through to a different report. */
export function isSavedTermReportId(reportId: string | null, reports: ReadonlyArray<{ id: string }>) {
  return Boolean(reportId && reports.some((report) => report.id === reportId))
}
