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

Deliver a real downloadable JSON named from the actual final notebook title plus .json, sanitizing only filesystem-unsafe characters. Use no provider/build/UUID suffix. A filesystem-capable authorized assistant saves the final file in my actual resolved Downloads directory, preserving any existing file with a numeric collision suffix. A hosted chat supplies an actual attachment/link and honestly leaves the destination to my browser/OS; its sandbox is not my Downloads. If file output is unavailable, return one complete JSON code block with the titled save-as filename. Supply required image files and mapping in a similarly titled coherent ZIP/bundle. Check actual support, schema, references and prepared-content/baseline parity before delivery. State only important changes, limits and unexecuted checks briefly; do not claim app import success or mastery.
