# -*- coding: utf-8 -*-
CARDS=[]
def card(**k):
    k.setdefault('sal','load-bearing'); k.setdefault('d',2); CARDS.append(k)
CD="Campbell Biology, Concept 14.4"; CE="Campbell Biology, Concept 15.4"
PE="Pearson Mastering Biology, Lesson 2"; IH="Immunohistochemistry video, Lesson 2"

card(ct='CLOZE',cp='definition',cid='ribosome',src=CD+", p. 301",
 cz="A ribosome is {{c1::the complex of proteins and rRNAs that is the site of translation, where amino acids are linked into polypeptide chains}}.",ex="GRQ Q8.")
card(ct='COMPARISON',ax="which tRNA each of the three sites holds",cid='ape-sites',src=CD+", p. 301",d=3,
 f="What does each of the ribosome's three tRNA binding sites hold?",
 b="The A site holds the tRNA carrying the next amino acid, the P site holds the tRNA carrying the growing polypeptide, and the E site is where discharged tRNAs leave.",
 ex="The names say it: aminoacyl, peptidyl and exit. A tRNA travels A to P to E, but the sites sit E, P, A from left to right.")
card(ct='CONCEPTUAL',rel=True,cid='ribozyme',src=CD+", p. 301",d=3,
 f="Why does the chapter say a ribosome could be considered one colossal ribozyme?",
 b="Its rRNA rather than its protein forms the A and P sites and catalyzes peptide bond formation, and the proteins mostly support the rRNA's shape changes.")
card(ct='EXEMPLAR',dir='instance-to-concept',cid='antibiotics',src=CD+", p. 301",sal='attaching',
 f="Tetracycline and streptomycin inactivate bacterial ribosomes without stopping ours. What difference makes that possible?",
 b="Bacterial and eukaryotic ribosomes differ in molecular composition, so a drug can bind one and leave the other alone.")
card(ct='FREE_RECALL',cid='ribosome',n=5,src=CD+", p. 301",kind='framework',
 f="BLURT: ribosome anatomy. 5 things to hit.",
 items=["A ribosome has a large and a small subunit, each of protein plus rRNA, and they join only on an mRNA",
  "It has one binding site for the mRNA itself",
  "It has three tRNA sites: A takes the incoming aminoacyl tRNA, P holds the growing chain, and E is the exit",
  "An exit tunnel runs through the large subunit and the growing polypeptide emerges from it",
  "rRNA forms the A and P sites and catalyzes the peptide bond, so the ribosome is effectively a ribozyme"])

card(ct='BASIC_QA',cid='initiator-trna',src=CD+", p. 303",
 f="What is the initiator tRNA's anticodon, and which amino acid does it carry?",
 b="Its anticodon is 3'-UAC-5' and it carries methionine.",
 ex="Initiation brings together the mRNA, this tRNA and both ribosomal subunits. The start codon also sets the reading frame for the whole message.")
card(ct='COMPARISON',ax="how the small subunit locates the start codon",cid='initiation-bact-euk',src=CD+", p. 303",d=3,
 f="How does the small ribosomal subunit find the start codon in a bacterium, and how in a eukaryote?",
 b="In a bacterium it binds a specific mRNA sequence just upstream of the AUG, and in a eukaryote it binds the 5' cap and then scans downstream until it reaches the AUG.")
card(ct='BASIC_QA',cid='initiation-end-state',src=CD+", p. 303",sal='attaching',
 f="When initiation is complete, which ribosomal site holds the initiator tRNA and which is empty?",
 b="The initiator tRNA sits in the P site and the A site is left vacant.")
card(ct='CLOZE',cp='enumerated-list',lo=True,cid='elongation-steps',src=CD+", p. 304",
 cz="The three steps of the elongation cycle, in order, are {{c1::codon recognition}}, {{c2::peptide bond formation}} and {{c3::translocation}}.")
card(ct='BASIC_QA',cid='elongation-mech',src=CD+", pp. 303 to 304",
 f="Which elongation steps consume GTP, and what catalyzes the peptide bond?",
 b="Codon recognition and translocation consume GTP, and an rRNA of the large subunit catalyzes the bond.")
card(ct='BASIC_QA',cid='translocation-moves',src=CD+", p. 304",
 f="During translocation, where does each of the two tRNAs move?",
 b="The tRNA in the A site moves to the P site, and the tRNA in the P site moves to the E site and is released.",
 ex="The mRNA moves with them, bringing the next codon into the A site. The ribosome advances 5' to 3', one codon at a time.")
