"""Source-grounded card record for BIOL103 Lesson 3: meiosis and inheritance.

The compact deck deliberately samples the concept map rather than converting every
Pearson question into a separate note.  `src` is carried into the APKG provenance
field; all of the sources were supplied by Andy on 2026-08-26.
"""

CARDS = []


def card(ct, cid, *, f="", b="", cz="", cp=None, ex="", ax=None, rel=False,
         sal="load-bearing", d=2, src="", dir=None, items=None, n=None, lo=None):
    record = dict(ct=ct, cid=cid, f=f, b=b, cz=cz, cp=cp, ex=ex, ax=ax, rel=rel,
                  sal=sal, d=d, src=src)
    if dir:
        record["dir"] = dir
    if items is not None:
        record["items"] = items
        record["n"] = n
    if lo is not None:
        record["lo"] = lo
    CARDS.append(record)


T10 = "Campbell Biology Chapter 10 screenshots; Lesson 3 GRQ"
T11 = "Campbell Biology Chapter 11 screenshots; Lesson 3 GRQ"
T12 = "Campbell Biology Chapter 12 screenshots; Lesson 3 GRQ"
OUTLINE = "Lesson 3 Class Outline BIOL103 FA26.docx"
PEARSON = "Pearson Chapter 10/11 practice supplied 2026-08-26"

# ── 1. chromosome language and life cycles ────────────────────────────────
card("CLOZE", "gene", cp="definition",
     cz="A gene is {{c1::a specific DNA sequence that encodes a functional RNA or polypeptide product}}.",
     ex="Different alleles are versions of the same gene at the same locus.", d=2, src=T10)
card("CLOZE", "locus", cp="definition",
     cz="A locus is {{c1::a gene's specific physical position along a chromosome}}.",
     ex="Homologous chromosomes carry the same genes at corresponding loci, although their alleles can differ.", d=2, src=T10)
card("CONCEPTUAL", "gene-chromosome-genome",
     f="How do a gene, chromosome, and genome relate to one another?",
     b="A gene is one DNA sequence with a functional product, a chromosome is one long DNA molecule carrying many genes, and a genome is an organism's complete DNA set.",
     ex="A human somatic cell contains the complete genome distributed across 46 chromosomes.", rel=True, d=3, src=PEARSON)
card("CLOZE", "somatic-cell", cp="definition",
     cz="A somatic cell is {{c1::a body cell other than a gamete or its precursor}}.",
     ex="In humans, somatic cells normally have 46 chromosomes.", d=2, src=T10)
card("CLOZE", "gamete", cp="definition",
     cz="A gamete is {{c1::a reproductive cell that carries one chromosome set and can fuse with another gamete at fertilization}}.",
     ex="Sperm and eggs are human gametes.", d=2, src=T10)
card("COMPARISON", "somatic-vs-gamete", ax="cell role and chromosome-set number",
     f="How do human somatic cells and gametes differ in chromosome-set number?",
     b="Somatic cells are diploid and contain two chromosome sets, whereas gametes are haploid and contain one set.",
     ex="A human somatic cell has 46 chromosomes, while a normal gamete has 23.", rel=True, d=3, src=PEARSON)
card("CLOZE", "diploid", cp="definition",
     cz="A diploid cell is {{c1::a cell with two chromosome sets, usually one set inherited from each parent}}.",
     ex="A human zygote and most human body cells are diploid.", d=2, src=T10)
card("CLOZE", "haploid", cp="definition",
     cz="A haploid cell is {{c1::a cell with one chromosome set, so it has one member of each homologous pair}}.",
     ex="Each human sperm or egg is haploid.", d=2, src=T10)
card("CONCEPTUAL", "2n-meaning",
     f="In the notation 2n = 6, what do 2, n, and 6 each mean?",
     b="The 2 means the cell has two chromosome sets, n is the number in one set, and 6 is the total chromosome count in that diploid cell.",
     ex="If 2n = 6, then n = 3 and each gamete has three chromosomes.", d=4, src=PEARSON)
card("APPLICATION", "diploid-to-gamete",
     f="A species has 2n = 16. How many chromosomes are in one gamete, and why?",
     b="One gamete has eight chromosomes because meiosis gives each gamete one chromosome set, which is n = 8.",
     ex="The species therefore has eight homologous pairs in each diploid cell.", d=3, src=PEARSON)
