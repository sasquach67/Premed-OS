# UNC planning requirements and course-catalog foundation (2026–2027)

**Status:** consolidated research/specification input; not an official degree audit or a completion engine.  
**Official-source retrieval date:** 2026-08-25. **Repository inventory date:** 2026-08-26.  
**Source policy:** retained requirement claims link only to UNC-owned pages. Discovery used Exa (55 results across seven queries); reconciliation directly read 11 distinct owner pages. This packet consolidates `unc-tar-heel-tracker-major-requirements-2026-27-v2.md` and `unc-tar-heel-tracker-planning-library-foundation-2026-27.md` and corrects their conflicts.

## 1. Product boundary and source origins

This may display a **catalog-based plan for a selected program, track, and cohort**. It must not claim that a student is cleared to graduate or replace the student's ConnectCarolina Tar Heel Tracker. UNC tells enrolled students to consult their Tracker alongside the catalog; a student's applicable curriculum normally follows their matriculation-year catalog, and catalog rules are not necessarily valid beyond the published academic year. [Undergraduate Catalog](https://catalog.unc.edu/undergraduate/)

The owners are distinct:

| Need | Owner / origin | Planning treatment |
|---|---|---|
| University and degree rules | [undergraduate degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) | Source-versioned global constraints. |
| General education and historical cohorts | [IDEAs in Action](https://catalog.unc.edu/undergraduate/ideas-in-action/) and [catalog archives](https://catalog.unc.edu/undergraduate/archives/) | Exact catalog snapshot selected by cohort. |
| Major, degree, track, and course-list rules | [Programs A–Z](https://catalog.unc.edu/undergraduate/programs-study/) and its individual program pages | Requirement graph with source locator and option sets. |
| Published course descriptions/prerequisites | [Courses A–Z](https://catalog.unc.edu/courses/) and subject pages | Catalog-course facts only, versioned separately from requirements. |
| Live sections, seats, restrictions, attributes, instructor, and registration eligibility | ConnectCarolina/current registrar course search | Live verification; never infer from the catalog. |
| Student-specific fulfillment, transfer/AP/IB credit, substitutions, waivers, declaration, and admission/progression | ConnectCarolina Tracker, official evaluation, and advisor/program records | External evidence; never reconstructed from a course code. |

## 2. University layer and cohort boundary

For a 2026–27 catalog snapshot, the global rules are: at least **120 semester hours** (some B.S. curricula are higher), final cumulative UNC GPA of **2.000**, all applicable IDEAs requirements, and at least **45 UNC–Chapel Hill academic hours**. General Education courses cannot be Pass/Fail; Gateway, Prerequisite, and Additional Requirement courses also cannot be Pass/Fail. B.A. students additionally have Supplemental General Education, and College of Arts & Sciences B.A. students have the catalog's subject-code cap. These require officially evaluated credit and must not become local completion verdicts. [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) · [Supplemental General Education](https://catalog.unc.edu/undergraduate/ideas-in-action/supplemental-general-education/)

### IDEAs in Action

The current page applies to degree-seeking first-year and transfer students who enroll in fall 2022 or later, but **the listed 2026–27 requirements are specifically for students beginning in fall 2026**. Students who began from fall 2022 through spring 2026 use the applicable archived edition; students who enrolled before fall 2022 use Making Connections. Do not encode a timeless `ideas-2022-2025` bucket. Store `ideasCatalogYear` (or a precise requirement term) and block a result when its matching snapshot is absent. [IDEAs](https://catalog.unc.edu/undergraduate/ideas-in-action/) · [archives](https://catalog.unc.edu/undergraduate/archives/)

For fall 2026, separate nodes are: First-Year Foundations (`IDST 101`, `IDST 111L`, First-Year Seminar/Launch, `ENGL 105`, Global Language through level 3); nine 3-credit Focus Capacities; one-credit Empirical Investigation Lab; Research and Discovery; High-Impact Experience **or** a second Research and Discovery; Communication Beyond Carolina; Interdisciplinary; Lifetime Fitness; Campus Life Experience (eight events/four categories); Foundations of American Democracy; disciplinary distribution; the major; and, for a B.A., Supplemental General Education. First-year timing, CAA/early-college cases, placement/by-exam credit, attributes at enrollment, R&D/HI non-duplication, CLE attendance, LFIT exceptions, and professional-program reductions are evidence/manual-review states. [IDEAs](https://catalog.unc.edu/undergraduate/ideas-in-action/) · [Foundations of American Democracy](https://catalog.unc.edu/undergraduate/ideas-in-action/foundations-american-democracy/)

### Admission-cohort exceptions

Gillings has five limited-enrollment B.S.P.H. majors—Biostatistics, Community and Global Public Health, Environmental Health Sciences, Health Policy and Management, and Nutrition. Students generally apply during sophomore year for junior-fall entry, and their requirements are those in effect **when admitted to Gillings**, not merely when they matriculated. Each program needs `admissionTerm`, `admissionStatus`, and official grade/evidence state. [Gillings undergraduate programs](https://catalog.unc.edu/undergraduate/schools-college/public-health/)

The same admission/progression separation applies to SDIS Data Science B.S., joint UNC/NC State BME, and clinical/professional programs. Nursing's current page states that its described requirements apply to students admitted in 2025–26 and beyond; retain that owner wording rather than inventing a 2026–27-only admission label. [Nursing](https://catalog.unc.edu/undergraduate/programs-study/nursing-major-bsn/)

## 3. Defined program and track register

Each row is a separate planning record or a required selection branch. **Validated summary** means the current owner page was reconciled, not that all option members/footnotes have been transcribed or automated. Every record below inherits the university layer and has `catalogYear: 2026-2027`, `retrievedAt: 2026-08-25`, and the linked source URL.

| Area | Records (separate degree/track/admission paths) | Proven catalog shape / non-automatable boundary | Official origin |
|---|---|---|---|
| Life science / chemistry | `biology-ba`, `biology-bs`; `chemistry-ba`, `chemistry-bs`; `neuroscience-bs` | Biology level/lab/exclusion logic; chemistry placement-credit restriction; NSCI elective lists, grade rules, and PSYC-double-major exception stay as constraint data. | [Biology B.A.](https://catalog.unc.edu/undergraduate/programs-study/biology-major-ba/) · [Biology B.S.](https://catalog.unc.edu/undergraduate/programs-study/biology-major-bs/) · [Chemistry B.A.](https://catalog.unc.edu/undergraduate/programs-study/chemistry-major-ba/) · [Chemistry B.S.](https://catalog.unc.edu/undergraduate/programs-study/chemistry-major-bs/) · [Neuroscience](https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/) |
| Physics / environment / engineering | `physics-ba`, `physics-bs-standard`, `physics-bs-astrophysics`; `earth-marine-sciences-bs`; `environmental-science-bs` + required concentration, `environmental-science-bs-qes`; `environmental-studies-ba` + required concentration, `environmental-studies-ba-sustainability`; `applied-sciences-bs-environmental-engineering`, `applied-sciences-bs-materials-engineering`; `biomedical-engineering-bs` | Tracks must not be collapsed. BME admission, NC State equivalencies, 45-hour/half-major joint-campus rule, and advisor approval are manual evidence. Concentration/elective lists and capstone approval need source-row capture. | [Physics B.S.](https://catalog.unc.edu/undergraduate/programs-study/physics-major-bs/) · [Environmental Science](https://catalog.unc.edu/undergraduate/programs-study/environmental-science-bs/) · [Environmental Studies](https://catalog.unc.edu/undergraduate/programs-study/environmental-studies-major-ba/) · [Applied Sciences](https://catalog.unc.edu/undergraduate/programs-study/applied-sciences-major-bs/) · [BME](https://catalog.unc.edu/undergraduate/programs-study/biomedical-engineering-major-bs/) |
| Statistics / data / computing | `statistics-analytics-bs`; `data-science-bs` with mutually exclusive `four-upper-electives` **or** selected concentration branch; `data-science-ba` with required concentration branch; `geospatial-data-science-bs`; `computer-science-bs` | Statistics uses published Group A/B logic—not a required Group B. Data Science B.S. requires SDIS application, seven prerequisites, C minimum, 3.0 cumulative GPA; its concentration is optional, not required. One course cannot satisfy two B.S. core nodes; DATA 890 is limited. | [Statistics and Analytics](https://catalog.unc.edu/undergraduate/programs-study/statistics-analytics-majors-bs/) · [Data Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-bs/) · [Data Science B.A.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-ba/) · [Geospatial Data Science](https://catalog.unc.edu/undergraduate/programs-study/geospatial-data-science-major-bs/) · [Computer Science](https://catalog.unc.edu/undergraduate/programs-study/computer-science-major-bs/) |
| Public health | `biostatistics-bsph`; `community-global-public-health-bsph`; `environmental-health-sciences-bsph-chemistry`, `-health-biology`, `-physics`; `health-policy-management-bsph`; `nutrition-bsph-health-society`, `nutrition-bsph-science-research` | Separate Gillings records/paths. C (not C-) rules, admission term/status, approved experiences, and director-approved substitutions remain evidence states. HPM has 57–59 table hours plus an 8-week/320-hour internship; CGPH `HBEH 555` has a 150-hour partner experience. | [Biostatistics](https://catalog.unc.edu/undergraduate/programs-study/biostatistics-major-bsph/) · [CGPH](https://catalog.unc.edu/undergraduate/programs-study/community-global-public-health-major-bsph/) · [EHS](https://catalog.unc.edu/undergraduate/programs-study/environmental-health-sciences-major-bsph/) · [HPM](https://catalog.unc.edu/undergraduate/programs-study/health-policy-management-major-bsph/) · [Nutrition](https://catalog.unc.edu/undergraduate/programs-study/nutrition-major-bsph/) |
| Human movement / clinical-professional | `exercise-sport-science-ba-general`, `-ba-fitness`, `-ba-sport-admin`, `exercise-sport-science-bs`; `clinical-laboratory-science-bs`; `neurodiagnostics-sleep-science-bs`; `radiologic-science-bs`; `nursing-bsn`; `dental-hygiene-bs` | EXSS degree variants are not interchangeable. CLS/NDSS/RADI/NURS/Dental admission, placement, clinical compliance, background/drug/health documentation, credential/licensure eligibility, and actual rotations are never course-code inference. NDSS current table is 81 hours; RADI's professional table is 72–74; Nursing's core table is 60. | [EXSS department](https://catalog.unc.edu/undergraduate/departments/exercise-sport-science/) · [CLSC](https://catalog.unc.edu/undergraduate/programs-study/clinical-laboratory-science-major-bs/) · [NDSS](https://catalog.unc.edu/undergraduate/programs-study/neurodiagnostics-sleep-sciences-major-bs/) · [RADI](https://catalog.unc.edu/undergraduate/programs-study/radiologic-science-major-bs/) · [Nursing](https://catalog.unc.edu/undergraduate/programs-study/nursing-major-bsn/) · [Dental Hygiene](https://catalog.unc.edu/undergraduate/programs-study/dental-hygiene-major-bs/) |
| Behavioral / population-health | `psychology-ba`, `psychology-bs`; `medical-anthropology-ba`, `anthropology-ba`, `sociology-ba`; `human-development-family-science-baed`; `economics-bs` | Preserve PSYC/NSCI cap and no-double-count rule, Anthropology approvals/concentrations, Sociology substitutions/duplicate-credit exclusions, and HDFS practicum/admission states. | [Psychology B.S.](https://catalog.unc.edu/undergraduate/programs-study/psychology-major-bs/) · [Medical Anthropology](https://catalog.unc.edu/undergraduate/programs-study/medical-anthropology-major-ba/) · [Anthropology](https://catalog.unc.edu/undergraduate/programs-study/anthropology-major-ba/) · [Sociology](https://catalog.unc.edu/undergraduate/programs-study/sociology-major-ba/) · [HDFS](https://catalog.unc.edu/undergraduate/programs-study/human-development-family-science-major-baed/) · [Economics](https://catalog.unc.edu/undergraduate/programs-study/economics-major-bs/) |

**Data Science concentration branch inventory.** B.A.: Data Journalism, Economic Analysis, Quantitative Language Science, Urban Data Analytics, Sociology, Data and Society, Geographic Information Science. B.S. (when the student selects the concentration alternative): Economic Analysis, Data Science in Politics, Urban Analytics, Sports Analytics, Quantitative Language Science, Operations Research, Mathematical Foundations, Decision Analytics, Statistical Learning and Data Analysis, Advanced AI and Machine Learning, Health Informatics. These must be separate subtrees (or distinct records); no concentration can be silently selected. [Data Science B.A.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-ba/) · [Data Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-bs/)

## 4. Normalized source and requirement schema

```ts
type Provenance = {
  catalogYear: string; retrievedAt: "YYYY-MM-DD"; sourceUrl: string;
  sourceLocator: string; // heading/table/footnote or stable excerpt locator
  sourceHash?: string;   // detects a revised owner page
};

type ProgramRecord = Provenance & {
  id: string; title: string; degree: "BA" | "BS" | "BSPH" | "BSN" | "BAEd" | "other";
  trackId?: string; parentId?: string;
  applicability: "matriculation-term" | "admission-term";
  admissionModel: "open" | "selective" | "professional" | "joint-campus";
  rootNodeIds: string[];
};

type RequirementNode = Provenance & {
  id: string; owner: "university" | "ideas" | "program" | "track";
  kind: "all_of" | "choose_n" | "any_of" | "minimum_credits" | "course_range" |
        "attribute" | "grade_minimum" | "residency" | "experience" |
        "admission_gate" | "manual_review";
  children?: string[]; courseRefs?: CourseRef[]; minCount?: number; minCredits?: number;
  exclusions?: ExclusionRule[]; noDoubleCountWith?: string[];
  overlapPolicy: "allow" | "forbid" | "limited" | "source-defined";
  evidencePolicy: "catalog_only" | "student_record" | "advisor_or_program";
};

type CourseRef = { subject: string; number?: string; crossListGroup?: string; catalogYear: string };
type ExclusionRule = { appliesTo: string[]; reason: string; sourceLocator: string };
```

Evaluation must retain the tree. A planned/recorded course can be a **candidate match** only; it never turns `catalog_only` data into official fulfillment. Resolve `choose_n`, minimum-credit lists, exclusions, cross-lists, grade thresholds, and no-double-count constraints before presenting a local planning relationship. Send transfer equivalencies, placement credit, term-specific course attributes, petitions, clinical clearance, admission, and approvals to `manual_review` unless the user supplies owning official evidence.

## 5. Acquisition, update, and live-data strategy

**Required per source row:** `recordId`, `nodeId`, catalog year, requirement term/applicability, program/degree/track, source URL, retrieved-at date, source locator, source hash, full course/option members, credit/grade/minimum rules, exclusions/overlap policy, evidence policy, and snapshot status. Preserve raw owner wording for approved/permission-only items.

**Refresh:** re-fetch the Catalog home, Degree Requirements, IDEAs, Programs A–Z, each selected program page, and relevant course-subject pages each summer when UNC publishes a catalog. Compare source hash and requirement rows; create a new snapshot rather than overwrite a prior catalog. Add an archived snapshot before offering an older cohort. Revalidate program-admission content separately; Gillings and professional programs are admission-term governed.

**Catalog vs live availability:** catalog course entries support published title, credit, and prerequisite/co-requisite planning. They do not establish that a section runs in a particular term, has seats, accepts the student, has the same attribute, lab/recitation pairing, instructor, modality, or approval path. Those are live ConnectCarolina/registrar facts and must be labeled “verify in live course search.” [Undergraduate Catalog](https://catalog.unc.edu/undergraduate/) · [Courses A–Z](https://catalog.unc.edu/courses/)

## 6. Repository data inventory and explicit limits

Inventory at 2026-08-26:

| Asset | What it is | What it is not |
|---|---|---|
| `premed-hq-documentation/data/unc-requirements.json` | Legacy partial planning data: 23 general-education rows, 9 medical-prerequisite rows, and 6 major entries. Its metadata itself flags five majors for live spot-check and calls its scope partial. | Not the consolidated library, no admission/track/option-graph schema, and not a personal audit. |
| `src/lib/academics/uncPlanningLibrary.ts` | Current source-versioned summary library: 46 program/degree/track records, local candidate-plan coverage, explicit official-audit safety rail. | Not a complete option/elective-row corpus or course catalog; local matches cannot establish completion. |
| `src/lib/types.ts` and `src/store/migrations/planningLibraryV36.ts` | Local planning-context fields/migration only. | Not an official declaration, requirement term, admission decision, or evidence connection. |
| UNC research notes under `premed-hq-documentation/data/` and `implementation/research-prompts/` | Source-oriented research and prior packets. | Not machine-complete course/requirement data. |

**Determination: no complete searchable course catalog exists in this repository.** There is no complete, normalized 2026–27 UNC course dataset, no course-to-requirement/attribute mapping for every catalog course, and no live-section search/index. The official Courses A–Z site is the owner for published course entries, but it is not a substitute for a locally acquired, versioned searchable dataset or live registration data. A later acquisition task must build subject-by-subject source snapshots and only then expose local search; it must never fabricate availability from catalog text.

## 7. Proven, unresolved, and excluded states

**Proven/current-owner summaries:** university baseline; fall-2026 IDEAs boundary; Gillings admission-term rule; the 46 listed record paths; HPM, NDSS, RADI, and Nursing now have directly readable current catalog tables. Their former “official source gap” label is obsolete **at summary level**.

**Unresolved official-source extraction gaps:** every program still needs its complete source-located option/elective member tables, footnotes, cross-list treatment, and historical snapshots before automated local evaluation; exact current admission deadlines/decisions, transfer articulation, course attributes at enrollment, clinical placement/compliance, approved alternatives, and exceptions remain outside publicly usable requirement logic. Do not guess any of these.

**Excluded by definition:** minors; graduate-only programs; unrelated majors selected merely because a pre-health student could choose them; medical-school prerequisite determinations; and a generic “Public Health” record. Medical-school prerequisites are school-specific, and the public-health universe is exactly the five Gillings B.S.P.H. majors above. [Gillings](https://catalog.unc.edu/undergraduate/schools-college/public-health/)

## Totals and next safe step

- **46** current source-versioned program/degree/track planning records in the repository library.
- **5** Gillings B.S.P.H. majors, represented through **7** current public-health paths (three EHS concentration paths and two Nutrition tracks).
- **18** named Data Science concentration branches: **7 B.A. required** and **11 B.S. optional-alternative** branches.
- **55** Exa discovery results reviewed; **11** distinct official UNC owner pages directly fetched during reconciliation; retained claims above cite their owner URLs and were retrieved 2026-08-25.
- **0** complete local searchable UNC course catalogs; **0** basis for replacing an individual ConnectCarolina Tar Heel Tracker.

Next safe step: acquire one selected program's full 2026–27 course/option/footnote rows into the schema above, test choice/exclusion/no-double-count behavior against synthetic cases, then show only catalog-based candidate planning with source and manual-review states.
