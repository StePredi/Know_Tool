import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leggiIndice, leggiSchedaSit, type SchedaSit, type Situazioni } from '../src/shared/situazioni'
import { haFormule, sezioniFormulario } from '../src/renderer/situazioni/dati_formulario'

const dir = resolve(__dirname, '../../01_Argomenti/Matematica/Derivate/Derivate per situazioni')
describe.skipIf(!existsSync(dir))('Formulario di Derivate', () => {
  const indice = leggiIndice(readFileSync(join(dir, 'indice.yaml'), 'utf8')).indice!
  const schede: Record<string, SchedaSit> = {}
  for (const n of readdirSync(join(dir, 'schede'))) {
    const s = leggiSchedaSit(readFileSync(join(dir, 'schede', n), 'utf8'), n).scheda!
    schede[s.id] = s
  }
  const dati = { rel: 'x', indice, schede, ripassate: [], avvisi: [] } as Situazioni
  it('mostra tutte le 22 schede, una sezione per ramo, numerate da 1', () => {
    const sez = sezioniFormulario(dati, null)
    expect(sez).toHaveLength(6)
    expect(sez.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(sez.flatMap((x) => x.ids)).toHaveLength(22)
    expect(haFormule(dati)).toBe(true)
  })
  it('la ricerca lascia solo le schede trovate e tiene il numero del ramo', () => {
    const sez = sezioniFormulario(dati, new Set(['prodotto']))
    expect(sez).toHaveLength(1)
    expect(sez[0]!.ids).toEqual(['prodotto'])
    expect(sez[0]!.n).toBe(4)
    expect(sezioniFormulario(dati, new Set())).toEqual([])
  })
})
