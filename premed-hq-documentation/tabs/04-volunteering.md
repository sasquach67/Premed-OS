# Volunteering

> **Governed by:** `specifications/05-experience-pillar.md` for the SHARED FRAME ONLY (`05` makes no per-pillar claims; this file is the source of truth for its own domain). This file is the **domain depth** for Volunteering. It reuses Clinical's skeleton, now **three flat sub-tabs** (`Organizations` · `Events` · `Reflections`, §5), and *strips* the clinical-only parts (no certifications, no paid/volunteer tag, no patient contact), then adds the service-specific structure below. **Inheritance map:** `04-volunteering-feature-catalog.md`.

**Status:** Designed July 2026, **substantially revised Aug 2026** (sub-tabs, V-7 to V-13, continuity, W7 cut)
**Sidebar group:** Experiences · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-HQ` — `src/pages/ExperiencePillar.tsx` (shared builder), Volunteering config
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`, `specifications/05-experience-pillar.md`, `tabs/03-clinical.md` (skeleton it inherits), `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Volunteering (non-clinical service) experiences, event/event logs, per-event reflections.
- **References only:** People (supervisors/verifiers), organizations, Tasks, Story Bank (reflections), Profile/CV (auto-aggregation), Letters (supervisors as recommenders), **Extracurriculars** (a club's **org entity** is shared, but the experience record is not linked; see §7's duplicate check).

---

## 1. Purpose

Give a pre-med one honest picture of their **non-clinical community service**: how many hours, how *sustained* the commitment is, whether it's *direct* (face-to-face) service, **who** they served, and around **what cause** — with enough captured detail that the "why I serve" material for essays writes itself. Service is a near-universal expectation for medicine; this page keeps it correctly bucketed (not confused with clinical), and captures the *meaning*, not just the number.

## 2. What makes Volunteering unique (do not generalize)

Volunteering inherits Clinical's mechanics but has its own signals. Six things distinguish it:

1. **Non-clinical service classifier (mirror of Clinical's).** This pillar is *non-clinical* service — food banks, tutoring, shelters, Habitat, crisis lines. The classifier runs the opposite direction: if a logged activity is actually clinical (ED volunteer, hospice with patient contact), it flags **"this looks clinical → log in Clinical so it counts as clinical hours."** Keeps the two buckets clean and honest.
2. **Direct vs. indirect service.** *Direct* = face-to-face with those served (serving meals, tutoring kids); *indirect* = behind-the-scenes (fundraising, sorting donations, admin). Both count; direct usually carries more weight. Tagged per experience.
3. **Who / what you served (population + need).** Underserved, homeless, youth, elderly, disaster relief, etc. This is the *why* of service — the material that gives essays and mission-fit their weight, far more than the raw hour count.
4. **Consistency / longevity as the headline signal.** More than clinical, volunteering is read for *sustained commitment*: "18 months, weekly" beats five scattered one-day events with the same hours. The page **leads with** longevity and cadence. **It still shows recency** (`05` §2a); what it excludes is the recency *alert* (#33), not the read.
5. **Cause throughline.** Experiences group by cause area (education, food insecurity, housing, health equity…) so the student's service reads as a coherent story with a theme, not a scatter of unrelated activities.
6. **Recurring role vs. one-time event.** A light tag separating a standing role from a single event; it powers the consistency signal and keeps the log readable. **A one-time event is first-class, not lesser** (V-12): a blood drive is not a failed commitment, and **no copy anywhere says "only one day."**

### Added Aug 2026 (V-7 to V-13, board §4d to §4f)

7. **The org is optional** (V-7). Caregiving, interpreting for family, and self-started efforts have no organization and no verifier. **Those records are complete, not drafts.** See §5d.
8. **What you bring** (V-8). Teaching, a second language, music, coaching, carpentry, code. Clinical cut skills because observed/performed counts were false precision; **this is a different question**: identity, not competency scoring. One free-text line per experience. **It is also the input V-10 depends on.**
9. **Shared background with the population served** (V-9). Optional, self-declared, **never inferred and never displayed as a credential**. A first-generation student tutoring first-gen kids has a materially different story than an outsider doing the same hours.
10. **The throughline you did not name** (V-10). W4 groups by the cause the student *picked*; this finds the one they did not. It derives the **archetype** of each activity from what they wrote, because *"food bank volunteer"* could be sorting boxes alone or teaching a nutrition class and **the tags cannot tell them apart**. Then it reads what they keep choosing across unrelated causes: *"Across three unrelated settings, you kept ending up teaching someone."* **Proposes, never assigns. Silent when there is nothing there.** Full rules in board §4f.
11. **Impact numerics** (V-11). Service produces countable outcomes mentioned in passing: *"we served about 120 meals," "raised $4k."* The AI reading reflections offers to tag them. **Not a leaderboard, not a score.**
12. **Cause presets reach past health** (V-13). Environment, animals, arts, literacy, disaster relief, faith communities, civic work, youth coaching, elder companionship. **A pre-med who volunteers at an animal shelter is not off-mission**, and a health-skewed list would imply they are.

## 3. Primary users and stages

- **Early:** first service roles; needs the classifier ("is this clinical or service?") and low-friction logging so a weekly habit sticks.
- **Mid:** building a sustained commitment around a cause; needs the consistency signal and cause throughline to see (and shape) the story.
- **Application year:** needs correctly-bucketed, verified hours with direct/indirect + population captured, and a bank of service reflections for essays.

## 4. Core entities

- **Volunteering Experience** (owned): title, **organization (referenced entity, OPTIONAL: see §5d, V-7)**, role, **service type = direct | indirect**, **population/need served** (light **preset list + free-text "other"** — presets mirror common service categories: underserved/low-income, homeless, youth/children, elderly, people with disabilities, immigrants/refugees, veterans, incarcerated/reentry, rural, disaster-affected, LGBTQ+; multi-select, since one role can serve several; a free-text "other" can be promoted to a preset later), **cause area**, **cadence = recurring | one-time event**, start date, status = active | past, **supervisor/verifier (referenced Person + contact, OPTIONAL and only meaningful where an org exists)**, verification status, classification result (non-clinical / looks-clinical→route). Derived: total hours, event count, longevity ("18 mo"), cadence summary, **distinct-population count** (drives the headline "N populations served" — trustworthy only because population is structured).
- **Event / Event** (owned, belongs to an Experience): date, hours, optional note/reflection. Sum = the experience's hours; sum across = the headline total. Handles both a recurring weekly event and a one-off event.
- **Reflection** (owned): free text → surfaced in Essays/Story Bank as service-motivation material. Carries the **unpack thread** (#45a) where one exists.
- **What you bring** (V-8): one optional free-text line on the Experience. **Not an entity, not a list, no counts.**
- **Shared background** (V-9): optional, self-declared flag on the Experience. **Never inferred.**
- **Verification** (owned, per Experience): supervisor name + contact for the AMCAS activity; "request letter" hook into Letters.

*(No Certification or Skill entities — those are clinical-only, `tabs/03-clinical.md`.)*

## 5. Structure: three flat sub-tabs (RULED Aug 2026)

**`Organizations` · `Events` · `Reflections`.** The same shape as Clinical (`03-clinical.md` §5), with `Site` renamed to **Organization** and `Shift` to **Event**. Flat, underline tabs only, **no mode switch above them** (`01` §4b-i, level 2 alone). Full inheritance map in `04-volunteering-feature-catalog.md` §1.

**Two things Clinical has that this pillar does not:**

- **No Credentials section.** Nothing in service work expires, so it does not render at all, not even empty.
- **No paid/volunteer anything.** Every record here is volunteer by definition.

**The guard is the same:** `Organizations` is the default landing and **logging never gains a click**. It is reachable from `Organizations`, `Events`, and Overview, all rendering the same `InlineAddRow`.

### 5a. Organizations, the default landing

- **Headline strip (compact, per `05` §3 / `04` §6):** one slim line, e.g. `284 service hrs · 3 causes · longest 18 mo · 4 populations served`. No big stat boxes, no ring. **Continuity leads here** (`05` §2a); recency is present but secondary, the inverse of Clinical's emphasis.
- **TWO SHAPES, not one (RULED Aug 2026 — the pillar's structural departure from Clinical).** Andy: *"in Clinical you have roles that you stick with. In Volunteering you can have those same roles, but there are more temporary ones that are kind of one-off."* **Clinical's hero is one card per site because every clinical record is a relationship. Volunteering has both kinds and therefore needs both shapes:**

  | | Shape | Answers |
  |---|---|---|
  | **Standing commitment** (`cadence = recurring`) | **A card** | *"What is my relationship here?"* — role, cadence, longevity, verifier, event log |
  | **One-day event** (`cadence = one-time event`) | **A row**, inside one shared panel | *"What did I do that day?"* |

  **Why the card is wrong for a one-off, and why this is structure rather than taste:** a card holding one event is a mostly-empty card, and **eight of them read as eight abandoned commitments no matter what the copy says.** V-12 bans *"only one day"* language and the old layout said it anyway. **AMCAS settles it too:** with 15 entries maximum (`03-clinical.md` §7b), nobody submits eight one-day events as eight entries — they combine into one, described together. **Grouping events is not a UI convenience that diminishes them; it is what the student will actually submit.**

- **Standing commitments lead, as cards.** Default to a **flat list**; a **"Group by cause" toggle** (`01` §4a) regroups into cause-area sections once there are enough to pay off. Cause chips ride on every card, so the throughline reads even ungrouped. Experiences with no cause fall into **"Uncategorized"** with a one-line nudge. Each card: org + role, direct/indirect chip, cause chip, population, total hours, longevity (`weekly · 18 mo`), verification state. Ends with a dashed **"+ add volunteering"** ghost card.
- **One-day events sit beneath, in ONE panel of rows.** Each row: date · event · org and what you did · population chip · hours.
  - **The panel header carries its own real total** — `34 hours · six events` — **rendered at the same weight the cards use for theirs.** It is not a footnote under the real work.
  - **Named `Single-day service`, NOT "One-day events" (RENAMED Aug 2026).** The sub-tab is now called **`Events`**, so a section called *"One-day events"* on `Organizations` would collide — two things called events meaning different scopes. **`Events` (the sub-tab) holds every dated occurrence across every org; `Single-day service` (this section) groups the one-off *experiences*.**
  - **Never "Misc", "Other", or "Uncategorized"** — those are bins, and V-12 forbids that register. **The section head states a count, never a judgment.**
  - **The panel has its own fast-add row**, so logging an event never routes through the card flow.
- **`longest 18 mo` in the headline strip reads across STANDING COMMITMENTS ONLY.** That number sitting beside a list of events was the specific insult V-12's copy rule could not fix on its own.
- **Mockup:** `specifications/mockups/05-volunteering/volunteering-standing-vs-events.html` (DRAFT — structure approved Aug 2026, visual pass still owed).
- **Selected-experience detail panel:** title, `role · Active · date range · N events`, hours as the one allowed big number. Inline verifier line. Then the **event log** with its fast-add row, **"What you bring"** (V-8), and the **reflection prompt chips**.
- **Records with no organization are complete, not drafts** (V-8's sibling, V-7). See §5d.
- **Pre-cycle prep panel**, phase-gated and invisible outside the application window, same as Clinical's.

### 5b. Events, every event across every org

Identical mechanics to Clinical's `Shifts` (#63 to #67): **month grouping with hour subtotals**, an org filter, a period filter, an **all / active / ended** segmented control that absorbs the archive case, **inline edit in place**, and the shared add row with an org picker defaulted to where you logged last.

- **The hours chart lives here** (#34): monthly bars by default, running total on request.
- **The continuity read sits beside it** (#72, `05` §2a). **This pillar leads with it**, because sustained service is the headline signal.
- Estimated backfill blocks render hatched, carry no marker, and stay out of pace, the gap baseline, and the bars.

### 5c. Reflections, the service-scoped door

**One record, two doors**, same as Clinical: Story Bank aggregates across all pillars, this shows service threads only, and **there is exactly one set of records**.

- **Two independent filters**, org and state (all / unpacked / not yet / skipped). Never one combined dropdown.
- **Browse and worklist at once**, so *"what have I not reflected on?"* is answerable here.
- **Synthesis threads render distinctly** (#45b), and **the V-10 throughline proposal appears here too**, tagged as its own kind of item.
- **The prompts ask toward "why help at all", not "why medicine"** (board §4b). A student tutoring kids is developing altruism and connection, and **that is allowed to be the whole point.**

### 5d. Records without an organization (V-7)

**The org, the supervisor, and the verifier are all optional**, and a record missing them is **complete**, not a draft.

This exists because real service often has no institution behind it: caring for a grandparent or sibling, interpreting for immigrant parents, helping a neighbour, or something the student started themselves. These are **disproportionately the records of students who had the least time for a formal volunteer role**, so dropping them filters exactly the wrong people.

- **No "missing" state, no amber chip, no data-health item** for an absent org.
- **§7c's verifier capture never fires** on a record with no org. There is nobody to capture, and asking would be absurd.
- **Type-to-create everything.** The student writes what the thing actually is. **No dropdown of approved service types.**
- **The prep panel handles it at export time**, where AMCAS does want a contact. One moment of honest friction, not a permanent flag.
- **Copy never implies a gap.** Not *"add an organization"*, not *"unverified"*.
- **Not a separate record type.** Same record, optional fields. Splitting it would create the two-tier feeling this removes.

## 6. Main workflows

- **Add volunteering:** Quick Add prefilled to Volunteering → org, role, direct/indirect, population, cause, recurring/event → **classifier runs** (non-clinical / looks-clinical→route) → save.
- **Log a event/event (core loop):** open experience → add event → date + hours → optional note → ~5s save. Headline + longevity recalc immediately.
- **Reflect:** add a note → optionally "send to Story Bank."
- **Verify / request letter:** set supervisor + contact; trigger a letter request into Letters.
- **Same club already in Extracurriculars?** Pick which pillar it belongs to. **No cross-link is created** (board §4g).
- **Review & export:** application-year view of all service, with direct/indirect + population + cause + dates + contacts, ready for AMCAS + CV.
- **Archive:** close an experience without losing hours or reflections.

## 7. Smart features (rules-based, explainable — `architecture/02`, `general.md`)

- **Non-clinical classifier / route-to-Clinical** — flags a logged activity that's actually clinical and offers to move it, so hours land in the right bucket. **Flag-and-offer only, never auto-move** (guide: AI acts permission-first — propose → confirm → act). On add and on demand, a clinical-looking activity (patient contact / "smell the patient") raises a **non-blocking** banner: "This looks clinical — logging it in Clinical means it counts as clinical hours. Move it?" with **Move / Keep here / Dismiss**. A Move relocates the experience with its **events and reflections intact** (hours never double-count); Keep/Dismiss is **remembered per-experience** so the same flag doesn't nag.
- **Consistency insight** — highlights sustained commitments ("18 mo, weekly"). **It does NOT comment on a record made only of events** (V-12): an earlier draft said it *"gently notes when service is only scattered one-offs,"* and that is exactly the scold V-12 forbids. **Silent is the correct behavior there.**
- **Event promotion, "you came back" (`○` deterministic, added Aug 2026, board §4h).** When an Experience tagged `one-time event` **gains a second event**, HQ offers to re-tag it `recurring` and move it up to a standing card: *"You came back to the Turkey Trot — want to track this as a standing commitment? It keeps both events and starts showing longevity."*
  - **This is what makes an annual event legible.** The same race every November is not a one-off; it is a multi-year relationship expressed once a year, and **service is full of them.**
  - **The whole test is a second event.** No AI, no sourced threshold, no scoring.
  - **Offer, never auto-move**, matching the route-to-Clinical rule above. Declining is remembered per-experience so it does not nag.
  - **Nothing fires when a student does not return.** The mechanism only ever rewards; it has no negative branch.
- **Cause throughline nudge** — surfaces the dominant cause / notes a coherent theme (or its absence) for the applicant's story.
- **Direct/indirect nudge** — untagged experience → prompt to tag (drives correct export + weighting awareness).
- **Missing verification** — active experience with no verifier contact.
- **Unlinked reflection** — a event note not yet sent to the Story Bank.
- **Duplicate-entry check** (revised Aug 2026, board §4g): service that matches a club already in Extracurriculars asks *"same thing, or separate?"* **The cross-link is cut.** One record lives in one pillar, so there was never a double-count to prevent, and a cross-linked record would export as something nobody could interpret. **No link is created either way.**
- **Never** surface certifications, skills, or recency-staleness warnings here (those are clinical); consistency + meaning are the volunteering signals.

## 8. Visualizations

- **Hours by cause** (compact) — the throughline at a glance; only if it earns space.
- **Hours/longevity over time** (small) — sustained vs. sporadic. Bounded height (`01` §5c).
- No progress ring dominating the top; no stat-square grid (`04` §10).

## 8a. Components used (feature → library component)

Explicit traceability (from `implementation/component-inventory.md`); motion from the shared system (`04` §7a). Reuses the experience-pillar builder (`05`) — inherits Clinical's skeleton.

| Feature | Component(s) |
|---|---|
| Compact headline strip | stat row + **Number Flow** + distinct-population count |
| Experience cards + Group-by-cause toggle | `Card` + **Glow Hover Cards**; **Toggle** (group-by-cause); cause **Animated Tags** |
| Selected-experience detail | `ObjectInspector` |
| Event/event log + fast-add | `TrackerTable`/list + InlineAddRow + **Calendar/Date Picker** + `AnimatePresence` |
| Direct/indirect · cause · population | **Animated Tags** (chips) + **Searchable Dropdown** (population presets + "other", multi-select) |
| Hours by cause | **Chart** (bar) |
| Hours/longevity over time | **Chart** (line/area, bounded) |
| Route-to-Clinical banner | non-blocking `Alert Dialog` (Move / Keep / Dismiss) |
| Verify + request letter | **EntityLinkCombobox** (Person) + **Smooth Button** → Letters |
| Inspector / right-click | `CenterPeek` + `ObjectInspector` · **Context Menu** |
| Duplicate-entry check vs Extracurriculars | non-blocking `Alert Dialog` at add time. **No `EntityLinkCombobox`, because no link is created** (board §4g) |
| **Sub-tab nav (§5)** | **Animated Tabs**, underline only. **No `ModeSwitch`** (`01` §4b-i) |
| **Events ledger + month grouping** | `TrackerTable`, grouped rows + subtotal headers |
| **Events filters** | `Select` ×2 (org, period) + segmented `Toggle Group` (all/active/ended) |
| **Add row, every door** | **One shared `InlineAddRow`** used by `Organizations`, `Events`, and Overview. Guards live in the component |
| **Continuity read (§5b, #72)** | **Chart** (engaged/gap strip, bounded). **Not a heatmap**: heatmaps imply intensity, this measures presence |
| **Reflections two-axis filter** | `Select` (org) + segmented `Toggle Group` (state) |
| **Unpack flow + synthesis (#45a/#45b)** | `FocusModeLayout` + `AI Input` + `Message`/`Message Scroller` + `Typewriter Text` |
| **"What you bring" (V-8)** | plain `Textarea`, one line. **No skill chips, no counts** |
| **Shared background (V-9)** | optional `Select` + free text. **Never inferred** |
| **Throughline proposal (V-10)** | `Card` variant + **Animated Tags**, in Reflections. Accept / reject / ignore |
| **Impact numerics (V-11)** | inline confirm chip on the event row |
| Reflections → Story Bank | `Smooth Button` (send/link) |
| Consistency / longevity chips | **Animated Tags** |
| Classifier / missing-verifier / consistency alerts + severity | Attention bell + **Animated Tags** |
| Archive (restore) | `TrashRecovery` |
| Empty / loading / error | `EmptyState` · **Skeleton** |

## 9. Cross-tab relationships

- **Overview** — total service hours → the Volunteering/Service domain row.
- **Essays / Story Bank** — service reflections + population/cause → "why I serve" material.
- **Profile / CV** — auto-aggregation with direct/indirect + cause.
- **Letters** — supervisors become recommenders; "request letter" hook.
- **Extracurriculars** — the **org entity** is shared (`general.md`), but **the experience record is not linked**. If a club belongs in both conceptually, it lives in one pillar and exports as one AMCAS entry (board §4g).
- **Clinical** — the classifier routes clinical-looking activities there.
- **People/orgs** — shared canonical entities (`general.md`).

## 10. Inspector design (center peek · `01` §2/§3)

**Expanded Aug 2026 for three sub-tabs.** Opens from an org card on `Organizations`, a row on `Events`, or a thread in `Reflections`: **three entry points, two record types.**

### For an Experience (an org or role)

Sections: **Overview** (org, role, direct/indirect, population, cause, cadence, dates, classifier result) · **Events** (log + fast add) · **Reflections** (its threads) · **Verification** · **Activity**.

- **Quick actions:** log event, add reflection, tag direct/indirect, set cause/population, request letter, archive.
- **No cross-link action** (cut Aug 2026, board §4g).
- **The Verification section is hidden entirely on a record with no org** (V-7). It is not shown empty or greyed; there is nobody to verify, and rendering the field implies otherwise.
- **Role edits offer `Split`**, inheriting Clinical's #57 fork rule.

### For a Event

Sections: **Detail** (date, hours, org, note) · **Reflection** (the quick note, and the unpack thread if one exists).

- **The unpacking marker's two actions live here**: unpack, or defer. Both permanent.
- Edits obey the shared guards (>24h, #59).
- **An estimated backfill block opens read-mostly**, carrying no marker and no unpack action.

### Rules

- **One record, never a second place to browse.** No filters, no lists of other events.
- **Threads open into the full-screen unpack flow**, not the peek.

## 11. Empty, loading, error states (`01` §8, `04` §9)

**Rewritten Aug 2026 for three sub-tabs.** Empty is **an invitation, not an apology**, never a wall of zeros. Loading is a skeleton of each surface's own shape. Errors say what happened and the fix in one sentence, scoped to the surface that failed.

**Cold start is a whole-tab state.** A student with zero experiences sees **one action** on `Organizations`: *"Add your first volunteering experience"*, plus a one-line *"what counts as service, versus clinical?"* helper. **`Events` and `Reflections` do not render empty in this state**; three empty tabs read as a broken app rather than a new one.

| Surface | Empty | Why |
|---|---|---|
| **Organizations** | One action, plus the what-counts helper. **No target, no pace.** | Day one has exactly one useful action |
| **Events**, none logged | *"Nothing logged yet. Add a event from any org, or right here."* Filters render **disabled, not hidden** | So the student learns the surface has filters |
| **Events**, filtered to nothing | *"No events at Carolina Health Access in this range."* Plus clear-filters | **A filter result is not an empty record set**, and conflating them makes the student think their data vanished |
| **Reflections**, nothing unpacked | *"Nothing unpacked yet. Any event can be unpacked from its row."* | Names the entry point, since the marker lives on event rows |
| **Cause grouping**, none set | An **"Uncategorized"** group with a one-line nudge | Never an error, and never blocks the toggle |
| **Continuity read**, under 3 months | The honest dormant line (`01` §6.10-A) | Continuity over one term is a fragment, not a signal |

**A record with no organization is never an empty state.** It is a complete record (§5d), and nothing about it renders as missing.

## 12. Mobile behavior

**Rewritten Aug 2026 for three sub-tabs.** Events are logged on a phone, often right after an event, so mobile is the primary logging context rather than a degraded desktop.

- **Sub-tab nav** collapses per `01` §5c but **stays visible**, never becoming a dropdown.
- **Organizations:** cards stack full-width; the detail panel opens as a `SidePeek` sheet.
- **Events:** the ledger drops hours to a second line rather than horizontal-scrolling. **The two filters collapse into one sheet** behind a single `Filters` control. **This is presentation only**, not the combined dropdown §5c forbids: they remain two independent controls inside the sheet.
- **The add row goes full-width, one field per line**, keeping the org picker.
- **Reflections:** same filter-sheet treatment. **The unpack flow is genuinely good on mobile**, since it is a text box and a conversation.
- **Reduced-motion and keyboard-only** hold on every surface.

## 13. Admissions-aware reasoning (`architecture/04`)

- Community service is a near-universal expectation; **sustained commitment to a cause** reads far stronger than scattered hours.
- **Direct** service (face-to-face) generally carries more weight than indirect, but both belong.
- **Who you served + why** is the point — service tied to a coherent mission is memorable; a pile of unrelated hours is not.
- Keep clinical volunteering in **Clinical** — mis-bucketing here loses clinical-hour credit.

## 14. Do Not Generalize From Other Tabs

- The classifier here is the **inverse** of Clinical's (routes *out* to Clinical); don't copy Clinical's "counts as clinical" logic verbatim.
- **No certifications, paid/volunteer tag, or patient-contact** — those are clinical-only. (Skills observed/performed is not listed because it no longer exists anywhere: cut by R1.)
- Don't import Clinical's recency-staleness **alert** (#33). **Read that narrowly:** the *nudge* is excluded, not the reads. Per `05` §2a, **hours, recency, and continuity all render on every pillar**; only the emphasis differs. Volunteering leads with continuity, Clinical leads with recency, and both show both. A visible fact is not the same as HQ interrupting you about it.
- Don't enter the same club twice. **Do not cross-link it either** (cut Aug 2026): pick the pillar it belongs to and it lives there.

## 15. Acceptance criteria

- [ ] Reuses the shared frame as **three sub-tabs** (§5); no clinical-only fields (certs, skills, paid-tag, patient-contact) present anywhere.
- [ ] Event/event logging (recurring + one-off) rolls up to the hours headline; ~5s add.
- [ ] **`Organizations` renders two shapes**: standing commitments as cards, one-day events as rows in a single panel. **A one-off never renders as its own card.**
- [ ] **The events panel shows its own hours total at card weight**, and the section is never labelled "Misc", "Other", or "Uncategorized".
- [ ] **`longest N mo` computes across standing commitments only** — verified against a fixture whose record set is entirely events.
- [ ] **A second event on a `one-time event` raises the promotion offer**, which is declinable and remembered; **nothing fires when a student does not return.**
- [ ] **No copy anywhere reads "only", "just", "brief", or "short"** about a one-day event — verified by grep, not inspection.
- [ ] Direct/indirect, population/need, and cause captured per experience; export includes them.
- [ ] Cards can group by cause (the throughline). **Continuity leads the headline, and recency is still shown** (`05` §2a): emphasis differs between pillars, presence does not.
- [ ] Non-clinical classifier flags clinical-looking activities and routes them to Clinical.
- [ ] A club already in Extracurriculars triggers a **duplicate-entry check at add time**, not a cross-link. **No experience record ever references another pillar's record**, and none appears in two pillars.
- [ ] Reflections flow to Story Bank; supervisors are shared People; "request letter" hooks Letters.
- [ ] Headline is a compact strip; cards are the hero (`05` §3, `04` §6/§10) — no big stat boxes/ring.
- [ ] **Structure (§5):** three flat sub-tabs (`Organizations` · `Events` · `Reflections`), underline only, no mode switch. `Organizations` is the default landing. **No Credentials section and no paid/volunteer control anywhere.**
- [ ] **Logging works from `Organizations`, `Events`, and Overview**, all rendering the same `InlineAddRow`, and still completes in ≤5 seconds from any of them.
- [ ] **Continuity leads the headline and recency is still shown** (`05` §2a). The recency **alert** (#33) does not exist here; the recency **read** does.
- [ ] **A record with no organization is complete** (V-7): no missing state, no amber chip, no data-health item, and **verifier capture never fires on it**.
- [ ] **V-10 proposes and never assigns.** It is **silent** with fewer than three experiences or when records lack descriptive material, and **never reports "your record is scattered"** as a finding.
- [ ] **The archetype is never stored on a record.** It is derived at synthesis time and lives in the proposal only.
- [ ] Empty/loading/error, light/dark, desktop/mobile, keyboard-only, reduced-motion verified.

## 16. Resolved decisions

*(All three prior open decisions are now locked and reflected in the body above — kept here as the rationale record.)*

1. **List default — flat list + "Group by cause" toggle** (not grouped-by-default). Grouping-by-default produces confusing single-item groups for a new user with a few uncategorized experiences; a flat list stays legible, cause chips carry the throughline ungrouped, and the toggle pays off at scale. Uncategorized experiences bucket into an "Uncategorized" group with a nudge. (See §5.)
2. **Population/need — light preset list + free-text "other," multi-select.** Structured population is what makes the "N populations served" headline count trustworthy (can't reliably count from free text); "other" prevents lock-out and can be promoted to a preset later. (See §4.)
3. **Route-to-Clinical — flag-and-offer, never auto-move.** Required by the permission-first AI rule and consistent with Clinical's classifier: a non-blocking Move / Keep / Dismiss banner, Move preserves events + reflections, dismissal remembered per-experience. (See §7.)

## 17. Open decisions

**All six from the Aug 2026 reopen are now RULED** (`tabs/04-volunteering-board.md` §4). Kept as the rationale record.

1. **V-1 · hour target and pace projection: KEPT, identical to Clinical.** §7a's apparatus inherits whole. This overrode `03-clinical-board.md` §6's claim that Clinical was the only pillar allowed one.
2. **V-2 · pace line: unchanged**, inherited with V-1.
3. **V-3 · continuity: generalized to every pillar** (`05` §2a). Hours, recency, and continuity are three reads and all five pillars show all three. **Emphasis differs, presence does not.** Volunteering leads with continuity; it still shows recency.
4. **V-4 · shared org directory: inherits, function unchanged.** It matters more here because service orgs are genuinely shared between students, but nothing about the mechanism differs.
5. **V-5 · synthesis pass: same mechanism, different lens.** Clinical asks toward *why medicine*; this asks toward *why help at all*. **Prompts must not route every reflection back to medicine** (board §4b).
6. **V-6 · dissolved, not answered.** One activity is one entry in one place, because that is all AMCAS can see. There is no state where a record is in two pillars, so there was never a conflict to arbitrate. **Consequence: W7's cross-link is cut** and replaced with a duplicate check at add time (board §4g).

**Seven new features** (V-7 to V-13) are catalogued in `tabs/04-volunteering-feature-catalog.md` §3.

**Nothing is open on this pillar.**
