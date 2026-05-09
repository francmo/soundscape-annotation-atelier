import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import type {
  Annotation,
  AnnotationProject,
  AudioMetadata,
  ProjectMetadata,
  StructuralSection,
} from '../types/annotation'
import { ANNOTATION_SCHEMA_VERSION } from '../types/annotation'
import { saveProject as persistProject, loadAudioBlob } from './useProjectStorage'
import { isValidTermId } from '../data/taxonomies'
import { AudioDecodeError } from '../lib/audioErrors'
import { useTranslation } from 'react-i18next'

function warnOrphanTermIds(project: AnnotationProject): void {
  const orphans = project.annotations.filter((a) => !isValidTermId(a.termId))
  if (orphans.length === 0) return
  const sample = orphans.slice(0, 5).map((a) => a.termId)
  console.warn(
    `[soundscape-annotation-atelier] ${orphans.length} annotation(s) reference termIds not in current taxonomies. Sample:`,
    sample,
  )
}

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
  saveProject: () => Promise<void>
  loadError: { filename: string } | null
  clearLoadError: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

function nowIso(): string {
  return new Date().toISOString()
}

async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  try {
    const buffer = await file.arrayBuffer()
    let audio: AudioBuffer
    try {
      audio = await ctx.decodeAudioData(buffer.slice(0))
    } catch (cause) {
      throw new AudioDecodeError(file.name, cause)
    }
    return {
      filename: file.name,
      durationSeconds: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.numberOfChannels,
    }
  } finally {
    void ctx.close()
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [project, setProject] = useState<AnnotationProject | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ startSec: number; endSec: number } | null>(null)
  const [loadError, setLoadError] = useState<{ filename: string } | null>(null)

  const clearLoadError = useCallback(() => setLoadError(null), [])

  // Revoke ObjectURL su unmount o cambio audio
  useEffect(() => {
    if (!audioUrl) return
    return () => {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const loadAudio = useCallback(
    async (file: File) => {
      let meta: AudioMetadata
      try {
        meta = await readAudioMetadata(file)
      } catch (err) {
        if (err instanceof AudioDecodeError) {
          console.warn('[useProject] decode failed:', file.name, err.cause)
          setLoadError({ filename: file.name })
          return
        }
        throw err
      }
      setLoadError(null)
      const url = URL.createObjectURL(file)
      const language: 'it' | 'en' = i18n.language?.startsWith('en') ? 'en' : 'it'
      const newProject: AnnotationProject = {
        schemaVersion: ANNOTATION_SCHEMA_VERSION,
        id: uuid(),
        audio: meta,
        metadata: {
          language,
          startedAt: nowIso(),
        },
        annotations: [],
        structure: [],
      }
      setAudioBlob(file)
      setAudioUrl(url)
      setProject(newProject)
      setSelection(null)
    },
    [i18n.language],
  )

  const loadExistingProject = useCallback(async (existing: AnnotationProject) => {
    const audio = await loadAudioBlob(existing.id)
    if (!audio) {
      console.warn('No audio blob for project', existing.id)
      return
    }
    const url = URL.createObjectURL(audio.blob)
    setAudioBlob(audio.blob)
    setAudioUrl(url)
    setProject(existing)
    setSelection(null)
    warnOrphanTermIds(existing)
  }, [])

  const loadProjectFromJson = useCallback((imported: AnnotationProject) => {
    setProject(imported)
    setAudioBlob(null)
    setAudioUrl(null)
    setSelection(null)
    warnOrphanTermIds(imported)
  }, [])

  const setProjectAudio = useCallback(async (file: File) => {
    let meta: AudioMetadata
    try {
      meta = await readAudioMetadata(file)
    } catch (err) {
      if (err instanceof AudioDecodeError) {
        console.warn('[useProject] decode failed:', file.name, err.cause)
        setLoadError({ filename: file.name })
        return
      }
      throw err
    }
    setLoadError(null)
    const url = URL.createObjectURL(file)
    setAudioBlob(file)
    setAudioUrl(url)
    setProject((prev) => (prev ? { ...prev, audio: { ...prev.audio, ...meta, filename: file.name } } : prev))
  }, [])

  const resetProject = useCallback(() => {
    setProject(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setSelection(null)
    setLoadError(null)
  }, [])

  const updateMetadata = useCallback((patch: Partial<ProjectMetadata>) => {
    setProject((prev) => (prev ? { ...prev, metadata: { ...prev.metadata, ...patch } } : prev))
  }, [])

  const addAnnotation = useCallback(
    (input: Pick<Annotation, 'startSec' | 'endSec' | 'taxonomy' | 'termId' | 'termLabel' | 'color'> & { note?: string }) => {
      const created: Annotation = {
        id: uuid(),
        startSec: input.startSec,
        endSec: input.endSec,
        taxonomy: input.taxonomy,
        termId: input.termId,
        termLabel: input.termLabel,
        color: input.color,
        note: input.note ?? '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setProject((prev) => (prev ? { ...prev, annotations: [...prev.annotations, created] } : prev))
      return created
    },
    [],
  )

  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            annotations: prev.annotations.map((a) =>
              a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a,
            ),
          }
        : prev,
    )
  }, [])

  const deleteAnnotation = useCallback((id: string) => {
    setProject((prev) =>
      prev ? { ...prev, annotations: prev.annotations.filter((a) => a.id !== id) } : prev,
    )
  }, [])

  const addStructure = useCallback((input: Omit<StructuralSection, 'id'>) => {
    const created: StructuralSection = { ...input, id: uuid() }
    setProject((prev) => (prev ? { ...prev, structure: [...prev.structure, created] } : prev))
    return created
  }, [])

  const updateStructure = useCallback((id: string, patch: Partial<StructuralSection>) => {
    setProject((prev) =>
      prev ? { ...prev, structure: prev.structure.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : prev,
    )
  }, [])

  const deleteStructure = useCallback((id: string) => {
    setProject((prev) => (prev ? { ...prev, structure: prev.structure.filter((s) => s.id !== id) } : prev))
  }, [])

  const saveProject = useCallback(async () => {
    if (!project) return
    await persistProject(project, audioBlob ?? undefined, project.audio.filename, audioBlob?.type ?? 'application/octet-stream')
  }, [project, audioBlob])

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      audioUrl,
      audioBlob,
      selection,
      setSelection,
      loadAudio,
      loadExistingProject,
      loadProjectFromJson,
      setProjectAudio,
      resetProject,
      updateMetadata,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      addStructure,
      updateStructure,
      deleteStructure,
      saveProject,
      loadError,
      clearLoadError,
    }),
    [
      project,
      audioUrl,
      audioBlob,
      selection,
      loadAudio,
      loadExistingProject,
      loadProjectFromJson,
      setProjectAudio,
      resetProject,
      updateMetadata,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      addStructure,
      updateStructure,
      deleteStructure,
      saveProject,
      loadError,
      clearLoadError,
    ],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
