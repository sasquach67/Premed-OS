# premedOS card generator — the runnable half of `flashcards-v1`

## Why your cards keep coming out wrong

`specifications/generation/04-flashcards-v1.md` is the **authoring standard**. It governs what a card
says. It says nothing about note types, field order, CSS, tag scheme, deck tree, or how an `.apkg`
gets written, because those are implementation, not pedagogy.

So an agent handed only the spec reproduces the *rules* and invents its own *format*. That is the
mismatch you keep hitting. This folder is the missing half. Point the agent here as well as at the
spec, and the output matches the PSYC101 Chapter 0 deck exactly.

## Files

| File | What it is |
|---|---|
| `deck_cards.py` | The PSYC101 Chapter 0 deck. **This is the reference implementation.** Every rule in the spec has a worked example in here. An agent writing a new deck copies this file's structure and replaces the content |
| `quality_gate.py` | Every deterministic check from `04` §12.1 and §8.1.1, plus `08` §2.1. Run it before building. Exit code 1 means blocking findings |
| `build_apkg.py` | Hand-rolled `.apkg` writer (`04` §14.4, no Anki dependency). Owns the note types, the field order, the tag scheme, and the deck tree |
| `card-styles.css` | **All visual design.** `build_apkg.py` reads this file and writes it into both note types. Edit here to change how every card in every deck looks |
| `design/style-explorer.html` | Open in a browser. Three style directions (Ledger, Console, Chapter), three color modes, light and dark, rendered inside a mock Anki window. This is where the current design was chosen |
| `design/rendered-sample.html` | Real cards from the built deck, styled by the real `card-styles.css`. Open it after editing the CSS to check your change |
| `verify.py` | Imports the built package with the real Anki engine and asserts it renders. Requires `pip install anki` |

## To generate a new deck

```
1. Read specifications/generation/04-flashcards-v1.md in full.       # the rules
2. Read generator/deck_cards.py.                                      # the shape
3. Write a new deck_cards.py from the student's source material.
4. python3 quality_gate.py     # must print "blocking: 0"
5. Edit build_apkg.py:  DECK_SUB, COURSE_ID, TOPIC_ID, OUT
6. python3 build_apkg.py
7. python3 verify.py           # must print "ALL CHECKS PASSED"
```

**Do not skip step 4.** The gate catches the failures that make a deck unusable, and every one of its
checks exists because a real generated deck failed it.

## Design

Everything visual is in **`card-styles.css`**. Nothing else in the pipeline makes a visual decision.

Three rules there are load-bearing rather than taste:

1. **No `background` on `.card`.** Anki supplies the background, so night mode and any custom theme
   pass through. Adding one breaks dark mode for every deck.
2. **System fonts only.** Charter, Iowan Old Style, Palatino, and Georgia are the serif fallback
   chain; system mono for labels; system sans for Extra. Nothing is bundled into the media folder,
   so cards render the same on AnkiMobile and AnkiDroid.
3. **One `--ac` variable per mindset band.** Never hard-code a color below the band definitions.

To change the look: edit `card-styles.css`, run `build_apkg.py`, open `design/rendered-sample.html`.
To reconsider the look from scratch: open `design/style-explorer.html`, which holds the three
directions that were on the table and the three color modes, in light and dark.

## The format contract

These are fixed. Changing any of them breaks compatibility with decks already in Anki.

**Note types** — `premedOS Basic` and `premedOS Cloze`.

```
premedOS Basic                 premedOS Cloze
Front                          Text
Back                           Extra
Extra                          Type              <- rendered label, e.g. "blurt it / free recall"
Type                           Mindset           <- CSS class: m-say | m-explain | m-connect
Mindset                        premedos_concept_id
premedos_concept_id            premedos_source
premedos_source                premedos_spec
premedos_spec
```

The three `premedos_*` fields appear in no template, so they travel with the note and never render
during review (`FC-15`). They carry provenance only; premedOS never reads a package back (`FC-EXP-2`).

**Mindset bands** — the colored verb on every card. Five, no more.

| Class | Label | Card types | Light | Dark |
|---|---|---|---|---|
| `m-say` | say it | `BASIC_QA`, definition and fill-in cloze | `#2563b0` | `#6aa9ff` |
| `m-explain` | explain it | `CONCEPTUAL` | `#157a6e` | `#3fc1ae` |
| `m-connect` | connect it | `COMPARISON`, `EXEMPLAR` | `#7952b3` | `#b79df5` |
| `m-use` | use it | `APPLICATION` | `#3e7d4f` | `#6fbf85` |
| `m-blurt` | blurt it | `FREE_RECALL` | `#b3641f` | `#e8a15c` |

**Typography** — Charter / Iowan Old Style / Palatino / Georgia serif for card text, system mono for
the mindset label and blurt numerals, system sans for Extra. All system fonts, nothing bundled, so it
renders identically on AnkiMobile and AnkiDroid.

**Background** — the CSS sets none. Anki supplies it, so night mode and custom themes pass through.
Never add a `background` declaration to `.card`.

**Deck tree** — `UNC::<Term>::<COURSE>::<Topic>`, e.g. `UNC::Fall 2026::PSYC101::Chapter 0`. Every
parent deck must exist in the `decks` JSON or Anki will not nest them.

**Tags** — `premedos::type::*`, `premedos::mechanism::*`, `premedos::mindset::*`,
`premedos::salience::*`, `premedos::difficulty::*`, `premedos::preset::*`, `premedos::mode::*`,
plus a per-concept tag. Hierarchical, so Anki's sidebar filters them.

## Card record fields

```python
card(ct='EXEMPLAR',                  # retrieval objective (04 §4)
     dir='instance-to-concept',      # EXEMPLAR only (FC-20)
     cp='definition',                # cloze mechanism (04 §4.2c) or omit
     lo=False,                       # enumerated-list only (FC-L3/L4)
     ax='the axis of contrast',      # COMPARISON only (FC-19c)
     items=[...], n=6,               # FREE_RECALL only (FC-FR-1/2/7)
     tj='why a term-deletion cloze', # required if cp is single/independent (FC-D4)
     cid='concept label',            # -> conceptId, stable across regenerations
     kind='framework',               # marks a concept that owes a blurt card (FC-FR-5)
     sal='load-bearing',             # load-bearing | attaching (§2.5). Never 'incidental'
     rel=True,                       # CONCEPTUAL naming two concepts counts as relational
     d=3,                            # difficulty of the KNOWLEDGE, 1-5 (§7)
     f='front', b='back', cz='cloze text', ex='extra',
     src='real file and section, never fabricated (FC-EXP-3)')
```

## The four failures this pipeline exists to prevent

1. **A pile of facts.** Ordinal firsts and institution names are `incidental`; they ride in Extra or
   on one assembled blurt card, never as their own trivia cards (§2.5).
2. **Disconnected definitions.** Every school or framework gets at least one card placing it against
   a neighbour on a named axis (§2.6, `FC-19`).
3. **Cards you cannot answer without the lecture.** A prompt must name its own answer space with the
   source stripped away (§2.7, `FC-22`).
4. **Glossary phrasing you cannot say back.** Every answer and blurt item is a complete sentence with
   a subject and a finite verb, stating the claim rather than the topic (§8.1, `FC-27`–`FC-31`).