card("CLOZE", "homologous-chromosomes", cp="definition",
     cz="Homologous chromosomes are {{c1::a maternal and paternal chromosome pair that carry the same genes at corresponding loci but may carry different alleles}}.",
     ex="The blue and red chromosomes in the meiosis figures are homologs.", d=3, src=T10)
card("CLOZE", "sister-chromatids", cp="definition",
     cz="Sister chromatids are {{c1::the two DNA copies of one duplicated chromosome, joined at the centromere}}.",
     ex="Replication produces sister chromatids before meiosis begins.", d=2, src=T10)
card("COMPARISON", "homologs-vs-sisters", ax="origin, DNA relationship, and when they separate",
     f="How do homologous chromosomes differ from sister chromatids?",
     b="Homologs are maternal and paternal versions of a chromosome, while sister chromatids are copied versions of one chromosome. Homologs separate in meiosis I; sisters separate in meiosis II.",
     ex="Homologs may carry different alleles, but sister chromatids are initially copies of the same DNA molecule.", rel=True, d=4, src=T10)
card("CONCEPTUAL", "replication-vs-ploidy",
     f="Why does DNA replication double DNA content without changing ploidy?",
     b="Replication makes a sister chromatid for each chromosome but does not add another homologous chromosome set, so DNA amount rises while ploidy stays the same.",
     ex="A human cell remains diploid after S phase even though every chromosome has duplicated.", d=4, src=PEARSON)
card("COMPARISON", "asexual-vs-sexual", ax="genetic similarity of offspring to parent",
     f="How does sexual reproduction differ from asexual reproduction in the genetic similarity of offspring?",
     b="Sexual reproduction combines genes from two parents and produces unique combinations, whereas asexual reproduction can produce offspring genetically identical to one parent.",
     ex="A clone can arise from asexual reproduction, while fertilization joins gametes from two parents.", rel=True, d=3, src=T10)
card("EXEMPLAR", "asexual-clone", dir="instance-to-concept",
     f="A hydra buds from one parent and the new individual has the parent's genome. What reproductive pattern does this illustrate?",
     b="It illustrates asexual reproduction, which can produce a genetically identical clone from one parent.",
     ex="The textbook also shows redwoods arising asexually from a single parent tree.", rel=True, d=2, src=T10)
card("EXEMPLAR", "asexual-clone", dir="concept-to-instance",
     f="Which textbook examples illustrate asexual reproduction in multicellular organisms?",
     b="Hydra budding and the redwood trees arising from one parent illustrate asexual reproduction.",
     ex="Both examples are shown in Figure 10.2.", rel=True, d=2, src=T10)

# ── 2. meiosis ────────────────────────────────────────────────────────────
card("FREE_RECALL", "meiosis-overview", f="BLURT: meiosis. 5 things to hit.", n=5,
     items=[
         "Meiosis begins with one diploid cell after its chromosomes have duplicated.",
         "Meiosis I separates homologous chromosomes and reduces chromosome-set number.",
         "Meiosis II separates sister chromatids without another DNA replication.",
         "Meiosis produces four haploid cells, each with one chromosome set.",
         "Crossing over and independent assortment make the products genetically varied.",
     ], ex="Use Figure 10.7 as the visual spine for this sequence.", d=4, src=T10)
card("PROCESS", "meiosis-output",
     f="What does one diploid cell produce by the end of meiosis?",
     b="One diploid cell produces four haploid daughter cells, each containing one chromosome set.",
     ex="The four cells are not genetically identical because of crossing over and independent assortment.", d=2, src=PEARSON)
card("PROCESS", "meiosis-i",
     f="What separates during meiosis I?",
     b="Homologous chromosomes separate during meiosis I, while sister chromatids remain joined at their centromeres.",
     ex="This is why meiosis I changes a cell from diploid to haploid.", d=3, src=T10)
card("PROCESS", "meiosis-ii",
     f="What separates during meiosis II?",
     b="Sister chromatids separate during meiosis II, producing haploid cells with unduplicated chromosomes.",
     ex="No chromosome duplication occurs between meiosis I and meiosis II.", d=3, src=T10)
