import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, ArrowRight } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { listEntities, getEntityLabel } from '../lib/entityLookup'
import { RELATION_TYPES, RELATION_TYPE_BY_ID } from '../data/relationTypes'
import type { EntityRef } from '../types/annotation'

const SELECT_CLASS =
  'px-2 py-1 bg-slate-950/50 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-indigo-500'

function parseRef(value: string): EntityRef | null {
  const idx = value.indexOf(':')
  if (idx < 0) return null
  return { kind: value.slice(0, idx) as EntityRef['kind'], id: value.slice(idx + 1) }
}

function refValue(ref: EntityRef): string {
  return `${ref.kind}:${ref.id}`
}

/** Pannello relazioni (Fase 4, Tappa 4a): collega due entità con un tipo del
 * vocabolario, elenca le relazioni esistenti, permette di eliminarle. Il
 * disegno degli archi sulla timeline è la Tappa 4b. */
export default function RelationsPanel() {
  const { t } = useTranslation()
  const { project, addRelation, deleteRelation } = useProject()
  const [fromVal, setFromVal] = useState('')
  const [toVal, setToVal] = useState('')
  const [typeId, setTypeId] = useState('')
  if (!project) return null

  const entities = listEntities(project)
  const relations = project.relations ?? []
  const enoughEntities = entities.length >= 2
  const canAdd = enoughEntities && !!fromVal && !!toVal && fromVal !== toVal && !!typeId

  const handleAdd = () => {
    const from = parseRef(fromVal)
    const to = parseRef(toVal)
    if (!from || !to || !typeId) return
    addRelation({ from, to, typeId })
    setFromVal('')
    setToVal('')
    setTypeId('')
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {t('relations.title')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{t('relations.subtitle')}</p>
      </div>

      {!enoughEntities ? (
        <p className="text-xs text-amber-400/80">{t('relations.needEntities')}</p>
      ) : (
        <div className="space-y-2">
          <select
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className={`w-full ${SELECT_CLASS}`}
            aria-label={t('relations.from')}
          >
            <option value="">
              {t('relations.from')}: {t('relations.selectEntity')}
            </option>
            {entities.map((en) => (
              <option key={refValue(en.ref)} value={refValue(en.ref)}>
                {en.label}
              </option>
            ))}
          </select>
          <select
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className={`w-full ${SELECT_CLASS}`}
            aria-label={t('relations.to')}
          >
            <option value="">
              {t('relations.to')}: {t('relations.selectEntity')}
            </option>
            {entities.map((en) => (
              <option key={refValue(en.ref)} value={refValue(en.ref)}>
                {en.label}
              </option>
            ))}
          </select>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className={`w-full ${SELECT_CLASS}`}
            aria-label={t('relations.type')}
          >
            <option value="">
              {t('relations.type')}: {t('relations.selectType')}
            </option>
            {RELATION_TYPES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {t(`relations.types.${rt.id}.name`)}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full px-3 py-1.5 rounded bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-white"
          >
            {t('relations.add')}
          </button>
        </div>
      )}

      <div className="pt-3 border-t border-slate-800">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2">
          {t('relations.listTitle')}
        </p>
        {relations.length === 0 ? (
          <p className="text-sm text-slate-500">{t('relations.empty')}</p>
        ) : (
          <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {relations.map((r) => {
              const type = RELATION_TYPE_BY_ID[r.typeId]
              return (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color ?? type?.color ?? '#94a3b8' }}
                  />
                  <span className="flex-1 min-w-0 truncate text-slate-300">
                    {getEntityLabel(project, r.from)}
                    <ArrowRight className="inline w-3 h-3 mx-1 text-slate-500" />
                    {getEntityLabel(project, r.to)}
                    <span className="text-slate-500"> · {t(`relations.types.${r.typeId}.name`)}</span>
                  </span>
                  <button
                    onClick={() => deleteRelation(r.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 flex-shrink-0"
                    aria-label={t('relations.delete')}
                    title={t('relations.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
