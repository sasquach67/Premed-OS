# CODEX TASK — Bring the MCAT section of Premed OS to full "PrepCat parity"

Paste this whole file to Codex. It is self-contained: context, setup, exact placement, per-tab design, the full data/scoring model, and build order. A companion HTML mockup and PrepCat reference screenshots ship in the same folder (`MCAT-PrepCat-Design/`, at the repo root) — **open them first.**

> **Framing:** The MCAT pillar (`src/pages/Mcat.tsx`) already has the six tabs (Dashboard · Plan · Content · Mistakes · Stats · Advisor) built with **mostly static/mock data** (`PLAN_DAYS`, `HEATMAP`, hard-coded streaks, `CONTENT_ITEMS`). This task **upgrades each tab to be real and interactive**, modeled on PrepCat (a polished MCAT-prep app Andy uses), rebuilt in Premed OS's own warm-paper Ghibli theme. The **Mistakes tab is the centerpiece** (an AAMC-outline "mistake map"); the other tabs get parity passes that share one data model.

---

## 0. First steps (do these before writing code)
1. **Read the current file** `src/pages/Mcat.tsx` end to end and inventory what already exists (component names below). Reuse existing components (`ReadinessRing`, `ScoreTile`, `MetricTile`, `MiniBar`, `Heatmap`, `PlanDay`, `ContentCard`, `FilterRow`, `Field`) — extend, don't duplicate.
2. **Open the mockup** `MCAT-PrepCat-Design/mcat-mistake-map.html` (at the repo root; `open` it or serve the folder). It shows the target for the Mistakes tab (radial mind map, topic combobox, inspector, roll-ups). **Direction, not pixel-law** — match layout, hierarchy, encoding, interactions.
3. **Study the PrepCat reference screenshots** in `MCAT-PrepCat-Design/prepcat-reference/` (see its `README.md` for the filename→tab mapping). These are screenshots of PrepCat — the app this whole MCAT page is modeled on — showing each tab, several in a **filled/populated** state. Use them as visual direction for *layout and interaction*, but keep Premed OS's own theme/fonts/colors (§1). If the folder is empty or missing a shot, fall back to the written flow descriptions in §4.
4. **Setup / run** (Node is user-local):
   ```bash
   export PATH="$HOME/.local/node/bin:$PATH"
   cd premedos && npm install && npm run dev   # http://localhost:5180
   ```
5. **Deploy note:** the GitHub-connected deploy repo is the ROOT `premed-hq-review/`, which builds from a copy of this app. **You own the nested app (`premed-hq/`) only** — do NOT edit the root copy or `.github/workflows`; Andy handles the mirror. Don't commit QA screenshots or `.DS_Store`.

---

## 1. What must NOT change
- **Fonts** (Baloo 2 display / Nunito body) and the warm-paper theme. Reuse the `SECTION_META` colors already in `Mcat.tsx`: `bb #76b86c` · `cp #e4a24f` · `cars #62b7ee` · `ps #ef86b4`. Use `--destructive`/`--warning`/`--success` for severity, `--primary` (Carolina blue) for accents.
- The MCAT tab strip and its labels/icons — keep all six tabs where they are.
- The localStorage-first Zustand store; no backend. Don't add heavy deps (SVG hand-built is fine; `d3-force` only if you want physics on the map).
- Andy's decluttered taste: consolidate actions into overflow (⋯) menus, dropdowns over button-rows, no explainer blurbs, dense-but-breathable. Every list/state needs an **empty**, and destructive actions confirm.

---

## 2. Shared foundation — data model + scoring engine (build FIRST, all tabs depend on it)

