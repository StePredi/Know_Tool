import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { fileApribile, leggiAppunto, trovaFonte } from '../src/main/appunti'
import { leggiAlbero } from '../src/main/esplora'
import { contaParole, immaginiCitate, inline, parseMd, primoTitolo, separaIntestazione, testoDi } from '../src/shared/markdown'

const c = <T,>(x: unknown): T => x as T

describe('markdown', () => {
  it('titoli con id unici, paragrafi uniti, linea', () => {
    const b = parseMd('# Uno\n\ntesto\nsu due righe\n\n---\n\n## Sì e no\n\n## Sì e no\n')
    expect(b.map((x) => x.t)).toEqual(['h', 'p', 'hr', 'h', 'h'])
    expect(testoDi(c<{ v: never }>(b[1]).v)).toBe('testo su due righe')
    expect(c<{ id: string }>(b[3]).id).toBe('si-e-no')
    expect(c<{ id: string }>(b[4]).id).toBe('si-e-no-1')
  })
  it('elenchi annidati e numerati, voce su più righe', () => {
    const b = parseMd('- a\n  - b\n    - c\n- d lunga\n  continua\n\n1. uno\n2. due\n')
    const l = c<{ voci: { depth: number; num: number | null; v: never }[] }>(b[0])
    expect(l.voci.map((v) => v.depth)).toEqual([0, 1, 2, 0])
    expect(testoDi(l.voci[3]!.v)).toBe('d lunga continua')
    expect(c<{ voci: { num: number }[] }>(b[1]).voci.map((v) => v.num)).toEqual([1, 2])
  })
  it('tabelle (anche con | dentro il codice) e blocchi di codice', () => {
    const b = parseMd('| A | B |\n|---|---|\n| `x\\|y` | 2 |\n| solo |\n\n```cpp\nint x = 1 | 2;\n\n// ok\n```\n')
    const t = c<{ testa: unknown[]; righe: unknown[][][] }>(b[0])
    expect(t.testa).toHaveLength(2)
    expect(t.righe).toHaveLength(2)
    expect(t.righe[1]).toHaveLength(2)
    expect(b[1]).toEqual({ t: 'codice', lingua: 'cpp', v: 'int x = 1 | 2;\n\n// ok' })
  })
  it('il testo dentro un blocco di codice non diventa titolo o elenco', () => {
    const b = parseMd('```\n# non titolo\n- non voce\n```')
    expect(b).toHaveLength(1)
    expect(b[0]!.t).toBe('codice')
  })
  it('inline: codice, grassetto, corsivo, link, immagine, parole con _ intatte', () => {
    const v = inline('**forte** e *dolce* `a*b` [x](y.md) ![f](i.png) snake_case_name')
    expect(v.map((x) => x.t)).toEqual(['b', 'txt', 'i', 'txt', 'code', 'txt', 'a', 'txt', 'img', 'txt'])
    expect(testoDi(v)).toContain('snake_case_name')
    expect(testoDi(inline('2 * 3 * 4'))).toBe('2 * 3 * 4')
  })
  it('intestazione, titolo, parole, immagini citate', () => {
    const src = '---\nid: a\n---\n\n# Il titolo\n\nUna due tre ![x](../schemi/p.png) ![y](../schemi/p.png)\n'
    expect(separaIntestazione(src).fm).toBe('id: a')
    expect(primoTitolo(src)).toBe('Il titolo')
    expect(contaParole(src)).toBe(5)
    expect(immaginiCitate(src)).toEqual(['../schemi/p.png'])
  })
})

let radice = ''
const base = (...p: string[]): string => join(radice, '01_Argomenti', ...p)
// un PNG da 1 pixel
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-appunti-'))
  await mkdir(base('TPSIT', 'MSP', 'appunti'), { recursive: true })
  await mkdir(base('TPSIT', 'MSP', 'schemi'), { recursive: true })
  await mkdir(base('TPSIT', 'MSP', '_interno'), { recursive: true })
  await writeFile(base('TPSIT', 'MSP', 'appunti', 'i2c_teoria.md'), '# Il protocollo I2C\n\nUn bus a due fili.\n\n![pin](../schemi/pin.png)\n![no](../schemi/non_c_e.png)\n![fuori](../../../../x.png)\n')
  await writeFile(base('TPSIT', 'MSP', 'appunti', 'senza_titolo.md'), 'solo testo qui\n')
  await writeFile(base('TPSIT', 'MSP', 'appunti', '_scheda.md'), '# nascosto\n')
  await writeFile(base('TPSIT', 'MSP', 'schemi', 'pin.png'), PNG)
  await writeFile(base('TPSIT', 'MSP', '_interno', 'pin.png'), PNG)
})

