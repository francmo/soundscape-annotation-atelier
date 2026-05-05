#!/usr/bin/env python3
"""
Sync taxonomies between PWA (src/data/taxonomies.json) and the skill
soundscape-audio-analysis (references/taxonomies.json).

Direzione di default: export PWA -> skill, perche la PWA al momento e
la fonte canonica del vocabolario controllato. Quando la skill verra
estesa con un proprio taxonomies.json piu ricco (es. derivato dai
golden_analyses), si potra invertire il flusso con --import-from-skill.

Esempi:
    # Esporta PWA -> skill (default)
    python3 scripts/sync_taxonomies.py

    # Importa skill -> PWA (sovrascrive il file della PWA)
    python3 scripts/sync_taxonomies.py --import-from-skill

    # Mostra solo cosa farebbe, senza scrivere
    python3 scripts/sync_taxonomies.py --dry-run
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PWA_TAXONOMIES = REPO_ROOT / "src" / "data" / "taxonomies.json"
SKILL_DIR = Path.home() / ".claude" / "skills" / "soundscape-audio-analysis"
SKILL_TAXONOMIES = SKILL_DIR / "references" / "taxonomies.json"


def count_terms(path: Path) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    return sum(
        len(group["terms"])
        for tax in data.get("taxonomies", [])
        for group in tax.get("groups", [])
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--import-from-skill",
        action="store_true",
        help="Importa taxonomies.json dalla skill nella PWA (sovrascrive).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Mostra l'azione senza scrivere.")
    args = parser.parse_args()

    if not SKILL_DIR.exists():
        print(f"Skill non trovata in {SKILL_DIR}.")
        print("Verifica che ~/.claude/skills/soundscape-audio-analysis/ esista.")
        return 1

    if args.import_from_skill:
        src, dst = SKILL_TAXONOMIES, PWA_TAXONOMIES
        direction = "skill -> PWA"
    else:
        src, dst = PWA_TAXONOMIES, SKILL_TAXONOMIES
        direction = "PWA -> skill"

    if not src.exists():
        print(f"Sorgente non trovata: {src}")
        return 1

    src_terms = count_terms(src)
    dst_terms = count_terms(dst)

    print(f"Direzione: {direction}")
    print(f"  Sorgente: {src} ({src_terms} termini)")
    print(f"  Destinazione: {dst} ({dst_terms} termini)")

    if args.dry_run:
        print("Dry run: nessuna scrittura.")
        return 0

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"Copiati {src_terms} termini.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
