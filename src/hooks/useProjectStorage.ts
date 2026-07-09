import { openDB, type IDBPDatabase } from 'idb'
import type { AnnotationProject } from '../types/annotation'

const DB_NAME = 'sa-atelier'
const DB_VERSION = 1
const PROJECT_STORE = 'projects'
const AUDIO_STORE = 'audio'

interface AudioBlob {
  projectId: string
  blob: Blob
  filename: string
  mime: string
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          db.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE, { keyPath: 'projectId' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveProject(project: AnnotationProject, audioBlob?: Blob, filename?: string, mime?: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([PROJECT_STORE, AUDIO_STORE], 'readwrite')
  await tx.objectStore(PROJECT_STORE).put(project)
  if (audioBlob && filename && mime) {
    const audio: AudioBlob = { projectId: project.id, blob: audioBlob, filename, mime }
    await tx.objectStore(AUDIO_STORE).put(audio)
  }
  await tx.done
}

/** Salva solo il record del progetto (senza toccare l'audio, che pesa e viene
 * scritto una volta sola). Usato dall'autosalvataggio a ogni modifica. */
export async function saveProjectRecord(project: AnnotationProject): Promise<void> {
  const db = await getDB()
  await db.put(PROJECT_STORE, project)
}

export async function loadProject(id: string): Promise<AnnotationProject | undefined> {
  const db = await getDB()
  return db.get(PROJECT_STORE, id) as Promise<AnnotationProject | undefined>
}

export async function loadAudioBlob(projectId: string): Promise<AudioBlob | undefined> {
  const db = await getDB()
  return db.get(AUDIO_STORE, projectId) as Promise<AudioBlob | undefined>
}

export async function listProjects(): Promise<AnnotationProject[]> {
  const db = await getDB()
  return db.getAll(PROJECT_STORE) as Promise<AnnotationProject[]>
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([PROJECT_STORE, AUDIO_STORE], 'readwrite')
  await tx.objectStore(PROJECT_STORE).delete(id)
  await tx.objectStore(AUDIO_STORE).delete(id)
  await tx.done
}
