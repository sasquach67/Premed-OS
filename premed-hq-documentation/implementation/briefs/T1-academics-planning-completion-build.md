# T1 · Academics Planning completion — approved two-destination workbench

**Stage:** C · DECIDED, NOT COMPLETELY BUILT

**Scope:** Complete the approved Planning product as one literal Variant A
translation: `Planner` plus `Grades & Archive`, with the requirement map and
the local 46-record planning library embedded in Planner. This correction pass
may wire Planning-owned frontend and backend seams together because the fixed
product ruling changes the visible information architecture and the catalog
action contract at the same time. It does not alter Daily/Class Hub, global
tokens, Daily mockups, flashcards, or unrelated dirty work. The Planning
mockup HTML/MD and mirrored registry receive only the matching local-library
copy/cache-bust update described in the execution record below.

## 1. Audit before implementation

### A. Spec → paper

The canonical Academics specification covers horizontal term planning,
requirement effects, prior credit, advisor export, a transcript-faithful grades
archive, recovery, and honest empty states. All have approved Planning mockup
surfaces. The older specification language that names a separate Tracker is
superseded by Andy's Aug 27 ruling recorded in
`academics-planner-prototype.md`: visible Planning has only Planner and Grades
& Archive; requirements and catalog evidence explain course placement inside
Planner.

### B. Mockup → app

Before this pass the isolated app exposes three Planning tabs, including a
separate Requirements/Tracker destination. Its empty state has the right
paper ladder but the populated Planner implementation is an older generic
surface. The primary workspace contains a partial literal port, but its course
discovery searches only already-recorded courses and sends users to external
UNC catalog/ConnectCarolina links. The local 46-record planning library is not
yet the searchable in-app catalog, and source context is not passed into the
advisor export.

Measured pre-change checkpoint at 1440×900, light:

| surface | approved Variant A | isolated app before |
| --- | --- | --- |
| visible Planning destinations | Planner · Grades & Archive | Planner · Requirements · Grades & archive |
| page ladder | `#f7efe1 → #fffaf0 → #efe6d4`, `#e9e2d5` border | cold start uses the paper background, populated port not present |
| catalog | persistent in-Planner discovery workbench | recorded-plan search plus external handoff |
| horizontal overflow | bounded term board | no page overflow in cold start |

### C. Already built — do not rebuild

- Store v36 local Planning context, the 46 source-versioned planning records,
  candidate-only coverage, local adapter boundary, and advisor export contract:
  `d78aac1`.
- Course/term CRUD, locks, placement, saved-plan restore, transcript records,
  Grades calculations, migrations, and one-store persistence.
- Daily/Class Hub and shared shell behavior in the dirty worktree.

### D. Gate

`BUILD-MANIFEST.md` marks Planner, Planning Library, Grades & Archive,
Planning decisions/cold-start/rollover/retrospective/forecast surfaces `YES`.
The superseded standalone Requirements mockup remains `NO` and must not be
revived.

### E. Decisions

`academics-planner-prototype.md` and `academics-grades-archive.md` both record
approved Variant A appearance and behavior. Andy's fixed completion ruling is
authoritative where older copy still describes outbound catalog browsing.

### F. Integrations

- **Local 46-record planning library:** built and locally configured; make it
  visible/searchable in Planner.
- **Live UNC catalog, ConnectCarolina, official degree audit, current sections,
  substitutions/equivalencies:** code/configuration not available. Show the
  explicit unconfigured boundary; do not link out as a substitute, fabricate
  live results, or compute an official verdict.

## 2. The work

1. Remove every visible Tar Heel Tracker/Tracker label, tab, route, redirect,
   and duplicate manager presentation. Preserve underlying requirement data.
   Legacy `tab=tracker` may resolve to Planner's in-context requirement map only
   as a compatibility interpretation; it must not remain a route destination
   or visible label.
2. Port the exact approved Variant A Planner structure and scoped styling:
   compact control strip, editable context row, bounded horizontal term board,
   inline MCAT divider, course chips, persistent coverage rail, in-context
   catalog/library bay, unplaced tray, and selected-course inspector.