card(ct='CONCEPTUAL',rel=True,cid='polypeptide-ends',src=CD+", p. 303",
 f="At which end does a polypeptide grow, and which end was made first?",
 b="It grows at the carboxyl end, and the amino end starting with methionine was made first.")
card(ct='CONCEPTUAL',rel=True,cid='release-factor',src=CD+", p. 303",d=3,
 f="A release factor is shaped like an aminoacyl tRNA but carries no amino acid. What does it add instead?",
 b="It causes a water molecule to be added, and that hydrolyzes the bond between the polypeptide and the P-site tRNA so the chain is freed.",
 ex="It binds a stop codon in the A site, and the released chain leaves through the exit tunnel.")
card(ct='FREE_RECALL',cid='initiation',n=4,src=CD+", p. 303",kind='framework',
 f="BLURT: initiation of translation. 4 things to hit.",
 items=["A small ribosomal subunit binds the mRNA and an initiator tRNA carrying methionine, anticodon 3'-UAC-5'",
  "Bacteria bind a sequence just upstream of the AUG, while eukaryotes bind the 5' cap and scan downstream to it",
  "The large subunit joins to complete the initiation complex, with initiation factors and GTP hydrolysis supplying the energy",
  "The initiator tRNA ends up in the P site and the A site is left vacant"])
card(ct='FREE_RECALL',cid='elongation',n=3,src=CD+", p. 304",kind='framework',
 f="BLURT: the elongation cycle. 3 things to hit.",
 items=["In codon recognition the incoming anticodon pairs with the codon in the A site, and GTP hydrolysis raises accuracy",
  "In peptide bond formation an rRNA of the large subunit joins the new amino acid to the chain, moving the polypeptide onto the A-site tRNA",
  "In translocation the A-site tRNA moves to P, the P-site tRNA moves to E and is released, and the mRNA advances one codon"])
card(ct='FREE_RECALL',cid='termination',n=4,src=CD+", p. 303",kind='framework',
 f="BLURT: termination of translation. 4 things to hit.",
 items=["A stop codon, UAG, UAA or UGA, reaches the A site",
  "A release factor shaped like an aminoacyl tRNA binds that stop codon instead of a tRNA",
  "A water molecule is added, which frees the chain from the P-site tRNA and out through the exit tunnel",
  "The rest of the translation assembly comes apart, using the hydrolysis of two more GTP"])

card(ct='CONCEPTUAL',rel=True,cid='folding',src=CD+", p. 305",
 f="What determines a polypeptide's three-dimensional shape as it is being made?",
 b="Its own amino acid sequence determines the shape, because the chain coils and folds spontaneously as it is synthesized.")
card(ct='COMPARISON',ax="a chain of monomers versus a folded functional molecule",cid='poly-vs-protein',src=CD+", p. 305",
 f="What is the difference between a polypeptide and a protein?",
 b="A polypeptide is a chain of linked amino acids, while a protein is one or more polypeptides folded into a specific functional shape.",ex="GRQ Q18.")
card(ct='CLOZE',cp='definition',cid='ptm',src=CD+", p. 305",
 cz="A post-translational modification is {{c1::a change made to a polypeptide after translation, required before the protein can begin its job}}.",
 ex="GRQ Q19. Three kinds: sugars, lipids or phosphates attached to certain amino acids; amino acids removed from the amino end; and cleavage of the chain into two or more pieces.")
card(ct='COMPARISON',ax="a change within one chain versus several chains assembling",cid='ptm-vs-quaternary',src=CD+", p. 305",
 f="What does a post-translational modification change, and what does quaternary structure involve instead?",
 b="A modification alters a single polypeptide chain, while quaternary structure is two or more separately made polypeptides coming together as subunits of one protein.",
 ex="GRQ Q20 and Q21. Quaternary structure needs at least two polypeptides.")

card(ct='COMPARISON',ax="where the ribosome sits and where its product works",cid='free-vs-bound',src=CD+", p. 305",
 f="Where does a free ribosome sit versus a bound one, and what does each make?",
 b="A free ribosome floats in the cytosol and makes proteins that work there, while a bound ribosome sits on the ER and makes proteins of the endomembrane system or proteins for secretion.",
 ex="GRQ Q22 to Q24.")