### 2a. AAMC content outline — `src/data/aamcOutline.ts`
The full, static AAMC hierarchy, four levels deep: **Section (4) → Foundational Concept (10) → Content Category → Topic (leaf).**
```ts
export type SectionKey = 'bb' | 'cp' | 'cars' | 'ps'      // reuse existing type
export interface AamcTopic    { id: string; label: string; categoryId: string; resourceIds?: string[] }
export interface AamcCategory { id: string; label: string; fcId: string }
export interface AamcFC       { id: string; label: string; section: SectionKey }
export const AAMC_FCS: AamcFC[] = [/* FC1..FC10 + 2 CARS pseudo-FCs */]
export const AAMC_CATEGORIES: AamcCategory[] = [/* 1A..10A + CARS skill groups */]
export const AAMC_TOPICS: AamcTopic[] = [/* the leaves */]
export const topicById        = (id: string) => AAMC_TOPICS.find(t => t.id === id)
export const topicsByCategory = (c: string) => AAMC_TOPICS.filter(t => t.categoryId === c)
export const sectionOfTopic   = (t: AamcTopic): SectionKey => /* topic→cat→fc→section */
```
Seed the official framework:
- **bb:** FC1 → 1A amino acids/proteins, 1B genetic-info transmission, 1C heritable-info transmission, 1D biological self-assembly; FC2 → 2A plasma membrane, 2B cell structure/function, 2C eukaryote/prokaryote, 2D viruses/microbes; FC3 → 3A nervous/endocrine, 3B other organ systems.
- **cp:** FC4 → 4A motion/force/energy, 4B fluids, 4C electrostatics/magnetism, 4D light/optics/sound, 4E atoms/nuclear; FC5 → 5A water, 5B molecules/bonds, 5C thermo/thermochem, 5D kinetics, 5E electrochem.
- **ps:** FC6 → 6A sensing, 6B making sense of environment, 6C emotion/stress; FC7 → 7A individual behavior, 7B social behavior, 7C attitude/behavior change; FC8 → 8A self-identity, 8B social thinking, 8C social interactions; FC9 → 9A social structures, 9B demographics; FC10 → 10A social inequality.
- **cars:** two pseudo-FCs → skill groups: "Foundations of comprehension" (main idea, detail, inference, vocab-in-context) and "Reasoning within & beyond the text" (tone/attitude, argument structure, application, integrating new info).

Leaf granularity = the level a student mis-tags (e.g. `4B → "Bernoulli / continuity"`, `"pressure & depth"`, `"buoyancy"`), ~6–12 leaves per category. **If the full leaf set is too big for one pass, seed bb + cp fully, stub ps/cars with `// TODO: expand`, no leaves** — the UI must never assume a topic exists.

### 2b. Types — extend `src/lib/types.ts` (keep old fields for back-compat)
```ts
export interface McatErrorLog {
  id: ID; date?: string
  section: string           // keep; derive from topicId when present
  topicId?: string          // NEW — links to AamcTopic.id
  topic: string             // keep as free-text fallback / display
  subtopic?: string         // NEW (PrepCat has this)
  youPicked?: string        // NEW — answer letter you chose
  correct?: string          // NEW — correct answer letter
  errorType?: 'content-gap' | 'careless' | 'trap' | 'timing' | 'misread'  // NEW taxonomy
  whyMissed: string; fix: string; source?: string
  resolved: boolean; order: number
}
// McatAttempt already exists (total/cp/cars/bb/ps, kind, date). Add:
export interface McatState {
  targetDate?: string; goalScore?: number
  diagnostic?: { bb: number; cp: number; cars: number; ps: number }   // NEW baseline
  attempts: McatAttempt[]     // full-lengths logged here
  errorLog: McatErrorLog[]
  schedule: McatScheduleItem[]
  studyLog?: { date: string; minutes: number }[]                       // NEW for streak/heatmap/hours
}
```
Migration: old error rows lack `topicId` → still render (grouped by `section`, shown "untagged") with an **"assign topic"** action; run `guessTopicId(topic, section)` on load to fuzzy-match legacy free-text to the outline.

