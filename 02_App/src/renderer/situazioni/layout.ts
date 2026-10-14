// Disposizione della mappa mentale a quattro lati (sinistra, destra, alto, basso) attorno al centro.
// Portata dalla documentazione MikroTik: stesse misure e stesse curve di collegamento.

import type { IndiceSit } from '@shared/situazioni'

export const LEAF_W = 196
export const LEAF_H = 52
const LEAF_GAP = 6
const SUB_W = 128
const SUB_H = 32
const BR_W = 170
const BR_H = 42
export const CEN_W = 230
export const CEN_H = 76
const PAD = 36

export interface NodoMappa {
  tipo: 'centro' | 'ramo' | 'gruppo' | 'scheda'
  x: number
  y: number
  w: number
  h: number
  /** posizione del ramo (= livello − 1) */
  bi: number
  id?: string
  gruppo?: string
  ids?: string[]
}
export interface LinkMappa {
  bi: number
  d: string
}
export interface LayoutMappa {
  nodi: NodoMappa[]
  link: LinkMappa[]
  W: number
  H: number
}

interface Voce {
  scheda?: string
  gruppo?: string
  schede?: string[]
}

/** Una voce senza gruppo è una foglia sola; con gruppo è un sottoramo con le sue foglie. */
function voci(indice: IndiceSit, bi: number, esiste: (id: string) => boolean): Voce[] {
  const out: Voce[] = []
  for (const v of indice.rami[bi]!.voci) {
    const ids = v.schede.filter(esiste)
    if (!ids.length) continue
    if (v.gruppo) out.push({ gruppo: v.gruppo, schede: ids })
    else ids.forEach((id) => out.push({ scheda: id }))
  }
  return out
}