3. Build the in-app local catalog over all 46 source records: search/filter
   program records and explicit captured course codes, inspect source version,
   requirement/coverage effect and data gaps, then add a valid student-owned
   course record to a selected term. Missing titles, credits, offerings, and
   official outcomes remain editable/not-recorded, never invented.
4. Keep live catalog/official audit integration visibly unconfigured. Source
   identifiers and saved provenance may be shown as text; no outbound catalog
   handoff substitutes for the in-app library.
5. Ensure advisor export includes the selected planning context and source
   version.
6. Preserve the approved Grades & Archive literal ladder and the branch-before-
   chrome zero-record state. Verify Ledger, GPA, What-if, transcript, rollover,
   migration/recovery, and term-report paths without fabricating data.
7. Audit every Planning control for a real handler, keyboard focus, persistence
   across reload, tablet wrapping, and page-level horizontal overflow.

## 3. Literal visual contract

**Source:** `mockup-lab/01-academics/academics-planner-prototype.html`,
Variant A `view=plan`; `academics-grades-archive.html`, Variant A per view.

| token/geometry | dark | light |
| --- | --- | --- |
| canvas | `#211e1a` | `#f7efe1` |
| panel | `#2b2722` | `#fffaf0` |
| inset/row | `#322e28` | `#efe6d4` |
| border | `#3c352d` | `#e9e2d5` |
| active | `#4b9cd3` | `#4b9cd3` |
| source/success | `#6fc0a8` | `#6fc0a8` |
| warning | `#e7b06a` | `#e7b06a` |
| panel/inner radii | `16px / 13px` | `16px / 13px` |
| type | Baloo 2 headings/controls; Nunito body; `1.42` line-height | same |
| control density | 31px minimum controls; 9px gaps; 10px×24px strip | same |
| desktop workbench | flexible main + 334px rail; bounded horizontal term scroll | same |

Each Planning-owned component/style section must carry a concise provenance
comment naming the exact approved source and view. Mockups are design source,
not runtime iframes.

## 4. Do not break

- No U-9 score/composite/ranking/progress percentage or official completion,
  enrollment, admission, equivalency, or graduation verdict.
- No guessed program, catalog year, title, credit, offering, or requirement
  mapping.
- No second store, data deletion, or transcript/grades conflation.
- No Daily/Class Hub, Daily mockup, flashcard, shared token, or unrelated
  source changes. Planning mockup copy remains synchronized with the app.
- Mobile is not a promotion target in this pass, but no new page-level overflow
  or inaccessible control may be introduced.

## 5. Done when

- [ ] Visible Planning IA is exactly Planner · Grades & Archive.
- [ ] No user-facing Tar Heel Tracker/Tracker copy, control, route, or redirect remains.
- [ ] Search/filter/detail/add works entirely in the in-app local planning library.
- [ ] Added catalog records persist/reload and carry honest missing fields/provenance.
- [ ] Planner context, term/course CRUD, placement, compare, requirements, advisor export, and recovery controls are non-inert.
- [ ] Grades & Archive zero-record route branches before ledger chrome; populated views remain functional and persistent.
- [ ] Desktop 1440×900 and tablet 1024×768, both themes, match the literal ladder and geometry with zero page-level horizontal overflow.
- [ ] Focused/full tests, TypeScript, production build, diff check, and control audit pass.

## 6. Commit

`feat(academics): complete the Planning workbench`

## 7. Next stage

Re-run the Planning router and perform the six-proof promotion audit. Live UNC
catalog/ConnectCarolina/official audit configuration remains an external gate;
do not mark any page built while that required proof fails.

## 8. Execution and audit record — 2026-08-27

### Delivered

- Visible Planning navigation is `Planner · Grades & archive`. The former
  Tracker/Requirements destination, redirect behavior, duplicated manager, and
  user-facing Tar Heel Tracker language are absent from the Planning route.
- Planner now contains its requirement map and a fully in-app local library.
  The library searches and filters the 46 captured, source-versioned records,
  exposes source/version/coverage context, and adds a student-owned course to a
  selected term without guessing a title, credit value, BCPM status, offering,
  or official outcome.
