import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leggiAlbero } from '../src/main/esplora'
import type { NodoArg } from '../src/shared/types'

const radice = resolve(__dirname, '../..')

function raccogli(n: NodoArg, out: string[] = []): string[] {
  if (n.tipo === 'situazioni') out.push(n.rel)
  for (const f of n.figli) raccogli(f, out)
  return out
}

describe.skipIf(!existsSync(resolve(radice, '01_Argomenti/Matematica')))('albero: documenti di matematica', () => {
  it('trova tutti i documenti «per situazioni», anche dentro Biennio/', async () => {
    const albero = await leggiAlbero(radice)
    const mat = albero.find((n) => n.nome === 'Matematica')!
    const doc = raccogli(mat)
    expect(doc.length).toBeGreaterThan(0)
    expect(doc.some((r) => /^Matematica\/Biennio\/.+ per situazioni$/.test(r.replace(/\\/g, '/')))).toBe(true)
    // tutti hanno anche l'icona di matematica: la cartella di primo livello è Matematica
    for (const r of doc) expect(r.split(/[\\/]/)[0]).toBe('Matematica')
  })
})
