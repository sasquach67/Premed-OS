import { describe, expect, it } from 'vitest'
import { extractSyllabusFile, pdfTextToLines, weightGap } from '@/lib/academics/syllabusParser'

/**
 * A genuine two-page PDF — real xref table, real text streams — inlined as
 * base64 so the regression is self-contained.
 *
 * WHY THIS EXISTS: PDF extraction was silently useless. It "worked" — text came
 * out, nothing threw, documentKind said syllabus. But every page arrived as ONE
 * line, and parseSyllabusText is line-based, so this syllabus (six dates, five
 * weight rows, four units) yielded TWO items and a single date. A test that
 * only asserted "text was extracted" would have passed the whole time.
 */
const SYLLABUS_PDF_BASE64 = 'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5'
  + 'cGUgL1BhZ2VzIC9LaWRzIFszIDAgUiA1IDAgUl0gL0NvdW50IDIgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2Ug'
  + 'L1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA3IDAgUiA+'
  + 'PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NjMgPj4Kc3RyZWFtCkJUIC9GMSAx'
  + 'MSBUZiA2MCA3NDAgVGQgMTUgVEwKKENIRU0gMjYyIE9yZ2FuaWMgQ2hlbWlzdHJ5IElJIC0gRmFsbCAyMDI2KSBUaiBUKgoo'
  + 'SW5zdHJ1Y3RvcjogRHIuIE5hZGlhIEVsYW1pbiAgIE9mZmljZSBob3VyczogTW9uZGF5IDEtMyBQTSwgS2VuYW4gQzIxMCkg'
  + 'VGogVCoKKCkgVGogVCoKKEdSQURJTkcpIFRqIFQqCihQcm9ibGVtIHNldHMgICAgICAgICAgIDE1JSkgVGogVCoKKE1pZHRl'
  + 'cm0gRXhhbSAxICAgICAgICAgMjAlKSBUaiBUKgooTWlkdGVybSBFeGFtIDIgICAgICAgICAyMCUpIFRqIFQqCihMYWJvcmF0'
  + 'b3J5ICAgICAgICAgICAgIDE1JSkgVGogVCoKKEZpbmFsIEV4YW0gICAgICAgICAgICAgMzAlKSBUaiBUKgooKSBUaiBUKgoo'
  + 'Q09VUlNFIFNDSEVEVUxFKSBUaiBUKgooVW5pdCAxOiBTdHJ1Y3R1cmUgYW5kIEJvbmRpbmcpIFRqIFQqCihVbml0IDI6IEFj'
  + 'aWRzIGFuZCBCYXNlcykgVGogVCoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQg'
  + 'MiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNyAwIFIgPj4gPj4gL0Nv'
  + 'bnRlbnRzIDYgMCBSID4+CmVuZG9iago2IDAgb2JqCjw8IC9MZW5ndGggNDAzID4+CnN0cmVhbQpCVCAvRjEgMTEgVGYgNjAg'
  + 'NzQwIFRkIDE1IFRMCihJTVBPUlRBTlQgREFURVMpIFRqIFQqCihQcm9ibGVtIFNldCAxIGR1ZSBTZXB0ZW1iZXIgOCwgMjAy'
  + 'NikgVGogVCoKKFByb2JsZW0gU2V0IDIgZHVlIFNlcHRlbWJlciAyMiwgMjAyNikgVGogVCoKKE1pZHRlcm0gRXhhbSAxIG9u'
  + 'IE9jdG9iZXIgNiwgMjAyNikgVGogVCoKKFByb2JsZW0gU2V0IDMgZHVlIE9jdG9iZXIgMjAsIDIwMjYpIFRqIFQqCihNaWR0'
  + 'ZXJtIEV4YW0gMiBvbiBOb3ZlbWJlciAxMCwgMjAyNikgVGogVCoKKEZpbmFsIEV4YW0gb24gRGVjZW1iZXIgMTIsIDIwMjYp'
  + 'IFRqIFQqCigpIFRqIFQqCihVbml0IDM6IFN1YnN0aXR1dGlvbiBhbmQgRWxpbWluYXRpb24pIFRqIFQqCihVbml0IDQ6IEFs'
  + 'a2VuZXMgYW5kIEFsa3luZXMpIFRqIFQqCkVUCmVuZHN0cmVhbQplbmRvYmoKNyAwIG9iago8PCAvVHlwZSAvRm9udCAvU3Vi'
  + 'dHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAK'
  + 'MDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDI0NyAw'
  + 'MDAwMCBuIAowMDAwMDAwNzYxIDAwMDAwIG4gCjAwMDAwMDA4ODcgMDAwMDAgbiAKMDAwMDAwMTM0MSAwMDAwMCBuIAp0cmFp'
  + 'bGVyCjw8IC9TaXplIDggL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjE0MTEKJSVFT0YK'

