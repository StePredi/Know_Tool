// Notazione testuale delle formule di matematica (la stessa del demo):
//   ^ e _ = apice e pedice (un solo carattere/numero, oppure tra parentesi), frac(a|b), sqrt(x),
//   -> >= <= != +- inf pi * << sono sostituiti con i simboli veri.
// Nei testi le formule stanno tra apici inversi: `x^2 + 1`.
// Versione 2 (aggiunte, il vecchio resta valido):
//   a/b = frazione (anche 2x/3, (x+1)/(x-1), sin(x)/x);  alpha beta delta Delta sigma… = lettere greche
//   abs(x) = |x|   sqrt[3](x) = radice con indice   vec(v) bar(x) hat(x) = freccia, linea, cappello
//   lim(x->0)  sum(k=1|n)  prod(k=1|n)  int(0|1) = operatori con limiti   sys(a; b)  mat(a,b; c,d) = sistema e matrice
//   => <=> ~= in notin cup cap subset forall exists deg ... = simboli      "se x>0" = testo diritto
//   {{ ... }} = evidenzia il pezzo che cambia
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
  /** pedice e apice insieme, uno sotto l'altro (x_i^2, C_n^k) */
  | { t: 'subsup'; sub: NodoF[]; sup: NodoF[] }
  | { t: 'frac'; n: NodoF[]; d: NodoF[] }
  | { t: 'rad'; c: NodoF[]; i?: NodoF[] }
  /** testo diritto tra virgolette: "se x>0" */
  | { t: 'testo'; v: string }
  /** valore assoluto */
  | { t: 'abs'; c: NodoF[] }
  /** freccia (vettore), linea (segmento, media) o cappello sopra */
  | { t: 'sopra'; k: 'vec' | 'bar' | 'hat'; c: NodoF[] }
  /** sommatoria, produttoria, integrale, limite; lato = limiti accanto (integrale) invece che sopra/sotto */
  | { t: 'big'; op: string; sotto?: NodoF[]; sopra?: NodoF[]; lato: boolean }
  /** sistema (graffa a sinistra, righe allineate) */
  | { t: 'sys'; r: NodoF[][] }
  /** matrice */
  | { t: 'mat'; r: NodoF[][][] }
  /** pezzo evidenziato */
  | { t: 'ev'; c: NodoF[] }

const GRECHE: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Phi: 'Φ', Omega: 'Ω',
}
const PAROLE_SIMBOLO: Record<string, string> = { in: '∈', notin: '∉', cup: '∪', cap: '∩', subset: '⊂', forall: '∀', exists: '∃', deg: '°', inf: '∞', pi: 'π' }

/** Sostituisce le sequenze di tasti con i simboli veri. */
export function simboli(s: string): string {
  return s
    .replace(/<=>/g, '⇔').replace(/=>/g, '⇒').replace(/~=/g, '≈').replace(/\.\.\./g, '…')
    .replace(/->/g, '→').replace(/>=/g, '≥').replace(/<=/g, '≤').replace(/!=/g, '≠').replace(/\+-/g, '±').replace(/<</g, '≪')
    .replace(/(?<![A-Za-z])[A-Za-z]+(?![A-Za-z])/g, (w) => GRECHE[w] ?? PAROLE_SIMBOLO[w] ?? w)
    .replace(/\*/g, '·').replace(/-/g, '−').replace(/'/g, '′')
}

const Q = '\u0001'

/** Mette da parte i testi tra virgolette (non vanno toccati) e li sostituisce con un segnaposto. */
function proteggi(s: string): { s: string; testi: string[] } {
  const testi: string[] = []
  const out = s.replace(/"([^"]*)"/g, (_m, t: string) => {
    testi.push(t)
    return Q + (testi.length - 1) + Q
  })
  return { s: out, testi }
}

/** Fine (esclusa) di un blocco «lettere/numeri/gruppi tra parentesi» che comincia in i. */
function atomoAvanti(s: string, i: number): number {
  let j = i
  if (s[j] === '−') j++
  while (j < s.length) {
    const c = s[j]!
    if (c === '(') j = chiudi(s, j) + 1
    else if (/[A-Za-z0-9.′π∞!]/.test(c) || c === Q) {
      if (c === Q) j = s.indexOf(Q, j + 1) + 1
      else j++
    } else if (c === '^' || c === '_') {
      j++
      if (s[j] === '(') j = chiudi(s, j) + 1
      else {
        if (s[j] === '−' || s[j] === '+') j++
        const m = /^(\d+|[A-Za-z])/.exec(s.slice(j))
        j += m ? m[0].length : 0
      }
    } else break
  }
  return j
}

