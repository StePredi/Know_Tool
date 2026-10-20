// Controllo numerico degli esempi di matematica: legge una formula nella notazione testuale
// (x^2*sin x, frac(1|2*sqrt(x)), log_2(x), (x-2)(x+2)…) e la calcola in qualche punto.
// Serve ai test: se un esempio svolto non torna, il test lo segnala. Non è un motore di algebra.

export type FunzioneX = (x: number) => number

type Tok = { k: 'n'; v: number } | { k: 'id'; v: string } | { k: 's'; v: string }

const FUNZIONI: Record<string, (a: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: (a) => 1 / Math.tan(a),
  arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  ln: Math.log, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs
}

function tokens(src: string): Tok[] {
  const t: Tok[] = []
  const re = /\s*(?:(\d+(?:[.,]\d+)?)|([A-Za-z]+)|([-+*/^_()|·−]))/gy
  let m: RegExpExecArray | null
  let fine = 0
  while ((m = re.exec(src))) {
    fine = re.lastIndex
    if (m[1]) t.push({ k: 'n', v: Number(m[1].replace(',', '.')) })
    else if (m[2]) t.push({ k: 'id', v: m[2] })
    else t.push({ k: 's', v: m[3] === '·' ? '*' : m[3] === '−' ? '-' : m[3]! })
  }
  if (src.slice(fine).trim()) throw new Error(`carattere non riconosciuto: «${src.slice(fine).trim()[0]}»`)
  return t
}

class Lettore {
  i = 0
  constructor(private t: Tok[]) {}
  get cur(): Tok | undefined { return this.t[this.i] }
  è(v: string): boolean { const c = this.cur; return !!c && c.k === 's' && c.v === v }
  aspetta(v: string): void {
    if (!this.è(v)) throw new Error(`mi aspettavo «${v}»`)
    this.i++
  }
  èNumero(): boolean { return this.cur?.k === 'n' }
  èId(v: string): boolean { const c = this.cur; return !!c && c.k === 'id' && c.v === v }
  iniziaFattore(): boolean {
    const c = this.cur
    return !!c && (c.k === 'n' || c.k === 'id' || (c.k === 's' && c.v === '('))
  }

  espressione(): FunzioneX {
    let a = this.termine()
    while (this.è('+') || this.è('-')) {
      const op = (this.cur as { v: string }).v
      this.i++
      const b = this.termine()
      const l = a
      a = op === '+' ? (x) => l(x) + b(x) : (x) => l(x) - b(x)
    }
    return a
  }
  termine(): FunzioneX {
    let a = this.unario()
    for (;;) {
      if (this.è('*')) { this.i++; const b = this.unario(); const l = a; a = (x) => l(x) * b(x) }
      else if (this.è('/')) { this.i++; const b = this.unario(); const l = a; a = (x) => l(x) / b(x) }
      else if (this.iniziaFattore()) { const b = this.unario(); const l = a; a = (x) => l(x) * b(x) }
      else return a
    }
  }
  unario(): FunzioneX {
    if (this.è('-')) { this.i++; const a = this.unario(); return (x) => -a(x) }
    if (this.è('+')) { this.i++; return this.unario() }
    return this.potenza()
  }
  potenza(): FunzioneX {
    const base = this.atomo()
    if (this.è('^')) {
      this.i++
      const e = this.esponente()
      return (x) => Math.pow(base(x), e(x))
    }
    return base
  }
  esponente(): FunzioneX {
    if (this.è('(')) { this.i++; const e = this.espressione(); this.aspetta(')'); return e }
    let segno = 1
    if (this.è('-')) { segno = -1; this.i++ } else if (this.è('+')) this.i++
    const c = this.cur
    if (!c || c.k === 's') throw new Error('esponente mancante')
    this.i++
    if (c.k === 'n') return () => segno * c.v
    const f = this.costante(c.v)
    return (x) => segno * f(x)
  }
  costante(nome: string): FunzioneX {
    if (nome === 'x') return (x) => x
    if (nome === 'e') return () => Math.E
    if (nome === 'pi') return () => Math.PI
    throw new Error(`simbolo sconosciuto: «${nome}»`)
  }
  atomo(): FunzioneX {
    const c = this.cur
    if (!c) throw new Error('formula incompleta')
    if (c.k === 'n') { this.i++; return () => c.v }
    if (c.k === 's') {
      if (c.v !== '(') throw new Error(`simbolo inatteso «${c.v}»`)
      this.i++
      const e = this.espressione()
      this.aspetta(')')
      return e
    }
    this.i++
    if (c.v === 'frac') {
      this.aspetta('(')
      const n = this.espressione()
      this.aspetta('|')
      const d = this.espressione()
      this.aspetta(')')
      return (x) => n(x) / d(x)
    }
    if (c.v === 'log' || FUNZIONI[c.v]) return this.funzione(c.v)
    return this.costante(c.v)
  }
  funzione(nome: string): FunzioneX {
    let base: FunzioneX | null = null
    if (nome === 'log' && this.è('_')) {
      this.i++
      base = this.è('(') ? (() => { this.i++; const b = this.espressione(); this.aspetta(')'); return b })() : this.atomo()
    }
    let pot: FunzioneX | null = null
    if (this.è('^')) { this.i++; pot = this.esponente() }
    let arg: FunzioneX
    if (this.è('(')) arg = this.atomo()
    else {
      const primoNumero = this.èNumero()
      arg = this.potenza()
      // «sin 2x»: un numero seguito da x è un unico argomento
      while (primoNumero && this.èId('x')) { const b = this.potenza(); const l = arg; arg = (x) => l(x) * b(x) }
    }
    const f = nome === 'log' ? (a: number, x: number) => (base ? Math.log(a) / Math.log(base(x)) : Math.log10(a)) : (a: number) => FUNZIONI[nome]!(a)
    const r: FunzioneX = (x) => (f as (a: number, x: number) => number)(arg(x), x)
    return pot ? (x) => Math.pow(r(x), pot!(x)) : r
  }
}

/** Legge una formula in x. Lancia un errore con un messaggio chiaro se non la capisce. */
export function compila(src: string): FunzioneX {
  const l = new Lettore(tokens(src))
  const f = l.espressione()
  if (l.cur) throw new Error(`non capisco da «${JSON.stringify(l.cur.v)}» in poi`)
  return f
}

const PUNTI = [0.37, 0.83, 1.21, 1.77, 2.43, 3.1]
const vicini = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b))

/**
 * Controlla un esempio svolto. Restituisce null se torna, altrimenti il motivo.
 * - derivata: «ris» è la derivata di «da» (differenza centrale in sei punti)
 * - scomposizione: «ris» ha gli stessi valori di «da»
 */
export function verificaEsempio(tipo: 'derivata' | 'scomposizione', da: string, ris: string): string | null {
  let f: FunzioneX
  let g: FunzioneX
  try {
    f = compila(da)
    g = compila(ris)
  } catch (e) {
    return `non riesco a leggere la formula: ${(e as Error).message}`
  }
  let validi = 0
  for (const x of PUNTI) {
    const h = 1e-5
    const atteso = tipo === 'derivata' ? (f(x + h) - f(x - h)) / (2 * h) : f(x)
    const dato = g(x)
    if (!Number.isFinite(atteso) || !Number.isFinite(dato)) continue
    validi++
    if (!vicini(atteso, dato)) return `in x = ${x} viene ${dato.toFixed(5)} ma dovrebbe venire ${atteso.toFixed(5)}`
  }
  return validi >= 3 ? null : 'la formula non è calcolabile in abbastanza punti'
}
