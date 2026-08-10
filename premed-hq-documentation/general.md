# Premed OS — Global Product Specification

## Purpose

This document defines product behavior, design infrastructure, data intelligence, and implementation rules that apply across the entire Premed OS application.

Tab-specific behavior belongs in separate files under `docs/product/tabs/`. A feature belongs here only when it is genuinely useful across most or all sections of the product.

Premed OS should function as a production-ready, intelligent pre-med operating system rather than a collection of disconnected trackers.

## Product principles

1. Capture once, reuse everywhere.
2. The database should understand its data through relationships, derived properties, validations, recommendations, and context-aware workflows.
3. Use a consistent interaction model with domain-specific interfaces.
4. Prefer actionable design over decorative dashboards.
5. Remain admissions-aware without inventing arbitrary admissions scores.
6. Use progressive disclosure to keep common workflows simple.
7. Preserve local speed while providing cloud reliability, recovery, export, and secure user ownership.

## The universal rules — `U-1`–`U-12` (LOCKED Aug 2026 · every tab, no exceptions)

> **⚠️ There are TWELVE. The table immediately below holds `U-1`–`U-9`; `U-10`, `U-11`, and `U-12` are full sections after it because each needed more than a row.** *(This heading said "nine" until Aug 2026 and three rules were being missed by readers who stopped at the table.)*

> **These govern every feature in every catalog.** **Do not restate them in a tab file — reference this section.**
>
> **They have moved twice and this is the last time.** They began at the bottom of `03-clinical-feature-catalog.md` — **a rule governing the whole app living inside one pillar.** Aug 2026 they moved to `specifications/05-experience-pillar.md` §2b, **which was still wrong**: that file scopes itself to *"the five experience pillars,"* and **Academics and MCAT obey the same rules and are not experience pillars.** Both of their catalogs had independently written their own copy, which is how the error surfaced. **`general.md` is the app-wide home.**

| # | Rule | |
|---|---|---|
| **U-1** | **Every smart feature states its cause** and is dismissible. **None fires more than once per cycle** | |
| **U-2** | **Deterministic by default.** A feature needing an LLM is marked and **must degrade, never break** — no base capture path ever depends on a key | |
| **U-3** | **Every nudge competes in the 3-per-week attention auction** (`01` §6.11) **and routes through the shell Attention model with a severity**, never rendering independently on a page | |
| **U-4** | **Probabilistic outputs render as intervals, never point estimates** (`01` §6.12) | |
| **U-5** | **Insufficient data → dormant with a reason.** Never a zero, never an empty chart (`01` §6.10-A) | |
| **U-6** | **Hours live in exactly one pillar.** Cross-links never double-count | |
| **U-7** | **HQ does not track non-events.** Rejected three times — shadowing asks (`S-7`), lost elections (`E-9`), declined event prospects (`EV-1`). **Reflection attaches to things that happened, never their absence** | |
| **U-8** | **HQ may decline to ASSERT. It may not WITHHOLD a capability.** Targets exist and default off; **HQ never suggests a number, and never gates the student out of finishing something.** The line that overturned the sufficiency call, both target bans, `You're free`, and `#45a`'s exchange minimum | |
| **U-9** | **Nothing is scored, ranked, or compared** — not against a bar, not against other students, not against the student's own past. **No invented composites** (`01` §6.12) | |
| **U-13** ⭐ | **A FACT about the record is allowed. A JUDGEMENT about the person is not.** The two look identical at the point of writing them and are not. **Derived Aug 2026 after the same line was re-derived in three separate tabs** — promote it rather than re-argue it a fourth time |

**Two more with a narrower but still cross-tab reach**, recorded here so a catalog author knows they exist: **text entry is a plain `input`/`textarea` with no dictation affordance** (`implementation/integration-map.md` §1) and **`PlaceLine` on every place-bearing record** (`specifications/07-campus-layer-board.md` §2e).

**Rules specific to the five experience pillars** — the shared frame, the three reads, and the `RM-1`–`RM-6` reflection mechanism — **stay in `specifications/05-experience-pillar.md`**, which is their correct scope.


