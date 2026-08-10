# Data Refresh — keeping reference data live

**Status:** Approved for implementation
**Depends on:** `implementation/knowledge-sources.md`, `specifications/00-product-shell.md` (Attention bell §7.5), `architecture/02-global-intelligence-framework.md` (monitoring, freshness, automation-with-approval)

## Purpose

Category-A reference datasets (`data/*.json`) are point-in-time snapshots. Real-world sources change (UNC catalog yearly, med-school stats each cycle). This subsystem keeps them current **without ever silently overwriting authoritative data**.

**Core principle: automated *detection*, human-approved *updates*.** Detection runs live and constantly; applying a change is one-click and gated by a person. Auto-applying a scrape could silently corrupt a graduation audit or a school comparison — the approval step is the safety valve, not a limitation.

> **This subsystem keeps the *dataset* fresh. It does not keep *conclusions
> derived from it* fresh** — a requirement marked met under the 2026 catalog
> carries no record of which catalog year judged it, so a 2028 restructure makes
> that verdict silently wrong while the freshness chip still reads green.
> Derived conclusions must be stamped with the dataset version that produced
> them, re-derived and diffed on update, and never silently flipped. See
> `implementation/long-horizon-durability.md` §D4.

## The user's role (total effort)

1. Get an alert in the Attention bell: *"UNC requirement data: 1 change detected."*
2. Click it → see the diff (old vs. new) → **Approve** or **Dismiss**.
3. On approve, the agent re-fetches + produces the verified update; user signs off; data is saved with a new `retrievedAt` and `source`.

Roughly once/year for UNC, once/cycle for med schools. No monitoring, no research, no JSON editing.

## Freshness metadata (on every dataset)

Each `data/*.json` `meta` carries a `freshness` block:

```json
"freshness": {
  "refreshCadence": "annual | per cycle | rare",
  "reason": "why it changes",
  "sourceToMonitor": "canonical URL to diff against",
  "lastVerified": "YYYY-MM-DD",
  "reviewBy": "YYYY-MM-DD",
  "churn": "low | high"
}
```

Already applied to `unc-requirements.json`, `mcat-content.json`, `med-schools.json`.

## Two mechanisms

### 1. Staleness reminder (trivial, ship first)

If `today > reviewBy`, the app raises a **suggested** item in the Attention bell: "{dataset} is past its review date — re-verify." No fetching required; pure date check. Guarantees data is never trusted silently-stale.

### 2. Change-detection job (the live part)

A **scheduled task** (cadence per dataset, e.g. monthly) that:

1. Re-fetches `sourceToMonitor`.
2. Diffs key fields against the committed dataset (names, credits, requirement lists / school stats).
3. On divergence, raises an **important** Attention item with the diff.
4. User approves → agent re-fetches the affected records, re-verifies, and produces the updated slice (same verify-and-merge flow used to build these files) → user signs off → committed with new `retrievedAt`/`source`.

Gated: the job **proposes**, never applies. Diffs are records + sources, so the user sees exactly what changed and why.

## Per-dataset cadence

| Dataset | Cadence | Churn | Notes |
|---|---|---|---|
| `unc-requirements.json` | annual (summer catalog rollover) | low | Watch focus-capacity names, requirement adds/removes |
| `mcat-content.json` | annual (percentiles) / rare (structure) | low | Structure stable since 2015; percentile window refreshes each May |
| `med-schools.json` | per cycle (annual) | high | **First customer** — 203/206 stat profiles unfilled; pipeline fills priority schools first |

## Med-schools: the first customer

`med-schools.json` is a 206-school **directory** with 99% of admissions stats unfilled (honestly flagged `profileStatus`/`confidence`). It is the ideal first job for this pipeline because stats are the highest-churn data in the app:

- Fill priority schools first — NC schools + the user's target list — via the detection/approve flow.
- Expand coverage over cycles; unfilled schools remain directory-only (still usable for browsing) until their stats are approved.
- Never fabricate stats; a school shows "stats pending" until verified.

## Long-term: Atlas owns it

This monitoring/diff/alert loop maps directly onto `architecture/02` (monitoring, stale-context detection, freshness, automation-with-approval). Long-term, Atlas runs the detection and re-extraction; the human-approval step stays. Same Attention-bell surface either way.

## Acceptance criteria

- [ ] Every `data/*.json` has a `freshness` block; app raises a suggested Attention item when `today > reviewBy`.
- [ ] A scheduled change-detection job re-fetches `sourceToMonitor`, diffs, and raises an important Attention item on divergence — showing the record-level diff.
- [ ] Updates are **never** auto-applied; approval triggers a re-fetch + verify flow; committed data gets a fresh `retrievedAt`/`source`.
- [ ] Med-schools stats fill priority-first; unfilled schools render as directory-only, never with fabricated stats.
- [ ] Alerts surface in the shell Attention bell (§7.5), severity: reminder = suggested, detected-change = important.
