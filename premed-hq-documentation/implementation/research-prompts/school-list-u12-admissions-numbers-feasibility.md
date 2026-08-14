# Research packet — revisiting `U-12` / School List §1: per-school admissions numbers

**Question.** Can Premed OS responsibly ship sourced, per-school entering-class MCAT/GPA figures as a maintained product dataset, rather than continuing to accept those numbers only when a student enters them?

**Scope.** This is a feasibility and maintenance investigation only. It does **not** import a dataset, alter `data/med-schools.json`, change the app, or amend `general.md` `U-12` or School List §1. Acceptance rate remains cut unconditionally.

**Accessed:** 2026-08-13

## Decision summary

**No: do not reopen the shipped-numbers rule.** The source question is not whether two public figures can sometimes be found. They can. The failure is that official schools publish an inconsistent subset, with different cohort definitions, statistics, fields, cadences, and locations; meanwhile MSAR is a current, student-accessible product designed to reconcile exactly those differences. A two-field copy would still require an annual, school-by-school provenance operation and would still be a materially weaker substitute.

**Part B is therefore not undertaken.** There is no dataset, import plan, or display proposal in this packet.

The narrow constructive option that survives the evidence is **student-supplied paste-to-parse**: a student copies a source they are entitled to use (for example, their own MSAR view) and Premed OS parses only the existing student-entered fields, preserves the pasted source/date, and makes no fetch or sync. That is a possible future `DUPLICATE-MINIMAL` proposal, not authorization to build it.

## Part A1 — what official school pages actually supply

The purposive 25-school verification sample covers public/private MD and DO programs and multi-campus systems. It is not a national prevalence estimate. Values are recorded exactly as the source labels them; they are **not normalized**.