## U-13 · Fact about the record, not judgement about the person (LOCKED Aug 2026)

**`U-9` says nothing is scored. `U-13` is the working test for the cases where that is genuinely hard to apply**, because the useful-sounding version of a feature is usually the one that crosses.

**It was derived three separate times in one session before being noticed:**

| Tab | Allowed — a fact | Forbidden — a judgement |
|---|---|---|
| **Profile/CV `P-28`** | *"These 7 records are not in any slot."* | *"These 3 are your weakest."* Hours as a proxy for worth |
| **Profile/CV `P-37`** | *"This activity has no verifier."* Structural incompleteness of the FORM | *"You have no research."* An opinion about what an application should contain |
| **School List `SL-16`** | *"Submitted 94 days ago."* | *"Ghosted."* A verdict on a non-event (`U-7`) |
| **Profile/CV `P-29b`** | *"Same organisation, adjacent dates — these look like one entry."* Organisational identity | Ordering the slots by importance |

**The test, and it is checkable rather than a matter of taste:**

> **Could the student dispute it with evidence?** *"No verifier on this activity"* is either true or false and they can look. **"Your research is thin" cannot be disputed, because it was never a claim about the record — it was an opinion about them.**

**Two corollaries worth stating, because both were argued in-session:**

1. **Arithmetic on numbers the student supplied is a fact.** *"Your MCAT is 6 below their median"* is subtraction. It becomes a judgement the moment it is expressed as a probability or a verdict.
2. **A grouping is a fact; an ordering is a judgement.** Same data, different claim.

**⚠️ The failure mode is drift, not a bad initial decision.** Every one of the allowed rows above is one small change away from the forbidden version, and the change always looks like an improvement.

## U-10 · Manual first. AI is invoked, never assumed. (LOCKED Aug 2026)

> **Andy, Aug 2026:** *"If I can do as many of the things that I can on my own, then I should do it on my own. I think it'd be better if I just typed into a table, and then if I need AI to work on it, parse through things, or organize it, then I'd ask it to. **I'll try to do things myself first.**"*

**This is stronger than `U-2` and sits beside it.** `U-2` says a feature must **degrade** without a key. **`U-10` says the manual path is the DEFAULT even when a key exists.**

| | |
|---|---|
| **The student types into the table.** | Structured entry is the primary path — faster, exact, and theirs |
| **AI is a verb the student uses**, not a state the app is in | *"Parse this," "organize this," "find this"* — **asked for, every time** |
| **Nothing is auto-parsed, auto-filed, or auto-summarised on arrival** | The one standing exception is flyer/photo extraction (`●` vision), which **still proposes and waits** |

**Why it is a rule and not a preference:** **an app that reaches for AI first teaches the student that the record is the machine's.** **`U-8` says HQ may not withhold a capability; `U-10` says HQ may not take one either.**

**It also explains a pattern already visible across the docs** — extraction proposes and the student confirms · `EV-1` recommends and never acts · `RM-2` responds but never finishes a reflection · `V-10` proposes a throughline and never assigns one. **Those were four consistent decisions and this is the rule behind them.**

## U-11 · The assistant is a second mode of the existing search, not a new surface (LOCKED Aug 2026)

> **Andy:** *"I'd like to use an AI to fetch things I'm looking for… **that Jarvis feeling**, where it's like my personal assistant… There's already a search feature within HQ where you can find things and it redirects you. I don't know if it'd be confusing if I just added the agent there."*

**Back-checked against how mature tools solve it** (`implementation/reference-sources.md`): **Notion runs two palettes from one entry — `/` for commands, `space` for AI. Raycast's Quick AI is a distinct mode inside the command bar.** **The consistent answer is one entry point, separate trigger, no blending.**

