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
// I dati vivono in notationSigns.json (unica fonte, letta anche da
// scripts/build_vocab.py per pubblicare il repertorio come schema SKOS
// `notation` accanto alle tassonomie); questo modulo aggiunge tipi e lookup.
//
// Riferimenti: Thoresen & Hedman, Spectromorphological Analysis of Sound-Objects,
// Organised Sound 12(2):129-141 (2007); Schaeffer, Solfège de l'objet sonore (1966).
import data from './notationSigns.json' with { type: 'json' }

export interface NotationSign {
  /** Identificatore stabile, riferito da NotationMark.signId. */
  id: string
  /** Nome leggibile del segno (italiano, lingua del repertorio). */
  name: string
  /** Nome inglese, usato dal vocabolario SKOS pubblicato. */
  name_en: string
  /** Famiglia morfologica del sistema (NotationCategory.id). */
  category: string
  /** true se il segno ha durata (gesto/processo), false se puntuale. */
  extended: boolean
  /** Contenuto SVG del glifo: elementi interni resi dentro un
   * <svg viewBox="0 0 24 24">. Usa fill/stroke "currentColor". */
  svg: string
  /** Glossario breve (italiano). */
  description: string
  /** Glossario breve in inglese, usato dal vocabolario SKOS pubblicato. */
  description_en: string
}

export interface NotationCategory {
  id: string
  label_it: string
  label_en: string
}

interface NotationSignsFile {
  schemaVersion: string
  source: string
  categories: NotationCategory[]
  signs: NotationSign[]
}

const file = data as NotationSignsFile

export const NOTATION_CATEGORIES: NotationCategory[] = file.categories

export const NOTATION_SIGNS: NotationSign[] = file.signs

/** Lookup rapido per signId. */
export const NOTATION_SIGN_BY_ID: Record<string, NotationSign> = Object.fromEntries(
  NOTATION_SIGNS.map((s) => [s.id, s]),
)
