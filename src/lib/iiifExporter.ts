// Export IIIF Presentation API 3.0 (issue #1).
// Un progetto di annotazione diventa un Manifest con un solo Canvas audio (sola
// `duration`), dipinto da una risorsa Sound; le annotazioni controllate diventano
// Web Annotation `tagging` (più `commenting` se c'è la nota) ancorate a frammenti
// temporali `#t=inizio,fine`; gli strati diventano AnnotationPage; le sezioni di
// struttura diventano Range in `structures`; i segni di notazione diventano
// annotazioni `describing`. Le relazioni restano fuori (il loro target sarebbe
// un'altra annotazione, non il Canvas).
//
// Regole di robustezza (v2.1.1):
// - i frammenti temporali sono sempre dentro [0, duration] (la specifica vieta
//   contenuti fuori dalle dimensioni del Canvas) e un intervallo di durata zero
//   diventa un punto `#t=inizio`, perché `t=a,a` non è un frammento valido;
// - gli identificatori entrano negli URI con percent-encoding dei soli caratteri
//   vietati (spazi, `#`, `?`, `/`, ...), lasciando intatti i caratteri non ASCII
//   così l'IRI del termine coincide con l'`@id` del vocabolario SKOS
//   (`schaeffer.massa.cannelée`);
// - un termine non più nel vocabolario mantiene l'etichetta ma non riceve un URI
//   `classifying` che non risolverebbe;
// - i valori di `metadata` che iniziano con `<` e finiscono con `>` ricevono uno
//   spazio finale, come raccomanda la specifica per il testo che sembrerebbe HTML;
// - le etichette di interfaccia sono mappe bilingui, i valori senza lingua
//   (date, codici) usano la chiave `none`.
//
// Riferimenti: Presentation API 3.0 (Canvas con sola duration, `annotations`,
// Range con frammento `t=` sull'id del Canvas come nelle ricette 0026 e 0064,
// HTML solo in summary e metadata.value), W3C Web Annotation Data Model
// (motivazioni tagging, commenting, describing, classifying), Media Fragments URI
// 1.0 (`t=inizio,fine`), ricette del Cookbook 0002, 0021, 0026, 0064, 0103.
import type {
  Annotation,
  AnnotationProject,
  Layer,
  NotationMark,
  StructuralSection,
  TaxonomyId,
} from '../types/annotation'
import { getTaxonomy, getTermById, taxonomies, totalTermsCount } from '../data/taxonomies'

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

export interface IiifSeeAlso {
  id: string
  type: string
  format: string
  label: LanguageMap
}

export interface IiifManifest {
  '@context': string
  id: string
  type: 'Manifest'
  label: LanguageMap
  metadata: Array<{ label: LanguageMap; value: LanguageMap }>
  seeAlso: IiifSeeAlso[]
  items: IiifCanvas[]
  structures?: IiifRange[]
}

