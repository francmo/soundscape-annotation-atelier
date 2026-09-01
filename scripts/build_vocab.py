#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera il vocabolario controllato come file JSON-LD (SKOS) in public/vocab/.

Sorgente, src/data/taxonomies.json (copia sincronizzata dalla skill). Per ogni
tassonomia un ConceptScheme, per ogni gruppo e per ogni termine un Concept, più
index.json con l'elenco completo. Gli URI seguono la base
https://atelier.francescomariano.art/vocab/<id>, dove <id> è il termId dell'Atelier
(es. schaeffer.massa.tonica); su Vercel il rewrite /vocab/:id serve il file
/vocab/:id.json. I file sono deterministici (stesso input, stesso output).

Uso: python3 scripts/build_vocab.py [--base URL]
"""
import argparse
import json
import os
import shutil
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "data", "taxonomies.json")
OUT = os.path.join(ROOT, "public", "vocab")

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
}


def nfc(s):
    return unicodedata.normalize("NFC", s or "")


def labels(obj):
    return {"it": nfc(obj.get("label_it")), "en": nfc(obj.get("label_en"))}


def write(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=False)
        f.write("\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://atelier.francescomariano.art/vocab/")
    args = ap.parse_args()
    base = args.base if args.base.endswith("/") else args.base + "/"
    data = json.load(open(SRC, encoding="utf-8"))
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    index = {"@context": CONTEXT, "@id": base, "schemaVersion": data.get("schemaVersion"),
             "generatedFrom": "src/data/taxonomies.json " + str(data.get("generatedAt")),
             "schemes": [], "concepts": []}
    n_terms = 0
    for tax in data["taxonomies"]:
        tax_uri = base + tax["id"]
        scheme = {"@context": CONTEXT, "@id": tax_uri, "@type": "skos:ConceptScheme",
                  "notation": tax["id"], "prefLabel": labels(tax),
                  "source": nfc(tax.get("source")), "bibliographicCitation": nfc(tax.get("reference")),
                  "hasTopConcept": []}
        for group in tax["groups"]:
            group_id = f"{tax['id']}.{group['id']}"
            group_uri = base + group_id
            scheme["hasTopConcept"].append(group_uri)
            concept_group = {"@context": CONTEXT, "@id": group_uri, "@type": "skos:Concept",
                             "notation": group_id, "prefLabel": labels(group),
                             "inScheme": tax_uri, "topConceptOf": tax_uri, "narrower": []}
            for term in group["terms"]:
                term_uri = base + term["id"]
                concept_group["narrower"].append(term_uri)
                concept = {"@context": CONTEXT, "@id": term_uri, "@type": "skos:Concept",
                           "notation": term["id"], "prefLabel": labels(term),
                           "definition": {"it": nfc(term.get("desc_it")), "en": nfc(term.get("desc_en"))},
                           "broader": group_uri, "inScheme": tax_uri}
                write(os.path.join(OUT, term["id"] + ".json"), concept)
                index["concepts"].append({"@id": term_uri, "notation": term["id"], "prefLabel": labels(term),
                                          "broader": group_uri, "inScheme": tax_uri})
                n_terms += 1
            write(os.path.join(OUT, group_id + ".json"), concept_group)
        write(os.path.join(OUT, tax["id"] + ".json"), scheme)
        index["schemes"].append({"@id": tax_uri, "notation": tax["id"], "prefLabel": labels(tax)})
    write(os.path.join(OUT, "index.json"), index)
    print(f"vocabolario scritto in {OUT}: {len(index['schemes'])} schemi, {n_terms} termini, {len(os.listdir(OUT))} file")


if __name__ == "__main__":
    main()
