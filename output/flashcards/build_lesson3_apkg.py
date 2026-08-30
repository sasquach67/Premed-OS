"""Build BIOL103 Lesson 3 as a standalone Anki package with native image occlusion.

This intentionally uses Anki's serialized collection format and the premedOS
models already proven by the Lesson 2 package.  No third-party package is added.
"""
from __future__ import annotations

import hashlib
import html
import json
import random
import re
import sqlite3
import time
import zipfile
from pathlib import Path

from lesson3_cards import CARDS


ROOT = Path(__file__).resolve().parent
OUT = Path("/Users/andyquach/Downloads/BIOL103-Lesson3-Meiosis-Inheritance-complete.apkg")
DB = ROOT / "BIOL103-Lesson3-Meiosis-Inheritance-complete.anki2"
MANIFEST = ROOT / "BIOL103-Lesson3-Meiosis-Inheritance-complete-manifest.json"
REFERENCE_PACKAGE = ROOT / "BIOL103-Lesson2-Transcription-Translation-Protein-Targeting.apkg"
SPEC = "flashcards-v1@aug-2026-visual-conceptual"
TITLE = "UNC::Fall 2026::BIOL103::Lesson 3 — Meiosis & Inheritance"

MID_IO = 1788260000001
MID_BASIC = 1788260000002
MID_CLOZE = 1788260000003
DID_UNC, DID_TERM, DID_COURSE, DID_TOPIC = (1788260000010, 1788260000011,
                                             1788260000012, 1788260000013)

SCREENSHOTS = Path("/var/folders/c1/yrkl287j5hd_lmhrgtzhtgrc0000gn/T/TemporaryItems")
IMG = {
    "meiosis-overview": SCREENSHOTS / "NSIRD_screencaptureui_WtPZGT/Screenshot 2026-08-26 at 10.54.00 AM.png",
    "meiosis-i": SCREENSHOTS / "NSIRD_screencaptureui_evTvaD/Screenshot 2026-08-26 at 10.54.54 AM.png",
    "mendel": SCREENSHOTS / "NSIRD_screencaptureui_XIzqob/Screenshot 2026-08-26 at 10.55.30 AM.png",
    "pedigree": SCREENSHOTS / "NSIRD_screencaptureui_OlnIlf/Screenshot 2026-08-26 at 10.56.17 AM.png",
    "xy": SCREENSHOTS / "NSIRD_screencaptureui_cSNHeB/Screenshot 2026-08-26 at 10.57.07 AM.png",
    "x-linked": SCREENSHOTS / "NSIRD_screencaptureui_82KwaZ/Screenshot 2026-08-26 at 10.57.12 AM.png",
    "x-inactivation": SCREENSHOTS / "NSIRD_screencaptureui_28Bm3B/Screenshot 2026-08-26 at 10.57.16 AM.png",
    "dna-graph": SCREENSHOTS / "NSIRD_screencaptureui_xnNrjc/Screenshot 2026-08-26 at 11.12.20 AM.png",
    "punnett": SCREENSHOTS / "NSIRD_screencaptureui_lI0Ml7/Screenshot 2026-08-26 at 11.13.01 AM.png",
    "pearson-pedigree": SCREENSHOTS / "NSIRD_screencaptureui_aJjuh0/Screenshot 2026-08-26 at 11.13.36 AM.png",
}


def esc(value: str) -> str:
    return html.escape(value).replace("\n", "<br>")


def type_html(card: dict) -> tuple[str, str]:
    name = card["ct"]
    classes = {
        "CLOZE": ("m-say", "say it", "definition" if card.get("cp") == "definition" else "fill in"),
        "CONCEPTUAL": ("m-explain", "explain it", "conceptual"),
        "COMPARISON": ("m-connect", "connect it", "comparison"),
        "EXEMPLAR": ("m-connect", "connect it", "example → concept" if card.get("dir") == "instance-to-concept" else "concept → example"),
        "APPLICATION": ("m-use", "use it", "application"),
        "PROCESS": ("m-explain", "explain it", "process"),
        "FREE_RECALL": ("m-blurt", "blurt it", "free recall"),
    }
    mindset, verb, tname = classes[name]
    return f'<span class="verb">{verb}</span><span class="tname">{tname}</span>', mindset


def blurt(items: list[str]) -> str:
    return "<ol class=\"blurt\">" + "".join(f"<li>{esc(item)}</li>" for item in items) + "</ol>"


ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~"


def guid(seed: str) -> str:
    value = random.Random(seed).getrandbits(64)
    result = ""
    while value:
        value, remainder = divmod(value, len(ALPHABET))
        result = ALPHABET[remainder] + result
    return result or "a"


def checksum(value: str) -> int:
    plain = re.sub(r"<[^>]+>", "", value)
    return int(hashlib.sha1(plain.encode()).hexdigest()[:8], 16)


