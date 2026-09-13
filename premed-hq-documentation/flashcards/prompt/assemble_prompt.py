"""Generate one self-contained runtime prompt and a provenance manifest."""
from pathlib import Path
import hashlib,json
BASE=Path(__file__).resolve().parent
FILES=[('cards.schema.json','json'),('card-styles.css','css'),('requirements.txt','text'),('build_deck.py','python'),('verify_deck.py','python')]
parts=[(BASE/'authoring.md').read_text()]
manifest={}
for name,language in FILES:
    content=(BASE/name).read_text()
    if '```' in content:raise ValueError('Embedded fence in '+name)
    parts.append('\n### File: '+name+'\n\n```'+language+'\n'+content.rstrip('\n')+'\n```\n')
    manifest[name]=hashlib.sha256(content.encode()).hexdigest()
text=''.join(parts)
OUTPUT=BASE.parents[2]/'src/lib/academics/flashcards/instructions.md'
OUTPUT.write_text(text)
manifest['authoring.md']=hashlib.sha256((BASE/'authoring.md').read_bytes()).hexdigest()
manifest['instructions.md']=hashlib.sha256(text.encode()).hexdigest()
(BASE/'prompt-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Complete prompt:',len(text.encode()),'bytes;',len(text.splitlines()),'lines')
