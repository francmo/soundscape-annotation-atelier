import type { TaxonomyId } from '../types/annotation'

export interface TaxonomyTerm {
  /** Identificatore stabile, formato `<categoria>.<slug>`. Mai cambiare. */
  id: string
  /** Etichetta canonica, italiana. */
  label_it: string
  /** Etichetta canonica, inglese. */
  label_en: string
  /** Definizione operativa, italiana. */
  desc_it: string
  /** Definizione operativa, inglese. */
  desc_en: string
}

export interface TaxonomyGroup {
  /** Categoria (es. Massa, Grain). */
  id: string
  label_it: string
  label_en: string
  terms: TaxonomyTerm[]
}

export interface Taxonomy {
  id: TaxonomyId
  label_it: string
  label_en: string
  source: string
  /** Riferimento bibliografico canonico. */
  reference: string
  /** Colore di base per tutti i marker di questa tassonomia. */
  color: string
  groups: TaxonomyGroup[]
}

// Vocabolario controllato derivato dai riferimenti della skill
// soundscape-audio-analysis (references/taxonomies/) e dalle fonti canoniche
// (Schaeffer 1966, Smalley 1986/1997, Schafer 1977, Krause 1987, Chion 1994).
export const taxonomies: Taxonomy[] = [
  {
    id: 'schaeffer',
    label_it: 'Schaeffer, tipo-morfologia',
    label_en: 'Schaeffer, typo-morphology',
    source: 'Pierre Schaeffer',
    reference: 'Schaeffer, P. (1966). Traité des objets musicaux. Seuil.',
    color: '#a78bfa',
    groups: [
      {
        id: 'massa',
        label_it: 'Massa',
        label_en: 'Mass',
        terms: [
          { id: 'schaeffer.massa.tonica', label_it: 'Tonica', label_en: 'Tonic', desc_it: 'Altezza definita, armonicità.', desc_en: 'Defined pitch, harmonicity.' },
          { id: 'schaeffer.massa.complessa', label_it: 'Complessa', label_en: 'Complex', desc_it: 'Altezza percepita ma con spettro arricchito.', desc_en: 'Perceived pitch with enriched spectrum.' },
          { id: 'schaeffer.massa.nodo', label_it: 'Nodo', label_en: 'Node', desc_it: 'Altezza ambigua o in transizione.', desc_en: 'Ambiguous or transitional pitch.' },
          { id: 'schaeffer.massa.rumore-intonato', label_it: 'Rumore intonato', label_en: 'Pitched noise', desc_it: 'Massa con colore ma senza altezza precisa.', desc_en: 'Mass with colour but no precise pitch.' },
          { id: 'schaeffer.massa.rumore-bianco', label_it: 'Rumore bianco', label_en: 'White noise', desc_it: 'Massa distribuita senza centro tonale, spettro piatto.', desc_en: 'Distributed mass with flat spectrum, no tonal centre.' },
          { id: 'schaeffer.massa.rumore-rosa', label_it: 'Rumore rosa', label_en: 'Pink noise', desc_it: 'Massa distribuita con energia decrescente verso le alte.', desc_en: 'Distributed mass with energy decreasing towards high frequencies.' },
          { id: 'schaeffer.massa.rumore-colorato', label_it: 'Rumore colorato', label_en: 'Coloured noise', desc_it: 'Massa con caratterizzazione spettrale specifica.', desc_en: 'Mass with specific spectral characterisation.' },
          { id: 'schaeffer.massa.impulsiva', label_it: 'Impulsiva', label_en: 'Impulsive', desc_it: 'Durata prossima a zero, massa istantanea.', desc_en: 'Near-zero duration, instantaneous mass.' },
          { id: 'schaeffer.massa.tenuta', label_it: 'Tenuta', label_en: 'Sustained', desc_it: 'Massa stabile nel tempo.', desc_en: 'Mass stable over time.' },
          { id: 'schaeffer.massa.iterativa', label_it: 'Iterativa', label_en: 'Iterative', desc_it: 'Ripetizione di unità brevi.', desc_en: 'Repetition of brief units.' },
        ],
      },
      {
        id: 'grain',
        label_it: 'Grain',
        label_en: 'Grain',
        terms: [
          { id: 'schaeffer.grain.fine', label_it: 'Fine', label_en: 'Fine', desc_it: 'Liscio, omogeneo (seno puro, voce tenuta).', desc_en: 'Smooth, homogeneous (pure tone, sustained voice).' },
          { id: 'schaeffer.grain.grosso', label_it: 'Grosso', label_en: 'Coarse', desc_it: 'Granuloso, discontinuo (foglie mosse, pioggia).', desc_en: 'Granular, discontinuous (rustling leaves, rain).' },
          { id: 'schaeffer.grain.rugoso', label_it: 'Rugoso', label_en: 'Rough', desc_it: 'Irregolare, complesso (rumore meccanico, voce soffiata).', desc_en: 'Irregular, complex (mechanical noise, breathy voice).' },
        ],
      },
      {
        id: 'allure',
        label_it: 'Allure',
        label_en: 'Allure',
        terms: [
          { id: 'schaeffer.allure.ferma', label_it: 'Ferma', label_en: 'Steady', desc_it: 'Stabile, senza oscillazioni.', desc_en: 'Steady, without oscillation.' },
          { id: 'schaeffer.allure.ondulante', label_it: 'Ondulante', label_en: 'Undulating', desc_it: 'Movimento lento, regolare.', desc_en: 'Slow, regular movement.' },
          { id: 'schaeffer.allure.ciclica', label_it: 'Ciclica', label_en: 'Cyclic', desc_it: 'Movimento periodico riconoscibile.', desc_en: 'Recognisable periodic movement.' },
          { id: 'schaeffer.allure.disordinata', label_it: 'Disordinata', label_en: 'Disordered', desc_it: 'Oscillazioni irregolari.', desc_en: 'Irregular oscillations.' },
        ],
      },
      {
        id: 'mantenimento',
        label_it: 'Criterio di mantenimento',
        label_en: 'Maintenance criterion',
        terms: [
          { id: 'schaeffer.mantenimento.impulsivo', label_it: 'Impulsivo', label_en: 'Impulsive', desc_it: 'L\'oggetto si esaurisce nell\'attacco.', desc_en: 'Object exhausts itself in the attack.' },
          { id: 'schaeffer.mantenimento.tenuto', label_it: 'Tenuto', label_en: 'Sustained', desc_it: 'Si mantiene omogeneamente.', desc_en: 'Maintained homogeneously.' },
          { id: 'schaeffer.mantenimento.iterativo', label_it: 'Iterativo', label_en: 'Iterative', desc_it: 'Si mantiene per ripetizione.', desc_en: 'Maintained through repetition.' },
        ],
      },
    ],
  },
  {
    id: 'smalley',
    label_it: 'Smalley, spettromorfologia',
    label_en: 'Smalley, spectromorphology',
    source: 'Denis Smalley',
    reference: 'Smalley, D. (1997). Spectromorphology: explaining sound-shapes. Organised Sound, 2(2), 107-126.',
    color: '#fb923c',
    groups: [
      {
        id: 'motion',
        label_it: 'Movimento',
        label_en: 'Motion',
        terms: [
          { id: 'smalley.motion.flow', label_it: 'Flow', label_en: 'Flow', desc_it: 'Movimento continuo, fluido.', desc_en: 'Continuous, fluid motion.' },
          { id: 'smalley.motion.oscillation', label_it: 'Oscillation', label_en: 'Oscillation', desc_it: 'Oscillazione tra polarità.', desc_en: 'Oscillation between polarities.' },
          { id: 'smalley.motion.rotation', label_it: 'Rotation', label_en: 'Rotation', desc_it: 'Movimento rotatorio nello spazio spettrale.', desc_en: 'Rotational movement in spectral space.' },
          { id: 'smalley.motion.push', label_it: 'Push', label_en: 'Push', desc_it: 'Spinta in avanti, impulso direzionale.', desc_en: 'Forward thrust, directional impulse.' },
          { id: 'smalley.motion.drag', label_it: 'Drag', label_en: 'Drag', desc_it: 'Trascinamento, resistenza.', desc_en: 'Dragging, resistance.' },
          { id: 'smalley.motion.ascent', label_it: 'Ascent', label_en: 'Ascent', desc_it: 'Salita verso l\'alto registro.', desc_en: 'Ascent towards higher register.' },
          { id: 'smalley.motion.descent', label_it: 'Descent', label_en: 'Descent', desc_it: 'Discesa verso il basso registro.', desc_en: 'Descent towards lower register.' },
          { id: 'smalley.motion.plane', label_it: 'Plane', label_en: 'Plane', desc_it: 'Stato planare, immobile o quasi.', desc_en: 'Planar, immobile or near-immobile state.' },
        ],
      },
      {
        id: 'growth',
        label_it: 'Crescita',
        label_en: 'Growth',
        terms: [
          { id: 'smalley.growth.dilation', label_it: 'Dilation', label_en: 'Dilation', desc_it: 'Espansione interna del materiale.', desc_en: 'Internal expansion of material.' },
          { id: 'smalley.growth.endogeny', label_it: 'Endogeny', label_en: 'Endogeny', desc_it: 'Crescita dall\'interno, autonoma.', desc_en: 'Inward growth, autonomous.' },
          { id: 'smalley.growth.multiplication', label_it: 'Multiplication', label_en: 'Multiplication', desc_it: 'Moltiplicazione di unità sonore.', desc_en: 'Multiplication of sound units.' },
          { id: 'smalley.growth.exogeny', label_it: 'Exogeny', label_en: 'Exogeny', desc_it: 'Crescita verso l\'esterno, espansiva.', desc_en: 'Outward, expansive growth.' },
        ],
      },
      {
        id: 'spectral-typology',
        label_it: 'Tipologia spettrale',
        label_en: 'Spectral typology',
        terms: [
          { id: 'smalley.spectral.note', label_it: 'Note', label_en: 'Note', desc_it: 'Spettro armonico, altezza chiara.', desc_en: 'Harmonic spectrum, clear pitch.' },
          { id: 'smalley.spectral.node', label_it: 'Node', label_en: 'Node', desc_it: 'Spettro con concentrazione di energia parziale.', desc_en: 'Spectrum with partial energy concentration.' },
          { id: 'smalley.spectral.noise', label_it: 'Noise', label_en: 'Noise', desc_it: 'Spettro distribuito senza centro.', desc_en: 'Distributed spectrum, no centre.' },
        ],
      },
      {
        id: 'behaviour',
        label_it: 'Comportamento',
        label_en: 'Behaviour',
        terms: [
          { id: 'smalley.behaviour.passive', label_it: 'Passive', label_en: 'Passive', desc_it: 'Comportamento inerte, recettivo.', desc_en: 'Inert, receptive behaviour.' },
          { id: 'smalley.behaviour.reactive', label_it: 'Reactive', label_en: 'Reactive', desc_it: 'Risposta a stimoli esterni.', desc_en: 'Response to external stimuli.' },
          { id: 'smalley.behaviour.active', label_it: 'Active', label_en: 'Active', desc_it: 'Iniziativa propria, propulsivo.', desc_en: 'Self-initiated, propulsive.' },
        ],
      },
    ],
  },
  {
    id: 'schafer',
    label_it: 'Schafer, paesaggio sonoro',
    label_en: 'Schafer, soundscape',
    source: 'R. Murray Schafer',
    reference: 'Schafer, R. M. (1977). The Tuning of the World. Knopf.',
    color: '#34d399',
    groups: [
      {
        id: 'tipologia',
        label_it: 'Tipologia',
        label_en: 'Typology',
        terms: [
          { id: 'schafer.type.keynote', label_it: 'Keynote', label_en: 'Keynote', desc_it: 'Suono di sottofondo che dà il tono al paesaggio (analogia con la tonica musicale).', desc_en: 'Background sound that gives the tone to the soundscape (analogous to musical keynote).' },
          { id: 'schafer.type.signal', label_it: 'Signal', label_en: 'Signal', desc_it: 'Suono in primo piano, ascoltato consapevolmente (campane, sirene, richiami).', desc_en: 'Foreground sound, consciously listened to (bells, sirens, calls).' },
          { id: 'schafer.type.soundmark', label_it: 'Soundmark', label_en: 'Soundmark', desc_it: 'Suono caratterizzante e identitario di un luogo.', desc_en: 'Characterising and identitarian sound of a place.' },
        ],
      },
      {
        id: 'qualita',
        label_it: 'Qualità acustica',
        label_en: 'Acoustic quality',
        terms: [
          { id: 'schafer.quality.hi-fi', label_it: 'Hi-Fi', label_en: 'Hi-Fi', desc_it: 'Basso rapporto rumore/segnale, eventi sonori distinti.', desc_en: 'Low noise/signal ratio, distinct sound events.' },
          { id: 'schafer.quality.lo-fi', label_it: 'Lo-Fi', label_en: 'Lo-Fi', desc_it: 'Alto rapporto rumore/segnale, eventi sovrapposti.', desc_en: 'High noise/signal ratio, overlapping events.' },
        ],
      },
      {
        id: 'bande',
        label_it: 'Bande spettrali',
        label_en: 'Spectral bands',
        terms: [
          { id: 'schafer.band.sub-bass', label_it: 'Sub-bass (20-60 Hz)', label_en: 'Sub-bass (20-60 Hz)', desc_it: 'Vibrazione fisica, percepita più col corpo che con l\'orecchio.', desc_en: 'Physical vibration, perceived more by body than ear.' },
          { id: 'schafer.band.bass', label_it: 'Bass (60-250 Hz)', label_en: 'Bass (60-250 Hz)', desc_it: 'Corpo, calore, fondamentali di voci maschili e motori.', desc_en: 'Body, warmth, fundamentals of male voices and engines.' },
          { id: 'schafer.band.low-mid', label_it: 'Low-mid (250-500 Hz)', label_en: 'Low-mid (250-500 Hz)', desc_it: 'Pienezza, corpo delle voci medie.', desc_en: 'Fullness, body of mid-range voices.' },
          { id: 'schafer.band.mid', label_it: 'Mid (500-2000 Hz)', label_en: 'Mid (500-2000 Hz)', desc_it: 'Presenza, chiarezza, fascia della parola.', desc_en: 'Presence, clarity, speech band.' },
          { id: 'schafer.band.high-mid', label_it: 'High-mid (2000-4000 Hz)', label_en: 'High-mid (2000-4000 Hz)', desc_it: 'Intelligibilità del parlato, sibilanti.', desc_en: 'Speech intelligibility, sibilants.' },
          { id: 'schafer.band.presence', label_it: 'Presence (4000-6000 Hz)', label_en: 'Presence (4000-6000 Hz)', desc_it: 'Brillantezza, dettagli ambientali.', desc_en: 'Brilliance, environmental details.' },
          { id: 'schafer.band.brilliance', label_it: 'Brilliance (6000-20000 Hz)', label_en: 'Brilliance (6000-20000 Hz)', desc_it: 'Aria, spazialità, alte formanti.', desc_en: 'Air, spatiality, high formants.' },
        ],
      },
    ],
  },
  {
    id: 'krause',
    label_it: 'Krause, ipotesi della nicchia acustica',
    label_en: 'Krause, acoustic niche hypothesis',
    source: 'Bernie Krause',
    reference: 'Krause, B. (2012). The Great Animal Orchestra. Little, Brown.',
    color: '#22d3ee',
    groups: [
      {
        id: 'fonti',
        label_it: 'Fonti sonore',
        label_en: 'Sound sources',
        terms: [
          { id: 'krause.biophony', label_it: 'Biofonia', label_en: 'Biophony', desc_it: 'Suoni prodotti da organismi viventi non umani (animali, insetti).', desc_en: 'Sounds produced by non-human living organisms (animals, insects).' },
          { id: 'krause.anthrophony', label_it: 'Antropofonia', label_en: 'Anthrophony', desc_it: 'Suoni prodotti dall\'attività umana (motori, voci, macchinari).', desc_en: 'Sounds produced by human activity (engines, voices, machinery).' },
          { id: 'krause.geophony', label_it: 'Geofonia', label_en: 'Geophony', desc_it: 'Suoni naturali non biologici (vento, acqua, terremoti, fuoco).', desc_en: 'Non-biological natural sounds (wind, water, earthquakes, fire).' },
        ],
      },
    ],
  },
  {
    id: 'chion',
    label_it: 'Chion, modi di ascolto',
    label_en: 'Chion, listening modes',
    source: 'Michel Chion',
    reference: 'Chion, M. (1994). Audio-Vision. Columbia University Press.',
    color: '#f472b6',
    groups: [
      {
        id: 'modi',
        label_it: 'Modi di ascolto',
        label_en: 'Listening modes',
        terms: [
          { id: 'chion.causal', label_it: 'Causale', label_en: 'Causal', desc_it: 'Ascolto rivolto a identificare la sorgente (cosa l\'ha prodotto?).', desc_en: 'Listening aimed at identifying the source (what produced it?).' },
          { id: 'chion.semantic', label_it: 'Semantico', label_en: 'Semantic', desc_it: 'Ascolto rivolto a decifrare un codice (linguaggio, segnali).', desc_en: 'Listening aimed at decoding a code (language, signals).' },
          { id: 'chion.reduced', label_it: 'Ridotto', label_en: 'Reduced', desc_it: 'Ascolto delle qualità intrinseche del suono, indipendente dalla fonte.', desc_en: 'Listening to the intrinsic qualities of sound, independent of source.' },
        ],
      },
    ],
  },
]

export const getTaxonomy = (id: TaxonomyId): Taxonomy | undefined =>
  taxonomies.find((t) => t.id === id)

export const getTermById = (
  termId: string,
): { taxonomy: Taxonomy; group: TaxonomyGroup; term: TaxonomyTerm } | undefined => {
  for (const tax of taxonomies) {
    for (const group of tax.groups) {
      const term = group.terms.find((t) => t.id === termId)
      if (term) return { taxonomy: tax, group, term }
    }
  }
  return undefined
}

/** Conta il totale dei termini in tutte le tassonomie. */
export const totalTermsCount = taxonomies.reduce(
  (sum, t) => sum + t.groups.reduce((s, g) => s + g.terms.length, 0),
  0,
)
