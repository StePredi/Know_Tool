// Argomenti di matematica su disco: lettura, errori, progresso, creazione. Solo in cartelle temporanee:
// MAI sulla vera 01_Argomenti.
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { creaMatematica, leggiAlbero } from '../src/main/esplora'
import { leggiMatematica, scriviArgomentoNuovo, segnaRegolaRipassata } from '../src/main/matematica'
import { leggiArgomento, leggiRegola, spezzaFormule } from '../src/shared/matematica'

let radice = ''
const base = (...p: string[]): string => join(radice, '01_Argomenti', ...p)

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-mat-'))
  await mkdir(base('Matematica'), { recursive: true })
  await mkdir(base('Italiano', 'Autori'), { recursive: true })
})
afterEach(async () => { await rm(radice, { recursive: true, force: true }) })

const REGOLA = (id: string, extra = ''): string => `id: ${id}\nnome: Nome ${id}\nriconosci: "Cosa vedo con \`x^2\`"\nfai: Cosa faccio\n${extra}`

describe('argomento di matematica: lettura', () => {
  it('un argomento nuovo si legge, senza avvisi', async () => {
    await scriviArgomentoNuovo(base('Matematica', 'Limiti'), 'Limiti')
    const m = await leggiMatematica(radice, 'Matematica/Limiti')
    expect(m.argomento.titolo).toBe('Limiti')
    expect(m.argomento.bozza).toBe(false)
    expect(Object.keys(m.regole)).toEqual(['prima-regola'])
    expect(m.avvisi).toEqual([])
    expect(m.ripassate).toEqual([])
  })
  it('legge regole con esempi e «confondi»; i campi facoltativi hanno un valore', async () => {
    const d = base('Matematica', 'A')
    await mkdir(join(d, 'regole'), { recursive: true })
    await writeFile(join(d, 'argomento.yaml'), 'modello: matematica\ntitolo: A\nmotore: scomposizione\nordine: [uno, due]\nesempi: ["x^2-9"]\nbozza: true\n')
    await writeFile(join(d, 'regole', 'uno.yaml'), REGOLA('uno', 'formula: "A^2-B^2 = (A-B)(A+B)"\nesempi:\n  - da: x^2-9\n    passi: ["`x^2` e `9`"]\n    risultato: (x-3)(x+3)\nconfondi:\n  - con: due\n    differenza: altro\n'))
    await writeFile(join(d, 'regole', 'due.yaml'), REGOLA('due'))
    const m = await leggiMatematica(radice, 'Matematica/A')
    expect(m.argomento).toMatchObject({ motore: 'scomposizione', ordine: ['uno', 'due'], bozza: true, introduzione: '' })
    expect(m.regole.uno!.esempi[0]).toMatchObject({ da: 'x^2-9', risultato: '(x-3)(x+3)' })
    expect(m.regole.due!.formula).toBe('')
    expect(m.regole.due!.confondi).toEqual([])
    expect(m.avvisi).toEqual([])
  })
  it('avvisa (senza bloccare) di regole citate e mancanti, o non nell\'ordine, o con id sbagliato', async () => {
    const d = base('Matematica', 'B')
    await mkdir(join(d, 'regole'), { recursive: true })
    await writeFile(join(d, 'argomento.yaml'), 'modello: matematica\ntitolo: B\nordine: [uno, fantasma, uno]\n')
    await writeFile(join(d, 'regole', 'uno.yaml'), REGOLA('uno'))
    await writeFile(join(d, 'regole', 'extra.yaml'), REGOLA('extra'))
    await writeFile(join(d, 'regole', 'sbagliata.yaml'), REGOLA('un-altro'))
    const m = await leggiMatematica(radice, 'Matematica/B')
    const t = m.avvisi.join(' | ')
    expect(t).toContain('«uno» compare due volte')
    expect(t).toContain('cita «fantasma»')
    expect(t).toContain('«extra» non è nell\'ordine')
    expect(t).toContain('non corrisponde al nome del file')
    expect(Object.keys(m.regole).sort()).toEqual(['extra', 'uno'])
  })
  it('errori leggibili: file assente, yaml rotto, campo mancante, motore sconosciuto', async () => {
    await expect(leggiMatematica(radice, 'Matematica/Niente')).rejects.toThrow('argomento.yaml')
    expect(leggiArgomento('titolo: [')).toMatchObject({ errore: expect.stringContaining('non si legge') })
    expect(leggiArgomento('modello: matematica\n').errore).toContain('titolo')
    expect(leggiArgomento('modello: matematica\ntitolo: X\nmotore: magia\n').errore).toContain('motore')
    expect(leggiRegola('id: a\nnome: A\n', 'a.yaml').errore).toContain('riconosci')
    expect(leggiRegola(REGOLA('Maiuscola'), 'Maiuscola.yaml').errore).toContain('id non valido')
  })
  it('rifiuta percorsi che escono dalla cartella o puntano alle cartelle dell\'app', async () => {
    for (const rel of ['', '..', '../x', 'Matematica/../..', '_condiviso/x', '99_Archivio/y', 'a\\b']) await expect(leggiMatematica(radice, rel)).rejects.toThrow('Percorso non valido')
  })
})

