import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pezziEnfasi } from '../src/shared/enfasi'
import { leggiSchedaSit } from '../src/shared/situazioni'
import { testoSpiegazione } from '../src/shared/testoSpiegazione'

describe('grassetto, corsivo e asterisco vero', () => {
  it('grassetto e corsivo come prima', () => {
    expect(pezziEnfasi('Un **termine** e *Mitteleuropa*.')).toEqual([
      { t: 'testo', v: 'Un ' }, { t: 'b', v: 'termine' }, { t: 'testo', v: ' e ' }, { t: 'i', v: 'Mitteleuropa' }, { t: 'testo', v: '.' }
    ])
  })
  it('\\* è un asterisco vero e non apre il corsivo', () => {
    expect(pezziEnfasi('tutti i file \\*.md e \\*.txt')).toEqual([{ t: 'testo', v: 'tutti i file *.md e *.txt' }])
  })
  it('un asterisco vero dentro il grassetto', () => {
    expect(pezziEnfasi('**cerca \\*.md**')).toEqual([{ t: 'b', v: 'cerca *.md' }])
  })
  it('un testo senza marcatori resta uguale', () => {
    expect(pezziEnfasi('niente di speciale')).toEqual([{ t: 'testo', v: 'niente di speciale' }])
  })
})

const docker = resolve(__dirname, '../../01_Argomenti/Sistemi e Reti/Docker/Docker per situazioni/schede')
describe.skipIf(!existsSync(join(docker, 'vm-o-container.yaml')))('ricerca dentro le spiegazioni', () => {
  const r = leggiSchedaSit(readFileSync(join(docker, 'vm-o-container.yaml'), 'utf8'), 'vm-o-container.yaml')
  it('il testo dei blocchi finisce nella ricerca', () => {
    expect(r.scheda?.tipo).toBe('spiegazione')
    if (r.scheda?.tipo !== 'spiegazione') return
    const t = testoSpiegazione(r.scheda).toLowerCase()
    expect(t).toContain('hypervisor')
    expect(t).not.toContain('**')
    // una parola che sta solo dentro un disegno o una tabella
    expect(t.length).toBeGreaterThan(r.scheda.quando.length + 200)
  })
})

import { leggiSituazioni } from '../src/main/situazioni'
import { cerca, costruisciIndici } from '../src/renderer/situazioni/util'

describe.skipIf(!existsSync(join(docker, 'vm-o-container.yaml')))('la ricerca della mappa trova il testo dei blocchi', () => {
  it('una parola che sta solo dentro la scheda si trova', async () => {
    const d = await leggiSituazioni(resolve(__dirname, '../..'), 'Sistemi e Reti/Docker/Docker per situazioni')
    const { ordine, pagliaio } = costruisciIndici(d)
    expect(cerca('hypervisor', ordine, pagliaio)).toContain('vm-o-container')
  })
})

import { elementiDaCoprire } from '../src/shared/testoSpiegazione'
describe.skipIf(!existsSync(join(docker, 'vm-o-container.yaml')))('Mettiti alla prova per le spiegazioni', () => {
  it('conta numeri, celle della tabella (non la prima colonna) e livelli dei disegni', () => {
    const r = leggiSchedaSit(readFileSync(join(docker, 'vm-o-container.yaml'), 'utf8'), 'vm-o-container.yaml')
    if (r.scheda?.tipo !== 'spiegazione') throw new Error('attesa una spiegazione')
    expect(elementiDaCoprire(r.scheda)).toBeGreaterThan(5)
  })
  it('una spiegazione di solo testo non ha niente da coprire', () => {
    const r = leggiSchedaSit('tipo: spiegazione\nid: x\ntitolo: X\nsigla: X\ncomando: X\nfrase: ""\nquando: ""\nblocchi:\n  - testo: Ciao\n', 'x.yaml')
    if (r.scheda?.tipo !== 'spiegazione') throw new Error(r.errore ?? 'non valida')
    expect(elementiDaCoprire(r.scheda)).toBe(0)
  })
})
