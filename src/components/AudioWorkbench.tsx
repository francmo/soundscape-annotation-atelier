import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js'
import { Activity, Pause, Play, Square, ZoomIn, ZoomOut } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { formatTime } from '../lib/format'

export default function AudioWorkbench() {
  const { t } = useTranslation()
  const { audioUrl, project, setSelection, selection, updateAnnotation, updateStructure } = useProject()
  const containerRef = useRef<HTMLDivElement>(null)
  const spectrogramRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)
  const selectionRegionRef = useRef<Region | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(50)
  const [showSpectrogram, setShowSpectrogram] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#94a3b8',
      progressColor: '#a5b4fc',
      cursorColor: '#fafafa',
      cursorWidth: 2,
      height: 120,
      barWidth: 2,
      barRadius: 1,
      barGap: 1,
      normalize: true,
      minPxPerSec: 50,
      url: audioUrl,
    })
    const regions = ws.registerPlugin(RegionsPlugin.create())
    if (spectrogramRef.current) {
      ws.registerPlugin(
        SpectrogramPlugin.create({
          container: spectrogramRef.current,
          height: 160,
          fftSamples: 1024,
          scale: 'mel',
          frequencyMax: 16000,
          labels: true,
          labelsBackground: 'rgba(15, 13, 46, 0.7)',
          labelsColor: '#94a3b8',
        }),
      )
    }
    // Selezione in verde smeraldo: contrasta con il blu delle sezioni di
    // struttura e con i colori delle annotazioni, così durante il trascinamento
    // resta sempre distinguibile.
    regions.enableDragSelection({
      color: 'rgba(16, 185, 129, 0.38)',
    })

    regions.on('region-created', (region) => {
      // Una nuova regione senza data esplicito è una "selection" creata via drag.
      const data = (region as Region & { data?: { kind?: string } }).data
      if (data?.kind === 'annotation') return
      if (selectionRegionRef.current && selectionRegionRef.current !== region) {
        selectionRegionRef.current.remove()
      }
      selectionRegionRef.current = region
      ;(region as Region & { data?: { kind?: string } }).data = { kind: 'selection' }
      setSelection({ startSec: region.start, endSec: region.end })
    })

    regions.on('region-updated', (region) => {
      const data = (region as Region & { data?: { kind?: string; annotationId?: string; structureId?: string } }).data
      if (data?.kind === 'selection') {
        setSelection({ startSec: region.start, endSec: region.end })
      } else if (data?.kind === 'annotation' && data.annotationId) {
        updateAnnotation(data.annotationId, { startSec: region.start, endSec: region.end })
      } else if (data?.kind === 'structure' && data.structureId) {
        updateStructure(data.structureId, { startSec: region.start, endSec: region.end })
      }
    })

    regions.on('region-clicked', (region, e) => {
      e.stopPropagation()
      region.play()
    })

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))
    ws.on('audioprocess', (time) => setCurrentTime(time))
    ws.on('seeking', (time) => setCurrentTime(time))

    wsRef.current = ws
    regionsRef.current = regions

    return () => {
      ws.destroy()
      wsRef.current = null
      regionsRef.current = null
      selectionRegionRef.current = null
    }
  }, [audioUrl, setSelection, updateAnnotation, updateStructure])

  // Sincronizza annotazioni e sezioni strutturali come regioni Wavesurfer.
  useEffect(() => {
    const regions = regionsRef.current
    const ws = wsRef.current
    if (!regions || !ws || !project) return

    const apply = () => {
      regions
        .getRegions()
        .filter((r) => {
          const data = (r as Region & { data?: { kind?: string } }).data
          return data?.kind !== 'selection'
        })
        .forEach((r) => r.remove())

      project.annotations.forEach((ann) => {
        const r = regions.addRegion({
          start: ann.startSec,
          end: ann.endSec,
          color: `${ann.color}33`,
          drag: true,
          resize: true,
          content: ann.termLabel,
        })
        ;(r as Region & { data?: { kind?: string; annotationId?: string } }).data = {
          kind: 'annotation',
          annotationId: ann.id,
        }
      })

      project.structure.forEach((sect) => {
        const baseColor = sect.color ?? '#38bdf8'
        const r = regions.addRegion({
          start: sect.startSec,
          end: sect.endSec,
          color: `${baseColor}40`,
          drag: true,
          resize: true,
          content: `[${sect.label}]`,
        })
        ;(r as Region & { data?: { kind?: string; structureId?: string } }).data = {
          kind: 'structure',
          structureId: sect.id,
        }
      })
    }

    if (ws.getDuration() > 0) {
      apply()
    } else {
      ws.once('ready', apply)
    }
  }, [project, project?.annotations, project?.structure])

  // Rimuove la regione di selezione quando lo stato selection è azzerato.
  useEffect(() => {
    if (selection === null && selectionRegionRef.current) {
      selectionRegionRef.current.remove()
      selectionRegionRef.current = null
    }
  }, [selection])

  const togglePlay = () => wsRef.current?.playPause()
  const stop = () => {
    const ws = wsRef.current
    if (!ws) return
    ws.stop()
    setIsPlaying(false)
  }
  const zoom = (delta: number) => {
    const ws = wsRef.current
    if (!ws) return
    const next = Math.max(10, Math.min(500, zoomLevel + delta))
    ws.zoom(next)
    setZoomLevel(next)
  }

  if (!audioUrl) return null

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <div ref={containerRef} className="rounded-lg overflow-hidden bg-slate-950/50" />
      <div
        ref={spectrogramRef}
        className="rounded-lg overflow-hidden bg-slate-950/50 mt-2"
        style={{ display: showSpectrogram ? 'block' : 'none' }}
      />

      <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
        <button
          onClick={togglePlay}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? t('workbench.pause') : t('workbench.play')}
        </button>
        <button
          onClick={stop}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
        >
          <Square className="w-4 h-4" />
          {t('workbench.stop')}
        </button>
        <button
          onClick={() => zoom(-20)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
          title={t('workbench.zoomOut')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoom(20)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
          title={t('workbench.zoomIn')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowSpectrogram((s) => !s)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            showSpectrogram
              ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
          title={t('workbench.spectrogram')}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden md:inline">{t('workbench.spectrogram')}</span>
        </button>

        <div className="ml-auto font-mono text-xs text-slate-400 tabular-nums flex items-center gap-4">
          <span>
            {t('workbench.currentTime')}{' '}
            <span className="text-slate-200">{formatTime(currentTime)}</span>
          </span>
          {project && (
            <span className="text-slate-500">
              / {formatTime(project.audio.durationSeconds, false)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 font-mono">
        {selection ? (
          <span>
            {t('workbench.selection')}:{' '}
            <span className="text-emerald-300">
              {formatTime(selection.startSec)} - {formatTime(selection.endSec)}
            </span>
          </span>
        ) : (
          <span>{t('workbench.noSelection')}</span>
        )}
      </div>
    </div>
  )
}