card("CONCEPTUAL", "ploidy-meiosis-i-vs-ii",
     f="Why does meiosis I reduce ploidy while meiosis II does not?",
     b="Meiosis I separates homologs into different cells, leaving one set per cell. Meiosis II only separates sister copies that already belong to the same set.",
     ex="A meiosis I product is haploid even though each chromosome is still duplicated.", d=4, src=T10)
card("CLOZE", "prophase-i", cp="definition",
     cz="During prophase I, homologous chromosomes {{c1::pair by synapsis, and nonsister chromatids can exchange corresponding DNA segments by crossing over}}.",
     ex="The visible X-shaped crossover sites are called chiasmata.", d=3, src=T10)
card("CLOZE", "metaphase-i", cp="definition",
     cz="During metaphase I, {{c1::homologous chromosome pairs line up at the metaphase plate}}.",
     ex="Each pair lines up independently of the other pairs.", d=2, src=T10)
card("CLOZE", "anaphase-i", cp="definition",
     cz="During anaphase I, {{c1::the two homologous chromosomes of each pair move toward opposite poles while sister chromatids remain together}}.",
     ex="The centromere does not split in anaphase I.", d=3, src=T10)
card("CLOZE", "telophase-i", cp="definition",
     cz="After telophase I and cytokinesis, {{c1::two haploid cells have formed, but each chromosome still consists of two sister chromatids}}.",
     ex="This is a frequent trap: haploid does not mean unduplicated.", d=3, src=PEARSON)
card("COMPARISON", "anaphase-i-vs-ii", ax="which DNA structures move apart",
     f="How can you distinguish anaphase I from anaphase II in a diagram?",
     b="In anaphase I, homologous chromosomes move apart while each remains duplicated. In anaphase II, sister chromatids move apart after the centromere divides.",
     ex="The Pearson anaphase I image shows paired sister chromatids moving as units toward opposite poles.", rel=True, d=4, src=PEARSON)
card("EXEMPLAR", "anaphase-i-figure", dir="instance-to-concept",
     f="A meiosis image shows duplicated chromosomes moving to opposite poles, with sister chromatids still joined. Which phase is it?",
     b="It is anaphase I because homologous chromosomes, not sister chromatids, are separating.",
     ex="This is the phase shown in the Pearson question with the correct answer anaphase I.", rel=True, d=3, src=PEARSON)
card("EXEMPLAR", "anaphase-i-figure", dir="concept-to-instance",
     f="What visual evidence would identify anaphase I rather than anaphase II?",
     b="Each moving chromosome still has two joined sister chromatids, so the separating structures are homologous chromosomes.",
     ex="Centromeres remain intact in anaphase I.", rel=True, d=3, src=PEARSON)
card("PROCESS", "crossing-over",
     f="When and between which DNA molecules does crossing over occur?",
     b="Crossing over occurs during prophase I between nonsister chromatids of homologous chromosomes.",
     ex="The exchange creates recombinant chromatids with maternal and paternal DNA segments.", d=3, src=PEARSON)
card("CONCEPTUAL", "crossing-over-variation",
     f="Why does crossing over increase genetic variation?",
     b="Crossing over swaps corresponding DNA segments between homologs, creating chromosomes with new combinations of maternal and paternal alleles.",
     ex="Chiasmata mark sites where exchange has occurred.", d=3, src=T10)
card("CLOZE", "independent-assortment-meiosis", cp="definition",
     cz="Independent assortment occurs because {{c1::each homologous pair lines up independently of every other pair at metaphase I}}.",
     ex="Different orientations send different mixtures of maternal and paternal homologs into gametes.", d=3, src=T10)
card("CONCEPTUAL", "independent-assortment-variation",
     f="How does independent assortment create variation without changing a chromosome's DNA sequence?",
     b="Each homologous pair aligns independently in metaphase I, so gametes receive different combinations of whole maternal and paternal chromosomes.",
     ex="This differs from crossing over, which changes combinations within a chromosome.", d=4, src=T10)
card("COMPARISON", "crossing-over-vs-independent-assortment", ax="level at which alleles are reshuffled",
     f="How do crossing over and independent assortment differ as sources of genetic variation?",
     b="Crossing over reshuffles DNA segments within homologous chromosomes, while independent assortment reshuffles which maternal and paternal homologs enter a gamete.",
     ex="Both occur in meiosis I, but they alter genetic combinations in different ways.", rel=True, d=4, src=T10)
