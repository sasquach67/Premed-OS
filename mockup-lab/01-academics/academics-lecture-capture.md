# Academics · Lecture capture — decisions

**Status:** PROPOSED · Stage-A coverage

## Behaviour

- Begins in the existing class **Materials** tab. Recording and upload are optional; the student can always continue with normal notes.
- Recording policy is acknowledged once as a quiet reminder. Audio is local by default; any cloud or provider choice must be disclosed before transfer.
- Transcript excerpts carry their quote and timestamp evidence. Proposed source links and coverage are reviewable and never silently applied.
- No-audio, denied-permission, or unlinked material remains an honest, recoverable state—not a fabricated lesson or unit.
- **Lecture index** begins only after a processed transcript exists. It searches a supplied phrase or linked material title and returns quote + timestamp + material connection; it never calls a moment important, predicts an exam, creates coverage, or applies a link automatically. When nothing is processed, it routes to capture/upload; when nothing matches, it names that result instead of inventing an explanation.

## Appearance

- The shared class banner establishes the parent Materials destination. The three chips only switch capture states.
- **Capture** is a recording desk: a single audio field sits at the visual center, with small tool controls around it and a policy note parked at the lower edge. It reads as an instrument, not a rectangular checklist.
- **Review** is a transcript workspace: timestamp dots form a reading rail at left, evidence occupies the main page, and a narrow proposal rail holds the few actions that change data. Quotes are the primary visual material.
- **Unavailable** is intentionally spacious and quiet: one dashed audio mark, one recovery choice, then the exact no-fabrication promise.
- **Lecture index** is the selected A treatment: a compact timestamp rail → readable evidence stack → constrained material-link rail. Quotes stay larger than metadata, so retrieval is about returning to student-supplied evidence rather than reading a dashboard. The no-result and no-processed-transcript notices stay inside the same evidence surface instead of becoming competing variants; a material-first B split was omitted because it changes neither the retrieval job nor the safe evidence model.
- All work surfaces are solid-with-depth; only the shared banner floats.
- The literal ladder is page `#211e1a` → panel `#2b2722` → inner evidence objects `#322e28`, with `#3c352d` borders, 16px panels, 13px inner objects, `#4b9cd3` only for active evidence, and `#e7b06a` only for recovery emphasis. At narrow width the timestamp trail, evidence stack, then material rail become one reading order; keyboard focus uses `:focus-visible`, and reduced motion resolves directly.

## Component translation

- Use the existing Materials-level `Tabs`, `AnimatedFileUpload`, and `InfoTip`/policy disclosure owners; recording does not create a separate media component family.
- The transcript workspace can use the app’s `Resizable` split primitive on larger screens and falls back to the stacked layout shown here on mobile.
- Animate UI/SmoothUI may supply reduced-motion-safe upload and panel-transition behavior, but the app’s own tokens, source evidence, and record owner remain authoritative.

## Product views

`start` is optional local capture/upload, `review` is evidence-first transcript review, `index` is timestamped retrieval over processed evidence, and `unavailable` is permission/no-audio recovery.
