// Golden file della demo IIIF pubblicata in public/iiif/demo/.
// Verifica che manifest.json sia allineato all'exporter corrente. Per rigenerarlo
// dopo una modifica all'exporter o al progetto demo: `npm run demo:iiif`
// (imposta UPDATE_DEMO=1 e riscrive il file).
import { describe, expect, it } from 'vitest'
import type { AnnotationProject } from '../types/annotation'
import { buildIiifManifest } from './iiifExporter'
import projectRaw from '../../public/iiif/demo/project.annotation.json?raw'
import manifestRaw from '../../public/iiif/demo/manifest.json?raw'

const BASE = 'https://atelier.francescomariano.art/iiif/demo'
const MANIFEST_URL = new URL('../../public/iiif/demo/manifest.json', import.meta.url)

const updateRequested = (): boolean => {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  return g.process?.env?.UPDATE_DEMO === '1'
}

describe('demo IIIF pubblicata', () => {
  it('manifest.json corrisponde all\'export del progetto demo', async () => {
    const project = JSON.parse(projectRaw) as AnnotationProject
    const manifest = buildIiifManifest(project, {
      baseUri: BASE,
      // Audio pubblico dei fixture IIIF (ricetta 0002/0103 del Cookbook), 707,81 s.
      audioUrl: 'https://fixtures.iiif.io/audio/ubc/Performing-the-Archive-Leaf-leafs-by-Daphne-Marlatt.mp3',
      atelierJsonUrl: `${BASE}/project.annotation.json`,
    })
    const text = JSON.stringify(manifest, null, 2) + '\n'
    if (updateRequested()) {
      // Scrittura solo su richiesta esplicita (npm run demo:iiif); vitest gira in Node.
      // @ts-expect-error tipi di Node non inclusi nel progetto browser
      const fs = (await import('node:fs')) as { writeFileSync: (p: URL, d: string) => void }
      fs.writeFileSync(MANIFEST_URL, text)
      return
    }
    expect(manifestRaw).toBe(text)
  })
})
