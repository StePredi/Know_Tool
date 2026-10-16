import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Repository, spostaCartella } from '../src/main/repository'
import { costruisciModello } from '../src/shared/modello'
import { citaDa, corsieBarre, jsonLeggibile, parole, riancora, tokenizza, trovaSpan } from '../src/shared/testo'
import type { Annotazione } from '../src/shared/types'

const VERSI = "Sempre caro mi fu quest'ermo colle,\ne questa siepe, che da tanta parte\ndell'ultimo orizzonte il guardo esclude."

describe('tokenizzazione', () => {
  it("l'apostrofo lega le elisioni, cifre e trattini non sono parole", () => {
    expect(parole("quest'ermo m'è l’eterno 12 -- a-b")).toEqual(["quest'ermo", "m'è", 'l’eterno', 'a', 'b'])
  })
  it('versi: un blocco per riga; prosa: uno per paragrafo; gli indici dei token restano uguali', () => {
    const v = tokenizza(VERSI, 'verso')
    const p = tokenizza(VERSI, 'prosa')
    expect(v.blocchi).toHaveLength(3)
    expect(p.blocchi).toHaveLength(1)
    expect(v.token.map((t) => t.text)).toEqual(p.token.map((t) => t.text))
  })
  it('citaDa e trovaSpan sono l\'uno l\'inverso dell\'altro', () => {
    const tk = tokenizza(VERSI, 'verso')
    const s = trovaSpan(tk.token, 'questa siepe')!
    expect(s).toEqual([7, 8])
    expect(citaDa(VERSI, tk.token, s)).toBe('questa siepe')
  })
})

describe('riaggancio', () => {
  const nuovo = "PRIMA RIGA AGGIUNTA\n" + VERSI
  it('parole ancora al loro posto → ok', () => {
    expect(riancora([7, 8], 'questa siepe', tokenizza(VERSI, 'verso'), VERSI)).toEqual({ span: [7, 8], stato: 'ok' })
  })
  it('testo spostato, una sola occorrenza → riagganciata', () => {
    const tk = tokenizza(nuovo, 'verso')
    const r = riancora([7, 8], 'questa siepe', tk, nuovo)
    expect(r.stato).toBe('riagganciata')
    expect(r.span).toEqual([10, 11])
  })
  it('più occorrenze → vince la più vicina alla posizione precedente', () => {
    const c = 'a b c a b c a b'
    const tk = tokenizza(c, 'prosa')
    expect(riancora([1, 2], 'a b', tk, c)).toEqual({ span: [0, 1], stato: 'riagganciata' })
    expect(riancora([4, 5], 'a b', tk, c)).toEqual({ span: [3, 4], stato: 'riagganciata' })
  })
  it('nessuna occorrenza → rotta, lo span scritto resta', () => {
    expect(riancora([0, 1], 'parole che non ci sono', tokenizza(VERSI, 'verso'), VERSI)).toEqual({ span: [0, 1], stato: 'rotta' })
  })
  it('equidistanti → ambigua, decide la persona', () => {
    const c = 'a b x x a b'
    expect(riancora([2, 2], 'a b', tokenizza(c, 'prosa'), c).stato).toBe('ambigua')
  })
})

describe('barre sovrapposte', () => {
  const base = { citato: null, stato: 'ok', spanScritto: null, figura: null, parola_chiave: false, nota: '', flashcard: false, schede: [], sottolinea: false } as const
  it('annotazioni che si sovrappongono vanno su corsie diverse', () => {
    const anns = [
      { ...base, id: 'a', span: [0, 5], evidenzia: 'concetto' },
      { ...base, id: 'b', span: [3, 4], evidenzia: 'dubbio' },
      { ...base, id: 'c', span: [8, 9], evidenzia: 'concetto' }
    ] as unknown as Annotazione[]
    const c = corsieBarre(anns)
    expect(c.get('a')).toBe(0)
    expect(c.get('b')).toBe(1)
    expect(c.get('c')).toBe(0)
  })
})

