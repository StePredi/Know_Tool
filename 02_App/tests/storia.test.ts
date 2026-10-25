import { mkdtemp, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { leggiSituazioni, leggiMateriaStoria } from '../src/main/situazioni'
import { controllaSituazioni, leggiSchedaSit, ordineSchede, copertura, ETICHETTA_LEGA } from '../src/shared/situazioni'
import type { SchedaConfronto, SchedaVoce } from '../src/shared/situazioni'

const MACRO = 'Storia/Il mondo tra Otto e Novecento'
const ALLEANZE = `${MACRO}/Le alleanze europee/Le alleanze europee per situazioni`
const DARWIN = `${MACRO}/Darwinismo sociale e teorie razziali/Darwinismo sociale e teorie razziali per situazioni`
let radice = ''

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-storia-'))
  // copia dei dati veri: i test non toccano mai la cartella dell'utente
  await cp(resolve(__dirname, '..', '..', '01_Argomenti', 'Storia'), join(radice, '01_Argomenti', 'Storia'), { recursive: true })
})

describe('Storia: i due argomenti veri si leggono', () => {
  it('«Le alleanze europee»: 18 schede, 6 rami, nessun avviso', async () => {
    const d = await leggiSituazioni(radice, ALLEANZE)
    expect(d.avvisi).toEqual([])
    expect(Object.keys(d.schede)).toHaveLength(18)
    expect(d.indice.rami).toHaveLength(6)
    expect(ordineSchede(d.indice)).toHaveLength(18)
    expect(d.schede['triplice-1882']!.tipo).toBe('voce')
    expect(d.schede['due-blocchi']!.tipo).toBe('confronto')
  })

  it('«Darwinismo sociale»: 12 schede, 4 rami, nessun avviso', async () => {
    const d = await leggiSituazioni(radice, DARWIN)
    expect(d.avvisi).toEqual([])
    expect(Object.keys(d.schede)).toHaveLength(12)
    expect(d.indice.rami).toHaveLength(4)
  })

  it('i cinque campi del libro e le sezioni di dettaglio arrivano interi', async () => {
    const d = await leggiSituazioni(radice, ALLEANZE)
    const s = d.schede['triplice-1882'] as SchedaVoce
    expect(s.genere).toBe('evento')
    expect(s.quando).toBe('1882')
    expect(s.dove).toBe('Europa')
    expect(s.chi).toEqual(['Germania', 'Austria-Ungheria', 'Italia'])
    expect(s.cosa).toContain('militare e solo difensivo')
    expect(s.conta).toContain('terre irredente')
    expect(s.svolgimento).toHaveLength(4)
    expect(s.svolgimento[0]!.quando).toBe('1881')
    expect(s.elementi).toHaveLength(4)
    expect(s.errore).toBeTruthy()
    expect(s.nota).toBeTruthy()
    expect(s.da.map((x) => `${x.l}${x.c}.${x.p}`)).toEqual(['T18.1', 'Q2.5'])
  })

  it('la sigla manca? si usa il titolo; il comando sulla foglia è la data', async () => {
    const r = leggiSchedaSit(
      'tipo: voce\nid: prova\ntitolo: Una voce senza sigla\ngenere: concetto\nquando: "1900"\ncosa: che cos\'è\nconta: perché conta\n',
      'prova.yaml'
    )
    expect(r.errore).toBeUndefined()
    const s = r.scheda as SchedaVoce
    expect(s.sigla).toBe('Una voce senza sigla')
    expect(s.comando).toBe('1900')
  })

  it('i collegamenti hanno un tipo noto e puntano a schede che esistono', async () => {
    const d = await leggiSituazioni(radice, ALLEANZE)
    let n = 0
    for (const s of Object.values(d.schede)) {
      if (s.tipo !== 'voce') continue
      for (const g of s.lega) {
        if (g.documento) continue
        expect(ETICHETTA_LEGA[g.tipo]).toBeTruthy()
        expect(d.schede[g.scheda], `${s.id} → ${g.scheda}`).toBeTruthy()
        n++
      }
    }
    expect(n).toBeGreaterThan(15)
  })

  it('un collegamento verso un altro documento è un avviso, non un errore', async () => {
    const d = await leggiSituazioni(radice, DARWIN)
    const s = d.schede['eugenetica'] as SchedaVoce
    expect(s.lega[0]!.documento).toBe('totalitarismi')
    expect(d.avvisi).toEqual([]) // non blocca e non si segnala finché quel documento non c'è
  })

  it('«confronto»: ogni caso ha tante risposte quante sono le domande', async () => {
    const d = await leggiSituazioni(radice, ALLEANZE)
    const c = d.schede['due-blocchi'] as SchedaConfronto
    expect(c.domande).toHaveLength(4)
    for (const caso of c.casi) expect(caso.risposte).toHaveLength(c.domande.length)
    expect(c.casi.map((x) => x.nome)).toEqual(['Triplice alleanza', 'Triplice intesa'])
  })

  it('se un caso ha meno risposte delle domande, arriva un avviso', async () => {
    const d = await leggiSituazioni(radice, ALLEANZE)
    const rotta = { ...(d.schede['due-blocchi'] as SchedaConfronto) }
    rotta.casi = [{ ...rotta.casi[0]!, risposte: ['solo una'] }, rotta.casi[1]!]
    const av = controllaSituazioni(d.indice, { ...d.schede, 'due-blocchi': rotta })
    expect(av.join(' ')).toContain('ha 1 risposte ma le domande sono 4')
  })

  it('le voci senza data e i generi sono quelli attesi (viste ricavate)', async () => {
    const d = await leggiSituazioni(radice, DARWIN)
    const voci = Object.values(d.schede).filter((s): s is SchedaVoce => s.tipo === 'voce')
    expect(voci.filter((s) => s.genere === 'persona')).toHaveLength(4)
    expect(voci.filter((s) => s.genere === 'concetto')).toHaveLength(7)
    const alleanze = await leggiSituazioni(radice, ALLEANZE)
    const sv = Object.values(alleanze.schede).filter((s) => s.tipo === 'voce' && s.svolta)
    expect(sv.map((s) => s.id).sort()).toEqual(['caduta-bismarck-1890', 'polveriera'])
  })
})

