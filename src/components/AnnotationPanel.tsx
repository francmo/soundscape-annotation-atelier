import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Trash2 } from 'lucide-react'
import { taxonomies } from '../data/taxonomies'
import type { TaxonomyId } from '../types/annotation'
import { useProject } from '../hooks/useProject'
import { formatTime } from '../lib/format'

type Tab = 'vocabulary' | 'annotations' | 'structure'

export default function AnnotationPanel() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'it'
  const { project, selection, setSelection, addAnnotation, deleteAnnotation, updateAnnotation } = useProject()

  const [tab, setTab] = useState<Tab>('vocabulary')
  const [activeTax, setActiveTax] = useState<TaxonomyId>('schaeffer')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState('')

  const tax = useMemo(() => taxonomies.find((tx) => tx.id === activeTax)!, [activeTax])

  const filteredGroups = useMemo(() => {
    if (!search) return tax.groups
    const q = search.toLowerCase()
    return tax.groups
      .map((g) => ({
        ...g,
        terms: g.terms.filter(
          (t2) =>
            t2.label_it.toLowerCase().includes(q) ||
            t2.label_en.toLowerCase().includes(q) ||
            t2.desc_it.toLowerCase().includes(q) ||
            t2.desc_en.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.terms.length > 0)
  }, [tax, search])

  const applyTerm = (termId: string, termLabel: string) => {
    if (!selection) return
    addAnnotation({
      startSec: selection.startSec,
      endSec: selection.endSec,
      taxonomy: tax.id,
      termId,
      termLabel,
      color: tax.color,
    })
    setSelection(null)
  }

  const startEditNote = (id: string, note: string) => {
    setEditingId(id)
    setEditingNote(note)
  }

  const saveEditNote = () => {
    if (!editingId) return
    updateAnnotation(editingId, { note: editingNote })
    setEditingId(null)
    setEditingNote('')
  }

  const annotationsCount = project?.annotations.length ?? 0

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-800 text-sm">
        <TabButton active={tab === 'vocabulary'} onClick={() => setTab('vocabulary')}>
          {t('panel.vocabulary')}
        </TabButton>
        <TabButton active={tab === 'annotations'} onClick={() => setTab('annotations')}>
          {t('panel.annotations', { count: annotationsCount })}
        </TabButton>
      </div>

      {tab === 'vocabulary' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Tassonomie come pillole */}
          <div className="flex flex-wrap gap-1.5 p-3 border-b border-slate-800">
            {taxonomies.map((tx) => (
              <button
                key={tx.id}
                onClick={() => setActiveTax(tx.id)}
                style={
                  activeTax === tx.id
                    ? { background: `${tx.color}22`, color: tx.color, borderColor: `${tx.color}55` }
                    : undefined
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeTax === tx.id ? '' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {lang === 'it' ? tx.label_it : tx.label_en}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('panel.search')}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            {!selection && (
              <p className="text-xs text-slate-500 mt-2">{t('panel.applyHint')}</p>
            )}
          </div>

          {/* Lista termini */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-3">
            {filteredGroups.map((g) => (
              <div key={g.id}>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                  {lang === 'it' ? g.label_it : g.label_en}
                </p>
                <div className="space-y-1">
                  {g.terms.map((term) => (
                    <button
                      key={term.id}
                      onClick={() => applyTerm(term.id, lang === 'it' ? term.label_it : term.label_en)}
                      disabled={!selection}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-sm bg-slate-950/30 hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: tax.color }}
                        />
                        <span className="font-medium text-slate-200">
                          {lang === 'it' ? term.label_it : term.label_en}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {lang === 'it' ? term.desc_it : term.desc_en}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'annotations' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          {annotationsCount === 0 ? (
            <p className="text-sm text-slate-500 leading-relaxed">{t('panel.noAnnotations')}</p>
          ) : (
            <ul className="space-y-2">
              {(project?.annotations ?? [])
                .slice()
                .sort((a, b) => a.startSec - b.startSec)
                .map((ann) => {
                  const editing = editingId === ann.id
                  return (
                    <li
                      key={ann.id}
                      className="border border-slate-800 rounded-lg bg-slate-950/30 p-3"
                      style={{ borderLeftColor: ann.color, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{ann.termLabel}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {formatTime(ann.startSec)} - {formatTime(ann.endSec)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(t('annotation.deleteConfirm'))) deleteAnnotation(ann.id)
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                          title={t('annotation.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {editing ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            rows={3}
                            className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md text-xs focus:outline-none focus:border-indigo-500"
                            placeholder={t('annotation.notePlaceholder')}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditNote}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-medium"
                            >
                              {t('annotation.save')}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditingNote('')
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
                            >
                              {t('annotation.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditNote(ann.id, ann.note)}
                          className="text-xs text-slate-400 mt-1 text-left w-full hover:text-slate-200 transition-colors"
                        >
                          {ann.note ? ann.note : <span className="italic text-slate-600">{t('annotation.notePlaceholder')}</span>}
                        </button>
                      )}
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 font-medium transition-colors ${
        active ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
