// Contesto e hook di accesso allo stato di progetto. Il componente
// `ProjectProvider` sta in ProjectProvider.tsx (file separato per Fast Refresh).
import { createContext, useContext } from 'react'
import type {
  Annotation,
  AnnotationProject,
  EntityRef,
  Layer,
  NotationMark,
  ProjectMetadata,
  Relation,
  StructuralSection,
} from '../types/annotation'

export
interface ProjectContextValue {
  project: AnnotationProject | null
  audioUrl: string | null
  audioBlob: Blob | null
  /** Range temporale temporaneamente selezionato sul waveform (per nuova annotazione). */
  selection: { startSec: number; endSec: number } | null
  setSelection: (sel: { startSec: number; endSec: number } | null) => void
  loadAudio: (file: File) => Promise<void>
  loadExistingProject: (project: AnnotationProject) => Promise<void>
  loadProjectFromJson: (project: AnnotationProject) => void
  setProjectAudio: (file: File) => Promise<void>
  resetProject: () => void
  updateMetadata: (patch: Partial<ProjectMetadata>) => void
  addAnnotation: (input: Pick<Annotation, 'startSec' | 'endSec' | 'taxonomy' | 'termId' | 'termLabel' | 'color'> & { note?: string }) => Annotation
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void
  deleteAnnotation: (id: string) => void
  addStructure: (input: Omit<StructuralSection, 'id'>) => StructuralSection
  updateStructure: (id: string, patch: Partial<StructuralSection>) => void
  deleteStructure: (id: string) => void
  addLayer: (input: { name: string; color?: string; source?: 'user' | 'suggested'; krause?: string }) => Layer
  updateLayer: (id: string, patch: Partial<Layer>) => void
  deleteLayer: (id: string) => void
  addNotationMark: (input: { startSec: number; endSec?: number; signId: string; layerId?: string; anchor?: 'time' | 'spectro'; freqHz?: number; label?: string; note?: string; color?: string }) => NotationMark
  updateNotationMark: (id: string, patch: Partial<NotationMark>) => void
  deleteNotationMark: (id: string) => void
  /** Segno di notazione attivo per il piazzamento diretto sulla corsia (UX A+B). */
  activeSignId: string | null
  setActiveSignId: (id: string | null) => void
  addRelation: (input: { from: EntityRef; to: EntityRef; typeId: string; note?: string; color?: string }) => Relation
  updateRelation: (id: string, patch: Partial<Relation>) => void
  deleteRelation: (id: string) => void
  saveProject: () => Promise<void>
  loadError: { filename: string } | null
  clearLoadError: () => void
}

export const ProjectContext = createContext<ProjectContextValue | null>(null)

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
