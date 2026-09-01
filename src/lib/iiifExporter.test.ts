import { describe, expect, it } from 'vitest'
import type { AnnotationProject } from '../types/annotation'
import { totalTermsCount } from '../data/taxonomies'
import {
  IiifExportError,
  audioFormatFor,
  buildIiifManifest,
  defaultBaseUri,
  encodeIriSegment,
  formatFragmentSeconds,
  htmlSafeValue,
  isAbsoluteHttpUri,
  slugify,
} from './iiifExporter'

const now = '2026-09-01T10:00:00.000Z'
const CANVAS = 'https://atelier.francescomariano.art/iiif/proj-1/canvas/1'

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

type Body = { type: string; purpose?: string; value?: string; source?: string; language?: string }
const allAnnotations = (m: ReturnType<typeof buildIiifManifest>) => (m.items[0].annotations ?? []).flatMap((p) => p.items)
const bodiesOf = (m: ReturnType<typeof buildIiifManifest>, suffix: string): Body[] =>
  allAnnotations(m).find((a) => a.id.endsWith(suffix))!.body as Body[]

describe('formatFragmentSeconds', () => {
  it('tre decimali al massimo, senza zeri finali, mai negativo', () => {
    expect(formatFragmentSeconds(29.939398)).toBe('29.939')
    expect(formatFragmentSeconds(0)).toBe('0')
    expect(formatFragmentSeconds(180.736)).toBe('180.736')
    expect(formatFragmentSeconds(-1)).toBe('0')
    expect(formatFragmentSeconds(Number.NaN)).toBe('0')
  })
})

describe('encodeIriSegment e slugify', () => {
  it('codifica solo i caratteri vietati in un segmento, lascia i non ASCII', () => {
    expect(encodeIriSegment('schaeffer.massa.cannelée')).toBe('schaeffer.massa.cannelée')
    expect(encodeIriSegment('a 1#2/3?4%5')).toBe('a%201%232%2F3%3F4%255')
    expect(encodeIriSegment('id"<>[]{}|\\^`')).toBe('id%22%3C%3E%5B%5D%7B%7D%7C%5C%5E%60')
    expect(encodeIriSegment('ok-._~!$&\'()*+,;=:@')).toBe('ok-._~!$&\'()*+,;=:@')
    // Forma NFD in ingresso, NFC in uscita (stesso IRI del vocabolario).
    expect(encodeIriSegment('cannelée')).toBe('cannelée')
  })

  it('slug ASCII senza diacritici', () => {
    expect(slugify('Perché no? Città & campagna')).toBe('perche-no-citta-campagna')
    expect(slugify('  ---  ')).toBe('')
    expect(slugify('Presque Rien No. 1')).toBe('presque-rien-no-1')
  })

  it('isAbsoluteHttpUri accetta solo http(s) assoluti senza frammento', () => {
    expect(isAbsoluteHttpUri('https://example.org/iiif/x')).toBe(true)
    expect(isAbsoluteHttpUri('http://localhost:8080/v/')).toBe(true)
    expect(isAbsoluteHttpUri('iiif/x')).toBe(false)
    expect(isAbsoluteHttpUri('ftp://example.org/x')).toBe(false)
    expect(isAbsoluteHttpUri('https://example.org/x#frag')).toBe(false)
    expect(isAbsoluteHttpUri('https://example.org/a b')).toBe(false)
    expect(isAbsoluteHttpUri('https://')).toBe(false)
  })

  it('htmlSafeValue aggiunge lo spazio finale solo al testo che sembra HTML', () => {
    expect(htmlSafeValue('<experimental>')).toBe('<experimental> ')
    expect(htmlSafeValue('field recording')).toBe('field recording')
    expect(htmlSafeValue('a < b')).toBe('a < b')
  })
})

