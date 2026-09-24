import fs from 'node:fs'
import ts from 'typescript'
const files = ['src/pages/Research.tsx', 'src/components/research/ResearchEditors.tsx', 'src/components/common/InlineAddRow.tsx', 'src/components/common/ExpandableEntryRow.tsx', 'src/components/common/ContactCard.tsx', 'src/components/common/PersonLinkPicker.tsx']
let checked = 0
const inert = []
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source)
      if (['Button', 'button', 'DropdownMenuItem', 'ContextMenuItem'].includes(tag)) {
        checked++
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute)
        const handler = attributes.some(a => ['onClick', 'onSelect'].includes(a.name.getText(source)))
        const submit = attributes.some(a => a.name.getText(source) === 'type' && a.initializer && ts.isStringLiteral(a.initializer) && a.initializer.text === 'submit')
        let form = node.parent
        while (form && !(ts.isJsxElement(form) && ['form', 'InlineAddRow'].includes(form.openingElement.tagName.getText(source)))) form = form.parent
        const wiredForm = form && form.openingElement.attributes.properties.some(a => ts.isJsxAttribute(a) && a.name.getText(source) === 'onSubmit')
        if (!handler && !(submit && wiredForm)) inert.push(`${file}:${source.getLineAndCharacterOfPosition(node.pos).line + 1} ${tag}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
console.log(`${checked} controls inspected across ${files.length} Research and shared component files; ${inert.length} inert controls. Submit buttons require an ancestor form with onSubmit.`)
if (inert.length) { console.log(inert.join('\n')); process.exitCode = 1 }
