# Knowledge Sources — external-data dependency map

**Status:** Living inventory
**Why this exists:** many Premed OS features need **external knowledge**. A coding agent must **not** fetch or research this live — it will hallucinate or go stale. Knowledge is acquired **ahead of build time** and the coding agent builds against a clean data interface.

## Two distinct kinds of knowledge (do not mix)

There are **two separate pipelines**, with different sources, trust levels, and consumers:

### Category A — App reference data (factual, authoritative)

Powers the app's **features and deterministic logic**. Must be correct.

- **Nature:** factual, structured, relatively stable (UNC requirements, med-school stats, MCAT content structure, course catalog, cycle dates).
- **Source:** official/authoritative only — `catalog.unc.edu`, AAMC, MSAR, AACOM.
- **Pipeline:** research → **vetted, source-cited dataset** committed to the repo (`data/*.json`). Human-reviewed.
- **Consumer:** the app's own logic. The requirement audit *checks against* this; School List is *built on* this. Deterministic.
- **This is NOT Atlas.** It is app configuration/reference data.

### Category B — Atlas crowdsourced knowledge (advice, for the user)

Guides **your decisions** — it does not power app logic.

- **Nature:** experiential, community wisdom, opinion, "what pre-meds/doctors report" (course-difficulty intel, pathway wisdom, ahead-of-herd pacing, resource recs).
- **Source:** community/experiential — forums, social, doctors, current pre-meds, **your uploads**.
- **Pipeline:** **Atlas** ingestion → AI extraction → structured, **cited** claims in Atlas's knowledge graph.
- **Consumer:** you. Surfaced as *advisory suggestions*, always cited and clearly distinguishable from fact (`architecture/02` trust separation).

### The rule

**Never let Category B drive a Category A decision.** The requirement audit runs on authoritative requirement data — never "someone said." Atlas advice can *inform* suggestions (e.g., which elective you'd enjoy) but never overrides a fact or a deterministic check. Official tier > community tier, always (`02` source hierarchy).

## The build pattern (both categories)

- Knowledge is acquired ahead of time; the coding agent builds against a **`data/*.json` file (Cat A)** or the **Atlas API (Cat B)** — never a live URL.
- Every record carries its own `source` URL + `retrievedAt`. When the world changes, update the *data*, not the code.
- The feature spec references the data interface, not the source URL.

---

## Category A — App reference datasets (build these; official sources)

Priority: 🔴 blocks the feature · 🟡 enhances · ⚪ future.

| Dataset | Powers | Source | Pri |
|---|---|---|---|
| `data/unc-requirements.json` — IDEAs in Action gen-ed, per-major reqs, med prereqs | Requirements audit | catalog.unc.edu | 🔴 |
| `data/med-schools.json` — stats, prereqs, mission, deadlines | School List tab | MSAR, AAMC, school sites | 🔴 |
| `data/mcat-content.json` — AAMC content outline, section structure, score/percentile bands | MCAT features | AAMC | 🔴 |
| `data/unc-courses.json` — course catalog + descriptions | Planning outlook, prereq validation | catalog.unc.edu | 🟡 |
| `data/cycle-dates.json` — AMCAS/AACOMAS open/submit/deadline dates | Timeline, roadmap | AAMC/AACOM | 🟡 |
| `data/secondary-prompts.json` — per-school secondary essay prompts | Essays | school sites/archives | 🟡 |

## Category B — Atlas knowledge (crowdsourced; guidance, not app logic)

| Knowledge | Guides | Source | Pri |
|---|---|---|---|
| Course-difficulty intel ("CHEM 251 is a GPA-dip") | Academics planning suggestions | UNC pre-med community | ⚪ |
| Pathway wisdom (what pre-meds/doctors report) | Roadmap, advising | community, doctors | 🟡 |
| Ahead-of-herd pacing / "the proper roadmap" | Overview roadmap | AAMC + your uploads | 🟡 |
| Elective/seminar recommendations by interest | Planning advisor | catalog + community | 🟡 |
| Opportunity discovery (positions, programs) | Clinical/Research/Volunteering | external listings | ⚪ |

## What needs NO external knowledge (build freely now)

The shell, Overview layout, Class Center study hub + FSRS (`ts-fsrs`), GPA engine, What-if, task/timeline system, inspector/peek patterns, mode switch, most UI. Only the datasets/knowledge above are gated.

## Research backlog (produce Category-A datasets, in order)

1. 🔴 `data/unc-requirements.json` — unblocks the audit rebuild.
2. 🔴 `data/med-schools.json` — unblocks School List.
3. 🔴 `data/mcat-content.json` — unblocks MCAT features.
4. 🟡 course catalog, cycle dates, secondary prompts.

Category-B knowledge waits on the Atlas pipeline (or a light interim writeup where a feature needs it sooner).
