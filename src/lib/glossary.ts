/* ============================================================
   glossary.ts — definitions for every enum, preset, and term of art,
   reachable at the point of choosing (01 §4f-i).

   Why this file exists rather than strings inline in components:
     · it can be reviewed as a whole, which is the only way the voice
       stays consistent
     · it is sweepable by the humanizer pass, which cannot reach strings
       buried across a hundred components
     · the same definition of a term appears identically everywhere it is
       offered — Volunteering's `direct service` and Profile/CV's export
       preview read the same line

   VOICE (binding, 01 §4f-i): one line, phrased as a *choosing
   instruction*, not a dictionary entry.
     ✓ "Pick this if the membership voted you in."
     ✕ "Elected: chosen by vote."

   This is app-wide from day one. Academics wrote the infrastructure;
   every other pillar adds rows rather than inventing its own mechanism.
   ============================================================ */

/** A field's own definition, plus one line per value it can take. */
export interface GlossaryEntry {
  /** Explains the field itself. Shown when no value is named. */
  field?: string
  /** Keyed by the stored value, not the display label. */
  values?: Record<string, string>
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  /* ---- Academics ------------------------------------------------ */

  'course.bcpm': {
    field: 'AMCAS sorts every course into one of two GPAs. This flag picks which one.',
    values: {
      true: 'Choose BCPM if the course is biology, chemistry, physics, or math — it counts toward your science GPA.',
      false: 'Choose AO ("all other") for everything else — English, history, psychology, and the rest.',
    },
  },

  'course.status': {
    values: {
      planned: 'Choose this for a course you intend to take but have not registered for.',
      'in-progress': 'Choose this while you are taking the course and no final grade exists yet.',
      completed: 'Choose this once a final grade is posted — it starts counting toward your GPA.',
    },
  },

  'topic.status': {
    field: 'Where this topic sits in the recall loop. It drives what the review queue serves you next.',
    values: {
      'not-started': 'Nothing recorded yet — the topic exists but you have not worked it.',
      seen: 'Covered in class, but you have not tried to recall it from memory.',
      'notes-made': 'Choose this once notes exist but you have not marked the topic for recall review.',
      reviewing: 'Choose this while the topic is in your recall rotation.',
      weak: 'Choose this when you want the topic kept visible as marked for review.',
      ready: 'Choose this when you want the topic recorded as ready for the current study plan.',
    },
  },

  'requirement.sourceType': {
    field: 'Where this requirement came from, so you know how much to trust it.',
    values: {
      official: 'Taken from the UNC catalog. Treat as fact.',
      'premed-advice': 'Community consensus among pre-meds, not a UNC rule — useful, but check it.',
      'planner-inspired': 'Inferred from a planner layout. Verify before relying on it.',
      'user-note': 'Something you or an advisor added. Premed OS has not checked it against anything.',
    },
  },

  'requirement.verificationStatus': {
    values: {
      verified: 'Checked against an official source on the date shown.',
      'needs-verification': 'Not yet confirmed. Check with the catalog or an advisor before you plan around it.',
    },
  },

  'file.owner': {
    field: 'Who produced this material. It decides where the file sits and whether recall can cite it.',
    values: {
      course: 'Handed out by the class — syllabus, slides, problem sets.',
      mine: 'Your own work. The gap report can cite these back to you.',
      generated: 'Produced by Premed OS from your material, not by you or the professor.',
    },
  },

  'assignment.type': {
    values: {
      exam: 'Choose this for anything that gets its own study plan and source-linked topic scope.',
      quiz: 'Choose this for a short in-class check — graded, but not worth a study plan.',
      homework: 'Choose this for routine graded work with a due date.',
      lab: 'Choose this for lab work with a separate write-up or deadline.',
      project: 'Choose this for multi-week work you will want to break into steps.',
      reading: 'Choose this for assigned reading you want tracked as a deadline.',
      discussion: 'Choose this for a participation post or seminar contribution.',
      other: 'Choose this when none of the rest fit — it still counts toward your grade.',
    },
  },

  'contact.role': {
    values: {
      professor: 'Teaches the course. The person a letter of recommendation would come from.',
      TA: 'Runs sections or grades. Usually the fastest answer on problem sets.',
      advisor: 'Academic or pre-health advising, not tied to this course.',
      'study-partner': 'A classmate you work with regularly.',
      tutor: 'Paid or peer tutoring for this course.',
      peer: 'A classmate you know but do not study with regularly.',
      other: 'Anyone else attached to this class.',
    },
  },
}

/** Look up a definition. `field` alone explains the field; adding `value`
 *  explains that option. Returns undefined when nothing is written yet —
 *  callers render no affordance rather than an empty one. */
export function glossary(field: string, value?: string | number | boolean): string | undefined {
  const entry = GLOSSARY[field]
  if (!entry) return undefined
  if (value === undefined) return entry.field
  return entry.values?.[String(value)] ?? entry.field
}
