// Repertorio dei segni di notazione (Fase 3).
//
// ATTENZIONE: questi sono segni PLACEHOLDER, forme geometriche neutre usate
// solo per sviluppare e testare il rendering dell'overlay. NON sono i segni
// del metodo Aural Sonology di Thoresen: il repertorio definitivo, fedele al
// sistema, sarà definito col libro Emergent Musical Forms alla mano e
// disegnato come glifi originali (il font Sonova non ha licenza esplicita).
// Vedi handoff Fase 3.

export interface NotationSign {
  /** Identificatore stabile, riferito da NotationMark.signId. */
  id: string
  /** Nome leggibile del segno. */
  name: string
  /** Categoria del metodo (placeholder finché non si fissa il repertorio). */
  category: string
  /** true se il segno ha durata (gesto/processo), false se puntuale. */
  extended: boolean
  /** Contenuto SVG del glifo: elementi interni resi dentro un
   * <svg viewBox="0 0 24 24">. Usa fill/stroke "currentColor" per ereditare
   * il colore dal contesto. PLACEHOLDER. */
  svg: string
  /** Glossario breve. */
  description: string
}

export const NOTATION_SIGNS: NotationSign[] = [
  {
    id: 'placeholder.punctual',
    name: 'Evento puntuale',
    category: 'placeholder',
    extended: false,
    svg: '<circle cx="12" cy="12" r="4" fill="currentColor" />',
    description: 'Segno puntuale generico (placeholder).',
  },
  {
    id: 'placeholder.attack',
    name: 'Attacco',
    category: 'placeholder',
    extended: false,
    svg: '<path d="M4 20 L12 4 L20 20 Z" fill="currentColor" />',
    description: 'Cuneo per un attacco netto (placeholder).',
  },
  {
    id: 'placeholder.gesture',
    name: 'Gesto',
    category: 'placeholder',
    extended: true,
    svg: '<path d="M3 18 C 8 18, 9 6, 14 6 S 21 8, 21 6" fill="none" stroke="currentColor" stroke-width="2" />',
    description: 'Linea per un gesto esteso e direzionale (placeholder).',
  },
  {
    id: 'placeholder.texture',
    name: 'Trama',
    category: 'placeholder',
    extended: true,
    svg: '<path d="M3 8 H21 M3 12 H21 M3 16 H21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" />',
    description: 'Fasce tratteggiate per una trama continua (placeholder).',
  },
  {
    id: 'placeholder.sustain',
    name: 'Mantenimento',
    category: 'placeholder',
    extended: true,
    svg: '<path d="M3 12 H21" fill="none" stroke="currentColor" stroke-width="2" />',
    description: 'Linea tenuta per un suono mantenuto (placeholder).',
  },
]

/** Lookup rapido per signId. */
export const NOTATION_SIGN_BY_ID: Record<string, NotationSign> = Object.fromEntries(
  NOTATION_SIGNS.map((s) => [s.id, s]),
)
