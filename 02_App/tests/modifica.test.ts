import { mkdtemp, mkdir, readdir, readFile, writeFile, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { leggiSorgente, salvaSorgente } from '../src/main/modifica'

let radice = ''
const base = (...p: string[]): string => join(radice, '01_Argomenti', ...p)
const SCHEDA = (titolo: string): string => `tipo: prima_dopo\nid: a\ntitolo: ${titolo}\nsigla: S\ncomando: c\nfrase: f\nprima: p\ndopo: d\nuso: u\nriconoscila: r\n`

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-modifica-'))
  await mkdir(base('X', 'Doc', 'schede'), { recursive: true })
  await writeFile(base('X', 'Doc', 'schede', 'a.yaml'), SCHEDA('Uno'))
  await writeFile(base('X', 'Doc', 'nota.md'), '# Ciao\n')
})

describe('modifica dei file', () => {
  it('legge e salva con copia di sicurezza; le copie sono al massimo 10', async () => {
    const rel = 'X/Doc/schede/a.yaml'
    let s = await leggiSorgente(radice, rel)
    expect(s.testo).toContain('titolo: Uno')
    for (let i = 0; i < 13; i++) {
      const r = await salvaSorgente(radice, rel, SCHEDA('V' + i), s.mtime, false)
      expect(r.ok).toBe(true)
      s = await leggiSorgente(radice, rel)
      await new Promise((ok) => setTimeout(ok, 3))
    }
    expect(await readFile(base('X', 'Doc', 'schede', 'a.yaml'), 'utf8')).toContain('titolo: V12')
    const v = await readdir(join(radice, '99_Archivio', 'Versioni', 'X', 'Doc', 'schede', 'a.yaml'))
    expect(v).toHaveLength(10)
  })
  it('non salva una scheda che non rispetta lo schema, né un id diverso dal nome del file', async () => {
    const s = await leggiSorgente(radice, 'X/Doc/schede/a.yaml')
    const r = await salvaSorgente(radice, 'X/Doc/schede/a.yaml', 'tipo: ricetta\nid: a\n', s.mtime, false)
    expect(r).toMatchObject({ ok: false })
    expect((r as { errori: string[] }).errori[0]).toContain('a.yaml')
    const r2 = await salvaSorgente(radice, 'X/Doc/schede/a.yaml', SCHEDA('x').replace('id: a', 'id: b'), s.mtime, false)
    expect((r2 as { errori: string[] }).errori[0]).toContain('non corrisponde')
    expect(await readFile(base('X', 'Doc', 'schede', 'a.yaml'), 'utf8')).toContain('titolo: Uno')
  })
  it('se il file è cambiato sul disco chiede conferma; con «forza» sovrascrive', async () => {
    const s = await leggiSorgente(radice, 'X/Doc/nota.md')
    await writeFile(base('X', 'Doc', 'nota.md'), '# Cambiato fuori\n')
    await utimes(base('X', 'Doc', 'nota.md'), new Date(), new Date(Date.now() + 5000))
    expect(await salvaSorgente(radice, 'X/Doc/nota.md', '# Mio\n', s.mtime, false)).toEqual({ ok: false, conflitto: true })
    expect((await salvaSorgente(radice, 'X/Doc/nota.md', '# Mio\n', s.mtime, true)).ok).toBe(true)
    const v = await readdir(join(radice, '99_Archivio', 'Versioni', 'X', 'Doc', 'nota.md'))
    expect(await readFile(join(radice, '99_Archivio', 'Versioni', 'X', 'Doc', 'nota.md', v[0]!), 'utf8')).toBe('# Cambiato fuori\n')
  })
  it('rifiuta percorsi fuori posto e file che non sono di testo', async () => {
    for (const rel of ['../x.md', 'X/../../a.md', 'X/_nascosto/a.md', 'X/Doc/a.pdf', 'a.md', '99_Archivio/Versioni/a.md']) await expect(leggiSorgente(radice, rel)).rejects.toThrow()
    await expect(salvaSorgente(radice, 'X/Doc/manca.md', 'x', 0, true)).rejects.toThrow('non c\'è più')
  })
})