### 2c. Scoring engine — `src/lib/mcatEngine.ts` (pure selectors; this makes the numbers real)
- `baselineTotal()` = sum of `diagnostic` sections (or latest attempt).
- `latestScore()` / `projectedScore(targetDate)` — projection = baseline trending toward goal by exam day, adjusted by recent attempts (simple linear/pace model is fine; comment the formula).
- `sectionReadiness()` → per-section `{ now, projected }` (0–100) from attempts + mistake density.
- `missesByTopic/BySection/ByCategory(errorLog)`, `weakestSection()`, `topWeakTopics(n)`, `reviewQueue()` (unresolved, ranked).
- `streakDays()`, `hoursLogged()`, `consistencyGrid()` from `studyLog`.
- `catchUp()` → `{ unfinished, hoursBehind }` from schedule vs today.

Everything below reads these selectors instead of the current hard-coded mock values.

---

## 3. Per-tab parity spec

### TAB 1 — Dashboard (`McatDashboard`)
Model on PrepCat's dashboard (see notes in §4). Compose:
- **Readiness hero** (dark card): big **readiness ring** + status chip ("Just getting started" ⁄ tiers) + **"Projected {p}% by exam day +{delta}"** + a one-line pace sentence + **per-section mini-bars** (Bio/Chem/CARS/Psych, colored). Reuse `ReadinessRing`/`MiniBar`, feed from `sectionReadiness()`/`projectedScore()`.
- **Diagnostic prompt → entry** — if no `diagnostic`, show an "Add your diagnostic score" card with an **Add** button opening a modal: four section inputs (118–132) + **live Total** + "Save diagnostic." Persists to `mcat.diagnostic`, recalibrates projections.
- **Today plan checklist** — today's sessions from the schedule as tickable rows (section chip · time · task · detail), with an "x of n done · Hh" header. Checking one logs `studyLog` minutes.
- **Full-length logger** — a "Full lengths" section + **"Log a full length"** modal: "Which exam" (text) + "Date taken" (date) + four **−/+ steppers** (118–132) + live Total + **"Save and recalibrate"** → pushes an `McatAttempt`, updates projection.
- **Recent mistakes** — last N from `errorLog` with "n logged · n mastered," each linking into the Mistakes tab; empty state "Log a mistake and it'll appear here, ready to drill."
- **Right rail:** catch-up debt alert (`catchUp()` → "n unfinished · ~Hh behind"), **"Focus on {weakestSection()}"** nudge, **exam countdown** (`YOUR EXAM / n days`), stat tiles (**Day streak · Hours logged · Mastered of N · MCAT score**), and a **study-consistency heatmap** (reuse `Heatmap`, feed `consistencyGrid()`). A **"Review library"** card links to Content.

### TAB 2 — Plan (`McatPlan`)
- Header: **phase badge** (Foundation/Practice/Polish/Full length — *dynamic* from where today sits) + **"Exam in n days."**
- **Projected-score card**: "Projected {p} · {gap} pts to go" + **"Rebuild my plan to close the gap"** (regenerates `schedule` around remaining time — comment the algorithm seam) + goal readout. An **"Talk to your advisor"** helper card linking to the Advisor tab.
- **Phase legend** (color dots) + **Weeks ↔ Months** segmented toggle.
  - **Weeks:** day columns (reuse `PlanDay`), each a stack of **session cards** (section chip · time · task · detail e.g. "Anki · MileDown · 200 due cards", "Review your mistakes · {reviewQueue().length} from your error log"), an hours badge, explicit **Rest** days, and a dark **Exam-day** card. Support **drag-a-session-to-another-day** (dnd-kit is already a dep).
  - **Months:** a full month calendar grid; each day shows phase-colored dots + daily hours, **Rest** on rest days, today highlighted.

