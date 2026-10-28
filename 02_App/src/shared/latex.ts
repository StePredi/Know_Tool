// Dalla notazione di Know_Tool (albero di nodi di notazione.ts) a LaTeX, per KaTeX.
// La notazione che si scrive nelle schede non cambia; KaTeX si occupa di misure, font e spaziature
// (apici, pedici, frazioni, radici…), che così non dipendono dai font del computer.
import { leggiFormula, type NodoF } from './notazione'

const GRECHE: Record<string, string> = {
  α: '\\alpha', β: '\\beta', γ: '\\gamma', δ: '\\delta', ε: '\\varepsilon', θ: '\\theta', λ: '\\lambda', μ: '\\mu', ρ: '\\rho', σ: '\\sigma', τ: '\\tau', φ: '\\varphi', ω: '\\omega',
  Γ: '\\Gamma', Δ: '\\Delta', Θ: '\\Theta', Λ: '\\Lambda', Σ: '\\Sigma', Φ: '\\Phi', Ω: '\\Omega', π: '\\pi', '∞': '\\infty',
}
const OPERATORI: Record<string, string> = {
  '=': '=', '+': '+', '−': '-', '±': '\\pm', '·': '\\cdot', '→': '\\to', '≥': '\\ge', '≤': '\\le', '≠': '\\ne', '<': '<', '>': '>', '≈': '\\approx',
  '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow', '∈': '\\in', '∉': '\\notin', '⊂': '\\subset', '∪': '\\cup', '∩': '\\cap', '≪': '\\ll',
}
const SPECIALI: Record<string, string> = {
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '%': '\\%', $: '\\$', '#': '\\#', '&': '\\&', _: '\\_', '^': '\\^{}', '~': '\\~{}',
}
const FUNZIONI_LATEX = new Set(['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'lim', 'max', 'min'])
const BIG: Record<string, string> = { '∑': '\\sum', '∏': '\\prod', '∫': '\\int', lim: '\\lim' }

/** Testo normale (anche dentro virgolette) con i caratteri speciali di LaTeX protetti. */
const protetto = (v: string): string => [...v].map((c) => SPECIALI[c] ?? c).join('')

function simbolo(v: string): string {
  let out = ''
  for (const c of v) {
    if (GRECHE[c]) out += GRECHE[c] + ' '
    else if (c === '°') out += '^{\\circ}'
    else if (c === '…') out += '\\ldots '
    else if (c === '∀') out += '\\forall '
    else if (c === '∃') out += '\\exists '
    else out += SPECIALI[c] ?? c
  }
  return out
}

function righe(n: NodoF[]): string {
  return lat(n)
}

function lat(nodi: NodoF[]): string {
  let out = ''
  let prima: NodoF | undefined
  const base = (): string => (out === '' || prima?.t === 'op' || prima?.t === 'un' || prima?.t === 'sp' ? '{}' : prima?.t === 'pr' ? '{}' : '')
  for (const x of nodi) {
    switch (x.t) {
      case 'txt':
        out += simbolo(x.v)
        break
      case 'var':
        out += 'fgh'.includes(x.v) ? '\\htmlClass{mt-' + x.v + '}{' + x.v + '}' : GRECHE[x.v] ? GRECHE[x.v] + ' ' : x.v
        break
      case 'fn':
        out += FUNZIONI_LATEX.has(x.v) && ['lim', 'max', 'min'].includes(x.v) ? '\\' + x.v + ' ' : '\\operatorname{' + x.v + '}'
        break
      case 'op':
        out += (OPERATORI[x.v] ?? x.v) + ' '
        break
      case 'un':
        out += '{' + (OPERATORI[x.v] ?? x.v) + '}'
        break
      case 'sp':
        if (prima?.t !== 'fn') out += '\\,'
        break
      case 'pr':
        out += "'"
        break
      case 'par':
        out += x.grande ? '\\left(' + lat(x.c) + '\\right)' : '(' + lat(x.c) + ')'
        break
      case 'sup':
        out += base() + '^{' + lat(x.c) + '}'
        break
      case 'sub':
        out += base() + '_{' + lat(x.c) + '}'
        break
      case 'subsup':
        out += base() + '_{' + lat(x.sub) + '}^{' + lat(x.sup) + '}'
        break
      case 'frac':
        out += '\\frac{' + lat(x.n) + '}{' + lat(x.d) + '}'
        break
      case 'rad':
        out += '\\sqrt' + (x.i ? '[' + lat(x.i) + ']' : '') + '{' + lat(x.c) + '}'
        break
      case 'testo':
        out += '\\;\\text{' + protetto(x.v) + '}\\;'
        break
      case 'abs':
        out += '\\left|' + lat(x.c) + '\\right|'
        break
      case 'sopra':
        out += (x.k === 'vec' ? '\\vec{' : x.k === 'bar' ? '\\overline{' : '\\hat{') + lat(x.c) + '}'
        break
      case 'big':
        out += (BIG[x.op] ?? x.op) + (x.sotto ? '_{' + lat(x.sotto) + '}' : '') + (x.sopra ? '^{' + lat(x.sopra) + '}' : '') + ' '
        break
      case 'sys':
        out += '\\left\\{\\begin{array}{l}' + x.r.map(righe).join('\\\\') + '\\end{array}\\right.'
        break
      case 'mat':
        out += '\\begin{pmatrix}' + x.r.map((r) => r.map(lat).join('&')).join('\\\\') + '\\end{pmatrix}'
        break
      case 'ev':
        out += '\\htmlClass{mt-ev}{' + lat(x.c) + '}'
        break
    }
    prima = x
  }
  return out
}

/** Formula (senza apici inversi) in LaTeX, pronta per KaTeX in stile «display» (frazioni grandi, limiti sotto). */
export function aLatex(s: string): string {
  return '\\displaystyle ' + lat(leggiFormula(s))
}