describe('appunti nell\'albero e lettura', () => {
  it('i .md compaiono come «appunto» (titolo dal primo #), i nascosti no; la cartella li conta', async () => {
    const a = await leggiAlbero(radice)
    const msp = a[0]!.figli[0]!
    expect(msp.figli.map((f) => f.nome)).toEqual(['appunti', 'schemi'])
    const ap = msp.figli[0]!
    expect(ap.info).toBe('2 appunti')
    expect(ap.figli.map((f) => [f.tipo, f.nome, f.rel])).toEqual([
      ['appunto', 'Il protocollo I2C', 'TPSIT/MSP/appunti/i2c_teoria.md'],
      ['appunto', 'senza titolo', 'TPSIT/MSP/appunti/senza_titolo.md']
    ])
    expect(ap.figli[0]).toMatchObject({ puoArchiviare: false, puoRinominare: false, info: '8 parole' })
  })
  it('legge il testo e le immagini relative; segna quelle mancanti o fuori cartella', async () => {
    const r = await leggiAppunto(radice, 'TPSIT/MSP/appunti/i2c_teoria.md')
    expect(r.testo).toContain('# Il protocollo I2C')
    expect(r.immagini['../schemi/pin.png']).toMatch(/^data:image\/png;base64,/)
    expect(r.mancanti).toEqual(['../schemi/non_c_e.png', '../../../../x.png'])
  })
  it('rifiuta percorsi che escono, cartelle riservate, file nascosti o non .md', async () => {
    for (const rel of ['../x.md', 'TPSIT/../../x.md', 'TPSIT/_interno/a.md', 'TPSIT/MSP/appunti/_scheda.md', 'TPSIT/MSP/schemi/pin.png', 'a.md', 'TPSIT\\x.md', '99_Archivio/x.md']) {
      await expect(leggiAppunto(radice, rel)).rejects.toThrow()
    }
    await expect(leggiAppunto(radice, 'TPSIT/MSP/appunti/manca.md')).rejects.toThrow('non c\'è più')
  })
  it('trova le fonti citate cercando nelle cartelle sopra; rifiuta tipi strani e percorsi che escono', async () => {
    await mkdir(base('TPSIT', 'MSP', 'fonti'), { recursive: true })
    await writeFile(base('TPSIT', 'MSP', 'fonti', 'i2c.pdf'), 'x')
    await writeFile(base('TPSIT', 'MSP', 'fonti', 'run.exe'), 'x')
    const r = await trovaFonte(radice, 'TPSIT/MSP/appunti/i2c_teoria.md', 'fonti/i2c.pdf')
    expect(r.rel).toBe('TPSIT/MSP/fonti/i2c.pdf')
    expect(r.assoluto).toBe(base('TPSIT', 'MSP', 'fonti', 'i2c.pdf'))
    await expect(trovaFonte(radice, 'TPSIT/MSP/appunti/i2c_teoria.md', 'fonti/run.exe')).rejects.toThrow('tipo di file')
    await expect(trovaFonte(radice, 'TPSIT/MSP/appunti/i2c_teoria.md', '../../x.pdf')).rejects.toThrow()
    await expect(trovaFonte(radice, 'TPSIT/MSP/appunti/i2c_teoria.md', 'C:/Windows/a.pdf')).rejects.toThrow()
    await expect(trovaFonte(radice, 'TPSIT/MSP/appunti/i2c_teoria.md', 'fonti/manca.pdf')).rejects.toThrow('Non trovo')
  })
  it('i file non di testo (pdf, immagini…) compaiono come «file» e si aprono dal percorso; gli altri no', async () => {
    await mkdir(base('TPSIT', 'MSP', 'fonti'), { recursive: true })
    await writeFile(base('TPSIT', 'MSP', 'fonti', 'i2c.pdf'), Buffer.alloc(3000))
    await writeFile(base('TPSIT', 'MSP', 'fonti', 'prog.exe'), 'x')
    await writeFile(base('TPSIT', 'MSP', 'fonti', '_nascosto.pdf'), 'x')
    const fonti = (await leggiAlbero(radice))[0]!.figli[0]!.figli.find((f) => f.nome === 'fonti')!
    expect(fonti.figli.map((f) => [f.tipo, f.nome, f.info])).toEqual([['file', 'i2c.pdf', 'PDF · 3 KB']])
    expect(fonti.info).toBe('1 file')
    expect(await fileApribile(radice, 'TPSIT/MSP/fonti/i2c.pdf')).toBe(base('TPSIT', 'MSP', 'fonti', 'i2c.pdf'))
    for (const rel of ['TPSIT/MSP/fonti/prog.exe', 'TPSIT/MSP/fonti/_nascosto.pdf', '../x.pdf', 'TPSIT/MSP/fonti/manca.pdf', 'x.pdf']) await expect(fileApribile(radice, rel)).rejects.toThrow()
  })
})
