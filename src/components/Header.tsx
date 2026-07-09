import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Download, FilePlus2, FileText, FolderOpen, Save, Upload } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { exportProjectJson } from '../lib/exporters'
import { ImportSchemaError, parseProjectJson } from '../lib/importer'
import ProjectsList from './ProjectsList'
import { APP_VERSION } from '../version'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { project, loadAudio, saveProject, resetProject, loadProjectFromJson, setProjectAudio, audioBlob } = useProject()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const audioForImportRef = useRef<HTMLInputElement>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [showProjectsList, setShowProjectsList] = useState(false)
  const [pendingAudio, setPendingAudio] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

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
    setSaveState('saving')
    try {
      await saveProject()
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 1800)
    } catch (err) {
      console.error('save failed', err)
      setSaveState('idle')
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseProjectJson(text)
      loadProjectFromJson(imported)
      setPendingAudio(true)
      alert(t('import.audioPrompt'))
    } catch (err) {
      if (err instanceof ImportSchemaError) {
        if (err.message === 'schemaVersion mismatch') {
          alert(t('import.schemaMismatch', { version: err.received }))
        } else {
          alert(t('import.invalidSchema'))
        }
      } else {
        console.error(err)
        alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  const handlePickImportAudio = () => audioForImportRef.current?.click()

  const handleImportAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await setProjectAudio(file)
    setPendingAudio(false)
  }

  const switchLang = (lang: 'it' | 'en') => {
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'it'

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <button
            onClick={resetProject}
            className="flex items-center gap-2"
            title={t('header.newProject')}
          >
            <span className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 grid place-items-center font-mono text-xs font-bold text-emerald-300">
              SA
            </span>
            <span className="font-semibold text-slate-100 hidden sm:inline">
              {t('app.title')}
            </span>
          </button>
          <span
            className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-mono text-sm sm:text-base font-bold tracking-wide shadow-sm"
            title={t('header.version', { version: APP_VERSION })}
          >
            v{APP_VERSION}
          </span>
        </div>

        <input ref={fileInputRef} type="file" accept=".wav,.mp3,.flac,.ogg,.m4a,.aac,.aiff,.aif,audio/wav,audio/mpeg,audio/mp3,audio/flac,audio/ogg,audio/m4a,audio/x-m4a,audio/aac,audio/aiff" onChange={handleFileChange} className="hidden" />
        <input ref={jsonInputRef} type="file" accept="application/json,.json" onChange={handleImportJson} className="hidden" />
        <input ref={audioForImportRef} type="file" accept=".wav,.mp3,.flac,.ogg,.m4a,.aac,.aiff,.aif,audio/wav,audio/mpeg,audio/mp3,audio/flac,audio/ogg,audio/m4a,audio/x-m4a,audio/aac,audio/aiff" onChange={handleImportAudio} className="hidden" />

        <button
          onClick={handlePickFile}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{t('header.loadAudio')}</span>
        </button>

        {pendingAudio && project && !audioBlob && (
          <button
            onClick={handlePickImportAudio}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-md text-sm font-medium transition-colors animate-pulse"
            title={t('import.audioPrompt')}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('import.pickAudio')}</span>
          </button>
        )}

        <button
          onClick={() => setShowProjectsList(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors"
          title={t('header.openProject')}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t('header.openProject')}</span>
        </button>

        <button
          onClick={() => jsonInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors"
          title={t('header.importJson')}
        >
          <Download className="w-4 h-4 rotate-180" />
          <span className="hidden sm:inline">{t('header.importJson')}</span>
        </button>

        {project && (
          <>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                saveState === 'saved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={t('header.saveProject')}
            >
              {saveState === 'saved' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className={`w-4 h-4 ${saveState === 'saving' ? 'animate-pulse' : ''}`} />
              )}
              <span className="hidden sm:inline">
                {saveState === 'saved'
                  ? t('header.saved')
                  : saveState === 'saving'
                    ? t('header.saving')
                    : t('header.saveProject')}
              </span>
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
      <ProjectsList open={showProjectsList} onClose={() => setShowProjectsList(false)} />
    </header>
  )
}
