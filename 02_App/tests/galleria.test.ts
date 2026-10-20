import { describe, expect, it } from 'vitest'
import type { NodoArg, TipoNodo } from '../src/shared/types'
import { accoglie, destinazioni, iniziale, MODELLI, ordina, STRUTTURA } from '../src/renderer/home/modelli'

const m = (id: string) => [...MODELLI, ...STRUTTURA].find((x) => x.id === id)!
const n = (rel: string, tipo: TipoNodo, figli: NodoArg[] = []): NodoArg => ({ rel, tipo, nome: rel.split('/').pop()!, protetto: false, puoRinominare: true, puoArchiviare: true, info: '', modificato: 0, figli })

const albero: NodoArg[] = [
  n('Italiano', 'materia', [
    n('Italiano/Autori', 'cartella', [n('Italiano/Autori/leopardi', 'autore', [n('Italiano/Autori/leopardi#mappa', 'mappa')])]),
    n('Italiano/Fonti', 'cartella')
  ]),
  n('Telecomunicazioni', 'materia', [
    n('Telecomunicazioni/MikroTik', 'cartella', [n('Telecomunicazioni/MikroTik/Appunti', 'cartella'), n('Telecomunicazioni/MikroTik/note.md', 'appunto')])
  ]),
  n('TPSIT', 'materia', [n('TPSIT/MSP', 'cartella')])
]
const rels = (v: ReturnType<typeof destinazioni>, ok?: boolean) => v.filter((x) => ok === undefined || x.ok === ok).map((x) => x.n.rel)

describe('galleria dei modelli', () => {
  it('consigliati per la materia in cui sei', () => {
    expect(ordina({ tipo: 'cartella', rel: 'TPSIT/MSP' }, '').consigliati.map((x) => x.id)).toEqual(['situazioni', 'appunti'])
    expect(ordina({ tipo: 'autore', rel: 'Italiano/Autori/leopardi' }, '').consigliati.map((x) => x.id)).toEqual(['testo'])
    // in Matematica il modello di matematica viene per primo; fuori da Matematica non è consigliato ma resta scegliibile
    expect(ordina({ tipo: 'materia', rel: 'Matematica' }, '').consigliati.map((x) => x.id)).toEqual(['matematica', 'situazioni', 'appunti'])
    expect(ordina({ tipo: 'cartella', rel: 'TPSIT/MSP' }, '').altri.map((x) => x.id)).toContain('matematica')
    expect(ordina({ tipo: null, rel: '' }, '').consigliati).toEqual([])
    expect(ordina({ tipo: null, rel: '' }, '').altri.length).toBe(MODELLI.length)
  })
  it('la ricerca guarda nome, riga breve e descrizione; nessuna carta morta', () => {
    expect(ordina({ tipo: null, rel: '' }, 'parafrasi').altri.map((x) => x.id)).toEqual(['testo'])
    expect(ordina({ tipo: null, rel: '' }, 'cartella').struttura.map((x) => x.id)).toEqual(['cartella'])
    expect(ordina({ tipo: null, rel: '' }, 'zzz')).toEqual({ consigliati: [], altri: [], struttura: [] })
    expect([...MODELLI, ...STRUTTURA].map((x) => x.id)).not.toContain('mappa')
  })
  it('dove può nascere ogni modello', () => {
    expect(accoglie(m('appunti'), n('TPSIT/MSP', 'cartella'))).toBe(true)
    expect(accoglie(m('appunti'), n('TPSIT', 'materia'))).toBe(true)
    expect(accoglie(m('appunti'), n('Italiano/Fonti', 'cartella'))).toBe(false)
    expect(accoglie(m('situazioni'), n('Italiano', 'materia'))).toBe(false)
    expect(accoglie(m('testo'), n('Italiano/Autori/leopardi', 'autore'))).toBe(true)
    expect(accoglie(m('testo'), n('TPSIT/MSP', 'cartella'))).toBe(false)
    expect(accoglie(m('materia'), n('TPSIT', 'materia'))).toBe(false)
    expect(accoglie(m('matematica'), n('Matematica', 'materia'))).toBe(true)
    expect(accoglie(m('matematica'), n('Italiano', 'materia'))).toBe(false)
    expect(accoglie(m('matematica'), n('Matematica/Limiti per situazioni', 'situazioni'))).toBe(false)
  })
  it('l\'elenco delle destinazioni salta Italiano e i documenti, e tiene la strada per arrivare agli autori', () => {
    const d = destinazioni(m('appunti'), albero)
    expect(rels(d)).toEqual(['Telecomunicazioni', 'Telecomunicazioni/MikroTik', 'Telecomunicazioni/MikroTik/Appunti', 'TPSIT', 'TPSIT/MSP'])
    expect(d.every((x) => x.ok)).toBe(true)
    expect(d.find((x) => x.n.rel === 'Telecomunicazioni/MikroTik/Appunti')!.livello).toBe(2)
    const a = destinazioni(m('testo'), albero)
    expect(rels(a)).toEqual(['Italiano', 'Italiano/Autori', 'Italiano/Autori/leopardi'])
    expect(rels(a, true)).toEqual(['Italiano/Autori/leopardi'])
    expect(destinazioni(m('materia'), albero)).toEqual([])
  })
  it('la cartella proposta è quella in cui sei, o la più vicina che va bene', () => {
    const d = destinazioni(m('appunti'), albero)
    expect(iniziale({ tipo: 'cartella', rel: 'TPSIT/MSP' }, d)).toBe('TPSIT/MSP')
    expect(iniziale({ tipo: 'appunto', rel: 'TPSIT/MSP/Appunti/i2c.md' }, d)).toBe('TPSIT/MSP')
    expect(iniziale({ tipo: null, rel: '' }, d)).toBe('')
    expect(iniziale({ tipo: 'cartella', rel: 'Italiano/Fonti' }, d)).toBe('')
    // un solo posto possibile: lo propone da solo, anche partendo dalla Home
    expect(iniziale({ tipo: null, rel: '' }, destinazioni(m('testo'), albero))).toBe('Italiano/Autori/leopardi')
    expect(iniziale({ tipo: 'autore', rel: 'Italiano/Autori/leopardi' }, destinazioni(m('testo'), albero))).toBe('Italiano/Autori/leopardi')
  })
})
