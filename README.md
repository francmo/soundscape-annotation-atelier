# Soundscape Annotation Atelier

Progressive Web App per l'annotazione di soundscape, field recording e composizione elettroacustica con vocabolario controllato. Oggi 128 termini in otto tassonomie canoniche.

Companion del repo `soundscape-audio-analysis`: l'output JSON v1.0 è compatibile con la pipeline di analisi della skill.

URL deploy: https://soundscape-annotation-atelier.vercel.app/

## Caratteristiche

- Caricamento audio locale (WAV, MP3, FLAC, OGG, M4A), nessun upload sul server.
- Waveform interattiva con Wavesurfer.js, drag selection per range temporali, marker editabili (drag e resize).
- Vocabolario controllato di 128 termini distribuiti in otto tassonomie canoniche:
  - **Schaeffer**, tipo-morfologia (massa, grain, allure, criterio di mantenimento, calibre, profilo dinamico).
  - **Smalley**, spettromorfologia (spectral typology, spectral space, occupancy, motion, growth, behaviour, onset, continuant, termination, surrogacy, gesture e texture).
  - **Schafer**, paesaggio sonoro (keynote/signal/soundmark, Hi-Fi/Lo-Fi, sette bande spettrali).
  - **Krause**, ipotesi della nicchia acustica (biofonia, antropofonia, geofonia, nicchia spettrale e temporale, frequency partitioning).
  - **Chion**, modi di ascolto (causale, semantico, ridotto).
  - **Truax**, comunicazione acustica (listening modes, communication levels).
  - **Westerkamp**, soundwalking (soundwalk, indexical listening, inductive listening, soundscape composition).
  - **Wishart**, sonic art (topologie, continuità, aggregazioni).
- Tab `Struttura` per annotazioni libere su macroforma e note interpretative, mantenute distinte dalle annotazioni controllate (schema separato `structure`).
- Persistenza locale via IndexedDB.
- Esportazione JSON v1.0 deterministica, re-importabile.
- Bilingue IT/EN.
- Bridge Python `scripts/sync_taxonomies.py` per sincronizzare il vocabolario fra PWA e skill `soundscape-audio-analysis`.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- Wavesurfer.js 7 + Regions plugin
- Lucide React per le icone
- i18next + react-i18next + browser-language-detector
- idb (wrapper IndexedDB)

## Sviluppo

```sh
npm install
npm run dev
```

Apri il browser sul port indicato, trascina un file audio sopra la dropzone, seleziona un range sul waveform e scegli un termine dal vocabolario per crearne l'annotazione. Il tab `Struttura` permette di tracciare sezioni libere (apertura, sviluppo, coda, transizioni) con etichetta arbitraria.

## Build

```sh
npm run build
```

Output in `dist/`.

## Sync vocabolari con la skill

```sh
# Esporta il taxonomies.json della PWA verso la skill
python3 scripts/sync_taxonomies.py

# Importa dalla skill (sovrascrive la PWA), quando la skill avra il proprio JSON canonico
python3 scripts/sync_taxonomies.py --import-from-skill

# Anteprima delle azioni
python3 scripts/sync_taxonomies.py --dry-run
```

## Schema annotazione v1.0

Il JSON esportato segue lo schema definito in `src/types/annotation.ts`:

```jsonc
{
  "schemaVersion": "1.0",
  "id": "uuid",
  "audio": {
    "filename": "presque_rien.wav",
    "durationSeconds": 1260.5,
    "sampleRate": 44100,
    "channels": 2
  },
  "metadata": {
    "title": "Presque Rien No. 1",
    "author": "Luc Ferrari",
    "year": 1970,
    "language": "it",
    "startedAt": "2026-05-05T10:30:00Z"
  },
  "annotations": [
    {
      "id": "uuid",
      "startSec": 12.3,
      "endSec": 24.7,
      "taxonomy": "schaeffer",
      "termId": "schaeffer.massa.tonica",
      "termLabel": "Tonica",
      "note": "Voce femminile su drone basso",
      "color": "#a78bfa",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "structure": [
    {
      "id": "uuid",
      "startSec": 0,
      "endSec": 90,
      "label": "Apertura",
      "note": "Esposizione del paesaggio sonoro, transizione lenta verso il drone B"
    }
  ]
}
```

## Roadmap

- v0.2: spectrogram via Wavesurfer plugin, esportazione PDF tipografica, manifest e service worker per installabilità PWA.
- v0.3: import JSON esistente, riapertura progetti salvati, lista progetti.
- v0.4: integrazione con la skill `soundscape-audio-analysis` (consumo del JSON dalla CLI). Skill come fonte canonica del vocabolario.

## Licenza

Codice sotto Apache 2.0. Vocabolari controllati e contenuti documentali sotto CC BY 4.0.
