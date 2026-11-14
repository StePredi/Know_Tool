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
