# Decisions — Section-aware M2M drills

**Mockup:** `specifications/mockups/02-mcat/mcat-section-aware-drills.html`
**Spec:** `tabs/02-mcat.md` §3.9 (P3 rejection), §3.9-a (drill scheduling), §4 (M2M loop), §2b (`missReason`)
**Exact visual values:** `decisions/_visual-recipes.md` — used literally. MCAT accent = `--mcat`.

The mockup shows one drill screen twice: a **C/P drill** from an `arithmetic` miss and a **CARS drill** from a `trap-answer` miss.

---

## The point of the mockup

**There is ONE drilling surface.** Only the drill *body* changes by section. Everything else — session spine, drill counter, timer, origin card, submit action, tutor entry — is identical.

If a build produces a second practice surface, a section mode, or a separate queue, **the build is wrong even if every listed requirement passes.**

## Locked

1. **No section modes, no specialised drilling, no second drill surface.** P3 was rejected in full (§3.9). Verify by grep: no B/B mode, no P/S mode, no C/P speed drills, no procedural drill generator.
2. **Identical in every section:** breadcrumb · session spine · `Drill N / M` · timer · origin card (section · cause · source · attempt count · one-line why) · submit · `Talk it through`.
3. **The drill body varies by section:**

   | Section | Body |
   |---|---|
   | **C/P** | A calculation with real numbers and given relationships. `NO CALCULATOR · ESTIMATE` marker. **Distractors are the specific wrong answers the student's own error produces** — e.g. the value you get if you drop the square root. |
   | **B/B** | A small data/figure interpretation item. |
   | **P/S** | A term-application item. |
   | **CARS** | A **pattern drill with NO passage** (see below). |

4. **CARS drills generate no passage — ever.** §2a forbids it. Instead the drill trains the **answer-choice pattern in isolation**: *"an author writes 'may have contributed to' — which option is the extreme-language trap?"* Recognising the pattern is the actual skill and needs no passage. **Cheaper to build and more targeted than re-presenting a passage.** Marker in the UI: `NO PASSAGE GENERATED · §2a`.
5. **NO self-grading. `Again / Hard / Good / Easy` does not exist here** (§3.9-a). A multiple-choice drill has already scored the student objectively; asking how it felt is redundant and invites self-flattery (`01` §6.14).
6. **The outcome is the grade**, three ways: **wrong → soon · right but flagged/guessed → medium · right and unflagged → longer.** `ts-fsrs` drives the intervals — **still one scheduler.**
7. **Intervals are shown, never chosen.** The footer is `Submit answer` plus a quiet "scheduling is automatic" line.
8. **Mastery = cleared correctly and unflagged across ≥2 spaced encounters.** One correct answer right after reading the explanation proves nothing. `resolvedAt` is set by that criterion, never by a self-rating.
9. **Origin card always states the cause and the source**, and the attempt count when > 1.

## Do not

- Do not add a mode switcher, a section picker, or a second queue.
- Do not add self-grading buttons anywhere in the drill flow.
- Do not generate a CARS passage, or any MCAT-style passage, under any circumstances.
- Do not fork the drill screen per section — **one component, four templates.**
- Do not let the drill body's variation leak into the chrome.
