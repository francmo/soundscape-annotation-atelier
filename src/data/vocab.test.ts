// Il vocabolario SKOS pubblicato in public/vocab/ è generato da
// scripts/build_vocab.py (npm run vocab) a partire da taxonomies.json e
// notationSigns.json: questo test lo tiene allineato alle sorgenti anche senza
// Python, così una sincronizzazione delle tassonomie senza rigenerazione fallisce qui.
import { describe, expect, it } from 'vitest'
import indexRaw from '../../public/vocab/index.json?raw'
import { taxonomies } from './taxonomies'
import { NOTATION_SIGNS } from './notationSigns'
import { DEFAULT_VOCAB_BASE } from '../lib/iiifExporter'

interface VocabIndex {
  '@id': string
  license: string
  schemes: Array<{ '@id': string; notation: string }>
  concepts: Array<{ '@id': string; notation: string; prefLabel: { it: string; en: string } }>
}

describe('vocabolario SKOS pubblicato', () => {
  const index = JSON.parse(indexRaw) as VocabIndex

  it('uno schema per tassonomia più lo schema notation', () => {
    expect(index['@id']).toBe(DEFAULT_VOCAB_BASE)
    expect(index.license).toBe('https://creativecommons.org/licenses/by/4.0/')
    expect(index.schemes.map((s) => s.notation)).toEqual([...taxonomies.map((t) => t.id), 'notation'])
  })

  it('un concetto per ogni termine e per ogni segno, con URI sulla base del vocabolario', () => {
    const expected = [
      ...taxonomies.flatMap((t) => t.groups.flatMap((g) => g.terms.map((term) => term.id))),
      ...NOTATION_SIGNS.map((s) => `notation.${s.id}`),
    ]
    expect(index.concepts.map((c) => c.notation)).toEqual(expected)
    for (const c of index.concepts) {
      expect(c['@id']).toBe(`${DEFAULT_VOCAB_BASE}${c.notation}`)
      expect(c.prefLabel.it).toBeTruthy()
      expect(c.prefLabel.en).toBeTruthy()
    }
  })
})