- Advisor export receives the active planning context and saved source version.
- Grades & Archive branches before ledger chrome when no transcript records
  exist. `Add transcript record` opens the entry surface; populated views retain
  their existing ledger, GPA, What-if, rollover, and recovery behavior.

### Measured mockup → app evidence

| property | approved Variant A | measured app |
| --- | --- | --- |
| light canvas/panel/inset/border | `#f7efe1 / #fffaf0 / #efe6d4 / #e9e2d5` | exact RGB match |
| dark canvas/panel/inset/border | `#211e1a / #2b2722 / #322e28 / #3c352d` | exact RGB match |
| active/source/warning | `#4b9cd3 / #6fc0a8 / #e7b06a` | exact scoped tokens |
| radii | `16px` panel, `13px` inner | exact computed values |
| body rhythm | Nunito, `1.42` | `15px / 21.3px` computed |
| desktop horizontal overflow | none | `0px` page overflow, both themes |
| bounded workbench | horizontal term scroll with visible rail | present; no data/action hidden without the board scroll affordance |

Desktop light/dark and the browser's tablet viewport override were inspected.
The in-app browser reported an effective CSS viewport wider than the requested
1024px tablet width, so the responsive CSS and zero-overflow result are proven,
but a literal 1024px screenshot remains a promotion-evidence gap.

### Functional evidence

- In-app library result `CHEM 261` opened its detail and Add-to-plan dialog.
- A user-entered `Organic Chemistry I`, `3`-credit, BCPM course persisted before
  and after reload on the disposable verification origin.
- Grades zero-record route showed neither Ledger/GPA/What-if tabs nor toolbar,
  filters, count, export, rollover, or grade-decision chrome.
- Planning control audit: `69` controls audited, `UNRESOLVED=0`.
- Focused Planning suite: `6` files, `37` tests passed.
- Full suite: `112` files, `739` tests passed.
- `tsc -b`: passed.
- production build: passed (`4446` modules; existing chunk-size advisory only).

### Mockup synchronization — 2026-08-27

The Planning source mockup and documentation mirror now use the same local
library contract as the app: `Browse captured courses`, `Source record ·
2026–27`, captured-record empty states, and an explicit `Live sections not
configured` boundary. The old three-row/redirect wording is removed from the
course-discovery flow. The Variant Lab registry revision is
`planner-local-library-v5-20260827`, which forces the live lab iframe to load
the updated source instead of a cached revision. No status was promoted to
BUILT.

The coverage rail now also matches the mockup’s four-state ladder: `Complete`,
`Planned`, `Not complete`, and `Manual review`. A locally completed course is
shown as `Complete` only as a local record state; it never becomes an official
degree verdict.

### Router and promotion audit

The router advances to the promotion-audit stage, but Planning is **not BUILT**.
The local planning-library evidence boundary is configured and functional;
live UNC catalog, ConnectCarolina, and official degree-audit services remain
truthfully unconfigured. That external integration proof and a literal 1024px
tablet screenshot are the remaining promotion gaps. No registry or promotion
status was promoted; the registry revision only busts the cached mockup source.

### Post-add state correction — 2026-08-27

The earlier audit missed two populated-state defects that were visible only
after completing the cold-start interaction:

- `This term`, `Next term`, and `Later` were display labels but were also being
  persisted as semester names. Cold start now resolves those choices to the
  current concrete academic sequence (for example `Fall 2026`, `Spring 2027`,
  `Fall 2027`) before opening the reviewed course flow. A confirmed course now
  replaces the onboarding state and renders in the chronological workbench.
- `.planning-dossier` still imposed a legacy mint primary and a separate
  surface ladder around the approved Planner components. The Planning scope
  now uses the measured Variant A paper/charcoal surfaces and Carolina blue in
  both themes; mint is no longer a Planning action color.

Focused transition, Planner, requirement-map, and hydration coverage passed
(`5` files, `19` tests), the production build passed, and live light/dark token
checks matched `#fffaf0 / #efe6d4 / #e9e2d5 / #4b9cd3` and
`#2b2722 / #322e28 / #3c352d / #4b9cd3`. This correction still does not satisfy
the external integration or provenance gates, so Planning remains **not BUILT**.