card("COMPARISON", "mitosis-vs-meiosis", ax="number of divisions, chromosome-set outcome, and genetic similarity",
     f="How does meiosis differ from mitosis in outcome?",
     b="Meiosis uses two divisions to make four haploid, genetically varied cells, whereas mitosis makes two genetically similar cells with the parent cell's chromosome-set number.",
     ex="Both processes are preceded by DNA replication.", rel=True, d=4, src=OUTLINE)
card("CONCEPTUAL", "why-two-divisions",
     f="Why must meiosis have two divisions after only one DNA replication?",
     b="The first division separates homologs to halve the chromosome sets, and the second separates their sister chromatids so each gamete receives one copy of each chromosome.",
     ex="A second replication would undo the reduction achieved in meiosis I.", d=4, src=T10)
card("CLOZE", "dna-content-prophase-i", cp="definition",
     cz="A cell arrested in prophase I has {{c1::twice the DNA content of a G1 diploid cell because DNA replication has already occurred}}.",
     ex="On the supplied relative-DNA graph, the prophase I sample is the bar at 4n DNA content.", d=3, src=PEARSON)
card("CLOZE", "dna-content-after-meiosis-ii", cp="definition",
     cz="After meiosis II and cytokinesis, each product has {{c1::half the DNA content of a G1 diploid cell and one chromosome set}}.",
     ex="On the supplied graph, this corresponds to the 1n DNA-content sample.", d=3, src=PEARSON)
card("APPLICATION", "dna-table-meiosis-timing",
     f="In the yeast DNA table, DNA content returns from about 24 fg to about 12 fg per cell at 11 hours. What does that indicate?",
     b="It indicates that meiosis II is complete by about 11 hours because each haploid product now has half the DNA content of the starting G1 diploid cell.",
     ex="DNA rose first to about 48 fg after S phase, then fell after meiosis I and meiosis II.", d=4, src=PEARSON)
card("CONCEPTUAL", "dna-content-vs-chromosome-count",
     f="Why can DNA content fall across meiosis even though a duplicated chromosome is still counted as one chromosome before sister chromatids separate?",
     b="Chromosome number is counted by centromeres, while DNA content measures DNA molecules. Replication doubles DNA molecules without doubling centromeres, and divisions distribute DNA into new cells.",
     ex="This is why 2n, chromosome number, chromatid number, and C value must be tracked separately.", d=5, src=OUTLINE)

# ── 3. Mendelian inheritance and probability ──────────────────────────────
card("FREE_RECALL", "mendel-model", f="BLURT: Mendel's model. 5 things to hit.", n=5,
     items=[
         "Alternative alleles of a gene can produce different inherited traits.",
         "A diploid organism inherits two alleles for each character, one from each parent.",
         "A dominant allele determines phenotype when it is paired with a recessive allele.",
         "The two alleles segregate during gamete formation, so each gamete receives one allele.",
         "Random fertilization recombines gametes and creates predictable genotype probabilities.",
     ], ex="The purple and white pea experiments supplied evidence for this model.", d=4, src=T11)
card("CLOZE", "allele", cp="definition",
     cz="An allele is {{c1::an alternative version of a gene at the same locus on homologous chromosomes}}.",
     ex="Purple-flower and white-flower alleles are alternative versions at the flower-color locus.", d=2, src=T11)
card("CLOZE", "genotype", cp="definition",
     cz="A genotype is {{c1::an organism's allele combination for a gene or set of genes}}.",
     ex="PP, Pp, and pp are different genotypes for flower color.", d=2, src=T11)
card("CLOZE", "phenotype", cp="definition",
     cz="A phenotype is {{c1::an organism's observable traits or appearance that result from its genotype and, often, its environment}}.",
     ex="PP and Pp pea plants both have a purple phenotype in Mendel's flower-color example.", d=2, src=T11)
card("COMPARISON", "genotype-vs-phenotype", ax="allele combination versus observable trait",
     f="Why can two organisms have the same phenotype but different genotypes?",
     b="A dominant allele can mask a recessive allele, so a homozygous dominant and a heterozygote can look the same while carrying different allele combinations.",
     ex="Purple pea plants can be PP or Pp, whereas white plants must be pp in this model.", rel=True, d=3, src=T11)
