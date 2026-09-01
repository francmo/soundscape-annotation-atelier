# CLAUDE.md - Soundscape Annotation Atelier

PWA di annotazione first-hand per soundscape, field recording e composizione
elettroacustica, companion della skill `soundscape-audio-analysis` (stesso
vocabolario controllato, 128 termini in 8 tassonomie).

## Stack e comandi

React 19 + TypeScript + Vite 8 + Tailwind v4 + Wavesurfer.js 7 (Regions +
Spectrogram) + i18next + idb + jsPDF + vite-plugin-pwa.

```bash
npm run dev      # dev server
npm run test     # vitest sulle lib pure (importer, format, notationSuggest)
npm run lint     # eslint
npm run build    # tsc -b + vite build (gate prima di ogni push)
```

## Convenzioni chiave

- La versione visibile (`src/version.ts`) è iniettata da package.json tramite
  il define di Vite. Si bumpa SOLO package.json, mai il file a mano.
- Import JSON con reader rule 1.x (`src/lib/importer.ts`); i blocchi
  top-level sconosciuti (recording, analysis) vanno preservati nel
  round-trip. Le modifiche allo schema sono additive; un bump di
  schemaVersion va coordinato con la skill.
- Wavesurfer Regions gestisce annotazioni e struttura via `region.data.kind`
  ('annotation' | 'structure' | 'selection'). Non cambiare il pattern senza
  coordinare con `AudioWorkbench.tsx`.
- IndexedDB (db `sa-atelier`) è persistenza locale, NON un backup. Il backup
  reale è export JSON + audio originale.
- iOS Safari prima di dichiarare chiuso un rilascio - audio solo dopo gesture
  utente, niente HTML5 drag-and-drop (si usano pointer events, v2.0.1),
  accept espliciti sugli input file.
- Il vocabolario canonico vive nella skill (`references/taxonomies.json`);
  sincronizzazione con `scripts/sync_taxonomies.py` (default skill -> PWA).
- Export IIIF (`src/lib/iiifExporter.ts`, funzione pura + test). Il vocabolario
  SKOS in `public/vocab/` e il manifest demo in `public/iiif/demo/` sono generati
  (`npm run vocab`, `npm run demo:iiif`), non si modificano a mano; dopo un sync
  delle tassonomie rigenerare il vocabolario. Entrambe le cartelle sono fuori dalla
  precache del service worker (`globIgnores` in `vite.config.ts`) e servite con
  CORS da `vercel.json`.
- Italiano corretto con accenti veri, niente em dash, anche in stringhe,
  commenti e documentazione.

## Stato di sessione

`.claude/SESSION_HANDOFF.md` (gitignored) contiene lo stato dettagliato;
`.claude/RELEASES.md` le note di rilascio estese. Il deploy è automatico su
push a `main` (Vercel).
