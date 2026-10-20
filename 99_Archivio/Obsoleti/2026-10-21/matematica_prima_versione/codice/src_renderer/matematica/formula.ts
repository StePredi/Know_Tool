// Formule scritte con la tastiera normale → una piccola struttura ad albero che la schermata sa disegnare bene.
//   x^2  x_1  sqrt(x+1)  (a)/(b)  1/2  pi  >=  <=  ->  !=  +-  inf  *
// Nessun LaTeX. Se qualcosa non si capisce, resta com'è scritto (mai un errore davanti a Ste).

export type Nodo =
  | { t: 'txt'; s: string }
  /** una lettera-variabile (in corsivo) */
  | { t: 'var'; s: string }
  /** segno con un po' d'aria attorno (=, ≤, + tra due termini…) */
  | { t: 'op'; s: string }
  /** nome di funzione (sin, ln, lim…): dritto, con un po' d'aria dopo */
  | { t: 'fun'; s: string }
  | { t: 'apice'; v: Nodo[] }
  | { t: 'pedice'; v: Nodo[] }
  | { t: 'frazione'; n: Nodo[]; d: Nodo[] }
  | { t: 'radice'; v: Nodo[] }

const PAROLE: Record<string, string> = { pi: 'π', inf: '∞', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', phi: 'φ', epsilon: 'ε' }
const FUNZIONI = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'exp', 'lim', 'min', 'max', 'mod', 'mcd', 'mcm', 'det', 'se', 'oppure', 'per'])
/** Segni di due caratteri, nell'ordine in cui si provano. */
const DOPPI: [string, string][] = [['>=', '≥'], ['<=', '≤'], ['!=', '≠'], ['=>', '⇒'], ['->', '→'], ['<-', '←'], ['+-', '±']]
const RELAZIONI = new Set(['=', '<', '>'])

class Lettore {
  i = 0
  constructor(private s: string) {}
  resto(): string { return this.s.slice(this.i) }
  fine(): boolean { return this.i >= this.s.length }

  /** Legge fino a `)` (non incluso) o alla fine. */
  seq(dentro: boolean): Nodo[] {
    const out: Nodo[] = []
    while (!this.fine()) {
      const c = this.s[this.i]!
      if (c === ')' && dentro) break
      this.uno(out)
    }
    return out
  }

  private operando(): Nodo[] {
    // dopo ^ : (gruppo) oppure [segno] numero/lettera
    if (this.s[this.i] === '(') {
      this.i++
      const v = this.seq(true)
      if (this.s[this.i] === ')') this.i++
      return v
    }
    const m = /^([+-]?)(\d+(?:[.,]\d+)?|[A-Za-z])/.exec(this.resto())
    if (!m) return []
    this.i += m[0].length
    const v: Nodo[] = []
    if (m[1]) v.push({ t: 'txt', s: m[1] === '-' ? '−' : '+' })
    v.push(/\d/.test(m[2]!) ? { t: 'txt', s: m[2]! } : { t: 'var', s: m[2]! })
    return v
  }

