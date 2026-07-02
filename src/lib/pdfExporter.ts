import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnnotationProject } from '../types/annotation'
import { getEntityLabel } from './entityLookup'
import { taxonomies } from '../data/taxonomies'
import { formatDuration, formatTime } from './format'

const FONT_URL = '/fonts/NotoSans-Regular.ttf'
const FONT_NAME = 'NotoSans'

let fontBase64: string | null = null

async function ensureFont(): Promise<string> {
  if (fontBase64) return fontBase64
  const response = await fetch(FONT_URL)
  if (!response.ok) throw new Error(`Cannot fetch font: ${response.status}`)
  const buffer = await response.arrayBuffer()
  fontBase64 = arrayBufferToBase64(buffer)
  return fontBase64
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'annotation'
}

interface ExportLabels {
  cover: { kicker: string; title: string; author: string; year: string; annotator: string; generated: string }
  meta: { title: string; filename: string; duration: string; sampleRate: string; channels: string; language: string; startedAt: string }
  stats: { title: string; annotations: string; structure: string; taxonomies: string }
  annotations: { title: string; range: string; taxonomy: string; term: string; note: string; empty: string }
  structure: { title: string; range: string; label: string; note: string; empty: string }
  relations: { title: string; from: string; to: string; type: string; empty: string; types: Record<string, string> }
  footer: string
}

const labels: Record<'it' | 'en', ExportLabels> = {
  it: {
    cover: {
      kicker: 'Soundscape Annotation Atelier',
      title: 'Titolo',
      author: 'Autore',
      year: 'Anno',
      annotator: 'Annotatore',
      generated: 'Generato il',
    },
    meta: {
      title: 'Metadati del progetto',
      filename: 'File',
      duration: 'Durata',
      sampleRate: 'Sample rate',
      channels: 'Canali',
      language: 'Lingua annotazione',
      startedAt: 'Inizio annotazione',
    },
    stats: {
      title: 'Statistiche',
      annotations: 'Annotazioni controllate',
      structure: 'Sezioni strutturali',
      taxonomies: 'Distribuzione tassonomica',
    },
    annotations: {
      title: 'Annotazioni controllate',
      range: 'Range',
      taxonomy: 'Tassonomia',
      term: 'Termine',
      note: 'Nota',
      empty: 'Nessuna annotazione controllata.',
    },
    structure: {
      title: 'Sezioni strutturali',
      range: 'Range',
      label: 'Etichetta',
      note: 'Nota',
      empty: 'Nessuna sezione strutturale.',
    },
    relations: {
      title: 'Relazioni (form-building)',
      from: 'Da',
      to: 'A',
      type: 'Tipo',
      empty: 'Nessuna relazione.',
      types: {
        transformation: 'Trasformazione', repetition: 'Ripetizione', variation: 'Variazione',
        contrast: 'Contrasto', development: 'Sviluppo', return: 'Ritorno',
        progression: 'Progressione', dissolution: 'Dissoluzione',
      },
    },
    footer: 'Soundscape Annotation Atelier - companion of soundscape-audio-analysis',
  },
  en: {
    cover: {
      kicker: 'Soundscape Annotation Atelier',
      title: 'Title',
      author: 'Author',
      year: 'Year',
      annotator: 'Annotator',
      generated: 'Generated on',
    },
    meta: {
      title: 'Project metadata',
      filename: 'File',
      duration: 'Duration',
      sampleRate: 'Sample rate',
      channels: 'Channels',
      language: 'Annotation language',
      startedAt: 'Annotation started',
    },
    stats: {
      title: 'Statistics',
      annotations: 'Controlled annotations',
      structure: 'Structural sections',
      taxonomies: 'Taxonomy distribution',
    },
    annotations: {
      title: 'Controlled annotations',
      range: 'Range',
      taxonomy: 'Taxonomy',
      term: 'Term',
      note: 'Note',
      empty: 'No controlled annotations.',
    },
    structure: {
      title: 'Structural sections',
      range: 'Range',
      label: 'Label',
      note: 'Note',
      empty: 'No structural sections.',
    },
    relations: {
      title: 'Relations (form-building)',
      from: 'From',
      to: 'To',
      type: 'Type',
      empty: 'No relations.',
      types: {
        transformation: 'Transformation', repetition: 'Repetition', variation: 'Variation',
        contrast: 'Contrast', development: 'Development', return: 'Return',
        progression: 'Progression', dissolution: 'Dissolution',
      },
    },
    footer: 'Soundscape Annotation Atelier - companion of soundscape-audio-analysis',
  },
}

