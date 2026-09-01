import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, Search, Trash2 } from 'lucide-react'
import { isValidTermId, taxonomies } from '../data/taxonomies'
import type { TaxonomyId } from '../types/annotation'
import { useProject } from '../hooks/useProject'
import { formatTime, parseTime } from '../lib/format'

type Tab = 'vocabulary' | 'annotations' | 'structure'

const STRUCTURE_COLOR = '#38bdf8' // sky-400

export default function AnnotationPanel() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'it'
  const {
    project,
    selection,
    setSelection,
    addAnnotation,
    deleteAnnotation,
    updateAnnotation,
    addStructure,
    updateStructure,
    deleteStructure,
  } = useProject()

  const [tab, setTab] = useState<Tab>('vocabulary')
  const [activeTax, setActiveTax] = useState<TaxonomyId>('schaeffer')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState('')
  const [structLabel, setStructLabel] = useState('')
  const [structNote, setStructNote] = useState('')
  const [structStart, setStructStart] = useState('')
  const [structEnd, setStructEnd] = useState('')
  const [structAddError, setStructAddError] = useState(false)
  const [editingStructId, setEditingStructId] = useState<string | null>(null)
  const [editingStructLabel, setEditingStructLabel] = useState('')
  const [editingStructNote, setEditingStructNote] = useState('')
  const [editingStructStart, setEditingStructStart] = useState('')
  const [editingStructEnd, setEditingStructEnd] = useState('')
  const [structTimeError, setStructTimeError] = useState(false)

  const tax = useMemo(() => taxonomies.find((tx) => tx.id === activeTax) ?? taxonomies[0], [activeTax])

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

  // La selezione sul waveform precompila i campi tempo, che restano editabili a
  // mano. Stato derivato da una prop del contesto: si aggiorna durante il render
  // confrontando la selezione con quella del render precedente (pattern React
  // "storing information from previous renders"), senza effetto e senza il
  // render a cascata che l'effetto produceva.
  const [prevSelection, setPrevSelection] = useState(selection)
  if (selection !== prevSelection) {
    setPrevSelection(selection)
    if (selection) {
      setStructStart(formatTime(selection.startSec))
      setStructEnd(formatTime(selection.endSec))
    }
  }

  const submitStructure = () => {
    if (!structLabel.trim()) return
    const startSec = parseTime(structStart)
    const endSec = parseTime(structEnd)
    if (startSec === null || endSec === null || endSec <= startSec) {
      setStructAddError(true)
      return
    }
    addStructure({
      startSec,
      endSec,
      label: structLabel.trim(),
      note: structNote.trim() || undefined,
      color: STRUCTURE_COLOR,
    })
    setStructLabel('')
    setStructNote('')
    setStructStart('')
    setStructEnd('')
    setStructAddError(false)
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

  const startEditStruct = (id: string, label: string, note: string, startSec: number, endSec: number) => {
    setEditingStructId(id)
    setEditingStructLabel(label)
    setEditingStructNote(note)
    setEditingStructStart(formatTime(startSec))
    setEditingStructEnd(formatTime(endSec))
    setStructTimeError(false)
  }

  const saveEditStruct = () => {
    if (!editingStructId) return
    const startSec = parseTime(editingStructStart)
    const endSec = parseTime(editingStructEnd)
    if (startSec === null || endSec === null || endSec <= startSec) {
      setStructTimeError(true)
      return
    }
    updateStructure(editingStructId, {
      label: editingStructLabel.trim() || '(senza etichetta)',
      note: editingStructNote.trim() || undefined,
      startSec,
      endSec,
    })
    setEditingStructId(null)
    setEditingStructLabel('')
    setEditingStructNote('')
    setEditingStructStart('')
    setEditingStructEnd('')
    setStructTimeError(false)
  }

  const annotationsCount = project?.annotations.length ?? 0
  const structureCount = project?.structure.length ?? 0
  const orphanCount = useMemo(
    () => (project?.annotations ?? []).filter((a) => !isValidTermId(a.termId)).length,
    [project?.annotations],
  )

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-800 text-sm">
        <TabButton active={tab === 'vocabulary'} onClick={() => setTab('vocabulary')}>
          {t('panel.vocabulary')}
        </TabButton>
        <TabButton active={tab === 'annotations'} onClick={() => setTab('annotations')}>
          {t('panel.annotations', { count: annotationsCount })}
        </TabButton>
        <TabButton active={tab === 'structure'} onClick={() => setTab('structure')}>
          {t('panel.structure', { count: structureCount })}
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
            {!selection && <p className="text-xs text-slate-500 mt-2">{t('panel.applyHint')}</p>}
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
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
          {orphanCount > 0 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-700/50 bg-amber-950/30 text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p className="text-xs leading-snug">
                {t('annotation.orphanWarning', { count: orphanCount })}
              </p>
            </div>
          )}
          {annotationsCount === 0 ? (
            <p className="text-sm text-slate-500 leading-relaxed">{t('panel.noAnnotations')}</p>
          ) : (
            <ul className="space-y-2">
              {(project?.annotations ?? [])
                .slice()
                .sort((a, b) => a.startSec - b.startSec)
                .map((ann) => {
                  const editing = editingId === ann.id
                  const orphan = !isValidTermId(ann.termId)
                  return (
                    <li
                      key={ann.id}
                      className="border border-slate-800 rounded-lg bg-slate-950/30 p-3"
                      style={{ borderLeftColor: ann.color, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100">{ann.termLabel}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {formatTime(ann.startSec)} - {formatTime(ann.endSec)}
                          </p>
                          {orphan && (
                            <span
                              className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-900/40 text-amber-300 border border-amber-800/60"
                              title={ann.termId}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {t('annotation.orphanBadge')}
                            </span>
                          )}
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
                            <button onClick={saveEditNote} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-medium">
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

      {tab === 'structure' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">{t('structure.subtitle')}</p>

          {/* Form aggiunta */}
          <div className="border border-slate-800 rounded-lg bg-slate-950/30 p-3 space-y-2">
            <input
              type="text"
              value={structLabel}
              onChange={(e) => setStructLabel(e.target.value)}
              placeholder={t('structure.labelPlaceholder')}
              className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-md text-sm focus:outline-none focus:border-sky-500"
            />
            <div className="flex gap-2">
              <label className="flex-1 text-[11px] text-slate-400">
                {t('structure.start')}
                <input
                  type="text"
                  inputMode="decimal"
                  value={structStart}
                  onChange={(e) => setStructStart(e.target.value)}
                  placeholder="mm:ss"
                  className="mt-0.5 w-full px-2 py-1 bg-slate-950/60 border border-slate-800 rounded-md text-xs font-mono focus:outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex-1 text-[11px] text-slate-400">
                {t('structure.end')}
                <input
                  type="text"
                  inputMode="decimal"
                  value={structEnd}
                  onChange={(e) => setStructEnd(e.target.value)}
                  placeholder="mm:ss"
                  className="mt-0.5 w-full px-2 py-1 bg-slate-950/60 border border-slate-800 rounded-md text-xs font-mono focus:outline-none focus:border-sky-500"
                />
              </label>
            </div>
            <textarea
              value={structNote}
              onChange={(e) => setStructNote(e.target.value)}
              placeholder={t('structure.notePlaceholder')}
              rows={2}
              className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-md text-xs focus:outline-none focus:border-sky-500"
            />
            {structAddError && <p className="text-xs text-rose-400">{t('structure.timeError')}</p>}
            <button
              onClick={submitStructure}
              disabled={!structLabel.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('structure.add')}
            </button>
            <p className="text-xs text-slate-500">{t('structure.addHint')}</p>
          </div>

          {/* Lista */}
          {structureCount === 0 ? (
            <p className="text-sm text-slate-500 leading-relaxed">{t('panel.noStructure')}</p>
          ) : (
            <ul className="space-y-2">
              {(project?.structure ?? [])
                .slice()
                .sort((a, b) => a.startSec - b.startSec)
                .map((sect) => {
                  const editing = editingStructId === sect.id
                  return (
                    <li
                      key={sect.id}
                      className="border border-slate-800 rounded-lg bg-slate-950/30 p-3"
                      style={{ borderLeftColor: sect.color ?? STRUCTURE_COLOR, borderLeftWidth: 3 }}
                    >
                      {editing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingStructLabel}
                            onChange={(e) => setEditingStructLabel(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md text-sm focus:outline-none focus:border-sky-500"
                          />
                          <textarea
                            value={editingStructNote}
                            onChange={(e) => setEditingStructNote(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md text-xs focus:outline-none focus:border-sky-500"
                          />
                          <div className="flex gap-2">
                            <label className="flex-1 text-[11px] text-slate-400">
                              {t('structure.start')}
                              <input
                                type="text"
                                inputMode="decimal"
                                value={editingStructStart}
                                onChange={(e) => setEditingStructStart(e.target.value)}
                                placeholder="mm:ss"
                                className="mt-0.5 w-full px-2 py-1 bg-slate-950/50 border border-slate-800 rounded-md text-xs font-mono focus:outline-none focus:border-sky-500"
                              />
                            </label>
                            <label className="flex-1 text-[11px] text-slate-400">
                              {t('structure.end')}
                              <input
                                type="text"
                                inputMode="decimal"
                                value={editingStructEnd}
                                onChange={(e) => setEditingStructEnd(e.target.value)}
                                placeholder="mm:ss"
                                className="mt-0.5 w-full px-2 py-1 bg-slate-950/50 border border-slate-800 rounded-md text-xs font-mono focus:outline-none focus:border-sky-500"
                              />
                            </label>
                          </div>
                          {structTimeError && (
                            <p className="text-[11px] text-rose-400">{t('structure.timeError')}</p>
                          )}
                          <div className="flex gap-2">
                            <button onClick={saveEditStruct} className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 rounded-md text-xs font-medium">
                              {t('annotation.save')}
                            </button>
                            <button
                              onClick={() => setEditingStructId(null)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-xs"
                            >
                              {t('annotation.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-100 truncate">{sect.label}</p>
                              <p className="text-[11px] font-mono text-slate-500">
                                {formatTime(sect.startSec)} - {formatTime(sect.endSec)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditStruct(sect.id, sect.label, sect.note ?? '', sect.startSec, sect.endSec)}
                                className="text-xs text-slate-500 hover:text-slate-200"
                              >
                                {t('annotation.edit')}
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(t('annotation.deleteConfirm'))) deleteStructure(sect.id)
                                }}
                                className="text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {sect.note && <p className="text-xs text-slate-400 mt-1.5 leading-snug">{sect.note}</p>}
                        </>
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
