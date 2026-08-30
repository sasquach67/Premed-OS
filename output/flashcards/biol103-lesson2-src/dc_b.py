# -*- coding: utf-8 -*-
CARDS=[]
def card(**k):
    k.setdefault('sal','load-bearing'); k.setdefault('d',2); CARDS.append(k)
CB="Campbell Biology, Concept 14.1"; CD="Campbell Biology, Concept 14.4"
PE="Pearson Mastering Biology, Lesson 2"; GR="BIOL 103 Guided Reading Questions, Lesson 2"

card(ct='PROCESS',cid='seq-method',src=CB+", p. 292",d=3,
 f="You are given a polypeptide and asked for a DNA template strand. What are the three steps?",
 b="First you write an mRNA codon for each amino acid running 5' to 3', then you complement every base using T for U, and then you label the result 3' to 5' because the template runs antiparallel.",
 ex="The third step is where most wrong answers come from. If your answer reads as a straight complement labelled 5' to 3', the ends are backwards.")
card(ct='APPLICATION',cid='seq-template-to-codon',src=PE,d=3,
 f="A triplet in the DNA template strand is 5'-AGT-3'. What is the mRNA codon, with ends labelled?",b="3'-UCA-5'.",
 ex="Complement A, G, T to U, C, A and then flip the labels, because the transcript is antiparallel. Written conventionally 5' to 3', the same codon is ACU.")
card(ct='APPLICATION',cid='seq-aa-to-template',src=PE,d=4,
 f="Give a DNA template strand that could code for Phe-Leu-Ile-Val, with ends labelled.",b="3'-AAA-GAA-TAA-CAA-5'.",
 ex="The mRNA is 5'-UUU-CUU-AUU-GUU-3'. Because the code is redundant, other template sequences also work, so this is one valid answer rather than the only one.")
card(ct='APPLICATION',cid='seq-mrna-to-poly',src=PE,d=3,
 f="Translate 5'-AUG-UCU-UCG-UUA-UCC-UUG-3'.",b="Met-Ser-Ser-Leu-Ser-Leu.")
card(ct='APPLICATION',cid='seq-grq16-dna',src=GR+", Q16",d=3,
 f="An mRNA reads 5'-AUGCGGUUGAUCUCA-3'. Give the DNA template strand and the coding strand.",
 b="The template is 3'-TACGCCAACTAGAGT-5' and the coding strand is 5'-ATGCGGTTGATCTCA-3'.",
 ex="GRQ Q16, and both of yours were correct. The coding strand is the mRNA with T for U and keeps the same labelling.")
card(ct='APPLICATION',cid='seq-grq16-poly',src=GR+", Q16",d=3,
 f="Translate 5'-AUG CGG UUG AUC UCA-3', labelling the ends of the polypeptide.",
 b="N-terminus Met-Arg-Leu-Ile-Ser C-terminus.",
 ex="The amino end is made first, so the amino acid from the 5'-most codon becomes the N-terminus.")
card(ct='CONCEPTUAL',rel=True,cid='seq-trap-u-vs-t',src=CB+", p. 290",d=3,
 f="An answer choice for a DNA strand reads 5'-AUG-CTG-CAG-TAT-3'. What is wrong with it on sight?",
 b="It contains uracil, and DNA has thymine instead, so the option cannot be a DNA strand at all.",
 ex="Ex (clarification): scan for a mixed alphabet before doing any base pairing. A U in a DNA answer, or a T in an RNA answer, kills the option outright.")
card(ct='CONCEPTUAL',rel=True,cid='seq-back-translation-limit',src=CB+", p. 293",d=3,
 f="Why can a known polypeptide sequence not give you one exact DNA sequence?",
 b="The code is redundant, so most amino acids have more than one codon and many different DNA sequences would produce the same polypeptide.")

card(ct='EXEMPLAR',dir='instance-to-concept',cid='garrod',src=CB+", p. 289",sal='attaching',
 f="Archibald Garrod noticed that people with alkaptonuria pass black urine. What did he conclude from it?",
 b="He argued that they cannot make the enzyme that breaks down alkapton, which was the first suggestion that genes act on phenotype through enzymes.")
card(ct='APPLICATION',cid='arginine-mutant',src=CB+", p. 289",d=3,
 f="A Neurospora mutant grows on minimal medium plus arginine but not on minimal medium alone. What is it missing?",
 b="It is missing an enzyme needed to synthesize arginine.",
 ex="Beadle and Tatum found nutritional mutants this way: they grow on complete medium but not minimal, and you then add one nutrient at a time to find the blocked step. Neurospora is haploid, so disabling one allele reveals the wild-type gene's job directly.")
card(ct='FREE_RECALL',cid='one-gene-one-polypeptide',n=4,src=CB+", p. 290",kind='framework',
 f="BLURT: how one gene-one enzyme became one gene-one polypeptide. 4 things to hit.",
 items=["Beadle and Tatum argued from the Neurospora mutants that a gene dictates the production of one specific enzyme",
  "The first revision gave one gene-one protein, because not all proteins are enzymes and keratin and insulin are gene products too",
  "The second revision gave one gene-one polypeptide, because many proteins are built from two or more chains and each chain has its own gene",
  "Even that is imprecise, because alternative splicing lets one gene specify several related polypeptides and some genes make RNA that is never translated"])
