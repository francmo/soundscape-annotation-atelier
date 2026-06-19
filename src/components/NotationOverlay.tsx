import { useEffect, useRef, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import type { NotationMark } from '../types/annotation'
import { NOTATION_SIGN_BY_ID } from '../data/notationSigns'

interface NotationOverlayProps {
  ws: WaveSurfer | null
  marks: NotationMark[]
  durationSec: number
  /** Altezza della corsia di notazione in px. */
  height?: number
}

// Segni dimostrativi visibili SOLO in sviluppo (npm run dev) e solo quando non
// esiste ancora alcun marker reale: servono a verificare il rendering e la
// sincronizzazione dell'overlay finché la palette di piazzamento (Tappa 3) non
// esiste. Grazie a import.meta.env.DEV non finiscono mai nel build di produzione.
const DEMO_MARKS: NotationMark[] = [
  { id: 'demo-1', startSec: 0.5, signId: 'placeholder.attack', anchor: 'time', createdAt: '', updatedAt: '' },
  { id: 'demo-2', startSec: 2, endSec: 4, signId: 'placeholder.gesture', anchor: 'time', createdAt: '', updatedAt: '' },
  { id: 'demo-3', startSec: 6, endSec: 9, signId: 'placeholder.texture', anchor: 'time', createdAt: '', updatedAt: '' },
]

const GLYPH = 20

/** Corsia di notazione (Fase 3, Tappa 2): disegna i segni ancorati all'asse
 * tempo sotto il waveform e li tiene sincronizzati con zoom e scroll di
 * WaveSurfer. La larghezza del contenuto e il pixel-per-secondo sono derivati
 * dalla larghezza reale renderizzata (wrapper.scrollWidth / durata), così
 * l'allineamento regge anche quando WaveSurfer stira la forma d'onda per
 * riempire il contenitore. Lo scroll è applicato via transform su un ref
 * (niente setState ad alta frequenza, come da regola PWA). */
export default function NotationOverlay({ ws, marks, durationSec, height = 30 }: NotationOverlayProps) {
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

  const showDemo = import.meta.env.DEV && marks.length === 0
  const allMarks = showDemo ? DEMO_MARKS : marks

  return (
    <div
      className="relative mt-1 overflow-hidden rounded-lg bg-slate-950/40 border border-slate-800/60"
      style={{ height }}
      aria-label="Corsia di notazione"
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 h-full"
        style={{ width: contentWidth || '100%' }}
      >
        <svg width={contentWidth} height={height} className="block text-indigo-300">
          {pxPerSec > 0 &&
            allMarks.map((m) => {
              const sign = NOTATION_SIGN_BY_ID[m.signId]
              if (!sign) return null
              const x = m.startSec * pxPerSec
              const spanW = m.endSec ? Math.max(0, (m.endSec - m.startSec) * pxPerSec) : 0
              return (
                <g key={m.id} transform={`translate(${x}, 0)`} style={{ color: m.color ?? undefined }}>
                  {spanW > 0 && (
                    <line
                      x1={0}
                      y1={height / 2}
                      x2={spanW}
                      y2={height / 2}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                    />
                  )}
                  <svg
                    x={-GLYPH / 2}
                    y={(height - GLYPH) / 2}
                    width={GLYPH}
                    height={GLYPH}
                    viewBox="0 0 24 24"
                    dangerouslySetInnerHTML={{ __html: sign.svg }}
                  />
                </g>
              )
            })}
        </svg>
      </div>
      {showDemo && (
        <span className="absolute right-2 top-1 text-[10px] text-slate-500 pointer-events-none">
          segni demo (solo sviluppo)
        </span>
      )}
    </div>
  )
}
