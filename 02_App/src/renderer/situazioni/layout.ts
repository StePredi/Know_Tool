// Disposizione della mappa mentale a quattro lati (sinistra, destra, alto, basso) attorno al centro.
// Stessa disposizione della documentazione Git: ventaglio dal centro per i lati L/R, colonne per T/B.
// Il centro sta sempre al centro del disegno (i due lati sono resi simmetrici).

import type { IndiceSit } from '@shared/situazioni'

const D = { LW: 184, LH: 60, LG: 6, SG: 18, BG: 44, BW: 232, BH: 44, SW: 132, SH: 32, CW: 210, CH: 72, CG: 18, PAD: 40 }

export interface NodoMappa {
  tipo: 'centro' | 'ramo' | 'gruppo' | 'scheda'
  x: number
  y: number
  w: number
  h: number
  /** posizione del ramo (= livello − 1); −1 per il centro */
  bi: number
  id?: string
  gruppo?: string
  ids?: string[]
  /** chiave per aprire e chiudere (ramo o gruppo) */
  chiave?: string
  /** quante schede stanno sotto (ramo o gruppo) */
  n?: number
  aperto?: boolean
}
export interface LinkMappa {
  /** ramo di appartenenza; −1 = tratto neutro dal centro */
  bi: number
  d: string
  sottile?: boolean
}
export interface LayoutMappa {
  nodi: NodoMappa[]
  link: LinkMappa[]
  /** spostamento da applicare ai tracciati dei collegamenti */
  ox: number
  oy: number
  W: number
  H: number
}

interface Pagina {
  g: string | null
  ids: string[]
}

/** Le voci del ramo: ogni gruppo è una colonna; le foglie sole di fila stanno insieme in una colonna senza gruppo. */
function pagine(indice: IndiceSit, bi: number, esiste: (id: string) => boolean, unisci: boolean): Pagina[] {
  const out: Pagina[] = []
  for (const v of indice.rami[bi]!.voci) {
    const ids = v.schede.filter(esiste)
    if (!ids.length) continue
    if (v.gruppo) out.push({ g: v.gruppo, ids })
    else if (unisci && out.length && out[out.length - 1]!.g === null) out[out.length - 1]!.ids.push(...ids)
    else if (unisci) out.push({ g: null, ids })
    else ids.forEach((id) => out.push({ g: null, ids: [id] }))
  }
  return out
}

export const chiaveRamo = (bi: number): string => `r${bi}`
export const chiaveGruppo = (bi: number, g: string): string => `g${bi}:${g}`

/** Tutte le chiavi apribili: rami e gruppi che contengono schede. */
export function tutteLeChiavi(indice: IndiceSit, esiste: (id: string) => boolean): string[] {
  const out: string[] = []
  indice.rami.forEach((_, bi) => {
    const pg = pagine(indice, bi, esiste, false)
    if (!pg.length) return
    out.push(chiaveRamo(bi))
    for (const p of pg) if (p.g) out.push(chiaveGruppo(bi, p.g))
  })
  return out
}

