import type { jsPDF as JsPdf } from 'jspdf'
import type { GeneratedQuestionStimulus, GeneratedUnitQuestion, GeneratedUnitQuestionBank } from '@/lib/types'

const PAGE_WIDTH = 215.9
const PAGE_HEIGHT = 279.4
const LEFT = 17
const RIGHT = 17
const TOP = 20
const BOTTOM = 16
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT
const INK: [number, number, number] = [23, 43, 58]
const TEAL: [number, number, number] = [14, 118, 110]
const PALE: [number, number, number] = [232, 244, 242]
const LINE: [number, number, number] = [215, 224, 226]
const MUTED: [number, number, number] = [94, 106, 114]

export function questionBankPdfFilename(bank: Pick<GeneratedUnitQuestionBank, 'title'>) {
  const slug = bank.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'question-bank'}.pdf`
}

function clean(value: string) {
  return value
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2192/g, '->')
    .replace(/\u00a0/g, ' ')
}

function ensureSpace(doc: JsPdf, y: number, needed: number) {
  if (y + needed <= PAGE_HEIGHT - BOTTOM) return y
  doc.addPage()
  return TOP
}

function wrapped(doc: JsPdf, text: string, width = CONTENT_WIDTH) {
  return doc.splitTextToSize(clean(text), width) as string[]
}

function writeText(doc: JsPdf, text: string, y: number, options: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; width?: number; leading?: number } = {}) {
  const size = options.size ?? 9.5
  const indent = options.indent ?? 0
  const leading = options.leading ?? size * 0.45
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...(options.color ?? INK))
  const lines = wrapped(doc, text, options.width ?? CONTENT_WIDTH - indent)
  doc.text(lines, LEFT + indent, y)
  return y + lines.length * leading + 2
}

function writeKicker(doc: JsPdf, text: string, y: number) {
  return writeText(doc, clean(text).toUpperCase(), y, { size: 7.5, bold: true, color: TEAL, leading: 3.8 })
}

function drawTable(doc: JsPdf, stimulus: GeneratedQuestionStimulus, y: number) {
  if (!stimulus.table) return y
  const columns = stimulus.table.columns
  const rows = stimulus.table.rows
  const columnWidth = CONTENT_WIDTH / columns.length
  const drawRow = (cells: string[], top: number, header: boolean) => {
    doc.setFont('helvetica', header ? 'bold' : 'normal')
    doc.setFontSize(7.4)
    const lineSets = cells.map((cell) => wrapped(doc, cell, columnWidth - 5))
    const rowHeight = Math.max(9, ...lineSets.map((lines) => lines.length * 3.4 + 4))
    doc.setFillColor(...(header ? TEAL : PALE))
    doc.setDrawColor(...LINE)
    lineSets.forEach((lines, index) => {
      const x = LEFT + index * columnWidth
      doc.rect(x, top, columnWidth, rowHeight, 'FD')
      doc.setTextColor(...(header ? [255, 255, 255] as [number, number, number] : INK))
      doc.text(lines, x + 2.5, top + 4.2)
    })
    return top + rowHeight
  }
  y = ensureSpace(doc, y, 24)
  y = drawRow(columns, y, true)
  rows.forEach((row) => {
    const estimated = Math.max(9, ...row.map((cell) => wrapped(doc, cell, columnWidth - 5).length * 3.4 + 4))
    if (y + estimated > PAGE_HEIGHT - BOTTOM) {
      doc.addPage()
      y = drawRow(columns, TOP, true)
    }
    y = drawRow(row, y, false)
  })
  return y + 3
}

function shortLabel(value?: string) {
  const label = clean(value ?? '')
  const aliases: Record<string, string> = {
    transcription: 'transcribe', 'introns looped': 'introns', splicing: 'splice',
    'folding/modification': 'mature', translation: 'translate', 'to cytosol': 'export',
    'N-term signal': 'signal', translocation: 'enter ER',
  }
  return aliases[label] ?? label
}

function drawDiagram(doc: JsPdf, stimulus: GeneratedQuestionStimulus, y: number) {
  if (!stimulus.diagram) return y
  const height = 72
  y = ensureSpace(doc, y, height + 4)
  doc.setFillColor(...PALE)
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, height, 3, 3, 'F')
  const xFor = (x: number) => LEFT + 8 + (x / 100) * (CONTENT_WIDTH - 16)
  const yFor = (nodeY: number) => y + height - 8 - (nodeY / 100) * (height - 16)
  const nodes = new Map(stimulus.diagram.nodes.map((node) => [node.id, node]))
  if (stimulus.id.includes('expression')) {
    doc.setDrawColor(123, 168, 164)
    doc.setLineDashPattern([2, 1.5], 0)
    doc.roundedRect(LEFT + 5, y + 6, CONTENT_WIDTH - 10, 27, 2, 2, 'S')
    doc.setLineDashPattern([], 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...TEAL)
    doc.text('NUCLEUS', LEFT + 8, y + 10)
  }
  doc.setDrawColor(...TEAL)
  stimulus.diagram.edges.forEach((edge) => {
    const from = nodes.get(edge.from)
    const to = nodes.get(edge.to)
    if (!from || !to) return
    const x1 = xFor(from.x); const y1 = yFor(from.y)
    const x2 = xFor(to.x); const y2 = yFor(to.y)
    doc.line(x1, y1, x2, y2)
    const angle = Math.atan2(y2 - y1, x2 - x1)
    doc.line(x2, y2, x2 - 2.5 * Math.cos(angle - 0.45), y2 - 2.5 * Math.sin(angle - 0.45))
    doc.line(x2, y2, x2 - 2.5 * Math.cos(angle + 0.45), y2 - 2.5 * Math.sin(angle + 0.45))
  })
  stimulus.diagram.nodes.forEach((node) => {
    const x = xFor(node.x); const nodeY = yFor(node.y)
    doc.setFillColor(252, 253, 251)
    doc.setDrawColor(...TEAL)
    if (node.shape === 'circle') doc.circle(x, nodeY, 7.5, 'FD')
    else doc.roundedRect(x - 13, nodeY - 5, 26, 10, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.4)
    doc.setTextColor(...INK)
    const lines = wrapped(doc, node.label, node.shape === 'circle' ? 13 : 23)
    doc.text(lines.slice(0, 3), x, nodeY - (lines.length - 1) * 1.2, { align: 'center' })
  })
  stimulus.diagram.edges.forEach((edge) => {
    const from = nodes.get(edge.from); const to = nodes.get(edge.to)
    const label = shortLabel(edge.label)
    if (!from || !to || !label) return
    const x = (xFor(from.x) + xFor(to.x)) / 2
    const labelY = (yFor(from.y) + yFor(to.y)) / 2 - 1.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.2)
    doc.setTextColor(...TEAL)
    doc.setFillColor(...PALE)
    const width = doc.getTextWidth(label) + 2
    doc.rect(x - width / 2, labelY - 2.5, width, 3.4, 'F')
    doc.text(label, x, labelY, { align: 'center' })
  })
  return y + height + 4
}

function drawGraph(doc: JsPdf, stimulus: GeneratedQuestionStimulus, y: number) {
  if (!stimulus.graph) return y
  const height = 76
  y = ensureSpace(doc, y, height + 4)
  const graph = stimulus.graph
  const left = LEFT + 18; const right = LEFT + CONTENT_WIDTH - 6
  const top = y + 10; const bottom = y + height - 14
  const values = graph.series.flatMap((series) => series.points.map((point) => point.y))
  const max = Math.max(...values, 1)
  doc.setDrawColor(...LINE)
  for (let tick = 0; tick <= 4; tick += 1) {
    const lineY = bottom - ((bottom - top) * tick / 4)
    doc.line(left, lineY, right, lineY)
    doc.setFontSize(5.5); doc.setTextColor(...MUTED)
    doc.text(String(Math.round(max * tick / 4)), left - 3, lineY + 1, { align: 'right' })
  }
  const labels = graph.series[0]?.points.map((point) => point.x) ?? []
  const groupWidth = (right - left) / Math.max(labels.length, 1)
  const palette: Array<[number, number, number]> = [TEAL, [201, 128, 43], [124, 58, 237]]
  if (stimulus.kind === 'line-graph') {
    graph.series.forEach((series, seriesIndex) => {
      const color = palette[seriesIndex % palette.length]
      doc.setDrawColor(...color)
      doc.setFillColor(...color)
      doc.setLineWidth(0.7)
      series.points.forEach((point, pointIndex) => {
        const pointX = left + groupWidth * (pointIndex + 0.5)
        const pointY = bottom - (bottom - top) * point.y / max
        if (pointIndex > 0) {
          const previous = series.points[pointIndex - 1]
          const previousX = left + groupWidth * (pointIndex - 0.5)
          const previousY = bottom - (bottom - top) * previous.y / max
          doc.line(previousX, previousY, pointX, pointY)
        }
        doc.circle(pointX, pointY, 1.25, 'F')
      })
    })
  }
  labels.forEach((label, labelIndex) => {
    const center = left + groupWidth * (labelIndex + 0.5)
    if (stimulus.kind === 'bar-graph') {
      graph.series.forEach((series, seriesIndex) => {
        const point = series.points[labelIndex]
        if (!point) return
        const barWidth = groupWidth / (graph.series.length + 1)
        const barHeight = (bottom - top) * point.y / max
        doc.setFillColor(...palette[seriesIndex % palette.length])
        doc.rect(center + (seriesIndex - (graph.series.length - 1) / 2) * barWidth - barWidth * 0.36, bottom - barHeight, barWidth * 0.72, barHeight, 'F')
      })
    }
    doc.setFontSize(6); doc.setTextColor(...INK)
    doc.text(clean(label), center, bottom + 4, { align: 'center' })
  })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.2); doc.setTextColor(...INK)
  doc.text(clean(graph.xLabel), (left + right) / 2, y + height - 3, { align: 'center' })
  graph.series.forEach((series, index) => {
    const x = left + index * 52
    doc.setFillColor(...palette[index % palette.length]); doc.rect(x, y + 2, 3, 3, 'F')
    doc.setFontSize(5.8); doc.text(clean(series.label), x + 5, y + 4.3)
  })
  return y + height + 4
}

function writeStimulus(doc: JsPdf, stimulus: GeneratedQuestionStimulus, index: number, y: number) {
  y = ensureSpace(doc, y, 32)
  y = writeKicker(doc, `Stimulus set ${index} / ${stimulus.kind.replace('-', ' ')}`, y)
  y = writeText(doc, stimulus.title, y, { size: 15, bold: true, leading: 7 })
  y = writeText(doc, stimulus.context, y, { size: 9, leading: 4.2 })
  if (stimulus.kind === 'data-table') y = drawTable(doc, stimulus, y)
  else if (stimulus.kind === 'diagram') y = drawDiagram(doc, stimulus, y)
  else if (stimulus.kind === 'bar-graph' || stimulus.kind === 'line-graph') y = drawGraph(doc, stimulus, y)
  return writeText(doc, stimulus.caption, y, { size: 7.2, color: MUTED, leading: 3.2 })
}

function writeQuestion(doc: JsPdf, question: GeneratedUnitQuestion, number: number, y: number, withAnswer: boolean) {
  y = ensureSpace(doc, y, withAnswer ? 54 : 40)
  y = writeText(doc, `${number}. ${question.prompt}`, y, { size: 9.4, bold: true, leading: 4.3 })
  question.options?.forEach((option, index) => {
    y = writeText(doc, `${String.fromCharCode(65 + index)}. ${option}`, y, { size: 8.8, indent: 4, width: CONTENT_WIDTH - 4, leading: 4 })
  })
  y = writeText(doc, `${question.difficulty} | ${question.move.replace('-', ' ')}`, y, { size: 7.1, color: MUTED, leading: 3.2 })
  if (withAnswer) {
    const answerIndex = question.options?.findIndex((option) => option.trim().toLowerCase() === question.answer.trim().toLowerCase()) ?? -1
    const prefix = answerIndex >= 0 ? `${String.fromCharCode(65 + answerIndex)}. ` : ''
    y = writeText(doc, `Answer: ${prefix}${question.answer}`, y, { size: 8.7, bold: true, color: TEAL, leading: 4 })
    y = writeText(doc, question.rationale, y, { size: 8.3, leading: 3.8 })
  }
  return y + 3
}

function addHeaders(doc: JsPdf) {
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...LINE)
    doc.line(LEFT, 12, PAGE_WIDTH - RIGHT, 12)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...TEAL)
    doc.text('PREMED OS / QUESTION BANK', LEFT, 9)
    doc.setTextColor(...MUTED)
    doc.text(String(page), PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 8, { align: 'right' })
  }
}

export async function buildQuestionBankPdf(bank: GeneratedUnitQuestionBank) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' })
  doc.setProperties({ title: clean(bank.title), author: 'Premed OS', subject: 'Original application-first practice question bank' })
  let y = TOP + 8
  y = writeKicker(doc, `${bank.generationProvider === 'anthropic' ? 'Claude-authored' : 'Generated'} practice / ${bank.unit}`, y)
  y = writeText(doc, bank.title, y, { size: 23, bold: true, leading: 10 })
  y = writeText(doc, `${bank.questions.length} application-first questions / ${bank.stimuli?.length ?? 0} linked stimulus sets / ${bank.currentUnitPercent}% current scope / ${bank.integrationPercent}% prior integration`, y, { size: 10, color: MUTED, leading: 4.5 })
  y += 4
  doc.setFillColor(...PALE)
  const instructions = 'Original practice only. Read each shared stimulus before answering. Any data labeled simulated or hypothetical were invented for practice. The answer key begins after the question section.'
  const instructionLines = wrapped(doc, instructions, CONTENT_WIDTH - 10)
  const boxHeight = instructionLines.length * 4.2 + 8
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, boxHeight, 2, 2, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK)
  doc.text(instructionLines, LEFT + 5, y + 6)
  y += boxHeight + 8

  const stimuli = bank.stimuli ?? []
  const questionsByStimulus = new Map<string, Array<{ question: GeneratedUnitQuestion; number: number }>>()
  bank.questions.forEach((question, index) => {
    const primaryStimulusId = question.stimulusIds[0]
    if (!primaryStimulusId) return
    questionsByStimulus.set(primaryStimulusId, [...(questionsByStimulus.get(primaryStimulusId) ?? []), { question, number: index + 1 }])
  })
  stimuli.forEach((stimulus, index) => {
    if (index > 0 || y > TOP + 20) { doc.addPage(); y = TOP }
    y = writeStimulus(doc, stimulus, index + 1, y)
    for (const item of questionsByStimulus.get(stimulus.id) ?? []) y = writeQuestion(doc, item.question, item.number, y, false)
  })
  const unlinked = bank.questions.map((question, index) => ({ question, number: index + 1 })).filter(({ question }) => !stimuli.some((stimulus) => stimulus.id === question.stimulusIds[0]))
  if (unlinked.length) {
    doc.addPage(); y = TOP
    y = writeKicker(doc, 'Questions', y)
    for (const item of unlinked) y = writeQuestion(doc, item.question, item.number, y, false)
  }

  doc.addPage(); y = TOP
  y = writeKicker(doc, 'Answer key / explanations', y)
  y = writeText(doc, 'Check the reasoning, not just the letter', y, { size: 18, bold: true, leading: 8 })
  y = writeText(doc, 'Each rationale identifies the evidence that makes one option correct and the misconception behind the strongest distractor.', y, { size: 9, color: MUTED, leading: 4.2 })
  for (let index = 0; index < bank.questions.length; index += 1) y = writeQuestion(doc, bank.questions[index], index + 1, y, true)
  addHeaders(doc)
  return doc
}

export async function downloadQuestionBankPdf(bank: GeneratedUnitQuestionBank) {
  const doc = await buildQuestionBankPdf(bank)
  doc.save(questionBankPdfFilename(bank))
}
