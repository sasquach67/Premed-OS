# Promote a page — the third prompt

**Created Aug 20, 2026.** The two-prompt loop drives a **tab**. This drives a **page**.

```
TAB-BRIEF-PROMPT      + [TAB]   → what is the tab's weakest link? write that brief
EXECUTE-BRIEF-PROMPT  + [TAB]   → do that brief
PAGE-PROMOTION-PROMPT + [PAGE]  → is THIS page actually built? prove it or demote it
```

**Why a third one exists.** `built` is a **page-level** claim; the router is
**tab-level**. It asks *"what is furthest behind anywhere in Academics?"* — which is
the right question when a tab is mostly undrawn and the wrong one when twenty pages
exist and twelve have shipped code. Nothing in the loop drove a single page across the
line, so nothing ever got promoted. This does.

> **⚠️ The three pages currently marked `built` were promoted under the OLD rule** —
> visually matches, committed, flip. **They were never tested for working controls,
> persistence, or an empty store.** Audit them first and hardest. A `built` label that
> was never earned is worse than `approved`, because `built` is terminal: the page
> stops being checked and becomes the reference everything else is measured against.

**This prompt does not build anything.** It audits, labels, and hands failures back to
the router. Fixing is the router's job. Keeping those separate is what stops this
becoming another sprawling pass.

---

```
Audit [PAGE] against the six promotion conditions and set its status.

[PAGE] is either one lab page id from variant-lab.html's registry (e.g.
daily-main, class-hub, overview) or one group name (e.g. "Overview",
"Academics"). For a group, do every page in it, one at a time, and
report a row for each.

⚠️ POSTURE: assume NOT BUILT until proved otherwise. You are trying to
falsify the claim, not confirm it. A page you cannot disprove and cannot
prove is NOT BUILT — say which proof you could not obtain and why.

⚠️ AUDIT ONLY. Do not fix, refactor, restyle, or wire anything. If you
find a defect, record it. The router fixes it on a later pass. The one
exception is the status field itself, which you set.

SETUP
  Serve the lab standalone — Vite's Tailwind plugin errors on the
  mockups' own CSS:
      cd mockup-lab && python3 -m http.server 4599
  Run the app separately. You need both open to compare.

FOR EACH PAGE, resolve these first and name them:
  - its registry entry in mockup-lab/variant-lab.html and current status
  - its mockup .html, and its decisions .md
  - the spec section that rules it
  - the surface in src/ that implements it
  If any of those does not exist, say so — that is itself a finding, and
  a page with no decisions .md cannot reach built (it has no recorded
  appearance to match, which is the syllabus-import failure).

THE SIX CONDITIONS — test each, paste the proof, no assertions.

  1 · VISUAL MATCH — measured, not eyeballed, in BOTH themes.
      Read the mockup's own rule:
        grep -o "\.term{[^}]*}" mockup-lab/<path>/<frame>.html
      Read the app's computed value for the same surface:
        getComputedStyle(el).backgroundColor
      Compare THE LADDER, not one value. A drawing that steps
      bg → muted → card must step the same way in the app. Equal-looking
      surfaces are the failure this catches.
      PROOF: a before/after table of surface → mockup value → app value.

  2 · ⭐ EVERY CONTROL WORKS.
      Script every Button, DropdownMenuItem and ContextMenuItem on this
      surface and assert zero without a handler — the audit from 4fe210f.
      A deliberately disabled control must say why in the code.
      PROOF: paste the script's output. "I read the code" is not proof.

  3 · ⭐ EVERY RULED BEHAVIOUR PERSISTS.
      List what the spec section rules. Perform each in the running app,
      then RELOAD. If it does not survive the reload it is not built.
      PROOF: the list, each marked survived/lost, with the store slice or
      service it writes to.

  4 · ⭐ NO MOCK, PLACEHOLDER, SAMPLE OR HARDCODED DATA.
      Empty the store and load the surface. Every panel must show its real
      empty state.
      PROOF: what you saw with an empty store. Any number that survived is
      a defect — name it with file:line.

  5 · ⭐ INTEGRATIONS CODED **AND** CONFIGURED.
      For every external dependency this page needs — calendar, storage,
      an API, an auth scope — say which of these it is:
        CODE MISSING → not built.
        CODE BUILT, NOT CONFIGURED → NOT BUILT. Needs an account, console,
          OAuth client, API enablement or .env value that only Andy can do.
          Emit an ANDY CHECKLIST with exact steps.
        CODE BUILT AND CONFIGURED → say how you verified.
      PROOF: what the user sees TODAY versus after configuration.

  6 · COMMITTED, hash noted in the mockup's .md.
      PROOF: the hash.

VERDICT AND ACTION

  ALL SIX PASS → set status:"built" in variant-lab.html. Note the commit
  in the mockup's .md if it is not already there.

  ANY FAIL, and the page currently reads "built" → ⭐ DEMOTE IT.
  Set status back to "approved", and add a one-line comment on the
  registry entry naming which condition failed and the date. A wrong
  built label is worse than an honest approved one.

  ANY FAIL, and the page is not built → leave the status alone.

  For every failing page, name the router stage it drops to, so the next
  TAB-BRIEF run picks it up:
      condition 1 fails                → E · FIDELITY
      conditions 2, 3, 4 or 5 fail     → D · BACKEND
      no decisions .md, or .md silent
        on appearance                  → B · DECISIONS
      no mockup at all                 → A · NOT DRAWN

REPORT — one row per page, and nothing summarised as "various":

| page | status before | 1 visual | 2 controls | 3 persists | 4 no mock | 5 integrations | 6 commit | verdict | status after | drops to stage |

Then, separately:
  - every ANDY CHECKLIST item, grouped, with exact steps
  - every proof you could NOT obtain, and why
  - the pages that changed status, and which direction
  - ⚠️ any page you were tempted to fix and did not

⚠️ If every page comes back built, you have not been adversarial enough.
Re-run conditions 2, 3 and 4 against the running app rather than the
source. Those three are the ones that cannot be verified by reading code.
```

---

## The order to run it in

1. **The three existing `built` pages first** — Landing · auth · merge, Class types,
   Empty states. They carry the old label under the old rule and are the most likely
   to be wrong.
2. **Overview** — one page, and the tab that is supposedly finished.
3. **Academics**, page by page. Twelve carry shipped code and read `approved` or
   `proposed`.

**Then the loop closes:** every demoted page has a named stage, so the next
`TAB-BRIEF-PROMPT` run lands on real work rather than on whatever it noticed first.