card("CLOZE", "homozygous", cp="definition",
     cz="A homozygous organism has {{c1::two identical alleles for a gene}}.",
     ex="PP and pp pea plants are homozygous.", d=2, src=T11)
card("CLOZE", "heterozygous", cp="definition",
     cz="A heterozygous organism has {{c1::two different alleles for a gene}}.",
     ex="A Pp pea plant is heterozygous.", d=2, src=T11)
card("COMPARISON", "homozygous-vs-heterozygous", ax="allele pair and gametes produced",
     f="How do homozygous and heterozygous organisms differ in the gametes they make for one gene?",
     b="A homozygote makes gametes carrying one allele type, whereas a heterozygote makes gametes carrying either allele in equal proportions.",
     ex="PP makes only P gametes; Pp makes P and p gametes.", rel=True, d=3, src=T11)
card("CLOZE", "law-segregation", cp="definition",
     cz="The law of segregation states that {{c1::the two alleles for a gene separate during gamete formation, so each gamete receives one allele}}.",
     ex="The chromosome-level basis is homologous chromosomes separating in meiosis I.", d=3, src=T11)
card("CONCEPTUAL", "segregation-physical-basis",
     f="How does meiosis provide the physical basis for Mendel's law of segregation?",
     b="When homologous chromosomes separate in meiosis I, the allele carried on each homolog goes into a different gamete, so the two alleles segregate.",
     ex="A heterozygous Pp plant makes P and p gametes because its homologs separate.", d=4, src=T11)
card("EXEMPLAR", "f1-f2-mendel", dir="instance-to-concept",
     f="True-breeding purple and white pea plants produce all-purple F1 offspring, then purple and white F2 offspring. What does this show?",
     b="It shows that the white allele was not lost in F1 plants; it was masked by the dominant purple allele and reappeared after alleles segregated.",
     ex="Mendel observed about a 3:1 purple-to-white ratio in F2 plants.", rel=True, d=4, src=T11)
card("EXEMPLAR", "f1-f2-mendel", dir="concept-to-instance",
     f="Which result from Mendel's pea experiments argues against blending inheritance?",
     b="The recessive white-flower phenotype reappeared in the F2 generation after all F1 plants were purple.",
     ex="The F2 data were 705 purple-flowered plants and 224 white-flowered plants.", rel=True, d=3, src=T11)
card("APPLICATION", "monohybrid-punnett",
     f="A Dd plant self-pollinates, and D causes dark leaves. Which Punnett-square boxes produce dark leaves?",
     b="The DD and both Dd boxes produce dark leaves, so three of the four boxes show the dominant phenotype.",
     ex="This is the supplied Pearson dark-leaf square with boxes 1, 2, and 3.", d=3, src=PEARSON)
card("CONCEPTUAL", "3-to-1-ratio",
     f="What does a 3:1 dominant-to-recessive phenotype ratio suggest about a single-gene cross?",
     b="It suggests a heterozygote-by-heterozygote monohybrid cross in which a dominant allele masks the recessive allele in three of four expected offspring.",
     ex="A Pp × Pp cross produces PP, Pp, Pp, and pp genotypes.", d=3, src=PEARSON)
card("APPLICATION", "testcross",
     f="A purple-flowered plant has an unknown genotype. How can a testcross reveal whether it is PP or Pp?",
     b="Cross it with a homozygous recessive plant. All dominant offspring support PP, while a 1:1 dominant-to-recessive outcome supports Pp.",
     ex="The recessive parent contributes only p gametes, so the unknown parent's gametes determine the offspring pattern.", d=4, src=T11)
card("CLOZE", "multiplication-rule", cp="definition",
     cz="The multiplication rule finds the probability that independent events both occur by {{c1::multiplying their individual probabilities}}.",
     ex="An rr offspring requires an r egg and an r sperm: 1/2 × 1/2 = 1/4.", d=2, src=T11)
card("CLOZE", "addition-rule", cp="definition",
     cz="The addition rule finds the probability of mutually exclusive outcomes by {{c1::adding the probability of each alternative outcome}}.",
     ex="A heterozygote can arise from dominant egg plus recessive sperm or the reverse, so 1/4 + 1/4 = 1/2.", d=3, src=T11)
