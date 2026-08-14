# Quick gap fills — three small items

**Three gaps that are cheap and unblocked.** None of these touches `§1`, `U-12`, or any open ruling. **Item 2 needs no research at all.**

---

## 1. `control` — missing on 29 of 240 entries

**What's wrong.** `control` (public / private) is null on 29 schools — 27 DO and 2 MD, almost all newer colleges and branch campuses. **A "public schools only" filter silently returns 211 of 240** and nothing tells the user the other 29 were dropped rather than excluded.

**Cheap because it's directory-level.** Same sources that already filled the rest of the file.

> **Paste from here:**
>
> You are verifying one factual field for a list of U.S. medical schools: **institutional control — `public` or `private`.**
>
> For each school below, determine whether the **degree-granting institution** is public (state-affiliated) or private. Use the school's or parent university's own site, the AACOM college directory, or the LCME directory. **Do not use ranking or consulting sites.**
>
> **Notes that will come up:**
> - **Branch campuses take the parent institution's control.** Several entries below are teaching locations of one college — a Lake Erie or Ohio University campus has the same control as its parent.
> - **"State-related" institutions** (some Pennsylvania schools) are a real ambiguity. Where a school is state-related rather than plainly state-owned, answer `public` and **say so in the note** rather than silently picking.
> - **Private non-profit and private for-profit are both `private`** for this field. Note for-profit status if you find it.
> - **Newly accredited or pre-accreditation schools still have a control value.** Provisional status is not a reason to return null.
>
> Return **only** this JSON:
>
> ```json
> {
>   "retrievedAt": "YYYY-MM-DD",
>   "schools": [
>     { "id": "", "control": "public | private | null",
>       "source": "https://...", "checkedOn": "YYYY-MM-DD", "note": "" }
>   ]
> }
> ```
>
> **Return the `id` exactly as given** — it is the merge key. `null` plus a note if genuinely undeterminable. **Report any school you could not resolve.**
>
> ### The 29 schools
>
> - `the-valley-college-of-osteopathic-medicine` — The Valley College of Osteopathic Medicine (DO, AZ)
> - `university-of-northern-colorado-college-of-osteopathic-medicine` — University of Northern Colorado College of Osteopathic Medicine (DO, CO)
> - `lake-erie-college-of-osteopathic-medicine-at-jacksonville-university` — Lake Erie College of Osteopathic Medicine at Jacksonville University (DO, FL)
> - `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-at-orange-park` — Lincoln Memorial University – DeBusk College of Osteopathic Medicine at Orange Park (DO, FL)
> - `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine-clearwater` — Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine – Clearwater (DO, FL)
> - `orlando-college-of-osteopathic-medicine` — Orlando College of Osteopathic Medicine (DO, FL)
> - `philadelphia-college-of-osteopathic-medicine-south-georgia` — Philadelphia College of Osteopathic Medicine South Georgia (DO, GA)
> - `illinois-college-of-osteopathic-medicine` — Illinois College of Osteopathic Medicine (DO, IL)
> - `meritus-school-of-osteopathic-medicine` — Meritus School of Osteopathic Medicine (DO, MD)
> - `michigan-state-university-college-of-osteopathic-medicine-clinton-township` — Michigan State University College of Osteopathic Medicine – Clinton Township (DO, MI)
> - `michigan-state-university-college-of-osteopathic-medicine-detroit` — Michigan State University College of Osteopathic Medicine – Detroit (DO, MI)
> - `kansas-city-university-college-of-osteopathic-medicine-joplin` — Kansas City University College of Osteopathic Medicine – Joplin (DO, MO)
> - `montana-college-of-osteopathic-medicine` — Montana College of Osteopathic Medicine (DO, MT)
> - `rowan-virtua-school-of-osteopathic-medicine-sewell-campus` — Rowan-Virtua School of Osteopathic Medicine Sewell Campus (DO, NJ)
> - `d-youville-university-college-of-osteopathic-medicine` — D'Youville University College of Osteopathic Medicine (DO, NY)
> - `lake-erie-college-of-osteopathic-medicine-elmira` — Lake Erie College of Osteopathic Medicine – Elmira (DO, NY)
> - `touro-college-of-osteopathic-medicine-middletown` — Touro College of Osteopathic Medicine – Middletown (DO, NY)
> - `ohio-university-heritage-college-of-osteopathic-medicine` — Ohio University Heritage College of Osteopathic Medicine (DO, OH)
> - `ohio-university-heritage-college-of-osteopathic-medicine-cleveland` — Ohio University Heritage College of Osteopathic Medicine – Cleveland (DO, OH)
> - `ohio-university-heritage-college-of-osteopathic-medicine-dublin` — Ohio University Heritage College of Osteopathic Medicine – Dublin (DO, OH)
> - `xavier-university-college-of-osteopathic-medicine` — Xavier University College of Osteopathic Medicine (DO, OH)
> - `oklahoma-state-university-center-for-health-sciences-college-of-osteopathic-medicine-tahlequah` — Oklahoma State University Center for Health Sciences College of Osteopathic Medicine – Tahlequah (DO, OK)
> - `duquesne-university-nasuti-college-of-osteopathic-medicine` — Duquesne University Nasuti College of Osteopathic Medicine (DO, PA)
> - `indiana-university-of-pennsylvania-college-of-osteopathic-medicine` — Indiana University of Pennsylvania College of Osteopathic Medicine (DO, PA)
> - `lake-erie-college-of-osteopathic-medicine-seton-hill` — Lake Erie College of Osteopathic Medicine – Seton Hill (DO, PA)
> - `university-of-the-incarnate-word-school-of-osteopathic-medicine` — University of the Incarnate Word School of Osteopathic Medicine (DO, TX)
> - `noorda-college-of-osteopathic-medicine` — Noorda College of Osteopathic Medicine (DO, UT)
> - `charles-r-drew-university-of-medicine-and-science-college-of-medicine` — Charles R. Drew University of Medicine and Science College of Medicine (MD, CA)
> - `nova-southeastern-university-dr-kiran-c-patel-college-of-allopathic-medicine` — Nova Southeastern University Dr. Kiran C. Patel College of Allopathic Medicine (MD, FL)

