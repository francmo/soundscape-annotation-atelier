# Soundscape Annotation Atelier

Progressive Web App per l'annotazione first-hand di soundscape, field recording e composizione elettroacustica con vocabolario controllato (128 termini in otto tassonomie canoniche), strati sincronici, notazione spettromorfologica originale e relazioni form-building, sul modello dell'Aural Sonology.

Companion del repo `soundscape-audio-analysis`: il JSON esportato (schema 1.0) è compatibile con la pipeline di analisi della skill, che lo arricchisce e lo confronta con la propria lettura automatica (`soundscape compare`).

URL: https://atelier.francescomariano.art/ (alias https://soundscape-annotation-atelier.vercel.app/)

## Caratteristiche

- Caricamento audio locale, nessun upload sul server. Formati garantiti: WAV, MP3, FLAC, OGG. Formati condizionati al codec del browser: M4A/AAC (alcuni file `.m4a` da iPhone Memo Vocali con codec HE-AAC possono fallire la decodifica; in quel caso un banner ambrato segnala il problema e invita a convertire il file in WAV o MP3 con un convertitore online come cloudconvert.com).
- Waveform interattiva con Wavesurfer.js, drag selection per range temporali, marker editabili (drag e resize), spettrogramma a scala mel.
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
- Strati sincronici (Fase 2 dell'Aural Sonology): le annotazioni si assegnano a strati sovrapposti (primo piano, sfondo, sorgenti simultanee), anche promuovendo gli strati suggeriti dalla skill.
- Notazione spettromorfologica (Fase 3): corsia sotto il waveform con 15 segni originali in sei famiglie (tipologia e mantenimento, massa, profilo dinamico, profilo di massa, grana e allure, moto), piazzati a click o trascinati dalla palette, con una bozza di partitura proposta dall'analisi della skill. I glifi sono forme geometriche disegnate per questo progetto, non i segni di Thoresen e Hedman né il font Sonova.
- Relazioni form-building (Fase 4): archi fra annotazioni, sezioni, strati e segni con un tipo di relazione formale.
- Persistenza locale via IndexedDB con salvataggio automatico e ripristino dell'ultimo progetto aperto. Non è un backup: il backup reale è l'export JSON più l'audio originale.
- Esportazione JSON (schema 1.0) deterministica e re-importabile, esportazione PDF tipografica, esportazione IIIF Presentation API 3.0 (dalla v2.1.0, vedi sotto).
- Bilingue IT/EN, installabile come PWA, funziona offline.
- Bridge Python `scripts/sync_taxonomies.py` per sincronizzare il vocabolario fra PWA e skill `soundscape-audio-analysis`.

## Export IIIF (Presentation API 3.0)

Un progetto si esporta anche come Manifest IIIF Presentation 3 (bottone `Esporta IIIF`, funzione pura `buildIiifManifest` in `src/lib/iiifExporter.ts`, coperta dai test in `src/lib/iiifExporter.test.ts`).

### Che cosa contiene il manifest

- La registrazione diventa un `Canvas` con la sola `duration`, dipinto da una risorsa `Sound` all'URL pubblico indicato nella finestra di export. L'Atelier non carica audio, l'hosting resta a chi pubblica.
- Ogni annotazione controllata diventa una Web Annotation con motivazione `tagging` (più `commenting` se c'è la nota): un `TextualBody` con termine, tassonomia e gruppo nella lingua di annotazione, una `SpecificResource` con `purpose: classifying` verso l'URI del termine nel vocabolario SKOS, e il target sul canvas con frammento temporale `#t=inizio,fine` (Media Fragments URI). Le date `created` e `modified` sono quelle dell'annotazione.
- Gli strati diventano `AnnotationPage` distinte (una pagina per strato, più una pagina di default per le annotazioni senza strato); le sezioni di struttura diventano `Range` in `structures`, con l'item `Canvas` e il frammento `t=` sull'id come nelle ricette 0026 e 0064 del Cookbook; i segni di notazione diventano annotazioni `describing` con l'URI del segno nello schema `notation` del vocabolario. Le relazioni non vengono esportate (il loro target sarebbe un'altra annotazione, non il canvas).
- `metadata` bilingue (fonte, vocabolario in uso letto dai dati, lingua di annotazione, data di inizio, genere); i valori senza lingua usano la chiave `none`. `seeAlso` punta all'indice del vocabolario SKOS e, se indicato, al JSON dell'Atelier pubblicato accanto al manifest.
- Nessun dato personale: annotatore e autore restano nel JSON dell'Atelier e non entrano nel manifest.

Regole di robustezza applicate all'export:

- i frammenti temporali stanno sempre dentro `[0, duration]` (la specifica vieta contenuti fuori dalle dimensioni del canvas) e un intervallo di durata zero, o con la fine prima dell'inizio, diventa un punto `#t=inizio`;
- gli identificatori entrano negli URI con percent-encoding dei soli caratteri vietati, lasciando intatti i caratteri non ASCII, così l'URI del termine coincide con l'`@id` del vocabolario (`schaeffer.massa.cannelée`);
- un termine non più presente nel vocabolario mantiene l'etichetta nel `TextualBody` ma non riceve un URI `classifying` che non risolverebbe;
- un progetto senza durata audio valida non si esporta (la finestra lo segnala), e gli URI di base devono essere assoluti `http(s)` senza frammento `#`.

### Pubblicare e consumare un manifest

1. Nella finestra di export imposta l'URI base dove pubblicherai il manifest (l'`id` del manifest sarà `<base>/manifest.json`, quello del canvas `<base>/canvas/1`) e l'URL pubblico dell'audio. La base del vocabolario resta quella dell'Atelier, a meno di ospitare una copia del vocabolario altrove.
2. Pubblica `manifest.json` e l'audio su HTTPS con intestazione `Access-Control-Allow-Origin` (i viewer li leggono da un altro dominio). Se pubblichi anche il JSON dell'Atelier accanto al manifest, il `seeAlso` lo collega.
3. Verifica il file con il validatore ufficiale, https://presentation-validator.iiif.io/ (versione 3.0), e aprilo in un viewer con supporto ai canvas audio, ad esempio Theseus: `https://theseusviewer.org/?iiif-content=<URL del manifest>`.

