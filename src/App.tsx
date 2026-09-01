import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'
import Header from './components/Header'
import DropZone from './components/DropZone'
import AudioWorkbench from './components/AudioWorkbench'
import AnnotationPanel from './components/AnnotationPanel'
import MetadataPanel from './components/MetadataPanel'
import LayersPanel from './components/LayersPanel'
import NotationPanel from './components/NotationPanel'
import RelationsPanel from './components/RelationsPanel'
import { ProjectProvider } from './hooks/ProjectProvider'
import { useProject } from './hooks/useProject'
import { APP_VERSION } from './version'

function AppShell() {
  const { t, i18n } = useTranslation()
  const { project, loadError, clearLoadError } = useProject()

  useEffect(() => {
    document.documentElement.lang = i18n.language?.startsWith('en') ? 'en' : 'it'
  }, [i18n.language])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {loadError && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="flex-1 min-w-0 text-sm text-amber-100">
              <p className="font-medium">
                {t('errors.audioDecodeTitle', { filename: loadError.filename })}
              </p>
              <p className="mt-1 text-amber-200/80">{t('errors.audioDecodeBody')}</p>
            </div>
            <button
              onClick={clearLoadError}
              className="flex-shrink-0 p-1 rounded hover:bg-amber-500/20 text-amber-200"
              aria-label={t('errors.dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {!project ? (
          <DropZone />
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div className="space-y-6 min-w-0">
              <AudioWorkbench />
              <MetadataPanel />
              <LayersPanel />
              <NotationPanel />
              <RelationsPanel />
            </div>
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
              <AnnotationPanel />
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-slate-800 py-4">
        <p className="text-center text-xs text-slate-600">
          Soundscape Annotation Atelier · Vers. {APP_VERSION} · companion of soundscape-audio-analysis
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ProjectProvider>
      <AppShell />
    </ProjectProvider>
  )
}
