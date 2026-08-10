# Premed OS — Revision Round 1 (from Andy's walkthrough)

Each item = **what you said → the technical fix I'd make**. Review/approve; ⚠️ marks things I need from you. Priority order at the bottom.

---

## A. Global look & feel
**A1. Ghibli art as a background overlay / header banner.** You want the art (not vanilla white/grey). → Add a **page header banner image** (like the Notion "school" screenshot — a wide Ghibli rice-field image at top, content below), plus a subtle full-page background tint. Make the banner a per-page configurable image (Home gets the hero art). ⚠️ *Send the art file(s); until then I'll wire it with a placeholder image slot.*

**A2. Light/dark mode colors feel off + vanilla.** → Rework the theme palette: warmer off-white "paper" base (like the cream in your cat drawing) instead of stark white; richer Carolina-blue + soft Ghibli greens as accents; gentler dark mode. Keep the toggle but retune both.

**A3. Font is vanilla — doesn't feel Japanese/Ghibli.** → Swap the type system: a characterful display font for headings (e.g., a rounded humanist or a soft serif) + clean readable body font. I'll propose 2–3 pairings to pick from.

**A4. Too many plain rectangles/text boxes.** → Global pass to replace static boxes with interactive elements (see the "notes/peek" pattern in C7 and the essay-reflection pattern you liked). Cross-cutting principle, applied per section below.