card(ct='COMPARISON',ax="which ribosome population sends a protein where",cid='destinations',src=CD+", p. 305",
 f="Give two destinations for a free-ribosome protein and two for a bound-ribosome protein.",
 b="Free ribosomes send proteins to the nucleus and the mitochondrion, while bound ribosomes send them to the Golgi apparatus and the lysosome.",
 ex="GRQ Q23 and Q24, both of which you had right. Free-ribosome proteins are imported after translation finishes, the opposite timing from the ER route.")
card(ct='CONCEPTUAL',rel=True,cid='ribosomes-identical',src=CD+", p. 305",d=3,
 f="A ribosome is bound to the ER right now. What can it be the next time it is used?",
 b="It can be free, because free and bound ribosomes are identical and interchangeable, and the distinction describes where a ribosome is working rather than what kind it is.")
card(ct='CONCEPTUAL',rel=True,cid='what-cues-binding',src=CD+", p. 305",
 f="What decides whether a ribosome stays free or attaches to the ER?",
 b="The growing polypeptide decides, because a signal peptide emerging from the ribosome is what cues it to attach.",
 ex="All synthesis begins on a free ribosome in the cytosol.")
card(ct='CLOZE',cp='definition',cid='signal-peptide',src=CD+", p. 305",
 cz="A signal peptide is {{c1::a sequence of about twenty amino acids at the amino end of a polypeptide that targets it to the ER}}.",
 ex="GRQ Q26. Pearson phrased its job as assisting translocation of the polypeptide across the ER membrane.")
card(ct='CLOZE',cp='definition',cid='srp',src=CD+", p. 305",
 cz="A signal-recognition particle is {{c1::the protein-RNA complex that binds a signal peptide and escorts the ribosome to a receptor in the ER membrane}}.")
card(ct='BASIC_QA',cid='signal-cleaved',src=CD+", p. 305",
 f="What happens to the signal peptide as the chain crosses into the ER?",
 b="An enzyme in the receptor complex cleaves it off.",
 ex="Note the order. A Pearson distractor claimed it must be removed before the polypeptide can enter the ER, which is backwards.")
card(ct='COMPARISON',ax="translocation during translation versus import after it",cid='co-vs-post-translational',src=CD+", p. 306",d=3,
 f="ER-bound and mitochondrial proteins both carry signal peptides. What differs in the timing?",
 b="An ER-bound protein is translocated across the membrane while it is still being made, while a mitochondrial protein is translated to completion in the cytosol and only then imported.")
card(ct='PROCESS',cid='secretion-path',src=CD+", pp. 305 to 306",
 f="Trace the path of a protein that will be secreted from a eukaryotic cell.",
 b="It begins on a free ribosome in the cytosol, moves to the ER by its signal peptide, is released into the ER lumen, then travels by vesicle to the Golgi and on to the plasma membrane, and leaves the cell.",
 ex="GRQ Q25. Campbell's Figure 14.21 stops at the ER lumen and points to Figure 5.8 for the rest. The Golgi step is the one Pearson tested explicitly.")
card(ct='FREE_RECALL',cid='signal-mechanism',n=6,src=CD+", p. 305",kind='framework',
 f="BLURT: targeting a protein to the ER. 6 things to hit.",
 items=["Polypeptide synthesis begins on a free ribosome in the cytosol",
  "An SRP binds the signal peptide as it emerges, halting synthesis momentarily",
  "The SRP binds a receptor protein in the ER membrane, part of a complex that forms a pore",
  "The SRP leaves and synthesis resumes, with the chain translocating across the membrane as it is made",
  "An enzyme in the receptor complex cleaves the signal peptide",
  "The rest of the completed polypeptide leaves the ribosome and folds into its final conformation"])
card(ct='EXEMPLAR',dir='concept-to-instance',cid='insulin-secreted',src=CD+", p. 305",sal='attaching',
 f="Which secreted protein does the chapter name as a product of bound ribosomes?",b="Insulin.")
card(ct='CLOZE',cp='definition',cid='polyribosome',src=CD+", p. 306",sal='attaching',
 cz="A polyribosome is {{c1::a string of several ribosomes translating a single mRNA at the same time}}.",
 ex="It lets a cell make many copies of a polypeptide quickly, and polyribosomes can be free or bound.")