- **The existing search is unchanged.** Type a thing → find it → jump to it. **Deterministic, instant, works with no key.**
- **The assistant is a second mode of the same surface**, opened deliberately — a distinct key, or an explicit *"Ask"* row. **Never mixed into the result list.**
- **Two reasons beyond precedent:** blending makes every keystroke ambiguous — **is `DPPH` a jump-to or a question?** — and **the search must keep working without an API key**, which it cannot if the agent lives inside it.

### What the assistant retrieves — and why it is NOT Atlas

**It searches the student's own records.** *"What were the DPPH results last time I ran extract B?"* · *"Which reflections mention Dr. Patel?"* · *"When did I last log a shift at the ED?"*

| | Atlas | **The assistant** |
|---|---|---|
| **Source** | An external premed knowledge corpus | **The student's own data** |
| **Trust model** | Cited, dated, refusable, contradiction-aware | **Their own words — nothing to verify** |
| **Failure** | Says it does not know | **Says it found nothing, and shows what it searched** |

**Same interface, different engine.** **Do not fold one into the other**, and **do not let the assistant answer premed questions** — that is Atlas's job and it has a citation obligation this does not.

## U-12 · Use the incumbent tool. HQ is the layer above it, never a worse copy of it. (LOCKED Aug 2026)

> **Andy:** *"If they're previous, or if there are actual developers behind a product and actually use their product, instead of me trying to create one from scratch."*

**A generalisation of the workflow rule in `CLAUDE.md`** (*"research the established method before proposing a new one"*). **That rule says check how a thing is normally built. `U-12` goes further: if a real product already does it, and the student can already get it, HQ does not rebuild it.**

**The three-part test, in order:**

1. **Does a mature product already do this?**
2. **Can this student get it — free, or through UNC?**
3. **If both are yes, HQ does not build it. HQ builds the layer the incumbent does not have.**
4. **⚠️ ADDED Aug 2026 — CAN HQ REACH IT?** **The first three clauses assume that if an incumbent exists, HQ can hand off to it. Sometimes HQ cannot.** **If integration is architecturally impossible, HQ may duplicate — MINIMALLY, by paste, and never by sync.**

**Three outcomes, not two:**

| | | Example |
|---|---|---|
| **CEDE** | The incumbent does it; HQ points out | **Anki · LabArchives · MSAR's data · letter delivery** |
| **BRIDGE** | HQ keeps a minimal record and reads one-way | **Zotero** (`B-7`) |
| **DUPLICATE-MINIMAL** | **Unreachable. HQ re-enters by paste, stores the least it can** | **Canvas** |

**`DUPLICATE-MINIMAL` is not a loophole. It requires proving integration is impossible, not merely inconvenient.**

**⚠️ The full pass across every pillar is `implementation/U-12-incumbent-audit.md`. Read it before speccing MCAT, Academics, Letters, or School List.**

### The case that produced the rule — `Lab notes` (Aug 2026)

**Research's `Lab notes` was specced as a structured trial log: method × sample × run, replicates, conditions, raw and processed values, photo blocks.** **That is an electronic lab notebook**, and ELNs are a mature category — **LabArchives, Benchling, eLabFTW.**

**UNC-CH holds an enterprise LabArchives licence that covers undergraduates at no cost.** **All three tests fired. `N-1`–`N-4` and `N-8` were cut.**

**Two independent constraints agreed, which is how you know the rule is not just taste:**

- **The ≤5-second logging rule** (`CLAUDE.md`, LOCKED). **Trial + replicates + conditions + raw *and* processed cannot be entered in five seconds.** **It is a bench data-entry form, and no amount of design makes it one.**
- **The localStorage quota** (`S0`). **Already flagged for photos; hundreds of runs of raw absorbance is the same problem wearing a different hat.**

### The counter-evidence, kept because it is the strongest objection

**LabArchives was free and available to Andy and he used a Google Doc.** **The tool existing did not solve his problem.**

**That is an adoption failure, and `U-12`'s answer is that HQ does not fix adoption by shipping a fifth-best clone of the thing the student already ignored.** **If the incumbent is unused, the useful move is the connective layer that makes using it worth it — not a replacement.**

### What HQ builds instead

