import { describe, expect, it } from 'vitest'
import { calcolaMappa, chiaveGruppo, chiaveRamo, tutteLeChiavi } from '../src/renderer/situazioni/layout'
import type { IndiceSit } from '../src/shared/situazioni'

const indice = {
  modello: 'per_situazioni',
  titolo: 'T',
  centro: 'C',
  sottotitolo: '',
  prefissoCommento: '#',
  rami: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
    id,
    nome: id,
    colore: 'blue',
    lato: 'destra',
    voci: [{ schede: [`${id}1`] }, { gruppo: 'G' + i, schede: [`${id}2`, `${id}3`] }]
  }))
} as unknown as IndiceSit
const esiste = (): boolean => true
const testi = (id: string): { sigla: string; sotto: string; frase: boolean } => ({ sigla: id, sotto: 'cmd', frase: false })
const schede = (a: ReturnType<typeof calcolaMappa>): number => a.nodi.filter((n) => n.tipo === 'scheda').length
const tipo = (a: ReturnType<typeof calcolaMappa>, t: string): number => a.nodi.filter((n) => n.tipo === t).length

describe('mappa a nodi apribili', () => {
  it('tutto chiuso: solo centro e rami', () => {
    const l = calcolaMappa(indice, esiste, new Set(), testi)
    expect([tipo(l, 'centro'), tipo(l, 'ramo'), tipo(l, 'gruppo'), schede(l)]).toEqual([1, 5, 0, 0])
    expect(l.nodi.find((n) => n.tipo === 'ramo')).toMatchObject({ n: 3, aperto: false })
  })
  it('ramo aperto: compaiono gruppi e foglie, ma non le schede dei gruppi chiusi', () => {
    const l = calcolaMappa(indice, esiste, new Set([chiaveRamo(0)]), testi)
    expect([tipo(l, 'gruppo'), schede(l)]).toEqual([1, 1])
    const l2 = calcolaMappa(indice, esiste, new Set([chiaveRamo(0), chiaveGruppo(0, 'G0')]), testi)
    expect(schede(l2)).toBe(3)
  })
  it('tutte le chiavi aprono tutto; il centro resta al centro', () => {
    const l = calcolaMappa(indice, esiste, new Set(tutteLeChiavi(indice, esiste)), testi)
    expect(schede(l)).toBe(15)
    const c = l.nodi.find((n) => n.tipo === 'centro')!
    expect(c.x + c.w / 2).toBeCloseTo(l.W / 2)
    expect(c.y + c.h / 2).toBeCloseTo(l.H / 2)
  })
})

import { righe, altezzaScheda } from '../src/renderer/situazioni/layout'
describe('testo esteso', () => {
  it('righe: va a capo e spezza le parole lunghe', () => {
    expect(righe('abc', 14)).toBe(1)
    expect(righe('uno due tre quattro cinque sei', 14)).toBe(3)
    expect(righe('x'.repeat(30), 14)).toBe(3)
  })
  it('le caselle crescono con il testo', () => {
    expect(altezzaScheda('Lunghissima sigla di prova qui', 'comando lungo lungo lungo lungo', false)).toBeGreaterThan(altezzaScheda('A', 'b', false))
  })
})
