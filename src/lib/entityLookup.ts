import type { AnnotationProject, EntityRef } from '../types/annotation'
import { NOTATION_SIGN_BY_ID } from '../data/notationSigns'

export interface EntityListing {
  ref: EntityRef
  label: string
  /** Inizio in secondi, o null per le entità senza timing (gli strati). */
  startSec: number | null
}

/** Timing di un'entità referenziata, o null se non ne ha (es. uno strato).
 * Centralizza il lookup per id, finora inline nei componenti. */
export function getEntityTiming(
  project: AnnotationProject,
  ref: EntityRef,
): { startSec: number; endSec: number } | null {
  switch (ref.kind) {
    case 'annotation': {
      const a = project.annotations.find((x) => x.id === ref.id)
      return a ? { startSec: a.startSec, endSec: a.endSec } : null
    }
    case 'structure': {
      const s = project.structure.find((x) => x.id === ref.id)
      return s ? { startSec: s.startSec, endSec: s.endSec } : null
    }
    case 'notation': {
      const m = (project.notation ?? []).find((x) => x.id === ref.id)
      return m ? { startSec: m.startSec, endSec: m.endSec ?? m.startSec } : null
    }
    case 'layer':
      return null
  }
}

/** Etichetta leggibile di un'entità referenziata. */
export function getEntityLabel(project: AnnotationProject, ref: EntityRef): string {
  switch (ref.kind) {
    case 'annotation':
      return project.annotations.find((x) => x.id === ref.id)?.termLabel ?? ref.id
    case 'structure':
      return project.structure.find((x) => x.id === ref.id)?.label ?? ref.id
    case 'layer':
      return (project.layers ?? []).find((x) => x.id === ref.id)?.name ?? ref.id
    case 'notation': {
      const m = (project.notation ?? []).find((x) => x.id === ref.id)
      if (!m) return ref.id
      return NOTATION_SIGN_BY_ID[m.signId]?.name ?? m.signId
    }
  }
}

/** Elenco piatto di tutte le entità referenziabili, per i selettori from/to. */
export function listEntities(project: AnnotationProject): EntityListing[] {
  const out: EntityListing[] = []
  for (const a of project.annotations) {
    out.push({ ref: { kind: 'annotation', id: a.id }, label: a.termLabel, startSec: a.startSec })
  }
  for (const s of project.structure) {
    out.push({ ref: { kind: 'structure', id: s.id }, label: s.label, startSec: s.startSec })
  }
  for (const l of project.layers ?? []) {
    out.push({ ref: { kind: 'layer', id: l.id }, label: l.name, startSec: null })
  }
  for (const m of project.notation ?? []) {
    out.push({
      ref: { kind: 'notation', id: m.id },
      label: NOTATION_SIGN_BY_ID[m.signId]?.name ?? m.signId,
      startSec: m.startSec,
    })
  }
  return out
}
