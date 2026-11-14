import { mkdtemp, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { leggiSituazioni } from '../src/main/situazioni'
import { controllaSituazioni, leggiSchedaSit } from '../src/shared/situazioni'

const REL = 'Sistemi e Reti/Docker/Docker per situazioni'
let radice = ''

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-spieg-'))
  // copia dei dati veri: i test non toccano mai la cartella dell'utente
  await cp(resolve(__dirname, '..', '..', '01_Argomenti', 'Sistemi e Reti', 'Docker'), join(radice, '01_Argomenti', 'Sistemi e Reti', 'Docker'), { recursive: true })
})

describe('Scheda «spiegazione»: dati veri di Docker', () => {
  it('legge tutte le schede senza avvisi, con le spiegazioni', async () => {
    const d = await leggiSituazioni(radice, REL)
    expect(d.avvisi).toEqual([])
    expect(controllaSituazioni(d.indice, d.schede)).toEqual([])
    const s = d.schede['vm-o-container']!
    expect(s.tipo).toBe('spiegazione')
    if (s.tipo !== 'spiegazione') return
    expect(s.blocchi.some((b) => 'disegno' in b && b.disegno.modello === 'pile')).toBe(true)
    expect(s.blocchi.some((b) => 'tabella' in b)).toBe(true)
  })

  it('segnala tabelle con celle mancanti e frecce in più, senza bloccare', () => {
    const src = [
      'id: prova', 'tipo: spiegazione', 'titolo: Prova', 'sigla: Prova', 'comando: x', 'frase: ""', 'quando: sempre',
      'blocchi:',
      '- tabella: {colonne: [A, B], righe: [[uno]]}',
      '- disegno: {modello: flusso, nodi: [a, b], frecce: [x, y]}'
    ].join('\n')
    const r = leggiSchedaSit(src, 'prova.yaml')
    expect(r.errore).toBeUndefined()
    const indice = { modello: 'per_situazioni', vista: 'situazioni', titolo: 't', centro: 'c', sottotitolo: '', prefissoCommento: '#', esempiRicerca: '', ingresso: '', guida: '', rami: [{ id: 'b1', nome: 'r', colore: 'red', lato: 'R', ordine: false, quando: '', voci: [{ schede: ['prova'] }] }] } as const
    const av = controllaSituazioni(indice as never, { prova: r.scheda! })
    expect(av).toHaveLength(2)
  })

  it('rifiuta un blocco sconosciuto', () => {
    const r = leggiSchedaSit('id: p\ntipo: spiegazione\ntitolo: P\nsigla: P\ncomando: x\nfrase: ""\nquando: q\nblocchi:\n- immagine: foto.png\n', 'p.yaml')
    expect(r.errore).toBeTruthy()
  })
})
