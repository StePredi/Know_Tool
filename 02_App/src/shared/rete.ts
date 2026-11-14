// Disegno «rete» (specifiche/disegno_rete.md): controlli e posizioni dei nodi e dei cavi.
// Niente grafica qui: le posizioni sono numeri, il disegno SVG sta in renderer/situazioni/Rete.tsx.

import type { DisegnoRete } from './situazioni'

export const RETE_RIGA = 150
export const RETE_MARGINE = 56
export const RETE_NODO_H = 56

/** Avvisi leggibili (mai un blocco): riferimenti, righe vicine, VLAN citate, nodi soli. */
export function controllaRete(d: DisegnoRete): string[] {
  const av: string[] = []
  const riga = new Map<string, number>()
  const visti = new Set<string>()
  d.nodi.forEach((r, i) => r.forEach((n) => {
    if (visti.has(n.id)) av.push(`il nodo «${n.id}» compare due volte.`)
    visti.add(n.id)
    riga.set(n.id, i)
  }))
  const vlan = new Set<number>()
  for (const v of d.vlan) {
    if (vlan.has(v.id)) av.push(`la VLAN ${v.id} è dichiarata due volte.`)
    vlan.add(v.id)
  }
  const collegati = new Set<string>()
  d.cavi.forEach((c, i) => {
    const nome = `il cavo ${i + 1} (${c.da} → ${c.a})`
    let ok = true
    for (const x of [c.da, c.a]) if (!riga.has(x)) { av.push(`${nome} cita il nodo «${x}» che non esiste.`); ok = false }
    if (ok) {
      collegati.add(c.da); collegati.add(c.a)
      if (Math.abs(riga.get(c.da)! - riga.get(c.a)!) !== 1) av.push(`${nome} non collega due righe vicine: non si disegna.`)
    }
    if (c.access != null && c.trunk) av.push(`${nome} è sia access sia trunk: conta il trunk.`)
    for (const v of [...(c.trunk ?? []), ...(c.access != null ? [c.access] : [])]) if (!vlan.has(v)) av.push(`${nome} cita la VLAN ${v} che non è dichiarata.`)
  })
  for (const id of riga.keys()) if (!collegati.has(id) && d.cavi.length) av.push(`il nodo «${id}» non ha nessun cavo.`)
  return av
}

/** Il testo della figura per la ricerca della mappa. */
export function testoRete(d: DisegnoRete): string {
  return [
    ...d.nodi.flat().flatMap((n) => [n.nome, n.sotto]),
    ...d.vlan.flatMap((v) => ['vlan' + v.id, v.nome, v.rete]),
    ...d.cavi.flatMap((c) => [c.porta_da, c.porta_a, c.ip_da, c.ip_a])
  ].join(' ')
}

export interface NodoPosto { id: string; nome: string; tipo: string; sotto: string; x: number; y: number; w: number; h: number }
export interface CavoPosto {
  da: string; a: string
  /** capo sul nodo «da» e capo sul nodo «a» */
  xd: number; yd: number; xa: number; ya: number
  /** una striscia per VLAN (0 = cavo senza VLAN) */
  strisce: number[]
  spessore: number
  tipo: 'trunk' | 'access' | 'cavo'
  porta_da: string; porta_a: string; ip_da: string; ip_a: string
}
export interface ReteDisposta { larghezza: number; altezza: number; nodi: NodoPosto[]; cavi: CavoPosto[] }

/** Larghezza del riquadro: quella che serve al testo (stima), dentro lo spazio della riga. */
export function larghezzaNodo(nome: string, sotto: string, spazio: number, tipo: string): number {
  const serve = Math.max(nome.length * 8.6, sotto.length * 6.4) + 28
  if (tipo === 'nuvola') return Math.round(Math.max(150, Math.min(serve + 40, spazio + 30)))
  return Math.round(Math.max(150, Math.min(serve, Math.max(spazio, 150))))
}

export function disponiRete(d: DisegnoRete): ReteDisposta {
  const piu = Math.max(...d.nodi.map((r) => r.length))
  const larghezza = Math.max(760, piu * 220 + 40)
  const altezza = RETE_MARGINE * 2 + (d.nodi.length - 1) * RETE_RIGA
  const nodi: NodoPosto[] = []
  const per = new Map<string, NodoPosto>()
  d.nodi.forEach((r, i) => r.forEach((n, j) => {
    const p: NodoPosto = { id: n.id, nome: n.nome, tipo: n.tipo, sotto: n.sotto, x: (larghezza * (j + 1)) / (r.length + 1), y: RETE_MARGINE + i * RETE_RIGA, w: larghezzaNodo(n.nome, n.sotto, larghezza / (r.length + 1) - 24, n.tipo), h: RETE_NODO_H }
    nodi.push(p); per.set(n.id, p)
  }))
  const riga = new Map<string, number>()
  d.nodi.forEach((r, i) => r.forEach((n) => riga.set(n.id, i)))
  const cavi: CavoPosto[] = []
  for (const c of d.cavi) {
    const A = per.get(c.da), B = per.get(c.a)
    if (!A || !B || Math.abs(riga.get(c.da)! - riga.get(c.a)!) !== 1) continue
    const giu = riga.get(c.da)! < riga.get(c.a)!
    const tipo = c.trunk ? 'trunk' : c.access != null ? 'access' : 'cavo'
    cavi.push({
      da: c.da, a: c.a,
      xd: A.x, yd: A.y + (giu ? A.h / 2 : -A.h / 2), xa: B.x, ya: B.y + (giu ? -B.h / 2 : B.h / 2),
      strisce: c.trunk ?? (c.access != null ? [c.access] : [0]),
      spessore: tipo === 'trunk' ? 7 : 5, tipo,
      porta_da: c.porta_da, porta_a: c.porta_a, ip_da: c.ip_da, ip_a: c.ip_a
    })
  }
  return { larghezza, altezza, nodi, cavi }
}
