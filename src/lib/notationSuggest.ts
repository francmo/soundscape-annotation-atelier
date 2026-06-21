import type { AnnotationProject } from '../types/annotation'
import { NOTATION_SIGN_BY_ID } from '../data/notationSigns'

/** Segno di notazione proposto dall'analisi (Fase 3, auto-draft). Derivato al
 * volo dal blocco analysis, NON persistito finché l'utente non lo conferma. */
export interface SuggestedNotation {
  id: string
  signId: string
  startSec: number
  endSec?: number
  rationale: string
}

interface TimeField {
  id: string
  level?: number
  startSec?: number
  endSec?: number
  meanFlatness?: number
  eventsPerSec?: number
}

interface EnergyPoint {
  tSec: number
  db: number
}

// Soglie baseline della derivazione (euristica, da rifinire all'uso).
const ITER_ONSET_PER_SEC = 1.0 // onset density alta -> iterato
const IMPULSE_MAX_DUR = 1.2 // durata breve -> impulso
const FLATNESS_NOISE = 0.35 // flatness alta -> rumore
const FLATNESS_TONAL = 0.08 // flatness bassa -> massa tonica
const DYN_DELTA_DB = 4.0 // salto di energia per crescendo/decrescendo/arco

function readTimeFields(analysis: unknown): TimeField[] {
  if (!analysis || typeof analysis !== 'object') return []
  const tf = (analysis as { timeFields?: unknown }).timeFields
  if (!Array.isArray(tf)) return []
  return tf.filter(
    (f): f is TimeField =>
      !!f && typeof f === 'object' && typeof (f as TimeField).id === 'string' &&
      ((f as TimeField).level ?? 0) === 0,
  )
}

function readEnergy(analysis: unknown): EnergyPoint[] {
  if (!analysis || typeof analysis !== 'object') return []
  const df = (analysis as { dynamicForm?: { energy?: unknown } }).dynamicForm
  const en = df?.energy
  if (!Array.isArray(en)) return []
  return en.filter(
    (p): p is EnergyPoint =>
      !!p && typeof (p as EnergyPoint).tSec === 'number' && typeof (p as EnergyPoint).db === 'number',
  )
}

function dynamicSign(seg: EnergyPoint[]): { signId: string; why: string } | null {
  if (seg.length < 3) return null
  const half = Math.floor(seg.length / 2)
  const avg = (a: EnergyPoint[]) => a.reduce((s, p) => s + p.db, 0) / a.length
  const first = avg(seg.slice(0, half))
  const last = avg(seg.slice(half))
  const peak = Math.max(...seg.map((p) => p.db))
  const ends = Math.max(first, last)
  const mid = seg[Math.floor(seg.length / 2)].db
  if (peak - ends >= DYN_DELTA_DB && mid >= ends) return { signId: 'dinamica.arco', why: 'picco di energia interno' }
  if (last - first >= DYN_DELTA_DB) return { signId: 'dinamica.crescendo', why: 'energia in salita' }
  if (first - last >= DYN_DELTA_DB) return { signId: 'dinamica.decrescendo', why: 'energia in discesa' }
  return null
}

/** Deriva una bozza di partitura dai campi temporali e dalla forma dinamica del
 * blocco analysis. Per ogni campo (level 0) propone il mantenimento, la massa e,
 * se netto, il profilo dinamico. Euristica baseline: l'utente conferma o corregge.
 * Ritorna [] se il progetto non ha il blocco analysis. */
export function deriveSuggestedNotation(project: AnnotationProject): SuggestedNotation[] {
  const fields = readTimeFields(project.analysis)
  const energy = readEnergy(project.analysis)
  const out: SuggestedNotation[] = []

  const add = (f: TimeField, signId: string, extended: boolean, why: string) => {
    if (!NOTATION_SIGN_BY_ID[signId]) return
    out.push({
      id: `${f.id}:${signId}`,
      signId,
      startSec: f.startSec as number,
      endSec: extended ? (f.endSec as number) : undefined,
      rationale: why,
    })
  }

  for (const f of fields) {
    if (typeof f.startSec !== 'number' || typeof f.endSec !== 'number') continue
    const dur = f.endSec - f.startSec

    // Mantenimento (come il suono dura)
    if ((f.eventsPerSec ?? 0) >= ITER_ONSET_PER_SEC) add(f, 'tipologia.iterato', true, 'molti onset nel campo')
    else if (dur <= IMPULSE_MAX_DUR) add(f, 'tipologia.impulso', false, 'durata molto breve')
    else add(f, 'tipologia.tenuto', true, 'energia continua e prolungata')

    // Massa (natura spettrale)
    const fl = f.meanFlatness
    if (typeof fl === 'number') {
      if (fl >= FLATNESS_NOISE) add(f, 'massa.rumore', true, 'flatness alta')
      else if (fl <= FLATNESS_TONAL) add(f, 'massa.tonica', false, 'flatness bassa, altezza definita')
      else add(f, 'massa.complessa', true, 'flatness media')
    }

    // Profilo dinamico, solo se netto
    const seg = energy.filter((e) => e.tSec >= (f.startSec as number) && e.tSec <= (f.endSec as number))
    const dyn = dynamicSign(seg)
    if (dyn) add(f, dyn.signId, true, dyn.why)
  }

  return out
}