/** `aperti`: rami e gruppi aperti. Il centro e i rami si vedono sempre; il resto compare mano a mano che si apre. */
export function calcolaMappa(indice: IndiceSit, esiste: (id: string) => boolean, aperti: ReadonlySet<string>): LayoutMappa {
  const rAp = (bi: number): boolean => aperti.has(chiaveRamo(bi))
  const gAp = (bi: number, g: string | null): boolean => g === null || aperti.has(chiaveGruppo(bi, g))
  const conta = (bi: number): number => indice.rami[bi]!.voci.reduce((a, v) => a + v.schede.filter(esiste).length, 0)
  const nodi: NodoMappa[] = []
  const link: LinkMappa[] = []
  const hb = (x1: number, y1: number, x2: number, y2: number): string => `M${x1} ${y1}C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}`
  const vb = (x1: number, y1: number, x2: number, y2: number): string => `M${x1} ${y1}C${x1} ${(y1 + y2) / 2},${x2} ${(y1 + y2) / 2},${x2} ${y2}`
  // I rami si dispongono in senso orario partendo da in alto a sinistra: prima l'alto (da sinistra a destra),
  // poi la destra (dall'alto in basso), il basso (da destra a sinistra) e la sinistra (dal basso in alto).
  // Il campo «lato» dell'indice non serve più: il lato si ricava dalla posizione del ramo.
  const n = indice.rami.length
  const q = Math.floor(n / 4)
  const cnt: Record<string, number> = { T: q, R: q, B: q, L: q }
  for (const k of ['R', 'L', 'T', 'B'].slice(0, n - 4 * q)) cnt[k]! += 1
  const tutti = indice.rami.map((_, i) => i)
  const dalT = 0
  const dalR = cnt.T!
  const dalB = dalR + cnt.R!
  const dalL = dalB + cnt.B!
  const lati: Record<string, number[]> = {
    T: tutti.slice(dalT, dalR),
    R: tutti.slice(dalR, dalB),
    B: tutti.slice(dalB, dalL).reverse(),
    L: tutti.slice(dalL).reverse()
  }
  const lato = (s: string): number[] => lati[s]!

  nodi.push({ tipo: 'centro', bi: -1, x: -D.CW / 2, y: -D.CH / 2, w: D.CW, h: D.CH })

  // ---- alto e basso
  const haSchede = (bi: number): boolean => pagine(indice, bi, esiste, true).length > 0
  const colsOf = (bi: number): Pagina[] => (rAp(bi) ? pagine(indice, bi, esiste, true) : [])
  const colsW = (bi: number): number => {
    const n = Math.max(1, colsOf(bi).length)
    return n * D.LW + (n - 1) * D.CG
  }
  const bw = (bi: number): number => Math.max(colsW(bi), D.BW)
  const rows = { T: lato('T').filter(haSchede), B: lato('B').filter(haSchede) }
  let half = D.CW / 2
  for (const k of ['T', 'B'] as const) {
    const w = rows[k].reduce((a, i) => a + bw(i), 0) + Math.max(0, rows[k].length - 1) * D.BG
    half = Math.max(half, w / 2)
  }
  const SO = half + 56

  for (const k of ['T', 'B'] as const) {
    const s = k === 'T' ? -1 : 1
    const r = rows[k]
    let x = -(r.reduce((a, i) => a + bw(i), 0) + Math.max(0, r.length - 1) * D.BG) / 2
    for (const bi of r) {
      const w = bw(bi)
      const bcx = x + w / 2
      const yn = s * (D.CH / 2 + 46)
      const yf = yn + s * D.BH
      nodi.push({ tipo: 'ramo', bi, x: bcx - D.BW / 2, y: Math.min(yn, yf), w: D.BW, h: D.BH, chiave: chiaveRamo(bi), n: conta(bi), aperto: rAp(bi) })
      link.push({ bi, d: vb(0, (s * D.CH) / 2, bcx, yn) })
      colsOf(bi).forEach((c, i) => {
        const ccx = x + (w - colsW(bi)) / 2 + i * (D.LW + D.CG) + D.LW / 2
        const sn = yf + s * 40
        const sf = sn + s * D.SH
        const l0 = sf + s * 30
        if (c.g) {
          nodi.push({ tipo: 'gruppo', bi, gruppo: c.g, ids: c.ids, x: ccx - D.SW / 2, y: Math.min(sn, sf), w: D.SW, h: D.SH, chiave: chiaveGruppo(bi, c.g), n: c.ids.length, aperto: gAp(bi, c.g) })
          link.push({ bi, d: vb(bcx, yf, ccx, sn) })
        } else link.push({ bi, d: vb(bcx, yf, ccx, l0) })
        if (!gAp(bi, c.g)) return
        c.ids.forEach((id, j) => {
          const near = l0 + s * j * (D.LH + D.LG)
          nodi.push({ tipo: 'scheda', bi, id, x: ccx - D.LW / 2, y: s < 0 ? near - D.LH : near, w: D.LW, h: D.LH })
        })
        const last = l0 + s * ((c.ids.length - 1) * (D.LH + D.LG) + D.LH / 2)
        link.push({ bi, d: `M${ccx} ${c.g ? sf : l0}L${ccx} ${last}`, sottile: true })
      })
      x += w + D.BG
    }
  }

  // ---- sinistra e destra
  for (const k of ['L', 'R'] as const) {
    const dir = k === 'R' ? 1 : -1
    const blocks = lato(k)
      .map((bi) => {
        const gs = (rAp(bi) ? pagine(indice, bi, esiste, false) : []).map((p) =>
          p.g === null
            ? { leaf: p.ids[0]!, g: '', ids: [] as string[], h: D.LH, ap: true }
            : { leaf: null as string | null, g: p.g, ids: p.ids, ap: gAp(bi, p.g), h: gAp(bi, p.g) ? Math.max(D.SH, p.ids.length * D.LH + (p.ids.length - 1) * D.LG) : D.SH }
        )
        let h = 0
        gs.forEach((g, i) => {
          if (i) h += gs[i - 1]!.leaf && g.leaf ? D.LG : D.SG
          h += g.h
        })
        return { bi, gs, h: Math.max(h, D.BH) }
      })
      .filter((b) => haSchede(b.bi))
    if (!blocks.length) continue
    const total = blocks.reduce((a, x) => a + x.h, 0) + (blocks.length - 1) * D.BG
    let y = -total / 2
    const xFan = dir * (SO - 44)
    link.push({ bi: -1, d: `M${(dir * D.CW) / 2} 0L${xFan} 0` })
    const X = (near: number, w: number): number => (dir > 0 ? near : -(near + w))
    for (const bl of blocks) {
      const by = y + bl.h / 2
      nodi.push({ tipo: 'ramo', bi: bl.bi, x: X(SO, D.BW), y: by - D.BH / 2, w: D.BW, h: D.BH, chiave: chiaveRamo(bl.bi), n: conta(bl.bi), aperto: rAp(bl.bi) })
      link.push({ bi: bl.bi, d: hb(xFan, 0, dir * SO, by) })
      const bf = dir * (SO + D.BW)
      const colN = SO + D.BW + 46
      let gy = y
      bl.gs.forEach((g, i) => {
        if (i) gy += bl.gs[i - 1]!.leaf && g.leaf ? D.LG : D.SG
        if (g.leaf) {
          nodi.push({ tipo: 'scheda', bi: bl.bi, id: g.leaf, x: X(colN, D.LW), y: gy, w: D.LW, h: D.LH })
          link.push({ bi: bl.bi, d: hb(bf, by, dir * colN, gy + D.LH / 2) })
        } else {
          const scy = gy + g.h / 2
          const lN = colN + D.SW + 34
          nodi.push({ tipo: 'gruppo', bi: bl.bi, gruppo: g.g, ids: g.ids, x: X(colN, D.SW), y: scy - D.SH / 2, w: D.SW, h: D.SH, chiave: chiaveGruppo(bl.bi, g.g), n: g.ids.length, aperto: g.ap })
          link.push({ bi: bl.bi, d: hb(bf, by, dir * colN, scy) })
          if (g.ap) g.ids.forEach((id, j) => {
            const ly = gy + j * (D.LH + D.LG)
            nodi.push({ tipo: 'scheda', bi: bl.bi, id, x: X(lN, D.LW), y: ly, w: D.LW, h: D.LH })
            link.push({ bi: bl.bi, d: hb(dir * (colN + D.SW), scy, dir * lN, ly + D.LH / 2), sottile: true })
          })
        }
        gy += g.h
      })
      y += bl.h + D.BG
    }
  }

  // ---- il centro deve restare al centro: estensione uguale da entrambe le parti
  let hx = D.CW / 2
  let hy = D.CH / 2
  for (const n of nodi) {
    hx = Math.max(hx, Math.abs(n.x), Math.abs(n.x + n.w))
    hy = Math.max(hy, Math.abs(n.y), Math.abs(n.y + n.h))
  }
  const ox = hx + D.PAD
  const oy = hy + D.PAD
  for (const n of nodi) {
    n.x += ox
    n.y += oy
  }
  return { nodi, link, ox, oy, W: 2 * ox, H: 2 * oy }
}