  private uno(out: Nodo[]): void {
    const r = this.resto()
    const c = r[0]!
    const prec = out[out.length - 1]

    if (c === '^' || c === '_') {
      this.i++
      let v: Nodo[]
      if (c === '^') v = this.operando()
      else if (this.s[this.i] === '(') v = this.operando()
      else {
        const m = /^[A-Za-z0-9]+/.exec(this.resto())
        v = m ? [{ t: 'txt', s: m[0] }] : []
        this.i += m ? m[0].length : 0
      }
      if (v.length) out.push(c === '^' ? { t: 'apice', v } : { t: 'pedice', v })
      else out.push({ t: 'txt', s: c })
      return
    }

    if (c === '(') {
      this.i++
      const inner = this.seq(true)
      const chiuso = this.s[this.i] === ')'
      if (chiuso) this.i++
      if (chiuso && this.s[this.i] === '/' && this.s[this.i + 1] === '(') {
        this.i += 2
        const den = this.seq(true)
        if (this.s[this.i] === ')') this.i++
        out.push({ t: 'frazione', n: inner, d: den })
        return
      }
      out.push({ t: 'txt', s: '(' }, ...inner)
      if (chiuso) out.push({ t: 'txt', s: ')' })
      return
    }

    const num = /^\d+(?:[.,]\d+)?/.exec(r)
    if (num) {
      const den = /^\/(\d+)(?![\d.,^_(])/.exec(r.slice(num[0].length))
      if (den) {
        this.i += num[0].length + den[0].length
        out.push({ t: 'frazione', n: [{ t: 'txt', s: num[0] }], d: [{ t: 'txt', s: den[1]! }] })
        return
      }
      this.i += num[0].length
      out.push({ t: 'txt', s: num[0] })
      return
    }

    const par = /^[A-Za-z]+/.exec(r)
    if (par) {
      const w = par[0]
      if (w === 'sqrt' && r[w.length] === '(') {
        this.i += w.length + 1
        const v = this.seq(true)
        if (this.s[this.i] === ')') this.i++
        out.push({ t: 'radice', v })
        return
      }
      this.i += w.length
      if (PAROLE[w]) out.push({ t: 'txt', s: PAROLE[w]! })
      else if (FUNZIONI.has(w)) out.push({ t: 'fun', s: w })
      else if (w === 'sqrt') out.push({ t: 'txt', s: '√' })
      else for (const ch of w) out.push({ t: 'var', s: ch })
      return
    }

    for (const [da, a] of DOPPI) {
      if (r.startsWith(da)) {
        this.i += da.length
        out.push({ t: 'op', s: a })
        return
      }
    }
    if (c === '*') { this.i++; out.push({ t: 'txt', s: '·' }); return }
    if (RELAZIONI.has(c)) { this.i++; out.push({ t: 'op', s: c }); return }
    if (c === '+' || c === '-') {
      this.i++
      const s = c === '-' ? '−' : '+'
      // binario (c'è qualcosa prima che non sia un'apertura o un altro segno) → un po' d'aria; unario → attaccato
      const binario = !!prec && !(prec.t === 'op') && !(prec.t === 'txt' && (prec.s === '(' || prec.s === '·'))
      out.push(binario ? { t: 'op', s } : { t: 'txt', s })
      return
    }
    if (/\s/.test(c)) {
      this.i += /^\s+/.exec(r)![0].length
      return // la spaziatura la decide la resa
    }
    this.i++
    out.push({ t: 'txt', s: c })
  }
}

/** Testo normale → nodi. Non lancia mai errori: ciò che non capisce lo lascia com'è. */
export function leggiFormula(testo: string): Nodo[] {
  const l = new Lettore(testo)
  const out: Nodo[] = []
  while (!l.fine()) {
    out.push(...l.seq(false))
    if (!l.fine()) { out.push({ t: 'txt', s: ')' }); l.i++ }
  }
  return out
}

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻', '+': '⁺' }
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** La formula su una riga sola, con i simboli veri: serve per l'etichetta di accessibilità, per copiare e per i test. */
export function inTesto(nodi: Nodo[]): string {
  const t = (n: Nodo): string => {
    switch (n.t) {
      case 'txt': case 'var': case 'fun': return n.s
      case 'op': return ' ' + n.s + ' '
      case 'apice': { const s = inTesto(n.v); return [...s].every((ch) => SUP[ch]) ? [...s].map((ch) => SUP[ch]).join('') : '^(' + s + ')' }
      case 'pedice': { const s = inTesto(n.v); return [...s].every((ch) => SUB[ch]) ? [...s].map((ch) => SUB[ch]).join('') : '_(' + s + ')' }
      case 'frazione': return '(' + inTesto(n.n) + ')/(' + inTesto(n.d) + ')'
      case 'radice': return '√(' + inTesto(n.v) + ')'
    }
  }
  // «lim x» non deve diventare «limx»: dopo una parola (2+ lettere) e prima di una lettera ci vuole uno spazio
  let out = ''
  for (const n of nodi) {
    const x = t(n)
    if (/[A-Za-z]{2}$/.test(out) && /^[A-Za-z]/.test(x)) out += ' '
    out += x
  }
  return out.replace(/\s+/g, ' ').trim()
}
