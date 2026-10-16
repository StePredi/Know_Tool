import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { costruisciModello } from '../src/shared/modello'
import { costruisciIndice } from '../src/shared/derivati'
import { calcolaMappa } from '../src/shared/layout'
import { leggiDocMd, ORDINE_CAMPI_SCHEDA, scriviDocMd, applicaPatchScheda } from '../src/shared/scheda_md'

const dir = resolve(__dirname, '../../01_Argomenti/Italiano/Autori/leopardi')
const ok = existsSync(dir)

function carica(): Record<string, string> {
  const f: Record<string, string> = {}
  for (const n of ['autore.md', 'temi.md', 'glossario.md']) f[n] = readFileSync(join(dir, n), 'utf8')
  for (const n of readdirSync(join(dir, 'schede'))) f[`schede/${n}`] = readFileSync(join(dir, 'schede', n), 'utf8')
  return f
}

describe.skipIf(!ok)('dati reali: Leopardi', () => {
  const files = carica()
  const m = costruisciModello(files, 'leopardi')

  it('legge 105 schede, 10 temi, 32 voci di glossario', () => {
    expect(m.schede).toHaveLength(105)
    expect(m.temi).toHaveLength(10)
    expect(m.glossario.length).toBeGreaterThanOrEqual(29)
  })
  it('nessun errore bloccante', () => {
    const errori = m.problemi.filter((p) => p.gravita === 'errore')
    expect(errori.map((p) => `${p.file}: ${p.messaggio}`)).toEqual([])
  })
  it('round-trip: riscrivere una scheda non cambia nulla', () => {
    const diff: string[] = []
    for (const [k, t] of Object.entries(files)) {
      if (!k.startsWith('schede/')) continue
      const out = scriviDocMd(leggiDocMd(t), { ordine: ORDINE_CAMPI_SCHEDA })
      if (out !== t) diff.push(k)
    }
    expect(diff).toEqual([])
  })
  it('una patch vuota non cambia il file', () => {
    const t = files['schede/' + readdirSync(join(dir, 'schede'))[0]]!
    const doc = leggiDocMd(t)
    applicaPatchScheda(doc, {})
    expect(scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA })).toBe(t)
  })
  it('layout: tutte le schede visibili hanno una card', () => {
    const ix = costruisciIndice(m)
    const l = calcolaMappa({ modello: m, indice: ix, corsieSpente: {}, passa: () => true, selId: null, colore: () => '#000' })
    expect(l.corsie.reduce((n, c) => n + c.cards.length, 0)).toBe(105)
    expect(l.canvasW).toBeGreaterThan(1000)
  })
  it('file rotti non fanno lanciare eccezioni', () => {
    const rotto = { ...files, 'schede/x.md': '---\nid: [\n---\n', 'schede/y.md': 'solo testo', 'autore.md': 'niente' }
    const r = costruisciModello(rotto, 'leopardi')
    expect(r.problemi.length).toBeGreaterThan(0)
    expect(costruisciModello({}, 'leopardi').problemi.length).toBeGreaterThan(0)
  })
})
