# Soundscape Annotation Atelier

Progressive Web App per l'annotazione di soundscape, field recording e composizione elettroacustica con vocabolario controllato. Oggi 128 termini in otto tassonomie canoniche.

Companion del repo `soundscape-audio-analysis`: l'output JSON v1.0 è compatibile con la pipeline di analisi della skill.

URL deploy: https://soundscape-annotation-atelier.vercel.app/

## Caratteristiche

- Caricamento audio locale, nessun upload sul server. Formati garantiti: WAV, MP3, FLAC, OGG. Formati condizionati al codec del browser: M4A/AAC (alcuni file `.m4a` da iPhone Memo Vocali con codec HE-AAC possono fallire la decodifica; in quel caso un banner ambrato segnala il problema e invita a convertire il file in WAV o MP3 con un convertitore online come cloudconvert.com).
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
- Esportazione IIIF Presentation API 3.0 (dalla v2.1.0), vedi sotto.

## Export IIIF (Presentation API 3.0)

Dalla v2.1.0 un progetto si esporta anche come Manifest IIIF Presentation 3 (bottone `Esporta IIIF`, funzione pura `buildIiifManifest` in `src/lib/iiifExporter.ts`). Mappatura:

- la registrazione diventa un `Canvas` con la sola `duration`, dipinto da una risorsa `Sound` all'URL pubblico indicato nella finestra di export (l'Atelier non carica audio, l'hosting resta a chi pubblica);
- ogni annotazione controllata diventa una Web Annotation con motivazione `tagging` (più `commenting` se c'è la nota), un `TextualBody` con termine e tassonomia, una `SpecificResource` con `purpose: classifying` verso l'URI del termine nel vocabolario, e target sul canvas con frammento temporale `#t=inizio,fine`;
- gli strati diventano `AnnotationPage` distinte, le sezioni di struttura diventano `Range` in `structures`, i segni di notazione diventano annotazioni `describing`; le relazioni non vengono esportate.

Il vocabolario controllato è pubblicato come SKOS in JSON-LD sotto `https://atelier.francescomariano.art/vocab/` (un file per termine, gruppo e tassonomia, più `index.json`), generato da `npm run vocab` (`scripts/build_vocab.py`) a partire da `src/data/taxonomies.json`.

Una demo pubblicata sta in `public/iiif/demo/` (progetto sintetico sull'audio pubblico dei fixture IIIF, manifest generato dall'exporter e verificato dal test golden `src/lib/iiifExporter.demo.test.ts`; `npm run demo:iiif` lo rigenera). Il manifest passa il validatore IIIF Presentation 3.0 e si apre nei viewer che supportano i canvas audio, ad esempio https://theseusviewer.org/?iiif-content=https://atelier.francescomariano.art/iiif/demo/manifest.json

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

Da v0.4 la skill `soundscape-audio-analysis` è la fonte canonica del vocabolario controllato. La PWA pulla il file `references/taxonomies.json` della skill ogni volta che viene aggiornato, e committa il risultato.

```sh
# Importa dalla skill (default da v0.4)
python3 scripts/sync_taxonomies.py

# Esporta dalla PWA verso la skill, da usare solo per promuovere modifiche fatte lato PWA
python3 scripts/sync_taxonomies.py --export-to-skill

# Anteprima delle azioni
python3 scripts/sync_taxonomies.py --dry-run
```

### Annotazioni con `termId` orfani

Se la skill aggiunge o rimuove termini dal vocabolario, le annotazioni esistenti che facevano riferimento a un termId rimosso restano valide ma compaiono nel pannello con un badge ambrato `Termine non più nel vocabolario`. Un banner di sintesi in cima al tab `Annotazioni` riporta il numero totale di orfani. Le annotazioni non vengono cancellate né riassegnate automaticamente: la riconciliazione resta una decisione editoriale.

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

- ✅ v0.1: MVP, vocabolario controllato, persistenza, export JSON.
- ✅ v0.2: tassonomie a 128 termini, tab Struttura, bridge skill, export PDF tipografico, spettrogramma toggle, service worker e manifest (PWA installabile offline-first).
- ✅ v0.3: lista progetti salvati con riapertura, eliminazione, import JSON v1.0 con riconciliazione audio.
- ✅ v0.4: skill come fonte canonica del vocabolario (default sync `skill -> PWA`), validazione `termId` orfani con badge nel pannello e banner di sintesi.
- v0.5: consumo lato skill delle annotazioni JSON v1.0 nel report PDF (confronto annotazione first-hand vs predizioni PANNs/CLAP, metriche di accordo).

## Citation

Questa PWA è il companion del methodology paper del progetto
Soundscape Annotation. Per citarla in un lavoro derivato:

> Mariano, F. (2026). *Soundscape Annotation: workflow iterativo,
> stratificazione interpretativa e calibrazione di una skill di
> analisi audio in didattica AFAM*. Working Paper v1.0. Accademia
> di Belle Arti di Macerata.
> https://doi.org/10.5281/zenodo.20282496

Vedi il README della skill `soundscape-audio-analysis`
(https://github.com/francmo/soundscape-audio-analysis)
per la citazione BibTeX completa.

## Licenza

Codice sotto Apache 2.0. Vocabolari controllati e contenuti documentali sotto CC BY 4.0.
