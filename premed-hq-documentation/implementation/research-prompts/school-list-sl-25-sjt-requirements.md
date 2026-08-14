# Research packet — School List `SL-25`: PREview and CASPer requirement data

**Question.** Is per-school PREview/CASPer requirement data stable and enumerable enough to ship as a maintained roster field?

**Scope.** Current official AAMC, TMDSAS, and Acuity/official-provider routes only. This is evidence for a later schema/product ruling, **not** a ruling and not an authorization to populate `admissionsTests`.

**Accessed:** 2026-08-13

## Findings

| Topic | Official evidence | What can be stated safely |
|---|---|---|
| **AAMC PREview participation** | AAMC's current 2026 testing-year list identifies four participation levels and explicitly says the list will be updated as schools confirm participation. | PREview use is not a permanent boolean. The current source exposes at least `require`, `recommend`, `SJT required—PREview satisfies`, and `exploring future use`, each with materially different application-completeness meaning. |
| **PREview completeness** | AAMC says a requiring school, and a school requiring an SJT that PREview satisfies, may not consider an application complete until it receives a score. AAMC also says applicants should check the school or AMCAS for the current program. | Completion is conditional on a school/cycle/tier; no global “takes PREview” badge is sufficient. |
| **CASPer / TMDSAS** | TMDSAS currently lists eight medical programs requiring CASPer and gives school-specific completion language. It says results are valid for one admissions cycle. | CASPer is likewise cycle-bound and school-specific. At least six listed programs connect a score directly to interview consideration, screening eligibility, or admission eligibility; the exact completion condition varies. |
| **CASPer provider-wide list** | This pass did not locate a public, versioned Acuity Insights list that gives an auditable count of U.S. MD and DO programs, their requirement tiers, and historic snapshots. TMDSAS is a current official subset, not a national program list. | **No defensible nationwide count or churn number can be reported from the sources found.** |
| **Annual churn** | AAMC says its current list is updated as schools confirm participation; its applicant guidance tells students to look for an updated list each February. This pass did not find two prior published, machine-readable historical lists or a provider-issued join/leave change log for either exam. | Update cadence is verified; numeric join/leave churn is **not** established. Do not invent it from a current list. |

## Primary-source evidence

### AAMC PREview

- [2026 participating schools](https://students-residents.aamc.org/aamc-preview/participating-schools) — current 2026 testing-year / 2027 application-year list. AAMC defines four levels: requiring PREview; recommending PREview; requiring an SJT that PREview satisfies; and exploring PREview for future use. It says the list will be updated as more schools confirm participation. Accessed 2026-08-13.
- [2026 PREview Essentials — participating schools](https://students-residents.aamc.org/aamc-preview/publication-chapters/participating-schools) — states a requiring-school application is not complete until a PREview score is provided; a recommending school may review with or without a score; an SJT-requiring school may accept PREview to meet that requirement; and an exploring school will not use the score in the current cycle's admission decision. Accessed 2026-08-13.
- [AAMC PREview scores / AMCAS](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/aamc-preview-scores) — directs applicants to consult schools or MSAR to ensure current test-date requirements and says score access is limited to requiring/recommending schools designated in AMCAS. Accessed 2026-08-13.
- [AAMC's 2026 applicant guidance](https://students-residents.aamc.org/premed-navigator/what-know-about-aamc-preview-exam-2026) — says an initial list is posted early February and updated as schools finalize admissions requirements. Accessed 2026-08-13.

### CASPer / TMDSAS

- [TMDSAS — next steps after submitting](https://www.tmdsas.com/application-guide/after-submitting.html#casper) — current service page. It names **eight** current medical programs in its CASPer section: Baylor; UTMB John Sealy; McGovern; Sam Houston State COM; Texas Tech Paul L. Foster; UT Southwestern; UT Tyler; and UT San Antonio Long. The same page states that CASPer results are valid for one admissions cycle, then records each school's specific requirement/completeness language. Accessed 2026-08-13.
- [TMDSAS schools](https://www.tmdsas.com/about/TMDSAS_schools.html) — current TMDSAS directory flags CASPer-required programs where the service has recorded that status. Accessed 2026-08-13.

## Completion coupling: concrete current examples

The TMDSAS page itself shows that an abstract `requiresCasper: true` loses important state:

| School | Current TMDSAS wording | What differs |
|---|---|---|
| Baylor | Score required to be considered for interview. | Interview gate. |
| UTMB | Successful completion mandatory to maintain admission eligibility for screening. | Screening-eligibility gate. |
| McGovern | Score required to be considered for interview. | Interview gate. |
| Texas Tech Paul L. Foster | Current CASPer mandatory to maintain eligibility; score must arrive before interview consideration. | Current-cycle plus interview gate. |
| UT Southwestern | Score must be on file by interview date. | A different timing condition. |
| UT Tyler / UT San Antonio / Sam Houston | Require/should complete CASPer, but the public wording differs in strength and described consequence. | Tier/wording cannot be normalized without a declared policy. |

## Evidence-backed implications — non-binding

1. If a later feature stores school-entered or maintained SJT information, its minimum shape must preserve **exam, cycle, requirement level, source URL, source check date, and wording/effect on completeness**. A boolean cannot represent AAMC's four PREview levels or TMDSAS's distinct CASPer consequences.
2. A current `null` value has no applicant meaning. It should not be rendered as “not required,” “unknown but safe,” or zero participation.
3. The most defensible interim is student-entered or source-linked data for the schools the student actually tracks, with a visible current-cycle date—not an apparently complete 240-school roster field.
4. The evidence confirms annual updates, but **does not prove a numeric churn rate**. A maintenance decision should not be based on an invented join/leave count.

## Explicit non-findings and limits

- The AAMC public page reviewed is a dynamic list. This pass verified its tiers and update behavior but did not extract a reproducible total count from the rendered page.
- No official, versioned Acuity Insights national MD/DO participating-program export—or historical snapshots suitable for computing prior-two-cycle churn—was found in this pass.
- No two prior AAMC lists with stable identifiers were recovered here, so this packet does not report joined/left totals for PREview.
- This packet does not decide whether the existing all-null `admissionsTests` keys are deleted, populated, or made student-entered; it does not alter data or code.
