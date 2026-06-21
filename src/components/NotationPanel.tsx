import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { formatDuration } from '../lib/format'
import { NOTATION_SIGNS, NOTATION_SIGN_BY_ID } from '../data/notationSigns'

/** Rende un glifo del repertorio dentro un viewBox 0 0 24 24. */
function Glyph({ svg, className }: { svg: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** Pannello di notazione (Fase 3, Tappa 3): palette dei segni, piazzamento
 * sulla selezione del waveform, lista dei segni inseriti con eliminazione,
 * glossario. Il piazzamento usa la selezione del context (un segno esteso
 * copre il range, un segno puntuale parte dall'inizio della selezione). */
export default function NotationPanel() {
  const { t } = useTranslation()
  const { project, selection, addNotationMark, deleteNotationMark } = useProject()
  if (!project) return null

  const marks = project.notation ?? []
  const canPlace = selection !== null

  const place = (signId: string) => {
    if (!selection) return
    const sign = NOTATION_SIGN_BY_ID[signId]
    addNotationMark({
      signId,
      startSec: selection.startSec,
      endSec: sign?.extended ? selection.endSec : undefined,
      anchor: 'time',
    })
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {t('notation.title')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{t('notation.subtitle')}</p>
      </div>

      {!canPlace && <p className="text-xs text-amber-400/80">{t('notation.selectFirst')}</p>}

      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2">
          {t('notation.paletteTitle')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {NOTATION_SIGNS.map((s) => (
            <button
              key={s.id}
              onClick={() => place(s.id)}
              disabled={!canPlace}
              title={s.description}
              className="flex items-center gap-2 px-2 py-1.5 rounded border border-slate-700 hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-slate-300 text-left"
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
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 flex-shrink-0"
                    aria-label={t('notation.delete')}
                    title={t('notation.delete')}
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
