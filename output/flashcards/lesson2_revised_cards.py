"""Lecture-first BIOL 103 Lesson 2 deck built from the class outline and Panopto slides."""

CARDS = []
def card(**kwargs): CARDS.append(kwargs)

O = 'Lesson 2 Class Outline, BIOL103 FA26'
P = 'Panopto, BIOL 103 Lesson 2 Central Dogma'

# ── LO1: gene expression and protein maturation ───────────────────────────
card(ct='FREE_RECALL', cid='eukaryotic gene expression', kind='framework', sal='load-bearing', d=3, n=5,
     f='BLURT: eukaryotic gene expression from DNA to mature protein. 5 things to hit.',
     items=['DNA stores the gene in the nucleus.', 'Transcription uses the DNA template to make RNA in the nucleus.', 'Splicing removes introns to produce mature mRNA in the nucleus.', 'Translation uses mRNA at a ribosome in the cytoplasm to make a polypeptide.', 'A polypeptide folds and may be modified or joined to become a mature protein.'],
     src=f'{O} pp.1-3 | {P} 20:55-31:40')
card(ct='CLOZE', cp='definition', cid='transcription', sal='load-bearing', d=2,
     cz='Transcription is {{c1::the synthesis of RNA from a DNA template}}.',
     ex='It occurs in the nucleus and uses RNA polymerase.', src=f'{O} p.2 | {P} 21:48-21:51')
card(ct='CLOZE', cp='definition', cid='splicing', sal='load-bearing', d=2,
     cz='RNA splicing is {{c1::the removal of introns from mRNA}}.',
     ex='Splicing occurs in the nucleus and leaves exons in mature mRNA.', src=f'{O} pp.2-3 | {P} 22:42-23:21')
card(ct='COMPARISON', ax='whether the sequence stays in mature mRNA', cid='introns vs exons', sal='load-bearing', d=3,
     f='After RNA splicing, which sequences are removed and which sequences remain in mature mRNA?',
     b='Introns are removed, while exons remain in the mature mRNA.', ex='The outline colors introns purple and exons blue.', src=f'{O} pp.2-3')
card(ct='CLOZE', cp='definition', cid='translation', sal='load-bearing', d=2,
     cz='Translation is {{c1::the production of a polypeptide from mRNA at a ribosome}}.',
     ex='Translation occurs at ribosomes in the cytoplasm.', src=f'{O} p.3 | {P} 24:18-24:24')
card(ct='BASIC_QA', cid='codon anticodon pairing', sal='load-bearing', d=3,
     f='During translation, what pairs with an mRNA codon?', b='A tRNA anticodon pairs with the mRNA codon.',
     ex='The outline identifies codons in blue and anticodons in green.', src=f'{O} p.3')
card(ct='CLOZE', cp='definition', cid='polypeptide', sal='load-bearing', d=2,
     cz='A polypeptide is {{c1::a string of amino acids whose order is dictated by DNA and mRNA nucleotide sequences}}.',
     ex='A polypeptide is not necessarily a mature protein yet.', src=f'{P} 25:11-26:37')
card(ct='FREE_RECALL', cid='protein maturation', kind='framework', sal='load-bearing', d=3, n=4,
     f='BLURT: what can make a polypeptide into a mature protein? 4 things to hit.',
     items=['The polypeptide folds into the proper shape through interactions among amino acids and the environment.', 'Some amino acids may be added or removed.', 'Sugars or other chemical groups may be added.', 'Multiple polypeptides may be joined together.'],
     src=f'{P} 26:42-31:40')
card(ct='CONCEPTUAL', cid='hydrophobic amino acids and folding', sal='load-bearing', d=3,
     f='In an aqueous environment, where do amino acids with hydrophobic R groups tend to end up in a folded soluble protein?',
     b='They tend to be buried away from water in the protein interior.', ex='The outline’s black amino acids have hydrophobic R groups.', src=f'{O} p.4')
card(ct='EXEMPLAR', dir='instance-to-concept', cid='protein regions', sal='attaching', d=3,
     f='A deletion prevents a receptor from binding the ligand that starts a signal. Which region was deleted?',
     b='The ligand-binding region was deleted.', ex='The class outline describes this as deleting the top portion of the protein.', src=f'{O} p.4 | {P} 33:11-36:21')
card(ct='EXEMPLAR', dir='instance-to-concept', cid='protein regions', sal='attaching', d=3,
     f='A deletion keeps a receptor from reaching the plasma membrane. Which region was deleted?',
     b='The membrane-anchoring region was deleted.', ex='The outline describes this as deleting the middle portion of the protein.', src=f'{O} p.4 | {P} 33:20-36:32')