/** Errore di export con un codice stabile, da tradurre nell'interfaccia. */
export class IiifExportError extends Error {
  code: 'duration'
  constructor(code: 'duration', message: string) {
    super(message)
    this.name = 'IiifExportError'
    this.code = code
  }
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

/** Segmento di percorso per un IRI: percent-encoding dei soli caratteri che un
 * segmento non può contenere (spazio, `#`, `?`, `/`, `%`, parentesi quadre e
 * simili), caratteri non ASCII lasciati intatti (RFC 3987). */
export function encodeIriSegment(s: string): string {
  let out = ''
  for (const ch of nfc(s)) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x80 || /[A-Za-z0-9\-._~!$&'()*+,;=:@]/.test(ch)) out += ch
    else out += encodeURIComponent(ch)
  }
  return out
}

/** Nome file ASCII: minuscole, diacritici rimossi, tutto il resto diventa `-`. */
export function slugify(s: string): string {
  return nfc(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Un URI accettabile come base di manifest o vocabolario e come URL dell'audio:
 * assoluto http(s), senza spazi e senza frammento, perché gli id del Canvas non
 * possono contenere `#` (Presentation 3.0). */
export function isAbsoluteHttpUri(value: string): boolean {
  if (!/^https?:\/\/\S+$/i.test(value) || value.includes('#')) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/** URI base di default del manifest per un progetto (usato anche dalla finestra di export). */
export function defaultBaseUri(project: Pick<AnnotationProject, 'id'>): string {
  return `${DEFAULT_IIIF_BASE}${encodeURIComponent(project.id)}`
}

/** Un valore di `metadata` che inizia con `<` e finisce con `>` verrebbe letto
 * come HTML dai client; la specifica raccomanda uno spazio finale per il testo. */
export function htmlSafeValue(value: string): string {
  const v = nfc(value)
  return v.startsWith('<') && v.endsWith('>') ? `${v} ` : v
}

function langMap(value: string, lang: string): LanguageMap {
  return { [lang]: [nfc(value)] }
}

function pickLang(lang: string): 'it' | 'en' {
  return lang === 'it' ? 'it' : 'en'
}

const bi = (it: string, en: string): LanguageMap => ({ it: [it], en: [en] })

const UI = {
  annotations: bi('Annotazioni', 'Annotations'),
  structure: bi('Struttura', 'Structure'),
  notation: bi('Notazione spettromorfologica', 'Spectromorphological notation'),
  section: bi('Sezione', 'Section'),
  layer: (n: number) => bi(`Strato ${n}`, `Layer ${n}`),
  source: bi('Fonte', 'Source'),
  vocabulary: bi('Vocabolario controllato', 'Controlled vocabulary'),
  language: bi('Lingua di annotazione', 'Annotation language'),
  started: bi('Inizio annotazione', 'Annotation started'),
  genre: bi('Genere', 'Genre'),
  vocabSeeAlso: bi('Vocabolario controllato (SKOS, JSON-LD)', 'Controlled vocabulary (SKOS, JSON-LD)'),
  jsonSeeAlso: bi('JSON di annotazione dell\'Atelier (schema 1.x)', 'Atelier annotation JSON (schema 1.x)'),
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

/** Descrizione del vocabolario in uso, dai dati e non a mano. */
function vocabularySummary(lang: 'it' | 'en'): string {
  const names = taxonomies.map((t) => (lang === 'it' ? t.label_it : t.label_en)).join(', ')
  return lang === 'it'
    ? `${totalTermsCount} termini in ${taxonomies.length} tassonomie (${names})`
    : `${totalTermsCount} terms in ${taxonomies.length} taxonomies (${names})`
}

export function buildIiifManifest(project: AnnotationProject, options: IiifExportOptions = {}): IiifManifest {
  const lang = pickLang(project.metadata?.language ?? 'it')
  const baseUri = (options.baseUri || defaultBaseUri(project)).replace(/\/+$/, '')
  const vocabBase = (options.vocabBase || DEFAULT_VOCAB_BASE).replace(/\/*$/, '/')
  const filename = project.audio.filename || 'audio'
  const audioUrl = options.audioUrl || `${baseUri}/${encodeURIComponent(filename)}`
  const duration = Number(project.audio.durationSeconds)
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new IiifExportError('duration', 'IIIF export: audio duration must be greater than zero')
  }
  const canvasId = `${baseUri}/canvas/1`
  const clamp = (v: number): number => Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), duration)
  const target = (start: number, end?: number): string => {
    const s = formatFragmentSeconds(clamp(start))
    const e = end === undefined ? s : formatFragmentSeconds(clamp(end))
    return e === s || Number(e) < Number(s) ? `${canvasId}#t=${s}` : `${canvasId}#t=${s},${e}`
  }
  const termUri = (id: string): string => `${vocabBase}${encodeIriSegment(id)}`
  const stamp = (a: { createdAt?: string; updatedAt?: string }): Pick<IiifAnnotation, 'created' | 'modified'> => {
    const out: Pick<IiifAnnotation, 'created' | 'modified'> = {}
    if (a.createdAt) out.created = a.createdAt
    if (a.updatedAt) out.modified = a.updatedAt
    return out
  }

  // Pagine di annotazione: una per strato (ordinate per `order`), più una di default.
  const layers: Layer[] = [...(project.layers ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const pages = new Map<string, IiifAnnotationPage>()
  layers.forEach((layer, i) => {
    pages.set(layer.id, {
      id: `${canvasId}/annotations/page/${i + 1}`,
      type: 'AnnotationPage',
      label: layer.name?.trim() ? langMap(layer.name, lang) : UI.layer(i + 1),
      items: [],
    })
  })
  const defaultPage = (): IiifAnnotationPage => {
    let page = pages.get('__default__')
    if (!page) {
      page = {
        id: `${canvasId}/annotations/page/${pages.size + 1}`,
        type: 'AnnotationPage',
        label: UI.annotations,
        items: [],
      }
      pages.set('__default__', page)
    }
    return page
  }

  for (const a of project.annotations ?? []) {
    const bodies: IiifBody[] = [
      { type: 'TextualBody', purpose: 'tagging', format: 'text/plain', language: lang, value: describeTerm(a, lang) },
    ]
    if (getTermById(a.termId)) {
      bodies.push({ type: 'SpecificResource', purpose: 'classifying', source: termUri(a.termId) })
    }
    const note = nfc(a.note).trim()
    if (note) bodies.push({ type: 'TextualBody', purpose: 'commenting', format: 'text/plain', language: lang, value: note })
    const annotation: IiifAnnotation = {
      id: `${canvasId}/annotations/${encodeIriSegment(a.id)}`,
      type: 'Annotation',
      motivation: note ? ['tagging', 'commenting'] : 'tagging',
      ...stamp(a),
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
      label: UI.notation,
      items: (project.notation as NotationMark[]).map((n) => ({
        id: `${canvasId}/annotations/notation/${encodeIriSegment(n.id)}`,
        type: 'Annotation',
        motivation: 'describing',
        ...stamp(n),
        body: [
          { type: 'TextualBody', purpose: 'describing', format: 'text/plain', language: lang, value: nfc(n.label || n.signId) },
          { type: 'SpecificResource', purpose: 'classifying', source: termUri(`notation.${n.signId}`) },
        ],
        target: target(n.startSec, n.endSec),
      })),
    }
    annotationPages.push(notationPage)
  }

  const canvas: IiifCanvas = {
    id: canvasId,
    type: 'Canvas',
    label: langMap(filename, 'none'),
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
    label: langMap(title, project.metadata?.title?.trim() ? lang : 'none'),
    metadata: [
      {
        label: UI.source,
        value: bi(
          `Soundscape Annotation Atelier, schema di annotazione ${project.schemaVersion}`,
          `Soundscape Annotation Atelier, annotation schema ${project.schemaVersion}`,
        ),
      },
      { label: UI.vocabulary, value: bi(vocabularySummary('it'), vocabularySummary('en')) },
      { label: UI.language, value: { none: [lang] } },
    ],
    seeAlso: [
      {
        id: `${vocabBase}index.json`,
        type: 'Dataset',
        format: 'application/ld+json',
        label: UI.vocabSeeAlso,
      },
    ],
    items: [canvas],
  }
  if (project.metadata?.startedAt) {
    manifest.metadata.push({ label: UI.started, value: { none: [project.metadata.startedAt] } })
  }
  if (project.metadata?.genre?.trim()) {
    manifest.metadata.push({ label: UI.genre, value: langMap(htmlSafeValue(project.metadata.genre.trim()), lang) })
  }
  if (options.atelierJsonUrl) {
    manifest.seeAlso.push({
      id: options.atelierJsonUrl,
      type: 'Dataset',
      format: 'application/json',
      label: UI.jsonSeeAlso,
    })
  }

  const sections: StructuralSection[] = [...(project.structure ?? [])].sort((a, b) => a.startSec - b.startSec)
  if (sections.length > 0) {
    manifest.structures = [
      {
        id: `${baseUri}/range/structure`,
        type: 'Range',
        label: UI.structure,
        items: sections.map((s) => ({
          id: `${baseUri}/range/${encodeIriSegment(s.id)}`,
          type: 'Range' as const,
          label: s.label?.trim() ? langMap(s.label, lang) : UI.section,
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
