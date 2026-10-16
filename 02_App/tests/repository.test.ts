import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Repository } from '../src/main/repository'

const sorgente = resolve(__dirname, '../../01_Argomenti')
const prima_dir = (r: string): string => join(r, '01_Argomenti/Italiano/Autori/leopardi/schede')
const attesa = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

describe.skipIf(!existsSync(sorgente))('Repository', () => {
  let repo: Repository | null = null
  afterEach(async () => {
    await repo?.ferma()
    repo = null
  })
  function copia(): string {
    const r = mkdtempSync(join(tmpdir(), 'kt-'))
    cpSync(sorgente, join(r, '01_Argomenti'), { recursive: true })
    return r
  }
  const prima = (r: string): string => join(r, '01_Argomenti/Italiano/Autori/leopardi/schede')

  it('eliminaTema: lo toglie dai temi e da tutte le schede, che restano', async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const m0 = repo.modello()
    const tema = m0.temi.find((t) => m0.schede.some((x) => x.temi.includes(t.id)))!
    const usate = m0.schede.filter((x) => x.temi.includes(tema.id)).length
    const out = await repo.eliminaTema(tema.id)
    expect(out.schedeToccate).toBe(usate)
    expect(out.modello.schede).toHaveLength(m0.schede.length)
    expect(out.modello.temi.some((t) => t.id === tema.id)).toBe(false)
    expect(out.modello.schede.some((x) => x.temi.includes(tema.id))).toBe(false)
    expect(out.modello.problemi.filter((p) => p.gravita === 'errore')).toEqual([])
    await expect(repo.eliminaTema(tema.id)).rejects.toThrow()
  })

  it('eliminaCorsia: sposta le schede nella categoria scelta e non toglie l\'ultima', async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const m0 = repo.modello()
    const [a, b] = [m0.autore.corsie[0]!.id, m0.autore.corsie[1]!.id]
    const n = m0.schede.filter((x) => x.corsia === a).length
    await expect(repo.eliminaCorsia(a, null)).rejects.toThrow()
    const out = await repo.eliminaCorsia(a, b)
    expect(out.schedeSpostate).toBe(n)
    expect(out.modello.autore.corsie.some((c) => c.id === a)).toBe(false)
    expect(out.modello.schede.filter((x) => x.corsia === b).length).toBe(m0.schede.filter((x) => x.corsia === b).length + n)
    expect(out.modello.problemi.filter((p) => p.gravita === 'errore')).toEqual([])
  })

  it('elenca gli autori e carica il modello', async () => {
    const r = copia()
    expect(await Repository.elencaAutori(r)).toEqual([{ id: 'leopardi', nome: expect.any(String) }])
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    expect(repo.modello().schede).toHaveLength(105)
  })

  it('scrittura immediata: cambia solo il campo toccato e non lascia file temporanei', async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const id = repo.modello().schede[0]!.id
    const file = join(prima(r), `${id}.md`)
    const vecchio = readFileSync(file, 'utf8')
    await repo.aggiornaScheda(id, { riassunto: 'Nuovo riassunto di prova.' })
    const nuovo = readFileSync(file, 'utf8')
    expect(nuovo).toContain('Nuovo riassunto di prova.')
    expect(nuovo.replace('Nuovo riassunto di prova.', '')).not.toBe('')
    const frontVecchio = vecchio.split('## Riassunto')[0]
    expect(nuovo.split('## Riassunto')[0]).toBe(frontVecchio)
    expect(readdirSync(prima(r)).filter((f) => f.includes('.tmp-'))).toEqual([])
  })

  it('il watcher avvisa per modifiche esterne ma non per le proprie scritture', async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    repo.avvia()
    await attesa(400)
    const eventi: string[][] = []
    repo.onCambio((e) => eventi.push(e.esterni))
    const id = repo.modello().schede[0]!.id
    await repo.aggiornaScheda(id, { riassunto: 'Mia modifica.' })
    await attesa(700)
    expect(eventi.filter((e) => e.length > 0)).toEqual([])
    const file = join(prima(r), `${id}.md`)
    writeFileSync(file, readFileSync(file, 'utf8').replace('Mia modifica.', 'Modifica esterna.'))
    await attesa(1200)
    expect(eventi.some((e) => e.includes(`schede/${id}.md`))).toBe(true)
    expect(repo.modello().schede.find((s) => s.id === id)!.riassunto).toContain('Modifica esterna.')
  })

  it('crea e duplica schede con id liberi', async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const a = await repo.creaScheda({})
    const b = await repo.creaScheda({})
    expect(a.id).toBe('nuova')
    expect(b.id).toBe('nuova2')
    const d = await repo.duplicaScheda(a.id)
    expect(d.id).toBe('nuova_copia')
    expect(d.modello.schede).toHaveLength(108)
  })

  it("elimina = sposta in archivio e ripulisce collegamenti e glossario", async () => {
    const r = copia()
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const prima = repo.modello()
    const id = 'parali'
    const nColl = prima.schede.filter((x) => x.collegamenti.includes(id)).length
    const glPrima = readFileSync(join(r, '01_Argomenti/Italiano/Autori/leopardi/glossario.md'), 'utf8')
    const esito = await repo.eliminaScheda(id)
    expect(existsSync(join(prima_dir(r), `${id}.md`))).toBe(false)
    expect(existsSync(esito.archiviata)).toBe(true)
    expect(esito.archiviata).toContain('99_Archivio')
    expect(esito.collegamentiTolti).toBe(nColl)
    const m = repo.modello()
    expect(m.schede).toHaveLength(104)
    expect(m.problemi.filter((p) => p.codice.includes('inesistente'))).toEqual([])
    expect(m.schede.some((x) => x.collegamenti.includes(id))).toBe(false)
    const glDopo = readFileSync(join(r, '01_Argomenti/Italiano/Autori/leopardi/glossario.md'), 'utf8')
    const righe = (t: string): string[] => t.split('\n')
    const diverse = righe(glDopo).filter((l, i) => l !== righe(glPrima)[i]).length
    expect(diverse).toBeLessThanOrEqual(esito.vociTolte * 2 + 1)
    await expect(repo.eliminaScheda(id)).rejects.toThrow()
  })

  it('un file rotto a mano non blocca le altre schede', async () => {
    const r = copia()
    const id = readdirSync(prima(r))[0]!
    writeFileSync(join(prima(r), id), '---\nid: [\n---\n')
    repo = new Repository(r, 'leopardi')
    await repo.carica()
    const m = repo.modello()
    expect(m.schede.length).toBeGreaterThanOrEqual(104)
    expect(m.problemi.length).toBeGreaterThan(0)
    await expect(repo.aggiornaScheda(id.replace('.md', ''), { riassunto: 'x' })).rejects.toThrow()
  })
})