card("COMPARISON", "multiplication-vs-addition", ax="whether outcomes must both occur or are alternative routes",
     f="When should a genetics problem use multiplication rather than addition?",
     b="Use multiplication for events that must occur together, and addition for mutually exclusive routes to the same outcome.",
     ex="For Rr × Rr, rr uses multiplication; Rr uses addition because it has two routes.", rel=True, d=4, src=T11)
card("APPLICATION", "recessive-cross-probability",
     f="What is the chance of a homozygous recessive offspring from a heterozygote crossed with a homozygous recessive organism?",
     b="The chance is one-half because the heterozygous parent makes dominant and recessive gametes equally, while the recessive parent makes only recessive gametes.",
     ex="Aa × aa produces Aa and aa offspring in equal expected proportions.", d=3, src=PEARSON)
card("CLOZE", "independent-assortment-law", cp="definition",
     cz="The law of independent assortment states that {{c1::allele pairs for different genes segregate independently during gamete formation}}.",
     ex="The rule applies when genes are on different chromosomes or far apart on the same chromosome.", d=3, src=T11)
card("CONCEPTUAL", "independent-assortment-limit",
     f="Why does Mendel's law of independent assortment not apply equally to every pair of genes?",
     b="Genes that are close together on the same chromosome tend to be inherited together, so their alleles do not assort independently as often as unlinked genes.",
     ex="The Chapter 12 source introduces these genes as genetically linked.", d=4, src=T11)
card("EXEMPLAR", "dihybrid-ratio", dir="instance-to-concept",
     f="A YyRr × YyRr cross yields four phenotype classes near 9:3:3:1. What principle does that support?",
     b="It supports independent assortment because the two allele pairs combine into four gamete classes and produce the 9:3:3:1 dihybrid pattern.",
     ex="Mendel's yellow-round, green-round, yellow-wrinkled, and green-wrinkled peas approximate this ratio.", rel=True, d=4, src=T11)
card("EXEMPLAR", "dihybrid-ratio", dir="concept-to-instance",
     f="What F2 phenotypic ratio is expected when two unlinked heterozygous gene pairs assort independently?",
     b="A dihybrid cross predicts a 9:3:3:1 phenotypic ratio when each gene shows complete dominance.",
     ex="The figure contrasts this with the 3:1 ratio predicted if the two gene pairs were transmitted together.", rel=True, d=3, src=T11)

# ── 4. pedigrees and inheritance patterns ─────────────────────────────────
card("FREE_RECALL", "pedigree-reasoning", f="BLURT: a dominant-trait pedigree. 4 things to hit.", n=4,
     items=[
         "An unaffected individual for a dominant trait must be homozygous recessive.",
         "An affected individual with an unaffected parent must be heterozygous.",
         "Use known genotypes to narrow a person's possible genotype before calculating offspring risk.",
         "Each new child is an independent event once the parents' genotypes are known.",
     ], ex="The supplied W pedigree gives an unaffected ww parent and affected Ww parent in generation I.", d=4, src=PEARSON)
card("EXEMPLAR", "dominant-pedigree", dir="instance-to-concept",
     f="In the supplied dominant W pedigree, individual II-5 is unaffected. What is her genotype?",
     b="Individual II-5 is ww because an unaffected person must lack the dominant W allele.",
     ex="The pedigree explicitly states that W is the dominant trait allele.", rel=True, d=3, src=PEARSON)
card("EXEMPLAR", "dominant-pedigree", dir="concept-to-instance",
     f="In a pedigree for a dominant trait, what genotype must an unaffected person have?",
     b="An unaffected person must be homozygous recessive because any dominant allele would produce the trait.",
     ex="II-5 in the supplied W pedigree is ww.", rel=True, d=3, src=PEARSON)
card("APPLICATION", "pedigree-risk",
     f="In the supplied W pedigree, IV-3 is affected and has a ww parent. What is the chance that IV-3 and an unaffected ww partner have an affected child?",
     b="The chance is one-half because IV-3 must be Ww and a Ww × ww cross produces affected Ww offspring half the time.",
     ex="The supplied Pearson question identifies the correct probability as 50%.", d=4, src=PEARSON)
