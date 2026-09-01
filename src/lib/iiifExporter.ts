// Export IIIF Presentation API 3.0 (issue #1).
// Un progetto di annotazione diventa un Manifest con un solo Canvas audio (sola
// `duration`), dipinto da una risorsa Sound; le annotazioni controllate diventano
// Web Annotation `tagging` (più `commenting` se c'è la nota) ancorate a frammenti
// temporali `#t=inizio,fine`; gli strati diventano AnnotationPage; le sezioni di
// struttura diventano Range in `structures`; i segni di notazione diventano
// annotazioni `describing`. Le relazioni restano fuori (il loro target sarebbe
// un'altra annotazione, non il Canvas).
//
// Riferimenti: Presentation API 3.0 (Canvas con sola duration, `annotations`,
// Range, media fragment `#t=`), W3C Web Annotation Data Model (motivazioni
// tagging, commenting, describing, classifying), ricette del Cookbook 0002,
// 0103, 0021, 0064.
import type {
  Annotation,
  AnnotationProject,
  Layer,
  NotationMark,
  StructuralSection,
  TaxonomyId,
} from '../types/annotation'
import { getTaxonomy, getTermById } from '../data/taxonomies'

export const DEFAULT_IIIF_BASE = 'https://atelier.francescomariano.art/iiif/'
export const DEFAULT_VOCAB_BASE = 'https://atelier.francescomariano.art/vocab/'

export interface IiifExportOptions {
  /** URI base del manifest (senza slash finale). Default DEFAULT_IIIF_BASE + id progetto. */
  baseUri?: string
  /** URL pubblico dell'audio. Default `<baseUri>/<nome file>`. L'Atelier non carica audio. */
  audioUrl?: string
  /** Base degli URI del vocabolario (con slash finale). Default DEFAULT_VOCAB_BASE. */
  vocabBase?: string
  /** URL del JSON dell'Atelier, se pubblicato (va in seeAlso). */
  atelierJsonUrl?: string
  /** Includere i segni di notazione come annotazioni `describing`. Default true. */
  includeNotation?: boolean
}

export type LanguageMap = Record<string, string[]>

export interface IiifBody {
  type: 'TextualBody' | 'SpecificResource'
  purpose?: string
  format?: string
  language?: string
  value?: string
  source?: string
}

export interface IiifAnnotation {
  id: string
  type: 'Annotation'
  motivation: string | string[]
  created?: string
  modified?: string
  body: IiifBody[] | Record<string, unknown>
  target: string
}

export interface IiifAnnotationPage {
  id: string
  type: 'AnnotationPage'
  label?: LanguageMap
  items: IiifAnnotation[]
}

export interface IiifRange {
  id: string
  type: 'Range'
  label: LanguageMap
  items: Array<IiifRange | { id: string; type: 'Canvas' }>
}

export interface IiifCanvas {
  id: string
  type: 'Canvas'
  label: LanguageMap
  duration: number
  items: IiifAnnotationPage[]
  annotations?: IiifAnnotationPage[]
}

export interface IiifManifest {
  '@context': string
  id: string
  type: 'Manifest'
  label: LanguageMap
  metadata: Array<{ label: LanguageMap; value: LanguageMap }>
  seeAlso?: Array<{ id: string; type: string; format: string; label: LanguageMap }>
  items: IiifCanvas[]
  structures?: IiifRange[]
}

const MIME_BY_EXT: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
}

const nfc = (s: string | undefined | null): string => (s ?? '').normalize('NFC')

/** Secondi nella sintassi dei media fragment: fino a tre decimali, senza zeri finali. */
export function formatFragmentSeconds(value: number): string {
  const v = Number.isFinite(value) && value > 0 ? value : 0
  return String(Number(v.toFixed(3)))
}

export function audioFormatFor(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  return MIME_BY_EXT[ext] ?? 'audio/mpeg'
}

function langMap(value: string, lang: string): LanguageMap {
  return { [lang]: [nfc(value)] }
}

