import type { AnnotationProject } from '../types/annotation'
import { ANNOTATION_SCHEMA_VERSION } from '../types/annotation'

export class ImportSchemaError extends Error {
  readonly received: string

  constructor(message: string, received: string) {
    super(message)
    this.name = 'ImportSchemaError'
    this.received = received
  }
}

/** Valida (minimamente) un payload JSON e lo restituisce come AnnotationProject. */
export function parseProjectJson(text: string): AnnotationProject {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch (err) {
    throw new ImportSchemaError('Invalid JSON', err instanceof Error ? err.message : String(err))
  }

  if (!isRecord(payload)) {
    throw new ImportSchemaError('Invalid root', typeof payload)
  }

  const version = (payload as { schemaVersion?: unknown }).schemaVersion
  if (version !== ANNOTATION_SCHEMA_VERSION) {
    throw new ImportSchemaError('schemaVersion mismatch', String(version))
  }
  if (!('audio' in payload) || !('annotations' in payload)) {
    throw new ImportSchemaError('missing required fields', JSON.stringify(Object.keys(payload)))
  }

  const project = payload as unknown as AnnotationProject
  // Normalizza campi opzionali
  if (!project.structure) project.structure = []
  if (!project.metadata) {
    project.metadata = { language: 'it', startedAt: new Date().toISOString() }
  }
  if (!project.id) project.id = crypto.randomUUID()
  return project
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