Per consumare il manifest da codice: le annotazioni stanno in `items[0].annotations[*].items`, ognuna con `target` (`<canvas>#t=inizio,fine`) e `body` come array di corpi con `purpose` `tagging`, `classifying` o `commenting`; il `source` del corpo `classifying` è un URI del vocabolario che restituisce JSON-LD (SKOS) con etichette e definizioni in italiano e inglese; le sezioni stanno in `structures[0].items`; `seeAlso[0]` è l'indice del vocabolario.

### Demo pubblicata

Una demo sta in `public/iiif/demo/` (progetto sintetico sull'audio pubblico dei fixture IIIF, manifest generato dall'exporter e verificato dal test golden `src/lib/iiifExporter.demo.test.ts`; `npm run demo:iiif` lo rigenera dopo una modifica all'exporter). Il manifest passa il validatore IIIF Presentation 3.0 senza errori né avvisi.

- Manifest: https://atelier.francescomariano.art/iiif/demo/manifest.json
- JSON dell'Atelier: https://atelier.francescomariano.art/iiif/demo/project.annotation.json
- In Theseus: https://theseusviewer.org/?iiif-content=https://atelier.francescomariano.art/iiif/demo/manifest.json

## Vocabolario SKOS (JSON-LD)

Il vocabolario controllato è pubblicato come SKOS in JSON-LD sotto `https://atelier.francescomariano.art/vocab/`, con licenza CC BY 4.0 dichiarata (`dct:license`) nell'indice e in ogni schema.

- `index.json`, elenco degli schemi e di tutti i concetti.
- Un `skos:ConceptScheme` per tassonomia (`/vocab/schaeffer`, `/vocab/smalley`, ...), con `hasTopConcept` verso i gruppi, fonte e citazione bibliografica.
- Un `skos:Concept` per gruppo (`/vocab/schaeffer.massa`) e per termine (`/vocab/schaeffer.massa.tonica`), con `prefLabel` e `definition` in italiano e inglese, `broader` e `inScheme`. L'URI di un termine è la base più il suo `termId`, lo stesso identificatore che compare nel JSON dell'Atelier.
- Lo schema `notation` (`/vocab/notation`) pubblica il repertorio dei 15 segni originali, un concetto per segno (`/vocab/notation.tipologia.impulso`) in sei categorie (`/vocab/notation.tipologia`, ...), così anche i segni di notazione esportati in IIIF risolvono a una definizione.

Ogni URI risponde con il JSON-LD del concetto (il file `.json` corrispondente, servito con CORS). Esempio:

```sh
curl https://atelier.francescomariano.art/vocab/schaeffer.massa.tonica
```

I file sono generati da `npm run vocab` (`scripts/build_vocab.py`) a partire da `src/data/taxonomies.json` e `src/data/notationSigns.json`, non si modificano a mano. `python3 scripts/build_vocab.py --check` verifica che `public/vocab/` sia allineato alle sorgenti, e il test `src/data/vocab.test.ts` fa lo stesso controllo dentro `npm run test`.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- Wavesurfer.js 7 + Regions e Spectrogram plugin
- Lucide React per le icone
- i18next + react-i18next + browser-language-detector
- idb (wrapper IndexedDB), jsPDF per il PDF, vite-plugin-pwa

## Sviluppo

```sh
npm install
npm run dev
```

Apri il browser sul port indicato, trascina un file audio sopra la dropzone, seleziona un range sul waveform e scegli un termine dal vocabolario per crearne l'annotazione. Il tab `Struttura` permette di tracciare sezioni libere (apertura, sviluppo, coda, transizioni) con etichetta arbitraria.

```sh
npm run test   # vitest sulle lib pure (importer, format, notationSuggest, exporter IIIF, vocabolario)
npm run lint   # eslint (react-hooks 7 e react-refresh), zero errori
```

## Build

```sh
npm run build
```

Output in `dist/`. Il deploy è automatico su Vercel a ogni push su `main`; `vercel.json` aggiunge CORS e cache alle risorse `/iiif/` e `/vocab/` e il rewrite `/vocab/:id` verso `/vocab/:id.json`.

## Sync vocabolari con la skill

Da v0.4 la skill `soundscape-audio-analysis` è la fonte canonica del vocabolario controllato. La PWA pulla il file `references/taxonomies.json` della skill ogni volta che viene aggiornato, e committa il risultato. Dopo un sync va rigenerato il vocabolario SKOS con `npm run vocab`.

```sh
# Importa dalla skill (default da v0.4)
python3 scripts/sync_taxonomies.py

# Esporta dalla PWA verso la skill, da usare solo per promuovere modifiche fatte lato PWA
python3 scripts/sync_taxonomies.py --export-to-skill

# Anteprima delle azioni
python3 scripts/sync_taxonomies.py --dry-run
```

### Annotazioni con `termId` orfani

Se la skill aggiunge o rimuove termini dal vocabolario, le annotazioni esistenti che facevano riferimento a un termId rimosso restano valide ma compaiono nel pannello con un badge ambrato `Termine non più nel vocabolario`. Un banner di sintesi in cima al tab `Annotazioni` riporta il numero totale di orfani. Le annotazioni non vengono cancellate né riassegnate automaticamente: la riconciliazione resta una decisione editoriale. Nell'export IIIF gli orfani conservano l'etichetta ma non l'URI del termine.

## Schema annotazione v1.0

Il JSON esportato segue lo schema definito in `src/types/annotation.ts`. I blocchi `layers`, `notation` e `relations` sono additivi e opzionali; i blocchi `recording` e `analysis` prodotti dalla skill (contratto di interscambio 1.x) vengono preservati nel round-trip import ed export.

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
      "updatedAt": "...",
      "layerId": "uuid dello strato, opzionale"
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
  ],
  "layers": [{ "id": "uuid", "name": "primo piano", "order": 0 }],
  "notation": [{ "id": "uuid", "startSec": 12.3, "signId": "tipologia.impulso", "anchor": "time", "createdAt": "...", "updatedAt": "..." }],
  "relations": []
}
```

## Roadmap

- ✅ v0.1: MVP, vocabolario controllato, persistenza, export JSON.
- ✅ v0.2: tassonomie a 128 termini, tab Struttura, bridge skill, export PDF tipografico, spettrogramma toggle, service worker e manifest (PWA installabile offline-first).
- ✅ v0.3: lista progetti salvati con riapertura, eliminazione, import JSON v1.0 con riconciliazione audio.
- ✅ v0.4: skill come fonte canonica del vocabolario (default sync `skill -> PWA`), validazione `termId` orfani con badge nel pannello e banner di sintesi.
- ✅ v0.5: consumo lato skill delle annotazioni (comando `soundscape compare`, accordo fra annotazione umana e analisi automatica).
- ✅ v2.0: Aural Sonology, strati sincronici, notazione spettromorfologica con segni originali, relazioni form-building, drag con pointer events (iOS).
- ✅ v2.1: export IIIF Presentation API 3.0, vocabolario SKOS pubblicato, demo validata.
- ✅ v2.1.1: review dell'export IIIF (frammenti dentro il canvas, URI dei segni di notazione risolvibili, orfani senza URI, metadata bilingui), schema `notation` nel vocabolario, lint a zero errori.

## Come citare

Se usi l'Atelier in un lavoro di ricerca o didattico, cita il software (il repository include un file `CITATION.cff`, GitHub lo mostra con "Cite this repository"):

> Mariano, F. (2026). *Soundscape Annotation Atelier* (versione 2.1.1) [software]. https://atelier.francescomariano.art/

e il working paper di cui la PWA è companion:

> Mariano, F. (2026). *Soundscape Annotation: workflow iterativo,
> stratificazione interpretativa e calibrazione di una skill di
> analisi audio in didattica AFAM*. Working Paper v1.0. Accademia
> di Belle Arti di Macerata.
> https://doi.org/10.5281/zenodo.20282496

Vedi il README della skill `soundscape-audio-analysis`
(https://github.com/francmo/soundscape-audio-analysis)
per la citazione BibTeX completa.

## Licenza

Codice sotto Apache 2.0. Vocabolari controllati, repertorio dei segni di notazione e contenuti documentali sotto CC BY 4.0.
