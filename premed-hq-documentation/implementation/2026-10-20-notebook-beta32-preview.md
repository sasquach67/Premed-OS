# Notebook beta 32 preview and release hold

Authority: Oct20 notebook-format-release brief §§2,2a,7 and explanations addendum. Branch codex/study-guide-redesign; PR41. Andy must approve before merge/deploy; Claude runs seven fresh real AI outputs first.

## Completed milestones

1. Canonical prompt, shape-by-content rules, short explanations and class-folder instructions; regenerated beta32 review/assessment/assignment templates.
2. Optional additive v4 fields, old string steps and v2/v3 compatibility; schema and semantic validation.
3. Lines-first reader, explanation layer, block detail, MC feedback, lesson header/next steps, corrected mastery bullets.
4. Silent validation and amber-only import choices, signed-out notice, empty-cue flashcard eligibility, original+10 history with kept image closure.
5. Independent review fixed practice filtering, memberless map relationship loss and capped-history image restore. Each has regression coverage.

## Validation

- Production build passes (existing chunk-size advisory remains).
- Combined notebook/component/flashcard eligibility run: 57 suites,715 tests pass.
- Python prompt/schema:9 tests pass. check_package:317 checks,0 failures. Fresh generated templates byte-match all three app templates and methodology.
- Authored package using all new fields passes schema, semantic and asset preparation checks; image bytes copied unchanged from the approved exemplar. This fixture is UI evidence, not a real AI content run or live save.
- CUA DOM dimensions show no horizontal overflow at1280/375 in dark/light. Computed values captured from actual mockup and reader, then cascade differences corrected.
- Local, uncommitted evidence: output/lines-first-proof/comparison.html and reader/exemplar/practice measure JSONs. Screenshots excluded from commit per brief.

## Fidelity

| Surface | Exemplar / reader computed values | Both themes, 1280 / 375 |
| --- | --- | --- |
| Question box | 12px padding; 12px radius; primary at 10% background (same computed OKLab) | Match box recipe; reader wrapper 14/20 vs exemplar wrapper16/24, inner question14/20 |
| Map chips | 13px / 18.5714px; 1px 10px padding; card background | Match; semantic tone mixes retained |
| Causal steps | 14px / 20px; 2px 0 padding | Match after cascade fix |
| Lecture example | 12px padding/radius; OKLab(.769 .0640531 .176752 / .08), dashed45% border | Match |
| One thing | 12px padding/radius; success10% OKLab background | Match box recipe; wrapper font difference as question |
| Options right/wrong | 14px /21px; 9px12px padding; 10px radius; success12%/destructive10% on card | Exact measured font/line/padding/color/border/background/radius match |
| Feedback | 14px/21px; 10px14px padding;10px radius; muted background; success/destructive40% border | Exact measured match |
| .lf-link | 14px/20px; 1.6px 0 1.6px13.6px padding | Match; border CSS3px (zoom rounds computed pixels) |
| .lf-sw | 13px/18.85px; muted RGB168,156,140 dark / theme muted light | Match, including inner text |
| .lf-why | 14px/20px;4px 0 4px13.6px padding;primary leftborder | Match; border CSS3px (zoom rounding) |
| .lf-chain | 14px/20px;8.8px12px8.8px41.6px;padding;muted background | Match |
| .lf-cer | 14px/20px;zero rowpadding;5.5rem labelgrid | Match; stacks on375px |
| .lf-tl | 14px/20px;0 0 10.4px16px padding | Match |

No global theme/font/auth/sync/dependency changes. Flashcard instructions and builders remain unchanged; eligibility logic alone changed. No merge or deployment. Real content fidelity, no numbered parallel items in AI output, and teaching/source accuracy await Claude’s seven runs and Andy’s rating.