export function calcolaMappa(indice: IndiceSit, esiste: (id: string) => boolean): LayoutMappa {
  const nodi: NodoMappa[] = []
  const link: LinkMappa[] = []
  const add = (n: NodoMappa): NodoMappa => (nodi.push(n), n)
  const lato = (s: string): number[] => indice.rami.map((r, i) => (r.lato === s ? i : -1)).filter((i) => i >= 0)
  const colW = LEAF_W + 22
  const colGap = 26
  const brGap = 44

  interface Colonna { gruppo: string | null; schede: string[] }
  const vBranch = (bi: number): { bi: number; cols: Colonna[]; hasSub: boolean; w: number } => {
    const items = voci(indice, bi, esiste)
    const hasSub = items.some((i) => i.gruppo)
    const cols: Colonna[] = hasSub
      ? items.map((i) => ({ gruppo: i.gruppo ?? null, schede: i.scheda ? [i.scheda] : i.schede! }))
      : [{ gruppo: null, schede: items.map((i) => i.scheda!) }]
    return { bi, cols, hasSub, w: hasSub ? cols.length * colW + (cols.length - 1) * colGap : Math.max(BR_W, colW) }
  }
  const T = lato('T').map(vBranch)
  const B = lato('B').map(vBranch)
  const totW = (a: { w: number }[]): number => a.reduce((s, x) => s + x.w, 0) + brGap * Math.max(0, a.length - 1)
  const M = Math.max(totW(T), totW(B)) / 2 + 52

  const hBranch = (bi: number): { bi: number; h: number; parts: { it: Voce; y: number; h: number }[] } => {
    const items = voci(indice, bi, esiste)
    let h = 0
    const parts: { it: Voce; y: number; h: number }[] = []
    items.forEach((it, i) => {
      const ih = it.scheda ? LEAF_H : Math.max(SUB_H, it.schede!.length * LEAF_H + (it.schede!.length - 1) * LEAF_GAP)
      const prev = items[i - 1]
      const gap = i === 0 ? 0 : prev!.scheda && it.scheda ? 8 : 18
      h += gap
      parts.push({ it, y: h, h: ih })
      h += ih
    })
    return { bi, h, parts }
  }
  const hlink = (a: NodoMappa, b: NodoMappa, dir: number, bi: number): void => {
    const x1 = dir > 0 ? a.x + a.w : a.x
    const x2 = dir > 0 ? b.x : b.x + b.w
    const y1 = a.y + a.h / 2
    const y2 = b.y + b.h / 2
    const d = x2 - x1
    link.push({ bi, d: `M${x1} ${y1} C${x1 + d * 0.5} ${y1} ${x1 + d * 0.5} ${y2} ${x2} ${y2}` })
  }

  add({ tipo: 'centro', bi: -1, x: -CEN_W / 2, y: -CEN_H / 2, w: CEN_W, h: CEN_H })
  for (const side of ['R', 'L'] as const) {
    const dir = side === 'R' ? 1 : -1
    const arr = lato(side).map(hBranch)
    const total = arr.reduce((s, x) => s + x.h, 0) + 40 * Math.max(0, arr.length - 1)
    let y = -total / 2
    const X = (o: number, w: number): number => (dir > 0 ? o : -(o + w))
    for (const hb of arr) {
      const bn = add({ tipo: 'ramo', bi: hb.bi, x: X(M, BR_W), y: y + hb.h / 2 - BR_H / 2, w: BR_W, h: BR_H })
      {
        const x1 = (dir * CEN_W) / 2
        const x2 = dir > 0 ? bn.x : bn.x + bn.w
        const y2 = bn.y + bn.h / 2
        const d = x2 - x1
        link.push({ bi: hb.bi, d: `M${x1} 0 C${x1 + d * 0.75} 0 ${x1 + d * 0.9} ${y2} ${x2} ${y2}` })
      }
      for (const p of hb.parts) {
        const iy = y + p.y
        if (p.it.scheda) {
          const ln = add({ tipo: 'scheda', id: p.it.scheda, bi: hb.bi, x: X(M + BR_W + 38, LEAF_W), y: iy, w: LEAF_W, h: LEAF_H })
          hlink(bn, ln, dir, hb.bi)
        } else {
          const sn = add({ tipo: 'gruppo', bi: hb.bi, gruppo: p.it.gruppo, ids: p.it.schede, x: X(M + BR_W + 38, SUB_W), y: iy + p.h / 2 - SUB_H / 2, w: SUB_W, h: SUB_H })
          hlink(bn, sn, dir, hb.bi)
          p.it.schede!.forEach((id, k) => {
            const ln = add({ tipo: 'scheda', id, bi: hb.bi, x: X(M + BR_W + 38 + SUB_W + 34, LEAF_W), y: iy + k * (LEAF_H + LEAF_GAP), w: LEAF_W, h: LEAF_H })
            hlink(sn, ln, dir, hb.bi)
          })
        }
      }
      y += hb.h + 40
    }
  }

  const placeV = (arr: ReturnType<typeof vBranch>[], dir: number): void => {
    let x = -totW(arr) / 2
    const oc = CEN_H / 2
    const ob = oc + 56
    const Y = (o: number, h: number): number => (dir > 0 ? o : -(o + h))
    for (const vb of arr) {
      const bx = vb.hasSub ? x + vb.w / 2 - BR_W / 2 : x
      const bn = add({ tipo: 'ramo', bi: vb.bi, x: bx, y: Y(ob, BR_H), w: BR_W, h: BR_H })
      {
        const y1 = dir * oc
        const y2 = dir > 0 ? bn.y : bn.y + bn.h
        const x2 = bn.x + bn.w / 2
        const ym = (y1 + y2) / 2
        link.push({ bi: vb.bi, d: `M0 ${y1} C0 ${ym} ${x2} ${ym} ${x2} ${y2}` })
      }
      let cx = x
      for (const col of vb.cols) {
        let startO: number
        let parent: NodoMappa
        if (vb.hasSub) {
          const os = ob + BR_H + 34
          const sn = add({ tipo: 'gruppo', bi: vb.bi, gruppo: col.gruppo ?? '', ids: col.schede, x: cx, y: Y(os, SUB_H), w: SUB_W, h: SUB_H })
          const ya = dir > 0 ? bn.y + bn.h : bn.y
          const yb = dir > 0 ? sn.y : sn.y + sn.h
          const xa = bn.x + bn.w / 2
          const xb = sn.x + sn.w / 2
          const yy = (ya + yb) / 2
          link.push({ bi: vb.bi, d: `M${xa} ${ya} C${xa} ${yy} ${xb} ${yy} ${xb} ${yb}` })
          startO = os + SUB_H + 18
          parent = sn
        } else {
          startO = ob + BR_H + 18
          parent = bn
        }
        const sx = cx + 10
        const ys = dir > 0 ? parent.y + parent.h : parent.y
        const yc: number[] = []
        col.schede.forEach((id, k) => {
          const o = startO + k * (LEAF_H + LEAF_GAP)
          add({ tipo: 'scheda', id, bi: vb.bi, x: cx + 22, y: Y(o, LEAF_H), w: LEAF_W, h: LEAF_H })
          yc.push(Y(o, LEAF_H) + LEAF_H / 2)
        })
        let d = `M${sx} ${ys} V${yc[yc.length - 1] ?? ys}`
        yc.forEach((c) => (d += ` M${sx} ${c} H${cx + 22}`))
        link.push({ bi: vb.bi, d })
        cx += colW + colGap
      }
      x += vb.w + brGap
    }
  }
  placeV(T, -1)
  placeV(B, 1)

  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9
  for (const n of nodi) {
    minx = Math.min(minx, n.x); miny = Math.min(miny, n.y)
    maxx = Math.max(maxx, n.x + n.w); maxy = Math.max(maxy, n.y + n.h)
  }
  const ox = PAD - minx
  const oy = PAD - miny
  for (const n of nodi) { n.x += ox; n.y += oy }
  for (const l of link) {
    l.d = l.d.replace(/([MCVHL])([^MCVHL]*)/g, (_m, c: string, rest: string) => {
      const nums = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number)
      if (c === 'V') return `V${nums[0]! + oy}`
      if (c === 'H') return `H${nums[0]! + ox}`
      const o: string[] = []
      for (let i = 0; i < nums.length; i += 2) o.push(`${nums[i]! + ox} ${nums[i + 1]! + oy}`)
      return c + o.join(' ')
    })
  }
  return { nodi, link, W: maxx - minx + 2 * PAD, H: maxy - miny + 2 * PAD }
}