def deck(did: int, name: str) -> dict:
    return dict(id=did, name=name, mod=int(time.time()), usn=-1, lrnToday=[0, 0],
                revToday=[0, 0], newToday=[0, 0], timeToday=[0, 0], collapsed=False,
                browserCollapsed=False, desc="", dyn=0, conf=1, extendNew=10, extendRev=50)


def source_models() -> dict:
    """Use the supplied Lesson 2 package only for Anki's native IO model.

    The current Lesson 2 collection was opened by Anki 26 and normalized its
    models into separate tables, but its original APKG still carries the stable
    legacy model JSON needed for a hand-authored package.
    """
    with zipfile.ZipFile(REFERENCE_PACKAGE) as package:
        tmp = ROOT / ".lesson3-model-source.anki2"
        tmp.write_bytes(package.read("collection.anki2"))
    con = sqlite3.connect(tmp)
    raw = con.execute("select models from col").fetchone()[0]
    con.close()
    tmp.unlink()
    legacy = json.loads(raw)
    io_model = next(model for model in legacy.values() if model["name"] == "Image Occlusion")
    io_model["id"] = MID_IO
    css = (ROOT / "biol_card-styles.css").read_text()

    def field(name: str, ordinal: int) -> dict:
        return dict(name=name, ord=ordinal, sticky=False, rtl=False, font="Arial", size=20, media=[], description="")

    basic_fields = ["Front", "Back", "Extra", "Type", "Mindset", "premedos_concept_id", "premedos_source", "premedos_spec"]
    cloze_fields = ["Text", "Extra", "Type", "Mindset", "premedos_concept_id", "premedos_source", "premedos_spec"]
    basic = dict(id=MID_BASIC, name="premedOS Basic", type=0, mod=int(time.time()), usn=-1, sortf=0, did=DID_TOPIC,
                 latexPre="", latexPost="", latexsvg=False, flds=[field(name, i) for i, name in enumerate(basic_fields)],
                 tmpls=[dict(name="Card 1", ord=0, did=None, bqfmt="", bafmt="",
                             qfmt='<div class="pm {{Mindset}}"><div class="type">{{Type}}</div>{{Front}}</div>',
                             afmt='<div class="pm {{Mindset}}"><div class="type">{{Type}}</div>{{Front}}<hr id=answer><div class="answer">{{Back}}</div>{{#Extra}}<div class="extra"><span class="extra-label">Extra</span>{{Extra}}</div>{{/Extra}}</div>')],
                 css=css, req=[[0, "any", [0]]], tags=[], vers=[])
    cloze = dict(id=MID_CLOZE, name="premedOS Cloze", type=1, mod=int(time.time()), usn=-1, sortf=0, did=DID_TOPIC,
                 latexPre="", latexPost="", latexsvg=False, flds=[field(name, i) for i, name in enumerate(cloze_fields)],
                 tmpls=[dict(name="Cloze", ord=0, did=None, bqfmt="", bafmt="",
                             qfmt='<div class="pm {{Mindset}}"><div class="type">{{Type}}</div>{{cloze:Text}}</div>',
                             afmt='<div class="pm {{Mindset}}"><div class="type">{{Type}}</div>{{cloze:Text}}{{#Extra}}<div class="extra"><span class="extra-label">Extra</span>{{Extra}}</div>{{/Extra}}</div>')],
                 css=css, req=[[0, "any", [0]]], tags=[], vers=[])
    return {str(MID_IO): io_model, str(MID_BASIC): basic, str(MID_CLOZE): cloze}


