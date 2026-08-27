# Academics empty states — prototype decisions

> **Status:** APPROVED — Variant A (Aug. 26, 2026 visual audit). The selected treatment is A's centered launchpad,
> with B's concise “What this sets up” explanation. “Add manually” is a quiet
> text link beneath the primary button.
>
> This approval is separate from implementation evidence and does not mark the
> surface BUILT.
>
> **Mockup:** `academics-empty-states-prototype.html`
>
> **Question:** Which zero-class treatment should become the Academics cold-start reference?

## What is locked

- This is an empty mode of **Daily → Class Center**, not a new tab or onboarding route.
- **Import a syllabus** is the single primary day-one action and creates the first class.
- **Add manually** is a quiet text link beneath it.
- The message uses the dashed, transparent `MascotNote` empty variant. Maximum one mascot per view.
- The populated shell remains recognizable, but controls with nothing to operate on are absent.
- No `0.00` GPA, `0%` readiness, zero-count stat strip, empty chart, recommendation, or hollow study panel.
- The import flow owns extraction and review. This screen only launches it.
- Glass remains limited to banner-borne navigation.

## Variants

### A — Guided launchpad

A calm centered action followed by a concise “What this sets up” explanation.

- Strongest single-task hierarchy.
- Makes the review-before-apply safety promise and shows the concrete outcome.
- Most clearly behaves like a temporary cold start that disappears after setup.

### B — Setup explained

A 7/5 split: primary action on the left, practical import outcomes on the right.

- Best for a student who needs to understand why the syllabus is valuable.
- Densest and closest to a bento control-panel composition.
- Risk: more explanation than a first action needs.

### C — In-place collection

The empty state sits exactly where the `Your classes` collection will later appear.

- Best continuity with the populated Class Center.
- Makes the empty-state component easy to reuse on other collections.
- Risk: feels more like an empty database than a guided day-one experience.

## Recommendation to test first

**A** best matches the locked “single day-one CTA” decision. It teaches only what is necessary, keeps import primary, preserves manual entry, and does not expose dormant page machinery.

## Deliberately deferred

- Planning-mode cold start — design it with Planner & GPA so its setup request is grounded in that surface.
- No-topics and no-assignments states — place those in the populated Class hub and Assignments references, where their surrounding controls and recovery actions can be judged honestly.
- Copy or layout inside the syllabus import flow — owned by `academics-syllabus-import.html`.

## Behaviour

- Variant A is the shipped empty mode: **Import syllabus** starts the existing
  import flow for the first course, and **Add manually** is always an available
  quiet secondary path. “What this sets up” explains extraction/review only;
  it does not perform import itself.
- The state disappears as soon as a real current-term class exists. No empty
  metrics, recommendations, charts, study queue, or placeholder course record
  may survive an empty store.

## Appearance

- A centered launchpad is the visual owner: short explanatory copy, one
  high-emphasis import action, the manual link immediately beneath it, then
  B's compact “What this sets up” explanation. The familiar shell remains as
  context without inoperable controls.
- The dashed transparent `MascotNote` is the one friendly supportive surface;
  it does not become a card wall. Banner-borne navigation alone can use glass;
  the launchpad and explanation are solid-with-depth using the recipe's shared
  spacing, card radius, and warm-dark ladder.
- Import emphasis may use a restrained upward-biased glow that never washes
  over the manual link. Focus remains visible, hover feedback is quiet, and
  `prefers-reduced-motion` removes the glow/entrance animation. At small
  widths the explanation stacks below the action rather than competing beside
  it.

## Implementation gap — measured 2026-08-27

Rendered `#/academics?mode=daily&tab=class-center` on a clean origin at
1440×900 and 1024×768, dark and paper, and compared against this record.

**The zero-class state is reachable and renders.** The Aug 20 demotion reason —
that clearing the store re-seeded 40 courses, so the drawn state could not be
seen — no longer reproduces. That blocker is resolved.

**It still does not match, on the part this record is most specific about.**

| Ruled here | In the app | |
|---|---|---|
| `Import syllabus` starts the import flow | `Import syllabus` | ✅ |
| `Add manually` as a quiet text link beneath the primary button | quiet underlined text link beneath | ✅ |
| Dashed transparent `MascotNote` as the one supportive surface | dashed `MascotNote` | ✅ |
| No metric, chart, recommendation or placeholder course survives an empty store | Term GPA `—`, Cumulative `—`, Due today `0`, Day streak `0`; no course rows | ✅ |
| **B's concise "What this sets up" explanation** — Class details · Dates and deadlines · Grade structure | built 2026-08-27 · measured against `.setup-guide`'s own rules | ✅ |
| Variant A's partial-parse promise: *"If part of the syllabus can't be read, we keep what worked and show exactly what needs manual entry."* | restored 2026-08-27 | ✅ |
| A's centered launchpad headline *"Start with a syllabus"* | *"Bring in your first class"* (Variant B's headline) | ⚠️ |

The headline is marked ⚠️ rather than ❌ because this approval is deliberately a
blend of A's launchpad with B's explanation, and the record does not quote the
headline directly. **The two ❌ rows are not ambiguous.** "What this sets up" is
named in the approval header *and* in Behaviour, and the strip that replaced it
says something else entirely: it describes the product's posture rather than
what the import will populate.

The dropped partial-parse line is the more costly loss. It is the one place this
surface promised what happens when extraction **half-works** — the same promise
transcript intake now makes explicitly (`academics-grades-archive.md`, ingestion
revision). Removing it leaves the syllabus path quieter about failure than the
transcript path beside it.

**Not built.** Condition 1 fails. `VARIANT-LAB.md`'s prose listed this page as
built while the registry entry already read `approved`; the prose was wrong and
is corrected. Source: `src/components/academics/ClassCenter.tsx`.

## Gap closed — 2026-08-27

Both ❌ rows above are built. `ClassCenter.tsx` now renders Variant A's
`.setup-guide` carrying Variant B's copy, using the mockup's own values rather
than approximations. Measured in the running app at 1440×900 and 1024×768, dark
and paper:

| Rule | Mockup | App |
|---|---|---|
| guide padding | `19px 22px 20px` | `19px` / `22px` ✅ |
| row padding · radius | `14px` · `11px` | `14px` · `11px` ✅ |
| row columns | `31px 1fr` | `31px 1fr` ✅ |
| row background | `--muted` | `#322e28` dark · `#efe6d4` paper ✅ |
| icon box | `31×31`, accent at 18% | `31×31`, `#4b9cd3` ✅ |
| title · detail | `13px` · `11px/1.4` | `13px` · `11px` ✅ |
| honest line | `margin-top 15px`, `border-top 1px --bd`, `padding-top 14px`, `11px`, `--mut` | `15px`, `1px #3c352d`, `14px`, `11px`, `#a89c8c` ✅ |

Six regression tests (`ClassCenter.emptyState.test.tsx`) assert the approved
copy, the partial-parse promise, and that the unapproved numbered strip cannot
return. **No test asserted this copy before, which is why the substitution
survived from `cb963a3` for four months.**

**Still not `built`.** Condition 1 now passes, but the headline remains Variant
B's *"Bring in your first class"* rather than A's *"Start with a syllabus"* —
left alone deliberately, because this approval is a blend of A and B and the
record never quotes a headline, so changing it would be inventing a decision
rather than implementing one. **Andy's call.** Conditions 2–6 for this surface
are also unverified: `Import syllabus` and `Add manually` have not been
click-driven through their full flows.
