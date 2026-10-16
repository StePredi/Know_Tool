import { describe, expect, it } from 'vitest'
import { disponibile, MODELLI, ordina } from '../src/renderer/home/modelli'

const m = (id: string) => MODELLI.find((x) => x.id === id)!
describe('galleria dei modelli', () => {
  it('consigliati per la materia in cui sei', () => {
    expect(ordina({ tipo: 'cartella', rel: 'TPSIT/MSP' }, '').consigliati.map((x) => x.id)).toEqual(['situazioni', 'appunti'])
    expect(ordina({ tipo: 'autore', rel: 'italiano/autori/leopardi' }, '').consigliati.map((x) => x.id)).toEqual(['testo', 'mappa'])
    expect(ordina({ tipo: null, rel: '' }, '').consigliati).toEqual([])
    expect(ordina({ tipo: null, rel: '' }, '').altri.length).toBe(MODELLI.length)
  })
  it('la ricerca guarda nome e descrizione', () => {
    expect(ordina({ tipo: null, rel: '' }, 'tempo').altri.map((x) => x.id)).toEqual(['mappa'])
    expect(ordina({ tipo: null, rel: '' }, 'zzz').altri).toEqual([])
  })
  it('dove si può creare', () => {
    expect(disponibile(m('situazioni'), { tipo: 'cartella', rel: 'TPSIT/MSP' })).toBe(true)
    expect(disponibile(m('situazioni'), { tipo: 'cartella', rel: 'italiano/x' })).toBe(false)
    expect(disponibile(m('situazioni'), { tipo: null, rel: '' })).toBe(false)
    expect(disponibile(m('testo'), { tipo: 'autore', rel: 'italiano/autori/a' })).toBe(true)
    expect(disponibile(m('testo'), { tipo: 'cartella', rel: 'TPSIT' })).toBe(false)
    expect(disponibile(m('mappa'), { tipo: 'autore', rel: 'italiano/autori/a' })).toBe(false)
  })
})
