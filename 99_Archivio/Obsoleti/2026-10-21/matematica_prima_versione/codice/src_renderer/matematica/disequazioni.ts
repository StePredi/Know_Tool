// Disequazioni intere e fratte, già scomposte (o con fattori fino al 2º grado), con secondo membro 0:
// i dati per la LINEA DEI SEGNI (una riga per fattore) e la soluzione come intervalli.
import { ErroreMat, grado, leggiPoli, scriviFattore, valuta, type Poli } from './polinomio'

export type Relazione = '>' | '>=' | '<' | '<='

export interface Riga {
  f: Poli
  /** sta al denominatore */
  den: boolean
  radici: number[]
  /** segno (+1, -1) in ogni intervallo */
  segni: number[]
}
export interface Punto {
  v: number
  /** è radice di un fattore del numeratore / del denominatore */
  num: boolean
  den: boolean
}
export interface Tratto {
  lo: number
  hi: number
  /** estremo incluso */
  loChiuso: boolean
  hiChiuso: boolean
}
export interface Disequazione {
  rel: Relazione
  righe: Riga[]
  punti: Punto[]
  /** segno del risultato in ogni intervallo (punti.length + 1 intervalli) */
  risultato: number[]
  /** l'intervallo soddisfa la relazione */
  ok: boolean[]
  /** il punto fa parte della soluzione */
  incluso: boolean[]
  tratti: Tratto[]
  testo: string
  fratta: boolean
}

const EPS = 1e-9

/** Divide al livello più esterno, fuori dalle parentesi. */
function taglia(s: string, ch: string): number {
  let dp = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') dp++
    else if (c === ')') dp--
    else if (dp === 0 && c === ch) return i
  }
  return -1
}

/** «(x-1)^2(x+3)x» → [[−1,1],[−1,1],[3,1],[0,1]] */
function fattori(s: string): Poli[] {
  s = s.replace(/\s+/g, '')
  const out: Poli[] = []
  const resto = s.replace(/\(([^()]*)\)(?:\^(\d+))?/g, (_, g: string, e: string | undefined) => {
    const f = leggiPoli(g)
    for (let i = 0, k = e ? parseInt(e, 10) : 1; i < k; i++) out.push(f)
    return ''
  }).replace(/\*/g, '')
  if (resto !== '') out.push(leggiPoli(resto))
  if (!out.length) throw new ErroreMat('lettura', 'Non riesco a leggerla: controlla parentesi e simboli.')
  return out
}

export function radici(p: Poli): number[] {
  const h = grado(p)
  if (h === 0) return []
  if (h === 1) return [-p[0]! / p[1]!]
  if (h === 2) {
    const D = p[1]! * p[1]! - 4 * p[2]! * p[0]!
    if (D < 0) return []
    if (D === 0) return [-p[1]! / (2 * p[2]!)]
    const r = Math.sqrt(D)
    return [(-p[1]! - r) / (2 * p[2]!), (-p[1]! + r) / (2 * p[2]!)]
  }
  throw new ErroreMat('grado', 'Per ora solo fattori fino al 2º grado: scomponi prima.')
}

/** 3 → «3», -2 → «−2», 0.5 → «1/2», altrimenti «≈1.41». */
export function scriviNumero(r: number): string {
  if (Math.abs(r - Math.round(r)) < EPS) return String(Math.round(r)).replace('-', '−')
  for (let q = 2; q <= 12; q++) {
    const n = r * q
    if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n)).replace('-', '−') + '/' + q
  }
  return '≈' + r.toFixed(2).replace('-', '−')
}

