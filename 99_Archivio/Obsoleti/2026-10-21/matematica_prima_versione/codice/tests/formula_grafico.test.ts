// Formule scritte col testo normale e grafico: solo calcoli, nessun file.
import { describe, expect, it } from 'vitest'
import { leggiDisequazione, perGrafico } from '../src/renderer/matematica/disequazioni'
import { leggiFormula, inTesto, type Nodo } from '../src/renderer/matematica/formula'
import { campiona, etichettaTacca, limitiY, tacche, tracciato } from '../src/renderer/matematica/grafico'

const testo = (s: string): string => inTesto(leggiFormula(s))
const tipi = (n: Nodo[]): string[] => n.map((x) => x.t)

describe('formule: dal testo normale alla forma leggibile', () => {
  it('apici e pedici', () => {
    expect(testo('x^2')).toBe('x²')
    expect(testo('x^2+y^3')).toBe('x² + y³')
    expect(testo('x_1')).toBe('x₁')
    expect(testo('x^(n+1)')).toBe('x^(n + 1)')
    expect(testo('x^-2')).toBe('x⁻²')
    expect(testo('x_max')).toBe('x_(max)')
  })
  it('simboli', () => {
    expect(testo('x >= 2')).toBe('x ≥ 2')
    expect(testo('x <= 2')).toBe('x ≤ 2')
    expect(testo('a != b')).toBe('a ≠ b')
    expect(testo('x -> inf')).toBe('x → ∞')
    expect(testo('+-3')).toBe('± 3')
    expect(testo('2*pi*r')).toBe('2·π·r')
    expect(testo('Delta = b^2-4ac')).toBe('Δ = b² − 4ac')
  })
  it('frazioni e radici', () => {
    const f = leggiFormula('(a+b)/(c)')
    expect(tipi(f)).toEqual(['frazione'])
    expect(testo('(x^2-4)/(x-1)')).toBe('(x² − 4)/(x − 1)')
    expect(tipi(leggiFormula('1/2'))).toEqual(['frazione'])
    expect(tipi(leggiFormula('km/h'))).not.toContain('frazione')
    expect(testo('sqrt(x+1)')).toBe('√(x + 1)')
    expect(testo('sqrt(x^2+1)')).toBe('√(x² + 1)')
  })
  it('il meno: attaccato se è del numero, con aria se è tra due termini', () => {
    const n = leggiFormula('-x+3')
    expect(n[0]).toEqual({ t: 'txt', s: '−' })
    expect(n[2]).toEqual({ t: 'op', s: '+' })
    expect(testo('(-2)')).toBe('(−2)')
  })
  it('funzioni restano parole, lettere sole sono variabili', () => {
    expect(testo('sin(x)')).toBe('sin(x)')
    expect(testo('lim x->inf')).toBe('lim x → ∞')
    expect(leggiFormula('sin(x)')[0]).toEqual({ t: 'fun', s: 'sin' })
    expect(tipi(leggiFormula('ab'))).toEqual(['var', 'var'])
  })
  it('non lancia mai errori e non perde testo', () => {
    for (const s of ['', '(', ')', '((x)', 'x^', 'x_', '^2', '(a)/(', 'sqrt(', 'sqrt', '1/', '//', '3,5+2.5', 'ç§']) expect(() => leggiFormula(s)).not.toThrow()
    expect(testo('3,5+2.5')).toBe('3,5 + 2.5')
    expect(testo('(x+1')).toBe('(x + 1')
    expect(testo('x)')).toBe('x)')
  })
})

describe('grafico: calcoli', () => {
  it('campiona con NaN dove non è definita', () => {
    const c = campiona((x) => 1 / x, -1, 1, 4)
    expect(c).toHaveLength(5)
    expect(Number.isNaN(c[2]!.y)).toBe(true)
    expect(campiona((x) => Math.sqrt(x), -1, 1, 2)[0]!.y).toBeNaN()
  })
  it('limiti verticali: ignora i poli, include lo zero, altezza minima', () => {
    const [lo, hi] = limitiY(campiona((x) => (x * x - 4) / (x - 1), -4, 5))
    expect(hi - lo).toBeLessThan(60)
    expect(lo).toBeLessThan(0)
    expect(hi).toBeGreaterThan(0)
    const [a, b] = limitiY(campiona(() => 3, 0, 1, 4))
    expect(b - a).toBeGreaterThanOrEqual(1)
    expect(limitiY([])).toEqual([-1, 1])
  })
  it('tacche tonde', () => {
    expect(tacche(0, 10, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(tacche(-4, 4, 4)).toEqual([-4, -2, 0, 2, 4])
    expect(tacche(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    expect(tacche(3, 3)).toEqual([])
  })
  it('etichette con il meno vero', () => expect(etichettaTacca(-0.5)).toBe('−0.5'))
  it('il tracciato si interrompe al polo e fuori dal riquadro', () => {
    const c = campiona((x) => 1 / (x - 1), -3, 5, 400)
    const d = tracciato(c, (x) => x * 10, (y) => -y * 10, -6, 6)
    expect((d.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(tracciato([{ x: 0, y: NaN }], (x) => x, (y) => y, -1, 1)).toBe('')
    // arriva fino ai bordi del riquadro (y = 6 → «-60.0», y = -6 → «60.0»)
    expect(d).toContain('-60.0')
    expect(d).toMatch(/ 60\.0/)
  })
})

describe('disequazione → grafico', () => {
  it('finestra attorno ai punti, asintoti dove c\'è il denominatore, soluzioni come tratti', () => {
    const g = perGrafico(leggiDisequazione('(x^2-4)/(x-1) >= 0'))
    expect(g.x0).toBe(-4)
    expect(g.x1).toBe(4)
    expect(g.marchi.filter((m) => m.asintoto).map((m) => m.x)).toEqual([1])
    expect(g.marchi.filter((m) => !m.asintoto).map((m) => [m.x, m.pieno])).toEqual([[-2, true], [1, false], [2, true]])
    expect(g.tratti).toHaveLength(2)
  })
  it('senza punti, una finestra qualunque', () => {
    const g = perGrafico(leggiDisequazione('x^2+1 > 0'))
    expect(g.x1 - g.x0).toBeGreaterThanOrEqual(4)
    expect(g.tratti).toEqual([{ lo: -Infinity, hi: Infinity }])
  })
})
