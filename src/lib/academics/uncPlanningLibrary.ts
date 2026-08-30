/**
 * Source-versioned UNC planning reference data. This is deliberately not a
 * degree-audit engine: individual requirement terms, transfer equivalencies,
 * substitutions, admissions decisions, and ConnectCarolina remain external.
 *
 * Research packet: premed-hq-documentation/implementation/research-prompts/
 * unc-tar-heel-tracker-planning-library-foundation-2026-27.md
 */

export type RequirementNodeKind =
  | 'all_of'
  | 'choose_n'
  | 'minimum_credits'
  | 'course_range'
  | 'admission_gate'
  | 'residency'
  | 'capstone'
  | 'manual_review'

export type RequirementEvaluation = 'reference-only' | 'official-audit-required'

export interface RequirementNode {
  id: string
  label: string
  kind: RequirementNodeKind
  detail: string
  /** No node in this first library is safe to mark complete from local courses. */
  evaluation: RequirementEvaluation
  /** Exact catalog course codes only where this packet captured them. */
  courseCodes?: readonly string[]
  exclusions?: readonly string[]
  noDoubleCountWith?: readonly string[]
}

export interface UncPlanningRequirementSet {
  id: string
  catalogYear: '2026-2027'
  school: string
  program: string
  degree: string
  trackOrConcentration?: string
  sourceUrl: string
  retrievedAt: '2026-08-25'
  sourceStatus: 'source-validated' | 'official-source-gap'
  publishedHours?: string
  admissionGate?: string
  nodes: readonly RequirementNode[]
  manualReview: readonly string[]
}

export type CandidatePlanNodeState = 'scheduled' | 'not-scheduled' | 'manual-review'
export interface CandidatePlanNodeCoverage {
  node: RequirementNode
  state: CandidatePlanNodeState
  scheduledCourses: readonly string[]
  detail: string
}

const officialAudit = (id: string, label: string, kind: RequirementNodeKind, detail: string): RequirementNode => ({
  id, label, kind, detail, evaluation: 'official-audit-required',
})

const UNC = 'https://catalog.unc.edu/undergraduate/programs-study/'
const source = (path: string) => `${UNC}${path}/`

/**
 * The declared pre-health/STEM universe from the research packet. Individual
 * course-list members are intentionally retained as human-readable source
 * rules until a future source-capture pass stores every catalog option row.
 */
