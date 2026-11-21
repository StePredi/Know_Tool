import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { schemaScheda } from '../src/shared/situazioni'
import { aggiungiBlocco, bloccoVuoto, eliminaBlocco, nuovoBlocco, riassuntoBlocco, spostaBlocco, tipoBlocco, TIPI_BLOCCO, type Blocco } from '../src/shared/bloccoSpiegazione'

const base = (blocchi: Blocco[]): unknown => ({ id: 'p', tipo: 'spiegazione', titolo: 'P', sigla: 'P', comando: 'x', frase: '', quando: 'q', blocchi })

describe('blocchi di una spiegazione', () => {
  const tre: Blocco[] = [{ titolo: 'A' }, { testo: 'B' }, { punti: ['C'] }]

  it('aggiunge dopo il blocco scelto, in cima o in fondo', () => {
    expect(aggiungiBlocco(tre, 'nota', 0)).toMatchObject({ pos: 1 })
    expect(aggiungiBlocco(tre, 'nota', 0).blocchi.map((b) => tipoBlocco(b))).toEqual(['titolo', 'nota', 'testo', 'punti'])
    expect(aggiungiBlocco(tre, 'nota', -1).pos).toBe(0)
    expect(aggiungiBlocco(tre, 'nota', 99).pos).toBe(3)
    expect(tre).toHaveLength(3) // l'originale non cambia
  })

  it('sposta su e giù e non esce dai bordi', () => {
    expect(spostaBlocco(tre, 1, -1).blocchi.map((b) => tipoBlocco(b))).toEqual(['testo', 'titolo', 'punti'])
    expect(spostaBlocco(tre, 1, -1).pos).toBe(0)
    expect(spostaBlocco(tre, 0, -1)).toEqual({ blocchi: tre, pos: 0 })
    expect(spostaBlocco(tre, 2, 1)).toEqual({ blocchi: tre, pos: 2 })
  })

  it('elimina e tiene selezionato un blocco che esiste', () => {
    expect(eliminaBlocco(tre, 2)).toMatchObject({ pos: 1 })
    expect(eliminaBlocco(tre, 0).blocchi.map((b) => tipoBlocco(b))).toEqual(['testo', 'punti'])
    expect(eliminaBlocco([{ nota: 'x' }], 0)).toEqual({ blocchi: [], pos: -1 })
  })

  it('un blocco nuovo è vuoto ed è del tipo giusto; compilato passa lo schema', () => {
    for (const t of TIPI_BLOCCO) {
      const b = nuovoBlocco(t)
      expect(tipoBlocco(b)).toBe(t)
      expect(bloccoVuoto(b)).toBe(true)
      expect(Object.keys(b)).toHaveLength(1)
    }
    expect(bloccoVuoto({ testo: 'ciao' })).toBe(false)
    expect(bloccoVuoto({ punti: ['', 'x'] })).toBe(false)
    expect(bloccoVuoto({ tabella: { colonne: ['A', ''], righe: [['', '']] } })).toBe(false)
  })

  it('i blocchi vuoti sono rifiutati dallo schema, quelli compilati no', () => {
    expect(schemaScheda.safeParse(base([nuovoBlocco('testo')])).success).toBe(false)
    expect(schemaScheda.safeParse(base([nuovoBlocco('punti')])).success).toBe(false)
    expect(schemaScheda.safeParse(base([{ titolo: 'T' }, { testo: 'x' }, { punti: ['a'] }, { nota: 'n' }, { trappola: 't' }])).success).toBe(true)
  })

  it('YAML → blocchi → YAML dà lo stesso testo', () => {
    const src = 'tipo: spiegazione\nblocchi:\n  - titolo: Come funziona\n  - punti:\n      - uno\n      - due\n'
    const o = YAML.parse(src) as { blocchi: Blocco[] }
    const dopo = aggiungiBlocco(o.blocchi, 'nota', 0)
    const tolto = eliminaBlocco(dopo.blocchi, dopo.pos)
    expect(YAML.stringify({ tipo: 'spiegazione', blocchi: tolto.blocchi })).toBe(YAML.stringify(YAML.parse(src)))
  })

  it('riassume ogni tipo in una riga', () => {
    expect(riassuntoBlocco({ punti: ['a', 'b'] })).toBe('2 punti')
    expect(riassuntoBlocco({ punti: ['a'] })).toBe('1 punto')
    expect(riassuntoBlocco({ tabella: { colonne: ['A', 'B'], righe: [['1', '2'], ['3', '4']] } })).toBe('2 colonne × 2 righe')
    expect(riassuntoBlocco({ disegno: { modello: 'flusso', nodi: ['a', 'b', 'c'] } })).toBe('Flusso: 3 nodi')
    expect(riassuntoBlocco({ testo: '' })).toBe('(vuoto)')
    expect(riassuntoBlocco({ nota: 'x'.repeat(80) })).toHaveLength(48)
  })
})

