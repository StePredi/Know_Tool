// Modifica dei file di studio dall'app (schede .yaml, indice.yaml, appunti .md).
// Regole: solo dentro 01_Argomenti; prima di sovrascrivere si tiene la versione precedente in 99_Archivio/Versioni
// (le ultime 10 per file); scrittura sicura (file temporaneo + rinomina); se il file è cambiato sul disco da quando
// l'utente lo ha aperto, non si sovrascrive senza conferma.

import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { leggiIndice, leggiSchedaSit } from '../shared/situazioni'
import type { EsitoSalva, SorgenteFile } from '../shared/types'

const BASE = '01_Argomenti'
const VERSIONI = 10

function parti(rel: string): string[] {
  const p = rel.split('/')
  if (p.length < 2 || p.some((x) => !x || x === '.' || x === '..' || x.includes('\\') || x.includes(':') || /^[_.]|^99_/.test(x))) throw new Error('Percorso non valido.')
  if (!/\.(md|ya?ml)$/i.test(p[p.length - 1]!)) throw new Error('Si possono modificare solo file di testo (.md, .yaml).')
  return p
}

export async function leggiSorgente(radice: string, rel: string): Promise<SorgenteFile> {
  const p = parti(rel)
  const file = join(radice, BASE, ...p)
  try {
    const [testo, st] = await Promise.all([fs.readFile(file, 'utf8'), fs.stat(file)])
    return { rel, testo: testo.replace(/^﻿/, ''), mtime: st.mtimeMs }
  } catch {
    throw new Error('Questo file non c\'è più.')
  }
}

/** Controlla il contenuto secondo il tipo di file. Restituisce i problemi (vuoto = va bene). */
export function controllaSorgente(rel: string, testo: string): string[] {
  const p = rel.split('/')
  const nome = p[p.length - 1]!
  if (/\.ya?ml$/i.test(nome)) {
    if (nome === 'indice.yaml') {
      const r = leggiIndice(testo)
      return r.errore ? [r.errore] : []
    }
    if (p[p.length - 2] === 'schede') {
      const r = leggiSchedaSit(testo, nome)
      return r.errore ? [r.errore] : []
    }
  }
  return []
}

const stamp = (): string => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' + Math.floor(performance.now() % 1000).toString().padStart(3, '0')

export async function salvaSorgente(radice: string, rel: string, testo: string, mtimeAtteso: number, forza: boolean): Promise<EsitoSalva> {
  const p = parti(rel)
  const errori = controllaSorgente(rel, testo)
  if (errori.length) return { ok: false, errori }
  const file = join(radice, BASE, ...p)
  let vecchio: string | null = null
  try {
    const st = await fs.stat(file)
    if (!forza && Math.abs(st.mtimeMs - mtimeAtteso) > 1) return { ok: false, conflitto: true }
    vecchio = await fs.readFile(file, 'utf8')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
    throw new Error('Questo file non c\'è più.')
  }
  const nuovo = testo.replace(/\r\n?/g, '\n')
  if (vecchio.replace(/\r\n?/g, '\n').replace(/^﻿/, '') !== nuovo) {
    const dir = join(radice, '99_Archivio', 'Versioni', ...p)
    await fs.mkdir(dir, { recursive: true })
    const ext = p[p.length - 1]!.split('.').pop()!
    await fs.writeFile(join(dir, `${stamp()}.${ext}`), vecchio, 'utf8')
    const tutte = (await fs.readdir(dir)).sort()
    for (const f of tutte.slice(0, Math.max(0, tutte.length - VERSIONI))) await fs.rm(join(dir, f), { force: true }).catch(() => undefined)
  }
  const tmp = join(dirname(file), '.' + p[p.length - 1] + '.tmp')
  await fs.writeFile(tmp, nuovo, 'utf8')
  await fs.rename(tmp, file)
  return { ok: true, mtime: (await fs.stat(file)).mtimeMs }
}
