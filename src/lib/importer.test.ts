import { describe, expect, it } from 'vitest'
import type { AnnotationProject } from '../types/annotation'
import { ImportSchemaError, parseProjectJson } from './importer'

function basePayload(): Record<string, unknown> {
  return {
    schemaVersion: '1.0',
    id: 'proj-1',
    audio: { filename: 'a.wav', durationSeconds: 60, sampleRate: 48000, channels: 1 },
    metadata: { language: 'it', startedAt: '2026-07-02T10:00:00Z' },
    annotations: [],
    structure: [],
  }
}

describe('parseProjectJson', () => {
  it('accetta 1.0 e ogni 1.x (reader rule INTEROP)', () => {
    expect(parseProjectJson(JSON.stringify(basePayload())).id).toBe('proj-1')
    const v12 = { ...basePayload(), schemaVersion: '1.2' }
    expect(parseProjectJson(JSON.stringify(v12)).schemaVersion).toBe('1.2')
  })

  it('rifiuta versioni non 1.x e JSON malformato', () => {
    const v2 = { ...basePayload(), schemaVersion: '2.0' }
    expect(() => parseProjectJson(JSON.stringify(v2))).toThrow(ImportSchemaError)
    expect(() => parseProjectJson('{non json')).toThrow(ImportSchemaError)
  })

  it('richiede i campi audio e annotations', () => {
    const senzaAudio: Record<string, unknown> = { ...basePayload() }
    delete senzaAudio.audio
    expect(() => parseProjectJson(JSON.stringify(senzaAudio))).toThrow(ImportSchemaError)
  })

  it('preserva i blocchi sconosciuti (analysis) per il round-trip', () => {
    const payload = {
      ...basePayload(),
      analysis: { timeFields: [{ id: 'S1', level: 0, startSec: 0, endSec: 10 }] },
    }
    const project = parseProjectJson(JSON.stringify(payload)) as AnnotationProject
    expect(project.analysis).toEqual(payload.analysis)
  })

  it('normalizza structure mancante a lista vuota', () => {
    const payload: Record<string, unknown> = { ...basePayload() }
    delete payload.structure
    const project = parseProjectJson(JSON.stringify(payload))
    expect(project.structure).toEqual([])
  })
})
