# Study-guide detail R1: reader-first rollout

R1 supports optional `more: string | null` on v4 paragraph and bullets blocks. Existing packages without it remain valid. One guide-wide Condensed / Full detail preference defaults to Full and is stored locally per account, guest or demo. Paragraphs and bullets have no individual disclosure; illustrations retain their existing disclosure in Condensed. Answer and worked-solution reveals are independent.

The saved reader validates the current package and selected-entry projection before mounting editing controls. Unsupported fields or invalid required content produce an actionable error and an untouched JSON-record recovery download. This is strict rejection, not removal or normalization of unknown data. The recovery download excludes binary image bytes.

Existing notebooks can look different after R1: illustration explanations open by default, and the guide-wide Reading detail switch appears whenever illustration detail is present. Condensed hides explanations from ordinary page display and browser find; use Full detail to read/search all explanations.

## Contract and sequencing

- Package remains v4; store remains 52; cloud remains 2. No migration or cloud guard change.
- R1 contains schema, reader, error handling and tests only. Notebook instruction changes are a separate R2 release.
- Pre-R1 readers reject the new fields during saved-reader mounting. Pure workspace roundtrips preserve them, but that does not make the old reader compatible. R1 cannot change JavaScript already loaded in another tab/device.
- T4-b's reserved store 53/cloud 3 are unchanged. Its eventual release must incorporate R1's reader before deployment; do not deploy its older standalone reader after R1.

## Release and content gates

1. Complete tests, lint, build, dependency audit, fictional mobile visual checks and Claude review.
2. Obtain a new release-specific security-header decision before deployment. Earlier waivers do not apply.
3. Verify the exact deployed R1 commit and live bundle hashes.
4. Obtain explicit confirmation that every app tab and device has reloaded before any live import or edit that introduces paragraph/bullet detail. A deployment or source search alone does not establish that old clients reloaded.
5. Restoration is separate content work: review the first two old-to-restored passage ledgers and word counts before any live import. Preserve notes/progress, restore relevant teaching only, and trim narration from both layers. Each `more` is capped at 1200 characters; split longer restored teaching across the blocks it belongs to and revalidate. Never silently truncate substantive material.
6. R2 prompt changes require a separate review and release decision.

**Rollback floor:** after detail has been imported, never roll back below R1. Use a compatible reader or fix forward; never strip detail, rewrite raw copies or relabel data to force an old reader to open it.

## Evidence boundaries

Automated roundtrip checks use actual serializers, import/edit/restore coordinators, fake IndexedDB and a real PNG fixture. Cloud transport is simulated; they do not establish a live server roundtrip. Headless Chrome checks use the actual reader with fictional content in an isolated browser profile. No real notebook is imported during R1 validation.

Runtime/config searches found no service worker registration, automatic release polling or bundle replacement mechanism. The deployment workflow retains recent hashed assets for already-open tabs; this does not replace their loaded JavaScript. Existing visibility handlers refresh dates/materials, and explicit reloads occur in demo/error flows. This is source evidence only; the mandatory user reload confirmation is the operational protection for cached tabs.
