import { describe, expect, it } from 'vitest'
import type { AnnotationProject } from '../types/annotation'
import { deriveSuggestedNotation } from './notationSuggest'

function project(analysis?: Record<string, unknown>): AnnotationProject {
  return {
    schemaVersion: '1.0',
    id: 'p1',
    audio: { filename: 'a.wav', durationSeconds: 60, sampleRate: 48000, channels: 1 },
    metadata: { language: 'it', startedAt: '2026-07-02T10:00:00Z' },
    annotations: [],
    structure: [],
    analysis,
  }
}

describe('deriveSuggestedNotation', () => {
  it('ritorna [] senza blocco analysis', () => {
    expect(deriveSuggestedNotation(project())).toEqual([])
  })

  it('propone mantenimento, massa e profilo dinamico dal time-field', () => {
    const suggestions = deriveSuggestedNotation(project({
      timeFields: [
        { id: 'S1', level: 0, startSec: 0, endSec: 10, meanFlatness: 0.5, eventsPerSec: 2 },
      ],
      dynamicForm: {
        energy: [
          { tSec: 0, db: -40 },
          { tSec: 5, db: -30 },
          { tSec: 10, db: -20 },
        ],
      },
    }))
    const ids = suggestions.map((s) => s.signId)
    expect(ids).toContain('tipologia.iterato') // onset density alta
    expect(ids).toContain('massa.rumore') // flatness alta
    expect(ids).toContain('dinamica.crescendo') // energia in salita
  })

  it('ignora i time-field di livello 1 e usa impulso per campi brevissimi', () => {
    const suggestions = deriveSuggestedNotation(project({
      timeFields: [
        { id: 'S1', level: 0, startSec: 0, endSec: 1.0, meanFlatness: 0.05, eventsPerSec: 0 },
        { id: 'S1.a', level: 1, startSec: 0, endSec: 0.5 },
      ],
    }))
    const ids = suggestions.map((s) => s.signId)
    expect(ids).toContain('tipologia.impulso') // durata sotto la soglia impulso
    expect(ids).toContain('massa.tonica') // flatness bassa, altezza definita
    expect(suggestions.every((s) => s.id.startsWith('S1:'))).toBe(true)
  })
})
