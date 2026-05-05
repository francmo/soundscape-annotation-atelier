import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import DropZone from './components/DropZone'
import AudioWorkbench from './components/AudioWorkbench'
import AnnotationPanel from './components/AnnotationPanel'
import MetadataPanel from './components/MetadataPanel'
import { ProjectProvider, useProject } from './hooks/useProject'

function AppShell() {
  const { i18n } = useTranslation()
  const { project } = useProject()

  useEffect(() => {
    document.documentElement.lang = i18n.language?.startsWith('en') ? 'en' : 'it'
  }, [i18n.language])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {!project ? (
          <DropZone />
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div className="space-y-6 min-w-0">
              <AudioWorkbench />
              <MetadataPanel />
            </div>
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
              <AnnotationPanel />
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-slate-800 py-4">
        <p className="text-center text-xs text-slate-600">
          Soundscape Annotation Atelier · companion of soundscape-audio-analysis
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
