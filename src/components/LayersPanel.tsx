import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Layers as LayersIcon } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { formatDuration } from '../lib/format'

// Palette qualitativa, colori distinti per gli strati.
const LAYER_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f59e0b',
  '#06b6d4', '#a855f7', '#ec4899', '#84cc16',
]

const INPUT_CLASS =
  'px-2 py-1 bg-slate-950/50 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-indigo-500'

/** Strato suggerito dalla skill, dal blocco analysis.suggestedLayers (interchange v1.2). */
interface SuggestedLayer {
  id?: string
  label?: string
  source?: string
  score?: number
  krause?: string
}

export default function LayersPanel() {
  const { t } = useTranslation()
  const { project, addLayer, updateLayer, deleteLayer, updateAnnotation } = useProject()
  const [newName, setNewName] = useState('')
  if (!project) return null

  const layers = project.layers ?? []
  const annotations = project.annotations
  const analysis = project.analysis as Record<string, unknown> | undefined
  const suggested = (analysis?.suggestedLayers as SuggestedLayer[] | undefined) ?? []
  const existingNames = new Set(layers.map((l) => l.name.trim().toLowerCase()))
  const pendingSuggested = suggested.filter(
    (s) => s.label && !existingNames.has(s.label.trim().toLowerCase()),
  )

  const countFor = (layerId: string) => annotations.filter((a) => a.layerId === layerId).length

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addLayer({ name, color: LAYER_COLORS[layers.length % LAYER_COLORS.length] })
    setNewName('')
  }

  const promote = (s: SuggestedLayer) => {
    addLayer({
      name: s.label ?? 'strato',
      color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
      source: 'suggested',
      krause: s.krause,
    })
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <LayersIcon className="w-4 h-4" strokeWidth={1.75} />
          {t('layers.title')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{t('layers.subtitle')}</p>
      </div>

      {layers.length === 0 ? (
        <p className="text-sm text-slate-500">{t('layers.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {layers.map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <input
                type="color"
                value={l.color ?? '#6366f1'}
                onChange={(e) => updateLayer(l.id, { color: e.target.value })}
                className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer flex-shrink-0"
                aria-label={t('layers.color')}
              />
              <input
                type="text"
                value={l.name}
                onChange={(e) => updateLayer(l.id, { name: e.target.value })}
                className={`flex-1 min-w-0 ${INPUT_CLASS}`}
              />
              {l.source === 'suggested' && (
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-mono flex-shrink-0">
                  {t('layers.suggestedBadge')}
                </span>
              )}
              <span className="text-xs text-slate-500 font-mono tabular-nums flex-shrink-0">
                {t('layers.count', { count: countFor(l.id) })}
              </span>
              <button
                onClick={() => deleteLayer(l.id)}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 flex-shrink-0"
                aria-label={t('layers.delete')}
                title={t('layers.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder={t('layers.namePlaceholder')}
          className={`flex-1 min-w-0 ${INPUT_CLASS}`}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-white flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> {t('layers.add')}
        </button>
      </div>

      {pendingSuggested.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
            {t('layers.suggestedTitle')}
          </p>
          <ul className="space-y-1">
            {pendingSuggested.map((s, i) => (
              <li key={s.id ?? i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate text-slate-300">
                  {s.label}
                  {s.krause && <span className="text-slate-500"> ({s.krause})</span>}
                </span>
                <button
                  onClick={() => promote(s)}
                  className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700 hover:border-indigo-500 text-xs text-slate-300 flex-shrink-0"
                >
                  <Plus className="w-3 h-3" /> {t('layers.addSuggested')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {layers.length > 0 && annotations.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
            {t('layers.assignTitle')}
          </p>
          <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {annotations.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate text-slate-300" title={a.termLabel}>
                  <span className="font-mono text-xs text-slate-500">{formatDuration(a.startSec)}</span>{' '}
                  {a.termLabel}
                </span>
                <select
                  value={a.layerId ?? ''}
                  onChange={(e) => updateAnnotation(a.id, { layerId: e.target.value || undefined })}
                  className={`flex-shrink-0 ${INPUT_CLASS}`}
                >
                  <option value="">{t('layers.unassigned')}</option>
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
