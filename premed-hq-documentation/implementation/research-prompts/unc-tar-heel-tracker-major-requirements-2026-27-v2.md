# Research packet — Tar Heel Tracker requirements library, UNC–Chapel Hill 2026–2027 (v2)

**Purpose.** Define the authoritative catalog layer and the qualifying STEM / pre-health program universe for a future Tar Heel Tracker. This is a source packet and data-specification input, **not** an official degree audit, a catalog-to-JSON implementation, or a claim that a particular student has satisfied a requirement.

**Catalog year:** 2026–2027 Academic Catalog  
**Retrieved:** 2026-08-25  
**Source policy:** UNC–Chapel Hill-owned pages only. Discovery used Exa; every retained claim below is grounded in the linked `catalog.unc.edu` owner page.  
**Prior packet:** [v1](./unc-tar-heel-tracker-major-requirements-2026-27.md) is retained as the earlier focused source library. This v2 replaces it as the planning/specification packet.

## Bottom line and product boundary

The catalog supports a useful, source-versioned **planning tracker**. It does not support an app claiming to be an official graduation audit. UNC directs enrolled students to use their Tar Heel Tracker alongside the catalog, and says students normally follow the catalog in effect when they matriculated. A student-specific result also needs the exact declared program/track, enrollment/admission cohort, accepted transfer/AP/IB credit, substitutions, exceptions, and posted course attributes. [Catalog overview](https://catalog.unc.edu/undergraduate/) · [degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/)

The product should therefore say: **“catalog-based plan for the selected program and cohort”**—never “cleared to graduate.”

## What qualifies for this collection

This is a deliberately broad, explicit *pre-health/STEM planning* universe, not a claim that a major is required for medical school. It includes:

1. Life, physical, environmental, computational, data, and engineering B.S. programs.
2. Health-professional and public-health bachelor's programs, including programs with selective admission.
3. Common pre-health behavioral/social-science majors with substantial health, human, or population-health relevance.
4. Close variants and tracks whenever the catalog makes track selection affect requirements.

It excludes minors, graduate-only programs, and every non-STEM/humanities major merely because a pre-health student *could* select it. The official [Programs A–Z index](https://catalog.unc.edu/undergraduate/programs-study/) is the source of truth for later expansion.

## 1. University-wide requirement layer

Every selected program is evaluated in addition to—not instead of—this layer.

| Rule ID | 2026–27 catalog logic | Modeling note | Source |
|---|---|---|---|
| `UNC.DEGREE.MIN_HOURS` | At least 120 semester hours; some B.S. curricula exceed 120. | `minCredits`; compare only against official evaluated credit. | [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) |
| `UNC.DEGREE.CUM_GPA` | Final cumulative UNC GPA at least 2.000. | Do not calculate from a self-entered course list as an official result. | [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) |
| `UNC.DEGREE.RESIDENCE` | At least 45 academic credit hours earned from UNC–Chapel Hill courses. | Requires institution/credit-origin evidence. | [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) |
| `UNC.DEGREE.IDEAS` | Satisfy the cohort-correct IDEAs in Action curriculum. | Version by cohort, never one timeless checklist. | [IDEAs](https://catalog.unc.edu/undergraduate/ideas-in-action/) |
| `UNC.BA.SUPPLEMENTAL_GEN_ED` | B.A. students also satisfy Supplemental General Education: second major, minor, **or** three outside-home-department 200+ courses with exclusions/non-overlap rules. | Degree-specific choice node, not a generic 9-credit elective bucket. | [Supplemental General Education](https://catalog.unc.edu/undergraduate/ideas-in-action/supplemental-general-education/) |
| `UNC.BA.SUBJECT_CAP` | No more than 45 semester hours in one subject code count toward a College of Arts & Sciences B.A. (specified ENGL exceptions). | Needs evaluated transcript and cross-list resolution. | [Degree requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) |

### IDEAs in Action — cohort logic that must be encoded

The 2026–27 page applies its listed set specifically to students beginning at Carolina in **fall 2026**. Students who began fall 2022–spring 2026 use the relevant archived catalog; pre-fall-2022 students use Making Connections. [IDEAs](https://catalog.unc.edu/undergraduate/ideas-in-action/) · [catalog archives](https://catalog.unc.edu/undergraduate/archives/)

For a fall-2026 cohort, capture the following families as distinct requirements: First-Year Foundations (`IDST 101`, `IDST 111L`, FY Seminar/Launch, `ENGL 105`, Global Language through level 3); nine 3-credit Focus Capacities; a 1-credit Empirical Investigation Lab; Research and Discovery; High-Impact Experience **or** second Research and Discovery; Communication Beyond Carolina; Interdisciplinary; Lifetime Fitness; Campus Life Experience (eight events from four categories); Foundations of American Democracy; disciplinary distribution across three divisions; the selected major; and B.A.-only Supplemental General Education. Important conditions include first-year timing, by-exam caps, R&D/HI non-duplication, CAA exceptions, and the varsity/ROTC Lifetime Fitness exemption. [IDEAs](https://catalog.unc.edu/undergraduate/ideas-in-action/) · [Foundations of American Democracy](https://catalog.unc.edu/undergraduate/ideas-in-action/foundations-american-democracy/)

## 2. Program catalog — identifiers and structured logic

`programId` values below are proposed stable application IDs; `catalogSlug` is the current official page identifier. A “full option list” means catalog option/exclusion tables must be ingested as versioned source rows before automated completion is allowed.

### A. Life sciences, chemistry, neuroscience, and human movement

| programId / degree / track | Core requirement shape to model | Gates, minima, or exclusions | Official source |
|---|---|---|---|
| `unc.neuroscience.bs` / B.S. / — | `NSCI 175` C+; one statistics; one research-methods; choose two of `NSCI 221/222/225`; 6 credits each Knowledge and Math/Methods/Stats electives; named BIOL/CHEM/COMP/MATH/PHYS/PSYC support. Catalog total 78–79. | Prefer `NSCI 27*` methods; `PSYC 270` intended for PSYC double majors; all Additional Requirements require C+. Preserve both elective lists. | [Neuroscience B.S.](https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/) |
| `unc.biology.bs` / B.S. / — | `BIOL 101+101L`; fundamentals `103/104/105L`; choose two intermediate cores; four upper BIOL electives; CHEM, MATH, two-support-course choice, physics and two allied sciences. 64–67 credits. | Gateway C+; two major labs; two major courses above 400; explicit exclusions and organismal list. | [Biology B.S.](https://catalog.unc.edu/undergraduate/programs-study/biology-major-bs/) |
| `unc.chemistry.bs` / B.S. / — | Structured chemistry core, 15 advanced CHEM credits (one lab), a capstone lab choice, BIOL 101, named MATH and PHYS sequences. 72 credits. | Placement credit in `MATH 232/233/383` does **not** meet the major requirement; retain course-number-range/exclusion logic. | [Chemistry B.S.](https://catalog.unc.edu/undergraduate/programs-study/chemistry-major-bs/) |
| `unc.psychology.bs` / B.S. / — | `PSYC 101` C+; `210`, `270`; breadth across behavioral/cognitive and clinical/development/social; special requirement; advanced/additional PSYC/NSCI; BIOL; one CHEM/PHYS/MATH option; extra FC-QUANT; allied science. | `NSCI 225` may count for one of two breadth areas, not both; non-PSYC/NSCI quant must not overlap Gen Ed/major; PSYC+NSCI cap is 45. | [Psychology B.S.](https://catalog.unc.edu/undergraduate/programs-study/psychology-major-bs/) |
| `unc.exercise-sport-science.bs` / B.S. / — | Six-course EXSS core; five named EXSS electives with 9 credits at 400+; BIOL; choose three science/math courses; four allied electives. 60–62 credits. | Allied electives span two subject codes and one life-science code; exclude special-topics 190. B.A. tracks are separate programs. | [EXSS B.S.](https://catalog.unc.edu/undergraduate/programs-study/exercise-sport-science-major-bs/) |
| `unc.applied-sciences.bs` / B.S. / concentration required | Core plus declared concentration and relevant science/math support. | Extract concentration-specific tables before any completion calculation. | [Applied Sciences B.S.](https://catalog.unc.edu/undergraduate/programs-study/applied-sciences-major-bs/) |

### B. Physical, environmental, engineering, and data sciences

| programId / degree / track | Core requirement shape to model | Gates, minima, or exclusions | Official source |
|---|---|---|---|
| `unc.biomedical-engineering.bs` / B.S. / joint UNC–NC State | Admission prerequisites; named BMME second/third-year core; gateway/STEM/specialty choice groups; two-course capstone; science/math support. 124 credits. | Admission is separate from university admission. C/C- admission-course rules, NC State equivalencies, and special BME residence rule require cross-institution/course-equivalency nodes. | [Biomedical Engineering B.S.](https://catalog.unc.edu/undergraduate/programs-study/biomedical-engineering-major-bs/) |
| `unc.physics.bs` / B.S. / — | Calculus-based physics and mathematics core plus catalog advanced/track option structure. | Store upper-level selection and associated lab/credit constraints from source table. | [Physics B.S.](https://catalog.unc.edu/undergraduate/programs-study/physics-major-bs/) |
| `unc.earth-marine-sciences.bs` / B.S. / — | Earth/marine science core and advanced electives plus required support. | Need full elective list and any concentration choices as source-versioned groups. | [Earth and Marine Sciences B.S.](https://catalog.unc.edu/undergraduate/programs-study/earth-marine-sciences-major-bs/) |
| `unc.environmental-science.bs.general` / B.S. / concentration required | `ENEC 201/202I`, quantitative/problem-solving choice, science support, then a selected concentration. | Separate from QES; concentrations change logic. | [Environmental Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/environmental-science-bs/) |
| `unc.environmental-science.bs.qes` / B.S. / Quantitative Energy Systems | Separate track with its own required/choice tables. | Do not collapse into general environmental-science requirements. | [Environmental Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/environmental-science-bs/) |
| `unc.statistics-analytics.bs` / B.S. / Group B required | MATH/STOR core, programming, calculus/linear algebra/intro stats, and a selected Group B. | Preserve alternatives (`MATH/STOR 235` vs `MATH 233`, etc.) and group selection; 120-hour total stated. | [Statistics and Analytics B.S.](https://catalog.unc.edu/undergraduate/programs-study/statistics-analytics-majors-bs/) |
| `unc.data-science.bs` / B.S. / concentration required | DATA core, communication, math/stat foundations, optimization, AI/ML, computational-thinking pair, four upper electives **or** concentration, plus math/stat/programming support. 60–61 credits. | Selective SDIS admission; seven prerequisites; 3.0 cumulative GPA minimum for admission; admissions-cycle/status evidence is student-specific. | [Data Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-bs/) |
| `unc.data-science.ba` / B.A. / concentration required | Data/information, math/stat, computational foundations and a declared domain concentration. | B.A. Supplemental Gen Ed applies; concentration tables must remain separate. | [Data Science B.A.](https://catalog.unc.edu/undergraduate/programs-study/data-science-major-ba/) |
| `unc.geospatial-data-science.bs` / B.S. / — | GIS/geospatial/data-science core and electives. | Ingest full course table before progress calculation; not interchangeable with Data Science B.S. | [Geospatial Data Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/geospatial-data-science-major-bs/) |
| `unc.computer-science.bs` / B.S. / — | Required COMP foundations, math and upper-level CS selection. | Store option/exclusion and degree-specific rules from the official table. | [Computer Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/computer-science-major-bs/) |

### C. Public health and clinical-professional programs

All five Gillings B.S.P.H. majors are **limited enrollment**. Students generally apply in sophomore year for junior-fall entry; the applicable requirements are those in effect **when admitted to Gillings**, not necessarily first matriculation. Each listed program requires final GPA 2.0, 45 UNC academic hours, C (not C-) or better in prerequisite/core/additional requirements, and at least half of major requirements at UNC. [Gillings programs example](https://catalog.unc.edu/undergraduate/programs-study/health-policy-management-major-bsph/)

| programId / degree / track | Core requirement shape to model | Additional state / required evidence | Official source |
|---|---|---|---|
| `unc.gillings.biostatistics.bsph` / B.S.P.H. / — | Prerequisite science/math/statistics plus BIOS/SPHG/EPID and program-specific biostatistics core/electives. | `gillingsAdmissionCohort`, decision/status, and qualifying grade evidence. | [Biostatistics B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/biostatistics-major-bsph/) |
| `unc.gillings.cgph.bsph` / B.S.P.H. / — | BIOL + math + one SOCI/PSYC/ANTH prerequisite; public-health core; named HBEH sequence/electives. 52–53 credits. | `HBEH 555` includes a 150-hour partner-organization internship. | [Community and Global Public Health B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/community-global-public-health-major-bsph/) |
| `unc.gillings.environmental-health.bsph` / B.S.P.H. / — | Prerequisite science/quantitative work plus public-health core, environmental-health core and option groups. | Admission cohort/status and catalog elective lists are mandatory inputs. | [Environmental Health Sciences B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/environmental-health-sciences-major-bsph/) |
| `unc.gillings.health-policy-management.bsph` / B.S.P.H. / — | BIOL, ECON, STOR and math prereqs; BIOS **or** ECON 400, EPID/SPHG, HPM core, internship, capstone. 57–59 program-table hours; sample-plan total is 71–73 with prerequisites. | `HPM 593` internship and cohort admission condition. | [Health Policy and Management B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/health-policy-management-major-bsph/) |
| `unc.gillings.nutrition.bsph.health-society` / B.S.P.H. / Nutrition, Health and Society | Nutrition/public-health core, research/capstone, prerequisite science, and an 18-credit selected complementary field. | Track selection and Director-approved alternatives cannot be inferred from course codes. | [Nutrition B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/nutrition-major-bsph/) |
| `unc.gillings.nutrition.bsph.science-research` / B.S.P.H. / Nutrition Science and Research | Separate track: public-health/nutrition core and research/capstone, plus more extensive BIOL/CHEM/MATH/PHYS support. | Separate from Health & Society; catalog describes it as health-professional/graduate preparation. | [Nutrition B.S.P.H.](https://catalog.unc.edu/undergraduate/programs-study/nutrition-major-bsph/) |
| `unc.clinical-laboratory-science.bs` / B.S. / — | Prerequisite sciences plus clinical laboratory sequence and clinical/practicum components. | Professional admission and placement/clinical compliance are external state, not course-list inference. | [Clinical Laboratory Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/clinical-laboratory-science-major-bs/) |
| `unc.radiologic-science.bs` / B.S. / — | Professional curriculum with prerequisite/support work and clinical progression. | Admission/clinical eligibility and transfer articulation must come from official student evidence. | [Radiologic Science B.S.](https://catalog.unc.edu/undergraduate/programs-study/radiologic-science-major-bs/) |
| `unc.nursing.bsn` / B.S.N. / — | Professional-school nursing curriculum and admission rules. | Use program-specific cohort/admission and clinical status; do not apply generic B.S. planning assumptions. | [Nursing B.S.N.](https://catalog.unc.edu/undergraduate/programs-study/nursing-major-bsn/) |

### D. Behavioral, social, and population-health paths commonly paired with pre-health study

| programId / degree / track | Core requirement shape to model | Gates, minima, or exclusions | Official source |
|---|---|---|---|
| `unc.medical-anthropology.ba` / B.A. / — | Choose two foundations, one research-methods/experience, and six electives including at least one biological/ecological and one sociocultural; 27 credits. | No more than two of six electives at 100-level or below; up to two outside-ANTH electives require DUS approval. B.A. Supplemental Gen Ed applies. | [Medical Anthropology B.A.](https://catalog.unc.edu/undergraduate/programs-study/medical-anthropology-major-ba/) |
| `unc.anthropology.ba` / B.A. / concentration/area choices | Anthropology foundation/core, method and elective choices. | Capture concentration/area conditions separately; B.A. rules apply. | [Anthropology B.A.](https://catalog.unc.edu/undergraduate/programs-study/anthropology-major-ba/) |
| `unc.sociology.ba` / B.A. / — | `SOCI 101` C+, `250`, `251`, `252`, three upper-level 400+ electives and two additional 3-hour SOCI courses; 27 credits. | Catalog permits narrow DUS-approved substitutions for one upper elective; B.A. rules apply. | [Sociology B.A.](https://catalog.unc.edu/undergraduate/programs-study/sociology-major-ba/) |
| `unc.hdfs.baed` / B.A.Ed. / — | Human development/family science professional curriculum. | Degree is B.A.Ed., not B.A.; program/admission and practicum requirements need separate source capture. | [Human Development and Family Science B.A.Ed.](https://catalog.unc.edu/undergraduate/programs-study/human-development-family-science-major-baed/) |
| `unc.economics.bs` / B.S. / — | Quantitative economics core/electives and required math/stat support. | Not a health-profession curriculum; included as a common population-health/health-policy path. | [Economics B.S.](https://catalog.unc.edu/undergraduate/programs-study/economics-major-bs/) |
| `unc.environmental-studies.ba.general` / B.A. / concentration required | ENEC core, earth-system choice, statistics/research-method choice, concentration and BIOL/ECON/MATH/science support. | Separate Sustainability Track; B.A. Supplemental Gen Ed applies. | [Environmental Studies B.A.](https://catalog.unc.edu/undergraduate/programs-study/environmental-studies-major-ba/) |
| `unc.environmental-studies.ba.sustainability` / B.A. / Sustainability Track | Separate track table. | Do not infer equivalence with general Environmental Studies. | [Environmental Studies B.A.](https://catalog.unc.edu/undergraduate/programs-study/environmental-studies-major-ba/) |

## 3. Coverage register and readiness

| Coverage tier | Records | What may be built from it now | What blocks automated “complete” status |
|---|---|---|---|
| **Deep source logic captured** | University layer; IDEAs 2026 cohort; NSCI, BIOL, CHEM, PSYC, EXSS B.S., BME, Statistics & Analytics, Data Science B.S., environmental science variants, all five Gillings B.S.P.H. records, CLS, Radiologic Science, Nursing, Medical Anthropology, Sociology, Physics, Earth/Marine, Computer Science, Applied Sciences, Geospatial Data Science, Data Science B.A., Anthropology, HDFS, Economics B.S., Environmental Studies variants. | Program selector; authoritative source cards; requirements-tree shell; manual-plan workflow; cohort/admission prompts. | Full option/elective tables, historical catalog versions, cross-lists/equivalencies, and student record reconciliation. |
| **Catalog discovery complete, line-item capture deferred** | Adjacent additions that emerge from the Programs A–Z index (e.g., biological minors, health/social-science minors, additional degree variants). | Candidate-library UI only, labeled as source to be extracted. | No automated evaluation until its exact table is versioned. |
| **Never safely inferred from public catalog** | Personal audit result, accepted transfer/AP/IB credit, waivers, substitutions, honors/permission approvals, actual class attributes/events, program admission, clinical clearance, declaration change. | Student-uploaded/connected evidence view, with provenance. | ConnectCarolina Tar Heel Tracker, official transcript/credit evaluation, program/advisor record, and user confirmation. |

## 4. Proposed normalized data schema (no implementation)

```ts
type CatalogSnapshot = {
  catalogYear: "2026-2027";
  retrievedAt: "YYYY-MM-DD";
  sourceUrl: string;
  sourceHash?: string; // detects later catalog edits
};

type Program = CatalogSnapshot & {
  programId: string;             // e.g. unc.gillings.nutrition.bsph.science-research
  catalogSlug: string;           // official URL slug, never the only identifier
  title: string;
  degree: "BA" | "BS" | "BSPH" | "BSN" | "BAEd" | "BSIS" | "other";
  parentProgramId?: string;      // nutrition parent -> each track
  trackId?: string;
  admissionModel: "open" | "selective" | "professional" | "joint-campus";
  applicability: "matriculationCohort" | "admissionCohort";
  requirementRootIds: string[];
};

type RequirementNode = CatalogSnapshot & {
  id: string;
  owner: "university" | "ideas" | "program" | "track";
  kind: "allOf" | "anyOf" | "atLeastN" | "minCredits" | "course" |
        "courseSet" | "attribute" | "gpa" | "residence" | "experience" |
        "admission" | "manualEvidence";
  children?: string[];
  minCount?: number;
  minCredits?: number;
  courseRefs?: CourseRef[];
  exclusions?: ExclusionRule[];
  overlapPolicy?: "allow" | "forbid" | "limited" | "source-defined";
  gradeMinimum?: "C-" | "C" | "C+";
  evidencePolicy: "catalog-only" | "student-record" | "advisor/program";
  displayLabel: string;
  sourceLocator?: string;        // heading/table/footnote in source snapshot
};

type StudentProgramContext = {
  matriculationTerm: string;
  ideasCohort: "making-connections" | "ideas-2022-2025" | "ideas-2026";
  declaredProgramId?: string;
  declaredTrackId?: string;
  gillingsAdmissionTerm?: string;
  programAdmissionStatus?: "not-applicable" | "planning" | "applied" | "admitted";
  officialEvidenceRefs: string[]; // opaque links/records, never invented fulfillment
};
```

### Non-negotiable evaluation behavior

- Store requirements as a tree/constraint graph. Never flatten a “choose two” group, a min-credit elective list, or an exclusion into individual required courses.
- Separate **catalog requirement**, **candidate plan**, and **official fulfillment evidence**. A planned course can satisfy a proposed path but cannot mark an official rule complete.
- Include source snapshot + catalog year on every node. Display a stale-data warning when the selected cohort has no matching snapshot.
- Treat B.S.P.H., Data Science B.S., BME, CLS, Radiologic Science, and Nursing admission/progression as explicit states—not as courses that an inference engine can reconstruct.
- Preserve cross-listed course identity, term-specific attributes, overlap policies, grade thresholds, and human approvals as first-class data.

## 5. Required student-specific ConnectCarolina/advising evidence

The following must be requested or connected before the tracker can display a “remaining” calculation with confidence:

1. Matriculation term/catalog cohort and declared major **and track**.
2. Official Tar Heel Tracker completion status and any applied exceptions.
3. Official course history, course credit origin, transfer articulation, AP/IB/placement decisions, and grades.
4. Enrollment-term course attributes (IDEAs categories, FY-Launch, etc.), Campus Life evidence, and LFIT waiver eligibility where relevant.
5. B.S.P.H./SDIS/BME/clinical program admission or progression status, plus any advisor-approved selection/substitution.

## 6. Pre-implementation extraction plan

1. Build a 2026–27 snapshot containing the entire course/elective tables for the selected program only; record page heading/table/footnote locators.
2. Add the matching historical snapshot before allowing an older matriculation cohort to select the program.
3. Unit-test the constraint engine against synthetic cases: choice groups, no-double-count, min-credit lists, C/C+/C- thresholds, BA subject cap, residence, and B.S.P.H. admission cohort.
4. Only then map a student's provided official record to the source tree. Surface ambiguous matches for review instead of auto-completing them.

## Source coverage register

All retained sources are official UNC catalog URLs, retrieved 2026-08-25. Discovery reviewed 58 Exa search results across four workstreams and then directly fetched owner pages; duplicate links were consolidated into the program records above.

- [Undergraduate Catalog](https://catalog.unc.edu/undergraduate/)
- [Programs A–Z](https://catalog.unc.edu/undergraduate/programs-study/)
- [Degree Requirements](https://catalog.unc.edu/undergraduate/degree-requirements/)
- [IDEAs in Action](https://catalog.unc.edu/undergraduate/ideas-in-action/)
- [Catalog Archives](https://catalog.unc.edu/undergraduate/archives/)
- The exact current program pages are linked in every program table row above.

## Explicit limits

- This does not establish any medical-school prerequisite mapping; that is school-specific and outside UNC degree-audit logic.
- This does not replace a professional advisor or official Tar Heel Tracker.
- The catalog itself warns that requirements can change; source snapshots must be revalidated each summer and whenever UNC publishes a new catalog.
