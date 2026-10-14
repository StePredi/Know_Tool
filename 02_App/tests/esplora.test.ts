import { mkdtemp, mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { archiviaNodo, creaNodo, leggiAlbero, nomeValido, rinominaNodo } from '../src/main/esplora'

let radice = ''
const base = (...p: string[]): string => join(radice, '01_Argomenti', ...p)

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-esplora-'))
  await mkdir(base('italiano', 'autori', 'leopardi', 'schede'), { recursive: true })
  await mkdir(base('italiano', 'autori', 'leopardi', 'testi', 'inf'), { recursive: true })
  await mkdir(base('italiano', '_condiviso'), { recursive: true })
  await mkdir(base('inglese', 'grammatica'), { recursive: true })
  await writeFile(base('italiano', 'autori', 'leopardi', 'autore.md'), '---\nid: leopardi\nnome: Giacomo Leopardi\n---\n')
  await writeFile(base('italiano', 'autori', 'leopardi', 'schede', 'a.md'), '---\nid: a\n---\n')
  await writeFile(base('italiano', 'autori', 'leopardi', 'testi', 'inf', 'testo.md'), '---\nid: inf\ntitolo: L\'infinito\nopera: Canti\nanno: 1819\n---\n\ntesto\n')
})

describe('albero di 01_Argomenti', () => {
  it('materie, cartelle, autore con mappa e testi; le cartelle dell\'app restano nascoste', async () => {
    const a = await leggiAlbero(radice)
    expect(a.map((n) => n.nome)).toEqual(['inglese', 'italiano'])
    const it = a.find((n) => n.nome === 'italiano')!
    expect(it.tipo).toBe('materia')
    expect(it.protetto).toBe(true)
    const autori = it.figli[0]!
    expect(autori.nome).toBe('autori')
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
    await expect(creaNodo(radice, 'italiano/autori', 'Nuovo')).rejects.toThrow()
    await expect(creaNodo(radice, '../fuori', 'x')).rejects.toThrow()
    expect(nomeValido('  ')).not.toBeNull()
    expect(nomeValido('Sistemi e Reti')).toBeNull()
  })
  it('rinomina una cartella, un testo e un autore; le cartelle dell\'app no', async () => {
    expect(await rinominaNodo(radice, 'inglese/grammatica', 'Grammatica base')).toBe('inglese/Grammatica base')
    await access(base('inglese', 'Grammatica base'))
    await rinominaNodo(radice, 'italiano/autori/leopardi/testi/inf', 'Infinito')
    expect(await readFile(base('italiano', 'autori', 'leopardi', 'testi', 'inf', 'testo.md'), 'utf8')).toContain('titolo: "Infinito"')
    await rinominaNodo(radice, 'italiano/autori/leopardi', 'G. Leopardi')
    expect(await readFile(base('italiano', 'autori', 'leopardi', 'autore.md'), 'utf8')).toContain('nome: "G. Leopardi"')
    await expect(rinominaNodo(radice, 'italiano', 'Lettere')).rejects.toThrow('serve all')
    await expect(rinominaNodo(radice, 'inglese', 'italiano')).rejects.toThrow('Esiste già')
  })
  it('archivia in 99_Archivio senza cancellare, e non tocca ciò che serve all\'app', async () => {
    await archiviaNodo(radice, 'inglese/grammatica')
    await expect(access(base('inglese', 'grammatica'))).rejects.toThrow()
    await archiviaNodo(radice, 'italiano/autori/leopardi/testi/inf')
    await expect(access(base('italiano', 'autori', 'leopardi', 'testi', 'inf'))).rejects.toThrow()
    await access(join(radice, '99_Archivio', 'cartelle_archiviate'))
    await access(join(radice, '99_Archivio', 'testi_eliminati'))
    await expect(archiviaNodo(radice, 'italiano')).rejects.toThrow()
    await expect(archiviaNodo(radice, 'italiano/autori/leopardi')).rejects.toThrow()
  })
})
