# Academics · Forecast accuracy ledger — decisions

**Status:** PROPOSED · DECIDED, awaiting manifest authorization
**Source:** `academics-forecast-accuracy.html` · **Spec:** `tabs/01-academics.md` #52, §6.12

## Why it exists

§6.12 stars this and does not hedge: **"Log every forecast against its outcome
and show the hit rate. Nobody builds this, and it is what separates a tool from
a horoscope."** Every other feature in the tab asks the student to trust a
prediction. This is the only one that checks whether the predictions deserved it.

It was **undrawn until Aug 19, 2026** — found by sweeping §4.1's numbered
catalogue against the mockup corpus, not by anyone noticing it missing.

## Product views

| View | Job |
|---|---|
| Plain-language ledger | Say what each confidence band has actually been worth, in a sentence. |
| Prediction table | The same record itemised, for checking one topic rather than the system. |
| Below the gate | What the surface does before it has earned the right to say anything. |

## Behaviour

- **Scores per-review predictions, not exam forecasts** (REQUIRED, Andy, July
  2026). A per-review call resolves at the next attempt, giving ~100 resolved
  points within two weeks; a monthly exam forecast resolves monthly and would
  say nothing for a year.
- **The week-four bar:** it must say something real in plain language by week
  four — *"when Premed OS calls a topic solid, you've recalled it 8 times out of
  9."* **If it cannot clear that bar, it does not ship.**
- **Below the sample gate, forecasts are suppressed entirely** rather than shown
  with a caveat. A caveat under an unreliable number is still an unreliable
  number, and students read the number.
- Every line carries its sample size. Intervals and counts, never a lone
  percentage — §6.12's "one visibly wrong number costs more than ten vague ones".
- **A miss is a claim about the app, not the student.** The copy has to carry
  that, or the ledger becomes another surface that makes a student feel behind.

## Appearance

- Lives in **Grades & Archive**, the tab's other backward-looking surface. It is
  not a Daily widget: nothing here changes what to do today.
- **A** is a reading sequence — band, plain sentence, verdict chip. The verdict
  is a word (`Holding up` / `Runs pessimistic`), never a score.
- **B** is a dense ledger line: date, the call, how it resolved. Same record.
- **Below the gate** is spacious and quiet, with one dashed mark and no chart.
  Solid-with-depth throughout; the banner is the only floating surface.

## Implementation selection — A default, B on demand

**Ruled Aug. 22, 2026.** Variant A is the default product view: the
plain-language, sample-attached ledger is the first thing a student sees, so
the surface reads as an accountability claim about Premed OS rather than a
performance report about the student.

Variant B remains available only through a quiet **See resolved calls** action
inside that view. It opens the itemised calls as contextual detail; it is not a
permanent Grades & Archive subtab or a second dashboard. The return route
preserves the default reading sequence.

The **Below the gate** state suppresses both the visible forecast and both
ledger views. It uses the selected A composition's quiet, spacious absence and
does not offer a caveated number, synthetic hit rate, or empty table.