describe('progresso', () => {
  beforeEach(async () => { await scriviArgomentoNuovo(base('Matematica', 'P'), 'P') })
  it('segna e toglie «ripassata», e il file resta valido', async () => {
    expect(await segnaRegolaRipassata(radice, 'Matematica/P', 'prima-regola', true)).toEqual(['prima-regola'])
    expect((await leggiMatematica(radice, 'Matematica/P')).ripassate).toEqual(['prima-regola'])
    expect(JSON.parse(await readFile(base('Matematica', 'P', 'progresso.json'), 'utf8'))).toEqual({ ripassate: ['prima-regola'] })
    expect(await segnaRegolaRipassata(radice, 'Matematica/P', 'prima-regola', false)).toEqual([])
  })
  it('ignora regole che non esistono più e rifiuta id strani', async () => {
    await writeFile(base('Matematica', 'P', 'progresso.json'), '{"ripassate":["vecchia","prima-regola",3]}')
    expect((await leggiMatematica(radice, 'Matematica/P')).ripassate).toEqual(['prima-regola'])
    await expect(segnaRegolaRipassata(radice, 'Matematica/P', '../x', true)).rejects.toThrow('Regola non valida')
    await writeFile(base('Matematica', 'P', 'progresso.json'), 'non è json')
    expect((await leggiMatematica(radice, 'Matematica/P')).ripassate).toEqual([])
  })
})

describe('creazione dall\'albero', () => {
  it('crea l\'argomento, compare nell\'albero come «matematica», non sovrascrive', async () => {
    expect(await creaMatematica(radice, 'Matematica', 'Scomposizione dei polinomi')).toBe('Matematica/Scomposizione dei polinomi')
    const mat = (await leggiAlbero(radice)).find((n) => n.nome === 'Matematica')!
    expect(mat.figli).toHaveLength(1)
    expect(mat.figli[0]).toMatchObject({ tipo: 'matematica', nome: 'Scomposizione dei polinomi', info: '1 regola', figli: [], puoArchiviare: true })
    expect(mat.info).toBe('1 documento')
    await expect(creaMatematica(radice, 'Matematica', 'Scomposizione dei polinomi')).rejects.toThrow('Esiste già')
  })
  it('rifiuta nomi non validi e posti sbagliati', async () => {
    await expect(creaMatematica(radice, 'Matematica', 'a/b')).rejects.toThrow()
    await expect(creaMatematica(radice, 'Matematica', '  ')).rejects.toThrow()
    await expect(creaMatematica(radice, 'Italiano', 'X')).rejects.toThrow('cartella di studio')
    await expect(creaMatematica(radice, '', 'X')).rejects.toThrow('cartella di studio')
    await expect(creaMatematica(radice, 'Matematica/NonEsiste', 'X')).rejects.toThrow('non esiste più')
  })
  it('scriviArgomentoNuovo non sovrascrive mai', async () => {
    await scriviArgomentoNuovo(base('Matematica', 'Z'), 'Z')
    await writeFile(base('Matematica', 'Z', 'argomento.yaml'), 'modello: matematica\ntitolo: Mio\n')
    await expect(scriviArgomentoNuovo(base('Matematica', 'Z'), 'Z')).rejects.toThrow()
    expect(await readFile(base('Matematica', 'Z', 'argomento.yaml'), 'utf8')).toContain('Mio')
  })
})

describe('frasi con formule', () => {
  it('spezza tra testo e formule (apici inversi)', () => {
    expect(spezzaFormule('Prendi `x^2` e `9`.')).toEqual([{ formula: false, testo: 'Prendi ' }, { formula: true, testo: 'x^2' }, { formula: false, testo: ' e ' }, { formula: true, testo: '9' }, { formula: false, testo: '.' }])
    expect(spezzaFormule('niente formule')).toEqual([{ formula: false, testo: 'niente formule' }])
    expect(spezzaFormule('')).toEqual([])
    // un apice rimasto aperto: il resto è formula (non si perde testo)
    expect(spezzaFormule('a `b')).toEqual([{ formula: false, testo: 'a ' }, { formula: true, testo: 'b' }])
  })
})
