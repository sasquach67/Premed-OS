# Settings

**Status:** Stub — seeded outline (structure + anchors in place; full spec TBD).
**Sidebar group:** Support · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Preferences, backup/sync, theme, archive, export, account/reset
- **References only:** —

## Primary metrics (from architecture/04 — domain-appropriate only)

- None (global configuration, not domain data)

> **Do-not-generalize anchor:** Settings holds global config only. Archive and export live here (per shell redirects); do not scatter these controls into domain tabs.

---

## Purpose

Define the exact user outcome this tab supports.

## Primary users and stages

Which user stages rely on this tab and how needs change over time.

## Core entities

Records that belong here and the universal entities they reference.

## Core views

Purpose-built views, not a copied dashboard.

## Main workflows

Creation, editing, review, planning, export, archive.

## Smart features

Tab-specific rules, alerts, derived properties, recommendations, automations (per `architecture/02`).

## Visualizations

Charts/structures and the user question each one answers.

## Cross-tab relationships

Which tabs consume or contribute data.

## Inspector design

Object-inspector sections and quick actions (pattern: `specifications/01-shared-interface-patterns.md`).

## Empty, loading, and error states

First-use guidance and recovery.

## Mobile behavior

How the tab stays fully usable on small screens.

## Admissions-aware reasoning

What matters here from a pre-med and application perspective.

## Do Not Generalize From Other Tabs

Settings holds global config only. Archive and export live here (per shell redirects); do not scatter these controls into domain tabs.

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ OBLIGATIONS ADDED Aug 2026 — this tab now owns real safety surface

### 1. ⭐ Per-entry *keep local, never send* (`SB-73`)

**Story Bank now holds a LIFE JOURNAL** (`09` §6) — family, mental health, things the student would never put in an application. **Synthesis reads the whole bank on every call.**

**Settings owns the global side of this:**

- **A plainly worded statement of what leaves the device and when.**
- **The first-call warning** (`SB-75`) **naming the journal explicitly, not "your data."**
- **⚠️ `SB-76` OPEN — export is all-or-nothing today** and ships the journal with everything else. **Needs a scope choice, and Settings is where it lands.**

**⚠️ `SB-73` is NOT the cut `sentToStoryBank` gate.** **That asked *"is this good essay material?"* — a judgement of worth. This asks *"should this ever leave my device?"* — a privacy boundary.** **Both are booleans on a reflection. If a future reader collapses them, the gate is back.** **Full distinction: `09` §6a.**

### 2. The API key

**`U-2` — every base capture path works with no key.** **`U-10` — AI is invoked, never assumed.** **Settings holds the key; nothing in the app requires one.**

**Precedent for a second user-supplied key: `B-7c` Zotero** (read-only, CORS-supported). **Same pattern.**

### 3. Theme

**Warm dark default; light "paper" is a user toggle. Every surface must work in both** (`CLAUDE.md`).

### 4. `U-12` — no incumbent
