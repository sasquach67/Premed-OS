# Create my Premed OS notebook: {{GOAL_LABEL}}

Prompt build: {{PROMPT_BUILD}}. Transport instructionsVersion: notebook-workflows-draft-4. This is a draft instruction workflow awaiting manual provider/context and class trials. The complete prompt ends with: END NOTEBOOK INSTRUCTIONS — {{PROMPT_BUILD}} — {{GOAL_LABEL}}. An absent ending or obvious cutoff needs the complete copy; this check cannot reveal every unseen omission.

Prepare actual, readable learning content for my verified course, target and scope using supplied evidence and known needs/preferences. Check the content and deliver the complete final notebook JSON directly, without requiring a readable draft first, a scripted conversation or a Create the JSON confirmation. If I explicitly ask for a draft, discussion or pause, respect that stage. If I announce more upload batches, wait until I finish or narrow collection before final delivery; otherwise continue with available material and honest gaps. Ask only for genuinely essential missing context. Preserve source integrity, explanations, practice, visuals and saved baseline edits. A normal chat with accessible uploads or pasted material is sufficient; folders and projects are optional. The requested output is the actual notebook, not a plan for later generation.


## Request context

The app fills the request context below when known. In a generic copy, unset values are null; I can simply supply materials and describe what I want reviewed without editing this JSON. Use my explicit request and selected app class context first. Identify the lesson/topic and scope from the actually accessible materials, then briefly state the identified class and lesson so I can correct them. Filenames are clues, not proof of contents. Never inherit a course, lesson number or topic from a prior test, example or unrelated notebook. Do not replace known app/student class context with a guess from a file; if the intended course or scope is missing, spans competing lessons or conflicts with the inspected materials, ask one consequential clarification before drafting. Leave optional metadata unknown when unnecessary.

Supply the actual files or pasted material in this chat; naming a folder does not supply it. Use my stated depth preference. Review defaults to clear, source-supported teaching that explains the ideas and reasoning in enough depth to understand and use them. Remove repetition while keeping the steps, contrasts and examples needed for each objective; Assessment and Assignment retain their scope/stage requirements. Class preferences remain "" if none. Revision input identifies the exact attached latest saved current-content export and target entry, or contains that package as a string; null means a new entry. A new lesson test does not rename or overwrite an earlier notebook. For an update, supply the baseline plus new materials and follow the explicit update rules. Preserve unchanged content and saved student edits, integrate only affected teaching and dependencies, and deliver the checked revised file with a concise actual change record. Independent notes, responses and progress are not in current-content JSON.

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

Deliver one real downloadable ZIP named from the actual final notebook title plus .zip. Include the complete titled notebook JSON and every actual referenced PNG/JPEG image, including required originals and derivatives; preserve safe relative paths and exact filenames. A text-only notebook still uses a ZIP with its JSON. An ordinary AI-created ZIP needs no app-owned bindings.json. If ZIP creation is unavailable, deliver a real complete folder when supported; otherwise give the full downloadable file set together and say which packaging capability is unavailable. Never claim a ZIP/folder exists without creating it. If no file output is available, provide the complete JSON code block and honestly identify missing image files; a visual package without its required bytes is incomplete. A local authorized assistant resolves my actual Downloads directory and preserves existing files; hosted chat links leave the destination to my browser/OS. I can extract the ZIP and choose the resulting notebook folder in Premed OS, or import the ZIP under Other import options. Raw lecture materials alone are not an importable notebook. Check schema, references, actual asset closure and prepared-content/baseline parity before delivery. Briefly state important changes, gaps and unexecuted checks; no default draft-approval exchange or claim of app import success or mastery.
