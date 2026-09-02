import { describe, expect, it, vi } from 'vitest'

const ocrMocks = vi.hoisted(() => ({
  createLocalOcrSession: vi.fn(async () => ({
    recognizeImage: vi.fn(async () => 'Recovered screenshot text on this device.'),
    recognizePdfPage: vi.fn(async () => 'Recovered scanned page.'),
    terminate: vi.fn(async () => {}),
  })),
}))

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(async () => ({ value: 'PSYC 101 — Introduction to Psychology' })),
}))

vi.mock('./documentOcr', () => ocrMocks)

import { extractDocumentText, MAX_DOCUMENT_BYTES, MAX_PDF_PAGES, sniffDocumentKind, validateDocumentBounds } from './documentText'

describe('document type sniffing', () => {
  it('reads Word OOXML bytes even when a download is mislabeled .pdf', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0])
    const file = new File([bytes], 'Syllabus.pdf', { type: 'application/pdf' })

    expect(await sniffDocumentKind(file)).toBe('docx')
    await expect(extractDocumentText(file)).resolves.toMatchObject({
      sourceKind: 'docx',
      text: 'PSYC 101 — Introduction to Psychology',
      scanDetected: false,
    })
  })

  it('trusts a real PDF signature over an empty MIME type', async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'download', { type: '' })
    expect(await sniffDocumentKind(file)).toBe('pdf')
  })

  it('recovers uploaded screenshots with on-device OCR and reports exact coverage', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'lecture-note.png', { type: 'image/png' })
    await expect(extractDocumentText(file, { recoverScannedPdfPages: true })).resolves.toMatchObject({
      sourceKind: 'image', text: 'Recovered screenshot text on this device.', scanDetected: true,
      pageCount: 1, unreadablePageCount: 0, imageOnlyPageCount: 1, ocrPageCount: 1,
      pages: [{ pageNumber: 1, readable: true, ocrRecovered: true }],
    })
  })

  it('keeps an unreadable image in the batch when local OCR cannot start', async () => {
    ocrMocks.createLocalOcrSession.mockRejectedValueOnce(new Error('OCR worker did not start'))
    const file = new File([new Uint8Array([1, 2, 3])], 'lecture-note.png', { type: 'image/png' })

    await expect(extractDocumentText(file, { recoverScannedPdfPages: true })).resolves.toMatchObject({
      sourceKind: 'image', text: '', scanDetected: true,
      pageCount: 1, unreadablePageCount: 1, imageOnlyPageCount: 1, ocrPageCount: 0,
      pages: [{ pageNumber: 1, readable: false, ocrRecovered: false }],
    })
  })
})

describe('document resource bounds', () => {
  it('accepts ordinary syllabus-sized files and page counts', () => {
    expect(() => validateDocumentBounds(4 * 1024 * 1024, 38)).not.toThrow()
  })

  it('rejects oversized files before allocating their contents', () => {
    expect(() => validateDocumentBounds(MAX_DOCUMENT_BYTES + 1)).toThrow(/larger than 50 MB/i)
  })

  it('rejects implausibly long PDFs before page extraction or OCR', () => {
    expect(() => validateDocumentBounds(1024, MAX_PDF_PAGES + 1)).toThrow(/more than 250 pages/i)
  })
})