**The layer above.** **ELNs record what you did; they are bad at *why you changed it*.** **`R-7`, the decision log, is the gap** — Andy: *"there is nothing really on paper to track that a change had happened with the experiment and why."* **Plus blockers, anomalies, and the line from bench work to outputs, CV, and AMCAS. No ELN does that and none will.**

### Where this rule already applied without being named

**`B-1`** (reuse `ShelfItem`, do not build a citation manager) · **`0d`** (no literature mind-map — Zotero and Obsidian exist) · **`§2g`** (Leaflet + Stadia rather than drawing a map) · **`RS-BIG-1`** (**UNC's Office for Undergraduate Research already publishes an opportunities database** — do not hand-build one) · **the dictation sweep** (Wispr Flow is a redirect, not a feature).

**⚠️ It does NOT apply to the pillar catalogs themselves.** **AMCAS-shaped experience tracking, hour targets, and reflection prompts have no incumbent a premed can actually use** — that absence is the reason HQ exists. **`U-12` is a test, not a presumption against building.**

## Service foundation

### Authentication

Implement:

- Email/password signup and login
- Google sign-in
- Email verification
- Password reset
- Persistent secure sessions
- Protected routes
- Logout from current device and all devices
- Account deletion
- Personal data export

Unauthenticated users should see a polished landing and sign-in experience rather than the internal app shell.

### New-user onboarding

Collect only information that changes the workspace:

- Current stage
- Expected graduation year
- Expected application cycle
- Undergraduate institution
- Current priorities
- Existing-data import choice
- Google integration choice
- Sample-data choice

Use this information to configure defaults, deadlines, and setup checklists.

### Per-user ownership

Every user-created record must be scoped to the authenticated user, including experiences, courses, MCAT data, recommenders, essays, stories, schools, tasks, timeline events, files, integrations, preferences, saved views, and notifications.

### Integrations

Prioritize:

1. Google Calendar
2. Google Drive
3. Gmail
4. Direct file uploads
5. Calendar import
6. CSV/spreadsheet import

Each integration needs explicit connect/disconnect controls, permission explanations, sync status, last successful sync, retry behavior, and error handling.

### Billing and entitlements

Plan for:

- Core tracking
- Storage limits
- File limits
- Advanced analytics
- Integrations
- Automated sync
- Smart review queues
- Export tools
- Customization

Do not make core data entry unusable on a free plan.

## Global application shell

### Sidebar

Retain the current grouped navigation hierarchy.

Requirements:

- Collapsible desktop sidebar
- Mobile drawer
- Active-route indicator
- Tooltips in collapsed mode
- Keyboard navigation
- Persistent collapsed state
- Actionable badges only

Avoid badges for static totals.

### Global header

Provide:

- Global search / command palette
- Quick add
- Sync status
- Review queue or notifications
- User/account menu

Keep it visually quiet.

### Responsive behavior

Support desktop, tablet, and mobile. On mobile, use full-screen sheets for complex editing, sticky actions, card-based replacements for dense tables, and collapsible filters.

## Global page architecture

Every primary page should generally contain:

1. Page identity
2. Current status or primary metric
3. Immediate action
4. Alerts or items needing attention
5. Main workspace
6. Supporting analysis
7. Archive or secondary content

### Object inspector

> **Superseded (July 2026):** the desktop open pattern is a **center peek** (blurred backdrop) with expand-to-full-page and split-screen options, not a right-side panel — see `specifications/01-shared-interface-patterns.md` §2. The right-side panel is retained only as the mobile sheet. The section list below still holds, but as **lean core + progressive disclosure** (core: Overview/Details, Relations, Files, Activity, Actions; on-demand: Notes, Data quality, History) per that spec §3.

Clicking a record opens an inspector with:

- Overview
- Details
- Relations
- Files
- Notes
- Activity
- Data quality
- History
- Actions

### Split view

Use split view when the user must work with related information simultaneously, such as list + selected record, essay + source material, study plan + selected topic, recommender + letter details, or timeline + event inspector.

### Focus mode

Provide an optional distraction-reduced mode that hides nonessential navigation and analytics while preserving autosave and a clear completion path.

## Global entity system

Core entities should include:

- User
- Person
- Organization
- Place
- Experience
- Role
- Event
- Project
- Course
- AcademicTerm
- Exam
- School
- Application
- Letter
- Essay
- Story
- Note
- File
- Task
- Goal
- Tag
- Skill
- Resource

Each entity should have a stable ID, owner ID, created/updated timestamps, archive state, optional deleted timestamp, and source metadata for imported or synchronized records.

### Relationships and backlinks

Relationships should be first-class records or strongly typed references. Every entity inspector should show where that entity is used.

### Data inheritance

Allow inherited values where appropriate, while making inherited values visibly distinguishable from local overrides.

## Global data intelligence

### Deduplication

Detect likely duplicates for people, organizations, courses, schools, projects, and files.

Never merge automatically without a reversible action. Show confidence, differing fields, affected records, merge preview, and undo.

### Derived properties

Calculate rather than manually store:

- Total hours
- Average weekly hours
- Duration
- Active semesters
- Days since last update
- Completion state
- Upcoming deadline
- Linked-record count
- Pace toward goal

### Data health checks

Provide explainable warnings for:

- Missing required fields
- Missing verification contact
- Missing date range
- Invalid date sequence
- Duplicate organization
- Broken file link
- Unlinked imported record
- Stale active record
- Deadline without owner
- Completed record with unresolved tasks

Classify warnings as blocking, important, or suggested.

### Completeness

Prefer labeled states such as Incomplete, Usable, Well documented, and Ready for export. Always show exactly what is missing.

### Dependency awareness

Before destructive or structural changes, show what will be affected and offer reassignment, archiving, cancellation, or deletion.

### Smart recommendations

Start with rules-based, explainable recommendations:

- Add missing supervisor contact
- Link to an existing organization
- Create the next project milestone
- Follow up on an overdue letter
- Archive an inactive completed role
- Resolve duplicate records

Every recommendation must explain why it appeared.

### Import reconciliation

Imported data should enter review when uncertain. Show newly created entities, matched existing entities, conflicts, skipped rows, and errors.

## Global search and command palette

Search across people, organizations, experiences, courses, schools, essays, notes, files, tasks, and commands.

Support actions such as:

- Add a record
- Navigate to a tab
- Open a saved view
- Log hours
- Create a task
- Attach a file
- Find incomplete records
- Find overdue items
- Merge duplicates

## Global workflow features

### Quick add

Provide a universal quick-add menu with context-sensitive defaults.

### Review queue

Centralize:

- Missing data
- Duplicate candidates
- Overdue tasks
- Sync conflicts
- Stale records
- Pending imports
- Unlinked files
- Records ready to archive

Support filtering, bulk actions, snooze, dismiss-with-reason, and opening the related record.

### Bulk operations

Support archive, restore, add tag, change status, assign term, link organization, export, and delete for compatible records.

### Saved views

Allow saved filters, sorting, grouping, visible columns, density, and date ranges.

### Undo and recovery

Provide immediate undo, trash/recovery, version history for important content, and merge reversal where feasible.

## Global visual system

Premed OS should feel calm, precise, academic, modern, and professional without resembling hospital software.

### Data visualization

Charts must answer a specific user question, use readable labels, provide exact values on hover or focus, work in dark mode, include accessible summaries, and avoid decorative 3D effects or excessive donut charts.

### Density modes

Plan for Compact, Comfortable, and Visual modes.

### Empty states

Every empty state should explain what belongs there, why it matters, and the first action to take.

### Accessibility

Require keyboard navigation, visible focus states, semantic headings, screen-reader labels, sufficient contrast, reduced-motion support, accessible chart summaries, and linked validation messages.

## Global planning model

Across Home and planning-oriented views, organize actionable work into Now, Soon, and Later. Do not force passive historical records into this model.

## Privacy and sensitive data

- Do not encourage storage of protected health information.
- Clinical notes must warn users not to include identifiable patient information.
- Encrypt credentials and integration tokens.
- Use least-privilege scopes.
- Provide clear export and deletion controls.
- Do not use private data to train external models without explicit consent.

## Implementation boundaries

Global infrastructure should not impose inappropriate metrics on every tab.

Examples:

- Hours are central to clinical, volunteering, and shadowing, but should not dominate extracurriculars or academics.
- GPA visualizations belong to Academics.
- Research output pipelines belong to Research.
- Letter follow-up cadence belongs to Letters.

Shared infrastructure should standardize entity behavior, editing patterns, search, relations, validation, review queues, and design language.

Tab files should define domain-specific entities, metrics, visualizations, workflows, insights, and exclusions.

## Documentation workflow

As ideas are discussed:

1. Classify the idea as global or tab-specific.
2. Append global ideas here.
3. Append tab-specific ideas to `docs/product/tabs/<tab-name>.md`.
4. For multi-tab ideas, document the shared rule here and the variation in each relevant tab file.
5. Record constraints and explicit exclusions so coding agents do not overgeneralize features.

This specification is expected to evolve continuously.

---

## ⭐ THE RENAME — `Premed HQ` → `Premed OS` (Aug 2026)

**Andy renamed the product.** The sweep is **done**: 323 display strings across 126 files.

### ⚠️ Four things were deliberately NOT renamed. Do not "finish the job."

| Kept as `premed_hq` / `Premed-HQ` | Why renaming it is a defect |
|---|---|
| **8 localStorage keys** — `premed_hq_v1` · `premed_hq_public` · `premed_hq_quote` · `premed_hq_cloud_meta` · `premed_hq_command_recents` · `premed_hq_patch_notes_seen` (+ `LEGACY_STORAGE_KEY`, `RAW_STORAGE_KEY`) | **Every existing user's data disappears silently.** The app would read a key that has never been written. `CLAUDE.md`: *any localStorage schema change needs a versioned, lossless migration* — a rename is a schema change wearing a cosmetic disguise |
| **`vite.config.ts` `base: '/Premed-HQ/'`** | It must match the GitHub Pages path `sasquach67.github.io/Premed-HQ/`. **Change it without renaming the GitHub repo and every asset 404s.** The two must move together or not at all |
| **`googleDrive.ts` `BACKUP_FILENAME = 'premed-hq-backup.json'`** | **It is a LOOKUP key, not a label.** `findBackupFile()` queries Drive by exact name. Rename it and the app stops finding backups it wrote itself — the user's cloud backup appears to vanish |
| **`package.json` name, `premed-hq-documentation/` folder** | Mechanical, no user impact, and both drag `package-lock.json` / hundreds of doc paths with them. **Separate change, if ever** |

> **The distinction that matters: a NAME is a display string; an IDENTIFIER is a key.**
> Renaming the first is cosmetic. Renaming the second is a migration. **They look identical in a grep**, which is exactly why this table exists.

**Download filenames WERE renamed** (`premedos-backup-*.json`, `premedos-assignments.csv`) — those are write-only labels with no lookup path, so they are display strings.

### Verify after any future sweep

```
grep -rn "premed_hq" src/        → must still return 8 keys
grep -rn "Premed-HQ" vite.config.ts → must still return the base
grep -rn "Premed HQ" src/        → must return nothing
```

### The logo

**Official lockup supplied Aug 2026.** Assets and sampled tokens: `public/art/brand/README.md`.

- **Ink `#1E3044` · Blue `#2E6CB8` · Blue-light `#9AB3DF` · Cream `#F6F3F1`**
- ⚠️ **The logo blue is not `--pl-pri` (`#6FB3DE`).** Decide deliberately whether the UI accent moves — **two almost-identical blues is worse than either.**
- ⚠️ **Navy `premed` is invisible on the dark public layer.** Use the `*-ondark` variants there.
- ⚠️ **The tagline "organize. optimize. get ahead." is not approved copy.** It ships with the lockup; it does not belong on the landing page, which has a settled headline.
