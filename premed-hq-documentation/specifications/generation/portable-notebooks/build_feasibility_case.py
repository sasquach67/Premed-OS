"""Build an invented, manual staged-assessment case; never run an AI or a course trial."""
from pathlib import Path
import argparse, hashlib, json
from build_fixtures import source, block, section, req, entry, package

REQUIREMENTS={
 'req-week-1':'Explain the route ordering rules taught in Week 1.',
 'req-week-2':'Explain labels and rename effects from Week 2, including the cases in Sections 40 and 80.',
 'req-week-3':'Explain tags and display filtering from Week 3.',
 'req-week-4':'Explain the cycle rule taught in Week 4.',
 'req-week-5':'Explain the branch rule taught in Week 5.',
 'req-week-6':'Explain the route-checking method taught in Week 6.',
 'req-cross':'Compare a Week 2 rename with a Week 3 display filter.',
 'req-format':'Short explanations and original applications are the stated format.',
}
W2='A label names a stop. Renaming a stop changes its label without changing its position in the stored route.'
W3='A tag groups stops by a shared feature. A display filter hides stops that lack a selected tag without changing the stored route order. Hidden stops remain stored; filtering does not delete them.'

def build(out):
    out.mkdir(parents=True,exist_ok=True);materials=out/'materials';materials.mkdir(exist_ok=True)
    scope_text='\n'.join(REQUIREMENTS.values())
    (materials/'assessment-scope.md').write_text('# Invented Weeks 1–6 workshop assessment\n\n## Scope requirements\n\n'+scope_text+'\n')
    w2='# Invented Week 2 packet\n\nAll examples are invented teaching inputs, not collected observations.\n\n## Section 1\n\n'+W2+'\n'
    for n in range(2,81):
        w2+=f'\n## Section {n}\n\nHypothetical example {n}: the stored route is Stop-{n} then Harbor. Rename Stop-{n} to Oak-{n}, keeping its position. The resulting stored route is Oak-{n} then Harbor. The name changed; the order did not. The example illustrates the rename rule in Section 1.\n'
    (materials/'week-2-packet.md').write_text(w2)
    (materials/'week-3.md').write_text('# Invented Week 3\n\n## Week 3 teaching paragraph\n\n'+W3+'\n')
    sc=source('scope','Invented Weeks 1–6 assessment scope',scope_text,'assessment-scope');sc['excerpts'][0]['location']='Scope requirements'
    two=source('week-2','Invented Week 2 packet',W2);two['access']='partial';two['inspected']='Section 1 only; Sections 2–80 remain unprocessed.';two['limitations'].append('Sections 2–80, including required cases 40 and 80, were not inspected.');two['excerpts'][0]['location']='Section 1'
    three=source('week-3','Invented Week 3',W3);three['excerpts'][0]['location']='Week 3 teaching paragraph'
    sections=[section('prepare','Available teaching across Weeks 2 and 3','preparation',[
        block('teach-week-2',sources=('week-2',),text='Renaming changes the name of a stop while preserving its place in the stored route. The available passage does not include the required later cases.'),
        block('teach-week-3',sources=('week-3',),text='A tag groups stops by a feature. Filtering changes which tagged stops are visible while preserving the stored route. A hidden stop has not been deleted.'),
        block('teach-cross',sources=('week-2','week-3'),text='Renaming and filtering both preserve stored order, but they change different things: a rename changes a label, whereas a filter changes visibility. Predict each effect separately before combining them.')]),
        section('practice','Original cross-lesson application','practice',[block('practice-cross','practice','generated-practice',('week-2','week-3'),prompt='Hypothetical stored route: North (quiet), South (busy). Rename North to Oak without moving it, then display only quiet stops. State the visible stop, stored route and whether South was deleted.',answer='Visible: Oak. Stored route: Oak then South. South was hidden, not deleted.',rationale='The Week 2 rule changes the first label without changing position. The Week 3 rule shows only quiet stops, so Oak is visible. Filtering preserves stored stops, so South remains second.')]),
        section('missing','Missing lessons and unprocessed cases','next-steps',[block('scope-gaps','gap',sources=('scope',),text='Weeks 1, 4, 5 and 6 are required but their teaching material was not supplied. Week 2 Sections 2–80 remain unprocessed, including the two required cases. This is partial Weeks 1–6 preparation.',nextStep='Inspect Week 2 Sections 40 and 80 next, then obtain the missing lessons before claiming full preparation.')])]
    ledger=[]
    for id,text in REQUIREMENTS.items():
        if id=='req-week-2':ledger.append(req(id,text,['prepare','missing'],'partial','assessment','official',('scope','week-2'),'Scope defines the full demand. Section 1 supports labels and renaming; required cases 40 and 80 remain unprocessed.','Inspect Sections 40 and 80 and incorporate their actual details.'))
        elif id=='req-week-3':ledger.append(req(id,text,['prepare','practice'],kind='assessment',authority='official',sources=('scope','week-3'),basis='The scope sets the demand; the complete supplied Week 3 paragraph supports the teaching and application.'))
        elif id=='req-cross':ledger.append(req(id,text,['prepare','practice'],kind='assessment',authority='official',sources=('scope','week-2','week-3'),basis='The scope establishes the comparison. Week 2 Section 1 and Week 3 support the distinct effects and the solved hypothetical application.'))
        elif id=='req-format':ledger.append(req(id,text,['prepare','practice'],kind='assessment',authority='official',sources=('scope',),basis='The scope supplies the format. The available preparation contains short explanations and an original application; this does not establish full subject coverage.'))
        else:ledger.append(req(id,text,['missing'],'missing','assessment','official',('scope',),'Only the scope requirement was supplied; this lesson’s teaching evidence is missing.','Obtain the actual '+id.replace('req-','').replace('-',' ')+' material and process it.'))
    e=entry('assessment',sections,ledger);e['id']='feasibility-weeks-1-6';e['title']='Routes and filters: partial preparation';e['scope']='Original assessment scope: Weeks 1–6. Partial preparation from Week 3 and Week 2 Section 1 only; other lessons and required later cases remain unresolved.';e['request']['assessmentFormat']='Short explanations and original applications.';e['limitations'].append('A saved external checkpoint is not an app notebook import or proof of full-scope synthesis.')
    final=package(e,[sc,two,three]);(out/'expected-partial-notebook.json').write_text(json.dumps(final,indent=2)+'\n')
    for n in (1,2):
        states={id:('supported' if id=='req-week-3' else 'partial' if id=='req-cross' else 'missing') for id in REQUIREMENTS}
        states['req-format']='partial'
        if n==2:
            states={r['id']:r['status'] for r in ledger}
            states['req-format']='partial'
        rows='\n'.join('| '+id+' | '+states[id]+' | '+text+' |' for id,text in REQUIREMENTS.items())
        checkpoint=f'''# EXPECTED working checkpoint {n} — invented example, not an executed AI result

This Markdown is a working checkpoint, NOT notebook JSON to import. Example artifact only; no student trial has been run. In an actual run the AI must create the requested file or the student must save the complete text and verify it exists before calling it saved.

Course: DEMO 101 — Invented Route Workshop. Original scope: all eight requirements below for Weeks 1–6. Prompt build: notebook-instructions-beta-2. Working checkpoint number: {n}; this is not a notebook revision number.

| Requirement ID | Current status | Original requirement |
| --- | --- | --- |
{rows}

Source identities: scope = assessment-scope.md (read); week-3 = week-3.md (read); week-2 = week-2-packet.md ({'not-accessed; deliberately unprocessed' if n==1 else 'partial; Section 1 only'}). Do not invent sources for unsupplied Weeks 1, 4, 5 and 6. Excerpt ex-scope preserves all original requirement wording from the scope file. Excerpt ex-week-3 at “Week 3 teaching paragraph”: {W3}

{('No Week 2 excerpt is available; do not claim its text was inspected.' if n==1 else 'Excerpt ex-week-2 at “Section 1”: '+W2+' Sections 2–80 remain unprocessed.')}

Working explanation: tags group by feature; filtering changes visibility without deleting stored stops (ex-week-3). {('The rename side of the cross-lesson comparison is still unsupported; do not fill it from memory.' if n==1 else 'Renaming changes a label without moving a stop (ex-week-2). Both rules preserve stored order but change different properties; preserve both evidence references when integrating them.')}

Coverage basis: missing Week 1/4/5/6 requirements have scope wording only and need actual lesson evidence. {'Week 2 is unprocessed, and the cross-lesson comparison has only its filter half supported. Format is partial: a short working explanation exists, but the original application and worked answer have not yet been produced.' if n==1 else 'Week 2 is partial because required cases 40 and 80 remain unprocessed. The comparison is now supported by ex-week-2 and ex-week-3. Format is partial at this working stage: short explanations are drafted, but the original application and worked answer still need to be produced in final synthesis.'} Scope-only references never support subject answers.

Next exact action: {'inspect week-2-packet.md Section 1 and add ex-week-2 without changing source/requirement IDs' if n==1 else 'inspect Week 2 Sections 40 and 80; then obtain the missing Weeks 1, 4, 5 and 6; retain all unresolved requirements'}. No source conflict was supplied in this invented case. Do not infer that absence of a listed conflict proves every passage was reviewed.

On resumption, supply this exact latest checkpoint and needed source files. Verify scope/IDs/current access and this next action; a reopened chat or project is not guaranteed recovery. Retain cited working explanations and exact excerpts, and reopen originals where verification is needed. Do not call this a complete assessment notebook or a saved app entry.
'''
        (out/f'expected-checkpoint-{n}.md').write_text(checkpoint)
    manual='''# Manual staged-assessment feasibility case — invented material

Use the current maintained assessment prompt, not a new goal or a shorter replacement prompt. Course DEMO 101, named scope “Weeks 1–6 workshop assessment”, known format as supplied by assessment-scope.md. This is an optional synthetic feasibility test. No AI conversation or real class trial was run by the builder; expected files are author-created examples, not measured outputs or ratings.

1. Supply assessment-scope.md first. Ask the chosen AI to preserve all eight requirements, including the cross-lesson comparison and response format. Then supply week-3.md and week-2-packet.md, but deliberately direct the first evidence batch to Week 3 only. Week 2 is present but unprocessed; Weeks 1/4/5/6 are absent. The AI should not claim complete Weeks 1–6 prep.
2. Ask the same AI to create a working checkpoint after that batch. It must preserve IDs, exact scope wording, inspected/unprocessed portions, excerpts/locators, working teaching, requirement states/bases and the next action. Compare its contents with expected-checkpoint-1.md for the behaviors, not exact prose. Download/save the actual checkpoint, verify the file exists, and retain the source files. Do not import it into Premed OS.
3. Resume with that exact checkpoint and the source files. For the second batch, deliberately inspect only Week 2 Section 1. Preserve week-2 and all requirement IDs; add ex-week-2 and location Section 1. The source becomes partial, not read. Sections 2–80, specifically required cases 40/80, remain unprocessed. Compare coverage behavior with expected-checkpoint-2.md.
4. Ask for cross-lesson synthesis of what is actually supported and a complete JSON representing partial Weeks 1–6 preparation. The expected-partial-notebook.json illustrates valid final packaging: Week 2 partial, Week 3/comparison/format supported, other weeks missing, no fictitious mastery, source-closed evidence and original self-contained practice. The JSON is complete as a file while the academic coverage remains explicitly partial. Never confuse those meanings of complete.
5. Optional continuation: inspect Sections 40/80 and supply genuinely invented additional lesson evidence you author, then ask for a complete reconciled revision only if a prior notebook export is being revised. A checkpoint number is not an app revision. Do not concatenate the earlier JSON with a new batch or expect app import to synthesize them. Keep the existing four statuses; unprocessed is a basis/processing note, not a new JSON enum.

Alternative narrow-scope check: explicitly change the student request to preparation for Week 3 only. The same assessment prompt should describe that limited scope, never full Weeks 1–6 coverage. If the broader official scope remains supplied, keep it visible and attribute exclusions to the explicit student boundary rather than relabeling missing evidence on its own.

The Week 2 file has 80 short, explicitly hypothetical sections. Deliberately restricting each batch exercises the large-packet procedure even if the whole file would fit the chosen AI. This is not a provider capacity benchmark, a claim about arbitrary upload limits, or proof that a real lengthy course packet will be understood. Record actual input handling, forgotten requirements, fabricated access/quotes, checkpoint loss and whether the final comparison uses both lessons. Use the ordinary beta feedback form only for an actual manual run; leave ratings blank otherwise.

For an oversized final notebook, keep the 8 MiB raw-input ceiling and variable local-storage budget in view. Keep an external downloaded copy. Request complete smaller named entries/packages or a narrower explicit scope without silently deleting required content. The app accepts final notebook packages, not these checkpoints, and performs no semantic merge of partial imports.
'''
    (out/'README.md').write_text(manual)
    files={str(p.relative_to(out)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(out.rglob('*')) if p.is_file() and p.name!='case-manifest.json'}
    (out/'case-manifest.json').write_text(json.dumps({'purpose':'Invented manual feasibility case; no AI trial executed.','files':files},indent=2)+'\n')
    return final

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);a=parser.parse_args();build(a.output);print('Built invented staged-assessment materials, expected checkpoints and partial notebook.')
