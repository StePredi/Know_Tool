import { mkdtemp, mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { archiviaNodo, creaAppunto, creaNodo, leggiAlbero, nomeValido, rinominaNodo } from '../src/main/esplora'

let radice = ''
const base = (...p: string[]): string => join(radice, '01_Argomenti', ...p)

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-esplora-'))
  await mkdir(base('Italiano', 'Autori', 'leopardi', 'schede'), { recursive: true })
  await mkdir(base('Italiano', 'Autori', 'leopardi', 'testi', 'inf'), { recursive: true })
  await mkdir(base('Italiano', '_condiviso'), { recursive: true })
  await mkdir(base('inglese', 'grammatica'), { recursive: true })
  await writeFile(base('Italiano', 'Autori', 'leopardi', 'autore.md'), '---\nid: leopardi\nnome: Giacomo Leopardi\n---\n')
  await writeFile(base('Italiano', 'Autori', 'leopardi', 'schede', 'a.md'), '---\nid: a\n---\n')
  await writeFile(base('Italiano', 'Autori', 'leopardi', 'testi', 'inf', 'testo.md'), '---\nid: inf\ntitolo: L\'infinito\nopera: Canti\nanno: 1819\n---\n\ntesto\n')
})

describe('albero di 01_Argomenti', () => {
  it('materie, cartelle, autore con mappa e testi; le cartelle dell\'app restano nascoste', async () => {
    const a = await leggiAlbero(radice)
    expect(a.map((n) => n.nome)).toEqual(['inglese', 'Italiano'])
    const it = a.find((n) => n.nome === 'Italiano')!
    expect(it.tipo).toBe('materia')
    expect(it.protetto).toBe(true)
    const autori = it.figli[0]!
    expect(autori.nome).toBe('Autori')
    const leo = autori.figli[0]!
    expect(leo).toMatchObject({ tipo: 'autore', nome: 'Giacomo Leopardi', autoreId: 'leopardi', puoArchiviare: false, puoRinominare: true })
    expect(leo.figli.map((f) => f.tipo)).toEqual(['mappa', 'testo'])
    expect(leo.figli[0]!.info).toBe('1 schede')
    expect(leo.figli[1]).toMatchObject({ nome: 'L\'infinito', testoId: 'inf', info: 'Canti · 1819' })
  })
  it('crea una cartella e una materia, rifiuta nomi non validi o già presi', async () => {
    expect(await creaNodo(radice, 'inglese', 'Verbi')).toBe('inglese/Verbi')
    expect(await creaNodo(radice, '', 'Storia')).toBe('Storia')
    await expect(creaNodo(radice, 'inglese', 'Verbi')).rejects.toThrow('Esiste già')
    await expect(creaNodo(radice, 'inglese', 'a/b')).rejects.toThrow()
    await expect(creaNodo(radice, 'inglese', '_x')).rejects.toThrow()
    await expect(creaNodo(radice, 'Italiano/Autori', 'Nuovo')).rejects.toThrow()
    await expect(creaNodo(radice, '../fuori', 'x')).rejects.toThrow()
    expect(nomeValido('  ')).not.toBeNull()
    expect(nomeValido('Sistemi e Reti')).toBeNull()
  })
  it('rinomina una cartella, un testo e un autore; le cartelle dell\'app no', async () => {
    expect(await rinominaNodo(radice, 'inglese/grammatica', 'Grammatica base')).toBe('inglese/Grammatica base')
    await access(base('inglese', 'Grammatica base'))
    await rinominaNodo(radice, 'Italiano/Autori/leopardi/testi/inf', 'Infinito')
    expect(await readFile(base('Italiano', 'Autori', 'leopardi', 'testi', 'inf', 'testo.md'), 'utf8')).toContain('titolo: "Infinito"')
    await rinominaNodo(radice, 'Italiano/Autori/leopardi', 'G. Leopardi')
    expect(await readFile(base('Italiano', 'Autori', 'leopardi', 'autore.md'), 'utf8')).toContain('nome: "G. Leopardi"')
    await expect(rinominaNodo(radice, 'Italiano', 'Lettere')).rejects.toThrow('serve all')
    await expect(rinominaNodo(radice, 'inglese', 'Italiano')).rejects.toThrow('Esiste già')
  })
  it('archivia in 99_Archivio senza cancellare, e non tocca ciò che serve all\'app', async () => {
    await archiviaNodo(radice, 'inglese/grammatica')
    await expect(access(base('inglese', 'grammatica'))).rejects.toThrow()
    await archiviaNodo(radice, 'Italiano/Autori/leopardi/testi/inf')
    await expect(access(base('Italiano', 'Autori', 'leopardi', 'testi', 'inf'))).rejects.toThrow()
    await access(join(radice, '99_Archivio', 'cartelle_archiviate'))
    await access(join(radice, '99_Archivio', 'testi_eliminati'))
    await expect(archiviaNodo(radice, 'Italiano')).rejects.toThrow()
    await expect(archiviaNodo(radice, 'Italiano/Autori/leopardi')).rejects.toThrow()
  })
})

