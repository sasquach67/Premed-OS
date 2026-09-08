# Create my Premed OS notebook: {{GOAL_LABEL}}

Prompt build: {{PROMPT_BUILD}}. Transport instructionsVersion: notebook-workflows-draft-2. This is a draft instruction workflow awaiting manual class trials.

Prepare actual, readable learning content for my request using the supplied material and known course, needs and preferences. Continue supported work without routine approval after each step. Before producing final importable notebook JSON, show me the actual prepared draft with a concise review of its scope, sections, depth/help stage, inspected material and gaps. Ask whether I want changes or want that reviewed content turned into JSON, then wait for my explicit confirmation. Pasting this prompt or uploading materials is not that confirmation. After substantive changes, show the updated draft and ask again. The content is the notebook, not a plan for a later generator. Follow the complete shared conversation, teaching and format rules below. A normal AI chat with accessible uploads or pasted material is sufficient; folders and saved projects are optional.

## Editable request

Replace the uppercase placeholder slots below with JSON strings in double quotes, or null for unknown optional values. The app fills these slots automatically. Supply the actual files or pasted material in this chat; naming a folder does not supply it. Course code, course title, and named scope identify the intended notebook. Leave class preferences as "" if none. Depth defaults to thorough source-supported explanation. Revision input may identify an attached prior package, or contain its JSON as a string; null means a new entry.

```json
{
  "courseCode": {{COURSE_CODE}},
  "courseTitle": {{COURSE_TITLE}},
  "term": {{TERM}},
  "scope": {{SCOPE}},
  "materials": {{MATERIALS}},
  "depth": {{DEPTH}},
  "classPreferences": {{CLASS_PREFERENCES}},
  "helpStage": {{HELP_STAGE}},
  "assessmentFormat": {{ASSESSMENT_FORMAT}},
  "userRequest": {{USER_REQUEST}},
  "revisionInput": {{REVISION_INPUT}}
}
```

For class preferences, I can specify instructor terminology, prose/sequence/comparison preferences, examples, citation locators, accessibility needs and explanation depth. These are student preferences unless I supply evidence of instructor requirements. Unknown course facts stay unknown. Assessment format may state the known format and the evidence for it; otherwise leave it null. Help stage describes the requested assignment support, such as one hint, planning or revision, and is normally null for review.

Only after I explicitly confirm the current readable draft, serialize its approved content into a complete downloadable notebook .json file when possible. If this chat cannot create downloads, return one complete JSON code block that I can paste into Premed OS or save as a UTF-8 .json file. Check the actual source support, schema and cross-references. Preserve the reviewed content during serialization; disclose necessary corrections, and return to readable review and confirmation if any substantive content, scope or evidence must change. Disclose unexecuted checks and unresolved evidence limits outside the JSON. Do not claim import success, academic correctness from JSON validity, or student mastery.
