// Tutto ciò che si CALCOLA e non si scrive (formato_studio_italiano.md §8):
// collegamenti reciproci, elenco delle schede di un tema, ordine cronologico, colori.

import { fineEsclusa, parseData } from './dates'
import type { Corsia, Modello, Periodo, Scheda, Tema } from './types'

export interface Indice {
  byId: Map<string, Scheda>
  /** collegamenti in entrambe le direzioni, senza doppioni */
  adj: Map<string, string[]>
  /** posizione sull'asse (null = senza data) */
  num: (s: Scheda) => number | null
  /** confronto cronologico: a parità di data decide l'id; le schede senza data in fondo */
  cmp: (a: Scheda, b: Scheda) => number
  /** schede in ordine cronologico */
  chron: Scheda[]
}

export function costruisciIndice(m: Modello): Indice {
  const byId = new Map<string, Scheda>()
  const adj = new Map<string, string[]>()
  for (const s of m.schede) {
    byId.set(s.id, s)
    adj.set(s.id, [])
  }
  for (const s of m.schede) {
    for (const k of s.collegamenti) {
      if (k === s.id || !byId.has(k)) continue
      const a = adj.get(s.id)!
      if (!a.includes(k)) a.push(k)
      const b = adj.get(k)!
      if (!b.includes(s.id)) b.push(s.id)
    }
  }
  const cache = new Map<string, number | null>()
  const num = (s: Scheda): number | null => {
    if (!cache.has(s.id)) cache.set(s.id, parseData(s.data).num)
    return cache.get(s.id)!
  }
  const perId = (a: Scheda, b: Scheda): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const cmp = (a: Scheda, b: Scheda): number => {
    const va = num(a)
    const vb = num(b)
    if (va == null && vb == null) return perId(a, b)
    if (va == null) return 1
    if (vb == null) return -1
    return va - vb || perId(a, b)
  }
  return { byId, adj, num, cmp, chron: m.schede.slice().sort(cmp) }
}

export function corsiaDi(m: Modello, id: string): Corsia {
  return m.autore.corsie.find((c) => c.id === id) ?? m.autore.corsie[0]!
}

export function temiDi(m: Modello, s: Scheda): Tema[] {
  return s.temi.map((k) => m.temi.find((t) => t.id === k)).filter((t): t is Tema => !!t)
}

/** Colore della corsia: calcolato da tonalità, tema e palette, così il contrasto è garantito. */
export function coloreCorsia(tonalita: number, scuro: boolean, sobria: boolean): string {
  const h = (((+tonalita || 0) % 360) + 360) % 360
  const L = scuro ? 0.82 : 0.45
  const C = sobria ? (scuro ? 0.055 : 0.05) : scuro ? 0.145 : 0.135
  return `oklch(${L} ${C} ${h})`
}

export interface FasciaPeriodo {
  indice: number
  nome: string
  lo: number
  hi: number
}

/** Periodi ordinati per inizio, con i limiti: la fine è quella scritta, o dove comincia il successivo. */
export function fascePeriodi(periodi: Periodo[]): FasciaPeriodo[] {
  const ord = periodi
    .map((p, indice) => ({ p, indice }))
    .sort((a, b) => (parseData(a.p.data).num ?? 0) - (parseData(b.p.data).num ?? 0))
  return ord.map(({ p, indice }, j) => {
    const lo = parseData(p.data).num ?? -9999
    const fin = p.fine ? fineEsclusa(p.fine).v : null
    const prossimo = j + 1 < ord.length ? parseData(ord[j + 1]!.p.data).num : null
    const hi = fin != null ? fin : prossimo == null ? 9999 : prossimo
    return { indice, nome: p.nome, lo, hi }
  })
}

export function dentroFascia(v: number | null, f: FasciaPeriodo): boolean {
  return v != null && v >= f.lo && v < f.hi
}

/** Schede che citano un tema (il tema non le elenca: le raccoglie l'app). */
export function schedeDelTema(m: Modello, temaId: string): Scheda[] {
  return m.schede.filter((s) => s.temi.includes(temaId))
}
