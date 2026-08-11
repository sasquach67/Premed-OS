import { describe, expect, it } from 'vitest'
import { isTypingTarget } from '@/lib/keyboard'

describe('isTypingTarget', () => {
  it.each(['input', 'textarea', 'select'])('recognises %s controls', (tag) => {
    expect(isTypingTarget(document.createElement(tag))).toBe(true)
  })

  it('recognises descendants of editable and textbox surfaces', () => {
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const child = editable.appendChild(document.createElement('span'))
    document.body.appendChild(editable)
    expect(isTypingTarget(child)).toBe(true)

    const textbox = document.createElement('div')
    textbox.setAttribute('role', 'textbox')
    expect(isTypingTarget(textbox)).toBe(true)
  })

  it('does not classify ordinary controls as typing targets', () => {
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
