export class AudioDecodeError extends Error {
  readonly filename: string
  constructor(filename: string, cause?: unknown) {
    super(`Unable to decode audio data for "${filename}"`)
    this.name = 'AudioDecodeError'
    this.filename = filename
    if (cause) (this as { cause?: unknown }).cause = cause
  }
}