def io_notes() -> list[dict]:
    # Rectangles deliberately cover labels/targets on the student-supplied figures.
    # A single c-number can cover a label and its corresponding diagram feature.
    return [
        dict(asset="meiosis-overview", header="Meiosis overview: retrieve the covered event.",
             oc="{{c1::image-occlusion:rect:left=220:top=982:width=170:height=48:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=220:top=1138:width=190:height=54:hideinactive=true}}"),
        dict(asset="meiosis-i", header="Meiosis I: name the covered phase or relationship.",
             oc="{{c1::image-occlusion:rect:left=105:top=177:width=190:height=42:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=425:top=177:width=205:height=42:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=788:top=177:width=190:height=42:hideinactive=true}}"),
        dict(asset="dna-graph", header="DNA-content graph: identify what the covered sample represents.",
             oc="{{c1::image-occlusion:rect:left=194:top=507:width=55:height=45:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=392:top=507:width=55:height=45:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=584:top=507:width=55:height=45:hideinactive=true}}"),
        dict(asset="punnett", header="Punnett square: retrieve the genotype represented by the covered box.",
             oc="{{c1::image-occlusion:rect:left=132:top=120:width=130:height=105:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=262:top=120:width=130:height=105:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=132:top=225:width=130:height=105:hideinactive=true}}"
                "{{c4::image-occlusion:rect:left=262:top=225:width=130:height=105:hideinactive=true}}"),
        dict(asset="mendel", header="Mendel's segregation figure: name the covered generation or genotype pattern.",
             oc="{{c1::image-occlusion:rect:left=495:top=58:width=205:height=45:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=480:top=270:width=190:height=46:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=480:top=530:width=220:height=45:hideinactive=true}}"),
        dict(asset="pedigree", header="Pedigree: retrieve the covered genotype or inference.",
             oc="{{c1::image-occlusion:rect:left=263:top=340:width=50:height=30:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=388:top=340:width=50:height=30:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=338:top=1080:width=90:height=35:hideinactive=true}}"),
        dict(asset="xy", header="Mammalian X-Y system: retrieve the covered gamete or zygote chromosome combination.",
             oc="{{c1::image-occlusion:rect:left=754:top=268:width=80:height=85:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=889:top=268:width=80:height=85:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=750:top=390:width=110:height=90:hideinactive=true}}"),
        dict(asset="x-linked", header="X-linked recessive inheritance: retrieve the covered transmission pattern.",
             oc="{{c1::image-occlusion:rect:left=115:top=1090:width=300:height=70:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=478:top=1090:width=330:height=70:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=850:top=1090:width=330:height=70:hideinactive=true}}"),
        dict(asset="x-inactivation", header="X inactivation: retrieve the covered cell outcome or structure.",
             oc="{{c1::image-occlusion:rect:left=157:top=996:width=170:height=45:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=415:top=1015:width=180:height=45:hideinactive=true}}"),
        dict(asset="pearson-pedigree", header="Dominant-trait pedigree: retrieve the covered genotype inference.",
             oc="{{c1::image-occlusion:rect:left=315:top=70:width=55:height=40:hideinactive=true}}"
                "{{c2::image-occlusion:rect:left=470:top=70:width=55:height=40:hideinactive=true}}"
                "{{c3::image-occlusion:rect:left=345:top=388:width=55:height=38:hideinactive=true}}"),
    ]


