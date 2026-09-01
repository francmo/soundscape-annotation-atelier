import { describe, expect, it } from 'vitest'
import type { AnnotationProject } from '../types/annotation'
import { buildIiifManifest, formatFragmentSeconds, audioFormatFor } from './iiifExporter'

const now = '2026-09-01T10:00:00.000Z'

function project(extra: Partial<AnnotationProject> = {}): AnnotationProject {
  return {
    schemaVersion: '1.0',
    id: 'proj-1',
    audio: { filename: 'campo 1.wav', durationSeconds: 180.736, sampleRate: 48000, channels: 2 },
    metadata: { language: 'en', startedAt: now, title: 'Test project', annotator: 'Nome Cognome', author: 'Autore Segreto' },
    annotations: [
      {
        id: 'a1', startSec: 0, endSec: 29.939398, taxonomy: 'schaeffer', termId: 'schaeffer.massa.tonica',
        termLabel: 'Tonica', note: '', color: '#000', createdAt: now, updatedAt: now,
      },
      {
        id: 'a2', startSec: 30, endSec: 60, taxonomy: 'krause', termId: 'krause.biophony',
        termLabel: 'Biofonia', note: 'birds in the foreground', color: '#000', createdAt: now, updatedAt: now, layerId: 'L2',
      },
      {
        id: 'a3', startSec: 5, endSec: 6, taxonomy: 'schafer', termId: 'termine.non.piu.nel.vocabolario',
        termLabel: 'Etichetta orfana', note: '', color: '#000', createdAt: now, updatedAt: now, layerId: 'L1',
      },
    ],
    structure: [
      { id: 's2', startSec: 29.54, endSec: 155.995, label: 'Sviluppo' },
      { id: 's1', startSec: 0, endSec: 29.939398230088493, label: 'Inizio' },
    ],
    layers: [
      { id: 'L2', name: 'Background', order: 1 },
      { id: 'L1', name: 'Foreground', order: 0 },
    ],
    ...extra,
  }
}

describe('formatFragmentSeconds', () => {
  it('tre decimali al massimo, senza zeri finali, mai negativo', () => {
    expect(formatFragmentSeconds(29.939398)).toBe('29.939')
    expect(formatFragmentSeconds(0)).toBe('0')
    expect(formatFragmentSeconds(180.736)).toBe('180.736')
    expect(formatFragmentSeconds(-1)).toBe('0')
    expect(formatFragmentSeconds(Number.NaN)).toBe('0')
  })
})