export function leggiDisequazione(scritta: string): Disequazione {
  const s = scritta.replace(/\s+/g, '')
  const m = /(>=|<=|>|<)/.exec(s)
  if (!m) throw new ErroreMat('lettura', 'Manca il segno: usa >, <, >= oppure <=.')
  const i = s.indexOf(m[1]!)
  const sx = s.slice(0, i), dx = s.slice(i + m[1]!.length)
  if (dx !== '0') throw new ErroreMat('secondoMembro', 'Porta tutto a sinistra: il secondo membro deve essere 0.')
  const rel = m[1] as Relazione
  const sl = taglia(sx, '/')
  const num = sl >= 0 ? fattori(sx.slice(0, sl)) : fattori(sx)
  const den = sl >= 0 ? fattori(sx.slice(sl + 1)) : []
  const tutti = [...num.map((f) => ({ f, den: false })), ...den.map((f) => ({ f, den: true }))].map((x) => ({ ...x, radici: radici(x.f) }))

  const grezzi = tutti.flatMap((x) => x.radici.map((v) => ({ v, num: !x.den, den: x.den }))).sort((a, b) => a.v - b.v)
  const punti: Punto[] = []
  for (const r of grezzi) {
    const l = punti[punti.length - 1]
    if (l && Math.abs(l.v - r.v) < EPS) { l.num ||= r.num; l.den ||= r.den } else punti.push({ ...r })
  }
  const N = punti.length
  const prova: number[] = N === 0 ? [0] : [punti[0]!.v - 1, ...punti.slice(0, -1).map((p, k) => (p.v + punti[k + 1]!.v) / 2), punti[N - 1]!.v + 1]
  const righe: Riga[] = tutti.map((x) => ({ f: x.f, den: x.den, radici: x.radici, segni: prova.map((t) => Math.sign(valuta(x.f, t))) }))
  const risultato = prova.map((_, k) => righe.reduce((v, r) => v * r.segni[k]!, 1))
  const voglio = rel[0] === '>' ? 1 : -1
  const ok = risultato.map((v) => v === voglio)
  const incluso = punti.map((p) => rel.includes('=') && p.num && !p.den)

  const tratti: Tratto[] = []
  for (let k = 0; k <= N; k++) {
    if (!ok[k]) continue
    const lo = k === 0 ? -Infinity : punti[k - 1]!.v
    const hi = k === N ? Infinity : punti[k]!.v
    const loChiuso = k > 0 && incluso[k - 1]!, hiChiuso = k < N && incluso[k]!
    const ult = tratti[tratti.length - 1]
    if (ult && ult.hi === lo && ult.hiChiuso && loChiuso) { ult.hi = hi; ult.hiChiuso = hiChiuso } else tratti.push({ lo, hi, loChiuso, hiChiuso })
  }
  // punti isolati: il fattore si annulla ma i due lati non vanno bene (es. (x-2)^2 <= 0)
  for (let j = 0; j < N; j++) if (incluso[j] && !ok[j] && !ok[j + 1]) tratti.push({ lo: punti[j]!.v, hi: punti[j]!.v, loChiuso: true, hiChiuso: true })
  tratti.sort((a, b) => a.lo - b.lo)

  const testo = tratti.map((g) => {
    if (g.lo === -Infinity && g.hi === Infinity) return 'per ogni x'
    if (g.lo === -Infinity) return `x ${g.hiChiuso ? '≤' : '<'} ${scriviNumero(g.hi)}`
    if (g.hi === Infinity) return `x ${g.loChiuso ? '≥' : '>'} ${scriviNumero(g.lo)}`
    if (g.lo === g.hi) return `x = ${scriviNumero(g.lo)}`
    return `${scriviNumero(g.lo)} ${g.loChiuso ? '≤' : '<'} x ${g.hiChiuso ? '≤' : '<'} ${scriviNumero(g.hi)}`
  }).join('  ∨  ') || 'nessuna soluzione'

  return { rel, righe, punti, risultato, ok, incluso, tratti, testo, fratta: den.length > 0 }
}

/** Valore della frazione (prodotto dei fattori / quoziente) in x: serve a disegnare il grafico. */
export const valoreDisequazione = (d: Disequazione, x: number): number => d.righe.reduce((v, r) => v * (r.den ? 1 / valuta(r.f, x) : valuta(r.f, x)), 1)

/** La frase del perché di un segno: «(x−1) è positivo a destra di 1». */
export function perchéSegno(r: Riga): string {
  const n = scriviFattore(r.f).replace(/-/g, '−'), a = r.f[r.f.length - 1]!, rad = r.radici
  switch (grado(r.f)) {
    case 0: return `${n} è una costante ${a > 0 ? 'positiva' : 'negativa'}: ha sempre lo stesso segno.`
    case 1: return `${n} è positivo ${a > 0 ? 'a destra' : 'a sinistra'} di ${scriviNumero(rad[0]!)} (si annulla in ${scriviNumero(rad[0]!)}).`
    default:
      if (rad.length === 2) return `${n} ha due radici (${scriviNumero(rad[0]!)} e ${scriviNumero(rad[1]!)}): ${a > 0 ? 'positivo fuori dalle radici, negativo in mezzo.' : 'negativo fuori dalle radici, positivo in mezzo.'}`
      if (rad.length === 1) return `${n} è un quadrato: ${a > 0 ? 'mai negativo' : 'mai positivo'}, si annulla solo in ${scriviNumero(rad[0]!)}.`
      return `${n} non ha radici (Δ < 0): ${a > 0 ? 'sempre positivo.' : 'sempre negativo.'}`
  }
}

/** Quello che serve per disegnare la disequazione: la frazione (o il prodotto), la finestra e i punti sull'asse. */
export function perGrafico(d: Disequazione): { x0: number; x1: number; marchi: { x: number; pieno: boolean; asintoto: boolean; etichetta: string }[]; tratti: { lo: number; hi: number }[] } {
  const N = d.punti.length
  let x0 = N ? d.punti[0]!.v - 2 : -5, x1 = N ? d.punti[N - 1]!.v + 2 : 5
  if (x1 - x0 < 4) { const c = (x0 + x1) / 2; x0 = c - 2; x1 = c + 2 }
  return {
    x0, x1,
    marchi: [
      ...d.punti.filter((p) => p.den).map((p) => ({ x: p.v, pieno: false, asintoto: true, etichetta: '' })),
      ...d.punti.map((p, j) => ({ x: p.v, pieno: d.incluso[j]!, asintoto: false, etichetta: scriviNumero(p.v) }))
    ],
    tratti: d.tratti.map((t) => ({ lo: t.lo, hi: t.hi }))
  }
}
