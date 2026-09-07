# Synthetic fixture corrections

This record tracks invented fixture defects. It is separate from actual course trial feedback, student ratings and instructional-methodology acceptance.

## 2026-09-07 — assessment format missing from requirements ledger

The coordinator's independent content audit found that the multi-lesson scope excerpt explicitly supplied “Short explanations and original applications are the stated format.” The fixture retained that format in entry.request.assessmentFormat but omitted it from the requirements ledger. Schema and cross-reference success had not detected the missing requirement.

Corrected both assessment examples to include req-format with exact supplied wording, official assessment authority, scope/excerpt evidence and links to preparation and practice sections. The multi-lesson record additionally links cross-practice. The baseline invented scope now explicitly supplies the same format so its new ledger row has actual fixture evidence; it is not inferred from the course name or from a bare request field. Its practice heading no longer calls the known format merely suggested.

Added a focused guard for these two flat, hand-authored scope passages: every supplied sentence must appear once in the ledger with authority, evidence and content links; req-format must link both explanation and practice purposes. Mutation checks remove req-format while retaining assessmentFormat and demonstrate that a schema-valid package fails this coverage guard. This guard does not claim to extract or audit arbitrary real course requirements.

All 52 checks pass after correction. The prompts, methodology, token contract and schema are unchanged. No real course trial was run and no rating was assigned. Fixture hashes are also generated in fixture-manifest.json for exact app handoff.

| Fixture | Before SHA-256 | Corrected SHA-256 |
| --- | --- | --- |
| fixture-assessment.json | `663b7b01f216d4a1be57ffb9b50964b340ff14a4596165b02137c90245e666d4` | `9fc8105480e2315b86448ba6a9e4727dad189e797f989e3c4e2fae54b0ac4f13` |
| edge-multi-lesson-assessment.json | `d8c9b525496ae61020778b0e701f70c8ad55e026521763f677ddc8f42024c4b2` | `c043264423adc5a0f032aa56aa7dcacdcf2f25320535327b2e4d24cc5ee82259` |
