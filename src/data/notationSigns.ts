// Repertorio dei segni di notazione (Fase 3).
//
// Glifi ORIGINALI disegnati per le categorie del solfège dell'oggetto sonoro
// (Schaeffer) e della spettromorfologia (Smalley), come adattate da Thoresen in
// Aural Sonology: tipologia/mantenimento, massa, profilo dinamico, profilo di
// massa, grana e allure, moto. NON sono i segni grafici di Thoresen/Hedman né il
// font Sonova (opere protette da copyright): sono forme geometriche di base
// (linee, cunei, onde, punti) scelte per evocare ciascuna categoria. Le
// categorie sono concetti del sistema, non protetti; i glifi qui sono nuovi.
// Da validare con Francesco sul libro Emergent Musical Forms (2015); per usare i
// segni ufficiali servirebbe il permesso degli autori (auralsonology.com).
//
// Riferimenti: Thoresen & Hedman, Spectromorphological Analysis of Sound-Objects,
// Organised Sound 12(2):129-141 (2007); Schaeffer, Solfège de l'objet sonore (1966).

export interface NotationSign {
  /** Identificatore stabile, riferito da NotationMark.signId. */
  id: string
  /** Nome leggibile del segno. */
  name: string
  /** Famiglia morfologica del sistema. */
  category: string
  /** true se il segno ha durata (gesto/processo), false se puntuale. */
  extended: boolean
  /** Contenuto SVG del glifo: elementi interni resi dentro un
   * <svg viewBox="0 0 24 24">. Usa fill/stroke "currentColor". */
  svg: string
  /** Glossario breve. */
  description: string
}