describe('buildIiifManifest', () => {
  it('canvas audio con sola duration, dipinto da una risorsa Sound', () => {
    const m = buildIiifManifest(project())
    expect(m['@context']).toBe('http://iiif.io/api/presentation/3/context.json')
    expect(m.type).toBe('Manifest')
    expect(m.id).toBe('https://atelier.francescomariano.art/iiif/proj-1/manifest.json')
    const canvas = m.items[0]
    expect(canvas.type).toBe('Canvas')
    expect(canvas.duration).toBe(180.736)
    expect(canvas).not.toHaveProperty('width')
    expect(canvas).not.toHaveProperty('height')
    const painting = canvas.items[0].items[0]
    expect(painting.motivation).toBe('painting')
    expect(painting.body).toMatchObject({ type: 'Sound', format: 'audio/wav', duration: 180.736 })
    expect((painting.body as { id: string }).id).toBe('https://atelier.francescomariano.art/iiif/proj-1/campo%201.wav')
    expect(painting.target).toBe(canvas.id)
  })

  it('rispetta baseUri, audioUrl e vocabBase passati come opzioni', () => {
    const m = buildIiifManifest(project(), {
      baseUri: 'https://example.org/iiif/x/',
      audioUrl: 'https://cdn.example.org/a.wav',
      vocabBase: 'https://example.org/vocab/',
      atelierJsonUrl: 'https://example.org/x.annotation.json',
    })
    expect(m.id).toBe('https://example.org/iiif/x/manifest.json')
    expect((m.items[0].items[0].items[0].body as { id: string }).id).toBe('https://cdn.example.org/a.wav')
    const first = m.items[0].annotations![0].items[0]
    const bodies = first.body as Array<{ type: string; source?: string }>
    expect(bodies.find((b) => b.type === 'SpecificResource')?.source).toMatch(/^https:\/\/example\.org\/vocab\//)
    expect(m.seeAlso?.[0].id).toBe('https://example.org/x.annotation.json')
  })

  it('annotazioni tagging con frammento temporale, nota come commenting, termine come URI', () => {
    const m = buildIiifManifest(project())
    const pages = m.items[0].annotations!
    const all = pages.flatMap((p) => p.items)
    const a1 = all.find((a) => a.id.endsWith('/annotations/a1'))!
    expect(a1.motivation).toBe('tagging')
    expect(a1.target).toBe('https://atelier.francescomariano.art/iiif/proj-1/canvas/1#t=0,29.939')
    const a1Bodies = a1.body as Array<{ type: string; purpose?: string; value?: string; source?: string }>
    expect(a1Bodies[0]).toMatchObject({ type: 'TextualBody', purpose: 'tagging', language: 'en' })
    expect(a1Bodies[0].value).toContain('Tonic')
    expect(a1Bodies[1]).toMatchObject({ type: 'SpecificResource', purpose: 'classifying', source: 'https://atelier.francescomariano.art/vocab/schaeffer.massa.tonica' })
    const a2 = all.find((a) => a.id.endsWith('/annotations/a2'))!
    expect(a2.motivation).toEqual(['tagging', 'commenting'])
    const a2Bodies = a2.body as Array<{ purpose?: string; value?: string }>
    expect(a2Bodies.find((b) => b.purpose === 'commenting')?.value).toBe('birds in the foreground')
    const a3 = all.find((a) => a.id.endsWith('/annotations/a3'))!
    expect((a3.body as Array<{ value?: string }>)[0].value).toContain('Etichetta orfana')
  })

  it('una pagina per strato in ordine di order, pagina di default per le annotazioni senza strato', () => {
    const pages = buildIiifManifest(project()).items[0].annotations!
    expect(pages.map((p) => p.label?.en?.[0])).toEqual(['Foreground', 'Background', 'Annotations'])
    expect(pages[0].items.map((a) => a.id.split('/').pop())).toEqual(['a3'])
    expect(pages[1].items.map((a) => a.id.split('/').pop())).toEqual(['a2'])
    expect(pages[2].items.map((a) => a.id.split('/').pop())).toEqual(['a1'])
  })

  it('senza strati una sola pagina, senza annotazioni nessuna proprietà annotations', () => {
    const pages = buildIiifManifest(project({ layers: undefined })).items[0].annotations!
    expect(pages).toHaveLength(1)
    expect(pages[0].items).toHaveLength(3)
    const empty = buildIiifManifest(project({ annotations: [], layers: undefined, structure: [] }))
    expect(empty.items[0]).not.toHaveProperty('annotations')
    expect(empty).not.toHaveProperty('structures')
  })

  it('sezioni di struttura come Range ordinate per inizio, item Canvas con #t=', () => {
    const m = buildIiifManifest(project())
    const top = m.structures![0]
    expect(top.label.en[0]).toBe('Structure')
    const children = top.items as unknown as Array<{ label: { en: string[] }; items: Array<{ id: string; type: string }> }>
    expect(children.map((r) => r.label.en[0])).toEqual(['Inizio', 'Sviluppo'])
    expect(children[0].items[0]).toEqual({ id: 'https://atelier.francescomariano.art/iiif/proj-1/canvas/1#t=0,29.939', type: 'Canvas' })
    expect(children[1].items[0].id).toBe('https://atelier.francescomariano.art/iiif/proj-1/canvas/1#t=29.54,155.995')
  })

  it('notazione come annotazioni describing, esclusa se includeNotation è false', () => {
    const withNotation = project({
      notation: [{ id: 'n1', startSec: 10, signId: 'impulso', anchor: 'time', createdAt: now, updatedAt: now }],
    })
    const pages = buildIiifManifest(withNotation).items[0].annotations!
    const notation = pages.find((p) => p.id.endsWith('/annotations/notation'))!
    expect(notation.items[0].motivation).toBe('describing')
    expect(notation.items[0].target).toBe('https://atelier.francescomariano.art/iiif/proj-1/canvas/1#t=10')
    const without = buildIiifManifest(withNotation, { includeNotation: false }).items[0].annotations!
    expect(without.find((p) => p.id.endsWith('/annotations/notation'))).toBeUndefined()
  })

  it('nessun nome di annotatore o autore finisce nel manifest', () => {
    const text = JSON.stringify(buildIiifManifest(project()))
    expect(text).not.toContain('Nome Cognome')
    expect(text).not.toContain('Autore Segreto')
  })

  it('lingua italiana per etichette e pagine', () => {
    const m = buildIiifManifest(project({ metadata: { language: 'it', startedAt: now, title: 'Prova' } }))
    expect(m.label).toEqual({ it: ['Prova'] })
    expect(m.structures![0].label).toEqual({ it: ['Struttura'] })
    const bodies = m.items[0].annotations![0].items[0].body as Array<{ value?: string; language?: string }>
    expect(bodies[0].language).toBe('it')
  })
})

describe('audioFormatFor', () => {
  it('deduce il MIME dall\'estensione con fallback audio/mpeg', () => {
    expect(audioFormatFor('a.wav')).toBe('audio/wav')
    expect(audioFormatFor('A.MP3')).toBe('audio/mpeg')
    expect(audioFormatFor('a.m4a')).toBe('audio/mp4')
    expect(audioFormatFor('senza-estensione')).toBe('audio/mpeg')
  })
})