export const UNC_PLANNING_LIBRARY: readonly UncPlanningRequirementSet[] = [
  {
    id: 'biology-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Biology', degree: 'B.A.', sourceUrl: source('biology-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '53',
    nodes: [officialAudit('gateway', 'Gateway biology', 'all_of', 'BIOL 101 and 101L with C or better.'), officialAudit('intermediate', 'Intermediate core', 'choose_n', 'Choose two of five published core options.'), officialAudit('electives', 'Biology electives', 'minimum_credits', 'Three 3+ credit upper biology electives; published exclusions, laboratory and 400-level rules apply.'), officialAudit('quant', 'Quantitative option', 'choose_n', 'Choose one published programming, math, or statistics option.'), officialAudit('allied', 'Allied science', 'minimum_credits', 'Four published allied-science electives, each at least 3 credits.')],
    manualReview: ['Biology elective exclusions and lab/level rules', 'B.A. supplemental general education', 'Official audit equivalencies'],
  },
  {
    id: 'biology-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Biology', degree: 'B.S.', sourceUrl: source('biology-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '64–67',
    nodes: [officialAudit('gateway', 'Gateway and fundamentals', 'all_of', 'BIOL 101/101L, BIOL 103, 104, and 105L.'), officialAudit('intermediate', 'Intermediate core', 'choose_n', 'Choose two of five published core options.'), officialAudit('electives', 'Upper biology electives', 'minimum_credits', 'Four upper biology electives plus published lab and 400-level conditions.'), officialAudit('support', 'Science and quantitative support', 'choose_n', 'Required chemistry, calculus, physics-I choice, and published support-option choices.'), officialAudit('allied', 'Allied science', 'minimum_credits', 'Two approved allied-science electives.')],
    manualReview: ['BIOL 103/104 sequencing', 'Published elective exclusions and lab eligibility', 'Official audit equivalencies'],
  },
  {
    id: 'chemistry-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Chemistry', degree: 'B.A.', sourceUrl: source('chemistry-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Chemistry core', 'all_of', 'Published general, organic, analytical/inorganic/physical chemistry sequence.'), officialAudit('advanced', 'Advanced and laboratory work', 'minimum_credits', 'Published advanced chemistry electives, laboratory, and capstone rules.'), officialAudit('support', 'Math and physics support', 'all_of', 'Published mathematics and physics support requirements.')],
    manualReview: ['Exact alternative course lists', 'Placement-credit and laboratory policy', 'B.A. supplemental general education'],
  },
  {
    id: 'chemistry-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Chemistry', degree: 'B.S.', sourceUrl: source('chemistry-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '72',
    nodes: [officialAudit('core', 'Chemistry sequence', 'all_of', 'CHEM 101/101L; 102/102H+102L; analytical, organic, inorganic, physical, and laboratory sequences as published.'), officialAudit('advanced', 'Advanced chemistry', 'minimum_credits', '15 hours from CHEM 395 or 420+ with catalog exclusions and at least one laboratory.'), officialAudit('capstone', 'Capstone laboratory', 'choose_n', 'Choose one published capstone laboratory.'), officialAudit('support', 'Science and math support', 'all_of', 'BIOL 101; MATH 232/233/383; PHYS 118/119.')],
    manualReview: ['Math placement does not satisfy named chemistry-major math nodes', 'Course-list exclusions and lab choice'],
  },
  {
    id: 'neuroscience-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Neuroscience', degree: 'B.S.', sourceUrl: source('neuroscience-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '78–79',
    nodes: [
      { ...officialAudit('intro', 'Introduction', 'all_of', 'NSCI 175 with C or better.'), courseCodes: ['NSCI 175'] },
      { ...officialAudit('statistics', 'Statistics choice', 'choose_n', 'Choose one: PSYC 210, STOR 120, or STOR 155.'), courseCodes: ['PSYC 210', 'STOR 120', 'STOR 155'] },
      { ...officialAudit('methods', 'Research methods', 'choose_n', 'Choose NSCI 27*; PSYC 270 is the limited psychology-double-major path.'), exclusions: ['Do not infer an NSCI 27* match from a generic NSCI course.', 'PSYC 270 requires the limited psychology-double-major review.'] },
      { ...officialAudit('topics', 'Neuroscience topics', 'choose_n', 'Choose two: NSCI 221, NSCI 222, NSCI 225.'), courseCodes: ['NSCI 221', 'NSCI 222', 'NSCI 225'] },
      officialAudit('knowledge', 'Knowledge electives', 'minimum_credits', 'At least 6 credits from the published knowledge-elective list.'),
      officialAudit('mms', 'Math, methods, and statistics electives', 'minimum_credits', 'At least 6 credits from the published MMS list.'),
      { ...officialAudit('biology', 'Biology support', 'all_of', 'BIOL 101/101L, BIOL 103, BIOL 220.'), courseCodes: ['BIOL 101', 'BIOL 103', 'BIOL 220'] },
      { ...officialAudit('chemistry', 'Chemistry support', 'all_of', 'CHEM 101/101L, 102/102L, 241/241L, 261, 262/262L.'), courseCodes: ['CHEM 101', 'CHEM 102', 'CHEM 241', 'CHEM 241L', 'CHEM 261', 'CHEM 262', 'CHEM 262L'] },
      { ...officialAudit('quant', 'Programming and calculus', 'all_of', 'COMP 110 or 116; MATH 231 and 232.'), courseCodes: ['COMP 110', 'COMP 116', 'MATH 231', 'MATH 232'] },
      { ...officialAudit('physics-psych', 'Physics and psychology', 'all_of', 'PHYS 114 or 118; PHYS 115 or 119; PSYC 101.'), courseCodes: ['PHYS 114', 'PHYS 118', 'PHYS 115', 'PHYS 119', 'PSYC 101'] },
    ],
    manualReview: ['C-or-better additional requirements', 'PSYC 270 limited double-major policy', 'Elective lists and exclusions'],
  },
  {
    id: 'environmental-science-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Environmental Science', degree: 'B.S.', sourceUrl: source('environmental-science-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Environmental science core', 'all_of', 'ENEC 201, 202I, a published data/problem-solving choice, and ENEC 698 or 694H.'), officialAudit('concentration', 'Concentration', 'minimum_credits', 'Five courses from one published concentration.'), officialAudit('support', 'Supporting science and math', 'all_of', 'Published natural-science and quantitative support blocks.')],
    manualReview: ['Concentration selection', 'Capstone approval and prerequisites'],
  },
  {
    id: 'environmental-science-bs-qes', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Environmental Science', degree: 'B.S.', trackOrConcentration: 'Quantitative Energy Systems', sourceUrl: source('environmental-science-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Track core', 'all_of', 'Published ENEC core and capstone choice.'), officialAudit('quant', 'Quantitative skills', 'choose_n', 'Four courses across two published quantitative-skill groups.'), officialAudit('concentration', 'Track science blocks', 'minimum_credits', 'Published science and concentration requirements.')],
    manualReview: ['Separate track from general B.S.', 'Group membership and prerequisite chains'],
  },
  {
    id: 'environmental-studies-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Environmental Studies', degree: 'B.A.', sourceUrl: source('environmental-studies-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '120',
    nodes: [officialAudit('core', 'Environmental studies core', 'all_of', 'ENEC 201/202I, capstone choice, and one earth-system science course.'), officialAudit('skills', 'Skills category', 'choose_n', 'Two courses in one published GIS, remote-sensing, or statistics/analytics category.'), officialAudit('concentration', 'Concentration', 'minimum_credits', 'Five published concentration courses.'), officialAudit('support', 'Supporting courses', 'choose_n', 'BIOL, ECON, MATH plus chemistry or physics option.')],
    manualReview: ['Concentration list', 'B.A. supplemental general education'],
  },
  {
    id: 'environmental-studies-ba-sustainability', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Environmental Studies', degree: 'B.A.', trackOrConcentration: 'Sustainability', sourceUrl: source('environmental-studies-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('track', 'Sustainability track', 'all_of', 'Separate published track blocks and supporting requirements.')],
    manualReview: ['Track-specific course and choice lists', 'B.A. supplemental general education'],
  },
  {
    id: 'environmental-health-sciences-bsph', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Environmental Health Sciences', degree: 'B.S.P.H.', sourceUrl: source('environmental-health-sciences-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Limited Gillings admission; catalog term is the admission term.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'Published GPA, calculus, science-category, and residence conditions.'), officialAudit('public-health', 'Public health core', 'all_of', 'BIOS 600, EPID 600, SPHG 351, and SPHG 352.'), officialAudit('envr', 'Environmental health core', 'all_of', 'ENVR 205/230/403/430 and approved capstone choice.'), officialAudit('concentration', 'Concentration', 'choose_n', 'Environmental chemistry, biology, or physics concentration requirements.')],
    manualReview: ['Gillings admission decision and term', 'Concentration-specific advanced choices and approvals', 'Capstone approval'],
  },
  {
    id: 'environmental-health-sciences-bsph-chemistry', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Environmental Health Sciences', degree: 'B.S.P.H.', trackOrConcentration: 'Environmental Chemistry', sourceUrl: source('environmental-health-sciences-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Limited Gillings admission; catalog term is the admission term.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'Published GPA, calculus, science-category, and residence conditions.'), officialAudit('core', 'Public health and environmental health core', 'all_of', 'BIOS 600, EPID 600, SPHG 351/352, ENVR core, and approved capstone.'), officialAudit('concentration', 'Environmental chemistry concentration', 'manual_review', 'The exact advanced chemistry concentration table and approvals need official review.')],
    manualReview: ['Gillings admission decision and term', 'Environmental chemistry table and approvals', 'Capstone approval'],
  },
  {
    id: 'environmental-health-sciences-bsph-health-biology', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Environmental Health Sciences', degree: 'B.S.P.H.', trackOrConcentration: 'Health Biology', sourceUrl: source('environmental-health-sciences-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Limited Gillings admission; catalog term is the admission term.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'Published GPA, calculus, science-category, and residence conditions.'), officialAudit('core', 'Public health and environmental health core', 'all_of', 'BIOS 600, EPID 600, SPHG 351/352, ENVR core, and approved capstone.'), officialAudit('concentration', 'Health biology concentration', 'manual_review', 'The exact health biology concentration table and approvals need official review.')],
    manualReview: ['Gillings admission decision and term', 'Health biology table and approvals', 'Capstone approval'],
  },
  {
    id: 'environmental-health-sciences-bsph-physics', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Environmental Health Sciences', degree: 'B.S.P.H.', trackOrConcentration: 'Physics', sourceUrl: source('environmental-health-sciences-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Limited Gillings admission; catalog term is the admission term.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'Published GPA, calculus, science-category, and residence conditions.'), officialAudit('core', 'Public health and environmental health core', 'all_of', 'BIOS 600, EPID 600, SPHG 351/352, ENVR core, and approved capstone.'), officialAudit('concentration', 'Physics concentration', 'manual_review', 'The exact physics concentration table and approvals need official review.')],
    manualReview: ['Gillings admission decision and term', 'Physics concentration table and approvals', 'Capstone approval'],
  },
  {
    id: 'physics-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Physics', degree: 'B.A.', sourceUrl: source('physics-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Physics core', 'all_of', 'Published introductory physics, mathematics, and designated physics core.'), officialAudit('advanced', 'Advanced physics/astronomy work', 'minimum_credits', 'Published advanced PHYS/ASTR choice rules.')],
    manualReview: ['Physics-major/Astronomy-minor shared-credit exclusion', 'Prerequisite and term sequencing'],
  },
  {
    id: 'physics-bs-standard', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Physics', degree: 'B.S.', trackOrConcentration: 'Standard', sourceUrl: source('physics-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '120',
    nodes: [officialAudit('core', 'Standard-option core', 'all_of', 'Published PHYS 281L through 481L sequence.'), officialAudit('research', 'Research or thesis', 'choose_n', 'PHYS 395 or 692H.'), officialAudit('advanced', 'Advanced electives', 'minimum_credits', 'Six additional published advanced credits.'), officialAudit('support', 'Math and science support', 'all_of', 'PHYS 118/119, MATH 231/232/233/383, and CHEM 101/101L.')],
    manualReview: ['Fall/spring sequencing', 'Physics/Astronomy exclusion'],
  },
  {
    id: 'physics-bs-astrophysics', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Physics', degree: 'B.S.', trackOrConcentration: 'Astrophysics', sourceUrl: source('physics-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '120',
    nodes: [officialAudit('core', 'Astrophysics-option core', 'all_of', 'Published physics sequence with ASTR 519 and ASTR 202.'), officialAudit('astronomy', 'Astronomy and advanced electives', 'minimum_credits', 'Published ASTR and advanced-choice requirements.'), officialAudit('support', 'Math and physics support', 'all_of', 'Published calculus, differential equations, and introductory physics nodes.')],
    manualReview: ['Separate option from standard B.S.', 'Fall/spring sequencing'],
  },
  {
    id: 'statistics-analytics-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Statistics and Analytics', degree: 'B.S.', sourceUrl: source('statistics-analytics-majors-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '52',
    nodes: [officialAudit('core', 'Statistics core', 'all_of', 'Published calculus/discrete/STAT core through one 500-level STOR course.'), officialAudit('support', 'Computing and foundations', 'all_of', 'COMP choice, calculus, linear algebra, and introductory statistics.'), officialAudit('groups', 'Group A/B electives', 'choose_n', 'Choose three courses from the published Group A or Group B lists.')],
    manualReview: ['Exact Group A/B membership', 'Option and cross-list rules'],
  },
  {
    id: 'data-science-bs', catalogYear: '2026-2027', school: 'School of Data and Information Sciences', program: 'Data Science', degree: 'B.S.', sourceUrl: source('data-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '60–61', admissionGate: 'Application, 3.0 cumulative GPA, and published pre-data-science prerequisites.',
    nodes: [officialAudit('admission', 'Pre-data science track', 'admission_gate', 'DATA 110, programming/statistics choice, mathematics, linear algebra, and discrete choice with C minimum.'), officialAudit('competencies', 'Data-science competencies', 'choose_n', 'Published communication, math/stat, optimization, AI/ML, and computing choices.'), officialAudit('advanced', 'Upper division work', 'choose_n', 'Four upper electives or a four-course concentration.')],
    manualReview: ['Admission decision', 'One course may not satisfy two core nodes', 'DATA 890 limit'],
  },
  {
    id: 'data-science-ba', catalogYear: '2026-2027', school: 'School of Data and Information Sciences', program: 'Data Science', degree: 'B.A.', sourceUrl: source('data-science-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Confirm the current program’s admission and concentration conditions with the official source.',
    nodes: [officialAudit('foundations', 'Data and computational foundations', 'all_of', 'Published data/information, mathematics/statistics, and computational foundations.'), officialAudit('concentration', 'Domain concentration', 'manual_review', 'A declared domain concentration is required; its table and approvals remain official-source review items.')],
    manualReview: ['Exact concentration table', 'B.A. Supplemental General Education', 'Current program admission conditions'],
  },
  {
    id: 'geospatial-data-science-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Geospatial Data Science', degree: 'B.S.', sourceUrl: source('geospatial-data-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'GIS and data-science core', 'all_of', 'Published GIS, geospatial, and data-science core.'), officialAudit('electives', 'Advanced electives', 'manual_review', 'Full official elective table must be reviewed before course selection.')],
    manualReview: ['Full elective table and prerequisites', 'Not interchangeable with Data Science B.S.'],
  },
  {
    id: 'computer-science-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Computer Science', degree: 'B.S.', sourceUrl: source('computer-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('foundations', 'COMP and mathematics foundations', 'all_of', 'Required COMP foundations and mathematics support.'), officialAudit('advanced', 'Upper-level computer science', 'manual_review', 'Published upper-level selection, option, and exclusion rules require official-table review.')],
    manualReview: ['Course-option and exclusion table', 'Degree-specific rules and advising'],
  },
  {
    id: 'earth-marine-sciences-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Earth and Marine Sciences', degree: 'B.S.', sourceUrl: source('earth-marine-sciences-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Earth and marine sciences core', 'all_of', 'Published earth/marine core and required supporting science.'), officialAudit('advanced', 'Advanced electives', 'manual_review', 'Official elective table and any concentration choices require review.')],
    manualReview: ['Advanced-elective list', 'Any concentration/option conditions'],
  },
  {
    id: 'biostatistics-bsph', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Biostatistics', degree: 'B.S.P.H.', sourceUrl: source('biostatistics-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '62', admissionGate: 'Limited Gillings admission; source-declared admission term must be retained.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'MATH 231/232/233, BIOL 101/101L, and COMP 110/116.'), officialAudit('core', 'Public health and BIOS core', 'all_of', 'SPHG 351/352, EPID 600, and published BIOS sequence.'), officialAudit('support', 'Additional quantitative science', 'choose_n', 'Published BIOL, discrete, linear-algebra, and advanced-calculus options.')],
    manualReview: ['Gillings admission term and decision', 'Current catalog page’s admission-year label'],
  },
  {
    id: 'community-global-public-health-bsph', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Community and Global Public Health', degree: 'B.S.P.H.', sourceUrl: source('community-global-public-health-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '52–53', admissionGate: 'Limited Gillings admission.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'BIOL 101/101L, one math option, and SOCI 101, PSYC 101, or ANTH 102.'), officialAudit('core', 'Public-health and HBEH core', 'all_of', 'SPHG, BIOS, EPID, and published HBEH sequence.'), officialAudit('electives', 'Program electives', 'choose_n', 'Choose three approved electives.'), officialAudit('internship', 'Partner internship', 'manual_review', 'HBEH 555 includes a 150-hour partner-organization internship.')],
    manualReview: ['Gillings admission term/decision', 'Director approval', 'Internship completion'],
  },
  {
    id: 'health-policy-management-bsph', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Health Policy and Management', degree: 'B.S.P.H.', sourceUrl: source('health-policy-management-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '57–59', admissionGate: 'Limited Gillings admission.',
    nodes: [officialAudit('admission', 'Admission', 'admission_gate', 'Official admission gate; full published prerequisite table still requires capture.'), officialAudit('experiential', 'Internship and capstone', 'manual_review', 'Published eight-week internship and year-long capstone require official confirmation.')],
    manualReview: ['Full 2026–27 table capture required', 'Admission, internship placement, mentor, and capstone'],
  },
  {
    id: 'nutrition-bsph-health-society', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Nutrition', degree: 'B.S.P.H.', trackOrConcentration: 'Nutrition, Health and Society', sourceUrl: source('nutrition-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '72', admissionGate: 'Limited Gillings admission.',
    nodes: [officialAudit('core', 'Public-health and nutrition core', 'all_of', 'Published SPHG/BIOS/EPID and NUTR core.'), officialAudit('capstone', 'Research and capstone', 'manual_review', 'NUTR 295 with catalog timing/substitution rules.'), officialAudit('science', 'Science requirements', 'all_of', 'BIOL 101/101L, CHEM 101/101L, CHEM 102/102L, and BIOL 252/252L.'), officialAudit('electives', 'Other-field electives', 'minimum_credits', '18 credits from other fields, subject to published exclusions.')],
    manualReview: ['Gillings admission', '18-hour exclusions/double-counting', 'Director approval and capstone timing'],
  },
  {
    id: 'nutrition-bsph-science-research', catalogYear: '2026-2027', school: 'Gillings School of Global Public Health', program: 'Nutrition', degree: 'B.S.P.H.', trackOrConcentration: 'Nutrition Science and Research', sourceUrl: source('nutrition-major-bsph'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '77', admissionGate: 'Limited Gillings admission.',
    nodes: [officialAudit('core', 'Public-health and nutrition core', 'all_of', 'Published SPHG/BIOS/EPID and science/research NUTR core.'), officialAudit('science', 'Science sequence', 'all_of', 'Published BIOL, CHEM, calculus, and two-course physics sequence.'), officialAudit('capstone', 'Research and capstone', 'manual_review', 'Published research/capstone and honors-substitution rules.')],
    manualReview: ['Gillings admission', 'Track-specific prerequisites', 'Capstone and honors substitution'],
  },
  {
    id: 'biomedical-engineering-bs', catalogYear: '2026-2027', school: 'Joint UNC / NC State program', program: 'Biomedical Engineering', degree: 'B.S.', sourceUrl: source('biomedical-engineering-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '124', admissionGate: 'Program admission required; university admission is not sufficient.',
    nodes: [officialAudit('admission', 'Admission prerequisites', 'admission_gate', 'CHEM 101/101L, ENGL 105, MATH 231/232, and PHYS 118 with published grade minima.'), officialAudit('core', 'BMME core', 'all_of', 'Published second- and third-year BMME blocks.'), officialAudit('specialty', 'Gateway and specialty electives', 'choose_n', 'Three gateway electives, a 300+ STEM elective, and four specialty electives across no more than two areas.'), officialAudit('capstone', 'Capstone', 'all_of', 'BMME 697 and 698.')],
    manualReview: ['Admission decision', 'UNC/NC State equivalents', 'Required advisor approval each term'],
  },
  {
    id: 'applied-sciences-bs-environmental-engineering', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Applied Sciences', degree: 'B.S.', trackOrConcentration: 'Environmental Engineering', sourceUrl: source('applied-sciences-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Applied sciences core', 'all_of', 'Published APPL engineering core.'), officialAudit('track', 'Environmental engineering track', 'all_of', 'Published five-course track block.'), officialAudit('capstone', 'Capstone', 'all_of', 'APPL 697 and 698.')],
    manualReview: ['Course marked pending approval', 'Track course availability'],
  },
  {
    id: 'applied-sciences-bs-materials-engineering', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Applied Sciences', degree: 'B.S.', trackOrConcentration: 'Materials Engineering', sourceUrl: source('applied-sciences-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Applied sciences core', 'all_of', 'Published APPL engineering core.'), officialAudit('track', 'Materials engineering track', 'all_of', 'Published five-course track block.'), officialAudit('capstone', 'Capstone', 'all_of', 'APPL 697 and 698.')],
    manualReview: ['Track course availability', 'No professional-licensure inference'],
  },
  {
    id: 'exercise-sport-science-ba-general', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Exercise and Sport Science', degree: 'B.A.', trackOrConcentration: 'General', sourceUrl: source('exercise-sport-science-major-ba-general'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '32',
    nodes: [officialAudit('core', 'EXSS core', 'all_of', 'Published EXSS 155/256/180/181/273/288/376/380/385 sequence.'), officialAudit('biology', 'Biology support', 'all_of', 'BIOL 101 and 101L.')],
    manualReview: ['B.A. supplemental general education'],
  },
  {
    id: 'exercise-sport-science-ba-fitness', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Exercise and Sport Science', degree: 'B.A.', trackOrConcentration: 'Fitness Professional', sourceUrl: source('exercise-sport-science-major-ba-fitness-professional'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '43',
    nodes: [officialAudit('core', 'Fitness-professional core', 'all_of', 'Published EXSS anatomy, fitness, physiology, prescription, and practicum requirements.'), officialAudit('choices', 'Published course choices', 'choose_n', 'Published biomechanics/neuromuscular, training, and chemistry/biochemistry choices.')],
    manualReview: ['Practicum and extra-credit logic', 'B.A. supplemental general education'],
  },
  {
    id: 'exercise-sport-science-ba-sport-admin', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Exercise and Sport Science', degree: 'B.A.', trackOrConcentration: 'Sport Administration', sourceUrl: source('exercise-sport-science-major-ba-sport-administration'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '34',
    nodes: [officialAudit('core', 'Sport-administration core', 'all_of', 'Published EXSS 221/322/323/324/326/424 sequence.'), officialAudit('electives', 'EXSS electives', 'minimum_credits', 'Nine EXSS credits with at least one 200+ course.'), officialAudit('support', 'Economics and statistics', 'choose_n', 'ECON 101 and a published statistics choice.')],
    manualReview: ['Track distinct from other EXSS degrees'],
  },
  {
    id: 'exercise-sport-science-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Exercise and Sport Science', degree: 'B.S.', sourceUrl: source('exercise-sport-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '60–62',
    nodes: [officialAudit('core', 'EXSS core', 'all_of', 'EXSS 155/256/273/376/380/385.'), officialAudit('electives', 'EXSS electives', 'minimum_credits', 'Five named electives with 9 credits at 400+.'), officialAudit('science', 'Science/math choice', 'choose_n', 'Choose three published chemistry, physics, or calculus courses.'), officialAudit('allied', 'Allied sciences', 'minimum_credits', 'Four electives across two subjects, including a life-science subject.')],
    manualReview: ['EXSS 190 exclusion', 'Named elective and allied-science lists'],
  },
  {
    id: 'clinical-laboratory-science-bs', catalogYear: '2026-2027', school: 'School of Medicine', program: 'Clinical Laboratory Science', degree: 'B.S.', sourceUrl: source('clinical-laboratory-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Competitive limited admission.',
    nodes: [officialAudit('admission', 'Science and math prerequisites', 'admission_gate', 'Published BIOL, CHEM, and MATH/STOR prerequisites (22–24 hours), grades, application, interview, and letters.'), officialAudit('clinical', 'CLSC core and rotations', 'manual_review', '62 credits of program core and clinical rotations.')],
    manualReview: ['Admission decision/deadline', 'Interview, letters, clinical placement and compliance'],
  },
  {
    id: 'neurodiagnostics-sleep-science-bs', catalogYear: '2026-2027', school: 'School of Medicine', program: 'Neurodiagnostics and Sleep Science', degree: 'B.S.', sourceUrl: source('neurodiagnostics-sleep-sciences-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '81',
    nodes: [officialAudit('program', 'Program requirements', 'manual_review', 'Separate professional B.S.; detailed 2026–27 entry and clinical rules still require direct source capture.')],
    manualReview: ['Official program access, eligibility, clinical placement, and compliance'],
  },
  {
    id: 'radiologic-science-bs', catalogYear: '2026-2027', school: 'School of Medicine', program: 'Radiologic Science', degree: 'B.S.', sourceUrl: source('radiologic-science-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '72–74',
    nodes: [officialAudit('program', 'Program requirements', 'manual_review', 'Separate professional B.S.; detailed 2026–27 entry and clinical rules still require direct source capture.')],
    manualReview: ['Official program access, eligibility, clinical placement, and compliance'],
  },
  {
    id: 'nursing-bsn', catalogYear: '2026-2027', school: 'School of Nursing', program: 'Nursing', degree: 'B.S.N.', sourceUrl: source('nursing-major-bsn'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '60',
    nodes: [officialAudit('program', 'Program requirements', 'manual_review', 'Detailed 2026–27 progression, clinical, and compliance rows still require direct source capture.')],
    manualReview: ['Admission/progression decision', 'Clinical placement, compliance, and licensure eligibility'],
  },
  {
    id: 'dental-hygiene-bs', catalogYear: '2026-2027', school: 'Adams School of Dentistry', program: 'Dental Hygiene', degree: 'B.S.', sourceUrl: source('dental-hygiene-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Competitive limited admission.',
    nodes: [officialAudit('admission', 'Prerequisite choices', 'admission_gate', 'Published BIOC/CHEM, anatomy/EXSS, communication, SOCI, MCRO, and PSYC choices.'), officialAudit('clinical', 'Clinical curriculum', 'manual_review', 'Program clinical curriculum after admission.')],
    manualReview: ['Application, letters, shadowing, transfer review, clinical compliance, and licensure'],
  },
  {
    id: 'psychology-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Psychology', degree: 'B.A.', sourceUrl: source('psychology-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '40–41',
    nodes: [officialAudit('core', 'Psychology core', 'all_of', 'PSYC 101, 210, and 270.'), officialAudit('breadth', 'Area breadth', 'choose_n', 'One sub-400 course from four of five published areas.'), officialAudit('advanced', 'Advanced psychology/neuroscience', 'minimum_credits', 'Published 395–699 and additional-course rules.'), officialAudit('support', 'Science and quantitative support', 'all_of', 'BIOL, allied science, and distinct FC-QUANT nodes.')],
    manualReview: ['NSCI 225 may not satisfy two areas', 'Double-major substitutions', '45-hour departmental cap'],
  },
  {
    id: 'psychology-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Psychology', degree: 'B.S.', sourceUrl: source('psychology-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Psychology methods core', 'all_of', 'PSYC 101 (C+), 210, and 270 with limited NSCI double-major substitution.'), { ...officialAudit('breadth', 'Area breadth', 'choose_n', 'Behavioral/cognitive and two-of-three breadth groups.'), noDoubleCountWith: ['NSCI 225 may satisfy only one of the two breadth areas.'] }, officialAudit('advanced', 'Advanced and additional work', 'all_of', 'Special requirement, advanced, and additional PSYC/NSCI nodes.'), officialAudit('support', 'Science and quantitative support', 'choose_n', 'BIOL, science/math choice, distinct FC-QUANT, and allied-science nodes.')],
    manualReview: ['PSYC/NSCI 45-hour cap', 'NSCI 225 one-area-only and no-double-count policy'],
  },
  {
    id: 'medical-anthropology-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Medical Anthropology', degree: 'B.A.', sourceUrl: source('medical-anthropology-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('foundation', 'Foundation and methods', 'all_of', 'Two foundational courses and one methods/experience requirement.'), officialAudit('electives', 'Medical anthropology electives', 'minimum_credits', 'Six electives with biological/ecological and sociocultural distribution; published level restrictions.')],
    manualReview: ['External-course DUS approval', 'Variable-credit internships and independent study', 'B.A. supplemental general education'],
  },
  {
    id: 'anthropology-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Anthropology', degree: 'B.A.', sourceUrl: source('anthropology-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('foundation', 'Anthropology foundation and core', 'all_of', 'Published anthropology foundation/core and methods.'), officialAudit('area', 'Concentration or area choices', 'manual_review', 'The selected area’s conditions require source-table review.')],
    manualReview: ['Concentration/area conditions', 'B.A. Supplemental General Education'],
  },
  {
    id: 'sociology-ba', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Sociology', degree: 'B.A.', sourceUrl: source('sociology-major-ba'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', publishedHours: '27',
    nodes: [officialAudit('core', 'Sociology core', 'all_of', 'SOCI 101 (C+), 250, 251, and 252.'), officialAudit('advanced', 'Upper-level sociology', 'minimum_credits', 'Three 400-level electives and two additional SOCI courses.'), officialAudit('substitutions', 'Double-major substitutions', 'manual_review', 'Named PSYC, PLCY, and ECON substitutions require an additional 400-level SOCI course.')],
    manualReview: ['Double-major substitution', 'Duplicate-credit exclusions', 'Advisory medicine/public-health cluster is not an audit node'],
  },
  {
    id: 'human-development-family-science-baed', catalogYear: '2026-2027', school: 'School of Education', program: 'Human Development and Family Science', degree: 'B.A.Ed.', sourceUrl: source('human-development-family-science-major-baed'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated', admissionGate: 'Confirm program admission and practicum conditions using the owning official source.',
    nodes: [officialAudit('curriculum', 'Professional curriculum', 'all_of', 'Published human development and family science professional curriculum.'), officialAudit('practicum', 'Practicum and program conditions', 'manual_review', 'Practicum, program, and admission evidence cannot be inferred from local courses.')],
    manualReview: ['B.A.Ed. is distinct from B.A.', 'Program admission and practicum evidence'],
  },
  {
    id: 'economics-bs', catalogYear: '2026-2027', school: 'College of Arts and Sciences', program: 'Economics', degree: 'B.S.', sourceUrl: source('economics-major-bs'), retrievedAt: '2026-08-25', sourceStatus: 'source-validated',
    nodes: [officialAudit('core', 'Quantitative economics core', 'all_of', 'Published economics core and mathematics/statistics support.'), officialAudit('electives', 'Economics electives', 'manual_review', 'Official quantitative elective and option rules require review.')],
    manualReview: ['Exact elective/option rules', 'Included as a common health-policy path, not a health-profession curriculum'],
  },
]

export const UNC_PLANNING_LIBRARY_BY_ID = new Map(UNC_PLANNING_LIBRARY.map((set) => [set.id, set]))

export function planningRequirementSet(id: string) {
  return UNC_PLANNING_LIBRARY_BY_ID.get(id)
}

/** Candidate-plan coverage only. It never marks a catalog node fulfilled: a
 * course code lacks the official term, grade, attribute, and exception data. */
export function candidatePlanCoverage(requirementSet: UncPlanningRequirementSet, courseCodes: readonly string[]): CandidatePlanNodeCoverage[] {
  const scheduled = new Set(courseCodes.map((code) => code.trim().toUpperCase()))
  return requirementSet.nodes.map((node) => {
    const mapped = (node.courseCodes ?? []).filter((code) => scheduled.has(code.toUpperCase()))
    if (node.kind === 'manual_review' || node.kind === 'admission_gate' || !node.courseCodes?.length) {
      return { node, state: 'manual-review', scheduledCourses: mapped, detail: 'Needs official audit, program/adviser evidence, or a fully captured option table.' }
    }
    return mapped.length
      ? { node, state: 'scheduled', scheduledCourses: mapped, detail: 'A matching local course is scheduled or recorded; this is not official fulfillment.' }
      : { node, state: 'not-scheduled', scheduledCourses: [], detail: 'No matching local course is scheduled. Review the source before choosing a course.' }
  })
}

/** A deliberate safety rail for future callers: local planned/taken courses
 * cannot turn these catalog references into a completion verdict. */
export function planningRequirementOutcome(_: UncPlanningRequirementSet): RequirementEvaluation {
  return 'official-audit-required'
}
