// Impaginazione della mappa a corsie: scala dell'asse con i vuoti compressi, righe delle card,
// zona «Senza data». Funzione pura (portata dalla demo della Home), così si può collaudare senza interfaccia.

import { dataBreve, parseData } from './dates'
import { corsiaDi, type Indice } from './derivati'
import type { Modello, Scheda } from './types'

export const NW = 200 // larghezza card
export const NH = 70 // altezza card
export const ROWH = 82 // altezza di una riga di sovrapposizione
export const AXIS = 28 // altezza dell'asse
export const PADL = 162 // spazio per le etichette delle corsie
export const PXY = 46 // pixel per anno
const GAPMIN = 7 // anni vuoti consecutivi oltre i quali si comprime
const BREAKW = 58 // larghezza dell'interruzione

export interface CardMappa {
  id: string
  titolo: string
  data: string
  sigla: string
  left: number
  /** posizione dentro la corsia */
  top: number
  /** posizione nell'intera tela */
  absTop: number
  w: number
  h: number
  col: string
  visibile: boolean
  selezionata: boolean
  collegata: boolean
}

export interface CorsiaMappa {
  id: string
  nome: string
  top: number
  h: number
  col: string
  nSchede: number
  cards: CardMappa[]
}

export interface Bordo {
  d: string
  col: string
}

export interface LayoutMappa {
  canvasW: number
  canvasH: number
  corsie: CorsiaMappa[]
  ticks: { x: number; label: string }[]
  gridlines: number[]
  breaks: { x: number; w: number; label: string; lx: number }[]
  senzaData: { n: number; x: number; w: number }
  edges: Bordo[]
  /** x sulla tela per un anno (con la compressione dei vuoti) */
  xOf: (anno: number) => number
}

export interface ArgsLayout {
  modello: Modello
  indice: Indice
  corsieSpente: Record<string, boolean>
  passa: (s: Scheda) => boolean
  selId: string | null
  colore: (corsiaId: string) => string
}

