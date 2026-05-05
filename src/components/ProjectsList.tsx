import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Trash2, X } from 'lucide-react'
import type { AnnotationProject } from '../types/annotation'
import { deleteProject, listProjects } from '../hooks/useProjectStorage'
import { useProject } from '../hooks/useProject'
import { formatDuration } from '../lib/format'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ProjectsList({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { loadExistingProject } = useProject()
  const [projects, setProjects] = useState<AnnotationProject[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listProjects()
      .then((list) => {
        setProjects(list.sort((a, b) => (b.metadata.startedAt > a.metadata.startedAt ? 1 : -1)))
      })
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const handleOpen = async (p: AnnotationProject) => {
    await loadExistingProject(p)
    onClose()
  }

  const handleDelete = async (p: AnnotationProject) => {
    if (!window.confirm(t('projectsList.deleteConfirm'))) return
    await deleteProject(p.id)
    setProjects((prev) => prev.filter((x) => x.id !== p.id))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">{t('projectsList.title')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-slate-500">…</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-slate-500 leading-relaxed">{t('projectsList.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="border border-slate-800 rounded-lg bg-slate-950/40 px-4 py-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {p.metadata.title || p.audio.filename}
                    </p>
                    {p.metadata.author && (
                      <p className="text-xs text-slate-500 truncate">{p.metadata.author}</p>
                    )}
                    <p className="text-[11px] font-mono text-slate-600 mt-1">
                      {formatDuration(p.audio.durationSeconds)} ·{' '}
                      {t('projectsList.annotationsCount', { count: p.annotations.length })} ·{' '}
                      {t('projectsList.structureCount', { count: p.structure.length })} ·{' '}
                      {p.metadata.startedAt.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpen(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-medium transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    {t('projectsList.open')}
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                    title={t('projectsList.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