| School / official source | Profile result | What is actually published |
|---|---|---|
| [Michigan MD](https://medschool.umich.edu/programs-admissions/md-program/md-program-our-community/u-m-medical-school-profiles-demographics) | Both, incoming class | average science/total GPA 3.78/3.82; **MCAT percentile** 90.1, not total score. |
| [Yale MD](https://medicine.yale.edu/about/history-facts-and-figures/) | Both, Class of 2028 | **median cumulative GPA** 3.94; **median MCAT** 521; median sections 130. |
| [UC Irvine MD](https://medschool.uci.edu/education/medical-education/medical-degree-program/admissions) | Both, cohort label split across page | median science/cumulative GPA 3.83/3.86; median total MCAT 516 and sections. |
| [UVA MD](https://med.virginia.edu/md-program/admissions/about-uva-school-of-medicine/statistics-overview/) | Both, entering 2025 | mean GPA 3.85; mean MCAT 518 and section values. |
| [Ohio State MD](https://medicine.osu.edu/education/md/admissions/before-you-apply/entering-class-profile) | Both, 2025 entering class | total/science GPA 3.83/3.79; MCAT 514; statistic label unstated. |
| [Indiana MD](https://mmia.medicine.iu.edu/-/media/files/iusm-fact-sheet.pdf) | Both, Class of 2029 | average GPA 3.84; average MCAT 512.4; 365 enrolled. |
| [Colorado MD](https://medschool.cuanschutz.edu/deans-office/leadership/facts-and-figures-2024) | Both, annual fact-sheet series | total/science GPA and MCAT totals, with cohort/population caution. |
| [Wright State MD](https://medicine.wright.edu/admissions/prerequisites-and-application) | Both, Class of 2028 | average BCPM 3.68; average **highest** MCAT 508.76; 130 matriculated. |
| [UAMS MD](https://medicine.uams.edu/admissions/apply/) | Both, **accepted** class | average GPA 3.86; average MCAT 510. |
| [Kentucky MD](https://medicine.uky.edu/sites/default/files/inline-files/2028%20Class%20Profile%20%281%29_0.pdf) | Both, Class of 2028 | average total/science GPA 3.83/3.76; average MCAT 506; 207 matriculated. |
| [UCLA MD](https://medschool.ucla.edu/education/md-education/admissions/preparing-to-apply) | Neither | Official FAQ directs students to MSAR for class-average GPA. |
| [Arizona Tucson MD](https://medicine.arizona.edu/education/degree-programs/md-program/admissions) | Neither class profile | secondary screen only: 498 MCAT and 3.0 overall/BCPM minimums. |
| UNC MD | No recent profile located in a quick official audit | Current material supplies requirements, not an incoming-class statistic. Absence is not claimed conclusive. |
| [Penn MD](https://www.med.upenn.edu/admissions/entering-class-profile) | Both | Current profile publishes medians and means, science/AO/overall GPA, and MCAT total. |
| [Tulane MD](https://medicine.tulane.edu/education/undergraduate-medical-education-md-program/admissions/class-profile) | Both, Class of 2030 | average GPA 3.71; average MCAT 509. |
| [Western Michigan MD](https://wmed.edu/mdclass2030profile) | Both, Class of 2030 | average GPA 3.81; average MCAT 513. |
| [Medical College of Georgia MD](https://www.augusta.edu/mcg/documents/2026-fact-sheet-copy-5.11.26.pdf) | Both, Class of 2029 | average GPA 3.8; average MCAT 512. |
| [KCU-COM DO](https://www.kansascity.edu/admissions/student-profile) | Both, Class of 2026 | average science/cumulative GPA 3.62; average MCAT 505; campus differences. |
| [Campbell CUSOM DO](https://medicine.campbell.edu/admissions/student-profile/) | Both, latest matriculated class | average science/cumulative GPA 3.54/3.61; average MCAT 506. |
| [Rowan-Virtua DO](https://som.rowan.edu/education/admissions/faq.html) | MCAT + science GPA only | accepted 2025 class: average science GPA 3.70; MCAT 508 and BBFL section 127; no cumulative GPA. |
| [NYITCOM DO](https://site.nyit.edu/files/medicine/NYITCOM_Viewbook_2024.pdf) | Both, stale / multi-campus ambiguity | Class of 2027 brochure: mean science/cumulative GPA 3.6/3.7; MCAT 506. |
| [WesternU COMP/HCOM DO](https://www.westernu.edu/osteopathic/programs/competitive/) | Both, August 2025 entering class | campus-split means: CA 3.82/3.65/509; OR 3.58/3.57/507. |
| [ACOM DO](https://www.acom.edu/class-profiles/) | Both, Class of 2029 recruitment brochure | overall GPA 3.45; MCAT 503. |
| [VCOM DO](https://www.vcom.edu/admissions/applying/requirements) | MCAT range only | accepted average 500–506; no public GPA; multi-campus/population ambiguous. |
| [LECOM DO](https://lecom.edu/college-of-osteopathic-medicine/com-entrance-requirements/) | Neither class profile | 2.7 overall minimum and competitive-MCAT policy / alternate index, not a class statistic. |

**Sample count:** 17/25 publish both an MCAT and GPA value; 3/25 publish MCAT only; 5/25 publish neither a usable class profile nor both requested values. Of the 20 that publish a profile, 14 explicitly use mean/average, 3 use median, 1 leaves the statistic unstated, and the rest are thresholds/ranges or partial fields. Fifteen label a matriculant/entering cohort, two label accepted applicants, and eight leave population unstated or inferential.

### A2 — the values are not one field

The sample has all of the following, each with a different meaning:

- **Median vs. average/mean:** Yale and UC Irvine publish medians; Indiana, UAMS, Kentucky, Tulane, and KCU publish averages/means. A mean cannot honestly occupy a `medianMCAT` or `medianGPA` key.
- **Population:** the table mixes matriculants/enrolled students with *accepted students* (UAMS and Rowan), plus several pages whose population is unstated. A value from accepted applicants is not interchangeable with a value from people who matriculated.
- **GPA denominator:** cumulative/total, BCPM, and science GPA are all present. BCPM may be the right AMCAS term, but it is still not interchangeable with an institution’s own “science” label without a stated transformation.
- **MCAT representation:** total score, total percentile, range, and section values coexist. Michigan’s profile shows that a school can publish a valid MCAT fact without publishing an importable total score.
- **Cohort timing:** “Class of 2029,” “2025 entering class,” “latest matriculated class,” and year-labeled brochures coexist. A product would have to retain the exact cohort and source publication/access dates, not just the number.

**Normalizability verdict:** no. Premed OS could store a tagged *source observation* (`statistic`, `population`, `cohort`, `value`, `sourceUrl`, `checkedOn`) but it cannot truthfully turn this evidence into two uniform per-school fields. That changes the proposed project from “maintain two numbers” into an admissions-statistics provenance system.

### A3–A4 — volatility and retrieval surface

Five independent official year-to-year checks each changed at least one figure; three also moved/renamed the retrieval path. This is illustrative, not a population estimate:

- [Penn](https://www.med.upenn.edu/admissions/entering-class-profile) keeps a stable URL, but current values are median GPA/MCAT **3.98/522** versus **3.97/521** in its [2025 capture](https://web.archive.org/web/20251211111220id_/https://www.med.upenn.edu/admissions/entering-class-profile).
- [Ohio State’s current profile](https://medicine.osu.edu/education/md/admissions/before-you-apply/entering-class-profile) reports **3.86/3.81/513** (total GPA/science GPA/MCAT) for 2026 versus **3.83/3.79/514** on its [previous-profile route](https://medicine.osu.edu/education/md/admissions/before-you-apply/previous-class-profile).
- Western Michigan’s Class of 2028 page was at `www.med.wmich.edu/node/3767`, its [Class of 2029](https://www.med.wmich.edu/mdclass2029profile) reports 3.81/512, and its [Class of 2030](https://wmed.edu/mdclass2030profile) reports 3.81/513. The host/path changed.
- Tulane’s Class of 2029 was **3.70/510** in a [2025 PDF](https://medicine.tulane.edu/sites/default/files/2025-08/2025-At-a-Glance.pdf); its Class of 2030 is **3.71/509** in a [renamed 2026–27 PDF](https://medicine.tulane.edu/sites/default/files/2026-07/2026-27-At-a-Glance.pdf).
- Medical College of Georgia’s [Class of 2028 fact sheet](https://www.augusta.edu/mcg/admissions/documents/2025-fact-sheet-8.5.2025.pdf) reports 3.8/513, while its [Class of 2029 fact sheet](https://www.augusta.edu/mcg/documents/2026-fact-sheet-copy-5.11.26.pdf) reports 3.8/512. Its [same-cohort FAQ](https://www.augusta.edu/mcg/admissions/faqs.php) gives 512, a small but real reconciliation problem before any data is shipped.

The full sample contains durable HTML profile pages, WordPress admissions pages, institutional pre-health pages, school-wide facts pages, dated news items, and downloadable PDFs. It therefore needs an active source registry and an annual change/reconciliation pass, not simply a web link per school.

This is a maintenance result, not an argument that schools are doing anything wrong. It means the product cannot claim a single durable “school profile” endpoint per school.

## Part A5 — what MSAR supplies that the school-page sample does not

MSAR says its paid profiles include applicant MCAT, overall GPA, and science GPA for **accepted in-state and out-of-state applicants and matriculants**, along with experience, waitlist information, requirements, dates, tuition/aid, demographics, and four years of data. It states the data comes from the MCAT exam, AMCAS application, and individual medical schools, and that AAMC partners with admissions offices to update profiles throughout the year.

That matters because a school’s own public marketing/profile page can accurately present one cohort’s average while MSAR can present source-labelled splits and longer context. A disagreement would not automatically mean either source is false: it may be **mean vs. median**, **accepted vs. matriculated**, **in-state vs. all**, or a different cohort. Premed OS would need to explain those distinctions before displaying a “conflict,” which is again the work it is not staffed to own.

## Part A6 — access, price, and whether the incumbent is reachable

| Question | Verified answer |
|---|---|
| Current individual price | AAMC Store lists the 2026 MSAR at **$33 for one year** and **$41 for two years**. The earlier `$28/$36` language in School List §1 is stale. |
| Fee Assistance Program | The 2026 benefit is a **complimentary two-year** MSAR subscription, listed by AAMC as a $41 value. |
| Eligibility (2026) | AAMC requires a U.S.-based home address, medical-school intent, and each reported household’s 2025 income at or below **400% of the 2025 federal poverty level**; for applicants under 26, parent information is required even if independent. |
| Campus/institutional access | This pass found no AAMC statement that university pre-health offices receive a general institutional MSAR license. MSAR product terms say individual use and non-transferability. A school may separately buy access codes, but that is not evidence of common student access and must not be assumed for UNC. |

The Fee Assistance result satisfies the accessibility arm of `U-12` for qualifying students; the low individual price is also strong evidence that replacing the database is not the cost-effective student benefit.

## Part A7 — third-party compiled lists are not an acceptable source layer

Third-party lists demonstrate retrievability, not provenance or maintainability. Their pages frequently describe data as sourced from MSAR, and they do not provide a canonical public, per-field update ledger equivalent to school/AAMC provenance. “No” below means the reviewed material did not expose all three necessary elements: exact school-level source, retrieval/cycle date, and an unambiguous population definition.

| Source named in question | Per-school source / date / population disclosed? | Reuse result (short direct text where found) |
|---|---|---|
| [Shemmassian](https://www.shemmassianconsulting.com/website-content-license-agreement) | No canonical public statistics dataset reviewed; no usable three-field provenance record located. | “individual and personal and private use only”; it also prohibits copying and scraping. |
| [Jack Westin](https://jackwestin.com/guarantee/) | Its admissions material uses school medians in advising/guarantee rules, but no canonical source-cited per-school dataset, retrieval date, or population ledger was located. | No matching site-wide reuse terms were located in this pass; that is a non-finding, not permission. |
| [MedEdits](https://mededits.com/website-disclaimer) | No reviewed all-school dataset exposed a per-row source/date/population contract. | “personal, non-commercial use only”; no reproduction or distribution without written consent. |
| [Leland](https://www.joinleland.com/legal/terms) | Admissions articles were topical, not a verified, dated, per-school dataset. | It prohibits creating external compilations by “scrape, extract, download, copy, or harvest” without written consent. |
| [Inspira Advantage](https://www.inspiraadvantage.com/blog/gpa-and-mcat-scores-for-all-medical-schools) | Broad MD table says it is according to MSAR; it does not supply a primary per-row source ledger. | Terms prohibit copying/republishing service content without explicit written consent. |
| [The Match Guy](https://thematchguy.com/terms-conditions/) | No medical-school admissions-statistics corpus located; stated scope is residency-match consulting. | Its terms identify proprietary “Digital Content”; no separate statistics-dataset license was located. |
| [Accepted.com](https://www.accepted.com/terms-use/) | No reviewed per-school corpus supplied the required source/date/population fields. | “You will not modify, publish, transmit … [or] create derivative works” from site content. |

These are usage restrictions, not the decisive policy reason. The decisive reason remains maintenance and evidence quality. The terms simply remove the tempting “scrape an already compiled list” shortcut.

## Part A8 — structured/public/licensable source check

No official public API or downloadable, current, field-level per-school admissions-statistics feed was located in this pass. The public MSAR landing and Store pages expose the **product** and basic public profiles; the subscription provides the richer data. The visible MSAR application supports human browse/filter/compare, not a public data-service contract. AAMC’s site terms also prohibit automated collection/mirroring absent permission.

This is a scoped non-finding: it does **not** prove that no enterprise license or bespoke AAMC agreement exists. It proves Premed OS has no identified public structured source it may ingest. A future team that wants to pursue a license must obtain a written data agreement that covers fields, delivery, update cadence, display rights, redistribution, corrections, and the MD/DO boundary before any design work starts.

## Part A9 — maintenance estimate and verdict

The optimistic “two numbers × 240 schools” framing is false. Each annual refresh must locate the correct current page, decide whether it is a profile rather than a minimum/cutoff/marketing statistic, identify statistic/population/cohort, preserve the source, check prior-year movement, resolve missing data honestly, and retain an audit trail.

| Operation | Assumption | Initial 240-school build | Annual re-verification |
|---|---|---:|---:|
| Find/validate source or record verified absence | 8–15 min initially; 5–12 min annually | 32–60 hr | 20–48 hr |
| Extract values plus statistic/population/cohort/provenance | 5–10 min | 20–40 hr | 20–40 hr |
| Resolve changed source, PDF, threshold, multi-campus profile, or conflict | 7–25 min on the affected portion of the set | 28–100 hr | 16–80 hr |
| QA, stale-link repair, and change review | 5–10 min | 20–40 hr | 20–40 hr |
| **Realistic total** | **not a batch import** | **100–240 hr** | **76–208 hr every year** |

This still excludes DO-source coverage beyond the sample, legal/licensing diligence, a correction channel, consumer-facing explanation of cohort/statistic differences, and the time to confirm pages that publish nothing. The first thing to break would be **semantic/provenance QA**—a current-looking field silently mixing an accepted-applicant mean with a matriculant median—not the HTTP fetch itself. It is not credible to call this “a small static file.”

**Verdict:** not maintainable for Premed OS as currently scoped. The current rule is the honest one: keep a stable directory; let the student enter/paste the dated admissions facts they choose to track; derive only transparent arithmetic from their own inputs; and send discovery/comparison to MSAR.

## Primary sources

- [AAMC Store — 2026 MSAR one-year subscription](https://store.aamc.org/medical-school-admission-requirementstm-msarr-for-u-s-and-canada-online-1-year-subscription.html) and [two-year subscription](https://store.aamc.org/medical-school-admission-requirementstm-msarr-for-u-s-and-canada-online-2-year-subscription.html) — price, fields, individual-use terms, and update model.
- [AAMC — MSAR FAQ](https://students-residents.aamc.org/medical-school-admission-requirements/buying-and-using-medical-school-admission-requirements-faq) — annual publication/access and Fee Assistance access.
- [AAMC — 2026 Fee Assistance benefits](https://students-residents.aamc.org/fee-assistance-program/what-are-benefits-fee-assistance-program) and [income eligibility](https://students-residents.aamc.org/fee-assistance-program/publication-chapters/fee-assistance-program-household-income-guidelines) — free two-year subscription and eligibility.
- [AAMC — MSAR data/source overview](https://students-residents.aamc.org/medical-school-admission-requirements/tips-get-most-medical-school-admission-requirements-msar) and [product instructions](https://store.aamc.org/msar-instructions) — data sources and school-office update model.
- [AAMC website terms](https://www.aamc.org/website-terms-conditions) — automated collection/mirroring restriction.
- Official school sources linked individually in the A1 table.
- Third-party terms: [Shemmassian](https://www.shemmassianconsulting.com/website-content-license-agreement), [MedEdits](https://mededits.com/website-disclaimer), [Leland](https://www.joinleland.com/legal/terms), [Inspira](https://www.inspiraadvantage.com/terms-and-conditions), and [Accepted](https://www.accepted.com/terms-use/). Accessed 2026-08-13.

## Explicit non-findings and boundaries

- No admissions figures were imported or written into Premed OS.
- Acceptance rate remains excluded even if a school publishes it.
- No claim is made that every U.S. MD/DO school lacks an official profile; the opposite is visible in the sample. The governing finding is that public availability and field semantics are inconsistent.
- No claim is made that an institutional MSAR license cannot be negotiated; no current, generally available institutional student-access program was documented.
- This packet does not authorize a UI, a fetch, a scrape, an API integration, or a policy amendment.
