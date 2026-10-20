// Notazione testuale delle formule di matematica (la stessa del demo):
//   ^ e _ = apice e pedice (un solo carattere/numero, oppure tra parentesi), frac(a|b), sqrt(x),
//   -> >= <= != +- inf pi * << sono sostituiti con i simboli veri.
// Nei testi le formule stanno tra apici inversi: `x^2 + 1`.
// Qui solo la lettura (albero di nodi): il disegno sta in renderer/situazioni/Formula.tsx.

export type NodoF =
  | { t: 'txt'; v: string }
  /** lettera-variabile (corsivo); f, g, h hanno un colore proprio */
  | { t: 'var'; v: string }
  /** nome di funzione (diritto): sin, ln… */
  | { t: 'fn'; v: string }
  /** operatore binario con un po' d'aria attorno: = + − ± → ≥ ≤ ≠ e il punto di moltiplicazione */
  | { t: 'op'; v: string }
  /** segno davanti (unario), senza aria */
  | { t: 'un'; v: string }
  /** spazio sottile: moltiplicazione sottintesa tra lettere */
  | { t: 'sp' }
  /** apice della derivata: f′ */
  | { t: 'pr' }
  /** parentesi tonde; grande = contiene una frazione e si ingrandisce */
  | { t: 'par'; c: NodoF[]; grande: boolean }
  | { t: 'sup'; c: NodoF[] }
  | { t: 'sub'; c: NodoF[] }
  | { t: 'frac'; n: NodoF[]; d: NodoF[] }
  | { t: 'rad'; c: NodoF[] }

/** Sostituisce le sequenze di tasti con i simboli veri. */
export function simboli(s: string): string {
  return s
    .replace(/->/g, '→').replace(/>=/g, '≥').replace(/<=/g, '≤').replace(/!=/g, '≠').replace(/\+-/g, '±').replace(/<</g, '≪')
    .replace(/\binf\b/g, '∞').replace(/\bpi\b/g, 'π').replace(/\*/g, '·').replace(/-/g, '−').replace(/'/g, '′')
}

function chiudi(s: string, i: number): number {
  let d = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '(') d++
    else if (s[j] === ')') {
      d--
      if (d === 0) return j
    }
  }
  return s.length - 1
}

function dividi(s: string, ch: string): [string, string] {
  let d = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') d++
    else if (c === ')') d--
    else if (c === ch && d === 0) return [s.slice(0, i), s.slice(i + 1)]
  }
  return [s, '']
}

const FUNZIONI_NOME = new Set(['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'lim', 'max', 'min'])
const èLettera = (c: string | undefined): boolean => !!c && /[A-Za-zπ∞0-9′)\]]/.test(c)

function leggi(s: string): NodoF[] {
  const out: NodoF[] = []
  let buf = ''
  let ultimo = ''
  const spingi = (): void => {
    if (buf) out.push({ t: 'txt', v: buf })
    buf = ''
  }
  const metti = (n: NodoF, u: string): void => {
    spingi()
    out.push(n)
    ultimo = u
  }
  let i = 0
  while (i < s.length) {
    const c = s[i]!
    if (s.startsWith('frac(', i)) {
      const j = chiudi(s, i + 4)
      const [n, d] = dividi(s.slice(i + 5, j), '|')
      metti({ t: 'frac', n: leggi(n), d: leggi(d) }, ')')
      i = j + 1
      continue
    }
    if (s.startsWith('sqrt(', i)) {
      const j = chiudi(s, i + 4)
      metti({ t: 'rad', c: leggi(s.slice(i + 5, j)) }, ')')
      i = j + 1
      continue
    }
    if (c === '^' || c === '_') {
      const rest = s.slice(i + 1)
      let inner = ''
      let len = 0
      if (rest[0] === '(') {
        const j = chiudi(s, i + 1)
        inner = s.slice(i + 2, j)
        len = j - i
      } else {
        const m = /^([+−]?(\d+|[A-Za-z])|[+−])/.exec(rest)
        if (m) {
          inner = m[0]
          len = m[0].length
        } else {
          buf += c
          i++
          continue
        }
      }
      metti({ t: c === '^' ? 'sup' : 'sub', c: leggi(inner) }, ')')
      i += 1 + len
      continue
    }
    if (c === '(') {
      const j = chiudi(s, i)
      if (s[j] === ')') {
        const inner = s.slice(i + 1, j)
        metti({ t: 'par', c: leggi(inner), grande: inner.includes('frac(') }, ')')
        i = j + 1
        continue
      }
    }
    if (/[A-Za-z]/.test(c)) {
      const w = /^[A-Za-z]+/.exec(s.slice(i))![0]
      if (FUNZIONI_NOME.has(w)) {
        metti({ t: 'fn', v: w }, 'f')
        const dopo = s[i + w.length]
        if (dopo !== '(' && dopo !== '_' && dopo !== '^') out.push({ t: 'sp' })
      } else for (const ch of w) metti({ t: 'var', v: ch }, 'a')
      i += w.length
      continue
    }
    if (c === '′') {
      metti({ t: 'pr' }, '′')
      i++
      continue
    }
    if ('=→≥≤≠'.includes(c)) {
      metti({ t: 'op', v: c }, '=')
      i++
      continue
    }
    if (c === '+' || c === '−' || c === '±') {
      metti(èLettera(ultimo) ? { t: 'op', v: c } : { t: 'un', v: c }, c)
      i++
      continue
    }
    if (c === '·') {
      const prossimo = s[i + 1]
      const tra = èLettera(ultimo) && !/[0-9]/.test(ultimo) && /[A-Za-z(′]/.test(prossimo ?? '')
      metti(tra ? { t: 'sp' } : { t: 'op', v: c }, c)
      i++
      continue
    }
    if (c === ' ') {
      if (ultimo === ',') buf += ' '
      i++
      continue
    }
    buf += c
    ultimo = c
    i++
  }
  spingi()
  return out
}

/** Legge una formula (senza apici inversi) in un albero. */
export function leggiFormula(s: string): NodoF[] {
  return leggi(simboli(s))
}

export type PezzoTesto = { formula: boolean; v: string }

/** Divide un testo in parti normali e formule (tra apici inversi). */
export function pezziTesto(s: string): PezzoTesto[] {
  const out: PezzoTesto[] = []
  let ultimo = 0
  for (const m of s.matchAll(/`([^`]+)`/g)) {
    if (m.index! > ultimo) out.push({ formula: false, v: s.slice(ultimo, m.index) })
    out.push({ formula: true, v: m[1]! })
    ultimo = m.index! + m[0].length
  }
  if (ultimo < s.length) out.push({ formula: false, v: s.slice(ultimo) })
  return out
}

function piatto(n: NodoF[]): string {
  return n.map((x) => (x.t === 'txt' || x.t === 'var' || x.t === 'fn' || x.t === 'op' || x.t === 'un' ? x.v : x.t === 'sp' ? ' ' : x.t === 'pr' ? '′' : x.t === 'par' ? '(' + piatto(x.c) + ')' : x.t === 'sup' ? '^' + piatto(x.c) : x.t === 'sub' ? '_' + piatto(x.c) : x.t === 'rad' ? '√(' + piatto(x.c) + ')' : '(' + piatto(x.n) + ')/(' + piatto(x.d) + ')')).join('')
}

/** Testo semplice (per la ricerca): formule senza simboli di formattazione. */
export function testoSemplice(s: string): string {
  return pezziTesto(s).map((p) => (p.formula ? piatto(leggiFormula(p.v)) : p.v)).join('')
}
