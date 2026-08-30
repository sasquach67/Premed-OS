"""BIOL 103 Lesson 2 card records for the flashcards-v1 reference writer."""
from pathlib import Path
import re

CARDS = []
SOURCE = Path(__file__).with_name("BIOL103-Lesson2-cards.md")

def card(**k): CARDS.append(k)

def full_claim(value):
    value = value.strip()
    if re.search(r"\b(is|are|was|were|has|have|had|does|do|did|can|could|will|would|should|must|means|mean|starts|binds|joins|grows|ends|forms|carries|translates|applies)\b", value, re.I):
        return value
    return "The answer is: " + value[0].lower() + value[1:]

def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

for number, block in enumerate(re.split(r"(?=^### \d+\. )", SOURCE.read_text(), flags=re.M)[1:], 1):
    header = block.splitlines()[0]
    body = "\n".join(block.splitlines()[1:])
    ct = header.split(".", 1)[1].split("·", 1)[0].strip().upper()
    src = header.split("·", 2)[-1].strip()
    cid = f"lesson-2-{number}"
    base = dict(cid=cid, sal="load-bearing", d=3, src=src)
    if ct == "CLOZE":
        cz = re.search(r"(?m)^(.+\{\{c\d+::.+)$", body).group(1)
        clozes = re.findall(r"\{\{c\d+::", cz)
        card(ct="CLOZE", cp="enumerated-list" if len(clozes) > 1 else "definition", lo=False, cz=cz, **base)
    elif ct == "FREE_RECALL":
        front, items = re.search(r"(?ms)^\*\*(BLURT:.+?)\*\*\s*\n\n(.+?)(?=\n\n|\Z)", body).groups()
        entries = [full_claim(item) for item in re.findall(r"(?m)^\d+\.\s+(.+)$", items)]
        card(ct="FREE_RECALL", kind="framework", n=len(entries), f=front, items=entries, **base)
    else:
        f, b = re.search(r"(?ms)^\*\*Q\.\*\*\s*(.+?)\s*\n\*\*A\.\*\*\s*(.+?)(?=\n\n|\Z)", body).groups()
        extras = re.search(r"(?ms)^>\s*(.+?)(?=\n\n|\Z)", body)
        typed = {}
        if ct == "EXEMPLAR": typed["dir"] = "concept-to-instance"
        if ct == "COMPARISON": typed["ax"] = "source-supported contrast"
        if number == 74:  # duplicate of the termination mechanism card
            continue
        card(ct=ct, f=f.strip(), b=full_claim(b.strip()), ex=extras.group(1).strip() if extras else "", **typed, **base)
