# -*- coding: utf-8 -*-
CARDS=[]
def card(**k):
    k.setdefault('sal','load-bearing'); k.setdefault('d',2); CARDS.append(k)
CB="Campbell Biology, Concept 14.1"; CD="Campbell Biology, Concept 14.4"
CE="Campbell Biology, Concept 15.4"; PE="Pearson Mastering Biology, Lesson 2"
GR="BIOL 103 Guided Reading Questions, Lesson 2"

card(ct='CLOZE',cp='definition',cid='gene',src=CB+", p. 289",
 cz="A gene is {{c1::a stretch of DNA that is expressed to form one functional product, either an RNA or a polypeptide}}.",
 ex="GRQ Q1, and your answer was right. This is the wording Pearson marked most complete, because it covers genes whose product is never translated.")
card(ct='CLOZE',cp='definition',cid='gene-expression',src=CB+", p. 289",
 cz="Gene expression is {{c1::the process in which DNA directs the synthesis of its product, a protein or in some cases an RNA}}.")
card(ct='BASIC_QA',cid='rna-bridge',src=CB+", p. 290",
 f="A gene does not build a protein directly. What molecule bridges DNA and protein?",b="RNA.",
 ex="GRQ Q3. Transcription writes RNA from the gene, and translation reads that RNA into a polypeptide.")
card(ct='COMPARISON',ax="whether the chemical language stays the same or changes",cid='transcription-vs-translation',
 src=CB+", p. 290",d=3,
 f="Transcription and translation both copy information. Which one changes the chemical language, and how?",
 b="Translation does. Transcription stays in the language of nucleotides and rewrites DNA into RNA, while translation shifts languages and turns a nucleotide sequence into a sequence of amino acids.",
 ex="Ex (clarification): transcription copies a sentence into a second notebook, and translation renders that sentence into another language.")
card(ct='BASIC_QA',cid='transcription-translation-io',src=CB+", pp. 290 to 291",
 f="Give the template and the product for transcription, then for translation.",
 b="Transcription uses a DNA template and produces RNA, and translation uses an mRNA template and produces a polypeptide.",ex="GRQ Q7.")
card(ct='CLOZE',cp='definition',cid='mrna',src=CB+", p. 291",
 cz="Messenger RNA is {{c1::the RNA molecule that carries a gene's protein-building instructions from the DNA to the protein-synthesizing machinery of the cell}}.",ex="GRQ Q6.")
card(ct='BASIC_QA',cid='central-dogma',src=CB+", p. 291",sal='attaching',
 f="What did Francis Crick name the DNA to RNA to protein flow of information?",b="The central dogma.",
 ex="He coined it in 1956. Some enzymes copy RNA back into DNA, but those are exceptions and the general direction still holds.")
card(ct='CLOZE',cp='definition',cid='rna-processing',src=PE,sal='attaching',
 cz="RNA processing is {{c1::the editing that turns a pre-mRNA transcript into the finished mRNA before it leaves the nucleus}}.")

card(ct='COMPARISON',ax="sugar, nitrogenous base, and number of strands",cid='dna-vs-rna',src=CB+", p. 290",
 f="Name the three ways DNA and RNA differ.",
 b="DNA has deoxyribose, thymine and two strands, while RNA has ribose, uracil and usually a single strand.",
 ex="GRQ Q4 table. Adenine, guanine and cytosine appear in both.")
card(ct='BASIC_QA',cid='adenine-scope',src=PE,sal='attaching',
 f="Besides DNA and RNA, which energy-carrying molecule contains adenine?",b="ATP.",
 ex="Adenine is shared by ATP, RNA and DNA. It is not found in proteins, triglycerides or glucose.")
card(ct='CONCEPTUAL',rel=True,cid='mrna-complementary',src=CB+", p. 292",d=3,
 f="Why is an mRNA sequence complementary to its DNA template rather than identical to it?",
 b="RNA nucleotides are assembled onto the template by base pairing, so each RNA base pairs with a template base instead of matching it, and uracil replaces thymine.",
 ex="GRQ Q5. The wrinkle worth holding: mRNA is not identical to the template, but it is identical to the coding strand apart from U for T.")

card(ct='CLOZE',cp='definition',cid='template-strand',src=CB+", p. 292",
 cz="The template strand is {{c1::the DNA strand that provides the pattern for the nucleotide sequence of an RNA transcript}}.",ex="GRQ Q13.")
