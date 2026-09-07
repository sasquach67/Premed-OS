# Create a Premed OS study package

Read my supplied course materials and produce one downloadable JSON file, using the companion example's structure. Use format "premed-os-study-package" and version 1. Replace all example content; preserve instructor terminology, caveats, and distinctions. Do not use an API tool just to create this file.

- title: the guide title.
- sources: optional list of {id, title, location, text}. Include actual excerpts from the supplied materials, with accurate locations. Do not fabricate excerpts, locations, instructor emphasis, or evidence. Source IDs must be unique.
- sections: an ordered list of {title, blocks}. Every section needs at least one block.
- blocks: {type, text?, items?, sourceId?}. Supported types: prose, bullets, numbered, table, callout, gap, contradiction, must_memorize, must_understand, recall. Use text for paragraphs, items for lists, and a Markdown pipe table in text for a comparison table. Use plain text inside paragraphs and list items; no HTML or Markdown headings. Put headings in section titles. Each block needs text or items. sourceId, when present, must refer to a source in this package. Split blocks if they depend on distinct source excerpts.
- objectives: optional list of {title, freeRecallCues, understand, beAbleToDo, watchFor, sourceIds}. The four middle fields are lists of text. Every objective needs at least one understand point. sourceIds must refer to included sources. Keep objectives specific to the supplied material.

Missing source support should be disclosed in gap blocks, not invented. Never claim Premed OS validation, independent review, instructor approval, or a completed audit. Imports are labeled externally created and unreviewed. No course IDs, database IDs, API keys, or personal account tokens belong in the file.

Keep the file below 8 MB. Maximum 100 sections, 200 blocks per section, 500 source excerpts, and 200 objectives. You can omit sources and objectives, but unsourced content will be visibly described as lacking linked excerpts.

Import in Premed OS: open the desired class notebook, choose Import a guide, select the JSON file, review the preview, and save. Import does not regenerate the guide or call an AI provider.
