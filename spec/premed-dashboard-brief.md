# Premed Ultimate Dashboard — Research & Build Brief

> ⚠️ **THIS BRIEF IS THE DEEP REFERENCE — NOT THE LATEST INSTRUCTIONS.**
> A working build already exists. The **authoritative, current direction** lives in:
> - `premedos/CLAUDE.md` (entry point + golden rules)
> - `premedos/rules/*.md` (focused working specs)
> - `premedos/rules/revisions.md` + `/REVISIONS-ROUND-1.md` (the ACTIVE change list — do these next)
>
> **Conflict order: `revisions` > `rules/*` > this brief.** Use this brief for background/depth (research, source material, personalization, appendices); follow the rules + revisions for what to actually build/change.

**Purpose:** Context file for Claude Code. Captures (1) what already exists, (2) how people structure these tools, (3) a catalog of features worth stealing, (4) the gaps no existing product fills, and (5) the spec + ready-to-paste prompt for building a personal, interactive, all-in-one premed HTML dashboard.

**Owner:** Andy — current stage: **early premed (freshman/sophomore)**
**Last updated:** June 2026

---

## 1. The vision (what we're actually building)

A single interactive **HTML web app**, personal to me, that holds *everything* relevant to a premed → med school application. Not just a tracker — a command center.

Core principles:

- **One page, many deep views.** A clean home/overview, and each pillar is a tab that opens its *own full mini-dashboard* (its own trackers, tips/resources, Drive links, sub-sections).
- **Resources & tips live INSIDE each pillar**, not as a separate tab (too much volume to centralize).
- **Editable like Notion.** I can add, edit, check off, reorder, and delete entries directly in the page.
- **Saves my data via browser localStorage** (persists on my machine across sessions). Include an **Export/Import (JSON) backup button** so data is never trapped or lost.
- **Google Drive linking.** Structured data lives in the dashboard; actual *files* (essay drafts, transcripts, CV, logs) live in Google Drive. Each relevant entry can hold a clickable "Open in Drive" link.
- **Playful layer on the home screen** — daily rotating quote, pillar icons, progress visuals, countdowns/streaks.
- **Look:** clean but dense. (Style examples to be supplied separately.)

---

## 2. Landscape — what already exists

### Notion templates (deep, customizable, but no GPA logic / no playful coding)
- **Pre-Med Life Planner: Deluxe** — billed as the "ultimate" premed planner; most comprehensive Notion option. https://www.notion.com/templates/pre-med-life-planner-deluxe
- **Pre-Med → Med School** — hours, coursework, grades, essays, school list, rec/activity resources. https://www.notion.com/templates/pre-med-med-school
- **Pre-med Dashboard (Arvind Rajan)** — 5/5 rated; breaks down every requirement + resources. https://www.notion.com/templates/pre-med-dashboard
- **Gridfiti "13 Best Med School Notion Templates"** (comparison roundup) — https://gridfiti.com/notion-medical-school-templates/

### Free templates via YouTube creators
- **"The Med School Acceptance Formula + Free Template"** — free; includes AAMC GPA calculator, prereq list, clinical-hour tracker. *(Most relevant free reference.)* https://www.youtube.com/watch?v=fFZT4KIj4us
- **"Study Better for Med School Using Notion (+ free template)"** — study-focused, free. https://www.youtube.com/watch?v=JByQZ5h7jCM

### Dedicated apps / web platforms (closest in FUNCTION to our build)
- **MedTrack (iOS)** — logs GPA, science GPA, MCAT, coursework, shadowing, clinical, research; computes a "MedTrack Score" vs accepted students; school matching; gap/strength insights. **Best single reference for feature set.** https://apps.apple.com/us/app/medtrack-pre-med-tracker/id6747754528
- **NextStep (iOS)** — experience logger by category, hour stats/visualization, goals/reminders, works offline. https://apps.apple.com/us/app/nextstep-premed-tracker/id6747686105
- **Mappd** — calculates GPA the way med schools do; tracks clinical/shadowing/meaningful experiences. https://mappd.com/
- **PreMeder** — unified dashboard: deadlines, essays, app status across MD/DO/dental/etc. https://premeder.com/
- **HPSA Premed Planner** — free; interactive timeline of required courses/activities/app steps. https://www.hpsa.org/programs/premed-planner/

### GPA calculator references (for building our own)
- MSHQ AMCAS/AACOMAS/TMDSAS calculator — https://medicalschoolhq.net/med-school-gpa-calculator-for-amcas-aacomas-and-tmdsas/
- NYU BCPM calculator — https://cas.nyu.edu/prehealth/resources/bcpm-calculator.html
- Johns Hopkins "Calculating the BCPM GPA" — https://studentaffairs.jhu.edu/preprofadvising/pre-medhealth/applicants/calculating-bcpm-gpa/
- AAMC Application Grade Conversion Guide (official) — https://students-residents.aamc.org/media/7761/download

---

## 3. How people structure these (common patterns to borrow)

1. **Home/overview with at-a-glance stats** — cumulative GPA, science GPA, total hours by category, MCAT countdown, next deadlines.
2. **Hour tracking by category with visualization** — clinical vs non-clinical vs volunteering vs shadowing vs research, shown as totals + charts (MedTrack/NextStep pattern).
3. **A "Score" or readiness signal** — compare profile against accepted-student benchmarks; highlight gaps (MedTrack).
4. **Interactive timeline** — step-by-step from freshman year → application submission, check off as you go (HPSA).
5. **GPA calculated the med-school way** — separate BCPM (science) and AO (all other); no grade replacement; repeats are averaged (Mappd).
6. **Experience "journal"** — log meaningful experiences as you go so the AMCAS Work & Activities section writes itself later.
7. **School list builder** — schools vs your stats, deadlines, secondary status.
8. **Resources embedded contextually** — tips next to the thing they're about, not dumped in one place.

---

## 4. Feature catalog — creative/misc things worth adding

Grouped by pillar. (Pick/expand later; this is the idea bank.)

### Academics & GPA
- **AMCAS-style GPA calculator**: enter course, credits, grade → instant **cumulative GPA + BCPM (science) GPA + AO GPA**. Rules: standard 4.0 scale, **no grade replacement**, **repeated courses averaged**, classify by "60%+ subject = science" heuristic with a BCPM toggle per course.
- **"What-if" GPA simulator**: project GPA after a hypothetical term/grades — "what do I need this semester to hit X."
- Term-by-term course planner + prerequisite checklist (per common MD/DO requirements).
- Grade-trend line chart over semesters.

### MCAT
- Study schedule / countdown to test date.
- Practice test score log (AAMC FLs, third-party) with a trend chart; section-by-section breakdown.
- Content/weakness tracker (topics → confidence rating → linked resources).

### Clinical experience
- Hour log w/ date, site, role, supervisor/contact, notes; running total; clinical vs non-clinical flag.

### Volunteering
- Hour log split clinical vs non-clinical; orgs, contacts, recurring-shift tracking.

### Shadowing
- Physician name, specialty, hours, date, contact, reflection note (feeds essays).

### Research
- Project/lab, PI, role, dates, hours, outputs (posters/abstracts/pubs), abstract text store.

### Extracurriculars / Leadership (incl. clubs & organizations)
- **Clubs & student organizations** (e.g., premed clubs, cultural orgs, Greek life, intramurals), plus leadership roles, hobbies, jobs, awards.
- Per entry: org/activity name, role/position, dates, hours, description, and a "most meaningful" flag (AMCAS lets you mark 3 most-meaningful activities).
- Track leadership progression within an org (member → officer → president) since longitudinal commitment + leadership is what adcoms value.

### Letters of Recommendation
- Recommender, relationship, strength estimate, asked/received status, deadline, thank-you sent flag, Drive link to the request packet.

### Essays & Story Bank
- **Story Bank**: dump meaningful experiences/moments as they happen, with tags (e.g., resilience, leadership, "why medicine," teamwork) → searchable later when drafting.
- Personal statement + secondary-essay workspace (links out to Drive drafts).
- Prompt library (common secondary prompts: adversity, diversity, why-us, etc.).
- Per-entry **personal commentary** field — my own notes on why an event matters / how to frame it.

### School List
- Schools w/ median GPA/MCAT, mission fit, in-state flag, deadlines, secondary received/submitted status, reach/target/safety tag, your-stats-vs-theirs indicator.

### Timeline / Tasks
- Master to-do + deadline list; year-by-year milestone timeline; overdue highlighting.

### Playful / home-screen layer
- **Daily Tip Mascot** — a cute Tar Heel mascot character (ram / Carolina-blue mascot) on the home screen that delivers a **new tip each day**, auto-pulled from the source material (§12 wiki gems, North Star, pillar tips). Cycles deterministically by date (e.g., `tipIndex = dayOfYear % tips.length`) so it's a fresh one daily, and loops through the whole bank. Tips can be tagged by source ("from r/premed", official, etc.). Could include a little speech bubble + optional "next tip" click. Tip bank is an editable array so Andy can add his own. *(This is a flagship feature — make it charming.)*
- Daily rotating motivational quote (array, indexed by day) — can be combined with or separate from the mascot tip.
- Pillar icons + color coding.
- Progress rings / bars (e.g., "clinical hours: 40/150 goal").
- Countdown widgets (MCAT date, application opens, next deadline).
- Optional streak counter (days logged) and small celebratory states on milestones.

---

## 5. The gap (why we're building, not buying)

No existing product combines ALL of these in one page I own:
- deep per-pillar tracking **+** embedded contextual tips/resources
- a **personal essay/story bank with my own commentary**
- **AMCAS-correct GPA math + what-if simulator**
- **my own playful touches** (quotes, icons, visuals)
- **Google Drive file linking**
- full data ownership (localStorage + JSON export), no subscription

Trackers (MedTrack, Mappd) nail logging. Notion planners nail depth/customization. None fuse logging + strategy + personal essay prep + playful personalization in one self-owned artifact. That fusion is the build.

---

## 6. Technical spec for the build

