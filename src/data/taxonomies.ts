import type { TaxonomyId } from '../types/annotation'
import data from './taxonomies.json' with { type: 'json' }

export interface TaxonomyTerm {
  id: string
  label_it: string
  label_en: string
  desc_it: string
  desc_en: string
}

export interface TaxonomyGroup {
  id: string
  label_it: string
  label_en: string
  terms: TaxonomyTerm[]
}

export interface Taxonomy {
  id: TaxonomyId
  label_it: string
  label_en: string
  source: string
  reference: string
  color: string
  groups: TaxonomyGroup[]
}

interface TaxonomiesFile {
  schemaVersion: string
  generatedAt: string
  source: string
  taxonomies: Taxonomy[]
}

const file = data as TaxonomiesFile

export const taxonomies: Taxonomy[] = file.taxonomies

export const taxonomiesSchemaVersion = file.schemaVersion
export const taxonomiesGeneratedAt = file.generatedAt

export const getTaxonomy = (id: TaxonomyId): Taxonomy | undefined =>
  taxonomies.find((t) => t.id === id)

export const getTermById = (
  termId: string,
): { taxonomy: Taxonomy; group: TaxonomyGroup; term: TaxonomyTerm } | undefined => {
  for (const tax of taxonomies) {
    for (const group of tax.groups) {
      const term = group.terms.find((t) => t.id === termId)
      if (term) return { taxonomy: tax, group, term }
    }
  }
  return undefined
}

export const totalTermsCount = taxonomies.reduce(
  (sum, t) => sum + t.groups.reduce((s, g) => s + g.terms.length, 0),
  0,
)
