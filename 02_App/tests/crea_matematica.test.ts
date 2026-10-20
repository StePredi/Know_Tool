import { mkdtemp, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { creaMatematica, leggiAlbero } from '../src/main/esplora'
import { leggiSituazioni } from '../src/main/situazioni'

describe('nuovo documento di matematica', () => {
  it('nasce come «Per situazioni» con una regola, si legge senza avvisi e compare nell\'albero', async () => {
    const radice = await mkdtemp(join(tmpdir(), 'kt-mat-'))
    await mkdir(join(radice, '01_Argomenti', 'Matematica'), { recursive: true })
    const rel = await creaMatematica(radice, 'Matematica', 'Limiti')
    expect(rel).toBe('Matematica/Limiti per situazioni')
    const d = await leggiSituazioni(radice, rel)
    expect(d.avvisi).toEqual([])
    expect(d.indice.ingresso).toBe('Cosa vedo')
    expect(d.schede['prima-regola']!.tipo).toBe('regola')
    const mat = (await leggiAlbero(radice)).find((n) => n.nome === 'Matematica')!
    expect(mat.figli.map((f) => [f.nome, f.tipo])).toEqual([['Limiti per situazioni', 'situazioni']])
    await expect(creaMatematica(radice, 'Matematica', 'Limiti')).rejects.toThrow(/Esiste già/)
    await expect(creaMatematica(radice, 'Italiano', 'X')).rejects.toThrow()
  })
})
