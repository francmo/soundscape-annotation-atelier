#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera il vocabolario controllato come file JSON-LD (SKOS) in public/vocab/.

Sorgenti, src/data/taxonomies.json (copia sincronizzata dalla skill) e
src/data/notationSigns.json (repertorio originale dei segni di notazione). Per
ogni tassonomia un ConceptScheme, per ogni gruppo e per ogni termine un Concept,
più lo schema `notation` (una categoria per gruppo, un segno per concetto) e
index.json con l'elenco completo. Gli URI seguono la base
https://atelier.francescomariano.art/vocab/<id>, dove <id> è il termId
dell'Atelier (es. schaeffer.massa.tonica) o `notation.<signId>` per i segni
(es. notation.tipologia.impulso); su Vercel il rewrite /vocab/:id serve il file
/vocab/:id.json. I file sono deterministici (stesso input, stesso output).

Uso: python3 scripts/build_vocab.py [--base URL] [--check]
"""
import argparse
import json
import os
import shutil
import sys
import tempfile
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "data", "taxonomies.json")
SRC_NOTATION = os.path.join(ROOT, "src", "data", "notationSigns.json")
OUT = os.path.join(ROOT, "public", "vocab")
LICENSE = "https://creativecommons.org/licenses/by/4.0/"

CONTEXT = {
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "dct": "http://purl.org/dc/terms/",
    "prefLabel": {"@id": "skos:prefLabel", "@container": "@language"},
    "definition": {"@id": "skos:definition", "@container": "@language"},
    "notation": "skos:notation",
    "inScheme": {"@id": "skos:inScheme", "@type": "@id"},
    "broader": {"@id": "skos:broader", "@type": "@id"},
    "narrower": {"@id": "skos:narrower", "@type": "@id", "@container": "@set"},
    "hasTopConcept": {"@id": "skos:hasTopConcept", "@type": "@id", "@container": "@set"},
    "topConceptOf": {"@id": "skos:topConceptOf", "@type": "@id"},
    "source": "dct:source",
    "bibliographicCitation": "dct:bibliographicCitation",
    "license": {"@id": "dct:license", "@type": "@id"},
}


def nfc(s):
    return unicodedata.normalize("NFC", s or "")


def labels(obj, it="label_it", en="label_en"):
    return {"it": nfc(obj.get(it)), "en": nfc(obj.get(en))}


def write(out, path, data):
    with open(os.path.join(out, path), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=False)
        f.write("\n")


def notation_as_taxonomy(notation):
    """Riporta il repertorio di notazione alla forma tassonomia/gruppi/termini."""
    by_cat = {c["id"]: [] for c in notation["categories"]}
    for sign in notation["signs"]:
        by_cat[sign["category"]].append({
            "id": "notation." + sign["id"],
            "label_it": sign["name"], "label_en": sign["name_en"],
            "desc_it": sign["description"], "desc_en": sign["description_en"],
        })
    return {
        "id": "notation",
        "label_it": "Notazione spettromorfologica", "label_en": "Spectromorphological notation",
        "source": notation.get("source"),
        "reference": "Thoresen, L., Hedman, A. (2007). Spectromorphological analysis of sound objects. Organised Sound, 12(2), 129-141; Schaeffer, P. (1966). Traité des objets musicaux.",
        "groups": [
            {"id": cat["id"], "label_it": cat["label_it"], "label_en": cat["label_en"], "terms": by_cat[cat["id"]]}
            for cat in notation["categories"]
        ],
    }


def build(out, base):
    data = json.load(open(SRC, encoding="utf-8"))
    notation = json.load(open(SRC_NOTATION, encoding="utf-8"))
    os.makedirs(out)

    index = {"@context": CONTEXT, "@id": base, "schemaVersion": data.get("schemaVersion"),
             "generatedFrom": "src/data/taxonomies.json " + str(data.get("generatedAt")) + ", src/data/notationSigns.json",
             "license": LICENSE, "schemes": [], "concepts": []}
    n_terms = 0
    for tax in data["taxonomies"] + [notation_as_taxonomy(notation)]:
        tax_uri = base + tax["id"]
        scheme = {"@context": CONTEXT, "@id": tax_uri, "@type": "skos:ConceptScheme",
                  "notation": tax["id"], "prefLabel": labels(tax),
                  "source": nfc(tax.get("source")), "bibliographicCitation": nfc(tax.get("reference")),
                  "license": LICENSE, "hasTopConcept": []}
        for group in tax["groups"]:
            group_id = f"{tax['id']}.{group['id']}"
            group_uri = base + group_id
            scheme["hasTopConcept"].append(group_uri)
            concept_group = {"@context": CONTEXT, "@id": group_uri, "@type": "skos:Concept",
                             "notation": group_id, "prefLabel": labels(group),
                             "inScheme": tax_uri, "topConceptOf": tax_uri, "narrower": []}
            for term in group["terms"]:
                # I termId delle tassonomie portano già il prefisso della tassonomia
                # (schaeffer.massa.tonica); quelli della notazione lo ricevono sopra.
                term_uri = base + term["id"]
                concept_group["narrower"].append(term_uri)
                concept = {"@context": CONTEXT, "@id": term_uri, "@type": "skos:Concept",
                           "notation": term["id"], "prefLabel": labels(term),
                           "definition": {"it": nfc(term.get("desc_it")), "en": nfc(term.get("desc_en"))},
                           "broader": group_uri, "inScheme": tax_uri}
                write(out, term["id"] + ".json", concept)
                index["concepts"].append({"@id": term_uri, "notation": term["id"], "prefLabel": labels(term),
                                          "broader": group_uri, "inScheme": tax_uri})
                n_terms += 1
            write(out, group_id + ".json", concept_group)
        write(out, tax["id"] + ".json", scheme)
        index["schemes"].append({"@id": tax_uri, "notation": tax["id"], "prefLabel": labels(tax)})
    write(out, "index.json", index)
    return len(index["schemes"]), n_terms


def snapshot(folder):
    if not os.path.isdir(folder):
        return {}
    return {name: open(os.path.join(folder, name), encoding="utf-8").read() for name in sorted(os.listdir(folder))}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://atelier.francescomariano.art/vocab/")
    ap.add_argument("--check", action="store_true",
                    help="non scrive, esce con 1 se public/vocab/ non corrisponde alle sorgenti")
    args = ap.parse_args()
    base = args.base if args.base.endswith("/") else args.base + "/"

    if args.check:
        with tempfile.TemporaryDirectory() as tmp:
            fresh = os.path.join(tmp, "vocab")
            build(fresh, base)
            current, expected = snapshot(OUT), snapshot(fresh)
        changed = sorted(k for k in set(current) | set(expected) if current.get(k) != expected.get(k))
        if changed:
            print(f"public/vocab/ non aggiornato, {len(changed)} file diversi (rigenera con npm run vocab):")
            for k in changed[:10]:
                print("  -", k)
            return 1
        print(f"public/vocab/ allineato alle sorgenti ({len(expected)} file)")
        return 0

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    n_schemes, n_terms = build(OUT, base)
    print(f"vocabolario scritto in {OUT}: {n_schemes} schemi, {n_terms} termini, {len(os.listdir(OUT))} file")
    return 0


if __name__ == "__main__":
    sys.exit(main())
