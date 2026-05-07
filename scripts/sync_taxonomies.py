#!/usr/bin/env python3
"""
Sync taxonomies between the skill soundscape-audio-analysis
(references/taxonomies.json) and the PWA (src/data/taxonomies.json).

Da v0.4 la skill è la fonte canonica del vocabolario controllato. Default:
import skill -> PWA. La PWA pulla il file ogni volta che la skill viene
aggiornata, e committa il risultato. Il flusso opposto resta disponibile
con --export-to-skill per casi di emergenza (es. modifica rapida lato
PWA da promuovere a canonica).

Esempi:
    # Importa skill -> PWA (default da v0.4)
    python3 scripts/sync_taxonomies.py

    # Esporta PWA -> skill (sovrascrive il file della skill)
    python3 scripts/sync_taxonomies.py --export-to-skill

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
        "--export-to-skill",
        action="store_true",
        help="Esporta taxonomies.json dalla PWA verso la skill (sovrascrive). Da usare solo per promuovere modifiche fatte lato PWA.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Mostra l'azione senza scrivere.")
    args = parser.parse_args()

    if not SKILL_DIR.exists():
        print(f"Skill non trovata in {SKILL_DIR}.")
        print("Verifica che ~/.claude/skills/soundscape-audio-analysis/ esista.")
        return 1

    if args.export_to_skill:
        src, dst = PWA_TAXONOMIES, SKILL_TAXONOMIES
        direction = "PWA -> skill (export)"
    else:
        src, dst = SKILL_TAXONOMIES, PWA_TAXONOMIES
        direction = "skill -> PWA (import, default)"

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
