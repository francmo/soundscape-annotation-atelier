import type { AnnotationProject } from '../types/annotation'

/** Esporta il progetto come JSON v1.0, conforme allo schema della skill. */
export function exportProjectJson(project: AnnotationProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const slug = (project.metadata.title || project.audio.filename || 'annotation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const filename = `${slug || 'annotation'}.annotation.json`
  triggerDownload(url, filename)
  URL.revokeObjectURL(url)
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