import { formAStrato, stratoAForm, puliziaBlocco, tabellaAggiungiColonna, tabellaTogliColonna, tabellaAggiungiRiga, tabellaTogliRiga, tabellaSpostaRiga, tabellaImposta, disegnoNuovo, frecceAllineate } from '../src/shared/bloccoSpiegazione'

describe('passo 2: moduli per carte, tabella, disegni', () => {
  it('un livello di pila va avanti e indietro senza cambiare forma', () => {
    for (const s of ['Hardware', ['App A', 'App B'], { testo: 'Kernel', tono: 'scuro' }, { testo: ['x', 'y'], tono: 'oro' }]) {
      expect(formAStrato(stratoAForm(s))).toEqual(s)
    }
    expect(stratoAForm(['a', 'b'])).toEqual({ testo: 'a | b', tono: 'chiaro' })
    expect(formAStrato({ testo: 'a | b', tono: 'chiaro' })).toEqual(['a', 'b'])
    expect(formAStrato({ testo: 'a |', tono: 'chiaro' })).toBe('a |') // finché si scrive non si spezza
  })

  it('la tabella tiene allineate colonne e righe', () => {
    const t = { colonne: ['A', 'B'], righe: [['1', '2'], ['3', '4']] }
    expect(tabellaAggiungiColonna(t)).toEqual({ colonne: ['A', 'B', ''], righe: [['1', '2', ''], ['3', '4', '']] })
    expect(tabellaTogliColonna(tabellaAggiungiColonna(t), 2)).toEqual(t)
    expect(tabellaTogliColonna(t, 0)).toBe(t) // sempre almeno due colonne
    expect(tabellaAggiungiRiga(t).righe[2]).toEqual(['', ''])
    expect(tabellaTogliRiga({ ...t, righe: [['1', '2']] }, 0).righe).toHaveLength(1)
    expect(tabellaSpostaRiga(t, 0, 1).righe).toEqual([['3', '4'], ['1', '2']])
    expect(tabellaImposta({ colonne: ['A', 'B'], righe: [['1']] }, 0, 1, 'x').righe).toEqual([['1', 'x']])
    expect(t.righe[0]).toEqual(['1', '2']) // l'originale non cambia
  })

  it('le carte salvate non hanno campi vuoti', () => {
    const b = puliziaBlocco({ carte: [{ titolo: 'T', sotto: '', etichetta: 'Consigliato', testo: '', punti: ['uno', ''], numeri: [{ valore: '16 GB', cosa: '' }, { valore: '', cosa: 'x' }] }] })
    expect(b).toEqual({ carte: [{ titolo: 'T', etichetta: 'Consigliato', punti: ['uno'], numeri: [{ valore: '16 GB' }] }] })
    expect(schemaScheda.safeParse(base([b])).success).toBe(true)
  })

  it('il flusso salvato è la forma più corta e passa lo schema', () => {
    const b = puliziaBlocco({ disegno: { modello: 'flusso', nodi: [{ nome: 'client', sotto: '', punti: [''], tono: 'chiaro' }, { nome: 'daemon', sotto: 'dockerd', punti: [], tono: 'oro' }], frecce: ['comando'], gruppo: { nome: '', da: 1, a: 2 }, nota: '' } })
    expect(b).toEqual({ disegno: { modello: 'flusso', nodi: ['client', { nome: 'daemon', sotto: 'dockerd', tono: 'oro' }], frecce: ['comando'] } })
    expect(schemaScheda.safeParse(base([b])).success).toBe(true)
  })

  it('la pila salvata non ha titoli, cornici o note vuoti', () => {
    const b = puliziaBlocco({ disegno: { modello: 'pile', nota: '', colonne: [{ titolo: '', cornice: '', strati: ['App', ['A', 'B'], { testo: 'Kernel', tono: 'scuro' }], nota: '' }] } })
    expect(b).toEqual({ disegno: { modello: 'pile', colonne: [{ strati: ['App', ['A', 'B'], { testo: 'Kernel', tono: 'scuro' }] }] } })
    expect(schemaScheda.safeParse(base([b])).success).toBe(true)
  })

  it('i disegni di partenza hanno il minimo e le frecce si allineano ai nodi', () => {
    expect(disegnoNuovo('flusso')).toMatchObject({ modello: 'flusso' })
    expect(disegnoNuovo('pile')).toMatchObject({ modello: 'pile' })
    expect(frecceAllineate(['a'], 3)).toEqual(['a', ''])
    expect(frecceAllineate(['a', 'b', 'c'], 2)).toEqual(['a'])
    expect(frecceAllineate([], 1)).toEqual([])
  })

  it('i blocchi del modulo, una volta puliti e compilati, rientrano nello schema', () => {
    const compilato = [
      { carte: [{ titolo: 'VM', numeri: [{ valore: '2 GB', cosa: 'RAM' }] }] },
      { tabella: { colonne: ['A', 'B'], righe: [['x', 'y']] } },
      { comandi: [{ codice: 'docker ps', spiega: 'elenco' }] }
    ]
    expect(schemaScheda.safeParse(base(compilato.map(puliziaBlocco))).success).toBe(true)
  })
})
