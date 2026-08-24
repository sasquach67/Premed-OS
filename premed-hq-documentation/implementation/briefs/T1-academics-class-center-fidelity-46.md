# T1 · Academics → Class Center — Variant A visual parity

**Stage:** E · FRONTEND FIDELITY

**Scope:** Translate the already-working **Daily → Class Center** surface to
the approved **Variant A — Approved bento** drawing. This is one coherent
visual pass across the banner, navigation, filter bar, smart-action block,
course collection, and bento panels. It is not a feature, persistence, or
data-model pass.

Andy has reopened the page's promotion because the live app reads flatter and
more neutral than the drawing. Passing individual token assertions is not
enough; the whole composition must visibly read as the same surface.

## 1. Step-1 audit

### A. Spec → paper

**Pass for this bounded page.** `tabs/01-academics.md` §4.0 supplies the
complete Daily / Class Center panel map: banner, three navigation levels,
Heads up, course collection, review queue, exam-scoped weak topics, Up next,
GPA, upcoming records, mastery trend, and consistency. The approved drawing
contains a visible treatment for each.

This pass does not decide or build the separate shareable-syllabus structure
route, transcript/audio capture, Canvas sync, material generation, Class Hub,
Assignments, or Planning. Those remain outside this page's surface.

### B. Mockup → app — measured baseline

The running dark Class Center was measured on Aug. 24, 2026. Its individual
surface ladder resolves correctly, but that is only a partial pass:

| surface | approved A value | live app value / finding |
| --- | --- | --- |
| page field | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| solid bento panel | `#2b2722` | `rgb(43, 39, 34)` / `#2b2722` |
| course-card rest | `#322e28`, `#3c352d` border, 13px | `rgb(50, 46, 40)` / `#322e28`, `rgb(60, 53, 45)` border, 13px |
| course-card rest elevation | none | none |
| banner | literal blue-bloom / warm-shift gradient | no Class Center banner selector was exposed to the measurement; it must be measured during execution |

The first three rows prove the token *ladder* is present. They do **not** prove
visual parity. Andy's live comparison shows the failure: the banner, bento
density, solid nesting, accent contrast, and course-card interaction treatment
do not yet combine into the approved A composition. The execution must take
fresh desktop and narrow screenshots plus computed values for the banner,
stat strip, filter bar, panel, inner row, and course-card hover/focus state in
both themes before claiming success.

### C. Already built — preserve, do not rebuild

- `3accbee` restores the user-ruled course-card information hierarchy and
  review-action ownership.
- `32200e3` establishes the current desktop four-up course-card collection.
- Existing review, overflow/context-menu, import, settings, archive, delete,
  link, search, term, Cards/List, smart-action, center-peek, and store paths
  are functional territory to preserve, not rebuild.
- `ClassCenter.test.ts` and `ClassCenter.dashboard.test.tsx` remain the
  behavioural/persistence baseline. They are not visual evidence.

### D. Manifest gate

**Pass.** `BUILD-MANIFEST.md` marks
`01-academics/academics-daily-main-page.html` **YES**.

### E. Decision records

**Pass.** `academics-daily-main-page.md` records both behavior and appearance.
Andy selected **A — Approved bento** on Aug. 24, 2026. B and C are not build
targets. The reopened promotion record defines the missing visual proof.

### F. Integrations and services

| dependency | classification | student-facing truth |
| --- | --- | --- |
| persisted courses, assignments, grades, topics, review records | code built, local app state | panels render only facts from the student's records; an empty store must render honest empty states |
| syllabus import | built local/private path | import supplies student-reviewed course data; it is not restyled or changed here |
| review-session routing | code built | Review routes to the existing class-scoped review session; it must remain available from its hover/focus rail and overflow |
| AI, Drive, Calendar, Canvas, remote sharing | not required by this visual pass | no surface may imply any of these integrations |

There is no Andy account/API/OAuth checklist for this scope.

## 2. Why this lands at Stage E

Stages A–D pass: the page is drawn, Variant A is chosen, its manifest gate is
open, and its core controls and persistence paths already exist. Stage E fails
because the live page has not been translated as the approved visual system.
The measured token ladder is necessary but insufficient; visual parity is
failed until the *composition and effects* match in a live side-by-side check.

## 3. Work — translate Variant A, visually and only visually

### 3.1 Establish the real baseline first

Before changing styles, load a populated and an empty Class Center in dark and
light. Record `getComputedStyle` for page, banner, glass stat strip, filter
bar, bento panel, nested record, course-card rest, and course-card hover/focus.
Capture one desktop and one narrow viewport screenshot for both states. A
token name or source inspection is not a measurement.

If any route fails, stops rendering, or shows demo facts with an empty store,
stop and report that separate defect. Do not hide it by styling a mock state.

### 3.2 Banner and three-level navigation

- Render the literal recipe banner:
  `radial-gradient(340px 200px at 88% 6%, rgba(75,156,211,.34), transparent 70%),`
  `radial-gradient(260px 180px at 10% 130%, rgba(111,192,168,.18), transparent 70%),`
  then `linear-gradient(115deg,#233448 0%,#2c3a4a 45%,#3a3730 100%)`.
  A flat navy or generic page glow fails.
- Preserve title-only `Academics`, the white solid selected mode option, and
  variable-stat content. Glass is allowed **only** on the floating mode pill
  and stat strip: `rgba(20,26,34,.5)`, `blur(16px) saturate(1.1)`, inset
  white highlight, white-alpha border, and 13px radius.
- Keep underline-only active Daily tabs, with the Academics glow underneath.
  The term Select, search, count, and Cards/List remain a separate solid
  filter bar. Do not create a fourth pill-nav level.