describe('json leggibile', () => {
  it('intervalli e coppie id/frase su una riga', () => {
    const t = jsonLeggibile([{ id: 'a', span: [1, 2], schede: [{ id: 'x', frase: 'ciao' }] }])
    expect(t).toContain('"span": [1, 2]')
    expect(t).toContain('{ "id": "x", "frase": "ciao" }')
    expect(JSON.parse(t)).toEqual([{ id: 'a', span: [1, 2], schede: [{ id: 'x', frase: 'ciao' }] }])
  })
})

const sorgente = resolve(__dirname, '../../01_Argomenti')
const dirInf = (r: string): string => join(r, '01_Argomenti/Italiano/Autori/leopardi/testi/inf')

describe.skipIf(!existsSync(join(sorgente, 'Italiano/Autori/leopardi/testi/inf')))("testi: L'infinito", () => {
  let repo: Repository | null = null
  afterEach(async () => {
    await repo?.ferma()
    repo = null
  })
  function copia(): string {
    const r = mkdtempSync(join(tmpdir(), 'kt-testi-'))
    cpSync(sorgente, join(r, '01_Argomenti'), { recursive: true })
    return r
  }
  async function apri(r: string): Promise<Repository> {
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    return repo
  }

  it('legge testo, annotazioni, parafrasi, esercizi e figure senza problemi', async () => {
    const m = (await apri(copia())).modello()
    const t = m.testi.find((x) => x.id === 'inf')!
    expect(t.titolo).toBe("L'infinito")
    expect(t.scheda).toBe('inf')
    expect(t.annotazioni).toHaveLength(8)
    expect(t.parafrasi).toHaveLength(2)
    expect(t.esercizi).toHaveLength(6)
    expect(m.figure.length).toBeGreaterThan(20)
    expect(m.problemi.filter((p) => p.gravita === 'errore')).toEqual([])
    expect(m.problemi.filter((p) => p.file.startsWith('testi/'))).toEqual([])
    expect([...t.annotazioni, ...t.parafrasi].every((a) => a.stato === 'ok')).toBe(true)
  })

  it('modificare il testo riaggancia da sola e conta i casi da sistemare, senza perdere nulla', async () => {
    const r = copia()
    const rep = await apri(r)
    const t = rep.modello().testi[0]!
    const nuovo = 'Titolo aggiunto in cima\n' + t.corpo.replace('questa siepe', 'quella siepe')
    const { modello, esito } = await rep.modificaCorpo('inf', nuovo)
    const x = modello.testi[0]!
    expect(esito.riagganciate).toBeGreaterThan(0)
    expect(esito.daSistemare).toBeGreaterThan(0)
    expect(x.annotazioni).toHaveLength(8)
    const siepe = x.annotazioni.find((a) => a.citato === 'questa siepe')!
    expect(siepe.stato).toBe('rotta')
    const sempre = x.annotazioni.find((a) => a.id === 'a001')!
    expect(sempre.stato).toBe('ok')
    expect(sempre.span![0]).toBe(4) // «Titolo aggiunto in cima» = 4 parole: tutto scivola in avanti
    expect(readFileSync(join(dirInf(r), 'testo.md'), 'utf8')).toContain('Titolo aggiunto in cima')
  })

  it('salvaVoce: crea con id nuovo, aggiorna per id, preserva campi sconosciuti', async () => {
    const r = copia()
    const rep = await apri(r)
    const vecchio = JSON.parse(readFileSync(join(dirInf(r), 'annotazioni.json'), 'utf8'))
    vecchio[0].campo_futuro = 42
    writeFileSync(join(dirInf(r), 'annotazioni.json'), JSON.stringify(vecchio, null, 2))
    await rep.carica()
    const n = await rep.salvaVoce('inf', 'annotazioni', { span: [0, 0], citato: 'Sempre', evidenzia: 'dubbio' })
    expect(n.id).toBe('a009')
    await rep.salvaVoce('inf', 'annotazioni', { id: 'a001', nota: 'Nota cambiata' })
    const letto = JSON.parse(readFileSync(join(dirInf(r), 'annotazioni.json'), 'utf8'))
    expect(letto).toHaveLength(9)
    expect(letto[0].nota).toBe('Nota cambiata')
    expect(letto[0].campo_futuro).toBe(42)
    expect(letto[0].span).toEqual([0, 5])
    expect(letto[0].stato).toBeUndefined()
    const e = await rep.salvaVoce('inf', 'esercizi', { testo: 'Nuova domanda', risposta: '', correzione: '', fatta: false, passi: [] })
    expect(rep.modello().testi[0]!.esercizi.find((x) => x.id === e.id)!.numero).toBe(7)
    const m = await rep.eliminaVoce('inf', 'annotazioni', n.id)
    expect(m.testi[0]!.annotazioni).toHaveLength(8)
  })

  it('creaTesto: cartella nuova con json vuoti, id libero', async () => {
    const r = copia()
    const rep = await apri(r)
    const a = await rep.creaTesto({ titolo: "L'infinito", layout: 'verso', corpo: 'uno due\ntre', anno: '1819' })
    expect(a.id).toBe('l_infinito')
    const b = await rep.creaTesto({ titolo: "L'infinito", layout: 'prosa', corpo: '' })
    expect(b.id).toBe('l_infinito_2')
    const m = rep.modello()
    expect(m.testi).toHaveLength(3)
    expect(m.testi.find((t) => t.id === 'l_infinito')!.annotazioni).toEqual([])
    expect(m.problemi.filter((p) => p.gravita === 'errore')).toEqual([])
  })

  it('eliminaTesto: sposta la cartella in 99_Archivio e non cancella nulla', async () => {
    const r = copia()
    const rep = await apri(r)
    const prima = rep.modello().testi.length
    const id = rep.modello().testi[0]!.id
    const x = await rep.eliminaTesto(id)
    expect(x.modello.testi).toHaveLength(prima - 1)
    expect(existsSync(join(x.archiviato, 'testo.md'))).toBe(true)
    expect(existsSync(join(dirInf(r), 'testo.md'))).toBe(false)
    await expect(rep.eliminaTesto(id)).rejects.toThrow()
  })

  it('spostaCartella: se rename è bloccato (Windows) copia e poi toglie gli originali', async () => {
    const r = copia()
    const da = dirInf(r)
    const a = join(r, 'archivio_prova')
    const bloccato = async (): Promise<void> => {
      throw Object.assign(new Error('occupata'), { code: 'EPERM' })
    }
    await spostaCartella(da, a, bloccato)
    expect(existsSync(join(a, 'testo.md'))).toBe(true)
    expect(existsSync(join(da, 'testo.md'))).toBe(false)
    const altro = async (): Promise<void> => {
      throw Object.assign(new Error('boh'), { code: 'ENOENT' })
    }
    await expect(spostaCartella(a, join(r, 'x'), altro)).rejects.toThrow()
  })

  const PROPOSTA = `---
id: infinito_ai
corsia: canti
data: "1819"
temi: [morte, tema_che_non_esiste]
generata: 2026-10-11
---

## Riassunto
Il poeta, davanti alla siepe, immagina spazi infiniti.

## Struttura e metrica
Un'unica strofa di 15 endecasillabi sciolti.

## Contesto
Idillio composto nel 1819.

## Citazioni chiave
- «Sempre caro mi fu quest'ermo colle» (v. 1): l'apertura
- «Questo verso non esiste nel testo» (v. 99): inventato

## Domande
- Che ruolo ha la siepe?
  Limita lo sguardo e libera l'immaginazione.
`

  it('proposta della scheda: letta, con citazioni e temi controllati', async () => {
    const r = copia()
    writeFileSync(join(dirInf(r), 'proposta_scheda.md'), PROPOSTA)
    const rep = await apri(r)
    const t = rep.modello().testi.find((x) => x.id === 'inf')!
    expect(t.proposta).not.toBeNull()
    expect(t.proposta!.sezioni.struttura).toContain('endecasillabi')
    expect(t.proposta!.citazioniNonTrovate).toEqual(['Questo verso non esiste nel testo'])
    expect(t.proposta!.temi).not.toContain('tema_che_non_esiste')
    expect(t.proposta!.avvisi.some((a) => a.includes('tema_che_non_esiste'))).toBe(true)
  })

  it('applicaProposta: aggiorna le sezioni scelte della scheda collegata e archivia la proposta', async () => {
    const r = copia()
    writeFileSync(join(dirInf(r), 'proposta_scheda.md'), PROPOSTA)
    const rep = await apri(r)
    const prima = rep.modello()
    const idScheda = prima.testi.find((x) => x.id === 'inf')!.scheda!
    const riassuntoPrima = prima.schede.find((x) => x.id === idScheda)!.riassunto
    const out = await rep.applicaProposta('inf', { sezioni: ['struttura', 'domande'] })
    expect(out.creata).toBe(false)
    const sc = out.modello.schede.find((x) => x.id === idScheda)!
    expect(sc.struttura).toContain('endecasillabi')
    expect(sc.domande).toContain('siepe')
    expect(sc.contesto).toBe('')
    expect(sc.riassunto).toBe(riassuntoPrima)
    expect(out.modello.testi.find((x) => x.id === 'inf')!.proposta).toBeNull()
    expect(existsSync(join(dirInf(r), 'proposta_scheda.md'))).toBe(false)
    expect(existsSync(join(r, '99_Archivio', 'proposte_applicate'))).toBe(true)
  })

  it('applicaProposta: crea e collega la scheda se il testo non ne ha una', async () => {
    const r = copia()
    const rep = await apri(r)
    await rep.aggiornaTesto('inf', { scheda: null })
    writeFileSync(join(dirInf(r), 'proposta_scheda.md'), PROPOSTA)
    await rep.ferma()
    const rep2 = await apri(r)
    await expect(rep2.applicaProposta('inf', { sezioni: ['riassunto'] })).rejects.toThrow()
    const out = await rep2.applicaProposta('inf', { sezioni: ['riassunto', 'contesto', 'temi'], nuova: { corsia: 'canti', data: '1819', titolo_breve: "L'infinito" } })
    expect(out.creata).toBe(true)
    const sc = out.modello.schede.find((x) => x.id === out.schedaId)!
    expect(sc.riassunto).toContain('siepe')
    expect(sc.contesto).toContain('1819')
    expect(sc.testi).toContain('inf')
    expect(sc.temi).toContain('morte')
    expect(out.modello.testi.find((x) => x.id === 'inf')!.scheda).toBe(out.schedaId)
    expect(out.modello.problemi.filter((p) => p.gravita === 'errore')).toEqual([])
  })

  it('scartaProposta: la proposta va in archivio e non si perde', async () => {
    const r = copia()
    writeFileSync(join(dirInf(r), 'proposta_scheda.md'), PROPOSTA)
    const rep = await apri(r)
    const m = await rep.scartaProposta('inf')
    expect(m.testi.find((x) => x.id === 'inf')!.proposta).toBeNull()
    expect(existsSync(join(dirInf(r), 'proposta_scheda.md'))).toBe(false)
    expect(existsSync(join(r, '99_Archivio', 'proposte_scartate'))).toBe(true)
  })

  it('un json rotto a mano è segnalato e non rompe il resto', () => {
    const r = copia()
    writeFileSync(join(dirInf(r), 'annotazioni.json'), '[ { rotto')
    const files: Record<string, string> = {}
    const base = join(r, '01_Argomenti/Italiano/Autori/leopardi')
    for (const n of ['autore.md', 'temi.md', 'glossario.md']) files[n] = readFileSync(join(base, n), 'utf8')
    for (const n of ['testo.md', 'annotazioni.json', 'parafrasi.json', 'esercizi.json']) files[`testi/inf/${n}`] = readFileSync(join(dirInf(r), n), 'utf8')
    const m = costruisciModello(files, 'leopardi')
    expect(m.problemi.some((p) => p.codice === 'json-non-valido')).toBe(true)
    expect(m.testi[0]!.parafrasi).toHaveLength(2)
  })

  it('aggiornaTesto cambia solo il campo toccato del frontmatter', async () => {
    const r = copia()
    const rep = await apri(r)
    await rep.aggiornaTesto('inf', { layout: 'prosa' })
    const t = readFileSync(join(dirInf(r), 'testo.md'), 'utf8')
    expect(t).toContain('layout: prosa')
    expect(t).toContain('anno: "1819"')
    expect(t).toContain('opera: Canti · Idilli')
  })
})