function syllabusFile(): File {
  const binary = atob(SYLLABUS_PDF_BASE64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], 'chem262-syllabus.pdf', { type: 'application/pdf' })
}

describe('pdfTextToLines', () => {
  it('groups items sharing a baseline into one line, and splits on a new one', () => {
    const lines = pdfTextToLines([
      { str: 'Problem Set 1 due', transform: [1, 0, 0, 1, 60, 700] },
      { str: 'September 8, 2026', transform: [1, 0, 0, 1, 200, 700] },
      { str: 'Midterm Exam 1 on', transform: [1, 0, 0, 1, 60, 685] },
      { str: 'October 6, 2026', transform: [1, 0, 0, 1, 200, 685] },
    ])
    expect(lines.split('\n')).toEqual([
      'Problem Set 1 due September 8, 2026',
      'Midterm Exam 1 on October 6, 2026',
    ])
  })

  it('honours hasEOL where the build provides it', () => {
    const lines = pdfTextToLines([
      { str: 'Final Exam', hasEOL: true },
      { str: 'December 12, 2026' },
    ])
    expect(lines.split('\n')).toEqual(['Final Exam', 'December 12, 2026'])
  })

  it('tolerates a small baseline drift within one line', () => {
    const lines = pdfTextToLines([
      { str: 'Problem', transform: [1, 0, 0, 1, 60, 700] },
      { str: 'sets 15%', transform: [1, 0, 0, 1, 140, 701] },
    ])
    expect(lines).toBe('Problem sets 15%')
  })
})

describe('a real two-page syllabus PDF', () => {
  it('extracts structured items rather than one blob per page', async () => {
    const proposal = await extractSyllabusFile(syllabusFile())
    expect(proposal.sourceKind).toBe('pdf')
    expect(proposal.scanDetected).toBe(false)
    expect(proposal.items.length).toBeGreaterThan(10)
  }, 30000)

  it('finds all three exam dates', async () => {
    const proposal = await extractSyllabusFile(syllabusFile())
    const exams = proposal.items.filter((item) => item.kind === 'exams').map((item) => item.value)
    expect(exams).toEqual(['October 6, 2026', 'November 10, 2026', 'December 12, 2026'])
  }, 30000)

  it('finds all three assignment deadlines', async () => {
    const proposal = await extractSyllabusFile(syllabusFile())
    const due = proposal.items.filter((item) => item.kind === 'deadlines').map((item) => item.value)
    expect(due).toEqual(['September 8, 2026', 'September 22, 2026', 'October 20, 2026'])
  }, 30000)

  it('finds every grade weight, and they sum to 100%', async () => {
    const proposal = await extractSyllabusFile(syllabusFile())
    const weights = proposal.items.filter((item) => item.kind === 'weights')
    expect(weights.map((item) => item.value)).toEqual(['15%', '20%', '20%', '15%', '30%'])
    expect(weightGap(proposal.items)).toBe(0)
  }, 30000)

  it('finds every unit', async () => {
    const proposal = await extractSyllabusFile(syllabusFile())
    const units = proposal.items.filter((item) => item.kind === 'units')
    expect(units).toHaveLength(4)
    expect(units[0].label).toContain('Unit 1')
  }, 30000)
})
