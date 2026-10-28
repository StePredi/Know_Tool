import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import katex from 'katex'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { aLatex } from '../src/shared/latex'
import { pezziTesto } from '../src/shared/notazione'

const prova = (f: string): string => katex.renderToString(aLatex(f), { throwOnError: true, strict: 'ignore', trust: (c) => c.command === '\\htmlClass' })

const FORMULE = [
  'x_1^2 + x_2^2', 'a_n = a_1 + (n-1)d', 'e^(x^2)', 'e^(-x^2/2)', '2^(n+1)/3^n', '(x^2 + 1)^2/(x^3 - 1)^2', 'sqrt(x^2 + y^2)', 'abs(x^2 - 1)^2',
  "vec(v_1) + vec(v_2)", "bar(AB)^2", "f'(x)^2", "g''(x)", "(f/g)' = (f'g - fg')/g^2", "(f*g)' = f'*g + f*g'", "f'^2",
  'sum(k=1|n) k^2 = n(n+1)(2n+1)/6', 'sum(i=1|n) x_i^2', 'prod(k=1|n) (1 + 1/k)^2', 'int(0|1) x^2 dx', 'int(-inf|inf) e^(-x^2/2) dx',
  'lim(x->0) (1 + x)^(1/x) = e', 'lim(x->0^+) 1/x = +inf', 'lim_(h->0) (f(x+h) - f(x))/h', 'log_2(x^2)', 'log_(10)(x)^2', 'x_(n+1)^2', 'C_n^k = n!/(k!(n-k)!)',
  'sin^2(x) + cos^2(x) = 1', 'frac(1|frac(1|frac(1|x^2)))', '(1/x^2)^3', 'sqrt[3](x^2)', 'sqrt[n](a_1^2)', 'mat(x^2,y_1;z^3,w)', 'sys(x^2 + y^2 = 1; x_1 - y_1 = 0)',
  '{{x^2}} + {{y_1}}', 'x^2 "se" x_1 > 0', 'f(x) = sys(x^2 "se" x > 0; 0 "se" x <= 0)', 'alpha_1^2 + beta^2', 'Delta = b^2 - 4ac', 'x in R', 'A cup B cap C', 'A <=> B',
  'sin 30 deg = 1/2', 'forall x exists y', 'x = (-b +- sqrt(b^2 - 4ac))/(2a)', '"100%" "e/o" "a_b"', '-x + 3', '+-1', 'x^-1', 'e^-x', '2^10', 'x>=0 and x<=5', 'pi*r^2', "d/dx (x^3) = 3x^2",
]

describe('da notazione a KaTeX', () => {
  it.each(FORMULE)('si disegna senza errori: %s', (f) => {
    expect(() => prova(f)).not.toThrow()
  })
  it('lettere f, g, h con la loro classe di colore', () => {
    expect(prova('f(x)')).toContain('mt-f')
  })
  it('il pezzo evidenziato ha la classe', () => {
    expect(prova('{{2x}}')).toContain('mt-ev')
  })
  it('i caratteri speciali nel testo sono protetti', () => {
    expect(aLatex('"100% sicuro"')).toContain('100\\% sicuro')
  })
  it('il testo tra virgolette ha spazi ai lati e nessun punto e virgola in vista', () => {
    expect(aLatex('x "con" y')).toContain('\\;\\text{con}\\;')
    expect(katex.renderToString(aLatex('x "con" y'), { output: 'html' }).replace(/<[^>]+>/g, '')).not.toContain(';')
  })
  it('limiti, somme e integrali', () => {
    expect(aLatex('lim(x->0) x')).toContain('\\lim_{x\\to 0}')
    expect(aLatex('int(0|1) x dx')).toContain('\\int_{0}^{1}')
  })
  it('apice e pedice insieme', () => {
    expect(aLatex('x_1^2')).toContain('_{1}^{2}')
  })
})

const radice = resolve(__dirname, '../../01_Argomenti/Matematica')
function files(d: string): string[] {
  return readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : n.endsWith('.yaml') ? [join(d, n)] : []))
}
function raccogli(v: unknown, chiave: string, out: string[]): void {
  if (typeof v === 'string') {
    if (['formula', 'comando', 'da', 'ris'].includes(chiave)) out.push(v)
    else for (const p of pezziTesto(v)) if (p.formula) out.push(p.v)
  } else if (Array.isArray(v)) v.forEach((x) => raccogli(x, chiave, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) raccogli(x, k, out)
}

describe.skipIf(!existsSync(radice))('le formule scritte nei contenuti di matematica si disegnano', () => {
  const tutte: string[] = []
  for (const f of files(radice)) raccogli(parse(readFileSync(f, 'utf-8')), '', tutte)
  it('ce ne sono e nessuna dà errore', () => {
    expect(tutte.length).toBeGreaterThan(0)
    for (const f of tutte) expect(() => prova(f), f).not.toThrow()
  })
})
