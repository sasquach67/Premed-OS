#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const ROOT = 'https://catalog.unc.edu'
const INDEX_URL = `${ROOT}/courses/`
const OUTPUT = new URL('../../src/data/uncCourseCatalog.generated.json', import.meta.url)
const EXPECTED_CATALOG_YEAR = '2026-2027'
const RETRIEVED_AT = process.env.UNC_CATALOG_RETRIEVED_AT || new Date().toISOString().slice(0, 10)

function compact(value = '') {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function text(block, selector) {
  return compact(block.querySelector(selector)?.textContent || '')
}

function stripLabel(value) {
  return compact(value.replace(/^[^:]+:\s*/, ''))
}

function creditRange(value) {
  const values = [...value.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
  if (!values.length) return {}
  return { minCredits: Math.min(...values), maxCredits: Math.max(...values) }
}

function courseLevel(number) {
  const numeric = Number.parseInt(number, 10)
  if (!Number.isFinite(numeric)) return 'other'
  if (numeric < 500) return 'undergraduate'
  if (numeric < 700) return 'advanced-undergraduate-graduate'
  return 'graduate'
}

function parseSubjectLabel(label) {
  const match = /^(.*?)\s*\(([A-Z0-9]+)\)$/.exec(compact(label))
  return match ? { subjectName: match[1], subjectCode: match[2] } : undefined
}

async function fetchHtml(url) {
  let failure
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'Premed-OS-catalog-ingest/1.0' } })
      if (!response.ok) throw new Error(`${response.status} while reading ${url}`)
      return await response.text()
    } catch (error) {
      failure = error
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 350))
    }
  }
  throw failure
}

function parseCourse(block, subject, sourceUrl) {
  const rawCode = text(block, '.detail-code').replace(/\.$/, '')
  const codeMatch = /^([A-Z0-9]+)\s+(.+)$/.exec(rawCode)
  if (!codeMatch) return undefined
  const title = text(block, '.detail-title').replace(/\.$/, '')
  const creditText = text(block, '.detail-hours').replace(/\.$/, '')
  const description = text(block, '.courseblockextra')
  const requisites = stripLabel(text(block, '.detail-requisites'))
  const repeatRules = stripLabel(text(block, '.detail-repeat_rules'))
  const gradingStatus = stripLabel(text(block, '.detail-grading_status'))
  const ideasText = stripLabel(text(block, '.detail-idea_action'))
  const attributes = ideasText
    ? ideasText.split(',').map(compact).map((value) => value.replace(/\.$/, '')).filter(Boolean)
    : []
  const { minCredits, maxCredits } = creditRange(creditText)
  const number = codeMatch[2]
  return {
    code: `${codeMatch[1]} ${number}`,
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    number,
    title,
    description,
    creditText,
    ...(minCredits == null ? {} : { minCredits }),
    ...(maxCredits == null ? {} : { maxCredits }),
    variableCredits: minCredits != null && maxCredits != null && minCredits !== maxCredits,
    level: courseLevel(number),
    attributes,
    ...(requisites ? { requisites } : {}),
    ...(repeatRules ? { repeatRules } : {}),
    ...(gradingStatus ? { gradingStatus } : {}),
    sourceUrl,
  }
}

async function mapConcurrent(items, limit, fn) {
  const output = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      output[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return output
}

const indexHtml = await fetchHtml(INDEX_URL)
const indexDocument = new JSDOM(indexHtml).window.document
const catalogLabel = compact(indexDocument.body.textContent).match(/(20\d{2}-20\d{2}) Academic Catalog/)?.[1]
if (catalogLabel !== EXPECTED_CATALOG_YEAR) {
  throw new Error(`Expected ${EXPECTED_CATALOG_YEAR} catalog, found ${catalogLabel || 'no catalog year'}`)
}

const subjectsByPath = new Map()
for (const anchor of indexDocument.querySelectorAll('a[href^="/courses/"]')) {
  const path = anchor.getAttribute('href')
  const subject = parseSubjectLabel(anchor.textContent)
  if (!subject || !/^\/courses\/[a-z0-9-]+\/$/.test(path)) continue
  subjectsByPath.set(path, { ...subject, path })
}
const subjects = [...subjectsByPath.values()].sort((a, b) => a.subjectCode.localeCompare(b.subjectCode))
if (subjects.length < 100) throw new Error(`Implausibly small subject index: ${subjects.length}`)

const batches = await mapConcurrent(subjects, 4, async (subject) => {
  const sourceUrl = new URL(subject.path, ROOT).href
  const html = await fetchHtml(sourceUrl)
  const document = new JSDOM(html).window.document
  const courses = [...document.querySelectorAll('.courseblock')]
    .map((block) => parseCourse(block, subject, sourceUrl))
    .filter(Boolean)
  return { subject, courses }
})

const courses = batches.flatMap((batch) => batch.courses).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
const duplicates = courses.filter((course, index) => course.code === courses[index - 1]?.code).map((course) => course.code)
if (duplicates.length) throw new Error(`Duplicate course codes: ${[...new Set(duplicates)].slice(0, 20).join(', ')}`)
if (courses.length < 3000) throw new Error(`Implausibly small catalog: ${courses.length} courses`)

const payload = {
  meta: {
    institution: 'University of North Carolina at Chapel Hill',
    catalogYear: EXPECTED_CATALOG_YEAR,
    retrievedAt: RETRIEVED_AT,
    sourceUrl: INDEX_URL,
    subjectCount: subjects.length,
    courseCount: courses.length,
    boundary: 'Published catalog facts only. Current sections, instructors, meeting times, restrictions at a specific offering, seats, waitlists, holds, and enrollment remain outside this snapshot.',
  },
  subjects: subjects.map(({ subjectCode, subjectName, path }) => ({ subjectCode, subjectName, sourceUrl: new URL(path, ROOT).href })),
  courses,
}

await writeFile(OUTPUT, `${JSON.stringify(payload)}\n`)
console.log(`Wrote ${payload.meta.courseCount} courses across ${payload.meta.subjectCount} subjects to ${OUTPUT.pathname}`)
