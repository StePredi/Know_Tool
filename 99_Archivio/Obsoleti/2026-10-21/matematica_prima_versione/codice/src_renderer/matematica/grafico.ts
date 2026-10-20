// Il grafico di una funzione, fatto in casa: campionamento, scala, tacche e tracciato con le interruzioni
// (poli, punti non definiti). Solo calcoli: il disegno è in Grafico.tsx.

export interface Campione { x: number; y: number }

/** Valori della funzione su n+1 punti equidistanti; dove non è definita (o non è finita) y = NaN. */
export function campiona(f: (x: number) => number, x0: number, x1: number, n = 400): Campione[] {
  const out: Campione[] = []
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    let y = NaN
    try { y = f(x) } catch { /* resta NaN */ }
    out.push({ x, y: Number.isFinite(y) ? y : NaN })
  }
  return out
}

/** Intervallo verticale da mostrare: ignora i valori enormi vicino ai poli, include sempre lo zero, ha un'altezza minima. */
export function limitiY(c: Campione[]): [number, number] {
  const ys = c.map((p) => p.y).filter(Number.isFinite)
  if (!ys.length) return [-1, 1]
  const ab = ys.map(Math.abs).sort((a, b) => a - b)
  const tetto = Math.max(2, (ab[Math.floor(ab.length * 0.8)] ?? 1) * 2)
  const ok = ys.filter((y) => Math.abs(y) <= tetto)
  let lo = Math.min(0, ...ok), hi = Math.max(0, ...ok)
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5 }
  const pad = (hi - lo) * 0.12
  return [lo - pad, hi + pad]
}

/** Tacche «tonde» (1, 2, 5 × 10^k) tra min e max, al massimo circa `n`. */
export function tacche(min: number, max: number, n = 8): number[] {
  const span = max - min
  if (!(span > 0)) return []
  const grezzo = span / n
  const pot = 10 ** Math.floor(Math.log10(grezzo))
  const passo = ([1, 2, 5, 10].find((m) => m * pot >= grezzo) ?? 10) * pot
  const dec = Math.max(0, -Math.floor(Math.log10(passo)))
  const out: number[] = []
  for (let k = Math.ceil(min / passo - 1e-9); k * passo <= max + 1e-9; k++) out.push(Number((k * passo).toFixed(dec)))
  return out
}

/** Numero come lo scrive la scuola: virgola decimale non serve nei grafici, meno vero («−») sì. */
export const etichettaTacca = (v: number): string => String(Number(v.toFixed(6))).replace('-', '−')

/**
 * Il «d» del tracciato SVG. Si interrompe dove la funzione non è definita o salta da un lato all'altro di un polo;
 * dove esce dal riquadro il tratto arriva fino al bordo (così vicino a un asintoto la curva non si ferma a metà).
 */
export function tracciato(c: Campione[], sx: (x: number) => number, sy: (y: number) => number, yMin: number, yMax: number): string {
  const alto = yMax - yMin
  const lato = (y: number): number => (y > yMax ? 1 : y < yMin ? -1 : 0)
  let d = ''
  let penna = false
  const vai = (x: number, y: number, linea: boolean): void => {
    d += (linea && penna ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1)
    penna = true
  }
  for (let i = 0; i < c.length; i++) {
    const p = c[i]!
    if (!Number.isFinite(p.y)) { penna = false; continue }
    const lp = lato(p.y)
    const q = i > 0 ? c[i - 1]! : null
    if (!q || !Number.isFinite(q.y)) {
      if (lp === 0) vai(p.x, p.y, false)
      else penna = false
      continue
    }
    const lq = lato(q.y)
    const sulBordo = (bordo: number): number => q.x + ((p.x - q.x) * (bordo - q.y)) / (p.y - q.y)
    if (lp === 0 && lq === 0) {
      const salto = Math.abs(p.y - q.y) > alto * 0.8 && Math.sign(p.y) !== Math.sign(q.y)
      vai(p.x, p.y, !salto)
    } else if (lp === 0) {
      const bordo = lq > 0 ? yMax : yMin
      vai(sulBordo(bordo), bordo, false)
      vai(p.x, p.y, true)
    } else if (lq === 0) {
      const bordo = lp > 0 ? yMax : yMin
      vai(sulBordo(bordo), bordo, true)
      penna = false
    } else penna = false
  }
  return d
}