card(ct='BASIC_QA',cid='one-strand-transcribed',src=CB+", p. 292",
 f="For any one gene, how many of the two DNA strands are transcribed?",b="One.",ex="GRQ Q12.")
card(ct='CONCEPTUAL',rel=True,cid='template-varies-by-gene',src=CB+", p. 292",d=3,
 f="A gene always uses the same template strand. What is true of a different gene farther along the same DNA molecule?",
 b="That gene may use the opposite strand as its template, because which strand is read depends on the orientation of the transcribing enzyme rather than on the chromosome.",
 ex="GRQ Q14. There is no permanent template strand and coding strand assigned to a whole chromosome.")
card(ct='COMPARISON',ax="which strand the mRNA sequence matches",cid='coding-strand',src=CB+", p. 292",
 f="Which DNA strand reads the same as the mRNA apart from T for U, and what is it called?",
 b="The nontemplate strand does, and it is called the coding strand because it reads the same as the message.",
 ex="A gene's sequence is reported as the coding strand, because it shows the message directly.")
card(ct='CLOZE',cp='single',tj="antiparallel is the term the sequence problems turn on",
 cid='antiparallel-synthesis',src=CB+", p. 292",sal='attaching',
 cz="Like a new strand of DNA, an RNA molecule is synthesized {{c1::antiparallel}} to its template strand.",
 ex="This is why the 5' and 3' labels flip when you write out a template and its transcript.")

card(ct='COMPARISON',ax="whether a membrane separates transcription from translation",cid='bact-euk-envelope',
 src=CB+", p. 291",kind='framework',d=3,
 f="What one structure separates transcription from translation in a eukaryotic cell but not a bacterial one?",
 b="The nuclear envelope does. Bacteria have none, so their DNA, mRNA and ribosomes share a single compartment, and every other difference between the two follows from that.",
 ex="Ex: Campbell calls the bacterial cell a one-room workshop, which is why it can couple the two processes.")
card(ct='CONCEPTUAL',rel=True,cid='euk-no-coupling',src=PE,
 f="Could a eukaryotic cell couple transcription and translation the way a bacterium does?",
 b="No. The nuclear membrane separates the two in space and time, and the transcript must be processed and exported before a ribosome can reach it.",
 ex="A bacterium can begin translating as soon as the 5' end of the mRNA peels away from the DNA template.")
card(ct='COMPARISON',ax="where the DNA sits, and whether the transcript is edited",cid='bact-euk-table',src=CB+", p. 291",
 f="Bacterial versus animal cell: where is the DNA, and is the transcript modified before use?",
 b="A bacterial cell keeps its DNA in the cytoplasm and does not modify the transcript, while an animal cell keeps its DNA in the nucleus and processes pre-mRNA into mRNA before export.",
 ex="GRQ Q9 table.")
card(ct='COMPARISON',ax="the compartment versus the machine that works in it",cid='translation-location',src=CB+", p. 291",
 f="Where does translation happen in a eukaryotic cell: name the compartment and the structure.",
 b="Translation happens in the cytosol, on ribosomes that are either free or bound to the ER.",
 ex="GRQ Q9. You wrote 'ribosome' for the location row and Pearson accepted 'ribosomes' for the same question, so it is not wrong in this course. Campbell draws the comparison on compartments, where the answer is the cytosol in both.")
card(ct='CLOZE',cp='definition',cid='primary-transcript',src=CB+", p. 291",sal='attaching',
 cz="A primary transcript is {{c1::the initial RNA transcript from any gene, before any processing has happened}}.",
 ex="The term covers transcripts of tRNA and rRNA genes too, not only pre-mRNA.")
card(ct='FREE_RECALL',cid='bact-euk-envelope',n=5,src=CB+", p. 291",
 f="BLURT: bacterial versus eukaryotic gene expression. 5 things to hit.",
 items=["Bacteria have no nuclear envelope and eukaryotes do, and every difference below follows from that",
  "Transcription happens in the cytoplasm in bacteria and in the nucleus in eukaryotes",
  "Translation happens in the cytosol in both",
  "A bacterium can transcribe and translate the same gene at once, and a eukaryote cannot",
  "Eukaryotic pre-mRNA is processed into mRNA before it leaves the nucleus, and bacterial mRNA is translated as made"])