card(ct='CLOZE',cp='definition',cid='hybridization',src=CE+", p. 328",
 cz="Nucleic-acid hybridization is {{c1::the base pairing of one nucleic acid strand to a complementary sequence on another strand}}.",
 ex="GRQ Q27. It is the principle behind every detection method here: build the complement of what you are hunting and let base pairing find it.")
card(ct='CLOZE',cp='definition',cid='probe',src=CE+", p. 328",
 cz="A nucleic-acid probe is {{c1::a short single-stranded RNA or DNA complementary to the sequence being studied, labelled so it can be followed}}.",ex="GRQ Q28.")
card(ct='PROCESS',cid='probe-design-method',src=CE+", p. 328",d=3,
 f="You are given an mRNA sequence and asked to design a DNA probe. What are the two rules?",
 b="You complement every base using T wherever the mRNA has A, and then you flip the end labels because the probe must run antiparallel to its target.",
 ex="Two traps live in the answer choices: a probe written with U in it is RNA rather than DNA, and a probe with the same end labels as the mRNA is not antiparallel.")
card(ct='APPLICATION',cid='probe-pearson',src=PE,d=3,
 f="Write the probe that would best detect the mRNA 5'-AUGGCCGCACAG-3'.",b="3'-TACCGGCGTGTC-5'.")
card(ct='APPLICATION',cid='probe-grq29',src="BIOL 103 Guided Reading Questions, Lesson 2, Q29",d=3,
 f="A DNA probe reads 3'-TACGCCGACAAT-5'. To what mRNA sequence would it hybridize?",b="5'-AUGCGGCUGUUA-3'.",
 ex="GRQ Q29, and yours was correct.")
card(ct='CLOZE',cp='definition',cid='in-situ',src=CE+", p. 328",
 cz="In situ hybridization is {{c1::a technique that uses labelled probes to locate a specific mRNA in place, within the cells of intact tissue}}.",
 ex="In situ is Latin for in place, which is exactly what the method buys you: it answers where, not how much.")
card(ct='CONCEPTUAL',rel=True,cid='in-situ-question',src=PE,
 f="What kind of research question is in situ hybridization best suited to answer?",
 b="It tells you which cells within a tissue express a specific mRNA.",
 ex="GRQ Q30. For comparing amounts across samples you would reach for RT-PCR or RNA-seq instead.")
card(ct='COMPARISON',ax="which kind of molecule each method locates",cid='ish-vs-ihc',src=IH,d=3,
 f="In situ hybridization and immunohistochemistry both map expression in tissue. What does each one locate?",
 b="In situ hybridization locates a specific mRNA, while immunohistochemistry locates a specific protein.",
 ex="Ex (clarification): one asks whether the order was placed and the other whether the product was built. A cell can transcribe an mRNA that is never translated, so the two answers can differ.")
card(ct='CLOZE',cp='definition',cid='cdna',src=CE+", Figure 15.16",sal='attaching',
 cz="Complementary DNA is {{c1::DNA made in a test tube from an mRNA template, so it carries a gene's coding sequence but no introns}}.",
 ex="Reverse transcriptase makes the first strand, primed by a poly-dT that binds the poly-A tail. There are no introns because mature mRNA has already been spliced.")

card(ct='BASIC_QA',cid='ihc-word',src=IH,
 f="Break the word immunohistochemistry into its three parts and give the meaning of each.",
 b="Immuno means antibody and antigen based, histo means carried out on tissue, and chemistry means a detection reaction.",ex="GRQ Q32.")
card(ct='COMPARISON',ax="which molecule each antibody binds and which one carries the label",cid='ihc-antibodies',src=IH,
 f="In immunohistochemistry, what does each antibody bind, and which one carries the label?",
 b="The primary antibody binds the antigen of interest, and the secondary antibody binds the primary and carries the fluorochrome or colorimetric enzyme.",
 ex="GRQ Q34. A Pearson distractor had the secondary binding the antigen directly. Using two antibodies lets several labelled secondaries pile onto one primary, which amplifies the signal.")
card(ct='FREE_RECALL',cid='immunohistochemistry',n=4,src=IH,kind='framework',
 f="BLURT: an immunohistochemistry experiment. 4 things to hit.",
 items=["The tissue section is prepared so that antibodies can reach their targets",
  "The unlabelled primary antibody is applied, it binds the antigen of interest, and unbound antibody is washed away",
  "The labelled secondary antibody is applied, it binds the primary, and the section is washed again",
  "The label is detected by fluorescence or a colour-producing enzyme reaction, showing which cells are positive"])
