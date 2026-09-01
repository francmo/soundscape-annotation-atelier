import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { AnnotationProject } from '../types/annotation'
import { DEFAULT_VOCAB_BASE, IiifExportError, defaultBaseUri, exportProjectIiif, isAbsoluteHttpUri } from '../lib/iiifExporter'

interface Props {
  open: boolean
  project: AnnotationProject | null
  onClose: () => void
}

/** Finestra dell'export IIIF (issue #1): URI base del manifest e URL pubblico dell'audio.
 * Il form interno si monta a ogni apertura, così i valori di default si calcolano
 * dal progetto corrente negli inizializzatori di stato, senza effetti. */
export default function IiifExportDialog({ open, project, onClose }: Props) {
  if (!open || !project) return null
  return <IiifExportForm key={project.id} project={project} onClose={onClose} />
}

function IiifExportForm({ project, onClose }: { project: AnnotationProject; onClose: () => void }) {
  const { t } = useTranslation()
  const [baseUri, setBaseUri] = useState(() => defaultBaseUri(project))
  const [audioUrl, setAudioUrl] = useState(
    () => `${defaultBaseUri(project)}/${encodeURIComponent(project.audio.filename || 'audio')}`,
  )
  const [vocabBase, setVocabBase] = useState(DEFAULT_VOCAB_BASE)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    const base = baseUri.trim()
    const vocab = vocabBase.trim()
    const audio = audioUrl.trim()
    if ((base && !isAbsoluteHttpUri(base)) || (vocab && !isAbsoluteHttpUri(vocab)) || (audio && !isAbsoluteHttpUri(audio))) {
      setError(t('iiif.errorUri'))
      return
    }
    try {
      exportProjectIiif(project, {
        baseUri: base || undefined,
        audioUrl: audio || undefined,
        vocabBase: vocab || undefined,
      })
    } catch (err) {
      setError(err instanceof IiifExportError ? t('iiif.errorDuration') : String(err))
      return
    }
    onClose()
  }

  const field =
    'w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500'

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">{t('iiif.title')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label={t('iiif.cancel')}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">{t('iiif.intro')}</p>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('iiif.baseUri')}</span>
            <input className={field} value={baseUri} onChange={(e) => { setBaseUri(e.target.value); setError(null) }} spellCheck={false} />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('iiif.audioUrl')}</span>
            <input className={field} value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); setError(null) }} spellCheck={false} />
            <span className="block text-xs text-slate-500">{t('iiif.audioHint')}</span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('iiif.vocabBase')}</span>
            <input className={field} value={vocabBase} onChange={(e) => { setVocabBase(e.target.value); setError(null) }} spellCheck={false} />
          </label>

          <p className="text-xs text-slate-500 leading-relaxed">{t('iiif.hint')}</p>

          {error && (
            <p role="alert" className="text-sm text-amber-300 bg-amber-950/40 border border-amber-800 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {t('iiif.cancel')}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            {t('iiif.export')}
          </button>
        </footer>
      </div>
    </div>
  )
}