card(ct='EXEMPLAR', dir='instance-to-concept', cid='protein regions', sal='attaching', d=3,
     f='A deletion allows ligand binding but prevents the intracellular signal from continuing. Which region was deleted?',
     b='The region that binds an intracellular signal protein was deleted.', ex='The outline describes this as deleting the bottom portion of the protein.', src=f'{O} p.4 | {P} 33:26-36:44')
card(ct='APPLICATION', cid='reading mRNA', sal='attaching', d=2,
     f='What amino-acid sequence does 5′ AUG GGG UAU UAA 3′ encode?', b='It encodes Met-Gly-Tyr, followed by a stop codon.',
     ex='The class slide labels the chain from N terminus to C terminus.', src=f'{O} p.5 | {P} 41:20-42:28')

# ── LO2: protein targeting ────────────────────────────────────────────────
card(ct='FREE_RECALL', cid='free vs bound ribosomes', kind='framework', sal='load-bearing', d=3, n=4,
     f='BLURT: how does a ribosome’s location relate to protein destination? 4 things to hit.',
     items=['Free ribosomes make proteins in the cytosol.', 'A protein made by a free ribosome may remain in the cytosol or move to locations such as the nucleus.', 'Proteins made by bound ribosomes are inserted into the rough endoplasmic reticulum.', 'Proteins that enter the rough endoplasmic reticulum can move through the Golgi and onward in transport vesicles.'],
     src=f'{O} p.5 | {P} 43:26-48:14')
card(ct='COMPARISON', ax='first destination after translation', cid='free vs bound ribosomes', sal='load-bearing', d=3,
     f='How do free and rough-ER-bound ribosomes differ in the first destination of the protein they make?',
     b='Proteins from free ribosomes are released into the cytosol, while proteins from bound ribosomes are inserted into the rough endoplasmic reticulum.',
     ex='Ribosomes are not permanently different kinds. The destination signal determines where translation proceeds.', src=f'{O} p.5 | {P} 45:03-49:39')
card(ct='PROCESS', cid='endomembrane pathway', sal='load-bearing', d=3,
     f='What route can a protein take after it enters the rough endoplasmic reticulum?',
     b='It can move from the rough ER to the Golgi apparatus, into a transport vesicle, and then to the plasma membrane or outside the cell.',
     ex='The lecture frames this as part of the endomembrane system.', src=f'{O} p.5 | {P} 47:34-48:14')
card(ct='CLOZE', cp='definition', cid='signal sequence', sal='load-bearing', d=3,
     cz='A signal sequence is {{c1::an amino-acid sequence that directs a newly made protein toward its cellular destination}}.',
     ex='For this class, the lecture focuses on targeting to the endomembrane system.', src=f'{P} 49:02-49:39')
card(ct='COMPARISON', ax='cellular destination specified by the sequence', cid='targeting sequences', sal='attaching', d=3,
     f='What destinations do a nuclear localization sequence and a mitochondrial localization sequence specify?',
     b='A nuclear localization sequence is for targeting a protein to the nucleus, while a mitochondrial localization sequence is for targeting it to mitochondria.',
     ex='The lecture names both as examples but focuses on the endomembrane system.', src=f'{P} 49:21')

# ── LO3: mRNA and protein detection in tissue ─────────────────────────────
card(ct='FREE_RECALL', cid='detecting ebolavirus in tissue', kind='framework', sal='load-bearing', d=4, n=5,
     f='BLURT: how to investigate Ebolavirus expression in tissue. 5 things to hit.',
     items=['In situ hybridization is a method that detects and locates a specific mRNA in tissue.', 'An in situ hybridization probe is designed from the mRNA sequence and is complementary to that mRNA.', 'A positive in situ hybridization control uses tissue known to contain the mRNA of interest.', 'Immunohistochemistry or immunofluorescence is a method that detects and locates a specific protein in tissue.', 'A positive protein-detection control uses tissue known to contain the protein of interest.'],
     src=f'{O} pp.6-8 | {P} 1:06:02-1:07:56')
card(ct='CONCEPTUAL', cid='mRNA and protein evidence', sal='load-bearing', d=4,
     f='Why is evidence for an Ebolavirus-specific protein useful in addition to evidence for Ebolavirus mRNA?',
     b='Protein evidence shows that the viral mRNA was translated into protein and identifies where that protein is present in the tissue.',
     ex='The class moves from RNA detection to protein detection for this reason.', src=f'{O} p.8 | {P} 1:03:39-1:07:56')