card("APPLICATION", "pedigree-certainty",
     f="Why is individual III-1 in the supplied W pedigree certainly Ww rather than WW?",
     b="III-1 has an unaffected ww parent, so that parent can supply only w. Because III-1 is affected, the other allele must be W.",
     ex="This is a useful pedigree rule: an affected child of a recessive-phenotype parent is heterozygous for a dominant trait.", d=4, src=PEARSON)
card("CLOZE", "recessive-disorder", cp="definition",
     cz="A recessively inherited disorder appears when {{c1::an individual inherits two recessive disease alleles, one from each parent}}.",
     ex="Parents with normal phenotypes can both be carriers and have an affected child.", d=3, src=T11)
card("CLOZE", "carrier", cp="definition",
     cz="A carrier is {{c1::a heterozygous person who has one recessive disease allele but usually has the normal phenotype}}.",
     ex="For many recessive disorders, one normal allele produces enough functional protein for a normal phenotype.", d=3, src=T11)
card("CONCEPTUAL", "carrier-normal-phenotype",
     f="Why can a carrier of a recessive disorder have a normal phenotype?",
     b="One normal allele can produce enough functional protein for the cell to function normally, so the disease usually appears only when both alleles are recessive.",
     ex="The albinism figure shows Aa carriers with normal phenotypes.", d=4, src=T11)
card("EXEMPLAR", "pku-inference", dir="instance-to-concept",
     f="Two parents with normal phenotypes have a child with PKU. What does this indicate about the PKU allele?",
     b="The PKU allele is recessive, and each normal parent must have contributed a recessive allele, so both parents are likely carriers.",
     ex="The question uses an affected child to reveal a recessive inheritance pattern.", rel=True, d=3, src=PEARSON)
card("EXEMPLAR", "pku-inference", dir="concept-to-instance",
     f="What kind of family observation supports recessive inheritance for a disorder?",
     b="Two unaffected parents producing an affected child supports recessive inheritance because both parents can be heterozygous carriers.",
     ex="The supplied PKU question is this pattern.", rel=True, d=3, src=PEARSON)
card("COMPARISON", "dominant-vs-recessive-disorder", ax="which allele combination produces the phenotype",
     f="How do dominant and recessive disorders differ in who is expected to show the phenotype?",
     b="A dominant disorder can appear with one disease allele, whereas a recessive disorder usually appears only with two disease alleles.",
     ex="Achondroplasia is shown as dominant; albinism is shown as recessive.", rel=True, d=3, src=T11)
card("CONCEPTUAL", "dominant-not-common",
     f="Why does a dominant harmful allele not have to be common in a population?",
     b="Dominance describes phenotype expression, not population frequency. Harmful dominant alleles can remain rare because they may reduce survival or reproduction.",
     ex="The source contrasts dominant achondroplasia with late-onset Huntington's disease.", d=4, src=OUTLINE)
card("EXEMPLAR", "huntington", dir="instance-to-concept",
     f="Why can Huntington's disease persist even though it is caused by a dominant allele?",
     b="Its symptoms often begin after reproductive age, so an affected person may pass the allele on before knowing they have the disease.",
     ex="The textbook describes onset around ages 35 to 45.", rel=True, d=3, src=T11)
card("EXEMPLAR", "huntington", dir="concept-to-instance",
     f="Which disease in the supplied sources illustrates a late-onset lethal dominant allele?",
     b="Huntington's disease illustrates a dominant allele whose severe effects can begin after a person has reproduced.",
     ex="A child of an affected heterozygous parent has a 50% chance of inheriting the allele.", rel=True, d=2, src=T11)

# ── 5. sex-linked inheritance and X inactivation ──────────────────────────
card("FREE_RECALL", "x-linked-patterns", f="BLURT: X-linked recessive inheritance. 4 things to hit.", n=4,
     items=[
         "An X-linked gene is located on the X chromosome rather than an autosome.",
         "A male has one X chromosome, so one recessive X-linked allele can produce the phenotype.",
         "A male parent passes his X chromosome to daughters and his Y chromosome to sons.",
         "A female usually needs two recessive X-linked alleles to express a recessive X-linked phenotype.",
     ], ex="The color-blindness crosses in Figure 12.7 show these transmission patterns.", d=4, src=T12)
