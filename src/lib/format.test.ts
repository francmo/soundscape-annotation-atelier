import { describe, expect, it } from 'vitest'
import { formatDuration, formatTime, parseTime } from './format'

describe('formatTime', () => {
  it('formatta i secondi in mm:ss.ms', () => {
    expect(formatTime(222.15)).toBe('03:42.150')
    expect(formatTime(222.15, false)).toBe('03:42')
    expect(formatTime(0)).toBe('00:00.000')
  })

  it('gestisce input non validi senza lanciare', () => {
    expect(formatTime(-3)).toBe('00:00')
    expect(formatTime(Number.NaN)).toBe('00:00')
  })
})

describe('parseTime', () => {
  it('accetta mm:ss, secondi puri e virgola decimale', () => {
    expect(parseTime('3:42')).toBe(222)
    expect(parseTime('03:42.5')).toBeCloseTo(222.5)
    expect(parseTime('90')).toBe(90)
    expect(parseTime('2,5')).toBeCloseTo(2.5)
  })

  it('rifiuta secondi >= 60 nella forma mm:ss e input non numerici', () => {
    expect(parseTime('1:75')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('')).toBeNull()
    expect(parseTime('-5')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('scala fra secondi, minuti e ore', () => {
    expect(formatDuration(12.34)).toBe('12.3 s')
    expect(formatDuration(90)).toBe(`1'30"`)
    expect(formatDuration(3723)).toBe(`1h 2'03"`)
  })
})
