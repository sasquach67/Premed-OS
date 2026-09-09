// Move only an exact standalone saved label into the card header. All other
// prompt wording stays literal; the complete original remains in the reveal.
export function practicePromptDisplay(prompt: string) {
  const match = /^(Supplied (?:lecture|outline) (?:question|application)|Generated hypothetical classification)\r?\n(?:[ \t]*\r?\n)?/.exec(prompt)
  return match && prompt.slice(match[0].length).trim()
    ? { label: match[1], body: prompt.slice(match[0].length) }
    : { label: null, body: prompt }
}