card("CLOZE", "sex-linked", cp="definition",
     cz="A sex-linked gene is {{c1::a gene located on a sex chromosome, usually discussed as an X-linked or Y-linked gene}}.",
     ex="The source focuses on X-linked genes because the X chromosome has many more genes than the Y chromosome.", d=2, src=T12)
card("CONCEPTUAL", "male-x-linked-risk",
     f="Why are X-linked recessive disorders more common in males than in females?",
     b="Males have only one X chromosome, so a single recessive allele on that X is expressed. Females usually need a recessive allele on both X chromosomes.",
     ex="Red-green color blindness and Duchenne muscular dystrophy are source examples.", d=4, src=T12)
card("COMPARISON", "x-parent-transmission", ax="which sex chromosome each parent transmits",
     f="How do male and female parents transmit X-linked alleles to children?",
     b="A male parent passes his X chromosome to all daughters and none of his sons, while a female parent can pass either X chromosome to children of either sex.",
     ex="A father passes a Y chromosome, not an X chromosome, to a son.", rel=True, d=4, src=T12)
card("EXEMPLAR", "colorblind-son", dir="instance-to-concept",
     f="Two parents have normal color vision but have a color-blind son. What must the parents' genotypes be?",
     b="The father is XᴺY and the mother is XᴺXⁿ, so the mother is a carrier who passed Xⁿ to her son.",
     ex="A son receives his Y chromosome from his father and his only X chromosome from his mother.", rel=True, d=4, src=PEARSON)
card("EXEMPLAR", "colorblind-son", dir="concept-to-instance",
     f="What family pattern could reveal that a woman is a carrier for an X-linked recessive trait?",
     b="A phenotypically normal woman who has an affected son with a phenotypically normal father must have passed the recessive X-linked allele to that son.",
     ex="The Pearson color-blindness question uses this pattern.", rel=True, d=4, src=PEARSON)
card("APPLICATION", "x-linked-cross",
     f="A carrier for red-green color blindness mates with a male who has normal color vision. What is the chance that a son will be color-blind?",
     b="The chance is one-half because each son receives Y from his father and has a 50% chance of receiving the recessive X-linked allele from his carrier mother.",
     ex="The same cross gives each daughter a 50% chance of being a carrier.", d=4, src=T12)
card("CONCEPTUAL", "sex-determination",
     f="In the mammalian X-Y system, why does a sperm cell determine whether an XX or XY zygote forms?",
     b="Every egg carries an X chromosome, while sperm carry either X or Y. An X-bearing sperm produces an XX zygote and a Y-bearing sperm produces an XY zygote.",
     ex="The source notes that sex development involves genes and developmental pathways, not only a simple binary label.", d=3, src=T12)
card("CLOZE", "x-inactivation", cp="definition",
     cz="X inactivation is {{c1::the early embryonic silencing of most genes on one X chromosome in each female mammal cell}}.",
     ex="The inactive X condenses into a Barr body.", d=3, src=T12)
card("CONCEPTUAL", "x-inactivation-mosaic",
     f="Why can a heterozygous female for an X-linked trait be a mosaic of two cell populations?",
     b="Each embryonic cell randomly inactivates one X chromosome, and its descendants keep that choice, so some cell lineages express one allele and others express the alternate allele.",
     ex="The tortoiseshell cat figure shows orange patches and black patches produced by different active X chromosomes.", d=4, src=T12)
card("EXEMPLAR", "tortoiseshell", dir="instance-to-concept",
     f="Why does a female tortoiseshell cat have orange and black fur patches?",
     b="Random X inactivation leaves the orange-fur allele active in some cell lineages and the black-fur allele active in others, producing a mosaic coat.",
     ex="The color pattern is a visible consequence of X inactivation during embryonic development.", rel=True, d=4, src=T12)
card("EXEMPLAR", "tortoiseshell", dir="concept-to-instance",
     f="Which textbook example shows how random X inactivation can create a visible mosaic phenotype?",
     b="A female tortoiseshell cat shows mosaic orange and black fur patches because different cell populations have different active X chromosomes.",
     ex="Figure 12.8 tracks the process from an early embryo to adult cell populations.", rel=True, d=3, src=T12)