card(ct='CLOZE', cp='definition', cid='in situ hybridization', sal='load-bearing', d=3,
     cz='In situ hybridization is used to {{c1::detect a specific mRNA and show where it is located within tissue}}.',
     ex='It is an RNA-detection method, not a protein-detection method.', src=f'{O} p.7 | {P} 1:06:02-1:06:07')
card(ct='PROCESS', cid='in situ hybridization probe', sal='load-bearing', d=4,
     f='How is a fluorescent in situ hybridization probe designed to detect an Ebolavirus mRNA?',
     b='The probe is designed with a sequence complementary to the Ebolavirus mRNA and is labeled so its binding can be detected.',
     ex='You must know the target mRNA sequence before designing the probe.', src=f'{O} p.7 | {P} 1:06:07')
card(ct='APPLICATION', cid='in situ hybridization', sal='load-bearing', d=3,
     f='You need to determine the presence and location of Ebolavirus mRNA in a mouse spleen. Which technique should you use?',
     b='You should use in situ hybridization.', ex='The technique detects RNA and preserves location within tissue.', src=f'{P} 1:06:02-1:06:07')
card(ct='COMPARISON', ax='what a positive control proves', cid='in situ hybridization controls', sal='load-bearing', d=4,
     f='For in situ hybridization, what should a positive control and a negative control each contain?',
     b='The positive control should contain tissue known to have the target mRNA, while the negative control should lack the target mRNA or use a probe for an mRNA not expected in the tissue.',
     ex='A probe for jellyfish GFP mRNA is one negative-control example from the lecture.', src=f'{O} p.7 | {P} 1:06:39-1:06:44')
card(ct='CONCEPTUAL', cid='ebolavirus mRNA results', sal='load-bearing', d=4,
     f='In the class mRNA experiment, several animal species fluoresced but showed no symptoms. What does that result support?',
     b='It supports that Ebolavirus mRNA was detected in those species, even though they did not show symptoms during the experiment.',
     ex='Fluorescence was present for the snake, both bat species, and laboratory mouse in the outline table.', src=f'{O} p.7')
card(ct='CLOZE', cp='definition', cid='immunohistochemistry', sal='load-bearing', d=3,
     cz='Immunohistochemistry or immunofluorescence is used to {{c1::detect a specific protein and show where it is located within tissue}}.',
     ex='These methods use antibodies rather than a nucleic-acid probe.', src=f'{O} p.8 | {P} 1:06:59-1:07:26')
card(ct='PROCESS', cid='antibody detection', sal='load-bearing', d=4,
     f='How can immunofluorescence reveal the location of a viral protein in tissue?',
     b='The primary antibody is the antibody that binds the viral protein, and the labeled secondary antibody detects the bound primary antibody.',
     ex='The secondary antibody supplies the fluorescent signal in the class example.', src=f'{O} p.8 | {P} 1:06:59-1:07:26')
card(ct='COMPARISON', ax='which antibody is omitted or which tissue lacks the target', cid='protein detection controls', sal='load-bearing', d=4,
     f='What are two valid negative controls for immunohistochemistry or immunofluorescence?',
     b='You can use secondary antibody only without a primary antibody, or tissue confirmed to lack the protein of interest.',
     ex='The positive control is tissue confirmed to have the protein of interest.', src=f'{P} 1:07:26')
card(ct='APPLICATION', cid='protein detection', sal='load-bearing', d=3,
     f='You need to determine the presence and location of Ebolavirus-specific protein in tissue. Which method should you use?',
     b='You should use immunohistochemistry or immunofluorescence.', ex='These methods test protein, whereas in situ hybridization tests mRNA.', src=f'{O} p.8 | {P} 1:06:59')
card(ct='COMPARISON', ax='molecule detected', cid='in situ hybridization vs immunohistochemistry', sal='load-bearing', d=4,
     f='How do in situ hybridization and immunohistochemistry differ in what they detect?',
     b='In situ hybridization is the method that detects a specific mRNA with a complementary probe, while immunohistochemistry is the method that detects a specific protein with antibodies.',
     ex='Both methods can preserve location within tissue.', src=f'{O} pp.7-8 | {P} 1:06:02-1:07:26')
card(ct='CONCEPTUAL', cid='ebolavirus protein results', sal='load-bearing', d=3,
     f='In the class protein experiment, only the bat tissue fluoresced. What conclusion does that result support?',
     b='It supports that the bat tissue contained detectable Ebolavirus-specific protein and that the bat is a likely infected species.',
     ex='The field-mouse and snake samples did not fluoresce, while the controls behaved as expected.', src=f'{O} p.8')