export const NOTATION_SIGNS: NotationSign[] = [
  // --- Tipologia / mantenimento (come il suono si sostiene nel tempo) ---
  {
    id: 'tipologia.impulso',
    name: 'Impulso',
    category: 'tipologia',
    extended: false,
    svg: '<circle cx="12" cy="5" r="2.5" fill="currentColor" /><line x1="12" y1="7" x2="12" y2="20" stroke="currentColor" stroke-width="2" />',
    description: 'Oggetto breve e secco, attacco senza durata (mantenimento impulsivo).',
  },
  {
    id: 'tipologia.tenuto',
    name: 'Tenuto',
    category: 'tipologia',
    extended: true,
    svg: '<line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2.5" />',
    description: 'Suono mantenuto a energia stabile (mantenimento tenuto).',
  },
  {
    id: 'tipologia.iterato',
    name: 'Iterato',
    category: 'tipologia',
    extended: true,
    svg: '<g stroke="currentColor" stroke-width="2"><line x1="4" y1="8" x2="4" y2="16" /><line x1="9" y1="8" x2="9" y2="16" /><line x1="14" y1="8" x2="14" y2="16" /><line x1="19" y1="8" x2="19" y2="16" /></g>',
    description: 'Ripetizione rapida di impulsi (mantenimento iterativo).',
  },
  // --- Massa (natura spettrale dell'altezza) ---
  {
    id: 'massa.tonica',
    name: 'Massa tonica',
    category: 'massa',
    extended: false,
    svg: '<line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1" stroke-opacity="0.4" /><circle cx="12" cy="12" r="3.5" fill="currentColor" />',
    description: 'Altezza chiaramente percepibile (massa tonica).',
  },
  {
    id: 'massa.complessa',
    name: 'Massa complessa',
    category: 'massa',
    extended: true,
    svg: '<g stroke="currentColor" stroke-width="1.6"><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="15" x2="21" y2="15" /></g>',
    description: 'Fascio di altezze ravvicinate, massa nodale o complessa.',
  },
  {
    id: 'massa.rumore',
    name: 'Rumore',
    category: 'massa',
    extended: true,
    svg: '<g fill="currentColor"><circle cx="5" cy="8" r="1" /><circle cx="9" cy="14" r="1" /><circle cx="13" cy="7" r="1" /><circle cx="17" cy="13" r="1" /><circle cx="20" cy="9" r="1" /><circle cx="7" cy="17" r="1" /><circle cx="15" cy="17" r="1" /></g>',
    description: 'Massa senza altezza definita (rumore).',
  },
  // --- Profilo dinamico (andamento dell'energia) ---
  {
    id: 'dinamica.crescendo',
    name: 'Crescendo',
    category: 'dinamica',
    extended: true,
    svg: '<path d="M3 12 L21 6 M3 12 L21 18" fill="none" stroke="currentColor" stroke-width="1.8" />',
    description: 'Energia crescente nel tempo.',
  },
  {
    id: 'dinamica.decrescendo',
    name: 'Decrescendo',
    category: 'dinamica',
    extended: true,
    svg: '<path d="M21 12 L3 6 M21 12 L3 18" fill="none" stroke="currentColor" stroke-width="1.8" />',
    description: 'Energia calante nel tempo.',
  },
  {
    id: 'dinamica.arco',
    name: 'Attacco-risonanza',
    category: 'dinamica',
    extended: true,
    svg: '<path d="M3 19 Q12 3 21 19" fill="none" stroke="currentColor" stroke-width="1.8" />',
    description: 'Crescita rapida e lunga risonanza, profilo ad arco.',
  },
  // --- Profilo di massa / melodico (movimento dell'altezza) ---
  {
    id: 'profilo.ascendente',
    name: 'Profilo ascendente',
    category: 'profilo',
    extended: true,
    svg: '<path d="M4 19 L20 6" fill="none" stroke="currentColor" stroke-width="2" /><path d="M20 6 l-5.5 1.2 M20 6 l-1.2 5.5" fill="none" stroke="currentColor" stroke-width="2" />',
    description: 'Altezza o massa in salita.',
  },
  {
    id: 'profilo.discendente',
    name: 'Profilo discendente',
    category: 'profilo',
    extended: true,
    svg: '<path d="M4 6 L20 19" fill="none" stroke="currentColor" stroke-width="2" /><path d="M20 19 l-5.5 -1.2 M20 19 l-1.2 -5.5" fill="none" stroke="currentColor" stroke-width="2" />',
    description: 'Altezza o massa in discesa.',
  },
  // --- Grana e allure (micro-struttura e oscillazione) ---
  {
    id: 'fattura.grana',
    name: 'Grana',
    category: 'fattura',
    extended: true,
    svg: '<g fill="currentColor"><circle cx="4" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="16" cy="12" r="1.2" /><circle cx="20" cy="12" r="1.2" /></g>',
    description: 'Micro-struttura granulare della materia sonora.',
  },
  {
    id: 'fattura.allure',
    name: 'Allure',
    category: 'fattura',
    extended: true,
    svg: '<path d="M3 12 Q6 6 9 12 T15 12 T21 12" fill="none" stroke="currentColor" stroke-width="1.8" />',
    description: "Oscillazione regolare dell'energia o dell'altezza (allure, vibrato).",
  },
  // --- Moto (spettromorfologia, Smalley) ---
  {
    id: 'moto.gesto',
    name: 'Gesto',
    category: 'moto',
    extended: true,
    svg: '<path d="M3 18 C 8 18, 9 6, 14 6 S 21 8, 21 6" fill="none" stroke="currentColor" stroke-width="2" />',
    description: 'Movimento direzionale e teso, di tipo gestuale.',
  },
  {
    id: 'moto.trama',
    name: 'Trama',
    category: 'moto',
    extended: true,
    svg: '<path d="M3 8 H21 M3 12 H21 M3 16 H21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" />',
    description: 'Materia continua e non direzionale, di tipo tramato.',
  },
]

/** Lookup rapido per signId. */
export const NOTATION_SIGN_BY_ID: Record<string, NotationSign> = Object.fromEntries(
  NOTATION_SIGNS.map((s) => [s.id, s]),
)