card(ct='EXEMPLAR',dir='concept-to-instance',cid='hemoglobin',src=CB+", p. 290",sal='attaching',
 f="Which protein does the chapter use to show that one protein can require two genes?",b="Hemoglobin.",
 ex="It contains two kinds of polypeptide chain and each chain has its own gene. The same example is the standard illustration of quaternary structure.")
card(ct='EXEMPLAR',dir='instance-to-concept',cid='albino-donkey',src=CB+", p. 290",sal='attaching',
 f="The albino donkeys of Asinara lack working tyrosinase. What relationship does that illustrate?",
 b="A mutation in one gene produces a faulty enzyme, which blocks the melanin pathway and changes the whole phenotype.",
 ex="With no melanin the coat is white, and the nose, ears and hooves look pink because nothing masks the blood vessels.")

card(ct='CLOZE',cp='definition',cid='trna',src=CD+", p. 299",
 cz="A transfer RNA is {{c1::the molecule that transfers amino acids from the cytoplasmic pool to a growing polypeptide in a ribosome}}.")
card(ct='COMPARISON',ax="the two ends of one molecule and the two jobs they do",cid='trna-ends',src=CD+", pp. 299 to 300",
 f="The two ends of a tRNA do different jobs. What sits at each end?",
 b="The protruding 3' end is the amino acid attachment site, and the loop at the far end carries the anticodon that base-pairs with a complementary mRNA codon.",
 ex="Ex (clarification): an adapter plug. One face fits the message and the other carries the cargo, and the molecule is useless without both.")
card(ct='CONCEPTUAL',rel=True,cid='anticodon-direction',src=CD+", p. 300",d=3,
 f="Why are anticodons conventionally written 3' to 5' when codons are written 5' to 3'?",
 b="Writing them that way lines them up as they actually pair, because RNA strands must be antiparallel to base-pair.")
card(ct='APPLICATION',cid='trna-pairing',src=CD+", p. 300",d=3,
 f="An mRNA codon reads 5'-GGC-3'. Give the anticodon of the tRNA that pairs with it and the amino acid it carries.",
 b="The anticodon is 3'-CCG-5' and it carries glycine.")
card(ct='FREE_RECALL',cid='trna',n=5,src=CD+", pp. 299 to 300",kind='framework',
 f="BLURT: tRNA structure and function. 5 things to hit.",
 items=["A tRNA brings an amino acid from the cytosolic pool to the growing polypeptide in the ribosome",
  "It is one RNA strand of about eighty nucleotides, folded because complementary stretches within it base-pair",
  "The anticodon sits at one end and is written 3' to 5' so it aligns antiparallel to the codon",
  "The amino acid attachment site sits at the protruding 3' end",
  "Each tRNA is reused: it drops its cargo, leaves the ribosome, and is recharged with the same amino acid"])

card(ct='CLOZE',cp='definition',cid='synthetase',src=CD+", p. 300",
 cz="An aminoacyl-tRNA synthetase is {{c1::the enzyme that covalently attaches a specific amino acid to its correct tRNA}}.",
 ex="There are twenty of them, one per amino acid. ATP hydrolysis drives the attachment and the ATP becomes AMP. The loaded tRNA is called a charged tRNA.")
card(ct='COMPARISON',ax="which molecule does the recognizing at each step",cid='two-recognitions',src=CD+", p. 300",d=3,
 f="Accurate translation needs two acts of molecular recognition. What are they?",
 b="The synthetase matches an amino acid to the correct tRNA, and then the tRNA's anticodon matches the correct mRNA codon at the ribosome.",
 ex="This is the answer to Concept Check 14.4 question 1.")
card(ct='CONCEPTUAL',rel=True,cid='synthetase-fidelity',src=CD+", p. 300",d=4,
 f="The ribosome reads only a tRNA's anticodon and never checks its cargo. Where is accuracy actually enforced?",
 b="Accuracy rests with the synthetase, because if it charged a tRNA with the wrong amino acid the ribosome would insert that amino acid wherever the anticodon matched.")
card(ct='CLOZE',cp='definition',cid='wobble',src=CD+", p. 300",
 cz="Wobble is {{c1::the relaxed base pairing allowed at the third base of a codon, which lets one tRNA read more than one codon}}.",
 ex="It is why bacteria manage sixty-one codons with only about forty-five tRNAs.")
card(ct='CONCEPTUAL',rel=True,cid='wobble-third-base',src=CD+", p. 300",d=3,
 f="Why do synonymous codons differ at the third base rather than the first or second?",
 b="Base pairing rules are relaxed only at that position, so a change there can still be read by the same tRNA and still brings in the same amino acid.")
card(ct='APPLICATION',cid='wobble-application',src=CD+", p. 300",d=4,
 f="A tRNA has the anticodon 3'-UCU-5'. Given wobble, which two mRNA codons can it read and what do they specify?",
 b="It can read 5'-AGA-3' and 5'-AGG-3', and both specify arginine.")
