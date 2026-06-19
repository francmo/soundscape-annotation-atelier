// Schema annotazione v1.0
// Compatibile con il formato JSON consumabile dalla skill soundscape-audio-analysis.
// Versionato. Modifiche incompatibili richiedono bump major + migrazione.

export const ANNOTATION_SCHEMA_VERSION = '1.0' as const

export type TaxonomyId =
  | 'schaeffer'
  | 'smalley'
  | 'schafer'
  | 'krause'
  | 'chion'
  | 'truax'
  | 'westerkamp'
  | 'wishart'

export interface Annotation {
  id: string
  /** Inizio in secondi, riferito al timeline dell'audio. */
  startSec: number
  /** Fine in secondi. */
  endSec: number
  /** Tassonomia di appartenenza (es. schaeffer). */
  taxonomy: TaxonomyId
  /** Identificatore stabile del termine (es. "massa.tonica"). */
  termId: string
  /** Etichetta umana del termine, nella lingua di annotazione. */
  termLabel: string
  /** Nota libera dell'annotatore. */
  note: string
  /** Colore esadecimale per visualizzazione. */
  color: string
  /** Timestamp ISO 8601 di creazione. */
  createdAt: string
  /** Timestamp ISO 8601 di ultima modifica. */
  updatedAt: string
  /** Strato di appartenenza (Fase 2 Layers). Opzionale: le annotazioni senza
   * layerId restano nello strato implicito di default. */
  layerId?: string
}

export interface StructuralSection {
  id: string
  startSec: number
  endSec: number
  label: string
  note?: string
  color?: string
}

/** Strato sincronico (Fase 2 Layers): stratificazione verticale del materiale.
 * Un'annotazione vi appartiene tramite Annotation.layerId. Gli strati con
 * source 'suggested' provengono dalla skill (sorgenti simultanee proposte);
 * quelli 'user' sono curati dall'annotatore. */
export interface Layer {
  id: string
  /** Nome dello strato (es. "primo piano", "sfondo", o una sorgente). */
  name: string
  /** Ordine verticale di impilamento (0 = in alto). */
  order?: number
  /** Colore esadecimale per visualizzazione. */
  color?: string
  /** Origine dello strato. */
  source?: 'user' | 'suggested'
  /** Famiglia Krause, quando nota (tipico degli strati suggeriti). */
  krause?: string
}

/** Segno di notazione spettromorfologica (Fase 3). Riferisce un segno del
 * repertorio (signId) a una posizione sull'asse tempo. Additivo e opzionale:
 * i progetti senza notation restano identici. */
export interface NotationMark {
  id: string
  /** Inizio in secondi sull'asse tempo. */
  startSec: number
  /** Fine in secondi per i segni estesi (gesti, processi). Assente per i puntuali. */
  endSec?: number
  /** Identificatore del segno nel repertorio (NotationSign.id). */
  signId: string
  /** Strato di appartenenza (Fase 2 Layers). Opzionale. */
  layerId?: string
  /** Ancoraggio: 'time' nella Fase 3a; 'spectro' (tempo per frequenza sullo
   * spettrogramma) è riservato alla Fase 3b. */
  anchor: 'time' | 'spectro'
  /** Frequenza in Hz, solo per anchor 'spectro' (Fase 3b). Riservato. */
  freqHz?: number
  /** Etichetta libera del segno. */
  label?: string
  /** Nota dell'annotatore. */
  note?: string
  /** Colore esadecimale di resa, override del default del segno. */
  color?: string
  /** Timestamp ISO 8601 di creazione. */
  createdAt: string
  /** Timestamp ISO 8601 di ultima modifica. */
  updatedAt: string
}

/** Riferimento a un'entità del progetto, usato dalle relazioni (Fase 4). */
export interface EntityRef {
  kind: 'annotation' | 'structure' | 'layer' | 'notation'
  id: string
}

/** Relazione form-building fra due entità (Fase 4, Aural Sonology). Additiva e
 * opzionale: i progetti senza relations restano identici. */
export interface Relation {
  id: string
  from: EntityRef
  to: EntityRef
  /** Tipo dal vocabolario (RelationType.id in src/data/relationTypes.ts). */
  typeId: string
  note?: string
  /** Colore esadecimale di resa, override del default del tipo. */
  color?: string
  createdAt: string
  updatedAt: string
}

export interface AudioMetadata {
  filename: string
  durationSeconds: number
  sampleRate: number
  channels: number
  /** SHA-256 dell'audio per riconciliare l'annotazione con un audio specifico. */
  sha256?: string
}

export interface ProjectMetadata {
  title?: string
  author?: string
  year?: number
  genre?: string
  annotator?: string
  /** Lingua dell'annotazione (it, en). */
  language: 'it' | 'en'
  /** Timestamp ISO 8601 di prima annotazione. */
  startedAt: string
}

export interface AnnotationProject {
  /** '1.0' per i progetti creati qui; in import si accetta ogni 1.x (INTEROP v1.1). */
  schemaVersion: string
  /** UUID del progetto. */
  id: string
  audio: AudioMetadata
  metadata: ProjectMetadata
  annotations: Annotation[]
  structure: StructuralSection[]
  /** Strati (Fase 2 Layers): stratificazione sincronica. Additivo e opzionale;
   * i progetti senza layers funzionano esattamente come prima. */
  layers?: Layer[]
  /** Segni di notazione spettromorfologica (Fase 3). Additivo e opzionale;
   * i progetti senza notation funzionano esattamente come prima. */
  notation?: NotationMark[]
  /** Relazioni form-building fra entità (Fase 4). Additivo e opzionale. */
  relations?: Relation[]
  /** Blocchi opzionali del contratto Soundscape Interchange v1.1: l'Atelier
   * non li produce ma DEVE preservarli nel round-trip import -> export. */
  recording?: Record<string, unknown>
  analysis?: Record<string, unknown>
}
