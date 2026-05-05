import { useTranslation } from 'react-i18next'
import { useProject } from '../hooks/useProject'
import { formatDuration } from '../lib/format'

export default function MetadataPanel() {
  const { t } = useTranslation()
  const { project, updateMetadata } = useProject()
  if (!project) return null

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        {t('metadata.title')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field label={t('metadata.audioTitle')}>
          <input
            type="text"
            value={project.metadata.title ?? ''}
            onChange={(e) => updateMetadata({ title: e.target.value })}
            placeholder="Presque Rien No. 1"
            className="input"
          />
        </Field>
        <Field label={t('metadata.author')}>
          <input
            type="text"
            value={project.metadata.author ?? ''}
            onChange={(e) => updateMetadata({ author: e.target.value })}
            placeholder="Luc Ferrari"
            className="input"
          />
        </Field>
        <Field label={t('metadata.year')}>
          <input
            type="number"
            value={project.metadata.year ?? ''}
            onChange={(e) => updateMetadata({ year: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="1970"
            className="input"
          />
        </Field>
        <Field label={t('metadata.genre')}>
          <input
            type="text"
            value={project.metadata.genre ?? ''}
            onChange={(e) => updateMetadata({ genre: e.target.value })}
            placeholder="soundscape"
            className="input"
          />
        </Field>
        <Field label={t('metadata.annotator')}>
          <input
            type="text"
            value={project.metadata.annotator ?? ''}
            onChange={(e) => updateMetadata({ annotator: e.target.value })}
            placeholder="Francesco Mariano"
            className="input"
          />
        </Field>
        <Field label={t('metadata.language')}>
          <select
            value={project.metadata.language}
            onChange={(e) => updateMetadata({ language: e.target.value as 'it' | 'en' })}
            className="input"
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs font-mono">
        <Stat label={t('metadata.filename')} value={project.audio.filename} />
        <Stat label={t('metadata.duration')} value={formatDuration(project.audio.durationSeconds)} />
        <Stat label={t('metadata.sampleRate')} value={`${project.audio.sampleRate} Hz`} />
        <Stat label={t('metadata.channels')} value={String(project.audio.channels)} />
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          background: rgba(2, 6, 23, 0.5);
          border: 1px solid #1e293b;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #e2e8f0;
        }
        .input:focus {
          outline: none;
          border-color: #6366f1;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className="text-slate-300 truncate" title={value}>
        {value}
      </p>
    </div>
  )
}