function getTaxonomyLabel(taxId: string, lang: 'it' | 'en'): string {
  const tax = taxonomies.find((t) => t.id === taxId)
  if (!tax) return taxId
  return lang === 'it' ? tax.label_it : tax.label_en
}

function buildStats(project: AnnotationProject) {
  const counts = new Map<string, number>()
  for (const ann of project.annotations) {
    counts.set(ann.taxonomy, (counts.get(ann.taxonomy) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export async function exportProjectPdf(project: AnnotationProject): Promise<void> {
  const lang: 'it' | 'en' = project.metadata.language === 'en' ? 'en' : 'it'
  const L = labels[lang]

  const fontData = await ensureFont()

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.addFileToVFS(`${FONT_NAME}.ttf`, fontData)
  doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
  doc.setFont(FONT_NAME, 'normal')

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 56

  // Copertina
  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  doc.text(L.cover.kicker, margin, margin + 10)

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(28)
  const title = project.metadata.title || project.audio.filename
  const titleLines = doc.splitTextToSize(title, pageW - margin * 2)
  doc.text(titleLines, margin, margin + 60)

  doc.setFontSize(13)
  doc.setTextColor(80, 80, 80)
  let coverY = margin + 60 + titleLines.length * 32
  if (project.metadata.author) {
    doc.text(`${L.cover.author}: ${project.metadata.author}`, margin, coverY)
    coverY += 22
  }
  if (project.metadata.year) {
    doc.text(`${L.cover.year}: ${project.metadata.year}`, margin, coverY)
    coverY += 22
  }
  if (project.metadata.annotator) {
    doc.text(`${L.cover.annotator}: ${project.metadata.annotator}`, margin, coverY)
  }

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`${L.cover.generated} ${new Date().toISOString().slice(0, 10)}`, margin, pageH - margin)

  // Metadati + statistiche
  doc.addPage()
  doc.setFont(FONT_NAME, 'normal')
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(16)
  doc.text(L.meta.title, margin, margin + 10)

  const metaRows: [string, string][] = [
    [L.meta.filename, project.audio.filename],
    [L.meta.duration, formatDuration(project.audio.durationSeconds)],
    [L.meta.sampleRate, `${project.audio.sampleRate} Hz`],
    [L.meta.channels, String(project.audio.channels)],
    [L.meta.language, project.metadata.language.toUpperCase()],
    [L.meta.startedAt, project.metadata.startedAt.slice(0, 16).replace('T', ' ')],
  ]

  autoTable(doc, {
    startY: margin + 30,
    body: metaRows,
    theme: 'plain',
    styles: { font: FONT_NAME, fontSize: 10, textColor: [40, 40, 40], cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'normal', textColor: [110, 110, 110], cellWidth: 140 } },
    margin: { left: margin, right: margin },
  })

  const afterMeta = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? margin + 30

  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(L.stats.title, margin, afterMeta + 30)

  const stats = buildStats(project)
  const statsRows: [string, string][] = [
    [L.stats.annotations, String(project.annotations.length)],
    [L.stats.structure, String(project.structure.length)],
  ]
  for (const [taxId, count] of stats) {
    statsRows.push([`${L.stats.taxonomies} - ${getTaxonomyLabel(taxId, lang)}`, String(count)])
  }
  autoTable(doc, {
    startY: afterMeta + 50,
    body: statsRows,
    theme: 'plain',
    styles: { font: FONT_NAME, fontSize: 10, textColor: [40, 40, 40], cellPadding: 4 },
    columnStyles: { 0: { textColor: [110, 110, 110], cellWidth: 280 } },
    margin: { left: margin, right: margin },
  })

  // Annotazioni controllate
  doc.addPage()
  doc.setFont(FONT_NAME, 'normal')
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(16)
  doc.text(L.annotations.title, margin, margin + 10)

  if (project.annotations.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(110, 110, 110)
    doc.text(L.annotations.empty, margin, margin + 40)
  } else {
    const annRows = project.annotations
      .slice()
      .sort((a, b) => a.startSec - b.startSec)
      .map((ann) => [
        `${formatTime(ann.startSec, false)} - ${formatTime(ann.endSec, false)}`,
        getTaxonomyLabel(ann.taxonomy, lang),
        ann.termLabel,
        ann.note ?? '',
      ])

    autoTable(doc, {
      startY: margin + 30,
      head: [[L.annotations.range, L.annotations.taxonomy, L.annotations.term, L.annotations.note]],
      body: annRows,
      styles: { font: FONT_NAME, fontSize: 9, textColor: [40, 40, 40], cellPadding: 4, overflow: 'linebreak' },
      headStyles: { font: FONT_NAME, fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'normal' },
      columnStyles: {
        0: { cellWidth: 90, font: FONT_NAME, textColor: [110, 110, 110] },
        1: { cellWidth: 110 },
        2: { cellWidth: 110 },
        3: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    })
  }

  // Sezioni strutturali
  doc.addPage()
  doc.setFont(FONT_NAME, 'normal')
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(16)
  doc.text(L.structure.title, margin, margin + 10)

  if (project.structure.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(110, 110, 110)
    doc.text(L.structure.empty, margin, margin + 40)
  } else {
    const sectRows = project.structure
      .slice()
      .sort((a, b) => a.startSec - b.startSec)
      .map((s) => [
        `${formatTime(s.startSec, false)} - ${formatTime(s.endSec, false)}`,
        s.label,
        s.note ?? '',
      ])

    autoTable(doc, {
      startY: margin + 30,
      head: [[L.structure.range, L.structure.label, L.structure.note]],
      body: sectRows,
      styles: { font: FONT_NAME, fontSize: 9, textColor: [40, 40, 40], cellPadding: 4, overflow: 'linebreak' },
      headStyles: { font: FONT_NAME, fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'normal' },
      columnStyles: {
        0: { cellWidth: 90, font: FONT_NAME, textColor: [110, 110, 110] },
        1: { cellWidth: 130 },
        2: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    })
  }

  // Relazioni (form-building)
  const relations = project.relations ?? []
  doc.addPage()
  doc.setFont(FONT_NAME, 'normal')
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(16)
  doc.text(L.relations.title, margin, margin + 10)
  if (relations.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(110, 110, 110)
    doc.text(L.relations.empty, margin, margin + 40)
  } else {
    const relRows = relations.map((r) => [
      getEntityLabel(project, r.from),
      getEntityLabel(project, r.to),
      L.relations.types[r.typeId] ?? r.typeId,
    ])
    autoTable(doc, {
      startY: margin + 30,
      head: [[L.relations.from, L.relations.to, L.relations.type]],
      body: relRows,
      styles: { font: FONT_NAME, fontSize: 9, textColor: [40, 40, 40], cellPadding: 4, overflow: 'linebreak' },
      headStyles: { font: FONT_NAME, fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'normal' },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 130 },
        2: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    })
  }

  // Footer su tutte le pagine
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 140, 140)
    doc.text(L.footer, margin, pageH - margin / 2)
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - margin / 2, { align: 'right' })
  }

  const filename = `${slugify(project.metadata.title || project.audio.filename)}.annotation.pdf`
  doc.save(filename)
}
