import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent, type DragEvent as ReactDragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type WaveSurfer from 'wavesurfer.js'
import type { NotationMark } from '../types/annotation'
import { NOTATION_SIGN_BY_ID } from '../data/notationSigns'
import { useProject } from '../hooks/useProject'

interface NotationOverlayProps {
  ws: WaveSurfer | null
  marks: NotationMark[]
  durationSec: number
  /** Altezza della corsia di notazione in px. */
  height?: number
}

// Segni dimostrativi visibili SOLO in sviluppo (npm run dev) e solo quando non
// esiste ancora alcun marker reale: servono a verificare il rendering e la
// sincronizzazione dell'overlay finché la palette di piazzamento non esiste.
// Grazie a import.meta.env.DEV non finiscono mai nel build di produzione.
const DEMO_MARKS: NotationMark[] = [
  { id: 'demo-1', startSec: 0.5, signId: 'tipologia.impulso', anchor: 'time', createdAt: '', updatedAt: '' },
  { id: 'demo-2', startSec: 2, endSec: 4, signId: 'moto.gesto', anchor: 'time', createdAt: '', updatedAt: '' },
  { id: 'demo-3', startSec: 6, endSec: 9, signId: 'moto.trama', anchor: 'time', createdAt: '', updatedAt: '' },
]

const GLYPH = 20

interface DragState {
  id: string
  pointerId: number
  startClientX: number
  origStartSec: number
  origEndSec?: number
  draftStart: number
  g: SVGGElement
}

/** Corsia di notazione (Fase 3): disegna i segni ancorati all'asse tempo sotto
 * il waveform, sincronizzati con zoom e scroll di WaveSurfer, e permette di
 * trascinarli nel tempo (Tappa 3b). pxPerSec è derivato dalla larghezza reale
 * renderizzata (wrapper.scrollWidth / durata), così l'allineamento regge anche
 * quando WaveSurfer stira la forma d'onda. Lo scroll e il drag sono applicati
 * via transform su ref (niente setState ad alta frequenza, come da regola PWA);
 * lo stato è committato solo al rilascio del puntatore. */
export default function NotationOverlay({ ws, marks, durationSec, height = 30 }: NotationOverlayProps) {
  const { t } = useTranslation()
  const { updateNotationMark, addNotationMark, activeSignId, selection } = useProject()
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
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
  const draggable = !showDemo

  const onPointerDown = (e: ReactPointerEvent<SVGGElement>, m: NotationMark) => {
    if (!draggable || pxPerSec <= 0) return
    const g = e.currentTarget
    g.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: m.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      origStartSec: m.startSec,
      origEndSec: m.endSec,
      draftStart: m.startSec,
      g,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<SVGGElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId || pxPerSec <= 0) return
    const deltaSec = (e.clientX - d.startClientX) / pxPerSec
    let ns = Math.max(0, d.origStartSec + deltaSec)
    if (d.origEndSec != null) {
      const len = d.origEndSec - d.origStartSec
      if (ns + len > durationSec) ns = Math.max(0, durationSec - len)
    } else if (ns > durationSec) {
      ns = durationSec
    }
    d.draftStart = ns
    d.g.setAttribute('transform', `translate(${ns * pxPerSec}, 0)`)
  }

  const onPointerUp = (e: ReactPointerEvent<SVGGElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    try {
      d.g.releasePointerCapture(e.pointerId)
    } catch {
      /* il puntatore può essere già rilasciato */
    }
    if (Math.abs(d.draftStart - d.origStartSec) > 1e-3) {
      const patch: Partial<NotationMark> = { startSec: d.draftStart }
      if (d.origEndSec != null) patch.endSec = d.draftStart + (d.origEndSec - d.origStartSec)
      updateNotationMark(d.id, patch)
    }
    dragRef.current = null
  }

  // Piazzamento (UX B): con un segno attivo un click sulla corsia, oppure il drop
  // di un segno trascinato dalla palette, crea il segno al punto indicato; i segni
  // estesi usano la selezione se presente, altrimenti una durata di default.
  const placeAt = (clientX: number, signId: string) => {
    const sign = NOTATION_SIGN_BY_ID[signId]
    if (!sign || pxPerSec <= 0 || !innerRef.current) return
    const rect = innerRef.current.getBoundingClientRect()
    const tSec = Math.max(0, Math.min((clientX - rect.left) / pxPerSec, durationSec))
    let startSec = tSec
    let endSec: number | undefined
    if (sign.extended) {
      if (selection) {
        startSec = selection.startSec
        endSec = selection.endSec
      } else {
        endSec = Math.min(tSec + 2, durationSec)
      }
    }
    addNotationMark({ signId, startSec, endSec, anchor: 'time' })
  }

  const handlePlaceClick = (e: ReactMouseEvent<SVGRectElement>) => {
    if (activeSignId) placeAt(e.clientX, activeSignId)
  }

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) placeAt(e.clientX, id)
  }

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div
      className="relative mt-1 overflow-hidden rounded-lg bg-slate-200 border border-slate-400"
      style={{ height }}
      aria-label="Corsia di notazione"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 h-full"
        style={{ width: contentWidth || '100%' }}
      >
        <svg width={contentWidth} height={height} className="block text-slate-800">
          {activeSignId && pxPerSec > 0 && (
            <rect
              x={0}
              y={0}
              width={contentWidth}
              height={height}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onClick={handlePlaceClick}
            />
          )}
          {pxPerSec > 0 &&
            allMarks.map((m) => {
              const sign = NOTATION_SIGN_BY_ID[m.signId]
              if (!sign) return null
              const x = m.startSec * pxPerSec
              const spanW = m.endSec ? Math.max(0, (m.endSec - m.startSec) * pxPerSec) : 0
              return (
                <g
                  key={m.id}
                  transform={`translate(${x}, 0)`}
                  style={{
                    color: m.color ?? undefined,
                    cursor: draggable ? 'grab' : 'default',
                    touchAction: 'none',
                  }}
                  onPointerDown={draggable ? (e) => onPointerDown(e, m) : undefined}
                  onPointerMove={draggable ? onPointerMove : undefined}
                  onPointerUp={draggable ? onPointerUp : undefined}
                >
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
                  {/* area di presa invisibile, allarga il bersaglio del drag anche su touch */}
                  <rect x={-GLYPH / 2} y={0} width={Math.max(GLYPH, spanW)} height={height} fill="transparent" />
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
      {allMarks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-slate-500 pointer-events-none">
          {t('notation.laneHint')}
        </div>
      )}
      {showDemo && (
        <span className="absolute right-2 top-1 text-[10px] text-slate-500 pointer-events-none">
          segni demo (solo sviluppo)
        </span>
      )}
    </div>
  )
}