- **Single self-contained `index.html`** (HTML + CSS + JS inline, or minimal linked files). No backend.
- **Persistence:** `localStorage` (and/or `IndexedDB` if data grows large), namespaced (e.g., `premed_v1_*`). Auto-save on every edit — data persists across sessions/restarts on that device.
- **Backup / data-safety stack (FLAGSHIP SAFETY FEATURE — Andy's priority):**
  - **Manual export/import:** Export all data to a downloadable JSON file; Import to restore.
  - **Auto-backup to Google Drive while open:** on changes (debounced), quietly write a copy of the data file to a designated Google Drive folder.
  - **Daily-on-open backup check:** on load, if ≥24h since last Drive backup, push a fresh backup automatically — so opening it once a day yields an automatic daily backup with no user action.
  - **Setup note:** Drive write access needs a one-time Google OAuth sign-in, and the app likely must be **hosted** (even free static hosting) rather than opened as a bare `file://`, since Google auth doesn't work well from local files. Core data still lives in localStorage; Drive is the redundant safety layer.
  - **Honest limitation to encode:** a standalone HTML page only runs while open, so it cannot back up when fully closed. True "daily backup even when closed" would require a small backend or a local scheduled script (defer to a later phase). The on-open daily check covers the realistic case.
  - Show a small "last backed up: [timestamp]" indicator so Andy always knows his data is safe.
- **Navigation:** SPA — sidebar/tab nav; clicking a pillar swaps the main view to that pillar's full sub-dashboard. Home/overview is the default view.
- **Editing UX:** add/edit/delete rows inline; checkboxes; drag-reorder where it helps; modals or inline forms for new entries.
- **Drive linking:** every relevant entry has an optional URL field rendered as an "Open in Drive 📄" link (just hyperlinks — no API needed).
- **Charts:** lightweight (e.g., Chart.js via CDN, or hand-rolled SVG/CSS bars) for hours-by-category and GPA/MCAT trends.
- **No external storage APIs beyond localStorage.** Mobile-friendly layout a plus.
- **Style:** clean but dense; match supplied examples (TBD).

### Pillar list (each = its own deep view)
Overview/Home · Academics & GPA · MCAT · Clinical · Volunteering · Shadowing · Research · Extracurriculars/Leadership · Letters of Rec · Essays & Story Bank · School List · Timeline/Tasks
*(Resources & Tips embedded within each pillar.)*

---

## 7. MASTER BUILD PROMPT (paste this into Claude Code)

> **You are building a personal, interactive "premed ultimate dashboard" — a private web app/hub I open in my browser, not a public website.** This file (`premed-dashboard-brief.md`) is your complete spec. **Read it in full before writing code — and treat §15 (Design principles & critique-driven direction) as the HIGHEST-PRIORITY section; it overrides the generic content lists where they conflict.** Also read §6 (tech), §10–§14, Appendices A–C, every image in `./references/` (labeled 🎨 frontend or 🧱 structure), and the `.xlsx` files in `./source-spreadsheets/` for exact column/formula structures. The brief is the source of truth.
>
> **What to build:** a **React + TypeScript app (Vite) using shadcn/ui + Tailwind**, with client-side routing for nested tabs/pages (see §15.2). Component-based, typed, modular, easy to extend. A clean **Home/Overview** is the default; a **MedCoach-style grouped left sidebar** navigates to each pillar, and **each pillar opens into its own deep sub-dashboard with its own subtabs/pages.** This must be a genuinely **interactive interface — not a flat wall of boxes, not a Notion clone** (§15.1, §15.3).
>
> **Pillars (each = its own deep view; Resources & Tips embedded inside each):** Academics & GPA · MCAT · Clinical · Volunteering · Shadowing · Research · Extracurriculars/Leadership (incl. clubs & orgs) · Letters of Rec · Essays & Story Bank · School List · Timeline/Tasks · Profile (Resume/CV). See §13–§14 for the full feature list of each.
>
> **Non-negotiables (all detailed in the brief):**
> 1. **Data safety stack (top priority, §6/§13):** instant `localStorage` (+IndexedDB if needed) autosave; Export/Import JSON; **auto-backup to Google Drive** (debounced on change) with a **daily-on-open check** (≥24h → push backup) and a "last backed up" timestamp; OAuth for Drive; assume hosted so auth works; leave a clean hook for future backup-while-closed.
> 2. **Every tracker is a detailed TABLE** (who/site, date, hours, description, notes, files, status) **with a progress bar/ring layered on top** — never just a bar (§13.4). Inline add/edit/reorder/check-off/delete (Notion-like). Marking items finished can auto-remove them from active views (§13.5).
> 3. **AMCAS-style GPA engine (§4/§13):** per-course BCPM(science)/AO toggle → cumulative + science + AO GPA on 4.0 scale, no grade replacement, repeats averaged; **what-if simulator**; grade-weights what-if; progress rings; degree planner = UNC Tar Heel Tracker (grad + major reqs). Mirror the uploaded GPA-calc structure.
> 4. **MCAT pillar (§13.3):** the full master tab — resource database + helpful links, Content Review / Practice & Exams / Schedule / Tracker-templates sub-tabs, score tracker + countdown, error-log. Seed schedule from the uploaded MCAT xlsx.
> 5. **Assignment tracker (§13.5):** home-page alerts (due in next few days + exam ~1 week out); table (Course, Description, Type w/ presets, Deadline, Days-left countdown, Progress, Notes, Files; auto-remove on finish); **Notion-style calendar synced to the table**.
> 6. **Essays & Story Bank (§13.4):** tagged story bank with a personal-commentary field, pre-seeded with the reflection prompts; PS workspace (analysis checklist, drafts, editing resources); secondary-prompt tracker; interview-prep bank.
> 7. **Resume/CV + Google Docs embedding (§13.9):** auto-CV from logged roles + embedded editable Google Doc; general inline Google Docs embed; Google Drive embedding for Research and doc-heavy areas.
> 8. **Home/Overview (§14.3):** greeting, "jump back in," recent activity, category progress bar (GPA/MCAT/Shadowing/Volunteering/Activities), MCAT Question of the Day, Today's Focus Targets, AMCAS timeline card with live countdown, **daily Today's Quote**, and the **flagship Tar Heel ram mascot** giving a new daily tip (deterministic by date, from an editable tip bank seeded with the source material).
> 9. **Kanban board** (To-Do / In-Progress / Done, drag-drop) as a reusable component (§13.4).
> 10. **Look & interaction (§14 + §15):** clean, card-based, generous whitespace, MedCoach-style grouped sidebar, **single subtle Carolina-blue accent**, dark slate text, mobile-responsive. **Functionality over decoration — no wasted space, no scattered non-functional boxes, no giant flat tables (use toggles/accordions), icons must match labels.** Most elements are clickable → open deeper pages/subtabs. Resources are categorized clickable cards (open new tab), not link dumps. Essays open a real writing/document view (not inline boxes). Embed the Google Drive folder for Research. Timeline is a visual graphic. Add a Help tab (Discord etc.). Top alerts bar synced to Google/Notion calendar. **Mascot:** a custom cute cartoon ram (Ghibli-adjacent, warm/hand-drawn feel — NOT emoji, NOT corny title) that moves position per tab and gives a random daily tip via speech bubble from an editable pool (replaces static tip boxes). Better sources for quotes + MCAT-question-of-the-day (API/feed/editable pool). Emulate the references' feel — don't clone.
>
> **Use my installed skills — with restraint:** apply the **Frontend Design skill (by Anthropic)** and the **UI/UX Pro Max skill** to guide layout, components, and polish. BUT do not go over the top: this is a **personal utility hub I'll use daily, not a flashy marketing/graphic-design website.** Prioritize clean, fast, functional, and readable over heavy animation, hero sections, or visual flourish. Restraint and usability win.
>
> **Pre-seed my data:** populate the Academics course planner, degree/Tar Heel tracker, MCAT timeline, and Timeline/Tasks from **Appendix A (my UNC plan)** and **§9 (personalization)** so it opens already personalized, not blank. Seed pillar Tips from §12 (r/premed wiki) and the story-bank prompts from §13.4.
>
> **Tech (§15.2):** React + TypeScript + Vite + shadcn/ui + Tailwind; client-side routing for nested pages; Recharts for charts; fuzzy-search lib for comboboxes. Primary store = localStorage/IndexedDB; Google Drive/Docs integration for backup + embeds. Use proper UI patterns (debounced + fuzzy search, drag-and-drop upload, accordions, modals, keyboard nav, loading/empty/error states). Modular, typed, commented; add tests for non-trivial components.
>
> **How to proceed:** if anything material is ambiguous, ask me a few clarifying questions first. Then build it — scaffold the nav + data layer + backup system first, then build pillar by pillar, and tell me how to run/host it (incl. the Google OAuth setup) when done. Build what we've specced; use good judgment to fill small gaps.

---

## 8. Open items before final build
- ✅ Visual style direction locked (§14) — MedCoach/PreMed App look, subtle Carolina blue. Andy adding screenshots to `./references/`.
- ✅ Decided: HTML-first hub; Notion mirror optional/later.
- Minor (can use defaults): goal targets for progress bars — default to wiki benchmarks (clinical/volunteering ~150–200, shadowing ~50, research ~1.5 yr, clinical-hour stretch goal 1,000) unless Andy overrides.
- To clarify: what "MD Sprints" is (otherwise skip).

---

## 9. Personalization — Andy's UNC Neuroscience plan (pre-populate the dashboard with this)

The full course-planning document is appended as **Appendix A**. Below is the distilled set of facts the dashboard should be seeded with so it starts personal, not blank.

**Profile**
- UNC-Chapel Hill, **Neuroscience B.S., Pre-Med**, incoming first-year **Fall 2026**.
- Arrives ~a full year ahead on credit (both gen chems, both calcs, BIOL 101/101L, STOR 155, NSCI 175, PHYS 114/115, SPAN 203, several gen-eds). **Physics is fully complete. Organic chem did NOT transfer → chemistry is the critical path.**

**Academics & GPA pillar — seed with:**
- Year 1 locked courses. **Fall 2026:** PSYC 101, NURS 50 (FY seminar), BIOL 103, ENGL 105, IDST 101, IDST 111L (~14 cr). **Spring 2027:** CHEM 241 + 241L, BIOL 220, SOCI 101, + foundation leftover (~13–14 cr).
- Pre-load the full 4-year plan table (section 5 of Appendix A) into the course planner.
- Critical chem chains to surface as a tracker/visual: **Lab chain** 241L → 262L; **Lecture/MCAT chain** 261 → 262 → 430. CHEM 261 has no lab.
- GPA calculator note: AP/exam credit does NOT satisfy med-school prereqs (free schedule space only) — flag this so prereqs taken in residence are tracked separately.
- Stats flag: STOR 155 (AP) satisfies the major but may not satisfy med schools → plan PSYC 210 in residence.

**MCAT pillar — seed with:**
- MCAT date is driven by **when CHEM 430 (biochem) finishes** — it's the last content domino.
- Default target: **Option 2 (standard/GPA-safe)** — CHEM 430 Fall 2028, study winter 2028→spring 2029, **sit Jan–Apr 2029**, apply **2029 cycle**, matriculate **Fall 2030, no gap year**. (Set MCAT countdown widget to ~spring 2029.)

**Timeline/Tasks pillar — seed with:**
- Near-term: **enroll Fall 2026 on July 6, 10:00 AM** (ConnectCarolina); shopping-cart 30–40 sections; use Swap not Drop-then-Add.
- The 10 advising questions (Appendix A §9) → load as a "Verify with advisor/HPA" checklist.
- The "Red Flags / Things NOT to do" list (Appendix A §10) → could surface as a pinned reminders card.

**Resources & Tips (embedded per pillar) — seed with:**
- UNC-specific official links from Appendix A §11 (catalog, HPA medicine page, IDEAs-in-Action, registrar FAQ, class search) go into the relevant pillars' Resources sections.

**School List pillar:**
- Andy is early-stage; school list is mostly empty for now, but the build should still include the pillar. (Target-school MSAR checks are referenced repeatedly in the plan — make MSAR a tracked resource.)

> Build note for Claude Code: treat Appendix A as the source of truth for Andy's academics. Where the dashboard has an Academics/Timeline/MCAT view, **pre-fill it from Appendix A** rather than leaving placeholders.

---

## 10. The North Star — Master Admissions Overview (seed content for the top-level "Big Picture" view)

> This is the *purpose layer* — a **practical roadmap** of how to actually do this, not a corporate overview. It should live as a standalone top-level view (separate from the pillars), and its sub-sections also feed each pillar's Tips.
>
> **What this is NOT (per Andy):** no marketing-stat filler (applicant counts, acceptance-rate stats, "X people applied this year" — cut it). The north star = actionable how-to, the kind of thing in the r/premed wiki (§12), not AAMC press numbers.
>
> **Source priority (per Andy): human-made first.** Lead with (1) **community/forums** (r/premed wiki, SDN) = real applicant/adcom lived experience and practical advice — see §12 for the extracted substance, and (2) **AAMC** only for hard procedural rules (deadlines, what the systems require). **De-prioritize polished consulting blogs** (Shemmassian, ProspectiveDoctor, MedEdits, etc.) — last-resort cross-check only, never the voice of the dashboard.

### 10.1 What this actually is
Getting into med school is not a checklist of boxes — it's assembling a **holistic, coherent story** that convinces an admissions committee you'll make a good physician. Adcoms read the whole application as one narrative: grades + MCAT show you can handle the academics; experiences (clinical, volunteering, shadowing, research) show you know what medicine is and are committed to it; essays + letters + interviews show *who you are* and *why medicine*. The pieces are evaluated together, not in isolation. *(This holistic framing is the consensus across AAMC guidance and the r/premed and SDN communities alike — to be enriched with the actual r/premed wiki text Andy is pulling in.)*

### 10.2 The one strategic fact that drives timing
- **Rolling admissions.** Schools review and offer interviews/seats as applications arrive, so applying *early in the cycle* (complete and verified, ideally by June) materially raises your odds. A strong application submitted late competes for fewer remaining seats. This is *why* the whole timeline is front-loaded.

### 10.3 The three application systems
- **AMCAS** — MD (allopathic) schools. The main one for Andy.
- **AACOMAS** — DO (osteopathic) schools.
- **TMDSAS** — Texas public schools.
GPA is recalculated by each service their own way (no grade replacement on AMCAS; repeats averaged; BCPM science GPA broken out).

### 10.4 The components adcoms weigh
- **Academics:** cumulative GPA + **BCPM (science) GPA** — the science GPA is the most scrutinized number.
- **MCAT:** one standardized score; gates a lot of screening.
- **Clinical experience:** paid or volunteer, direct patient contact — proves you know what you're signing up for.
- **Volunteering / service:** especially with the underserved; shows orientation toward others.
- **Shadowing:** observing physicians; many schools want documented hours.
- **Research:** valued, increasingly so at top/research-heavy schools.
- **Leadership & extracurriculars:** depth and commitment over a long scatter of one-offs.
- **Letters of recommendation:** typically science faculty + others; some schools want a committee letter.
- **Personal statement:** the "why medicine" narrative.
- **Secondary essays:** school-specific, arrive after the primary — pre-writing common prompts is a known edge.
- **Interviews:** traditional and MMI formats; the final filter and a two-way fit check.
- **School list:** built realistically against your stats + mission fit + in-state status.

### 10.5 The master timeline (high level)
- **Years 1–3 (build phase):** finish prereqs, protect GPA, accumulate clinical/volunteer/shadowing/research hours steadily, build relationships for letters, keep a running **story bank**.
- **~12–18 months before matriculation:** take the **MCAT** once content is complete.
- **Application year — May/June:** AMCAS opens; submit the **primary early**.
- **Summer:** **secondaries** arrive in waves — turn them around fast.
- **Fall–winter:** **interviews** (rolling).
- **Winter–spring:** **decisions** (rolling, incl. waitlists).
- **Matriculate** the following fall.
*(Andy's personalized version of this is in §9 + Appendix A: MCAT spring 2029, apply 2029 cycle, matriculate Fall 2030.)*

### 10.6 The mindset themes that recur across every good guide
- **Longitudinal commitment beats last-minute box-checking** — start early, stay consistent.
- **Reflection matters as much as the activity** — log *why* an experience mattered while it's fresh (this is exactly what the Story Bank pillar is for).
- **Fit is mutual** — the school list and interviews are about matching mission, not just stats.
- **Apply early, apply complete.**

---

## 11. Human-made & community resources (forums + lived experience layer)

Andy's priority: real, human-made resources — applicants and adcoms talking, not just polished consulting copy. These are the best community sources to integrate (as a "Community" sub-section in the North Star view and/or pillar-specific resource links).

### Forums / communities
- **r/premed (Reddit)** — the main community hub: WAMC ("what are my chances") posts, cycle results, candid advice, the **wiki/FAQ** (overview of the process + common Q&A). *Note: Reddit is blocked to automated fetchers, so content must be pulled in manually by Andy — but it's the #1 human-made overview source and the original inspiration for this layer.* https://www.reddit.com/r/premed/ (and its wiki at /r/premed/wiki)
- **r/MCAT (Reddit)** — MCAT-specific Q&A, practice-question discussion, score-release threads. https://www.reddit.com/r/mcat/
- **Student Doctor Network (SDN)** — moderated nonprofit forum; **more structured and higher signal than Reddit**, with adcoms/residents/faculty participating. Key areas:
  - Pre-Medical (MD) forum: https://forums.studentdoctor.net/forums/pre-medical-md.10/
  - "What Are My Chances?" (WAMC) Medical: https://forums.studentdoctor.net/forums/what-are-my-chances-wamc-medical.418/
  - PreMed Communities hub: https://forums.studentdoctor.net/categories/premed-communities.5/
- **College Confidential — premed** — long-running free community, lighter but useful for undergrad/premed crossover questions. https://talk.collegeconfidential.com/
- **Roundup of premed forums** (MedLife Mastery) — comparison of the communities above. https://medlifemastery.com/premed/preparation/best-online-forums/

### How to use them (integration note)
- **Reddit/r/premed** = candid lived experience + the FAQ overview → feed the North Star "Community" section and per-pillar "what real applicants say" tips. (Manual paste-in by Andy since it's fetch-blocked.)
- **SDN** = higher-signal strategic Q&A + WAMC for school-list calibration → School List + MCAT + general tips.
- **Reliability caveat to bake into the UI:** community advice is anecdotal — tag forum-sourced tips visibly so they're not mistaken for official AAMC rules (same 🟦/🟨 convention Andy already uses in Appendix A).

---

## 12. r/premed wiki — extracted community source material (🟨 community-sourced)

> Pulled from the r/premed wiki (Andy supplied the text; Reddit is fetch-blocked to automation). This is the human-made "source material" Andy wanted as the backbone. **Tag all of this 🟨 in the UI** — it's community consensus, not official AAMC rule. Where it conflicts with AAMC/MSAR, AAMC wins. More sections (MCAT, ECs, essays, interviews, etc.) to be added as Andy sends them.

### 12.1 The wiki's structure = a per-pillar content map
The r/premed wiki is organized almost exactly like our pillars — each link is a dedicated page Claude Code/Andy can pull into the matching pillar's Tips section:
- **The Undergraduate Years** (`/wiki/coursework`) → Academics & GPA pillar *(extracted below)*
- **MCAT** (`/wiki/mcat`, points to r/Mcat) → MCAT pillar
- **Clinical Experience** (`/wiki/clinicaljobs`) → Clinical pillar
- **Shadowing** (`/wiki/shadowing`) → Shadowing pillar
- **Non-Clinical Volunteering** (`/wiki/volunteering`) → Volunteering pillar
- **Research** (`/wiki/research`) → Research pillar
- **Letters of Recommendation** (`/wiki/lors`) → Letters of Rec pillar
- **Creating a Medical School List** (`/wiki/schoollist`; MSAR, Choose DO) + **Caribbean schools** (`/wiki/carib`) → School List pillar
- **Applying** (`/wiki/applications`; AMCAS/AACOMAS) + **TMDSAS** (`/wiki/TMDSAS`) + **Transcripts/Coursework Entry** (`/wiki/transcripts`) → Timeline/Tasks + Academics
- **Essays** (`/wiki/essays`; personal statement, work/activities, secondaries) → Essays & Story Bank pillar
- **Additional Assessments**: AAMC PREview (`/wiki/preview`), Casper/Altus (`/wiki/casper`) → MCAT or a new "Assessments" sub-section
- **Interviews** (`/wiki/interviews`; traditional + MMI) → could be its own pillar or under Timeline
- **Choosing a school / CYMS** (`/wiki/cyms`) + **Reapplying** (`/wiki/reapp`) → School List / Timeline
- General FAQs (`/wiki/faqs`), Helpful Posts (`/wiki/helpfulposts`), COVID (`/wiki/covid`)

> Build note: each pillar should have a "Community wisdom (r/premed)" block in its Tips section, seeded from the corresponding wiki page above.

### 12.2 Academics & GPA — extracted wiki substance (🟨)
**Undergrad choice / major / minor**
- Where you go for undergrad doesn't matter much; **protecting GPA matters most**. Prestige mainly buys better resources (research, advising). Pick the school best for your wellbeing, finances, and grades.
- **Major doesn't matter to adcoms** — they care that you took the prereqs and did well. Pick something that interests you, ideally overlaps prereqs, at a school cheap enough to minimize debt.
- **Minor** only if you're genuinely interested; it doesn't help admissions by itself.
- Community college coursework is generally accepted (esp. if you finish at a 4-yr), but don't make it look like you fled hard courses to an easier setting.

**How GPA is calculated (critical, and matches Andy's Appendix A flags)**
- Your application GPA is **recalculated by the service**, not your school's number.
- **AMCAS**: no grade replacement — if your school forgives/replaces a grade, you **still report the original** grade + credits. Report **every course ever taken** at any college (incl. **dual-enrollment in high school**), credit earned or not.
- **AACOMAS**: ignores school forgiveness/replacement; **all repeated-course grades count**. Report all coursework incl. dual enrollment under the college where taken.
- **TMDSAS**: uses **flat grades** (ignores +/-); nothing can be expunged; dual-enrollment entered exactly as on the community college transcript.
- Community-built **AMCAS/AACOMAS GPA calculator** (u/masterintraining Google Sheet) is widely used — useful reference when building our own calculator.

**GPA-repair thresholds (community rule of thumb, 🟨)**
- <3.0: needs 1–2+ years of repair (post-bacc/SMP) before competitive — long, expensive.
- 3.0–3.2: post-bacc likely unless strong elsewhere (e.g., high MCAT).
- 3.2–3.4: maybe post-bacc; some DO / low-tier MD depending on MCAT.
- 3.4–3.7: usually okay; DO + mid/low-tier MD depending on MCAT.
- 3.7: depends on MCAT.
- Reinvention reference: "Goro's advice for pre-meds who need reinvention" (SDN, written by a DO adcom).

**Degrees**
- Bachelor's required by **matriculation** (very few exceptions).
- **SMPs** (~1 yr, ~$40k) can boost a weak record if you do well (~3.6+), but doing poorly is fatal. Traditional master's **can't offset** a weak undergrad GPA (grad GPA is separate). PhD is valued.

**Prerequisite coursework (community consensus list, 🟨 — always verify per-school on MSAR/Choose DO)**
- *Hard requirements:* 1 yr intro bio + lab; 1 yr gen chem + lab; 1 yr orgo + lab **OR** 1 sem orgo + 1 sem biochem; 1 yr physics + lab (algebra-based OK); 1 yr English; 1 yr college math (calc, or calc + stats).
- *Highly recommended:* biochem, statistics, 1 sem psychology, 1 sem sociology.
- *Mildly recommended:* 2 sem upper-div bio (genetics, physiology, cell, anatomy, micro), plus assorted humanities/social science.
- Some schools use **competency-based** prereqs (e.g., a "behavioral sciences" competency met by various courses) rather than strict course lists.
- **1 year = 2 semesters = 3 quarters.**

**Grades in prereqs**
- Aim for **C or higher in every prereq**; a **C- is not accepted** by many schools (USUHS, ECU, MSU CHM, MWU AZCOM, KCU COM all state this). Retake if you get a C-.
- **AP credit**: policies vary; if used, it **must appear on your university transcript** (an AP score report alone won't do). Check MSAR.
- **Pass/Fail**: as a rule, **don't take prereqs P/F** — keep the letter grade to avoid school-by-school acceptance headaches.

**Coursework timeline (traditional, no gap year — 🟨)**
- Freshman: intro bio + gen chem (both w/ lab).
- Sophomore: orgo + lab.
- Junior: physics + lab, + 1 sem biochem.
- **Take the MCAT before end of May of/after junior year; apply the summer before senior year** (AMCAS opens ~early May).
- Squeeze in math + English depending on incoming credit.
- Prereqs must be done by **matriculation, not application** — finishing some during the app cycle is fine (Harvard/Yale/UW confirm), just avoid a rushed retake situation.

### 12.3 Cross-pillar community gems (🟨 — seed these into the relevant pillars)
- **Start a journal/spreadsheet of hours + influential experiences NOW**, while fresh — so essays/Work & Activities write themselves later. *(This is literally the Story Bank pillar — quote this as its rationale.)*
- Rough EC benchmarks tossed around by the community: ~**150–200 hrs** clinical + ~150–200 hrs non-clinical volunteering; ~**1.5 years** research; **50–100 shadowing hours**. *(Anecdotal targets, not official — good default goal values for progress bars, clearly labeled as community estimates.)*
- **Research field doesn't matter**; no research limits chances mainly at top/research-heavy schools; a research-mentor LOR is valued.
- **Average matriculant age is ~24–25** — gap years are normal; "am I too late?" anxiety is usually unfounded.
- **Bilingual** ability mostly helps when *used* in an EC/clinical setting, not as a standalone line.
- Study-habit tip: **Anki** for long-term retention (classes, MCAT, beyond).

### 12.4 Programs / pathways (🟨 — seed into North Star or a "Pathways" note)
- **MD vs DO:** both are full physicians with identical practice rights; DO curricula add OMM/OMT. DO matriculants average lower stats (2024: ~3.60 cGPA / 3.52 sGPA / 503 MCAT) vs MD (~3.77 cGPA / 3.71 sGPA / 512 MCAT). MDs match competitive specialties (neurosurg, plastics) more easily.
- **Apply DO if** you'd genuinely attend a DO school, and especially if your stats sit closer to DO averages.
- **Dual degrees exist:** MD/PhD (for physician-scientists, ~80% research / 20% clinical; MSTP = NIH-funded), MD/MPH, MD/MBA, MD/JD. Publications matter more for MD/PhD.

### 12.5 MCAT (🟨 — MCAT pillar)
- Standardized exam, scored **472–528** (500 = median). Four sections: Chem/Phys, CARS, Bio/Biochem, Psych/Soc/Bio of behavior.
- **When to take:** latest is end of May / early June of your application year, but most take it **Jan–March** of the application year (or earlier). For traditional applicants = junior year. *(Andy's plan: spring 2029.)*
- You can submit AMCAS **without** a score, but your app isn't "complete" / reviewed at a school until the score arrives.
- **Throwaway method:** if no score by AMCAS open, submit to one school you won't attend to start the ~5–6 week verification clock; add real schools once you score well; withdraw if you bomb. (Not needed for AACOMAS — it verifies in <1 week.)
- Score validity: most schools accept an MCAT within **~3 years** of matriculation.
- Defer deep MCAT content/study-plan material to **r/MCAT** and its wiki (the premed wiki points there).

### 12.6 Clinical experience (🟨 — Clinical pillar)
- **Why:** proves you know what patient care is and can be compassionate; you need enough to write/speak about it meaningfully.
- **Benchmark:** aim **150–200 clinical hours** baseline (per adcom members). Non-trads often have thousands — don't be discouraged; just get adequate exposure.
- **Pick a role you actually like** — a bored EMT gets less out of it than a passionate phlebotomist.
- **Common paid/volunteer clinical roles** (great content for the pillar's resource/tips, and as a "role type" dropdown):
  - **Scribe** — high exposure, you see everything the physician does; learn note-writing; low pay, no cert needed.
  - **Medical Assistant (MA)** — varies from hands-on (shots, blood draws) to paperwork; learn billing/insurance side; usually full-time.
  - **EMT-B** — arguably best hands-on care for ~1 semester of cert ($800–several thousand); lower availability/flexibility; you'll see rough stuff.
  - **EMT on ambulance / Collegiate EMS (QRS/BLS/ALS)** — total patient care w/ a partner; great assessment skills.
  - **ED Technician** — see many parts of healthcare in one place; lots of physical patient contact; physically demanding.
  - **CNA** — best for bedside manner; lots of personal care; humbling "dirty work"; easier cert.
  - **Other techs** (phlebotomy, pharmacy, psych, EKG, lab) — narrow but deep skill in one area.

### 12.7 Shadowing (🟨 — Shadowing pillar)
- **Why:** proves you've seen what physicians actually do. Practically required for MD/DO.
- **Benchmark:** ~**50 hours across multiple specialties**; include primary care (family/IM) even if you have a favorite specialty. Hundreds of hours is unnecessary (and looks like time you should've spent helping more actively).
- **You just observe** — be respectful, don't get in the way, ask questions when appropriate.
- **How to find:** take initiative — call/email physician offices, ask local hospitals, cold-email, ask family/friends, or shadow your own doctors. Persistence beats rejection.
- **Virtual shadowing** (teleshadowing.com, HEAL/clinicalshadowing.com) is a fallback, but get some **in-person** before applying.

### 12.8 Non-clinical volunteering (🟨 — Volunteering pillar)
- **Why:** shows altruism, awareness of underserved populations and social determinants of health.
- **Benchmark:** **≥150 hours**, ideally concentrated in **1–2 experiences** showing commitment (not 10+ one-offs). "Service schools" (Rush, Loyola, Georgetown, GW, BU, SLU, Tulane, RFU, Creighton) expect 500+.
- **Adcom wisdom:** service to those **less fortunate than you**; get off campus and out of your comfort zone (Goro). Aim ~**2 hrs/month sustained** with a cause you'd keep doing — stopping the instant you hit an hours target signals box-checking (LizzyM).
- **Where to find:** VolunteerMatch, r/volunteer, or orgs like AmeriCorps, Big Brothers Big Sisters, Crisis Text Line, Feeding America, Habitat, Humane Society, Meals on Wheels, Ronald McDonald House, Special Olympics; also your premed advising office.

### 12.9 Research (🟨 — Research pillar)
- **Why/how much:** ~hard requirement at top schools, soft elsewhere (>90% of first-years at top schools have it). Slightly over half of MD matriculants did a lab research apprenticeship. Field **doesn't matter** — bio, chem, psych, history, econ, computational, clinical all count; must involve testing a hypothesis to add knowledge.
- **Lab class work ≠ research.** Curriculum lab reports don't count; independent project work does.
- **Publications help but aren't required** — prioritize **continuity and hours**; posters/abstracts/oral presentations all count. Pubs matter more for MD/PhD. ("NO PUBS, WHAT DO?!")
- **How to get a position:** email lab managers/PIs your CV expressing interest; persistence wins ("eventually someone will want your free labor"). Resources: AAMC summer programs, SDN activity finder, ResearchConnect.

### 12.10 Letters of recommendation (🟨 — Letters of Rec pillar)
- **Committee letter:** if your school has a premed committee, **use it** — many schools prefer/require it; don't circumvent it.
- **No committee → individual letters:** minimum **2 science professors + 1 non-science professor**; add a **PI letter** if you did research / MD-PhD; clinical/volunteer supervisors are good extras.
- **Physician letter:** MD schools mostly don't care; ~half of **DO** schools want an MD/DO letter. A shadowing-only physician usually can't write a strong one.
- **How to ask:** in person, "would you feel comfortable writing me a **strong** letter?" Give them your PS, CV/résumé, transcript, and the AAMC letter-writer guidelines. Ask **months ahead**; set a due date a few weeks before you submit.
- **Timing:** can't request in AMCAS/AACOMAS until the cycle opens (May); letters are **not** required to submit/verify — can be added during verification/secondaries.
- **Storage:** **Interfolio** works across all three services.

### 12.11 School list (🟨 — School List pillar)
- **Core tools (build the pillar around these):**
  - **MSAR** (AAMC, ~$28/yr) — per-MD-school GPA/MCAT distributions, in/out-of-state data, coursework/AP/PF policies, interviews/matriculants. Widely called worth it.
  - **Choose DO Explorer** (AACOM, free) — DO equivalent; filter by stats, LOR reqs, interview format, etc.
  - **Admit (admit.org)** — free MD+DO stats + a **school-list builder** (made by r/premed's u/Happiest_Rabbit).
  - **LizzyM score** and **WedgeDawg's WARS** — quick GPA+MCAT composites (usefulness debated).
- **Calibration benchmarks (decision-relevant, not fluff):** MD matriculant ≈ 3.77 cGPA / 511–512 MCAT; DO ≈ 3.6 cGPA / 503 MCAT. Use AAMC **Table A-23** (MD) and the DO grid to gauge competitiveness for a given GPA/MCAT.
- **Key list-building rules (from Arnold's guide):** in-state/OOS friendliness matters enormously at public schools — many state schools are OOS-hostile (don't waste money applying); TMDSAS (Texas) schools are ~90% in-state but dirt-cheap; mission fit matters (e.g., service-oriented "Jesuit" schools value non-clinical volunteering; research powerhouses want research). **Cast a wide net, apply early, apply realistically.**
- *(The wiki's full alphabetical per-school breakdown is mostly 2017 data — skip importing it; rely on MSAR/Admit live data instead. Flag in UI that per-school stats must be checked live.)*

### 12.12 The application cycle (🟨 — Timeline/Tasks pillar)
- **Three services:** AMCAS (MD), AACOMAS (DO), TMDSAS (Texas).
- **AMCAS timeline (2026-27 example, shifts ~same each year):** opens for data entry **early May** → submit for verification **late May** → verified apps **transmitted to schools late June**. Verification can take **4–6 weeks** at peak; **rolling admissions favors early submission**.
- **Submit transcripts ASAP** — transcript issues are the #1 cause of delays. Time them around whether current-term grades help or hurt your GPA.
- **You must report EVERY college course ever** (incl. dual-enrollment), send a transcript from every institution; National Student Clearinghouse can catch omissions — don't hide anything.
- **Coursework classification:** by **primary content**, not department (lets you reclassify, e.g., engineers moving courses into BCPM — see the wiki's engineer guide).
- **Work & Activities:** up to 15 activities; mark up to **3 "Most Meaningful"** (extra characters). *(This is the Story Bank payoff.)*
- **Institutional Actions:** disclose any academic/conduct IA unless expunged; report new ones within 10 business days.
- **Other Impactful Experiences (OIE):** optional 1325-char essay on challenges/background (family, finances, community, education) — not required.
- **AACOMAS / TMDSAS** verify much faster (days–10 business days); TMDSAS opens May 1, **submits May 15, deadline Oct 1**, has its own **Match** (rank schools by Jan 30, results Feb 13), only sends transcripts when accepted.
- **Cost is high** (thousands across the cycle) — check **AAMC FAP** (free 20 AMCAS apps + MSAR + MCAT prep) and AACOMAS fee waivers before submitting (benefits aren't retroactive).

### 12.13 Additional assessments (🟨 — MCAT pillar sub-section or its own)
- **AAMC PREview** (situational judgment, rate behaviors 1–4 across 8 pro competencies; scored 1–9 + percentile): required/recommended at a growing list of schools; $105 (free w/ FAP); take it before/with secondaries (first 3–4 windows to have score by end of July).
- **Casper / Altus** (situational judgment; 11 scenarios, video + typed; ~65–85 min; $85 incl. 7 schools): screens non-cognitive traits; scored in **quartiles**; valid one cycle only (retake if reapplying). Prep with MMI practice, PrepMatch, the official practice test; framework: PPRDJ (Problem, Perspective, Responsibility, Decide, Justify); never assume, always be understanding.

### 12.14 Interviews (🟨 — Interviews / Timeline pillar)
- **Formats:** traditional (1-on-1) and **MMI** (multiple short stations); many schools went virtual post-COVID (check MSAR).
- **Timing:** IIs trickle out late summer; interviews ~Aug–Jan/Feb; **acceptances start Oct 15** (AMCAS traffic) and roll out after.
- **How adcoms weigh things:** pre-interview, **GPA + MCAT are king**; post-interview, the **interview evaluation** takes precedence and ECs/LORs gain weight. Saying: "GPA/MCAT determine where you can apply; everything else + stats gets you in."
- **Prep:** practice MMI/ethics scenarios, prepare stories, and bring questions for interviewers; resources include a 500-question Google Doc, UW "Ethics in Medicine," SDN interview feedback database (per-school).

### 12.15 Choosing a school / traffic rules / CYMS (🟨 — School List / Timeline)
- **AMCAS traffic rules:** hold ≤**3** MD acceptances by **April 15**, ≤**1** by **April 30**; withdraw the rest (be gracious — don't burn bridges).
- **CYMS tool:** **Plan to Enroll** (non-binding, anonymous before Apr 30, opens mid-Feb) and **Commit to Enroll** (binding, opens Apr 30 — must withdraw everywhere else). Each school sets its own CTE deadline.
- **AACOMAS:** narrow to **1 DO acceptance by May 1**; DO deposits ($1–2k, often nonrefundable) with shortening windows as the cycle progresses; no CYMS equivalent.
- **Choosing among offers:** weigh location, cost, fit, curriculum, match outcomes; prestige does affect competitive-specialty matching.

### 12.16 Reapplication (🟨 — could surface as a "if it doesn't work out" note)
- >60% of applicants are rejected in a given cycle — reapplying is common. First step: **figure out WHY** (ask schools that rejected you).
- **Common rejection reasons:** low/unbalanced GPA+MCAT (rough guide: ~3.5 GPA floor with 3.7+ strong; ~500 MCAT floor, <505 weak for MD); too little clinical experience; thin ECs; too narrow a school list; weak/generic essays (a reusable "why us" = garbage); poor interview skills. Reapplicants must show **demonstrable growth**, not resubmit the same app.

### 12.17 Curated "Helpful Posts" link library (🟨 — distribute into each pillar's Tips)
Andy asked these not be ignored. They're community-written deep-dives; pull the matching ones into each pillar. (Links are Reddit/SDN; open directly — fetch-blocked here.)
- **General/start-here:** "How to premed??" megathread; "How NOT to get into medical school"; "Unsolicited App Advice from MS-4 on ADCOM"; "I am an adcom at a top 10 school, AMA"; the **Arnold series** (ECs, PS, timeline, activities, secondaries, school list, interviewing, match lists).
- **ECs/Research:** "Stay Focused (Advice on Extracurriculars)"; "How to land a research position (no experience)"; "Undergraduate Research: Do your due diligence"; "NO PUBS, WHAT DO?!"; "Shadowing 101"; "MS4 w/ 10 yrs EMS experience."
- **Personal statement:** "15 Tips for Writing a Strong Personal Statement"; holythesea's "How To Write Stories"; Arnold's PS thoughts.
- **Secondaries:** Med School Secondary Essay Bank (2018–2023); "Pre-Writing Secondaries in 4 Steps"; "222 secondary prompts categorized (n=54 schools)"; "Writing 'Why Us' Secondaries."
- **Casper:** "Approach to CASPer"; "What is CASPER" guide; "scored top 95%, AMA."
- **Interviews:** "500 Practice Interview Question Google Doc"; "My Guide to MMI Prep"; "Old but GOLD interview advice (SDN)"; Arnold's interview AMA + questions-to-ask.
- **School list:** "Admit Standardized Score & School List Builder"; "Medical School Tiers & How to Create a School List"; "The Osteopathic School Guide 2025."
- **Caribbean (warnings):** multiple "Don't go to the Caribbean" posts — flag as cautionary.
- **AMCAS:** "Before your AMCAS submission! (checklist)"; "How AMCAS verification and submission works"; "IF Y'ALL ASK WHEN 'LATE' IS ONE MORE TIME."

---

## 13. Andy's feature picks — from existing-template walkthrough (MUST-INTEGRATE)

These are features Andy explicitly wants, pulled from reviewing real premed Notion templates. Treat this as a requirements list for the build. (Living section — Andy is still adding.)

### 13.1 From "Pre-Med Life Planner: Deluxe"
- **Task Bar** — a strip at the top of the home page listing all current/ongoing tasks so nothing is missed.
- **Grade Tracker + automatic GPA calculator** — enter each course (name, grade, credit #, subject type) → cumulative + science GPA auto-display above. Also track most recent **MCAT score** here.
- **"Resume" big-ticket tracker** — a database for the high-stakes items, each with progress + status updates, a **data log**, and **sub-projects** within each: Shadowing, Clinical Experience, Research, Volunteering, Teaching & Leadership, Personal, Activities & Experiences, Capstone Project.
- **Ideas sticky note** — a cute quick-capture note for stray thoughts/ideas.
- **Timeline** — a calendar database for the EC + application-completion outline, with a yearlong calendar visual and an item log.
- **Quarterly Goals** — a dedicated space to write quarterly goals (with the note that writing/reviewing goals boosts follow-through — surface that as encouragement).

### 13.2 From "Pre-Med Arrow" (UNC-aligned — high value for Andy)
- **Grade book + degree planner aligned to UNC.** The grade book computes GPA by **either UNC's standard scale or each class's own scale**, and breaks out **science GPA**. Flexible "big grade book you interpret your way."
- **Degree planner = a built-in Tar Heel Tracker** — tracks **graduation requirements AND major requirements** together. (Pre-fill from Andy's Appendix A plan.)
- **Work & Activities with Most Meaningful grouped per activity** — each activity is its own clickable tab/page; click in to write its description/most-meaningful reflection. *(We have this concept — make sure it's per-activity click-in.)*
- **Casper section** — Andy is unsure about it; include as optional (it's a real SJT — see §12.13).
- **Essays module:** secondary-prompts tracker/template; a **brain dump** area; and a **personal statement** workspace with an **analysis checklist**, a **drafts area**, **editing resources**, and other resources.
- **Letters of Rec tracker** (✓ already specced).
- **Interview prep master** — potential interview questions + your responses, plus helpful resources/videos.
- **Misc academic study-resources tab** — catch-all for general study resources (not pillar-specific; academics-flavored).

### 13.3 MCAT tab — full structure Andy wants (detailed)
The MCAT pillar is a **master tab** = a database of free/online study resources + helpful links (r/MCAT, MCAT/premed Discord, AAMC prep page). Sub-tabs:
- **Content Review**
  - *Programs:* MedLife Mastery, MCAT Self Prep, Khan Academy MCAT Prep, Khan Academy individual video notes, Princeton Review, Khan Academy Crash Course, Ninja Nerd.
  - *Books + Docs + Study Guides:* 300-page Khan Academy Psych/Soc, **AnKing and Miledown** ultimate study guides, equation sheet, lab-techniques sheet ("cat lab techniques"), molecules list, "the lazy OCD" psych/soc, JackWestin AAMC outline, Kaplan quick sheets, Kaplan books PDF (Andy can link), JoChem, Doodles on the Membrane. *(Exact titles per Andy's words — verify/normalize names against r/MCAT later.)*
  - *Anki decks:* Miledown, JackSparrow, Aiden, MrPaintcow, Ortho528, etc. (pull more from r/MCAT). *(Andy's spellings; normalize later.)*
  - *Misc:* browser extensions, games, quizzes, recommended apps.
- **Practice Problems + Exams**
  - *Practice exams:* MedLife Mastery, MCAT Prep, UWorld, AAMC (+ "double AAMC"), Inspiro, Princeton Review, JackWestin, ExamKrackers, MedSchoolCoach, Magoosh, Kaplan.
  - *Questions/Passages tracker:* spreadsheet-style log of problems missed + why (error tracking).
  - *Tips & Tricks:* test-taking/section strategies.
- **Schedule**
  - Daily, phase-based reminder schedule (Content Review → Questions), shown as a graphic/organizer.
  - An actual spreadsheet schedule — **Andy uploaded `MCAT Prep Schedule (Public).xlsx`** to integrate or adapt into this sub-tab.
- **Tracker templates** — reusable score/progress tracker templates.

### 13.4 Cross-cutting feature requests
- **Kanban board** (To-Do / In-Progress / Done, drag-and-drop) — include as a reusable component (Timeline/Tasks home, and optionally per-pillar).
- **Detailed tables everywhere, not just progress bars** — every tracker must be a TABLE capturing at minimum: **who/where, date done, # hours, description** — with the progress bar layered on top. (Bars summarize; tables hold the detail.)
- **Google Drive embedding for Research** (and similar doc-heavy areas) — embed/link a Drive location where Andy dumps papers, proposals, slide decks, etc., directly in the pillar.
- **Story Bank reflection-prompt seed set** (for Essays & Story Bank) — pre-load these guiding prompts for entries to write about:
  - Reasons you want to be a physician
  - Something you're very passionate about
  - A difficult experience that inspired self-growth
  - A notable leadership experience
  - A notable research experience
  - Any notable clinical experiences
  - A time you asked for help
  - A time you were humbled
  - A time you witnessed discrimination
  - A time you interacted with someone different than you
  - A time you advocated for someone different than you
  - A time you failed

### 13.5 Assignment Tracker + Academic-tab extras (Academics pillar — Andy used this all senior year, wants it carried over)
- **Assignment Tracker** with a built-in **notification/alert system on the home page**: auto-surfaces anything important due in the next few days, and flags an **important exam coming up** (~1 week out).
- **Tracker table columns:**
  - Course
  - Assignment description
  - **Type** (click → preset options)
  - Deadline
  - **Days left** (auto countdown)
  - **Progress** (Not started / Working on / Finished)
  - **Auto-removal:** marking an item **Finished** removes it from the active table (kicks it out).
  - Notes
  - Attached files
- **Calendar view synced to the table** (Notion-style): each assignment's **deadline appears on a calendar** (e.g., due May 7 → shows on May 7). The calendar isn't synced to any external service — it's populated only by items linked in the table.
- **GoodNotes link/database** — Andy keeps lectures/notes in GoodNotes; provide a way to link/embed it in the academic tab (mechanism TBD — likely a link-out or embed).
- **Claude Cowork link / syllabi note section** — Andy imports each class's syllabi, materials, and lectures into Cowork; add a **notes section** in the academic tab to link/organize those per course.
- **Priming-questions box** — an area to type private questions about study techniques (study-help scratchpad).
- **Ultimate Academic Guide** — a study-skills guide lives in the academic tab's resources (full text in **Appendix B**). Andy will expand it over time from his own experience + subreddit digging.

### 13.6 From "PreMedOS" (closest existing thing to our vision — steal heavily)
- **Advanced Split-GPA Calculator** — auto-separates grades into **BCPM (Science)** vs **AO (All Other)**, visualizes trends with **dynamic progress rings**. *(Reinforces our GPA engine + adds the progress-ring visual.)*
- **Clinical Hours Engine** (toward a 1,000-hour goal):
  - **Log Hours & Stories** — a Journal to capture meaningful patient interactions immediately (feeds the Personal Statement / Story Bank later).
  - **Visual Gap Analysis** — live bar chart of Clinical / Shadowing / Research / Volunteering hours to ensure a balanced applicant.
  - **Verification Ready** — store supervisor contact info per role so application season isn't a scramble.
- **The Vault** (secure digital filing cabinet — pairs perfectly with Google Drive embedding):
  - **Syllabus Library** — save every syllabus (schools may ask years later to verify prereqs).
  - **Transcript Archive** — keep official records ready (e.g., for summer programs).
  - **CV Generator** — auto-updating table of every role held.
- **Automated Academic Workflow:**
  - **Smart Syllabus** — assignments added to a class auto-appear on the dashboard's "Due This Week."
  - **Grade Weights / What-If** — input syllabus weights (e.g., "Final = 30%") to run what-if grade scenarios. *(Pairs with our GPA what-if simulator.)*
- Also ships: mobile-optimized quick-capture views, an **integrated AAMC competency map**, step-by-step user guide + video walkthrough.

### 13.7 From "Acamode" (academic-system structure — for the Academics pillar's depth)
A four-mode academic OS (mind-map structure from Andy's screenshots; "powered by DELS mode"):
- **Dashboard Mode** — overview page with colored navigation tiles; shows current classes, today's reviews, upcoming exams/assignments; a **Master Calendar** for all exams, assignments, and study reviews.
- **Lecture Mode** — table with views (All Courses, In-Progress, Courses by Weekday). Click a course → **course profile** with a session table, exams/assignments, and review items. *Course properties:* Course Name, Semesters, Sessions, Status, Class Schedule, Professor, Code, URL, Final Grade. **Sessions list** properties: Session Name, Course Name, Session Type, Recording URL.
- **Study Mode** — **Spaced Repetition table** (views: Today, Week, Month, All Active Topics; properties: Title, Course Name, Sessions, Start Date, Intervals, Next Review, Review Status, Semester) + **Pomodoro timer** + **stopwatch**; access reviews/related courses/sessions.
- **Exam & Assignment Mode** — table views (Weekly, Monthly, Next 6 Months, Next Year) + an **Exam & Assignment History** table; *properties:* Title, Type, Deadline, Days Left, Status, Priority, Topics Covered, Grade.
- **Relations / data model** — independent databases (Sessions, Courses) + a master database (Study, Exam & Assignment modes); relations: Sessions↔Courses, Sessions↔Master, Courses↔Master. *(Good reference for how to wire our pillars' data together.)*

### 13.8 MD Application Organizer — timeline, checklist, secondaries, sprints (Timeline/Tasks + School List pillars)
- **Recommended MD Timeline** (assumes MCAT already taken; if not, take it the Spring before submission) — seed the Timeline pillar with this:
  - **Feb–Mar:** start researching schools; secure LOR writers; start the personal statement.
  - **Apr:** start activities descriptions; get personal-statement feedback.
  - **May:** ~May 1 AMCAS opens; ~May 30 submission begins (submit ASAP). Send transcript to AMCAS ASAP; add recommenders + send upload instructions; enter demographics + grades; finalize PS + activities; take CASPer/PREview if required; **submit!**
  - **Jun:** pre-write secondary essays.
  - **Jul–Aug:** submit secondaries.
  - **Aug–Mar:** interview season; send update letters to programs as needed.
- **Application checklist** (checkbox items): Secure LOR writers · Finalize school list · Send transcript · Write personal statement · Write activities descriptions · Submit AMCAS · Take CASPer/PREview · Submit secondaries.
- **Secondary Timeline** + **Secondary questions / potential interview questions** bank (overlaps our Essays + Interview prep — consolidate).
- **MD Sprints** — Andy unsure what this is (to clarify) — plus a **Sprint Board** (kanban-style). *(Likely a focused work-sprint board; align with the kanban component in §13.4.)*

### 13.9 Resume/CV builder + Google Docs embedding (Profile pillar)
- **Resume / CV builder** — a dedicated Profile section that maintains Andy's CV. Two modes: (a) an **auto-updating table** that pulls every logged role/activity into a CV (à la PreMedOS "CV Generator" + Deluxe "Resume"), and (b) an **embedded, editable Google Doc** resume (Andy already keeps his resume in Google Docs and wants to edit it in place).
- **General Google Docs embedding (app-wide feature)** — ability to embed any Google Doc directly in the dashboard and edit it inline, not just link out. Use cases across pillars: resume (Profile), personal-statement/secondary drafts (Essays), course/syllabus notes (Academics). Pairs with the Google Drive embedding already specced (Drive = files/storage; Docs embed = live editable documents).

---

## 14. Visual style & UI direction (from Andy's reference screenshots)

Andy's chosen reference look: **MedCoach** (clean grouped sidebar + card-based content) and **The PreMed App** (home widgets). Build to this feel — clean and structured, *not* cluttered, with density living *inside* each pillar.

### 14.1 Overall aesthetic
- Clean, calm, **card-based** layout with generous whitespace and rounded corners; minimal borders, soft shadows.
- **Left sidebar navigation grouped into labeled sections** (MedCoach-style). Its grouping maps onto our pillars, e.g.: **Foundation** (Academics/GPA, MCAT, Transcripts, Letters of Rec) · **Your Story** (Story Bank / Life Story) · **Primary Application** (Activities, Personal Statement) · **Schools** (School List, Secondaries) · **Profile** (Resume/CV) · **Practice & Beyond** (Casper/PREview, Interview Prep, Update Letters).
- One calm **single accent color** used sparingly (MedCoach uses green → we use Carolina blue).
- **Mobile-optimized** too — The PreMed App shows a clean phone layout with bottom nav; the dashboard should be responsive.

### 14.2 Subtle UNC theme (confirmed with Andy)
- **Carolina blue** (~#4B9CD3 / lighter #7BAFD4) as the single accent — buttons, active nav, progress fills, highlights — over a white/very-light-gray base with dark slate text. Keep it **subtle and casual**, not a heavy UNC paint job.
- The **Tar Heel ram mascot** ties in naturally on the home screen (daily tip).

### 14.3 Home screen widgets (from The PreMed App + MedCoach home)
- Personalized greeting ("Good evening, Andy") + **"Jump back in"** quick links to recently used pillars.
- **Today's Quote** banner (pairs with / can sit alongside the mascot daily tip).
- **Progress bar by category** — a single multi-segment bar showing GPA / MCAT / Shadowing / Volunteering / Activities (color-coded), plus the progress rings from PreMedOS.
- **MCAT Question of the Day** card.
- **Today's Focus Targets** — a small editable to-do list with an "+ Add" and a total focus-time readout.
- **Application timeline card** — e.g., "AMCAS 2026 Timeline" listing key dates (AMCAS Opens, First Submission Day, First Transmission) with live status/countdown (the "earlier = stronger in rolling admissions" note).
- **Recent Activity** feed (what you last edited, timestamped).

> Build note: emulate MedCoach's *structure/cleanliness* and The PreMed App's *home widgets*, but make it visually distinct and Andy's own (UNC-subtle palette, the ram mascot, his pillar set). Don't clone either.

### 14.4 Reference spreadsheets (RECEIVED — inspiration only, do NOT copy; Andy notes they're not well-organized)
Andy uploaded these as reference. Use for structural ideas only:
- **AMCAS/AACOMAS Undergrad GPA Calculator.xlsx** — Grades sheet columns: School, Academic Calendar, Class, Credits, Grade, **AMCAS BCPM?**, **AACOMAS BCP?**, Year Level, Weighted Grade, cum Credits, **QP (quality points)**, cum QP, AMCAS Science Credits. *(Validates our GPA engine: per-course BCPM flag + quality-points math + cumulative + science.)*
- **EC Section AMCAS.xlsx** — per-experience: Experience Type, Description, character count. *(AMCAS Work & Activities format with live char counting — add char counters to our W&A entries.)*
- **Medical School Cycle Tracker.xlsx** — columns: Admissions Info, Secondaries, Interviews, Update Letters, Results. *(School List / cycle tracking model.)*
- **PreHealth-Activities-Journal.xlsx** — a master sheet + **one tab per activity** (e.g., "Logistics Director," "Shadowing Neurology") each with Date / Hours / Important Events. *(The per-activity journal model = our Story Bank + hour logs.)*
- **MCAT Prep Schedule (Public).xlsx** — tabs by resource tier (Free / AAMC OO Bundle / AAMC FL). *(Schedule layout for the MCAT pillar.)*
- **Premed-Shadowing-Guide.pdf** — reference guide for the Shadowing pillar's tips.

> Reminder: these are messy references — extract structure/ideas, build clean from the spec, don't replicate their layout.

---

## 15. Design principles & critique-driven direction (HIGHEST PRIORITY — overrides generic content)

Andy reviewed AI-built prototypes (Cursor/ChatGPT) and found them poorly made. This section is the corrective design brief. **When this conflicts with the literal content lists in §12–§14, this wins.** The content lists say WHAT belongs; this says HOW it must feel and function.

### 15.1 Guiding philosophy
- **Not a Notion clone, not a copy of existing templates.** The prototypes failed by being flat walls of uniform boxes and copy-pasted lists. Build a genuinely **interactive interface**: deliberate, nested navigation — tabs/buttons that open into more pages and subtabs, not one scattered page of rectangles.
- **Functionality over decoration. No wasted space.** Every element must either (a) be **interactive** (clickable → does something / navigates somewhere) or (b) **display genuinely useful at-a-glance info**. No pointless clickable squares; no static text box hogging half a column.
- **Content is a guide, not gospel.** The feature/content lists describe what should exist — use imagination to realize them *practically*. When Andy names a mechanism literally (e.g., "GoodNotes link," "scratchpad"), interpret the intent and find the best real implementation; don't implement it literally if there's a smarter way.
- **Unfilled is fine; missing structure is not.** It's OK if data/content is empty at first, but the full outline, navigation, and functionality must be present.
- **Use proper modern UI patterns** (see §15.6): comboboxes/autocomplete, debounced + fuzzy search, drag-and-drop upload, toggles/accordions for dense content, modals, nested tabs, keyboard navigation, and explicit loading / empty / error states. Apply the Frontend Design + UI/UX Pro Max skills — with restraint.

### 15.2 Recommended tech stack (UPGRADE from "single HTML file")
The level of interactivity Andy wants (comboboxes, fuzzy search, drag-drop, nested routing, polished components) is beyond a single vanilla-HTML file. Build instead as a **React + TypeScript app (Vite), using shadcn/ui + Tailwind** for the component system, with client-side routing for the nested tabs/pages. Still a personal browser app; still **localStorage/IndexedDB** as primary store with the **Google Drive backup** stack from §6 (hosted so OAuth works). Component-based + typed = maintainable and extensible.

### 15.3 What NOT to do (explicit anti-patterns from the prototypes)
- ❌ No "this is your private command center…" explainer blurbs describing each section. Make it self-evident and straightforward.
- ❌ No scattered, uniform, non-functional boxes; no icons that don't match their labels.
- ❌ No giant unreadable flat tables (grad requirements, resource lists). Compact + digestible (toggles/accordions/grouping/progress).
- ❌ No plain inline text boxes for essay writing; no URL-textbox where an embed belongs; no permanent "tip" rectangles.
- ❌ No copy-paste of existing templates.

### 15.4 Home / front page (redesign)
- Remove explainer junk. Greeting ("Good evening, Andy") is fine **only if it cross-references Andy's actual freshman-year roadmap** (Appendix A / §9) and shows what he genuinely needs to do now — not generic filler.
- **Alerts bar pinned at the very top** — pertinent items: academics due soon, upcoming meetings/events. Should **link to / sync with Google Calendar** (and/or Notion calendar) to surface real events and reminders.
- **Task bar:** keep it clickable (good), but add **checkboxes** and better structure.
- Every home element must earn its place with real function — no decorative boxes.

### 15.5 The mascot (flagship — redesign properly)
- **Not an emoji. No corny title** ("Daily Tip from the Tar Heel Ram" = cut it).
- A **custom, cute cartoon ram character.** Art direction: **cartoony, Japanese / Studio-Ghibli-adjacent** (warm, hand-drawn, human feel — *not* a cold/AI black-and-white look), with a cute background. Andy will supply reference pics; art to be created from those (image model), not an emoji or geometric SVG.
- The avatar **moves to a different spot on each tab** (top, corner, bottom — varies) and delivers a **random tip/note via a speech bubble** — decorative + human, refreshed ~daily. This **replaces** static tip rectangles entirely (tips do NOT live in permanent boxes).
- Tips come from a **large, Andy-editable text pool**; the avatar picks at random. The mascot is the home for tips/notes/reminders that would otherwise clutter the UI.

### 15.6 Feature-specific fixes (apply across pillars)
- **Resources (every pillar):** NOT a hyperlink dump. **Systematically categorized** (e.g., MCAT → Anki / Exams / Content / etc.), each item a **clickable card/row that opens in a new tab.** Clean, grouped, scannable.
- **Essays & Story Bank:** not inline text boxes — a **button that opens a dedicated full writing space / document view** (real editor, feels like writing on paper; or an embedded doc). Proper document functionality.
- **Research & doc-heavy areas:** **embed the Google Drive folder** (live), not a URL textbox.
- **Graphs / trackers:** must be genuinely well-designed, readable, useful (prototypes were bad). Clean charts (e.g., Recharts).
- **Graduation / major requirements:** not a flat giant table — digestible via toggles/accordions/grouping with progress indicators.
- **School List:** eliminate wasted space; dense and useful.
- **Timeline:** a **visual graphic timeline** (as originally requested), not a list.
- **Quotes:** pull from a **better source** — embed a quotes API/feed instead of a tiny hardcoded list.
- **MCAT Question of the Day:** needs a **real source** — find/embed a question API or a rotating, Andy-editable question pool (flag the source explicitly).
- **Help tab:** add one — house the **Discord link(s)** and other "everything" links/support.
- **Interactivity mandate:** most elements should be clickable → lead to more pages/subtabs (deep, deliberate nav). Exception: genuine at-a-glance info displays that are more useful shown than clicked.

### 15.7 "Good interface" reference (technique level to aim for)
Andy provided screenshots of a polished med-related interface (pending re-upload). Don't clone it, but **emulate its techniques and polish**: real **search/find**, **drag-and-drop PDF upload**, and other complex, genuinely interactive components. The bar is that level of craft.

### 15.8 Working method (Andy ↔ Claude ↔ Claude Code)
Andy speaks in plain language; **this assistant (Claude) translates each request into a precise, technical UI/UX spec** before it goes to Claude Code. Example of the translation expected:
- Andy says: *"Make a place where I can search colleges."*
- Claude produces: *"Create an accessible, reusable college-search combobox in React + TypeScript. Debounce 250ms. Search a supplied dataset by name, city, state with fuzzy matching. Support mouse selection, arrow keys, Enter, Escape. Show loading, no-results, and inline error states. Use shadcn/ui and follow the existing design system. Add tests."*
So: Andy → Claude (translate to technical UI spec) → Claude Code (build). Use correct interface vocabulary throughout.

### 15.9 UI/UX feature toolkit (apply whenever relevant — non-exhaustive)
Andy wants the build to use standard modern UI/UX fundamentals throughout. **`UI_UX_Frontend_Features_Master_Guide.pdf` (included in the project folder) is the canonical reference — a 23-category glossary of interface features; Claude Code should consult it and pull the right pattern from any category as needed.** Quick palette:
- **Navigation:** grouped sidebar, nested routing, tabs & subtabs, breadcrumbs, a **command palette (Cmd/Ctrl-K)** for jump-to-anything, back/forward, "jump back in" recents.
- **Search & filtering:** **autocomplete/combobox**, **debounced** input, **fuzzy search**, faceted filters, sort, multi-select, tag inputs, date/range pickers.
- **Data display:** sortable/filterable/paginated tables, cards, **accordions/disclosure toggles** for dense content, tooltips, badges/pills, **progress bars & rings**, clean charts (Recharts), and well-designed **empty states** + **skeleton loaders**.
- **Editing & input:** inline edit-in-place, **drag-and-drop** (reorder rows + file/PDF upload), rich-text/document editor, character counters (AMCAS limits), presets/dropdowns, helper text, autosave with a "saved/last backed up" indicator.
- **Feedback:** toasts/notifications, modals/dialogs, confirm-before-destructive, inline validation, optimistic UI updates, clear loading/error/empty states.
- **Personalization:** light/dark mode, remembered view/filter/sort preferences (persisted), customizable layout where sensible.
- **Productivity:** keyboard shortcuts + full keyboard navigation, bulk actions, quick-add buttons, sticky headers.
- **Polish & a11y:** subtle hover/focus states and transitions (restrained, per §15.1), accessible focus order, ARIA labels, sufficient color contrast.

> Use these as a palette, not a checklist to cram in — apply the ones that make a given view more usable.

**Full 23 categories in the guide (consult the PDF for the feature list under each):** 1. Navigation · 2. Search & discovery · 3. Inputs & forms · 4. Buttons & actions · 5. Feedback & status · 6. Overlays & temporary surfaces · 7. Content containers · 8. Tables & data-heavy interfaces · 9. File & document features · 10. Authentication & accounts · 11. E-commerce · 12. Social & communication · 13. Scheduling & calendar · 14. Maps & location · 15. Media · 16. Editing & creation tools · 17. Onboarding & education · 18. Personalization & settings · 19. Accessibility · 20. Mobile-specific patterns · 21. AI-specific interface features · 22. Interaction concepts · 23. Design-system vocabulary.

Most relevant to this dashboard: **1 (Navigation), 2 (Search/discovery — for the school/college lookup), 3 (Inputs/forms), 5 (Feedback/status), 7 (Content containers), 8 (Tables/data-heavy), 9 (File/document — Drive/Docs embeds, dropzone uploads), 13 (Scheduling/calendar — the calendar sync), 16 (Editing — the essay/writing views), 18 (Personalization), 19 (Accessibility), 22 (Interaction concepts).** The guide also includes a learning map (UI vs UX vs frontend vs full-stack vs AI-assisted coding) and a recommended YouTube learning sequence for Andy.

---

## Appendix A — UNC Neuroscience B.S. + Pre-Med Course Plan (Andy Quach, full document)


# UNC Neuroscience B.S. + Pre-Med — Course Plan & Registration Strategy

**For:** Andy Quach — Incoming first-year, Fall 2026 · Neuroscience B.S., Pre-Med
**Built:** June 2026 · **Status:** Draft to confirm with your academic advisor and HPA

> **How to read this doc.** Everything is tagged so you can tell sources apart:
> - 🟦 **OFFICIAL** = UNC catalog / department / advising policy (cited).
> - 🟨 **STUDENT/THIRD-PARTY** = forums, advisors-for-hire, general pre-med community (cited, lower reliability).
> - 🟩 **MY RECOMMENDATION** = my synthesis/judgment, not an official rule.
>
> **Three things I could NOT fully verify and you must confirm (see "Advising Questions"):** (1) exact Fall 2026 section meeting times — ConnectCarolina wasn't queryable here, so all calendars below are *illustrative templates*; (2) whether CHEM 430 actually runs in **Summer**; (3) whether your **SPAN 203** and **NSCI 175** credits actually *post* on your record. Reddit (r/UNC, r/premed) is blocked to my web crawler, so student-experience citations here are College Confidential / Student Doctor Network / AAMC instead.

---

## 1. Executive Summary

You are roughly a **full year ahead** of UNC's standard Neuroscience B.S. timeline. UNC's own "Sample II" plan is written for students who arrive with *MATH 231 + CHEM 101/L* credit — you already have **more than that** (both gen chems, both calcs, BIOL 101/101L, STOR 155, NSCI 175, PHYS 115, plus several gen-ed transfers). That credit does **not** shave requirements off med school (most med schools don't accept AP/exam credit for prereqs 🟦), but it **frees your schedule** so you can keep first semester light and *still* finish the MCAT-critical chemistry chain early. 🟩

The single most important structural fact for you: **organic chemistry did not transfer**, so the chemistry chain is your real critical path, and it has two parallel tracks that must be sequenced correctly (🟦 confirmed by UNC HPA and the catalog):

- **Lab chain:** CHEM 241L → CHEM 262L (241L is a *prerequisite* for 262L)
- **Lecture / MCAT chain:** CHEM 261 → CHEM 262 → CHEM 430 (biochem)
- CHEM 261 has **no lab**; the 8 hrs of "orgo lab" med schools look for come from **241L + 262L**.

**Recommended spine:**

| Term | Chem move | Result |
|---|---|---|
| Fall 2026 | *No 200-level chem* (advising rule) | Light, GPA-protective launch |
| Spring 2027 | CHEM 241 + 241L | Start both chains |
| Fall 2027 | CHEM 261 | Lecture chain advances |
| Spring 2028 | CHEM 262 + 262L | Orgo done; lab chain done |
| Summer 2028 *(if 430 runs)* | CHEM 430 | Biochem done → **MCAT late summer/fall 2028** |
| or Fall 2028 | CHEM 430 | Biochem done → **MCAT winter/spring 2029** |

Either MCAT window lets you apply in the **2029 cycle** (summer after junior year) and matriculate **Fall 2030 with no forced gap year** — while keeping any single semester from becoming a GPA minefield. 🟩

---

## ⭐ Year 1 — LOCKED PLAN (Fall 2026 + Spring 2027)

🟩 This is the committed Year 1. Section times get filled once live ConnectCarolina sections are in hand; course choices are final.

### Fall 2026 — FINAL SECTIONS (enroll July 6, window opens 10:00 AM)

Preferences honored: **2x/week** (TuTh or MoWe), **no 8am**, **central-campus proximity**, **Fridays off**.

| Course | Sec | Class # | Days/Time | Building | Cr |
|---|---|---|---|---|---|
| **PSYC 101** General Psychology | 002 | 13503 | TuTh 9:30–10:45 | Hamilton | 3 |
| **NURS 50** First-Year Seminar (Wellness) | 001 | ~1580x* | TuTh 11:00–12:15 | Dey | 3 |
| **BIOL 103** How Cells Function | 004 | 13054 | TuTh 12:30–1:45 | Wilson | 3 |
| **ENGL 105** Eng Comp & Rhetoric | 240 | 16255 | MoWe 12:20–1:10 | Dey | 3 |
| **IDST 101** College Thriving | 015 | 9478 | Mon 11:15–12:05 | Murphey | 1 |
| **IDST 111L** Data Literacy Lab | 421 | 12919 | Wed 1:25–2:15 | Bingham | 1 |
| **Total** | | | | | **14** |

*NURS 50 full class number was cut off in the listing — grab it when carting (section 001).

**Weekly grid:**

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 |  | PSYC 101 |  | PSYC 101 |  |
| 10:00 |  | PSYC 101 |  | PSYC 101 |  |
| 11:00 | IDST 101 | NURS 50 |  | NURS 50 |  |
| 12:00 | ENGL 105 | NURS→BIOL | ENGL 105 | NURS→BIOL |  |
| 1:00 | ENGL 105 | BIOL 103 | IDST 111L | BIOL 103 |  |
| 2:00 |  |  | IDST 111L |  |  |

**Backups to cart (all preference-compliant):** BIOL 103 → 005 (TuTh 2:00) / 006 (TuTh 3:30); ENGL 105 → any other MoWe section or TuTh 2:00 sec 235; Seminar → ASIA 75 → ASIA 89; IDST 111L → 423 (Wed 2:30); IDST 101 → 013 (Mon 11:15).

**Enroll order July 6:** (1) PSYC 101 002 → (2) NURS 50 seminar *(3-seat cap, races)* → (3) BIOL 103 004 → (4) ENGL 105 240 → (5) IDST 101 015 → (6) IDST 111L 421.

**Notes:** All four First-Year Foundations finish this fall (ENGL, NURS 50 seminar, IDST 101, IDST 111L) → spring is free for the chem chain. **LFIT** moves to a later term (graduation req, never time-sensitive). Only watch-out: Dey→Wilson hop on Tue/Thu (~10 min, covered by the 15-min gap).

### Spring 2027 — chem chain begins

| Course | Cr | Why it's here |
|---|---|---|
| **CHEM 241** Modern Analytical Methods | 3 | Major req + opens lecture-side chem |
| **CHEM 241L** | 1 | Major req + **prereq for 262L** + med "orgo lab" |
| **BIOL 220** Molecular Genetics | 3 | Major req + HPA-listed med prereq |
| **SOCI 101** | 3 | MCAT soc + med prereq |
| **Focus-Capacity gen ed** *(or standalone FYS/FYL if not done in fall)* | 3 | Finishes foundations / chips at gen eds |
| **Total** | **13** | 2 analytical STEM + 1 lab = at the safe limit |

**Spring swap option:** if you'd rather a lighter/more-motivating term, replace **BIOL 220** with an **NSCI 22x** (counts toward the "select two" core) and take BIOL 220 sophomore year. Don't run BIOL 220 *and* NSCI 22x together this term.

**Year 1 total: ~25 credits** (12–15 fall + 13 spring). Both terms sit in UNC's modeled 12–15 range, all four foundations are done, and the chemistry critical path is launched on schedule.

---

## 2. Course-Sequencing Logic (the "why")

### 2.1 What you still need (after your incoming credit)

🟦 **Neuroscience B.S. — what's already satisfied by your credit** (verify each *posts* in Tar Heel Tracker):
BIOL 101/101L, CHEM 101/101L, CHEM 102/102L, MATH 231, MATH 232, STOR 155 (stats core), PHYS 114, PHYS 115 (physics fully complete), NSCI 175 (core), Global Language via SPAN 203.

🟦 **Neuroscience B.S. — still required:**

- **Additional Requirements (C or better required):** BIOL 103, BIOL 220, CHEM 241, CHEM 241L, CHEM 261, CHEM 262, CHEM 262L, COMP 110 *or* 116, PSYC 101. *(BIOL 101/L, CHEM 101–102/L, MATH 231/232, PHYS 114 + 115 already done.)*
- **Core:** one research-methods course — **NSCI 27\*** lab prioritized over PSYC 270; **two of** NSCI 221 / 222 / 225; **6 hrs Knowledge Electives**; **6 hrs Math/Methods/Stats (MMS) Electives**.
- Total major hours 78–79; overall 120 to graduate.

🟦 **Pre-med additions on top of the major** (UNC HPA "common prerequisites"):
CHEM 430 biochem (also counts as a Knowledge Elective ✅ double-duty), one semester **Psychology** (PSYC 101 — also major-required) + one semester **Sociology** (SOCI 101), and HPA explicitly advises **BIOL 252/252L** as a general elective. *(Physics 114 + 115 are both done — no physics left.)* Most med schools want a **C or higher** in prereqs. 🟦

### 2.2 The four sequencing constraints that drive everything

1. **No 200-level bio/chem in your first semester** unless an advisor signs off — even for early-college/dual-enrollment students. 🟦 (advising guidance you flagged; confirm with your advisor). → *Chem chain can't start until Spring 2027.*
2. **241L before 262L.** 🟦 So 241L must land at least one term before you want 262L.
3. **261 → 262 → 430.** 🟦 Three sequential terms minimum for the lecture/MCAT chain. This is why biochem can't realistically happen before summer/fall of sophomore→junior transition.
4. **MCAT after content is complete:** gen chem ✅, orgo (through 262), biochem (430), physics (114+115), bio (101/103/220), psych+soc. The *last domino* is biochem (430). **Your MCAT date is essentially "the term after CHEM 430."** 🟩

### 2.3 Workload guardrails you gave (used throughout)

🟨/🟩 First-year workload guidance you're applying: ≤2 analytical STEM courses + ≤1 STEM lab per term; **PSYC 101 doesn't count** against the STEM warning; **IDST 111L is not a STEM lab**; first-year foundations can split across fall *and* spring. These are sensible load rules — treat them as planning heuristics, not hard UNC policy.

### 2.4 Stats: a real pre-med flag for you 🟨

UNC HPA lists **STOR 151/155 (or PSYC 210, BIOS 600)** as satisfying the stats expectation, so **STOR 155 satisfies your *major* stat core**. 🟦 BUT: many med schools **do not accept AP/by-exam credit for prerequisites** and want stats taken *in residence*; the standard community workaround is to take the college course (or a higher course that lists it as a prereq). 🟨 (CC/SDN threads, AAMC MSAR.)

🟩 **Recommendation:** Don't re-take stats for its own sake. Instead, plan to take **PSYC 210 (Statistical Principles of Psych Research)** during sophomore/junior year — it (a) is a college-taken stats course that satisfies skeptical med schools, (b) **also legally fills your major's stat slot or an MMS elective**, and (c) is genuinely useful for MCAT psych/soc and research. Check each target school's MSAR entry before deciding it's necessary.

---

## 3. Fall 2026 — Plan A + Backups

**Design goal:** balanced, mostly 100-level, no 200-level STEM, protect GPA, knock out foundations. Target **13–15 credits**.

> 🟩 **Power move — FY-Launch double-dip.** In the catalog, **BIOL 103, PSYC 101, NSCI 175, CHEM/PHYS** all carry the "F" tag = *FY-Launch sections may exist*. A FY-Launch section of **BIOL 103 or PSYC 101 also satisfies your First-Year Seminar/Launch foundation at the same time.** 🟦 Search the **FY-LAUNCH** attribute in ConnectCarolina. If you grab a FY-Launch BIOL 103 or PSYC 101, you finish a foundation "for free" and open a slot.

### Schedule A — Ideal balanced (RECOMMENDED) 🟩

| Course | Cr | Type | Counts toward |
|---|---|---|---|
| **BIOL 103** How Cells Function *(grab FY-Launch section if available)* | 3 | STEM lecture (no lab) | Major additional req |
| **PSYC 101** General Psychology | 3 | Non-STEM-warning | Major req + MCAT psych + med prereq |
| **ENGL 105 / 105i** | 3 | Foundation | First-Year Foundation (writing) |
| **IDST 101** College Thriving | 1 | Foundation | First-Year Foundation |
| **IDST 111L** Data Literacy Lab | 1 | Foundation (not a STEM lab) | First-Year Foundation |
| **LFIT** or an easy Ideas-in-Action Gen Ed | 1–3 | Light | LFIT / Focus Capacity |
| **Total** | **12–14** | 1 true STEM course, 0 STEM labs | Very GPA-safe |

🟦 Note: **ENGL 105 cannot be satisfied by exam credit** — you must take it at UNC (transfer credit is the only substitute). So it belongs in your first year.

### Schedule B — if ENGL 105 times are bad / you move it to Spring

Drop ENGL 105 → add **First-Year Seminar or First-Year Launch (3)** *(or a FY-Launch section of BIOL 103/PSYC 101 to combine)*, keep IDST 101 + IDST 111L, add LFIT or an easy Gen Ed. Move ENGL 105 to Spring 2027. ✅ Still 13–15 cr, foundations progressing.

### Schedule C — if BIOL 103 is full

Replace BIOL 103 with **PSYC 101 (kept) + an extra First-Year Foundation/easy Gen Ed**. Example: PSYC 101 (3) + ENGL 105 (3) + FYS/FYL (3) + IDST 101 (1) + IDST 111L (1) + LFIT (1) = 12. Pick up BIOL 103 in Spring 2027 (it's offered then per UNC's sample plan). 🟦

### Schedule D — if PSYC 101 is full

Replace PSYC 101 with **BIOL 103 (kept) + foundations/Gen Eds**. Example: BIOL 103 (3) + ENGL 105 (3) + FYS/FYL (3) + IDST 101 (1) + IDST 111L (1) + LFIT (1) = 12. Take PSYC 101 in Spring 2027. (You'll want PSYC 101 done before/with NSCI 22x anyway.)

### Schedule E — worst case: both BIOL 103 and PSYC 101 full

Go **foundation-heavy but still useful** — never waste the term:
ENGL 105 (3) + First-Year Seminar/Launch (3) + IDST 101 (1) + IDST 111L (1) + LFIT (1) + one **Ideas-in-Action Focus-Capacity Gen Ed** you'll need anyway (3) = ~12. You finish *all* first-year foundations in one term and start spring with a clean slate for BIOL 103 + PSYC 101 + chem.

🟩 **Do NOT, in Fall 2026:** take CHEM 241, CHEM 261, BIOL 220, NSCI 22x as your default, or any 300+ course — unless your advisor explicitly approves it as a documented exception. (NSCI 22x only as an *interest* backup, since you already have NSCI 175 and shouldn't overload.)

---

## 4. Spring 2027 — Plan A + Backups

**Design goal:** start the chemistry chain; add one science/major course + the pre-med sociology; finish any leftover foundation. Target **13–15 credits**.

### Spring Plan A — start chem chain (RECOMMENDED) 🟩

| Course | Cr | Load flag | Counts toward |
|---|---|---|---|
| **CHEM 241** Modern Analytical Methods | 3 | Analytical STEM #1 | Major req + lab-chain setup |
| **CHEM 241L** | 1 | STEM lab #1 | Major req + **prereq for 262L** + med "orgo lab" |
| **BIOL 220** Molecular Genetics *(OR an NSCI 22x — see 4.1)* | 3 | Analytical STEM #2 | Major req + HPA-listed med prereq |
| **SOCI 101** | 3 | Non-STEM | MCAT soc + med prereq |
| **ENGL 105 *or* IDST 111L** (whichever you didn't do in fall) | 1–3 | Light | Foundation cleanup |
| **Total** | **~14** | 2 analytical STEM + 1 lab = at the guideline limit (OK; gen chem already done) | |

🟩 This is the balanced version. **Do not also pile NSCI 22x on top** — CHEM 241/241L + BIOL 220 + NSCI 22x + SOCI 101 + ENGL/IDST would be **too heavy** (3 analytical STEM). Pick BIOL 220 **or** NSCI 22x, not both.

### 4.1 BIOL 220 vs. NSCI 22x for the Spring science slot 🟩

| | **BIOL 220 (Molecular Genetics)** | **NSCI 221/222/225** |
|---|---|---|
| Major role | Additional **requirement** (must take eventually) | Core "**select two**" (must take two eventually) |
| Med-school value | **HPA-listed med prereq**; gateway to upper bio | Not a listed prereq |
| MCAT value | Solid (genetics/bio) | Modest (psych/behavioral) |
| Motivation | Foundational, less "neuro" | **Neuroscience-specific, more motivating** |
| Unlocks chem chain? | **No** | **No** |
| Load | Analytical, pairs as "STEM #2" with CHEM 241 | Lighter/reading-heavier |

🟩 **Verdict:** Neither is an MCAT *bottleneck* (orgo/biochem/physics are). Take **BIOL 220 in Spring 2027 if** you want to clear a required analytical course while motivated and can handle 2 analytical STEM. Take **an NSCI 22x instead if** you want a lighter, more motivating spring and are fine pushing BIOL 220 to sophomore year. Default: **BIOL 220**, because it's a hard requirement + med prereq and the pairing with CHEM 241 is manageable now that gen chem is behind you.

### Spring backups

- **CHEM 241/241L full or bad times:** keep BIOL 220 + SOCI 101 + foundation + add an NSCI 22x or Gen Ed; slide CHEM 241/241L to **Fall 2027** (it's offered both terms) and shift 261 to Spring 2028. Costs you ~one term of chem-chain lead time but stays safe.
- **BIOL 220 full:** swap in **NSCI 22x** (per 4.1).
- **Want it lighter:** CHEM 241 + 241L + SOCI 101 + foundation only (~8–11 cr is too low — add one Gen Ed to ~13).

---

## 5. Four-Year Plan (semester-by-semester)

🟩 Recommended path. Junior/senior are intentionally flexible. **F25/Su = offered-term assumptions to verify in ConnectCarolina.**

| Term | Courses | Cr | Notes |
|---|---|---|---|
| **Fall 2026** | BIOL 103, PSYC 101, ENGL 105, IDST 101, IDST 111L, (LFIT/Gen Ed) | 12–14 | No 200-lvl STEM. Grab FY-Launch BIOL 103/PSYC 101 to clear FYS/FYL. |
| **Spring 2027** | CHEM 241 + 241L, BIOL 220, SOCI 101, (ENGL 105 or foundation leftover) | ~14 | **Chem chains begin.** |
| **Fall 2027** | CHEM 261, NSCI 22x (#1), COMP 116, Gen Ed | ~12–15 | Orgo I begins (physics fully complete — nothing to add there). |
| **Spring 2028** | CHEM 262 + 262L, NSCI 27\* research-methods lab, PSYC 210 (stats, med-safe), Gen Ed | ~13–14 | **Orgo done; 262L closes lab chain.** No physics needed (114 + 115 complete). |
| **Summer 2028** | **CHEM 430** *(if offered)* | 3 | Enables **late-summer/fall 2028 MCAT**. Verify summer offering. |
| **Fall 2028** | CHEM 430 *(if not summer)*, NSCI 22x (#2), **BIOL 240 Cell Biology** *(HPA "highly recommended" + Knowledge Elective)*, Gen Ed | ~12–15 | Biochem; build MCAT-prep term. |
| **Spring 2029** | **BIOL 252/252L** (med rec), **PSYC 245 Psychopathology** *(Knowledge Elective + MCAT psych)*, **PSYC 210** (med-safe stats / MMS), Gen Eds | ~15 | MCAT window (if 430 was fall). Apply (2029 cycle). |
| **Fall 2029 / Spring 2030 (Senior)** | **EXSS 175 Human Anatomy** *(Knowledge Elective)*, remaining MMS/Knowledge electives, 1 Tier-3 enrichment (bioethics / med Spanish / public health), IDEAs focus capacities, interviews | ~15/term | Finish 120 hrs. Interviews/decisions. |

**Graduation check:** every major Additional Requirement, the research-methods lab, two NSCI 22x, 6 Knowledge + 6 MMS elective hrs, and the IDEAs-in-Action curriculum all land by Spring 2030. CHEM 430 + BIOL 252/252L cover the pre-med "extras." 🟩

> 🟩 **These elective placements (BIOL 240, BIOL 252/252L, PSYC 245, PSYC 210, EXSS 175, + a Tier-3 enrichment) are ILLUSTRATIVE, not a commitment.** They're shown only so you can see how the recommended premed-friendly electives *would* fit and satisfy the major's 6 Knowledge + 6 MMS hrs. Junior/senior terms stay deliberately flexible — swap freely based on interest, offerings, research load, and what your target schools' MSAR entries actually want. Tier 1 = double-duty (counts for major *and* helps premed); Tier 3 = enrichment only.

---

## 6. MCAT Timeline Options

The MCAT date is driven by **when CHEM 430 finishes** (last content domino). 🟩

### Option 1 — Aggressive (Summer 2028 CHEM 430)
- **Study:** Spring–Summer 2028. **Sit:** **August/September 2028** (end of summer after sophomore year).
- **Apply:** 2029 cycle (open May/June 2029, after junior year) → **matriculate Fall 2030, no gap.**
- Pros: scores in hand very early, lots of buffer. Cons: requires CHEM 430 to actually run in summer **and** a heavy spring; only do this if GPA is strong. 🟩

### Option 2 — Standard / GPA-safe (Fall 2028 CHEM 430)
- **Study:** Winter 2028 → Spring 2029. **Sit:** **January–April 2029** (junior spring).
- **Apply:** 2029 cycle (summer after junior year) → **matriculate Fall 2030, no gap.** This is the cleanest fit and what I'd default to. 🟩

### Option 3 — Conservative (if anything slips)
- **Sit:** Summer 2029, **apply 2030 cycle** → matriculate Fall 2031 (one gap year). A gap year is common and not a negative. 🟨

🟦 Logistics to bake in: AAMC says budget **~30 days** for scores and know your score *before* applying; build prep so your sit date is ≥1 month before you submit AMCAS.

---

## 7. ConnectCarolina Shopping-Cart Strategy

🟩 Goal: a cart of **30–40 sections** so that whatever's open at your enrollment time, you can assemble a valid schedule. **No 8:00 AM** unless unavoidable; prefer **9:00 AM+**; avoid cross-campus back-to-backs; avoid gaps >2 hrs.

### 7.1 Cart checklist (Fall 2026) — load multiple sections of each

- [ ] **BIOL 103** — add **3–4 sections** (prefer FY-Launch attribute; MWF mid-morning + a TR option)
- [ ] **PSYC 101** — add **3–4 sections** (prefer FY-Launch; one MWF, one TR)
- [ ] **ENGL 105 / 105i** — add **4–6 sections** (small caps, fill fast — over-stock; 9:30–2:00 windows)
- [ ] **IDST 101** College Thriving — add **2–3 sections**
- [ ] **IDST 111L** Data Literacy Lab — add **2–3 sections** (afternoon lab blocks)
- [ ] **First-Year Seminar / First-Year Launch** — add **3–4** appealing ones (backup for ENGL or to combine with major)
- [ ] **LFIT** — add **2–3** non-8am sections
- [ ] **Easy Ideas-in-Action Gen Ed** (a Focus Capacity you'll need) — add **3–4** as filler/backups
- [ ] *(Interest backup only)* **NSCI 221/222/225** — add **1–2** if you want them visible, but do not default to them

That's ~25–35 section rows → in range. Repeat the same approach each term (e.g., Spring 2027 stock 3–4 CHEM 241 lectures, all CHEM 241L lab blocks, BIOL 220 sections, SOCI 101 sections).

### 7.2 Prioritized enrollment order (when your window opens) 🟩

1. **Smallest / fastest-filling first:** **ENGL 105** section, then **IDST 111L** lab, then **IDST 101**. (Small caps disappear first.)
2. **Big required lectures with FY-Launch value:** **BIOL 103** (FY-Launch) → **PSYC 101** (FY-Launch). Grabbing one FY-Launch here also clears your FYS/FYL.
3. **LFIT / Gen Ed filler** last (lots of sections, easy to adjust).
4. In later terms, this reorders to: **lab sections first** (241L, 262L, 111L) → **capped lectures** (CHEM, NSCI 27\*) → **big lectures** → filler.

### 7.3 Swap vs. Drop 🟩
- Use **"Swap"** (not Drop-then-Add) whenever you're trading one *enrolled* class for a *cart* class. Swap is atomic: if the new section's add fails (full/closed), you **keep your original seat**. Dropping first risks losing both.
- Only **Drop** outright when you genuinely want fewer credits and don't need the seat back.
- Use the **waitlist** + a held backup section via Swap-into-waitlist where allowed; keep the backup enrolled until the waitlist clears.

---

## 8. Google-Calendar-Style Weekly Layouts (Fall 2026)

> ⚠️ **These meeting times are ILLUSTRATIVE templates** — I could not query live Fall 2026 sections. Replace each block with the real ConnectCarolina time, keeping the no-8am / no-bad-gaps rules. Buildings noted for walking: **Davie Hall** = Psychology, **Greenlaw** = English, **Genome Sciences/Wilson** = Biology, **Kenan/Murray/Caudill/Morehead** = Chemistry, **Phillips** = Physics. Davie ↔ Greenlaw are close (central); Chemistry cluster is south-central; Genome Sciences is a bit east — avoid Genome→Greenlaw in a 10-min gap.

### Schedule A (Ideal) — 13 cr, very low risk
Blocks: BIOL 103 (MWF 10:10–11:00, Genome Sci) · PSYC 101 (TR 9:30–10:45, Davie) · ENGL 105 (MWF 12:20–1:10, Greenlaw) · IDST 101 (W 11:15–12:05) · IDST 111L (R 2:00–3:50) · LFIT (T 11:00–11:50)

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 |  | PSYC 101 |  | PSYC 101 |  |
| 10:00 | BIOL 103 | PSYC 101 | BIOL 103 | PSYC 101 | BIOL 103 |
| 11:00 |  | LFIT | IDST 101 |  |  |
| 12:00 | ENGL 105 |  | ENGL 105 |  | ENGL 105 |
| 1:00 |  |  |  |  |  |
| 2:00 |  |  |  | IDST 111L |  |
| 3:00 |  |  |  | IDST 111L |  |
| 4:00 |  |  |  |  |  |
| 5:00 |  |  |  |  |  |

✅ No 8am · no gaps over 2 hr · no cross-campus rush (PSYC@Davie, then BIOL@Genome Sci on separate days) · MWF mornings tidy, Thursday afternoon lab.

### Schedule B (ENGL moved to Spring) — 13 cr
Swap ENGL 105 → First-Year Seminar/Launch (TR 12:30–1:45). Keep everything else.

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 |  | PSYC 101 |  | PSYC 101 |  |
| 10:00 | BIOL 103 | PSYC 101 | BIOL 103 | PSYC 101 | BIOL 103 |
| 11:00 |  |  |  |  |  |
| 12:00 |  | FYS/FYL | IDST 101 | FYS/FYL |  |
| 1:00 |  | FYS/FYL | (free) | FYS/FYL |  |
| 2:00 |  |  |  | IDST 111L |  |
| 3:00 |  |  |  | IDST 111L |  |
| 4:00 | LFIT |  | LFIT |  |  |

### Schedule C (no BIOL 103) — 12 cr
PSYC 101 (TR 9:30–10:45) · ENGL 105 (MWF 11:15–12:05) · FYS/FYL (MW 1:25–2:40) · IDST 101 (F 10:10–11:00) · IDST 111L (T 2:00–3:50) · LFIT (R 1:00–1:50)

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 |  | PSYC 101 |  | PSYC 101 |  |
| 10:00 |  | PSYC 101 |  | PSYC 101 | IDST 101 |
| 11:00 | ENGL 105 |  | ENGL 105 |  | ENGL 105 |
| 12:00 |  |  |  |  |  |
| 1:00 | FYS/FYL | IDST 111L | FYS/FYL | LFIT |  |
| 2:00 |  | IDST 111L |  |  |  |

### Schedule D (no PSYC 101) — 12 cr
BIOL 103 (MWF 10:10–11:00) · ENGL 105 (TR 11:00–12:15) · FYS/FYL (MW 2:00–3:15) · IDST 101 (W 1:00–1:50) · IDST 111L (R 2:30–4:20) · LFIT (T 1:00–1:50)

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 |  |  |  |  |  |
| 10:00 | BIOL 103 |  | BIOL 103 |  | BIOL 103 |
| 11:00 |  | ENGL 105 |  | ENGL 105 |  |
| 12:00 |  | ENGL 105 |  | ENGL 105 |  |
| 1:00 |  | LFIT | IDST 101 |  |  |
| 2:00 | FYS/FYL |  | FYS/FYL | IDST 111L |  |
| 3:00 |  |  |  | IDST 111L |  |

### Schedule E (worst case — both full) — 12 cr, foundations cleared
ENGL 105 (MWF 9:05–9:55) · FYS/FYL (TR 11:00–12:15) · IDST 101 (M 1:00–1:50) · IDST 111L (W 2:00–3:50) · LFIT (T 1:00–1:50) · Gen Ed Focus Capacity (TR 2:00–3:15)

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 9:00 | ENGL 105 |  | ENGL 105 |  | ENGL 105 |
| 10:00 |  |  |  |  |  |
| 11:00 |  | FYS/FYL |  | FYS/FYL |  |
| 12:00 |  |  |  |  |  |
| 1:00 | IDST 101 | LFIT |  |  |  |
| 2:00 |  | Gen Ed | IDST 111L | Gen Ed |  |
| 3:00 |  |  |  |  |  |

🟩 **Spring 2027 layout principle:** put **CHEM 241L (a 3–4 hr lab block)** on an afternoon with nothing right after it; keep **CHEM 241 lecture** and **BIOL 220** on opposite day patterns (one MWF, one TR) so a bad day isn't all-STEM; park **SOCI 101** and the foundation in the gaps. Avoid Genome Sciences → Chemistry → Davie chains under 15 min.

---

## 9. Advising Questions to Verify (bring these to orientation/advisor + HPA)

🟦 = ask your Academic Advisor / department · 🩺 = ask HPA (Health Professions Advising)

1. 🟦 Did **NSCI 175** post as NSCI 175 (core), and did **SPAN 203** post and clear **Global Language**? (Your placement said SPAN 105 — confirm 203 credit actually landed.)
2. 🟦 Did **CHEM 101/101L/102/102L, BIOL 101/101L, MATH 231/232, STOR 155, PHYS 115** all post, and do any carry conditions?
3. 🟦 Confirm **both PHYS 114 and PHYS 115 posted** (you're treating physics as fully complete — verify there's no missing piece before you skip it entirely).
4. 🟦 As an incoming student with heavy credit, will an advisor **approve a 200-level chem in an earlier term** if I want to accelerate — or is Spring 2027 the true earliest for CHEM 241?
5. 🟦 Exact **offered terms** for CHEM 241, 241L, 261, 262, 262L, **and especially CHEM 430 (does it run in Summer?)** — pull live in ConnectCarolina / class search.
6. 🟦 Prereqs as they'll apply to me for **BIOL 220** and **NSCI 221/222/225** (do they require PSYC 101 / BIOL 103 first?).
7. 🩺 Will my **AP-based STOR 155** satisfy med-school stats, or should I take **PSYC 210** in residence? (Check target schools' MSAR.)
8. 🩺 Confirm the **BIOL 252/252L** and **BIOL 240** recommendations for my target schools, and whether any want **2 sem bio *with lab*** specifically.
9. 🟦 Which of my transfers (**ENEC 202, HIST 103, ARTS/AMST/AAAD, ECON**) clear **IDEAs-in-Action Focus Capacities**, so I don't double-pay?
10. 🟦 Can a **FY-Launch section of BIOL 103 or PSYC 101** simultaneously clear my FYS/FYL foundation this fall?

---

## 10. Red Flags / Things NOT To Do 🟩

- ❌ **No 200-level bio/chem in Fall 2026** (and no 300+) without explicit advisor approval. Start chem in Spring.
- ❌ Don't stack **CHEM 241+241L + BIOL 220 + NSCI 22x + SOCI 101 + foundation** in one spring — that's 3 analytical STEM; pick **one** of BIOL 220 / NSCI 22x.
- ❌ Don't take **CHEM 262L before 241L** — it's a prereq, ConnectCarolina will block it.
- ❌ Don't assume **CHEM 261 has a lab** — it doesn't; your orgo lab credit = **241L + 262L**.
- ❌ Don't schedule the **MCAT before CHEM 430** — biochem is the last content domino.
- ❌ Don't rely on **AP credit to satisfy med-school prereqs** — most schools won't accept it; use it to free schedule space, not to skip a requirement.
- ❌ Don't **Drop-then-Add** a class you can't afford to lose — use **Swap**.
- ❌ Don't burn first semester on neuro electives you don't need yet (you already have NSCI 175) — protect the GPA, build study habits, lock in research/shadowing early instead.
- ⚠️ Watch the **C-or-better** rule: every Neuroscience "Additional Requirement" needs **C or better**, and most med schools want **C or higher** in prereqs.

---

## 11. Sources

### Official UNC (🟦)
- Neuroscience Major, B.S. — requirements, core, electives, and Sample Plans I & II: https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/
- UNC Office of Health Professions Advising — Medicine (prereqs: CHEM 241/L, 261 "no lab," 262/L, 241L→262L, CHEM 430 biochem, PHYS 114/115 or 118/119, STOR 151/155, psych + soc, calculus, C-or-better): https://hpa.unc.edu/explore/explore-health-careers/medicine/
- IDEAs in Action — First-Year Foundations (IDST 101, IDST 111L, ENGL 105, FYS/FYL; take ~2/term; ENGL 105 not by-exam; one FYS/FYL max): https://ideasinaction.unc.edu/first-year-foundations/ and https://catalog.unc.edu/undergraduate/ideas-in-action/
- CHEM course descriptions / prerequisites (261 req CHEM 102; 262 req 261; 262L req 102L + 241L/245L, 262 co/prereq; 430 req BIOL 101 + 262): https://catalog.unc.edu/courses/chem/
- UNC Chemistry — undergraduate program & course schedule (verify live offered terms): https://chem.unc.edu/ugrad-program/ and https://chem.unc.edu/course_schedule_lec/
- UNC Biology — BS curriculum (Fall '22+) & course info: https://bio.unc.edu/undergraduate/course-info/
- Office of the University Registrar — registration FAQ (enrollment, swap, waitlist): https://registrar.unc.edu/registration-faq/
- UNC class search (live sections/times): https://reports.unc.edu/class-search/

### Student-experience / third-party (🟨)
- College Confidential — UNC Premed specific questions: https://talk.collegeconfidential.com/t/unc-premed-specific-questions/481935
- College Confidential — Undergrad AP credits for med school: https://talk.collegeconfidential.com/t/undergrad-ap-credits/3646116
- Student Doctor Network — AP credit used for medical school applications: https://forums.studentdoctor.net/threads/ap-credit-used-for-medical-school-applications.1198163/
- Student Doctor Network — Math/stats requirements (biostats vs psych stats): https://forums.studentdoctor.net/threads/math-requirements-for-medical-school-quarter-system-biostats-psych-stats.1299574/
- AAMC — MSAR premed course requirements (per-school AP/stats policies): https://students-residents.aamc.org/media/7041/download
- Shemmassian — How to Succeed as a UNC Premed: https://www.shemmassianconsulting.com/blog/unc-premed
- Coursicle (UNC CHEM, past term patterns — JS-rendered, open in browser): https://www.coursicle.com/unc/courses/CHEM/

> **Could not access:** Reddit (r/UNC, r/premed) — blocked to this tool's crawler. Check those directly for course-difficulty chatter on CHEM 261/262, BIOL 103, and section-time tips.


---

## Appendix B — The Ultimate Academic / Study-Skills Guide (community source, r/UTAustin, 🟨)

> Seed content for the Academics pillar's "Ultimate Academic Guide" resource. Source: r/UTAustin post by u/WonderWuffle (added to that sub's FAQ). Reproduced faithfully; Andy will expand over time. Tag 🟨 community.

**READMEs (mindset before tactics):**
1. The author isn't an expert (self-rated ~4–5/10 on study skills) but argues "active recall + spaced repetition are peak" is only ~2/10 understanding — there's more depth below.
2. You won't be a genius overnight — mastering this takes practice, realistically ~3–4 months of semi-consistent effort.
3. At first you'll study *more*, not less; efficient technique pays off after the ramp-up.
4. The guide leans on neuroscience/psychology; "Google It If You Care" (GIIYC) for the why.

**Author's claim:** went from struggling in lower-division classes to consistently 98+ in upper-division bio over ~a year — i.e., not an innate genius; technique-driven and evidence-based.

**The 3 requirements for good grades:**
1. Learn things at a deep level.
2. Remember what you learned on test day.
3. Consistently do the processes that enable 1 & 2 (i.e., mental health / consistency).

**Tip 1 — SLEEP (non-negotiable):** needed for sleep-dependent memory consolidation, willpower, emotional regulation, energy, decision-making. Set a fixed wake/sleep time; get sunlight ASAP after waking for 5–10 min.

**How to learn deeply ("encoding"):** the brain keeps info that solves a problem and connects to a wider structure, and discards isolated trivia. Make dry material important and connected via:
1. **Make curiosity** — skim ahead and flag words/phrases you find interesting; satisfying that curiosity is engaging and makes learning enjoyable.
2. **Priming** — briefly preview material before class so every class feels like a review day; you fit new info into place, feel less lost, retain more. (Possible to cover 80%+ before class.)
3. **Importance searching** — constantly ask why a concept matters / what problem it solves, connecting it to wider context (e.g., capillaries' large cross-sectional area slows blood velocity → enables exchange — far better than rote "capillaries have large surface area").
4. **Mind maps** — take spread-out, non-linear notes to express *connections* (key for higher Bloom's levels: apply, analyze, evaluate). Draw "capillaries → blood velocity → {oxygen exchange, nutrient exchange}" instead of long prose.
5. **Mind maps p2** — mapping lets you analyze/evaluate the relationships you draw (the highest Bloom's levels) → superior learning.

**How to remember for test day:** the brain keeps what it's forced to recall and use. Leverage via:
- **Active learning** — retrieve from memory: brain dumping, flashcards, past papers, practice questions, teaching to a "metaphorical 5-year-old."
- **Spaced repetition** — revisit at intervals: ~a few days, 1 week, 2 weeks, (and if needed) 1 month after learning. The author dedicates Wed/Fri afternoons to 2–3-day and weekly revisions (customizable).
  1. **True (non-cued) recall** — don't rely on cues you won't have on test day; if a flashcard's question itself becomes a cue (you know the answer before finishing reading), ditch it.
  2. **Teaching** — best gap-finder; brain-dumps/flashcards can hide gaps, but trying to explain something exposes exactly what you can't yet articulate.

**How to be consistent (mental health):**
> Disclaimer from the source: if you have or suspect mental health issues, get qualified professional help (many universities offer free services). Progress in mental health makes everything easier.
1. **Honesty** — brutal honesty with self and others increases mindfulness and strips away cope, letting you see and fix real problems.
2. **Reflection** — emotion-aware self-reflection (see "chain analysis," "Kolb's cycle"): (a) write the experience chronologically in detail; (b) note emotions felt and how you responded; (c) **abstraction** — find the root of those emotions and where else they appear; (d) **experiment** with a fix; (e) expect to fail, find why, repeat — do this forever and you can't lose.
3. **Baby steps** — pick a goal that's challenging but genuinely doable based on your history; if it fails, go smaller (even "open the book and stare 10 min" beats yesterday). Crucially, **don't exceed** what you promised yourself, or you'll burn out and recede for weeks.
4. **Gains tracking** — record your wins for motivation and proof the process works.
5. **Meditation (do not skip)** — strong evidence base for focus, motivation, and treating psychiatric illness. **Caution from source:** don't attempt these if you have trauma/mental illness without a trained professional. Types: (a) **thought-awareness** meditation (10 min/day for ~a week — become aware of arising thoughts); (b) **focus training** (focus on breath; when distracted, return to it — each return is a "rep"); (c) **Trataka / fixed-point gazing** (trains impulse control + directed focus — see "Dr. K Trataka").
6. **Urge surfing** — urges are temporary; sit with an urge and notice it rise and fall. Goal isn't to defeat it but to delay acting; it passes.

**Notable community comments (supporting):** strong agreement on **sleep** ("if you've screwed off all term, an all-nighter won't save you — protect health/acuity for the next exam"); treat **two days before** as the real "day before" so the actual day-before is light review + good sleep; for many STEM classes, reading the textbook cover-to-cover and working every end-of-section problem accomplishes the 3 steps; and for heavily **curved** classes, the raw % in the gradebook can be misleading — judge against the class distribution.


---

## Appendix C — Existing Tools & Inspiration (complete link list)

Every existing dashboard/template/app/tool surfaced during research, for reference and style/feature mining.

### Notion templates
- Pre-Med Life Planner: Deluxe — https://www.notion.com/templates/pre-med-life-planner-deluxe
- Pre-Med → Med School — https://www.notion.com/templates/pre-med-med-school
- Pre-med Dashboard (Arvind Rajan) — https://www.notion.com/templates/pre-med-dashboard
- PreMedOS: All-in-One Pre-Med Hub — https://www.notion.com/templates/pre-med-os
- Med School Application Organizer — https://www.notion.com/templates/med-school-application-organizer
- The Premed Playbook (Etsy) — https://www.etsy.com/listing/1174417717/the-premed-playbook-notion-template
- Acamode (med students) — https://petereza.com/the-ultimate-notion-template-for-medical-students/
- Medical School Application Tracker (caffeinated cat) — https://www.notion.com/templates/medical-school-application-tracker
- Pre-Med Planner – Basic Edition — https://www.notion.com/templates/pre-med-tracker-basic-edition
- Medical School List Builder — https://www.notion.com/templates/medical-school-list-builder
- Med School Primary Application Hub (NKMD) — https://www.notion.com/templates/primary-amcas-activities-medical-school-tracker-premed
- Gridfiti — 13 Best Med School Notion Templates (roundup) — https://gridfiti.com/notion-medical-school-templates/

### Apps & platforms
- MedTrack (iOS) — https://apps.apple.com/us/app/medtrack-pre-med-tracker/id6747754528
- NextStep – PreMed Tracker (iOS) — https://apps.apple.com/us/app/nextstep-premed-tracker/id6747686105
- Mappd — https://mappd.com/
- PreMeder — https://premeder.com/
- HPSA Premed Planner — https://www.hpsa.org/programs/premed-planner/
- The PreMed App (Motivate MD) — https://www.motivatemd.com/the-premed-app/
- CycleTrack — https://cycletrack.org/
- Motivate MD — 7 Best Apps for Pre-Meds (roundup) — https://www.motivatemd.com/apps-for-premeds/

### Free spreadsheets / worksheets
- AspiringMD — free Application Tracker (Google Sheets) — https://aspiringmd.com/free-medical-school-application-tracker-google-sheets-template/
- AspiringMD — BCPM GPA Calculator (Google Sheets) — https://aspiringmd.com/amcas-aacomas-tmdsas-gpa-calculator-with-bcpm-free-premed-gpa-spreadsheet/
- Johns Hopkins — Activities Tracker (Excel/Sheets) — https://studentaffairs.jhu.edu/preprofadvising/pre-medhealth/relevant-experience/activities-journal/
- AMCAS Activities Section Template (SDN, Google Sheets) — https://forums.studentdoctor.net/threads/amcas-activities-section-template-google-sheets.1407083/
- AAMC — Premed Worksheets (Official Guide) — https://students-residents.aamc.org/medical-school-admission-requirements/premed-worksheets-official-guide-medical-school-admissions
- White Coat Dreamers — Google Sheets Pre-Med Organizer — https://whitecoatdreamers.com/product/568/

### GPA-calculator references (for our engine)
- MSHQ AMCAS/AACOMAS/TMDSAS calculator — https://medicalschoolhq.net/med-school-gpa-calculator-for-amcas-aacomas-and-tmdsas/
- NYU BCPM calculator — https://cas.nyu.edu/prehealth/resources/bcpm-calculator.html
- Johns Hopkins "Calculating the BCPM GPA" — https://studentaffairs.jhu.edu/preprofadvising/pre-medhealth/applicants/calculating-bcpm-gpa/
- AAMC Application Grade Conversion Guide — https://students-residents.aamc.org/media/7761/download