## B. Navigation, top bar, search, sidebar
**B1. Sidebar collapsible (Arc-style).** → Add a collapse toggle + **hover-to-reveal** when collapsed; keyboard shortcut to pin/unpin (you said ⌘S — note: ⌘S = browser save, so I'd use a non-conflicting key like `[` or ⌘B, your call). Persist the collapsed state.

**B2. Sidebar grouping into pillars.** Current: Home / Foundation / Experiences / Your Story / Application. → Keep these groups but tidy ordering/labels into clear pillars; reversible if you dislike it.

**B3. Top bar should hold quick info, not just 2 buttons.** → Redesign the top bar to surface **quote of the day** + **MCAT Q-of-the-day** (compact), plus search + backup indicator. Quick-glance, not full cards.

**B4. Search = ⌘F + more features.** → Note: ⌘F is reserved by the browser for find-in-page, so true ⌘F is unreliable; I'd keep ⌘K (and add `/` as an alias). Expand the palette: search across courses, experiences, schools, resources, essays, AND **actions** ("add task," "go to MCAT"), with recent items and grouped results.

## C. Academics (biggest rework)
**C1. Tab lineup you like — KEEP:** Planner · GPA · Tar Heel Tracker · Resources & Notes. Reorder by priority (below).
**C2. Main academic dashboard = Assignments Tracker + Calendar View** (the Notion model you showed), with a link to all notes — put this at the **forefront** (first subtab). Assignments table → synced **calendar view** (deadline shows on its date).
**C3. Transfer-credit list is too long / too much scrolling.** → Collapse it behind a **button → opens in a side peek/modal or its own subtab**; don't inline the whole list.
**C4. Separate the databases.** Academics (courses/assignments/notes) and **School List / Application** tables must be **two independent databases** — disconnect them.
**C5. Tables: text doesn't fit (e.g., school tier/status).** → Fix column sizing/wrapping so content fits (truncate + tooltip, or wrap, with sensible min-widths).
**C6. Real UNC data as template.** ⚠️ *Send UNC's transfer-credit / requirements data and I'll seed the planner + Tar Heel Tracker with it instead of placeholder data.*
**C7. Notes like Notion (not a scratchpad).** → Notes become a small **database of note pages**; clicking one opens a **side peek panel** (Notion-style slide-over) to read/edit; no giant inline textbox.

## D. Home / Overview
**D1. "Appendix A" text bug.** Something renders "Appendix A" — remove it (it's leaking the brief's label into the roadmap line). → Fix the roadmap copy so it never shows source labels.
**D2. GPA stuff placed in/near the task bar feels off.** → Move GPA KPIs into their own clean stat row; keep the task bar focused on tasks only.
**D3. Task bar + Today's Focus need an archive/database.** → Persist all task/focus items; add an **"Archive / All items" view** (Reminders-app style) on a personal page where finished items live and can be **un-checked / restored**. Add a route for it.
**D4. Live "next event" widget (classmate's app idea).** → A home widget showing current time + **countdown to your next calendar event** ("25 min until …"), synced to Google/Notion calendar, set over the Ghibli background. ⚠️ *Send that inspiration when you can; calendar sync needs the Google auth from the brief.*
**D5. Quotes API swap.** → Point the daily quote at a better source/API (or a larger editable pool). ⚠️ *Tell me a preferred source if you have one; else I'll pick a reliable free quotes API.*

## E. Mascot (ram)
**E1. Don't let it block content.** Currently it scrolls/floats over the screen (bad in Academics/GPA). → Make the mascot **fixed in a reserved blank corner** (not following scroll, not overlapping content). Each page reserves a small "mascot nook" of whitespace; the speech-bubble tip sits there.
**E2. Final art.** Keep the ram; swap the placeholder SVG for the **Ghibli-style art** (warm, hand-drawn — like your Totoro/cat refs). ⚠️ *Send ram reference pics; I'll generate the art and drop it in (one-line swap).*

## F. MCAT (needs the most work)
**F1. Reorder: put the tab bar (Schedule · Score Tracker · Error Log · Resources) at the TOP**, directly under the section title — above everything else.
**F2. Kill the 4 top squares** (don't serve a purpose / waste space) — replace with the tab nav + meaningful content.
**F3. Schedule = a visual timeline/guide**, divided into **phases** (Content Review → Practice → Full-lengths → final), not a checkbox list. A graphic study roadmap.
**F4. Error log rebuild.** Not a table-with-textbox. → A proper **error-log entry system**: structured cards per missed question (topic, section, why-missed, fix, source), filterable by topic/section, with quick-add. Interactive, not a textarea.
**F5. Resources sub-tab:** keep the Content Review / Practice / Full-length grouping, but each item is a **clickable link that opens another tab/page** (placeholders OK).
**F6. Score tracker = low priority** (you'll likely take it twice) — keep minimal.

## G. Extracurriculars (rebuild — NOT an hours tracker)
**G1.** Convert from an hours tracker to an **organization database**: one entry per club/sport/org. → Each org card opens a profile with: type, your role, **experiences/reflections** (write-ups), **opportunities**, **calendar/events**, links. Placeholders fine (you don't know clubs yet). This is a per-organization tracker, not an hour log.

## H. Essays & notes pattern (you LOVE this — extend it)
**H1.** The reflections pattern (a tab → click → opens a writing space) is the model. → Apply this **interactive open-to-write pattern everywhere there's currently a scratchpad/plain textbox** (notes, brain dumps, etc.): click a card → side peek or full editor, not an always-open textarea.

## I. Profile
**I1. Rebuild as an organized layout** (not a flat list). → Clean sectioned profile (identity, stats, links) with grouped fields.
**I2. Drop "Relevant coursework" long list.**
**I3. Keep** the edit-syncs-to-database behavior (you like it).
**I4. Editable profile photo (bottom-left):** import / take photo / **drag-and-drop from files** (dropzone) → stored locally.

## J. Cleanup / minimalism
**J1. Remove "Appendix A" + the "UNC chapter" label top-left + the explainer descriptions** ("this is your command center" type text). Keep it minimalist now; strip all explainer copy as we go.
**J2.** General: no decorative explainer blurbs anywhere.

---

## ⚠️ What I need from you (unblocks several items)
1. **Ghibli background art** file(s) — for A1 + D4 + the hero banner.
2. **Ram reference pics** — for E2 (final mascot art).
3. **UNC transfer-credit / requirements data** — for C6 (real template data).
4. **Inspiration** for: the live "next event"/calendar widget (D4), and the Notion assignments/profile look you mentioned.
5. Preferences (optional): quotes source (D5), sidebar pin shortcut key (B1).

## Suggested priority order
1. **Theme + font + Ghibli banner/background** (A1–A3) — biggest "feels vanilla" win, sets the vibe.
2. **Cleanup bugs** (D1 "Appendix A", J1 labels) — quick, removes the junk.
3. **Mascot fixed-nook placement** (E1) — stops it blocking content.
4. **Sidebar collapse + top-bar quick info + search upgrade** (B1, B3, B4).
5. **Academics rework** (C1–C7) — the big one.
6. **MCAT rework** (F1–F6).
7. **Extracurriculars rebuild** (G1), **Profile rebuild** (I1–I4), **archive view** (D3), **notes/peek pattern** (H1).
8. **Art swaps + real data** once you send assets (A1 final, E2, C6, D4).
