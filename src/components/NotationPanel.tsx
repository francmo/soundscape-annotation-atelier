import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Check, X, HelpCircle } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { formatDuration } from '../lib/format'
import { NOTATION_SIGNS, NOTATION_SIGN_BY_ID } from '../data/notationSigns'
import { deriveSuggestedNotation } from '../lib/notationSuggest'

/** Rende un glifo del repertorio dentro un viewBox 0 0 24 24. */
function Glyph({ svg, className }: { svg: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** Pannello di notazione (Fase 3, UX A+B): partitura suggerita dall'analisi da
 * confermare, palette che arma il segno attivo per il piazzamento diretto sulla
 * corsia, lista dei segni inseriti, guida e glossario. */
export default function NotationPanel() {
  const { t } = useTranslation()
  const { project, addNotationMark, deleteNotationMark, activeSignId, setActiveSignId } = useProject()
  const [ignored, setIgnored] = useState<Set<string>>(new Set())
  if (!project) return null

  const marks = project.notation ?? []
  const suggested = deriveSuggestedNotation(project)
  const isPlaced = (sStart: number, signId: string) =>
    marks.some((m) => m.signId === signId && Math.abs(m.startSec - sStart) < 0.5)
  const pending = suggested.filter((s) => !ignored.has(s.id) && !isPlaced(s.startSec, s.signId))

  const confirm = (s: { signId: string; startSec: number; endSec?: number }) =>
    addNotationMark({ signId: s.signId, startSec: s.startSec, endSec: s.endSec, anchor: 'time' })
  const confirmAll = () => pending.forEach(confirm)
  const ignore = (id: string) => setIgnored((prev) => new Set(prev).add(id))
  const toggleActive = (id: string) => setActiveSignId(activeSignId === id ? null : id)

  const activeSign = activeSignId ? NOTATION_SIGN_BY_ID[activeSignId] : null

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {t('notation.title')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{t('notation.subtitle')}</p>
      </div>

      <details className="rounded-lg bg-slate-950/40 border border-slate-800/60 px-3 py-2">
        <summary className="text-[11px] uppercase tracking-wider text-slate-400 font-mono cursor-pointer flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> {t('notation.guideTitle')}
        </summary>
        <ol className="mt-2 list-decimal pl-5 space-y-1 text-xs text-slate-400">
          <li>{t('notation.guide1')}</li>
          <li>{t('notation.guide2')}</li>
          <li>{t('notation.guide3')}</li>
          <li>{t('notation.guide4')}</li>
        </ol>
      </details>

      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              {t('notation.suggestedTitle')} ({pending.length})
            </p>
            <button
              onClick={confirmAll}
              className="flex items-center gap-1 px-2 py-1 rounded border border-emerald-600/50 hover:border-emerald-500 text-xs text-emerald-300 flex-shrink-0"
            >
              <Check className="w-3 h-3" /> {t('notation.confirmAll')}
            </button>
          </div>
          <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {pending.map((s) => {
              const sign = NOTATION_SIGN_BY_ID[s.signId]
              return (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  {sign && <Glyph svg={sign.svg} className="w-4 h-4 flex-shrink-0 text-amber-300/80" />}
                  <span className="flex-1 min-w-0 truncate text-slate-300" title={s.rationale}>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {formatDuration(s.startSec)}
                    </span>{' '}
                    {sign?.name ?? s.signId}
                  </span>
                  <button
                    onClick={() => confirm(s)}
                    aria-label={t('notation.confirm')}
                    title={t('notation.confirm')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-emerald-400 flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ignore(s.id)}
                    aria-label={t('notation.ignore')}
                    title={t('notation.ignore')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-1">
          {t('notation.paletteTitle')}
        </p>
        <p className={`text-xs mb-2 ${activeSign ? 'text-emerald-400/80' : 'text-slate-500'}`}>
          {activeSign ? t('notation.activeHint', { name: activeSign.name }) : t('notation.paletteHintArm')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {NOTATION_SIGNS.map((s) => (
            <button
              key={s.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', s.id)}
              onClick={() => toggleActive(s.id)}
              title={s.description}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm text-left ${
                activeSignId === s.id
                  ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
                  : 'border-slate-700 hover:border-indigo-500 text-slate-300'
              }`}
            >
              <Glyph svg={s.svg} className="w-5 h-5 flex-shrink-0 text-indigo-300" />
              <span className="min-w-0 truncate">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2">
          {t('notation.marksTitle')}
        </p>
        {marks.length === 0 ? (
          <p className="text-sm text-slate-500">{t('notation.empty')}</p>
        ) : (
          <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {marks.map((m) => {
              const sign = NOTATION_SIGN_BY_ID[m.signId]
              return (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  {sign && <Glyph svg={sign.svg} className="w-4 h-4 flex-shrink-0 text-indigo-300" />}
                  <span className="flex-1 min-w-0 truncate text-slate-300">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {formatDuration(m.startSec)}
                      {m.endSec ? `-${formatDuration(m.endSec)}` : ''}
                    </span>{' '}
                    {sign?.name ?? m.signId}
                  </span>
                  <button
                    onClick={() => deleteNotationMark(m.id)}
                    aria-label={t('notation.delete')}
                    title={t('notation.delete')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <details className="pt-3 border-t border-slate-800">
        <summary className="text-[11px] uppercase tracking-wider text-slate-500 font-mono cursor-pointer">
          {t('notation.glossaryTitle')}
        </summary>
        <ul className="mt-2 space-y-1.5">
          {NOTATION_SIGNS.map((s) => (
            <li key={s.id} className="flex items-start gap-2 text-xs text-slate-400">
              <Glyph svg={s.svg} className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-300" />
              <span>
                <span className="text-slate-300">{s.name}</span>: {s.description}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
