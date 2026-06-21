import { useEffect, useRef, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import { useProject } from '../hooks/useProject'

interface PhaseOverlayProps {
  ws: WaveSurfer | null
  durationSec: number
  /** Altezza della corsia delle fasi in px. */
  height?: number
}

interface Phase {
  name: string
  startSec: number
  endSec: number
  label?: string
}

// Colori delle quattro fasi della gestalt energetica (Aural Sonology, Thoresen).
const PHASE_COLORS: Record<string, string> = {
  anacrusi: '#64748b',
  crescita: '#0ea5e9',
  climax: '#ef4444',
  risoluzione: '#22c55e',
}

/** Legge analysis.dynamicForm.phases dal blocco interchange (prodotto dalla
 * skill, preservato nel round-trip). Difensivo: il blocco analysis è opzionale
 * e non tipizzato lato Atelier. */
function readPhases(analysis: unknown): Phase[] {
  if (!analysis || typeof analysis !== 'object') return []
  const df = (analysis as { dynamicForm?: { phases?: unknown } }).dynamicForm
  const phases = df?.phases
  if (!Array.isArray(phases)) return []
  return phases.filter(
    (p): p is Phase =>
      !!p &&
      typeof p === 'object' &&
      typeof (p as Phase).name === 'string' &&
      typeof (p as Phase).startSec === 'number' &&
      typeof (p as Phase).endSec === 'number',
  )
}

/** Corsia delle fasi (Fase 4, Tappa 4d): disegna le fasi della forma energetica
 * come fasce colorate sulla timeline, sincronizzate con zoom e scroll come gli
 * altri overlay. Le fasi provengono dal blocco analysis prodotto dalla skill;
 * in sviluppo, se assenti, mostra fasi demo per verificare il rendering. */
export default function PhaseOverlay({ ws, durationSec, height = 22 }: PhaseOverlayProps) {
  const { project } = useProject()
  const innerRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [pxPerSec, setPxPerSec] = useState(0)

  useEffect(() => {
    if (!ws) return
    const recompute = () => {
      const wrapper = ws.getWrapper()
      const w = wrapper?.scrollWidth ?? 0
      if (w > 0 && durationSec > 0) {
        setContentWidth(w)
        setPxPerSec(w / durationSec)
      }
    }
    const syncScroll = () => {
      const wrapper = ws.getWrapper()
      if (innerRef.current && wrapper) {
        innerRef.current.style.transform = `translateX(${-wrapper.scrollLeft}px)`
      }
    }
    recompute()
    const unsubs = [
      ws.on('ready', recompute),
      ws.on('redrawcomplete', recompute),
      ws.on('zoom', recompute),
      ws.on('scroll', syncScroll),
    ]
    window.addEventListener('resize', recompute)
    return () => {
      unsubs.forEach((u) => u())
      window.removeEventListener('resize', recompute)
    }
  }, [ws, durationSec])

  const phases = readPhases(project?.analysis)
  const showDemo = import.meta.env.DEV && phases.length === 0 && durationSec > 0
  const demo: Phase[] = showDemo
    ? [
        { name: 'anacrusi', startSec: 0, endSec: durationSec * 0.1 },
        { name: 'crescita', startSec: durationSec * 0.1, endSec: durationSec * 0.5 },
        { name: 'climax', startSec: durationSec * 0.5, endSec: durationSec * 0.62 },
        { name: 'risoluzione', startSec: durationSec * 0.62, endSec: durationSec },
      ]
    : []
  const allPhases = phases.length ? phases : demo
  if (allPhases.length === 0) return null

  return (
    <div
      className="relative mt-1 overflow-hidden rounded-lg bg-slate-950/40 border border-slate-800/60 pointer-events-none"
      style={{ height }}
      aria-label="Fasi della forma"
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 h-full"
        style={{ width: contentWidth || '100%' }}
      >
        <svg width={contentWidth} height={height} className="block">
          {pxPerSec > 0 &&
            allPhases.map((p, i) => {
              const x = p.startSec * pxPerSec
              const w = Math.max(0, (p.endSec - p.startSec) * pxPerSec)
              const color = PHASE_COLORS[p.name.toLowerCase()] ?? '#6366f1'
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={0}
                    width={w}
                    height={height}
                    fill={color}
                    fillOpacity={0.22}
                    stroke={color}
                    strokeOpacity={0.5}
                    strokeWidth={0.5}
                  />
                  {w > 30 && (
                    <text x={x + 4} y={height / 2 + 3} fontSize={9} fill={color}>
                      {p.label || p.name}
                    </text>
                  )}
                </g>
              )
            })}
        </svg>
      </div>
      {showDemo && (
        <span className="absolute right-2 top-1 text-[10px] text-slate-500">
          fasi demo (solo sviluppo)
        </span>
      )}
    </div>
  )
}