/** Inizio di un blocco che finisce prima di fine. */
function atomoIndietro(s: string, fine: number): number {
  let j = fine - 1
  while (j >= 0) {
    const c = s[j]!
    if (c === ')') {
      let d = 0
      let k = j
      for (; k >= 0; k--) {
        if (s[k] === ')') d++
        else if (s[k] === '(') {
          d--
          if (d === 0) break
        }
      }
      j = k - 1
    } else if (/[A-Za-z0-9.′π∞!^_]/.test(c)) j--
    else break
  }
  return j + 1
}

const senzaParentesi = (a: string): string => (a.startsWith('(') && a.endsWith(')') && chiudi(a, 0) === a.length - 1 ? a.slice(1, -1) : a)

/** a/b diventa frac(a|b): a sinistra e a destra va il blocco attaccato (2x/3, (x+1)/(x−1), sin(x)/x). */
export function frazioni(s: string): string {
  let out = s
  for (let guardia = 0; guardia < 200; guardia++) {
    const i = out.indexOf('/')
    if (i < 0) break
    const a = atomoIndietro(out, i)
    const b = atomoAvanti(out, i + 1)
    if (a >= i || b <= i + 1) {
      out = out.slice(0, i) + '\u0002' + out.slice(i + 1)
      continue
    }
    out = out.slice(0, a) + 'frac(' + senzaParentesi(out.slice(a, i)) + '|' + senzaParentesi(out.slice(i + 1, b)) + ')' + out.slice(b)
  }
  return out.replace(/\u0002/g, '/')
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

/** Divide in tutti i punti dove c'è ch fuori dalle parentesi. */
function dividiTutti(s: string, ch: string): string[] {
  const out: string[] = []
  let d = 0
  let da = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(' || c === '[') d++
    else if (c === ')' || c === ']') d--
    else if (c === ch && d === 0) {
      out.push(s.slice(da, i))
      da = i + 1
    }
  }
  out.push(s.slice(da))
  return out
}

let TESTI: string[] = []
const OPERATORI = '=→≥≤≠<>≈⇒⇔∈∉⊂∪∩≪'
const GRANDI: Record<string, { op: string; lato: boolean }> = { sum: { op: '∑', lato: false }, prod: { op: '∏', lato: false }, int: { op: '∫', lato: true }, lim: { op: 'lim', lato: false } }
const alta = (n: NodoF[]): boolean => n.some((x) => x.t === 'frac' || x.t === 'mat' || x.t === 'sys' || x.t === 'big' || (x.t === 'rad' && alta(x.c)) || (x.t === 'par' && x.grande))

const FUNZIONI_NOME = new Set(['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'lim', 'max', 'min'])
const èLettera = (c: string | undefined): boolean => !!c && /[A-Za-zπ∞0-9′)\]\u0370-\u03ff]/.test(c)

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
    if (c === Q) {
      const j = s.indexOf(Q, i + 1)
      metti({ t: 'testo', v: TESTI[Number(s.slice(i + 1, j))] ?? '' }, 'a')
      i = j + 1
      continue
    }
    if (s.startsWith('{{', i)) {
      const j = s.indexOf('}}', i + 2)
      if (j > 0) {
        metti({ t: 'ev', c: leggi(s.slice(i + 2, j)) }, ')')
        i = j + 2
        continue
      }
    }
    if (/[A-Za-z]/.test(c) && !/[A-Za-z]/.test(s[i - 1] ?? '')) {
      const w = /^[A-Za-z]+/.exec(s.slice(i))![0]
      const dopo = s[i + w.length]
      if (dopo === '(') {
        const j = chiudi(s, i + w.length)
        const dentro = s.slice(i + w.length + 1, j)
        if (w === 'abs') {
          metti({ t: 'abs', c: leggi(dentro) }, ')')
          i = j + 1
          continue
        }
        if (w === 'vec' || w === 'bar' || w === 'hat') {
          metti({ t: 'sopra', k: w, c: leggi(dentro) }, ')')
          i = j + 1
          continue
        }
        if (w === 'sys' || w === 'cases') {
          metti({ t: 'sys', r: dividiTutti(dentro, ';').map(leggi) }, ')')
          i = j + 1
          continue
        }
        if (w === 'mat') {
          metti({ t: 'mat', r: dividiTutti(dentro, ';').map((r) => dividiTutti(r, ',').map(leggi)) }, ')')
          i = j + 1
          continue
        }
        const g = GRANDI[w]
        if (g && (w !== 'lim' || dentro.includes('→'))) {
          const [sotto, sopra] = dividi(dentro, '|')
          metti({ t: 'big', op: g.op, sotto: sotto ? leggi(sotto) : undefined, sopra: sopra ? leggi(sopra) : undefined, lato: g.lato }, 'f')
          out.push({ t: 'sp' })
          i = j + 1
          continue
        }
      }
      if (w === 'sqrt' && dopo === '[') {
        const k = s.indexOf(']', i + 5)
        if (k > 0 && s[k + 1] === '(') {
          const j = chiudi(s, k + 1)
          metti({ t: 'rad', i: leggi(s.slice(i + 5, k)), c: leggi(s.slice(k + 2, j)) }, ')')
          i = j + 1
          continue
        }
      }
      if (dopo !== '(' && GRANDI[w] && w !== 'lim') {
        metti({ t: 'big', op: GRANDI[w]!.op, lato: GRANDI[w]!.lato }, 'f')
        out.push({ t: 'sp' })
        i += w.length
        continue
      }
    }
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
      const dentro = leggi(inner)
      const prima = buf ? undefined : out[out.length - 1]
      if (prima && c === '^' && prima.t === 'sub') out[out.length - 1] = { t: 'subsup', sub: prima.c, sup: dentro }
      else if (prima && c === '_' && prima.t === 'sup') out[out.length - 1] = { t: 'subsup', sub: dentro, sup: prima.c }
      else metti({ t: c === '^' ? 'sup' : 'sub', c: dentro }, ')')
      i += 1 + len
      continue
    }
    if (c === '(') {
      const j = chiudi(s, i)
      if (s[j] === ')') {
        const inner = s.slice(i + 1, j)
        const dentro = leggi(inner)
        metti({ t: 'par', c: dentro, grande: alta(dentro) }, ')')
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
    if (/[α-ωΑ-Ω]/.test(c) && c !== 'π') {
      metti(/[α-ω]/.test(c) ? { t: 'var', v: c } : { t: 'txt', v: c }, 'a')
      i++
      continue
    }
    if (c === '∀' || c === '∃') {
      if (ultimo) out.push({ t: 'sp' })
      metti({ t: 'txt', v: c }, c)
      out.push({ t: 'sp' })
      i++
      continue
    }
    if (c === '′') {
      metti({ t: 'pr' }, '′')
      i++
      continue
    }
    if (OPERATORI.includes(c)) {
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
  const p = proteggi(s)
  TESTI = p.testi
  return leggi(frazioni(simboli(p.s)))
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
  return n.map((x) => (x.t === 'txt' || x.t === 'var' || x.t === 'fn' || x.t === 'op' || x.t === 'un' ? x.v : x.t === 'sp' ? ' ' : x.t === 'pr' ? '′' : x.t === 'par' ? '(' + piatto(x.c) + ')' : x.t === 'sup' ? '^' + piatto(x.c) : x.t === 'sub' ? '_' + piatto(x.c) : x.t === 'subsup' ? '_' + piatto(x.sub) + '^' + piatto(x.sup) : x.t === 'rad' ? (x.i ? 'rad' + piatto(x.i) + '(' : '√(') + piatto(x.c) + ')' : x.t === 'testo' ? x.v : x.t === 'abs' ? '|' + piatto(x.c) + '|' : x.t === 'sopra' ? piatto(x.c) : x.t === 'ev' ? piatto(x.c) : x.t === 'big' ? x.op + (x.sotto ? '_' + piatto(x.sotto) : '') + (x.sopra ? '^' + piatto(x.sopra) : '') : x.t === 'sys' ? '{' + x.r.map(piatto).join('; ') + '}' : x.t === 'mat' ? '[' + x.r.map((r) => r.map(piatto).join(', ')).join('; ') + ']' : '(' + piatto(x.n) + ')/(' + piatto(x.d) + ')')).join('')
}

/** Testo semplice (per la ricerca): formule senza simboli di formattazione. */
export function testoSemplice(s: string): string {
  return pezziTesto(s).map((p) => (p.formula ? piatto(leggiFormula(p.v)) : p.v)).join('')
}