**Merge:** set `control` and add a `fieldSources.control` block per entry. **Merge into `fieldSources`, don't replace it** — the `city` block must survive.

---

## 2. `prereqNotes` — no research needed, just a file edit

**What's wrong.** `prereqNotes` is filled on **all 240** entries with one of two generic disclaimer strings. **Any fill-rate check reports it 100% complete** — my own audit script scored it exactly that way — while it carries no per-school information at all. It is the emptiest field in the file and the only one that reads as full.

**The fix, no research required:**

1. Move the disclaimer text to `meta.prereqDisclaimer` — **stated once**, not 240 times.
2. Set every entry's `prereqNotes` to `null`.
3. Add `coverage.prereqNotes: 0` to `meta` so the real number is on the record.

**Why bother if the string is true?** Because a null field states "we don't have this" and a boilerplate field states "we have this," and only one of those is accurate. **This is the same defect class as the all-null `admissionsTests` keys** — a field shaped like data that holds none.

---

## 3. `unc-requirements.json` — 6 majors, and no record of whether that's finished

**What's wrong.** The file is genuinely complete for what it covers: 23 gen-eds, 9 med prereqs, and **6 majors** — Neuroscience, Biology, Chemistry, Psychology, Exercise & Sport Science, Nutrition. Every field is populated; there are no nulls.

**But `01-academics.md` describes the target as** *"build the requirement data model so **any** UNC major plugs in as data… expandable to all UNC majors over time."* **Six is a start against that goal, and nothing in the file records which it is.** A later reader cannot tell a deliberate v1 scope from an unfinished import.

### Decide this before collecting anything

Six majors covers most pre-meds. **The question is not "is 6 enough" but "is 6 the answer or the first batch,"** and the cheapest fix may be a `meta.scope` line rather than more data.

> **⚠️ If the answer is "6 is v1," stop here** — add `meta.majorScope` recording the decision and the reason, and skip the prompt below. **That is a legitimate outcome and costs nothing.**

### Only if you're expanding

> **Paste from here:**
>
> You are extracting undergraduate major requirements from a single university's official catalog: **UNC-Chapel Hill, `catalog.unc.edu`.** Use the official catalog only — **no third-party or advising-blog sources.**
>
> I already have Neuroscience, Biology, Chemistry, Psychology, Exercise & Sport Science, and Nutrition. **Do not redo those.**
>
> 1. **First, list every undergraduate major UNC currently offers**, with its degree type and catalog URL. Give the total count.
> 2. **Then, for the majors I name in a follow-up**, extract the requirements in the schema below.
>
> **Do step 1 and stop.** I will choose the batch from your list.
>
> ```json
> {
>   "retrievedAt": "YYYY-MM-DD",
>   "catalogVersion": "",
>   "majors": [
>     { "major": "", "degree": "", "totalHours": null,
>       "requirements": [], "generalNotes": "",
>       "source": "https://catalog.unc.edu/...",
>       "verificationStatus": "" }
>   ]
> }
> ```
>
> **Match the existing entries' shape exactly** — this merges into a file that already has six majors in this format. **Flag any major whose catalog page is structured differently enough that it doesn't fit.**

**⚠️ Unlike the med-school data, this is one institution and one catalog** — it does not carry the 240-school maintenance problem. It refreshes when UNC publishes a new catalog version, which the file's `freshness` block already tracks.