def main() -> None:
    if OUT.exists() or DB.exists():
        raise FileExistsError("Refusing to overwrite an existing Lesson 3 build.")
    missing = [f"{name}: {path}" for name, path in IMG.items() if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing supplied image source(s):\n" + "\n".join(missing))

    now_ms = int(time.time() * 1000)
    crt = int(time.time())
    models = source_models()
    decks = {
        "1": deck(1, "Default"),
        str(DID_UNC): deck(DID_UNC, "UNC"),
        str(DID_TERM): deck(DID_TERM, "UNC::Fall 2026"),
        str(DID_COURSE): deck(DID_COURSE, "UNC::Fall 2026::BIOL103"),
        str(DID_TOPIC): deck(DID_TOPIC, TITLE),
    }
    decks[str(DID_TOPIC)]["desc"] = (
        "Generated by premedOS · spec flashcards-v1@aug-2026-visual-conceptual · "
        "source mode SOURCE_ONLY. Built from your Lesson 3 GRQ, class outline, textbook "
        "figures, and Pearson practice. Includes native Image Occlusion cards. Review and "
        "scheduling live here in Anki; premedOS never reads this deck back."
    )
    dconf = {"1": dict(id=1, name="Default", mod=0, usn=0, maxTaken=60, autoplay=True,
                         timer=0, replayq=True,
                         new=dict(bury=False, delays=[1.0, 10.0], initialFactor=2500, ints=[1, 4, 0], order=1, perDay=25),
                         rev=dict(bury=False, ease4=1.3, ivlFct=1.0, maxIvl=36500, perDay=200, hardFactor=1.2),
                         lapse=dict(delays=[10.0], leechAction=1, leechFails=8, minInt=1, mult=0.0),
                         dyn=False, newMix=0, newPerDayMinimum=0, interdayLearningMix=0, reviewOrder=0)}
    conf = dict(nextPos=1, estTimes=True, activeDecks=[DID_TOPIC], sortType="noteFld", timeLim=0,
                sortBackwards=False, addToCur=True, curDeck=DID_TOPIC, newBury=True, newSpread=0,
                dueCounts=True, curModel=str(MID_BASIC), collapseTime=1200, schedVer=2, dayLearnFirst=False)

    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript("""
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_cid on revlog (cid); CREATE INDEX ix_revlog_usn on revlog (usn); CREATE INDEX ix_notes_csum on notes (csum);
""")
    cur.execute("INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,?)", (crt, now_ms, now_ms, json.dumps(conf), json.dumps(models), json.dumps(decks), json.dumps(dconf), "{}"))

    tags, note_id, card_id, due = set(), now_ms, now_ms + 900000, 1

    def add_note(mid: int, fields: list[str], note_tags: list[str], seed: str, ords: list[int]) -> None:
        nonlocal note_id, card_id, due
        tagstr = " " + " ".join(note_tags) + " "
        tags.update(note_tags)
        joined = "\x1f".join(fields)
        cur.execute("INSERT INTO notes VALUES (?,?,?,?,-1,?,?,?,?,0,'')", (note_id, guid(seed), mid, now_ms // 1000, tagstr, joined, fields[0], checksum(fields[0])))
        for ordinal in ords:
            cur.execute("INSERT INTO cards VALUES (?,?,?,?,?,-1,0,0,?,0,0,0,0,0,0,0,0,'')", (card_id, note_id, DID_TOPIC, ordinal, now_ms // 1000, due))
            card_id += 1
            due += 1
        note_id += 1

    for i, card in enumerate(CARDS, start=1):
        card_type, mindset = type_html(card)
        common = [f"premedos::course::BIOL103", "premedos::topic::lesson-3", f"premedos::type::{card['ct'].lower()}", f"premedos::salience::{card['sal']}", f"premedos::difficulty::{card['d']}", "premedos::scope::source"]
        if card["ct"] in {"COMPARISON", "EXEMPLAR"} or card.get("rel"):
            common.append("premedos::relational")
        if card.get("cp"):
            common.append(f"premedos::mechanism::{card['cp']}")
        if card.get("dir"):
            common.append(f"premedos::exemplar::{card['dir']}")
        concept = f"biol103:lesson-3:{card['cid']}"
        extra = card.get("ex", "")
        if card.get("ax"):
            extra = f"<div class=\"axis\"><b>Axis:</b> {esc(card['ax'])}</div>{esc(extra)}"
        else:
            extra = esc(extra)
        if card["ct"] == "FREE_RECALL":
            fields = [esc(card["f"]), blurt(card["items"]), extra, card_type, mindset, concept, esc(card["src"]), SPEC]
            add_note(MID_BASIC, fields, common, concept + str(i), [0])
        elif card.get("cp"):
            fields = [esc(card["cz"]), extra, card_type, mindset, concept, esc(card["src"]), SPEC]
            ords = [int(x) - 1 for x in sorted(set(re.findall(r"\{\{c(\d+)::", card["cz"])))]
            add_note(MID_CLOZE, fields, common, concept + str(i), ords)
        else:
            fields = [esc(card["f"]), esc(card["b"]), extra, card_type, mindset, concept, esc(card["src"]), SPEC]
            add_note(MID_BASIC, fields, common, concept + str(i), [0])

    io_count = 0
    for i, spec in enumerate(io_notes(), start=1):
        filename = f"lesson3-io-{spec['asset']}.png"
        fields = [spec["oc"], f'<img src="{filename}">', f"<div>{esc(spec['header'])}</div>", "<div>Say the target before revealing it, then explain what it means.</div>", "Source: student-supplied Lesson 3 textbook or Pearson figure."]
        ords = [int(x) - 1 for x in sorted(set(re.findall(r"\{\{c(\d+)::", spec["oc"])))]
        add_note(MID_IO, fields, ["premedos::course::BIOL103", "premedos::topic::lesson-3", "premedos::type::image-occlusion", "premedos::scope::source", "premedos::visual::source-figure"], f"io:{spec['asset']}:{i}", ords)
        io_count += len(ords)

    conf["nextPos"] = due
    cur.execute("UPDATE col SET conf=?, tags=?", (json.dumps(conf), json.dumps({tag: -1 for tag in sorted(tags)})))
    con.commit()
    con.close()

    media = {}
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as package:
        package.write(DB, "collection.anki2")
        for index, (asset, path) in enumerate(IMG.items()):
            media[str(index)] = f"lesson3-io-{asset}.png"
            package.write(path, str(index))
        package.writestr("media", json.dumps(media))

    expected = sum(len(set(re.findall(r"\{\{c(\d+)::", c.get("cz", "")))) if c.get("cp") else 1 for c in CARDS) + io_count
    MANIFEST.write_text(json.dumps({
        "deckTitle": TITLE, "sourceMode": "SOURCE_ONLY", "spec": SPEC,
        "regularNotes": len(CARDS), "imageOcclusionNotes": len(io_notes()),
        "expectedCards": expected, "types": {kind: sum(c["ct"] == kind for c in CARDS) for kind in sorted({c["ct"] for c in CARDS})},
        "visualSourceFiles": [str(path) for path in IMG.values()],
    }, indent=2) + "\n")
    print(f"Wrote {OUT}\nNotes: {len(CARDS) + len(io_notes())}; cards: {expected}; image-occlusion cards: {io_count}")


if __name__ == "__main__":
    main()