### TAB 3 — Content (`McatContent`)
- **Library hero**: search box + count pills ("N guides · N hack sheets · N pathways · N games"), **featured cards** (Equation hack sheets, Pathway worksheets, and any games), then two filter rows (**type**: all/guide/hack-sheet/pathway/game — reuse `FilterRow`; **section**: all/bb/cp/cars/ps).
- **Card grid** (reuse `ContentCard`) with consistent meta (`~28 min · 7 sections · cheat sheet`), section-colored.
- **NEW — guide detail view** (route or in-tab panel): a **Guide ↔ Cheat sheet** toggle; a sticky **"On this page" TOC**; a **"Key essentials"** summary block; long-form sections; colored **callout boxes** (a ⚠ **Trap** box and a **Figure** box). The **Cheat sheet** view = a numbered "60-Second Night-Before" condensed list. Content bodies can be seeded from a `contentGuides.ts` data file (a few real guides — e.g. Amino Acids, Fluids — enough to prove the pattern; stub the rest). Each guide ties to AAMC topics via the same `resourceIds` used by the mistake map, so the Mistakes inspector links here.

### TAB 4 — Mistakes (`MistakeMap`) — the centerpiece
Three stacked regions (see mockup):
1. **Log bar:** (a) **screenshot dropzone** — drag/click/paste (⌘V); keep current drop behavior but open the new card in "assign topic" state; mark OCR as a seam `// TODO: OCR → guessTopicId`. (b) **"Log a miss"** opens the **full log modal** matching PrepCat + our upgrade: **Section** segmented · **Topic** (a *debounced fuzzy-search combobox over `AAMC_TOPICS`*, grouped by section, pill + breadcrumb — this is our upgrade over PrepCat's free text) · **Subtopic** (free text) · **Why you missed / key idea** (textarea) · **You picked** / **Correct** (answer letters) · **Type** chip row (**Content gap · Careless · Trap answer · Timing · Misread**) · **Log it**.
2. **Map + inspector split** with a **Mind map ↔ List** segmented control.
   - **Mind map (SVG radial node-link):** center "YOU" + total; 4 section branches (SECTION_META colors); category sub-nodes and topic leaves that have ≥1 miss. **Encode weakness twice:** node radius ∝ miss count (clamp ~10–26px) AND red overlay (`--destructive`, opacity ∝ severity); mostly-resolved topics dim toward `--success`. Only render nodes with misses; add a faint **"＋ browse full outline"** opening the whole tree in a dialog for manual logging. Nodes are focusable buttons (Enter selects); hover → count tooltip; empty state = mascot + "Log your first miss and this map grows."
   - **Inspector (~340px; stacks on mobile):** breadcrumb `Section › FCx › Category`, topic title, stat trio (Misses / Resolved / Status). **"Fix it with these"** → the topic's `resourceIds` resolved to real Content items, linking into the Content detail view. **"Your misses here"** → the individual `McatErrorLog` rows (editable why/fix/type/answers, "Got it" resolve toggle). Primary action **"Build a drill from these →"** (stub: filters Content/Plan to the topic).
   - **List view** = the existing editable error-log card grid, kept as fallback/detail; carry over the section faceted-filter chips.
3. **Roll-up strip:** 4 tiles (Weakest section · Top weak topic · Resolved n/total · Review queue), thin section-colored spines, all from `mcatEngine`.

### TAB 5 — Stats (`McatStats`)
- **Projected-score hero**: big `{projected}/528` with a **"you are here" line** from diagnostic → goal, and a pace sentence.
- **KPI tiles**: Ready now % · Projected % · Hours logged · Day streak.
- **Readiness by section**: dual bars **now → projected** per section (reuse `MiniBar`).
- **Consistency**: heatmap + an **hours-per-week** sparkline (Recharts, already a dep).
- **Most missed topics**: from `topWeakTopics()` (point the existing `rankTopics` at `topicId`, fall back to free text). **Mastered vs due** summary.

### TAB 6 — Advisor (`McatAdvisor`)
- Keep the chat-counselor pattern. Opening message references real state (projected score, days left, weakest section). **Quick-reply chips** ("I am falling behind" · "Make next week lighter" · "What should I focus on?" · "I have an exam this week") that map to canned, state-aware responses and can trigger a plan action (e.g. "rebuild plan"). Keep responses local/deterministic (no backend); comment where a real LLM call could plug in.

---

## 4. PrepCat reference — exact flows observed (so nothing is lost)
- **Log-a-mistake modal:** screenshot dropzone ("Drop a screenshot anywhere here · or click to upload · paste with ⌘V") + "or enter it manually" → Section(Bio/Chem/CARS/Psych) · Topic(free text) · Subtopic(free text) · "Why you missed it / the key idea" · "You picked" / "Correct" · Type(Content gap/Careless/Trap answer/Timing/Misread) · "Log it." **We upgrade Topic to an AAMC-outline combobox on purpose.**
- **Diagnostic entry:** "Enter each section from your first practice exam (118 to 132)" → 4 inputs + live Total + "Save diagnostic."
- **Full-length logger:** "Which exam" + "Date taken" + 4 −/+ steppers (118–132) + live Total + "Save and recalibrate."
- **Content guide detail:** Guide/Cheat-sheet toggle · sticky "On this page" TOC · "Key essentials" bullets · sections · ⚠ Trap and Figure callouts · numbered "60-Second Night-Before Cheat Sheet."
- **Plan:** dynamic phase badge · "Projected {n} · {gap} pts to go" + "Rebuild my plan to close the gap" · "Talk to your advisor" · Today checklist · Weeks/Months toggle · session cards (section chip · time · task · detail) · Rest days · Exam-day card.
- **Dashboard:** readiness hero (ring + projected + delta + section bars) · catch-up debt alert · focus-weakest nudge · exam countdown · stat tiles (streak/hours/mastered/score) · study-consistency heatmap · diagnostic prompt · full-length logger · recent mistakes · review library.
- **Stats:** projected-score "you are here" line · KPI tiles · readiness-by-section dual bars · consistency heatmap + hours/week sparkline · most-missed topics · mastered-vs-due.
- **Advisor:** chat with quick-reply chips that recalibrate the plan.
- **Consistent across app:** section color-coding everywhere (bb/cp/cars/ps), streak + heatmap, everything recomputed live from sessions + mistakes.

---

## 5. Build order (ship in reviewable slices)
1. **Foundation** — `aamcOutline.ts` (bb+cp full, ps/cars stubbed), `types.ts` additions + migration, `mcatEngine.ts` selectors. *(Land first; everything depends on it.)*
2. **Mistakes tab** — log modal (screenshot + combobox form), mind map + inspector, roll-ups. *(The centerpiece; the mockup is for this.)*
3. **Dashboard** — wire real selectors, diagnostic modal, full-length logger, recent mistakes, heatmap.
4. **Plan** — dynamic phase, Weeks/Months, drag-to-reschedule, rebuild-plan stub.
5. **Stats + Advisor** — real projections/rollups; state-aware advisor chips.
6. **Content detail** — guide/cheat-sheet detail view + a few seeded guides.
7. Fill remaining ps/cars AAMC topics + more content guides.

Ship 1–2 for review first, then 3–4, then 5–7.

---

## 6. Verify before commit
`export PATH="$HOME/.local/node/bin:$PATH"` → `npm run build`. Preview on :5180 and confirm the core loop: add a diagnostic → projection updates; log a miss via the combobox → node appears/grows on the map → click node → inspector shows misses + linked resources → resolve one → roll-ups + Stats update; log a full length → readiness recalibrates; Plan phase reflects today; Advisor references real numbers. No console errors; mobile stacks map-over-inspector and reflows tiles.

**Commit message:**
`Bring MCAT pillar to PrepCat parity — AAMC mistake map, scoring engine, diagnostic/full-length logging, content detail, live plan/stats/advisor`
