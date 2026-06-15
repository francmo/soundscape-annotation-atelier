/** Formatta secondi in mm:ss.ms (es. 03:42.150). */
export function formatTime(seconds: number, withMillis = true): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const total = Math.max(0, seconds)
  const minutes = Math.floor(total / 60)
  const sec = Math.floor(total % 60)
  const ms = Math.floor((total - Math.floor(total)) * 1000)
  const mmss = `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return withMillis ? `${mmss}.${String(ms).padStart(3, '0')}` : mmss
}

/** Converte una stringa mm:ss(.ms) o secondi puri in secondi. null se non valida. */
export function parseTime(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  if (s.includes(':')) {
    const [m, rest] = s.split(':')
    const min = Number(m)
    const sec = Number(rest.replace(',', '.'))
    if (!Number.isFinite(min) || !Number.isFinite(sec) || sec < 0 || sec >= 60) return null
    return min * 60 + sec
  }
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Formatta una durata in secondi/minuti/ore con label. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 s'
  if (seconds < 60) return `${seconds.toFixed(1)} s`
  const minutes = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  if (minutes < 60) return `${minutes}'${String(sec).padStart(2, '0')}"`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}'${String(sec).padStart(2, '0')}"`
}

/** Calcola SHA-256 di un Blob. */
export async function sha256OfBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