export function calcolaMappa(a: ArgsLayout): LayoutMappa {
  const { modello: m, indice: ix } = a
  const schede = m.schede
  const nums = schede.map((s) => ix.num(s)).filter((v): v is number => v != null && v > 0)
  const y0 = nums.length ? Math.floor(Math.min(...nums)) - 1 : 2000
  const y1 = nums.length ? Math.ceil(Math.max(...nums)) + 1 : 2010

  const usati = new Set<number>()
  nums.forEach((v) => usati.add(Math.floor(v)))
  m.autore.periodi.forEach((p) => {
    const v = parseData(p.data).num
    if (v != null && v >= y0 && v <= y1) usati.add(Math.floor(v))
  })

  // vuoti lunghi: ≥ GAPMIN anni senza schede né inizio di periodo diventano un'interruzione fissa
  const breaksRaw: { a: number; b: number }[] = []
  let run: { a: number; b: number } | null = null
  for (let y = y0 + 1; y < y1; y++) {
    if (!usati.has(y)) {
      if (run) run.b = y + 1
      else run = { a: y - 1, b: y + 1 }
    } else {
      if (run && run.b - run.a - 1 >= GAPMIN) breaksRaw.push(run)
      run = null
    }
  }
  if (run && (run as { a: number; b: number }).b - (run as { a: number; b: number }).a - 1 >= GAPMIN) breaksRaw.push(run)

  const xOf = (v: number): number => {
    let x = 0
    let prev = y0
    for (const B of breaksRaw) {
      if (v <= B.a) break
      x += (B.a - prev) * PXY
      if (v >= B.b) {
        x += BREAKW
        prev = B.b
      } else {
        x += BREAKW * ((v - B.a) / (B.b - B.a))
        prev = v
        break
      }
    }
    return x + (v - prev) * PXY
  }
  const saltaTacca = new Set<number>()
  breaksRaw.forEach((B) => {
    saltaTacca.add(B.a)
    saltaTacca.add(B.b)
  })

  // zona «Senza data»
  const nSenza = schede.filter((s) => ix.num(s) == null).length
  const ND_X = PADL + xOf(y1) + NW + 52

  // impaginazione: una riga per ogni sovrapposizione («corsie estese»)
  const pos = new Map<string, { x: number; r: number }>()
  const impacchetta = (items: Scheda[]): number => {
    const righe: number[] = []
    items.forEach((s) => {
      const v = ix.num(s)
      const x = v == null ? ND_X : PADL + xOf(v)
      let r = 0
      while (righe[r] !== undefined && righe[r]! > x - 8) r++
      righe[r] = x + NW
      pos.set(s.id, { x, r })
    })
    return Math.max(1, righe.length)
  }

  const sel = a.selId ? ix.byId.get(a.selId) ?? null : null
  const collegate = sel ? ix.adj.get(sel.id) ?? [] : []
  const corsie: CorsiaMappa[] = []
  const tutte: CardMappa[] = []
  let top = AXIS + 2
  for (const L of m.autore.corsie) {
    if (a.corsieSpente[L.id]) continue
    const col = a.colore(L.id)
    const items = schede.filter((s) => corsiaDi(m, s.corsia).id === L.id).sort(ix.cmp)
    const nRighe = impacchetta(items)
    const h = nRighe * ROWH + 6
    const cards: CardMappa[] = items.map((s) => {
      const p = pos.get(s.id)!
      return {
        id: s.id,
        titolo: s.titolo_breve,
        data: dataBreve(s.data),
        sigla: L.sigla,
        left: Math.round(p.x),
        top: 3 + p.r * ROWH,
        absTop: top + 3 + p.r * ROWH,
        w: NW,
        h: NH,
        col,
        visibile: a.passa(s),
        selezionata: !!sel && sel.id === s.id,
        collegata: collegate.includes(s.id)
      }
    })
    corsie.push({ id: L.id, nome: L.nome, top, h, col, nSchede: items.length, cards })
    tutte.push(...cards)
    top += h
  }
  const canvasW = (nSenza ? ND_X + NW : PADL + xOf(y1) + NW) + 60
  const canvasH = Math.max(top + 20, 420)

  const edges: Bordo[] = []
  if (sel) {
    const da = tutte.find((c) => c.id === sel.id)
    for (const id of collegate) {
      const b = tutte.find((c) => c.id === id)
      const sc = ix.byId.get(id)
      if (!da || !b || !sc) continue
      const ax = da.left + da.w / 2
      const ay = da.absTop + da.h / 2
      const bx = b.left + b.w / 2
      const by = b.absTop + b.h / 2
      const mx = (ax + bx) / 2
      edges.push({ d: `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`, col: a.colore(corsiaDi(m, sc.corsia).id) })
    }
  }

  // tacche e righe verticali, a tratti tra un'interruzione e l'altra
  const ticks: { x: number; label: string }[] = []
  const gridlines: number[] = []
  const passo = Math.max(1, Math.ceil(110 / PXY))
  const tratti: [number, number][] = []
  let inizio = y0
  breaksRaw.forEach((B) => {
    tratti.push([inizio, B.a])
    inizio = B.b
  })
  tratti.push([inizio, y1])
  const visti = new Set<number>()
  const aggiungi = (y: number): void => {
    visti.add(y)
    const x = Math.round(PADL + xOf(y))
    gridlines.push(x)
    if (!saltaTacca.has(y)) ticks.push({ label: String(y), x: x + 4 })
  }
  tratti.forEach(([da, fino]) => {
    for (let y = da; y <= fino; y += passo) if (!visti.has(y)) aggiungi(y)
    if (!visti.has(fino)) aggiungi(fino)
  })
  const breaks = breaksRaw.map((B) => {
    const x = Math.round(PADL + xOf(B.a))
    return { x, w: BREAKW, label: `${B.a} ⟋ ${B.b}`, lx: Math.round(x + BREAKW / 2 - 34) }
  })

  return {
    canvasW: Math.round(canvasW),
    canvasH: Math.round(canvasH),
    corsie,
    ticks,
    gridlines,
    breaks,
    senzaData: { n: nSenza, x: Math.round(ND_X - 18), w: NW + 36 },
    edges,
    xOf
  }
}
