import { useEffect, useRef, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import { useProject } from '../hooks/useProject'
import { getEntityTiming } from '../lib/entityLookup'
import { RELATION_TYPE_BY_ID } from '../data/relationTypes'

interface RelationOverlayProps {
  ws: WaveSurfer | null
  durationSec: number
  /** Altezza della corsia degli archi in px. */
  height?: number
}

/** Corsia delle relazioni (Fase 4, Tappa 4b): disegna un arco fra i due estremi
 * temporali di ogni relazione, ancorati al punto medio dell'entità, riusando la
 * sincronizzazione di NotationOverlay (pxPerSec da wrapper.scrollWidth/durata,
 * scroll via transform su ref). Le relazioni che toccano un'entità senza timing
 * (uno strato) non sono disegnabili e restano visibili solo nel pannello. */
export default function RelationOverlay({ ws, durationSec, height = 38 }: RelationOverlayProps) {
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

  const relations = project?.relations ?? []
  const arcs =
    pxPerSec > 0 && project
      ? relations
          .map((r) => {
            const tf = getEntityTiming(project, r.from)
            const tt = getEntityTiming(project, r.to)
            if (!tf || !tt) return null
            return {
              id: r.id,
              x1: ((tf.startSec + tf.endSec) / 2) * pxPerSec,
              x2: ((tt.startSec + tt.endSec) / 2) * pxPerSec,
              color: r.color ?? RELATION_TYPE_BY_ID[r.typeId]?.color ?? '#94a3b8',
            }
          })
          .filter((a): a is { id: string; x1: number; x2: number; color: string } => a !== null)
      : []

  const base = height - 3
  const top = 4

  return (
    <div
      className="relative mt-1 overflow-hidden rounded-lg bg-slate-950/40 border border-slate-800/60 pointer-events-none"
      style={{ height }}
      aria-label="Corsia delle relazioni"
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 h-full"
        style={{ width: contentWidth || '100%' }}
      >
        <svg width={contentWidth} height={height} className="block">
          {arcs.map((a) => {
            const xmid = (a.x1 + a.x2) / 2
            const dir = a.x2 >= a.x1 ? 1 : -1
            const head = `M ${a.x2} ${base} l ${-dir * 6} ${-4} l 0 8 z`
            return (
              <g key={a.id} style={{ color: a.color }}>
                <path
                  d={`M ${a.x1} ${base} Q ${xmid} ${top} ${a.x2} ${base}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeOpacity={0.85}
                />
                <circle cx={a.x1} cy={base} r={2.2} fill="currentColor" />
                <path d={head} fill="currentColor" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