### 3.3 Rebuild the dense A bento hierarchy, not a flat dashboard

- Preserve the exact ordered rhythm: Heads up → Your classes → review queue /
  weak topics → Up next / GPA → Upcoming / mastery trend / consistency.
- Give each panel the literal `#2b2722` solid surface, `#3c352d` border, 16px
  radius, and `0 10px 26px -14px rgba(0,0,0,.55)` depth. Inner rows and course
  cards are the darker `#322e28` nested objects. Do not replace this stepped
  hierarchy with same-value rectangles, glass cards, giant empty cards, or a
  generic blue wash.
- Heads up uses the shared smart-next-actions composition: a compact explain
  line and card actions inside a single 12-column panel. It unmounts when its
  last item is dismissed; its visual treatment must retain that compact,
  layered A footprint rather than become three oversized equal panels.
- Keep panels honest. If data is missing, hide or show the existing dormant
  reason; never render zeros, invented recommendations, dummy charts, or a
  score/ranking/progress judgement.

### 3.4 Course-card collection — preserve facts, restore the visual effect

- Keep four equal desktop columns where the available content width supports
  it, stepping down responsively without horizontal scrolling. The course
  collection belongs inside its bento panel; it must not become a detached
  horizontal row or a wall of full-width cards.
- At rest, a card is solid `#322e28`, neutral `#3c352d` border, 13px radius,
  no rail, no permanent glow, and one small class-colour identity dot.
- On card hover and `:focus-visible`, the 4px left rail ignites in the class
  accent; its border and glow turn to that accent; and the card lifts exactly
  `translateY(-3px)` with the recipe's `.15s cubic-bezier(.16,1,.3,1)`
  transition. Keep the 18px / 34px shadow, accent hairline, and soft accent
  bloom from `_visual-recipes.md`; do not approximate them with global blue.
- The visible information remains the approved factual hierarchy: code/name,
  entered letter standing or factual in-progress state, exact grade percent
  only where grade evidence exists, labelled topics-ready line and meter only
  where topics exist, and one real dated next item. The absent-date route says
  what is absent and leads to its class-owned add/import action.
- On hover/focus, show the original action rail: white filled play triangle +
  `Review` beside overflow. Hovering the inner Review action must **not** light
  the parent card. Preserve the working context/overflow alternatives.
- Apply `prefers-reduced-motion`: remove the lift/motion, retain the visible
  accent-state change. Never use mouse `:focus` as the focus-ring trigger.

### 3.5 Translation constraints

- Use existing `PageHeader`, `PageBanner`, `StatStrip`, `ModeSwitch`,
  `ThreeLevelNav`, `Card`, `InteractiveCard`, `RecordActionMenu`, `CenterPeek`,
  `CollectionState`, and Motion/reduced-motion support. A shared-component
  prop is acceptable only when other callers preserve their current appearance.
- Do not alter any store, route meaning, import scope, syllabus parsing,
  review scheduling, grade calculation, action handler, smart-action rule,
  or persisted Cards/List selection.
- Do not add an MCAT panel, global study-tool panel, floating capture card,
  generic due-soon list, instructor/meeting clutter on cards, a new tab, or a
  score/composite/ranking. Facts about records remain allowed; judgments about
  the student are not.
- Do not overwrite newer app-specific visual annotations merely to imitate an
  older drawing. Blend those approved annotations into A's defined hierarchy.

## 4. Do not break

- Preserve all current Class Center handlers, context/overflow actions,
  center-peek behavior, Review routing, and keyboard semantics.
- Preserve Cards/List and selected-term persistence; preserve empty-store
  honesty and all existing private syllabus entry paths.
- Do not modify imports, migrations, store schemas, AI calls, Edge Functions,
  calendar/OAuth, data corpora, or the existing Class Hub/Materials/Assignments/
  Planner/Requirements pages.
- Keep unrelated working-tree changes out of this commit.

## 5. Done when

- [ ] A fresh two-theme, two-viewport measurement table shows the literal A
      ladder for page, banner, glass strip, filter bar, panel, inner row,
      course-card rest, hover, and focus. The banner gradient and glass values
      are measured, not merely present in CSS source.
- [ ] Desktop screenshots visibly match Variant A's dense bento composition;
      the course collection is four-up where width allows and all panel order,
      depth, and spacing follow the drawing.
- [ ] Class-card rest/hover/focus visibly match the approved effect, including
      the dormant rail at rest, accent rail/glow/lift when the card is targeted,
      and the white-triangle Review action beside overflow. Review hover leaves
      the parent unlit.
- [ ] Dark and light screenshot comparison confirms the semantic surface
      ladder rather than applying dark colours to light mode.
- [ ] The inert-control audit returns zero handlerless `Button`,
      `DropdownMenuItem`, and `ContextMenuItem` on Class Center. Existing
      focused Class Center tests, full `npm test -- --run`, `npm run build`,
      and `git diff --check` pass.
- [ ] No tests or implementation make a claim of promotion. A separate
      six-condition audit—plus Andy's live visual acceptance—must occur before
      `daily-main` can return to `built`.

## 6. Commit

`fix(academics): translate Class Center Variant A fidelity`

Commit only this visual pass and narrow visual/regression tests. Keep unrelated
worktree changes separate.

## 7. Next stage — explicitly out of scope

Run the six-condition Class Center promotion audit only after this pass and
Andy's side-by-side acceptance. The tab-wide Stage-A shareable-syllabus design
brief, Class Hub, Syllabus Import, Materials, Assignments, and Planning do not
enter this execution.