describe('Il macro-argomento della verifica', () => {
  it('gli otto documenti si leggono tutti, senza errori né avvisi', async () => {
    const { documenti } = await leggiMateriaStoria(radice, 'Storia')
    expect(documenti.map((d) => d.titolo).sort()).toEqual([
      "Fuori dall'Europa — Asia e Americhe",
      'Italia fine Ottocento',
      "L'età degli imperialismi",
      'La belle époque e la società di massa',
      'Le alleanze europee',
      'Le potenze europee una per una',
      'Darwinismo sociale e teorie razziali',
      'Seconda rivoluzione industriale'
    ].sort())
    for (const d of documenti) {
      const letto = await leggiSituazioni(radice, d.rel)
      expect(letto.avvisi, d.titolo).toEqual([])
    }
  })

  it('ogni collegamento verso un altro documento trova documento e scheda', async () => {
    const { documenti } = await leggiMateriaStoria(radice, 'Storia')
    const perTitolo = new Map(documenti.map((d) => [d.titolo, new Set(d.schede.map((s) => s.id))]))
    let n = 0
    for (const d of documenti) {
      const letto = await leggiSituazioni(radice, d.rel)
      for (const s of Object.values(letto.schede)) {
        if (s.tipo !== 'voce') continue
        for (const g of s.lega) {
          if (!g.documento) continue
          if (g.documento === 'totalitarismi') continue // argomento non ancora studiato
          const ids = perTitolo.get(g.documento)
          expect(ids, `${d.titolo}/${s.id} → documento «${g.documento}»`).toBeTruthy()
          expect(ids!.has(g.scheda), `${d.titolo}/${s.id} → ${g.documento}/${g.scheda}`).toBe(true)
          n++
        }
      }
    }
    expect(n).toBeGreaterThan(5)
  })

  it('la copertura del libro arriva a tutti i paragrafi letti', async () => {
    const { libri, documenti } = await leggiMateriaStoria(radice, 'Storia')
    const righe = copertura(libri, documenti).filter((r) => r.titoloCapitolo !== '(non ancora letto)')
    expect(righe).toHaveLength(25)
    const scoperti = righe.filter((r) => r.schede.length === 0).map((r) => `c${r.capitolo}.${r.paragrafo}`)
    expect(scoperti).toEqual([])
  })
})