function pickLang(lang: string): 'it' | 'en' {
  return lang === 'it' ? 'it' : 'en'
}

const UI: Record<'it' | 'en', Record<string, string>> = {
  it: { annotations: 'Annotazioni', structure: 'Struttura', notation: 'Notazione spettromorfologica', section: 'Sezione' },
  en: { annotations: 'Annotations', structure: 'Structure', notation: 'Spectromorphological notation', section: 'Section' },
}

/** Etichetta leggibile del termine, dal vocabolario se il termine esiste ancora. */
export function describeTerm(a: Annotation, lang: 'it' | 'en'): string {
  const found = getTermById(a.termId)
  if (found) {
    const termLabel = lang === 'it' ? found.term.label_it : found.term.label_en
    const taxLabel = lang === 'it' ? found.taxonomy.label_it : found.taxonomy.label_en
    const groupLabel = lang === 'it' ? found.group.label_it : found.group.label_en
    return `${termLabel} (${taxLabel}, ${groupLabel})`
  }
  const tax = getTaxonomy(a.taxonomy as TaxonomyId)
  const taxLabel = tax ? (lang === 'it' ? tax.label_it : tax.label_en) : a.taxonomy
  return `${a.termLabel || a.termId} (${taxLabel})`
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildIiifManifest(project: AnnotationProject, options: IiifExportOptions = {}): IiifManifest {
  const lang = pickLang(project.metadata?.language ?? 'it')
  const ui = UI[lang]
  const baseUri = (options.baseUri || `${DEFAULT_IIIF_BASE}${encodeURIComponent(project.id)}`).replace(/\/+$/, '')
  const vocabBase = options.vocabBase || DEFAULT_VOCAB_BASE
  const filename = project.audio.filename || 'audio'
  const audioUrl = options.audioUrl || `${baseUri}/${encodeURIComponent(filename)}`
  const duration = Number(project.audio.durationSeconds) || 0
  const canvasId = `${baseUri}/canvas/1`
  const target = (start: number, end?: number): string =>
    end === undefined
      ? `${canvasId}#t=${formatFragmentSeconds(start)}`
      : `${canvasId}#t=${formatFragmentSeconds(start)},${formatFragmentSeconds(end)}`

  // Pagine di annotazione: una per strato (ordinate per `order`), più una di default.
  const layers: Layer[] = [...(project.layers ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const pages = new Map<string, IiifAnnotationPage>()
  layers.forEach((layer, i) => {
    pages.set(layer.id, {
      id: `${canvasId}/annotations/page/${i + 1}`,
      type: 'AnnotationPage',
      label: langMap(layer.name || `Layer ${i + 1}`, lang),
      items: [],
    })
  })
  const defaultPage = (): IiifAnnotationPage => {
    let page = pages.get('__default__')
    if (!page) {
      page = {
        id: `${canvasId}/annotations/page/${pages.size + 1}`,
        type: 'AnnotationPage',
        label: langMap(ui.annotations, lang),
        items: [],
      }
      pages.set('__default__', page)
    }
    return page
  }

  for (const a of project.annotations ?? []) {
    const bodies: IiifBody[] = [
      { type: 'TextualBody', purpose: 'tagging', format: 'text/plain', language: lang, value: describeTerm(a, lang) },
      { type: 'SpecificResource', purpose: 'classifying', source: `${vocabBase}${a.termId}` },
    ]
    const note = nfc(a.note).trim()
    if (note) bodies.push({ type: 'TextualBody', purpose: 'commenting', format: 'text/plain', language: lang, value: note })
    const annotation: IiifAnnotation = {
      id: `${canvasId}/annotations/${a.id}`,
      type: 'Annotation',
      motivation: note ? ['tagging', 'commenting'] : 'tagging',
      created: a.createdAt,
      modified: a.updatedAt,
      body: bodies,
      target: target(a.startSec, a.endSec),
    }
    const page = a.layerId && pages.has(a.layerId) ? pages.get(a.layerId)! : defaultPage()
    page.items.push(annotation)
  }

  const annotationPages = [...pages.values()].filter((p) => p.items.length > 0)

  if (options.includeNotation !== false && (project.notation ?? []).length > 0) {
    const notationPage: IiifAnnotationPage = {
      id: `${canvasId}/annotations/notation`,
      type: 'AnnotationPage',
      label: langMap(ui.notation, lang),
      items: (project.notation as NotationMark[]).map((n) => ({
        id: `${canvasId}/annotations/notation/${n.id}`,
        type: 'Annotation',
        motivation: 'describing',
        created: n.createdAt,
        modified: n.updatedAt,
        body: [
          { type: 'TextualBody', purpose: 'describing', format: 'text/plain', language: lang, value: nfc(n.label || n.signId) },
          { type: 'SpecificResource', purpose: 'classifying', source: `${vocabBase}notation/${n.signId}` },
        ],
        target: target(n.startSec, n.endSec),
      })),
    }
    annotationPages.push(notationPage)
  }

  const canvas: IiifCanvas = {
    id: canvasId,
    type: 'Canvas',
    label: langMap(filename, lang),
    duration,
    items: [
      {
        id: `${canvasId}/page/1`,
        type: 'AnnotationPage',
        items: [
          {
            id: `${canvasId}/page/1/annotation/1`,
            type: 'Annotation',
            motivation: 'painting',
            body: { id: audioUrl, type: 'Sound', format: audioFormatFor(filename), duration },
            target: canvasId,
          },
        ],
      },
    ],
  }
  if (annotationPages.length > 0) canvas.annotations = annotationPages

  const title = project.metadata?.title?.trim() || filename
  const manifest: IiifManifest = {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: `${baseUri}/manifest.json`,
    type: 'Manifest',
    label: langMap(title, lang),
    metadata: [
      {
        label: { en: ['Source'] },
        value: { en: [`Soundscape Annotation Atelier, annotation schema ${project.schemaVersion}`] },
      },
      {
        label: { en: ['Controlled vocabulary'] },
        value: { en: ['128 terms in 8 taxonomies (Schaeffer, Smalley, Schafer, Krause, Chion, Truax, Westerkamp, Wishart)'] },
      },
      { label: { en: ['Annotation language'] }, value: { en: [lang] } },
    ],
    items: [canvas],
  }
  if (project.metadata?.startedAt) {
    manifest.metadata.push({ label: { en: ['Annotation started'] }, value: { en: [project.metadata.startedAt] } })
  }
  if (project.metadata?.genre) {
    manifest.metadata.push({ label: { en: ['Genre'] }, value: { en: [nfc(project.metadata.genre)] } })
  }
  if (options.atelierJsonUrl) {
    manifest.seeAlso = [
      {
        id: options.atelierJsonUrl,
        type: 'Dataset',
        format: 'application/json',
        label: { en: ['Atelier annotation JSON (schema 1.x)'] },
      },
    ]
  }

  const sections: StructuralSection[] = [...(project.structure ?? [])].sort((a, b) => a.startSec - b.startSec)
  if (sections.length > 0) {
    manifest.structures = [
      {
        id: `${baseUri}/range/structure`,
        type: 'Range',
        label: langMap(ui.structure, lang),
        items: sections.map((s) => ({
          id: `${baseUri}/range/${s.id}`,
          type: 'Range' as const,
          label: langMap(s.label || ui.section, lang),
          items: [{ id: target(s.startSec, s.endSec), type: 'Canvas' as const }],
        })),
      },
    ]
  }
  return manifest
}

/** Scarica il manifest come `<slug>.manifest.json`. */
export function exportProjectIiif(project: AnnotationProject, options: IiifExportOptions = {}): IiifManifest {
  const manifest = buildIiifManifest(project, options)
  const slug = slugify(project.metadata.title || project.audio.filename || 'annotation') || 'annotation'
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug}.manifest.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return manifest
}