card(ct='CONCEPTUAL',rel=True,cid='why-triplet',src=CB+", p. 292",d=3,
 f="Why must the genetic code use three-nucleotide words rather than one or two?",
 b="Four bases give only four one-letter words and sixteen two-letter words, and neither covers twenty amino acids, while three-letter words give sixty-four.")
card(ct='CLOZE',cp='definition',cid='codon',src=CB+", p. 292",
 cz="A codon is {{c1::a three-nucleotide word in mRNA that specifies one amino acid or a stop signal}}.",ex="GRQ Q15.")
card(ct='CONCEPTUAL',rel=True,cid='codon-in-dna',src=CB+", p. 292",d=3,
 f="The term codon is used for DNA triplets too. Which DNA strand carries them, and why that one?",
 b="The nontemplate or coding strand carries them, because its triplets are identical in sequence to the mRNA codons apart from T in place of U.",
 ex="GRQ Q11. Your verdict of true was right, but the explanation had the strands swapped: you wrote that the template strand carries the codons.")
card(ct='BASIC_QA',cid='61-3',src=CB+", p. 293",sal='attaching',
 f="Of the 64 codons, how many specify amino acids?",b="61 do, and the other three are stop signals.")
card(ct='CLOZE',cp='enumerated-list',lo=False,cid='stop-codons',src=CD+", p. 303",sal='attaching',
 cz="The three stop codons, in any order, are {{c1::UAG}}, {{c2::UAA}} and {{c3::UGA}}.")
card(ct='BASIC_QA',cid='aug-dual',src=CB+", p. 293",
 f="What two jobs does the codon AUG do?",b="It codes for methionine and it starts translation.",
 ex="Every polypeptide therefore begins with methionine, though an enzyme often removes it afterwards.")
card(ct='COMPARISON',ax="one meaning per codon versus one codon per meaning",cid='redundant-unambiguous',src=CB+", p. 293",d=3,
 f="The genetic code is redundant but not ambiguous. What does each of those words rule out?",
 b="Redundant means several different codons can specify the same amino acid, and unambiguous means no single codon ever specifies more than one amino acid.",
 ex="GAA and GAG both mean glutamic acid, and neither one ever means anything else.")
card(ct='CLOZE',cp='definition',cid='reading-frame',src=CB+", p. 293",
 cz="The reading frame is {{c1::the grouping in which an mRNA's nucleotides are read as consecutive, nonoverlapping triplets}}.",
 ex="Ex: Campbell's own case is that 'The red dog ate the bug' shifted one letter over becomes 'her edd oga tet heb ug'.")
card(ct='CONCEPTUAL',rel=True,cid='universality-consequence',src=PE,
 f="The genetic code is essentially universal. What follows for a gene moved from one organism into another?",
 b="Any organism can in principle express it, because the same codons specify the same amino acids everywhere, which means the code was in place before the common ancestor of present-day life.")
card(ct='EXEMPLAR',dir='concept-to-instance',cid='universality-examples',src=CB+", p. 293",sal='attaching',
 f="Which examples does the chapter give of one species expressing another species' gene?",
 b="A tobacco plant glows from a firefly gene, and a mosquito larva expresses a jellyfish gene.",
 ex="Bacteria carrying human genes make insulin for medical use, which puts the same principle to work.")
card(ct='EXEMPLAR',dir='instance-to-concept',cid='nirenberg',src=CB+", p. 293",sal='attaching',
 f="Marshall Nirenberg translated an artificial all-uracil mRNA in a test tube. What did the result establish?",
 b="The product was a chain of phenylalanine, which established that the codon UUU specifies phenylalanine.",
 ex="It was the first codon deciphered, in 1961, and AAA, GGG and CCC followed by the same method.")
card(ct='FREE_RECALL',cid='genetic-code',n=6,src=CB+", pp. 292 to 293",kind='framework',
 f="BLURT: properties of the genetic code. 6 things to hit.",
 items=["The code is a triplet code, because 64 is the smallest power of four that covers twenty amino acids",
  "61 of the 64 codons specify amino acids and three are stop signals",
  "AUG codes methionine and starts translation, while UAG, UAA and UGA stop it",
  "The code is redundant, so several codons can mean one amino acid, usually differing at the third base",
  "The code is unambiguous, so no codon ever specifies two different amino acids",
  "The code is nearly universal across all life"])
