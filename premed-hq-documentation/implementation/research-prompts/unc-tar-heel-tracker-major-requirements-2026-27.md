# Research packet — Tar Heel Tracker: UNC major-requirement source library (2026–2027)

**Question.** Do we have enough authoritative information to make the Tar Heel Tracker useful, and which additional UNC majors can be collected safely next?

**Scope.** Official UNC–Chapel Hill sources only. This is a source-and-data packet, not a product ruling and not an edit to `data/unc-requirements.json`.

**Accessed:** 2026-08-13  
**Catalog version:** [UNC–Chapel Hill 2026–2027 Academic Catalog](https://catalog.unc.edu/undergraduate/). UNC publishes its catalog annually. The current IDEAs page applies its listed requirements specifically to students beginning at Carolina in fall 2026; students in earlier cohorts must use their archived catalog edition. [Source](https://catalog.unc.edu/undergraduate/ideas-in-action/).

## Short answer

**Yes, the tracker has a solid authoritative base**, including a current university-wide degree layer, the full 2026–2027 IDEAs layer, and direct official major pages for the requested high-demand pre-med majors. The existing `data/unc-requirements.json` already contains the first six common majors, but five are explicitly marked “needs spot-check.” This packet supplies that official-source spot check; it deliberately does **not** mutate the dataset.

**No, it cannot honestly present itself as a student’s official graduation audit yet.** UNC states that total graduation requirements are determined in each student's ConnectCarolina Tar Heel Tracker. A complete individualized answer also depends on the student's matriculation/admission catalog year, declared degree/track, transfer articulation, AP/IB awards, substitutions, and approved exceptions. [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/).

The correct product boundary is therefore: **a transparent planning library that shows what the catalog says for a selected program and cohort—not “you are cleared to graduate.”**

## Coverage and unknowns

| Surface / major | Coverage in this packet | What remains unknown or must stay student-specific |
|---|---|---|
| University degree baseline | **Verified current**: 120-hour minimum, GPA, IDEAs, UNC-residence rule | Student's catalog cohort, degree-specific exceptions, actual awarded credits |
| IDEAs in Action | **Verified current**: all current requirement families and key policy constraints | Exact student cohort before fall 2026; course attributes and approved substitutions at enrollment time |
| Neuroscience B.S. | **Verified current** core, additional requirements, total, and source of both elective sets | Student's selections inside elective lists, prerequisites, transfers, and double-counting outcome |
| Biology B.S. | **Verified current** core, option groups, lab/depth rules, total | Every elective choice, catalog-listed exclusions, transfer and approved equivalencies |
| Chemistry B.S. | **Verified current** structured core, elective/lab/capstone rules, total | Individual advanced-elective selection and any program-specific approval |
| Psychology B.S. | **Verified current** breadth, quantitative, allied-science, and credit-cap rules | Selected program-area courses, special-requirement course, double-major exception use |
| EXSS B.S. | **Verified current** core, selection groups, allied-science constraint, total | The B.A. tracks are separate programs and have not been merged into this B.S. record |
| Gillings public health | **Verified** that no generic “Public Health” major exists; CGPH B.S.P.H. collected | The other four B.S.P.H. programs and each student's Gillings admission cohort / status |
| Biomedical Engineering B.S. | **Verified current** admission gate, joint-campus rules, core, option structure, total | Admission decision, NC State course attribution, advisor-approved electives / specializations |
| Official personal audit | **Not publicly collectable** | ConnectCarolina Tar Heel Tracker, transfer articulation, AP/IB awards, waivers, substitutions, and approved exceptions |

## Authoritative source hierarchy

| Need | Authoritative source | Use in a future library |
|---|---|---|
| University-wide rules | [Undergraduate Degree Requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) | Baseline constraints, not a substitute for a student audit. |
| General education by matriculation cohort | [IDEAs in Action Curriculum](https://catalog.unc.edu/undergraduate/ideas-in-action/) and [catalog archives](https://catalog.unc.edu/undergraduate/archives/) | Select by cohort; never apply the current page to every student. |
| Program / degree / track | Current `catalog.unc.edu` program page | Store the exact program key, degree, track, catalog year, page URL, and retrieved date. |
| Personal fulfillment and exceptions | Student-supplied Tar Heel Tracker / official advising or ConnectCarolina record | Display as student-provided official audit information; do not infer it from a raw course code. |

## University-wide layer that the tracker needs

For a current 2026–2027 student, the university layer is explicit:

- At least **120 semester hours**, a final cumulative UNC GPA of **2.000**, all applicable IDEAs requirements, and at least **45 UNC–Chapel Hill academic hours** are required. Some B.S. curricula exceed 120 hours. [Source](https://catalog.unc.edu/undergraduate/degree-requirements/)
- The 2026 IDEAs version includes First-Year Foundations (IDST 101, IDST 111L, a First-Year Seminar/Launch, ENGL 105, and Global Language through level 3); nine 3-credit Focus Capacities plus a one-credit Empirical Investigation Lab; Reflection & Integration requirements; Foundations of American Democracy; and the three-division disciplinary distribution. B.A. degrees additionally require Supplemental General Education. [Source](https://catalog.unc.edu/undergraduate/ideas-in-action/)
- IDEAs rules are not a generic “27-credit Gen Ed” checklist. The current catalog also includes Communication Beyond Carolina, Interdisciplinary, Lifetime Fitness, Campus Life Experience, and Foundations of American Democracy; cohort and double-counting rules matter. [Source](https://catalog.unc.edu/undergraduate/ideas-in-action/)

## Verified first batch — direct course-level catalog data

The rows below are suitable as source material for a normalized requirement library. “Total” is the program table's stated total, not an assertion that a student has met it.

### 1. Neuroscience Major, B.S. — full core and additional layer

**Source:** [2026–2027 Neuroscience B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/)  
**Published major total:** **78–79 hours**. Every course under “Additional Requirements” requires a **C or better**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Intro | `NSCI 175`, C or better | 3 |
| Statistics | Choose one: `PSYC 210`, `STOR 120`, `STOR 155` | 3–4 |
| Research methods | Choose one `NSCI 27*`; `PSYC 270` is intended for psychology double majors, and UNC prioritizes `NSCI 27*` | 3 |
| Topics | Choose two: `NSCI 221`, `NSCI 222`, `NSCI 225` | 6 |
| Knowledge electives | Choose at least six hours from the catalog list | 6 |
| Math / methods / statistics electives | Choose at least six hours from the catalog list | 6 |
| Biology | `BIOL 101 + 101L`, `BIOL 103`, `BIOL 220` | 10 |
| Chemistry | `CHEM 101 + 101L`, `CHEM 102 + 102L`, `CHEM 241 + 241L`, `CHEM 261`, `CHEM 262 + 262L` | 19 |
| Programming | `COMP 110` **or** `COMP 116` | 3 |
| Calculus | `MATH 231`, `MATH 232` | 8 |
| Physics I | `PHYS 114` **or** `PHYS 118` | 4 |
| Physics II | `PHYS 115` **or** `PHYS 119` | 4 |
| Psychology | `PSYC 101` | 3 |

The official source also enumerates both elective sets and their exclusions. Those should remain option-group records, not be flattened into a single “any science elective” field. [Source](https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/)

### 2. Biology Major, B.S.

**Source:** [2026–2027 Biology B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/biology-major-bs/)  
**Published major total:** **64–67 hours**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Gateway | `BIOL 101 + 101L` | 4 |
| Fundamentals | `BIOL 103`, `BIOL 104`, `BIOL 105L` | 7 |
| Intermediate core | Choose **two**: `BIOL 220`, `BIOL 240`, `BIOL 250`, `BIOL 260`, or one organismal structure-and-diversity course | 6–7 |
| Biology depth | Four BIOL electives above 200, each 3+ credits; catalog exclusions apply; at least two major courses must include a lab | 14 |
| Chemistry | `CHEM 101 + 101L`, `CHEM 102 + 102L`, `CHEM 261` | 11 |
| Math | `MATH 231` | 4 |
| Two-option support group | Choose two from: `MATH 232`; `PHYS 115` or `PHYS 119`; `COMP 110` or `COMP 116` or `BIOL 222`; `STOR 120` or `STOR 215` or `STOR 151` or `STOR 155` | 6–8 |
| Physics I | `PHYS 114` or `PHYS 118` | 4 |
| Allied sciences | Two approved allied-science electives | 6 |

Important logic that a data model must retain: `BIOL 103` and `BIOL 104` precede 400-level BIOL major coursework; core courses beyond the required two may be electives; two courses in the major must be above 400; and the catalog defines an organismal course list plus lab-eligible courses. [Source](https://catalog.unc.edu/undergraduate/programs-study/biology-major-bs/)

### 3. Chemistry Major, B.S.

**Source:** [2026–2027 Chemistry B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/chemistry-major-bs/)  
**Published major total:** **72 hours**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Gateway | `CHEM 101 + 101L` | 4 |
| Core sequence | `CHEM 102` or `102H`, plus `102L`; `CHEM 241 + 241L` or `245L`; `CHEM 251`; `CHEM 433`; `CHEM 481 + 481L` or `482L`; `CHEM 482`; `CHEM 261`; `CHEM 262 + 262L` | 31 |
| Advanced work | 15 hours from `CHEM 395` or CHEM 420+ (except `CHEM 692H`); at least one laboratory course | 15 |
| Capstone lab | One of `CHEM 520L`, `530L`, `541L`, `550L`, `551L` | 2 |
| Biology | `BIOL 101` | 3 |
| Mathematics | `MATH 232`, `MATH 233`, `MATH 383` | 11 |
| Physics | `PHYS 118`, `PHYS 119` | 8 |

The chemistry page also says placement credit for `MATH 232`, `MATH 233`, or `MATH 383` does **not** satisfy the chemistry-major requirement. That must be an explicit rule, not a generic “course-equivalent” assumption. [Source](https://catalog.unc.edu/undergraduate/programs-study/chemistry-major-bs/)

### 4. Psychology Major, B.S.

**Source:** [2026–2027 Psychology B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/psychology-major-bs/)  
**Published major total:** **120 hours** including the remaining Gen Ed and elective hours; program-specific table content totals 58 hours before that remaining block.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Gateway | `PSYC 101`, C or better | 3 |
| Methods core | `PSYC 210`; `PSYC 270` (an `NSCI 27*` substitute is only for PSYC/NSCI double majors) | 6 |
| Behavioral + cognitive breadth | One sub-400 course from each: Behavioral Integrative Neuroscience and Cognitive; `NSCI 225` can satisfy one, not both | 6 |
| Clinical / development / social breadth | One sub-400 course from two of the three areas | 6 |
| Advanced / additional PSYC or NSCI | One Special Requirement Course; one 395–699 course excluding `PSYC 493`/`NSCI 493`; one additional PSYC/NSCI course >101 excluding 190 | 9 |
| Biology | `BIOL 101 + 101L` | 4 |
| One science / math choice | One of `CHEM 101 + 101L`, `PHYS 114`, `PHYS 118`, `MATH 231` | 4 |
| Extra quant | A non-PSYC/non-NSCI FC-QUANT course not used for Gen Ed or another psych-major requirement | 3 |
| Allied science | At least three 3-credit non-PSYC/non-NSCI allied-science courses plus one 4-credit allied-science course, or a catalog-defined 3+1 lab combination | 13 |

The B.S. also caps submitted PSYC + NSCI departmental credit at 45 hours. [Source](https://catalog.unc.edu/undergraduate/programs-study/psychology-major-bs/)

### 5. Exercise and Sport Science Major, B.S.

**Source:** [2026–2027 EXSS B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/exercise-sport-science-major-bs/)  
**Published major total:** **60–62 hours**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Core | `EXSS 155`, `256`, `273`, `376`, `380`, `385` | 19 |
| EXSS electives | Five courses from a named list, with at least 9 credits from 400+ courses | 13–15 |
| Biology | `BIOL 101 + 101L` | 4 |
| Three-course science / math option group | Choose three: `CHEM 101 + 101L`; `CHEM 102 + 102L`; `PHYS 114` or `118`; `PHYS 115` or `119`; `MATH 231` | 12 |
| Allied sciences | Four electives from the catalog list | 12 |

The four allied electives must use at least two subject codes, one a life-sciences subject code; special-topics 190 courses cannot count. Do not combine this B.S. source with the three EXSS B.A. tracks—the catalog lists them as distinct majors. [Source](https://catalog.unc.edu/undergraduate/programs-study/exercise-sport-science-major-bs/)

### 6. “Public health” at UNC — not one generic major

UNC currently lists **five limited-enrollment B.S.P.H. majors**: Biostatistics, Community and Global Public Health, Environmental Health Sciences, Health Policy and Management, and Nutrition. Students generally apply during sophomore year for junior-fall entry and are bound by the requirements in place when admitted to Gillings. A generic “Public Health” major must **not** be stored as one requirement set. [Source](https://catalog.unc.edu/undergraduate/programs-study/community-global-public-health-major-bsph/)

**Collected representative program: Community and Global Public Health, B.S.P.H.**  
**Source:** [2026–2027 CGPH catalog page](https://catalog.unc.edu/undergraduate/programs-study/community-global-public-health-major-bsph/)  
**Published major total:** **52–53 hours**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Admission prerequisite | `BIOL 101 + 101L` | 4 |
| Math admission prerequisite | One: `MATH 130`, `MATH 152`, `MATH 231` | 3–4 |
| Social science admission prerequisite | One: `SOCI 101`, `PSYC 101`, `ANTH 102` | 3 |
| Public-health core | `SPHG 351`, `SPHG 352`, `BIOS 600`, `EPID 600` | 13 |
| Health behavior core | `HBEH 510`, `520`, `531`, `532`, `555`, `571` | 20 |
| Program electives | Three from the named catalog list | 9 |

Gillings requires C (not C-) or better in each prerequisite, core, and additional required course. `HBEH 555` includes a 150-hour partner-organization internship. [Source](https://catalog.unc.edu/undergraduate/programs-study/community-global-public-health-major-bsph/)

### 7. Biomedical Engineering Major, B.S. — exists, admission-gated, joint UNC/NC State program

**Source:** [2026–2027 Biomedical Engineering B.S. catalog page](https://catalog.unc.edu/undergraduate/programs-study/biomedical-engineering-major-bs/)  
**Published degree total:** **124 hours**.

| Requirement node | Exact catalog logic | Credits |
|---|---|---:|
| Admission gate | Apply to the program; university admission does not guarantee BME admission | — |
| Admission prerequisites | `CHEM 101 + 101L`, `ENGL 105`, `MATH 231`, `MATH 232`, `PHYS 118` | 19 |
| Second-year core | `BMME 201`, `205`, `209`, `298` | 13 |
| Third-year core | `BMME 207`, `301`, `302`, `398` | 14 |
| Choice logic | Three gateway electives; one approved 300+ STEM elective; four specialty electives across no more than two of five specialization areas | 24 |
| Capstone | `BMME 697`, `BMME 698` | 6 |
| Additional science / math | `BIOL 101 + 101L` or `102L`; `CHEM 101 + 101L`, `CHEM 102 + 102L`, `CHEM 261`; `MATH 231`, `232`, `233`, `MATH 383 + 383L`; `PHYS 118`, `119` | 39 |

The admission-course grade rule is C or better for CHEM/MATH/PHYS and C- or better for ENGL 105. The catalog accepts qualifying AP/IB/transfer credit per university policy. BME's residence rule is different: 45 hours and at least half of major work may be from UNC **or NC State**; many BMME courses have NC State equivalents. This requires a cross-institution option model, not a UNC-course-code-only checklist. [Source](https://catalog.unc.edu/undergraduate/programs-study/biomedical-engineering-major-bs/)

### 8. Useful next extension: Nutrition Major, B.S.P.H.

**Source:** [2026–2027 Nutrition B.S.P.H. catalog page](https://catalog.unc.edu/undergraduate/programs-study/nutrition-major-bsph/)  
Nutrition has two tracks—Nutrition, Health and Society and Nutrition Science and Research—and should therefore be stored as one program with a required track. The Science and Research track is explicitly described by UNC as preparation for medical and other health-professional graduate programs.

Both tracks require, for admission: `BIOL 101 + 101L`, `BIOL 252 + 252L`, `CHEM 101 + 101L`, `CHEM 102 + 102L` (16 hours), each C (not C-) or better. Science and Research additionally requires `NUTR 240` and `CHEM 261` (6 hours). Its 77-hour program table further includes `BIOL 103`, `CHEM 241 + 241L`, `CHEM 262 + 262L`, `MATH 231`, a two-course physics sequence, and a required research/capstone record. [Source](https://catalog.unc.edu/undergraduate/programs-study/nutrition-major-bsph/)

## What is still needed before a production “complete / remaining” calculation

1. **Cohort selection.** The 2026–2027 catalog is current, but it is not automatically the correct catalog for someone who began in 2024 or 2025.
2. **A normalized option engine.** The catalog contains choice-of-one, choice-of-two, minimum-credit, area-breadth, course-number-range, exclusion, and no-double-count rules. A flat list of codes will produce false completions.
3. **Every option list.** The catalog’s named elective and allied-science lists should be captured as source-versioned entries before automation evaluates them.
4. **Transfer / AP / IB / substitutions.** The library can record catalog policy, but actual credit acceptance and exemptions need the student’s official records.
5. **Professional-program gates.** B.S.P.H. and BME are not merely majors; they include application/admission states and are tied to the admission cohort.
6. **Annual maintenance.** Each record needs `catalogYear`, `program`, `degree`, `track`, `sourceUrl`, `retrievedAt`, and a manual `verified` state. Re-run this pass every summer when UNC publishes the next catalog.

## Safe expansion order (data collection only)

1. Finish the other four Gillings B.S.P.H. programs as distinct records: Biostatistics, Environmental Health Sciences, Health Policy and Management, and Nutrition (both tracks).
2. Capture the three EXSS B.A. tracks separately; never use the B.S. table as a stand-in.
3. Add the most common science / pre-health-adjacent programs: Clinical Laboratory Science, Environmental Science B.S., Statistics and Analytics B.S., Medical Anthropology B.A., Sociology B.A., and Physics B.S.
4. Expand to the entire official [Programs A–Z](https://catalog.unc.edu/undergraduate/programs-study/) only after the per-program schema is capable of source versioning, tracks, admissions gates, and option/exclusion logic.

## Explicit non-findings and limits

- There is no public source that can replace a particular student’s ConnectCarolina Tar Heel Tracker or advisor-approved exceptions.
- This packet does not assert that any course meets a medical-school prerequisite; that is a separate, school-specific requirement problem.
- This packet does not change the app, mockup, data model, or existing requirement JSON. It makes the current source base and remaining data work explicit.