describe('buildIiifManifest', () => {
  it('canvas audio con sola duration, dipinto da una risorsa Sound', () => {
    const m = buildIiifManifest(project())
    expect(m['@context']).toBe('http://iiif.io/api/presentation/3/context.json')
    expect(m.type).toBe('Manifest')
    expect(m.id).toBe('https://atelier.francescomariano.art/iiif/proj-1/manifest.json')
    expect(defaultBaseUri(project())).toBe('https://atelier.francescomariano.art/iiif/proj-1')
    const canvas = m.items[0]
    expect(canvas.type).toBe('Canvas')
    expect(canvas.duration).toBe(180.736)
    expect(canvas).not.toHaveProperty('width')
    expect(canvas).not.toHaveProperty('height')
    expect(canvas.label).toEqual({ none: ['campo 1.wav'] })
    const painting = canvas.items[0].items[0]
    expect(painting.motivation).toBe('painting')
    expect(painting.body).toMatchObject({ type: 'Sound', format: 'audio/wav', duration: 180.736 })
    expect((painting.body as { id: string }).id).toBe('https://atelier.francescomariano.art/iiif/proj-1/campo%201.wav')
    expect(painting.target).toBe(canvas.id)
  })

  it('rifiuta una durata assente o non positiva', () => {
    const broken = project({ audio: { filename: 'x.wav', durationSeconds: 0, sampleRate: 48000, channels: 1 } })
    expect(() => buildIiifManifest(broken)).toThrow(IiifExportError)
    const nan = project({ audio: { filename: 'x.wav', durationSeconds: Number.NaN, sampleRate: 48000, channels: 1 } })
    expect(() => buildIiifManifest(nan)).toThrow(/duration/)
  })

  it('rispetta baseUri, audioUrl e vocabBase passati come opzioni, con o senza slash finale', () => {
    const m = buildIiifManifest(project(), {
      baseUri: 'https://example.org/iiif/x/',
      audioUrl: 'https://cdn.example.org/a.wav',
      vocabBase: 'https://example.org/vocab',
      atelierJsonUrl: 'https://example.org/x.annotation.json',
    })
    expect(m.id).toBe('https://example.org/iiif/x/manifest.json')
    expect((m.items[0].items[0].items[0].body as { id: string }).id).toBe('https://cdn.example.org/a.wav')
    const bodies = bodiesOf(m, '/annotations/a2')
    expect(bodies.find((b) => b.type === 'SpecificResource')?.source).toBe('https://example.org/vocab/krause.biophony')
    expect(m.seeAlso.map((s) => s.id)).toEqual(['https://example.org/vocab/index.json', 'https://example.org/x.annotation.json'])
    expect(m.seeAlso[0]).toMatchObject({ type: 'Dataset', format: 'application/ld+json' })
  })

  it('annotazioni tagging con frammento temporale, nota come commenting, termine come URI', () => {
    const m = buildIiifManifest(project())
    const all = allAnnotations(m)
    const a1 = all.find((a) => a.id.endsWith('/annotations/a1'))!
    expect(a1.motivation).toBe('tagging')
    expect(a1.target).toBe(`${CANVAS}#t=0,29.939`)
    expect(a1.created).toBe(now)
    expect(a1.modified).toBe(now)
    const a1Bodies = a1.body as Body[]
    expect(a1Bodies[0]).toMatchObject({ type: 'TextualBody', purpose: 'tagging', language: 'en', format: 'text/plain' })
    expect(a1Bodies[0].value).toContain('Tonic')
    expect(a1Bodies[1]).toMatchObject({ type: 'SpecificResource', purpose: 'classifying', source: 'https://atelier.francescomariano.art/vocab/schaeffer.massa.tonica' })
    const a2 = all.find((a) => a.id.endsWith('/annotations/a2'))!
    expect(a2.motivation).toEqual(['tagging', 'commenting'])
    expect((a2.body as Body[]).find((b) => b.purpose === 'commenting')?.value).toBe('birds in the foreground')
  })

  it('termine orfano: etichetta con la tassonomia, nessun URI classifying che non risolve', () => {
    const bodies = bodiesOf(buildIiifManifest(project()), '/annotations/a3')
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({ type: 'TextualBody', purpose: 'tagging' })
    expect(bodies[0].value).toMatch(/^Etichetta orfana \(Schafer, [a-z ]+\)$/)
  })

  it('una pagina per strato in ordine di order, pagina di default per le annotazioni senza strato', () => {
    const pages = buildIiifManifest(project()).items[0].annotations!
    expect(pages.map((p) => p.label?.en?.[0])).toEqual(['Foreground', 'Background', 'Annotations'])
    expect(pages[2].label).toEqual({ it: ['Annotazioni'], en: ['Annotations'] })
    expect(pages[0].items.map((a) => a.id.split('/').pop())).toEqual(['a3'])
    expect(pages[1].items.map((a) => a.id.split('/').pop())).toEqual(['a2'])
    expect(pages[2].items.map((a) => a.id.split('/').pop())).toEqual(['a1'])
  })

  it('strato senza nome e annotazione con layerId orfano', () => {
    const m = buildIiifManifest(
      project({
        layers: [{ id: 'L9', name: '  ', order: 0 }],
        annotations: [{ ...project().annotations[0], layerId: 'inesistente' }, { ...project().annotations[1], layerId: 'L9' }],
      }),
    )
    const pages = m.items[0].annotations!
    expect(pages[0].label).toEqual({ it: ['Strato 1'], en: ['Layer 1'] })
    expect(pages[0].items.map((a) => a.id.split('/').pop())).toEqual(['a2'])
    expect(pages[1].label).toEqual({ it: ['Annotazioni'], en: ['Annotations'] })
    expect(pages[1].items.map((a) => a.id.split('/').pop())).toEqual(['a1'])
  })

  it('senza strati una sola pagina, progetto vuoto senza annotations né structures', () => {
    const pages = buildIiifManifest(project({ layers: undefined })).items[0].annotations!
    expect(pages).toHaveLength(1)
    expect(pages[0].items).toHaveLength(3)
    const empty = buildIiifManifest(project({ annotations: [], layers: undefined, structure: [] }))
    expect(empty.items[0]).not.toHaveProperty('annotations')
    expect(empty).not.toHaveProperty('structures')
    expect(empty.items[0].items[0].items[0].motivation).toBe('painting')
    expect(empty.seeAlso).toHaveLength(1)
  })

  it('annotazioni sovrapposte restano indipendenti, durata zero e fine prima dell\'inizio diventano punti', () => {
    const base = project().annotations[0]
    const m = buildIiifManifest(
      project({
        layers: undefined,
        annotations: [
          { ...base, id: 'o1', startSec: 10, endSec: 20 },
          { ...base, id: 'o2', startSec: 15, endSec: 25 },
          { ...base, id: 'z1', startSec: 42.5, endSec: 42.5 },
          { ...base, id: 'z2', startSec: 42.5, endSec: 42.5004 },
          { ...base, id: 'r1', startSec: 50, endSec: 40 },
        ],
      }),
    )
    const byId = Object.fromEntries(allAnnotations(m).map((a) => [a.id.split('/').pop(), a.target]))
    expect(byId.o1).toBe(`${CANVAS}#t=10,20`)
    expect(byId.o2).toBe(`${CANVAS}#t=15,25`)
    expect(byId.z1).toBe(`${CANVAS}#t=42.5`)
    expect(byId.z2).toBe(`${CANVAS}#t=42.5`)
    expect(byId.r1).toBe(`${CANVAS}#t=50`)
  })

  it('marker fuori dalla durata vengono riportati dentro il canvas', () => {
    const base = project().annotations[0]
    const m = buildIiifManifest(
      project({
        layers: undefined,
        annotations: [
          { ...base, id: 'over', startSec: 170, endSec: 999 },
          { ...base, id: 'beyond', startSec: 500, endSec: 600 },
          { ...base, id: 'neg', startSec: -3, endSec: 4 },
          { ...base, id: 'nan', startSec: Number.NaN, endSec: 4 },
        ],
        structure: [{ id: 'sx', startSec: 100, endSec: 1000, label: 'Coda' }],
        notation: [{ id: 'nx', startSec: 181, signId: 'tipologia.impulso', anchor: 'time', createdAt: now, updatedAt: now }],
      }),
    )
    const byId = Object.fromEntries(allAnnotations(m).map((a) => [a.id.split('/').pop(), a.target]))
    expect(byId.over).toBe(`${CANVAS}#t=170,180.736`)
    expect(byId.beyond).toBe(`${CANVAS}#t=180.736`)
    expect(byId.neg).toBe(`${CANVAS}#t=0,4`)
    expect(byId.nan).toBe(`${CANVAS}#t=0,4`)
    expect(byId.nx).toBe(`${CANVAS}#t=180.736`)
    const range = m.structures![0].items[0] as { items: Array<{ id: string }> }
    expect(range.items[0].id).toBe(`${CANVAS}#t=100,180.736`)
  })

  it('sezioni di struttura come Range ordinate per inizio, item Canvas con #t=', () => {
    const m = buildIiifManifest(project())
    const top = m.structures![0]
    expect(top.label).toEqual({ it: ['Struttura'], en: ['Structure'] })
    const children = top.items as unknown as Array<{ label: { en: string[] }; items: Array<{ id: string; type: string }> }>
    expect(children.map((r) => r.label.en[0])).toEqual(['Inizio', 'Sviluppo'])
    expect(children[0].items[0]).toEqual({ id: `${CANVAS}#t=0,29.939`, type: 'Canvas' })
    expect(children[1].items[0].id).toBe(`${CANVAS}#t=29.54,155.995`)
  })

  it('notazione come annotazioni describing con URI notation.<segno>, esclusa se includeNotation è false', () => {
    const withNotation = project({
      notation: [
        { id: 'n1', startSec: 10, signId: 'tipologia.impulso', anchor: 'time', createdAt: now, updatedAt: now },
        { id: 'n2', startSec: 20, endSec: 24, signId: 'moto.gesto', label: 'gesto iniziale', anchor: 'time', createdAt: '', updatedAt: '' },
      ],
    })
    const pages = buildIiifManifest(withNotation).items[0].annotations!
    const notation = pages.find((p) => p.id.endsWith('/annotations/notation'))!
    expect(notation.label).toEqual({ it: ['Notazione spettromorfologica'], en: ['Spectromorphological notation'] })
    expect(notation.items[0].motivation).toBe('describing')
    expect(notation.items[0].target).toBe(`${CANVAS}#t=10`)
    expect((notation.items[0].body as Body[])[1].source).toBe('https://atelier.francescomariano.art/vocab/notation.tipologia.impulso')
    expect(notation.items[1].target).toBe(`${CANVAS}#t=20,24`)
    expect((notation.items[1].body as Body[])[0].value).toBe('gesto iniziale')
    expect(notation.items[1]).not.toHaveProperty('created')
    const without = buildIiifManifest(withNotation, { includeNotation: false }).items[0].annotations!
    expect(without.find((p) => p.id.endsWith('/annotations/notation'))).toBeUndefined()
  })

  it('identificatori con caratteri speciali entrano negli URI codificati, i non ASCII restano', () => {
    const base = project().annotations[0]
    const m = buildIiifManifest(
      project({
        layers: undefined,
        annotations: [{ ...base, id: 'a 1#x', termId: 'schaeffer.massa.cannelée', taxonomy: 'schaeffer' }],
        structure: [{ id: 's/1', startSec: 0, endSec: 10, label: 'Inizio' }],
        notation: [{ id: 'n?1', startSec: 1, signId: 'tipologia.impulso', anchor: 'time', createdAt: now, updatedAt: now }],
      }),
    )
    const ids = allAnnotations(m).map((a) => a.id)
    expect(ids).toContain(`${CANVAS}/annotations/a%201%23x`)
    expect(ids).toContain(`${CANVAS}/annotations/notation/n%3F1`)
    expect(bodiesOf(m, 'a%201%23x')[1].source).toBe('https://atelier.francescomariano.art/vocab/schaeffer.massa.cannelée')
    expect((m.structures![0].items[0] as { id: string }).id).toBe('https://atelier.francescomariano.art/iiif/proj-1/range/s%2F1')
  })

  it('caratteri speciali nei titoli restano testo, i valori dei metadata non sembrano HTML', () => {
    const m = buildIiifManifest(
      project({
        metadata: {
          language: 'it', startedAt: now,
          title: 'Perché "no" & <si>: prova',
          genre: '<field recording>',
        },
      }),
    )
    expect(m.label).toEqual({ it: ['Perché "no" & <si>: prova'] })
    const genre = m.metadata.find((e) => e.label.en[0] === 'Genre')!
    expect(genre.value).toEqual({ it: ['<field recording> '] })
    // Forma NFD nel titolo, NFC nel manifest.
    const nfd = buildIiifManifest(project({ metadata: { language: 'it', startedAt: now, title: 'cannelée' } }))
    expect(nfd.label.it[0]).toBe('cannelée')
  })

  it('metadata bilingui dai dati del vocabolario, valori senza lingua con la chiave none', () => {
    const m = buildIiifManifest(project())
    const labels = m.metadata.map((e) => e.label)
    expect(labels[0]).toEqual({ it: ['Fonte'], en: ['Source'] })
    expect(m.metadata[0].value.en[0]).toBe('Soundscape Annotation Atelier, annotation schema 1.0')
    expect(m.metadata[1].value.en[0]).toMatch(new RegExp(`^${totalTermsCount} terms in 8 taxonomies \\(Schaeffer`))
    expect(m.metadata[1].value.it[0]).toMatch(new RegExp(`^${totalTermsCount} termini in 8 tassonomie`))
    expect(m.metadata[2].value).toEqual({ none: ['en'] })
    expect(m.metadata[3].value).toEqual({ none: [now] })
    expect(m.metadata.find((e) => e.label.en[0] === 'Genre')).toBeUndefined()
  })

  it('nessun nome di annotatore o autore finisce nel manifest', () => {
    const text = JSON.stringify(buildIiifManifest(project()))
    expect(text).not.toContain('Nome Cognome')
    expect(text).not.toContain('Autore Segreto')
  })

  it('lingua italiana per etichette, pagine e testi, titolo assente con chiave none', () => {
    const m = buildIiifManifest(project({ metadata: { language: 'it', startedAt: now, title: 'Prova' } }))
    expect(m.label).toEqual({ it: ['Prova'] })
    expect(m.structures![0].label.it).toEqual(['Struttura'])
    const bodies = m.items[0].annotations![0].items[0].body as Body[]
    expect(bodies[0].language).toBe('it')
    expect(bodies[0].value).toMatch(/^Etichetta orfana \(Schafer, paesaggio sonoro\)$/)
    const untitled = buildIiifManifest(project({ metadata: { language: 'it', startedAt: now } }))
    expect(untitled.label).toEqual({ none: ['campo 1.wav'] })
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
