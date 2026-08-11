/** Shared guard for single-key and shell shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'))
}
