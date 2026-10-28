import { describe, expect, it } from 'vitest'
import { frazioni, leggiFormula, simboli, testoSemplice } from '../src/shared/notazione'

const tipi = (f: string): string => leggiFormula(f).map((n) => n.t).join(' ')

describe('notazione v2: scrittura', () => {
  it('a/b diventa una frazione con il blocco giusto a sinistra e a destra', () => {
    expect(frazioni('1/2')).toBe('frac(1|2)')
    expect(frazioni('2x/3')).toBe('frac(2x|3)')
    expect(frazioni('(x+1)/(x-1)')).toBe('frac(x+1|x-1)')
    expect(frazioni('sin(x)/x')).toBe('frac(sin(x)|x)')
    expect(frazioni('x^2/3')).toBe('frac(x^2|3)')
    expect(frazioni('e^(-x)/2')).toBe('frac(e^(-x)|2)')
    expect(frazioni('a/b/c')).toBe('frac(frac(a|b)|c)')
    expect(frazioni('y = a + b/c')).toBe('y = a + frac(b|c)')
    expect(frazioni('frac(a/b|c)')).toBe('frac(frac(a|b)|c)')
  })
  it('lo slash dentro un testo tra virgolette resta com\'è', () => {
    const n = leggiFormula('x "e/o" y')
    expect(n.find((x) => x.t === 'testo')).toEqual({ t: 'testo', v: 'e/o' })
    expect(n.some((x) => x.t === 'frac')).toBe(false)
  })
  it('lettere greche e simboli per nome', () => {
    expect(simboli('alpha + Delta')).toBe('α + Δ')
    expect(simboli('x in R')).toBe('x ∈ R')
    expect(simboli('A cup B cap C')).toBe('A ∪ B ∩ C')
    expect(simboli('a <=> b => c')).toBe('a ⇔ b ⇒ c')
    expect(simboli('30 deg')).toBe('30 °')
    expect(simboli('x ~= 2')).toBe('x ≈ 2')
  })
  it('il vecchio funziona come prima', () => {
    expect(tipi('x^2')).toBe('var sup')
    expect(tipi('frac(1|x)')).toBe('frac')
    expect(tipi('log_2(x)')).toBe('fn sub par')
  })
})

describe('notazione v2: nuovi elementi', () => {
  it('valore assoluto, vettore, radice con indice', () => {
    expect(leggiFormula('abs(x-1)')[0]).toMatchObject({ t: 'abs' })
    expect(leggiFormula('vec(v)')[0]).toMatchObject({ t: 'sopra', k: 'vec' })
    const r = leggiFormula('sqrt[3](x)')[0]
    expect(r).toMatchObject({ t: 'rad' })
    expect((r as { i?: unknown[] }).i).toEqual([{ t: 'txt', v: '3' }])
    expect((r as { c?: unknown[] }).c).toEqual([{ t: 'var', v: 'x' }])
  })
  it('limite, somma, integrale con i limiti', () => {
    expect(leggiFormula('lim(x->0) sin(x)/x')[0]).toMatchObject({ t: 'big', op: 'lim', lato: false })
    expect(leggiFormula('sum(k=1|n) k')[0]).toMatchObject({ t: 'big', op: '∑' })
    const i = leggiFormula('int(0|1) x^2 dx')[0]
    expect(i).toMatchObject({ t: 'big', op: '∫', lato: true })
    expect((i as { sopra?: unknown }).sopra).toBeTruthy()
  })
  it('lim senza freccia resta il vecchio «lim»', () => {
    expect(leggiFormula('lim(x)')[0]).toMatchObject({ t: 'fn', v: 'lim' })
  })
  it('sistema e matrice', () => {
    const s = leggiFormula('sys(2x + y = 1; x - y = 4)')[0] as { t: string; r: unknown[] }
    expect(s.t).toBe('sys')
    expect(s.r).toHaveLength(2)
    const m = leggiFormula('mat(1,2;3,4)')[0] as { t: string; r: unknown[][] }
    expect(m.t).toBe('mat')
    expect(m.r).toHaveLength(2)
    expect(m.r[0]).toHaveLength(2)
  })
  it('testo tra virgolette: parole intere, spazi inclusi', () => {
    expect(leggiFormula('f(x) = x^2 "se x>0"').some((x) => x.t === 'testo' && x.v === 'se x>0')).toBe(true)
  })
  it('evidenziare il pezzo che cambia', () => {
    expect(leggiFormula('{{2x}} + 1')[0]).toMatchObject({ t: 'ev' })
  })
  it('le parentesi si ingrandiscono se dentro c\'è qualcosa di alto', () => {
    expect(leggiFormula('(sum(k=1|n) k)')[0]).toMatchObject({ t: 'par', grande: true })
    expect(leggiFormula('(a/b)')[0]).toMatchObject({ t: 'par', grande: true })
    expect(leggiFormula('(a+b)')[0]).toMatchObject({ t: 'par', grande: false })
  })
  it('le lettere greche hanno aria come le altre (α + β)', () => {
    expect(tipi('alpha + beta')).toBe('var op var')
  })
  it('apice e pedice insieme stanno uno sotto l\'altro', () => {
    expect(leggiFormula('x_1^2')[1]).toMatchObject({ t: 'subsup' })
    expect(leggiFormula('x^2_1')[1]).toMatchObject({ t: 'subsup' })
    expect(leggiFormula('C_n^k')[1]).toMatchObject({ t: 'subsup' })
    expect(leggiFormula('x_(n+1)^2')[1]).toMatchObject({ t: 'subsup' })
    expect(leggiFormula('x_1 + y^2').map((n) => n.t)).toEqual(['var', 'sub', 'op', 'var', 'sup'])
  })
  it('il fattoriale resta attaccato nelle frazioni', () => {
    expect(frazioni('n!/(k!(n-k)!)')).toBe('frac(n!|k!(n-k)!)')
    expect(frazioni('x^k/k!')).toBe('frac(x^k|k!)')
  })
  it('le lettere greche si riconoscono anche con pedice e apice', () => {
    expect(simboli('alpha_1^2 + beta^2')).toBe('α_1^2 + β^2')
  })
  it('< e > sono operatori con aria', () => {
    expect(tipi('x > 0')).toBe('var op txt')
  })
  it('testo semplice per la ricerca', () => {
    expect(testoSemplice('`abs(x)` e `a/b`')).toBe('|x| e (a)/(b)')
    expect(testoSemplice('`sum(k=1|n) k`')).toContain('∑')
  })
})
