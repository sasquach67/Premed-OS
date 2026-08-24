"""Build the BIOL 103 Lesson 2 deck with Anki's native Image Occlusion notes.

Run with anki 26.5 available in the active environment. The source markdown is
the authoring record; this writes a fresh, standalone package only.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path
import hashlib
import json
import copy
import tempfile
import zipfile

from anki.collection import Collection
from anki.exporting import AnkiPackageExporter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "BIOL103-Lesson2-cards.md"
OUTPUT = Path("/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-designed.apkg")
TITLE = "UNC::Fall 2026::BIOL103::Lesson 2 — Refined"
SPEC_PATH = ROOT.parent.parent / "premed-hq-documentation/specifications/generation/04-flashcards-v1.md"
REFERENCE = Path("/Users/andyquach/Downloads/PSYC101-Chapter-0-refined.apkg")


def plain(value: str) -> str:
    value = value.strip()
    value = re.sub(r"^\*\*[QA]\.\*\*\s*", "", value)
    return html.escape(value).replace("\n", "<br>")


def style(card_type: str) -> tuple[str, str]:
    kind = card_type.lower()
    if kind == "free_recall": return ('<span class="verb">blurt it</span><span class="tname">free recall</span>', "m-blurt")
    if kind in {"comparison", "exemplar"}: return ('<span class="verb">connect it</span><span class="tname">comparison</span>', "m-connect")
    if kind in {"conceptual", "process"}: return ('<span class="verb">explain it</span><span class="tname">conceptual</span>', "m-explain")
    if kind == "application": return ('<span class="verb">use it</span><span class="tname">application</span>', "m-use")
    return ('<span class="verb">say it</span><span class="tname">recall</span>', "m-say")


def blurt_html(value: str) -> str:
    items = re.findall(r"(?m)^\d+\.\s+(.+)$", value)
    return '<ol class="blurt">' + ''.join(f'<li>{html.escape(item)}</li>' for item in items) + '</ol>'


def add_reference_models(col: Collection) -> tuple[dict, dict]:
    with zipfile.ZipFile(REFERENCE) as package, tempfile.NamedTemporaryFile(suffix=".anki2") as temp:
        temp.write(package.read("collection.anki2")); temp.flush()
        reference = Collection(temp.name)
        basic = copy.deepcopy(reference.models.by_name("premedOS Basic"))
        cloze = copy.deepcopy(reference.models.by_name("premedOS Cloze"))
        reference.close()
    assert basic and cloze
    basic["id"] = 0; cloze["id"] = 0
    col.models.add(basic); col.models.add(cloze)
    return col.models.by_name("premedOS Basic"), col.models.by_name("premedOS Cloze")


def parse_cards() -> list[dict[str, str]]:
    cards: list[dict[str, str]] = []
    blocks = re.split(r"(?=^### \d+\. )", SOURCE.read_text(), flags=re.MULTILINE)[1:]
    for block in blocks:
        header, *rest = block.splitlines()
        body = "\n".join(rest)
        card_type = header.split(".", 1)[1].split("·", 1)[0].strip().upper()
        scope = re.search(r"· `([^`]+)`", header)
        tags = ["premedos::course::BIOL103", "premedos::topic::lesson-2", f"premedos::type::{card_type.lower()}", "premedos::scope::source"]
        if scope:
            tags.append(f"premedos::scope::{scope.group(1)}")

        if card_type == "CLOZE":
            match = re.search(r"(?m)^(.+\{\{c\d+::.+)$", body)
            if not match:
                raise ValueError(f"Missing cloze text: {header}")
            type_html, mindset = style(card_type)
            cards.append({"kind": "cloze", "text": match.group(1), "extra": "", "tags": " ".join(tags), "type": type_html, "mindset": mindset, "source": header})
            continue

        question = re.search(r"(?ms)^\*\*Q\.\*\*\s*(.+?)\s*\n\*\*A\.\*\*\s*(.+?)(?=\n\n|\Z)", body)
        if question:
            type_html, mindset = style(card_type)
            cards.append({"kind": "basic", "front": plain(question.group(1)), "back": plain(question.group(2)), "extra": "", "tags": " ".join(tags), "type": type_html, "mindset": mindset, "source": header})
            continue

        blurt = re.search(r"(?ms)^\*\*(BLURT:.+?)\*\*\s*\n\n(.+?)(?=\n\n|\Z)", body)
        if blurt:
            type_html, mindset = style(card_type)
            cards.append({"kind": "basic", "front": plain(blurt.group(1)), "back": blurt_html(blurt.group(2)), "extra": "", "tags": " ".join(tags), "type": type_html, "mindset": mindset, "source": header})
            continue
        raise ValueError(f"Unrecognised card: {header}")
    return cards


def add_image_occlusion_cards(col: Collection, deck_id: int) -> None:
    col.add_image_occlusion_notetype()
    model = col.models.by_name("Image Occlusion")
    assert model is not None
    col.decks.select(deck_id)

    figures = [
        (
            "f1417_ribosome.png",
            "Ribosome: name the covered tRNA site.",
            "{{c1::image-occlusion:rect:left=226:top=150:width=30:height=30:hideinactive=true}}"
            "{{c1::image-occlusion:rect:left=50:top=136:width=95:height=40:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=261:top=150:width=30:height=30:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=173:top=18:width=172:height=38:hideinactive=true}}"
            "{{c3::image-occlusion:rect:left=298:top=150:width=30:height=30:hideinactive=true}}"
            "{{c3::image-occlusion:rect:left=390:top=118:width=190:height=40:hideinactive=true}}",
        ),
        (
            "f1415_trna.png",
            "tRNA: name the covered working end.",
            "{{c1::image-occlusion:rect:left=110:top=43:width=128:height=42:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=230:top=480:width=92:height=26:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=243:top=398:width=60:height=70:hideinactive=true}}"
            "{{c3::image-occlusion:rect:left=240:top=20:width=26:height=24:hideinactive=true}}",
        ),
        (
            "f1421_srp.png",
            "ER targeting: state the next event.",
            "{{c1::image-occlusion:rect:left=36:top=28:width=148:height=104:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=190:top=28:width=184:height=88:hideinactive=true}}"
            "{{c3::image-occlusion:rect:left=383:top=28:width=264:height=88:hideinactive=true}}"
            "{{c4::image-occlusion:rect:left=660:top=28:width=224:height=106:hideinactive=true}}"
            "{{c5::image-occlusion:rect:left=888:top=28:width=150:height=106:hideinactive=true}}"
            "{{c6::image-occlusion:rect:left=1046:top=28:width=168:height=120:hideinactive=true}}",
        ),
        (
            "f1421_srp.png",
            "ER targeting: name the covered player.",
            "{{c1::image-occlusion:rect:left=158:top=303:width=80:height=45:hideinactive=true}}"
            "{{c2::image-occlusion:rect:left=48:top=378:width=108:height=88:hideinactive=true}}"
            "{{c3::image-occlusion:rect:left=143:top=466:width=76:height=62:hideinactive=true}}"
            "{{c4::image-occlusion:rect:left=216:top=583:width=108:height=42:hideinactive=true}}",
        ),
    ]

    for filename, header, occlusions in figures:
        col.add_image_occlusion_note(
            notetype_id=model["id"],
            image_path=str(ROOT / "figures" / filename),
            occlusions=occlusions,
            header=f"<div>{html.escape(header)}</div>",
            back_extra="<div>Say the label before revealing it.</div>",
            tags=["premedos::course::BIOL103", "premedos::topic::lesson-2", "premedos::type::image-occlusion", "premedos::scope::source"],
        )

    col.set_deck(col.find_cards("note:Image_Occlusion"), deck_id)


def main() -> None:
    collection_path = ROOT / "BIOL103-Lesson2-concise-IO.anki2"
    if collection_path.exists():
        raise FileExistsError(f"Refusing to overwrite existing build collection: {collection_path}")
    if OUTPUT.exists():
        raise FileExistsError(f"Refusing to overwrite existing package: {OUTPUT}")
    col = Collection(str(collection_path))
    deck_id = col.decks.id(TITLE)
    deck = col.decks.get(deck_id)
    deck["desc"] = "Generated by premedOS · spec flashcards-v1@aug-2026-relate-revision · preset premedos-default · source mode SOURCE_ONLY. Built only from your supplied BIOL 103 Lesson 2 material. This export includes native Image Occlusion cards and requires Anki 23.10+. Review and scheduling live here in Anki; premedOS never reads this deck back."
    col.decks.save(deck)
    basic, cloze = add_reference_models(col)
    assert basic is not None and cloze is not None

    for card in parse_cards():
        model = cloze if card["kind"] == "cloze" else basic
        note = col.new_note(model)
        if card["kind"] == "cloze":
            note["Text"] = card["text"]
            note["Extra"] = card["extra"]
        else:
            note["Front"] = card["front"]
            note["Back"] = card["back"]
            note["Extra"] = card["extra"]
        note["Type"] = card["type"]
        note["Mindset"] = card["mindset"]
        note["premedos_concept_id"] = f"biol103:lesson-2:{len(col.find_notes('')) + 1}"
        note["premedos_source"] = card["source"]
        note["premedos_spec"] = "flashcards-v1@aug-2026-relate-revision"
        note.tags = card["tags"].split()
        col.add_note(note, deck_id)

    add_image_occlusion_cards(col, deck_id)
    spec_hash = hashlib.sha256(SPEC_PATH.read_bytes()).hexdigest()[:12]
    (ROOT / "BIOL103-Lesson2-v1-manifest.json").write_text(json.dumps({
        "specId": "flashcards-v1", "specHash": spec_hash, "sourceMode": "SOURCE_ONLY",
        "deckTitle": TITLE, "course": "BIOL103", "topic": "Lesson 2",
        "noteTypes": ["Basic", "Cloze", "Image Occlusion"],
        "imageOcclusionRequires": "Anki 23.10+", "cards": len(col.find_cards("")),
    }, indent=2) + "\n")
    col.close()

    col = Collection(str(collection_path))
    exporter = AnkiPackageExporter(col)
    exporter.exportInto(str(OUTPUT))
    col.close()
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    sys.exit(main())