describe('appunti: nuovo, rinomina, archivia', () => {
  it('crea un appunto con il titolo, senza sovrascrivere né uscire dalle cartelle di studio', async () => {
    const rel = await creaAppunto(radice, 'inglese/grammatica', 'Verbi irregolari')
    expect(rel).toBe('inglese/grammatica/Verbi irregolari.md')
    expect(await readFile(base('inglese', 'grammatica', 'Verbi irregolari.md'), 'utf8')).toBe('# Verbi irregolari\n\n')
    await expect(creaAppunto(radice, 'inglese/grammatica', 'Verbi irregolari')).rejects.toThrow(/Esiste già/)
    await expect(creaAppunto(radice, 'Italiano/Autori', 'x')).rejects.toThrow()
    await expect(creaAppunto(radice, '', 'x')).rejects.toThrow()
    await expect(creaAppunto(radice, 'inglese', '../fuori')).rejects.toThrow()
  })
  it('rinomina il file e lo archivia senza cancellarlo', async () => {
    const rel = await creaAppunto(radice, 'inglese/grammatica', 'Uno')
    const nuovo = await rinominaNodo(radice, rel, 'Due')
    expect(nuovo).toBe('inglese/grammatica/Due.md')
    await expect(access(base('inglese', 'grammatica', 'Uno.md'))).rejects.toThrow()
    await creaAppunto(radice, 'inglese/grammatica', 'Tre')
    await expect(rinominaNodo(radice, nuovo, 'Tre')).rejects.toThrow(/Esiste già/)
    const dove = await archiviaNodo(radice, nuovo)
    expect(dove).toMatch(/99_Archivio\/Archiviati\/inglese\/grammatica\/.*-Due\.md$/)
    await expect(access(base('inglese', 'grammatica', 'Due.md'))).rejects.toThrow()
    const alb = await leggiAlbero(radice)
    const g = alb.find((n) => n.nome === 'inglese')!.figli[0]!
    expect(g.figli.map((n) => n.tipo)).toEqual(['appunto'])
    expect(g.figli[0]!.puoRinominare && g.figli[0]!.puoArchiviare).toBe(true)
  })
})

import { creaSituazioni } from '../src/main/esplora'
import { leggiIndice, leggiSchedaSit } from '../src/shared/situazioni'
describe('nuovo documento Per situazioni', () => {
  it('crea indice e scheda validi, si riconosce come documento, non sovrascrive', async () => {
    const rel = await creaSituazioni(radice, 'inglese/grammatica', 'Tempi verbali')
    expect(rel).toBe('inglese/grammatica/Tempi verbali')
    const ix = leggiIndice(await readFile(base('inglese', 'grammatica', 'Tempi verbali', 'indice.yaml'), 'utf8'))
    expect(ix.errore).toBeUndefined()
    expect(ix.indice?.rami[0]?.voci[0]?.schede).toEqual(['primo-passo'])
    const s = leggiSchedaSit(await readFile(base('inglese', 'grammatica', 'Tempi verbali', 'schede', 'primo-passo.yaml'), 'utf8'), 'primo-passo.yaml')
    expect(s.errore).toBeUndefined()
    const alb = await leggiAlbero(radice)
    const g = alb.find((n) => n.nome === 'inglese')!.figli[0]!
    expect(g.figli.map((n) => n.tipo)).toContain('situazioni')
    await expect(creaSituazioni(radice, 'inglese/grammatica', 'Tempi verbali')).rejects.toThrow(/Esiste già/)
    await expect(creaSituazioni(radice, '', 'x')).rejects.toThrow()
  })
})
