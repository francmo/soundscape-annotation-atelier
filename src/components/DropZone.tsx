import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileAudio2, Upload } from 'lucide-react'
import { useProject } from '../hooks/useProject'

export default function DropZone() {
  const { t } = useTranslation()
  const { loadAudio } = useProject()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|aiff?)$/i)) {
      alert(t('welcome.subtitle'))
      return
    }
    await loadAudio(file)
  }

  const features = (t('welcome.features', { returnObjects: true }) as string[]) || []

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/30'
        }`}
      >
        <FileAudio2 className="w-16 h-16 mx-auto text-slate-600 mb-4" strokeWidth={1.25} />
        <h2 className="text-xl font-semibold text-slate-100 mb-2">{t('welcome.title')}</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">{t('welcome.subtitle')}</p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          {t('welcome.browse')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      <ul className="mt-8 grid sm:grid-cols-2 gap-3">
        {features.map((feat, i) => (
          <li
            key={i}
            className="text-sm text-slate-400 bg-slate-900/30 border border-slate-800 rounded-lg px-4 py-3"
          >
            <span className="text-emerald-300 font-mono mr-2">·</span>
            {feat}
          </li>
        ))}
      </ul>
    </div>
  )
}
