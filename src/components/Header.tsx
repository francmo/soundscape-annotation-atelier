import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FilePlus2, FileText, Save, Upload } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { exportProjectJson } from '../lib/exporters'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { project, loadAudio, saveProject, resetProject } = useProject()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await loadAudio(file)
    e.target.value = ''
  }

  const handleExportJson = () => {
    if (!project) return
    exportProjectJson(project)
  }

  const handleExportPdf = async () => {
    if (!project) return
    setExportingPdf(true)
    try {
      const { exportProjectPdf } = await import('../lib/pdfExporter')
      await exportProjectPdf(project)
    } catch (err) {
      console.error('PDF export failed', err)
      alert(`PDF export failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setExportingPdf(false)
    }
  }

  const handleSave = async () => {
    if (!project) return
    await saveProject()
  }

  const switchLang = (lang: 'it' | 'en') => {
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'it'

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <button
          onClick={resetProject}
          className="flex items-center gap-2 mr-auto"
          title={t('header.newProject')}
        >
          <span className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 grid place-items-center font-mono text-xs font-bold text-emerald-300">
            SA
          </span>
          <span className="font-semibold text-slate-100 hidden sm:inline">
            {t('app.title')}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handlePickFile}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{t('header.loadAudio')}</span>
        </button>

        {project && (
          <>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors"
              title={t('header.saveProject')}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.saveProject')}</span>
            </button>
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.exportJson')}</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">
                {exportingPdf ? '...' : t('header.exportPdf')}
              </span>
            </button>
            <button
              onClick={resetProject}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors"
              title={t('header.newProject')}
            >
              <FilePlus2 className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-3 font-mono text-xs">
          <button
            onClick={() => switchLang('it')}
            className={`px-2 py-1 rounded transition-colors ${
              currentLang === 'it'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {t('lang.it')}
          </button>
          <span className="text-slate-700">/</span>
          <button
            onClick={() => switchLang('en')}
            className={`px-2 py-1 rounded transition-colors ${
              currentLang === 'en'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {t('lang.en')}
          </button>
        </div>
      </div>
    </header>
  )
}
