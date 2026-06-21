// Vocabolario dei tipi di relazione (Fase 4), concordato il 19/06/2026.
// Bozza basata sui form-building processes/transformations della tradizione
// analitica (Schaeffer, Smalley, Thoresen), da validare col libro Emergent
// Musical Forms. I nomi e le descrizioni stanno nelle risorse i18n
// (relations.types.<id>.name / .desc); qui restano id stabile e colore.

export interface RelationType {
  /** Identificatore stabile, riferito da Relation.typeId. */
  id: string
  /** Colore esadecimale dell'arco sulla timeline. */
  color: string
}

export const RELATION_TYPES: RelationType[] = [
  { id: 'transformation', color: '#6366f1' },
  { id: 'repetition', color: '#22c55e' },
  { id: 'variation', color: '#f59e0b' },
  { id: 'contrast', color: '#ef4444' },
  { id: 'development', color: '#06b6d4' },
  { id: 'return', color: '#a855f7' },
  { id: 'progression', color: '#ec4899' },
  { id: 'dissolution', color: '#84cc16' },
]

export const RELATION_TYPE_BY_ID: Record<string, RelationType> = Object.fromEntries(
  RELATION_TYPES.map((r) => [r.id, r]),
)
