// Il motore della matematica: solo calcoli su testo, nessun file letto o scritto.
import { describe, expect, it } from 'vitest'
import { leggiDisequazione, perchéSegno, scriviNumero, valoreDisequazione } from '../src/renderer/matematica/disequazioni'
import { ErroreMat, leggiPoli, passi, primoPasso, scomponi, scriviPoli, scriviScomposto } from '../src/renderer/matematica/polinomio'

const scomposto = (s: string): string => scriviScomposto(scomponi(leggiPoli(s)))

describe('leggere e scrivere polinomi', () => {
  it('legge con spazi, * e coefficienti impliciti', () => {
    expect(leggiPoli('x^2-5x+6')).toEqual([6, -5, 1])
    expect(leggiPoli(' 6x^3 - 12x^2 + 6x ')).toEqual([0, 6, -12, 6])
    expect(leggiPoli('-x^2+1')).toEqual([1, 0, -1])
    expect(leggiPoli('2*x^2+x')).toEqual([0, 1, 2])
  })
  it('somma i termini simili', () => expect(leggiPoli('x+x+3-1')).toEqual([2, 2]))
  it('riscrive in testo normale (andata e ritorno)', () => {
    for (const s of ['x^3+x^2-4x-4', '2x^2+5x+3', 'x^4-16', '-x+1', '6x^3-12x^2+6x']) expect(scriviPoli(leggiPoli(s))).toBe(s)
  })
  it('rifiuta quello che non è un polinomio in x, con un messaggio leggibile', () => {
    for (const s of ['', 'x^', 'y+1', '3^2', 'x^2+(']) expect(() => leggiPoli(s)).toThrow(ErroreMat)
  })
})

describe('scomposizione: la lista di controllo in ordine', () => {
  it('sceglie il primo passo che funziona', () => {
    const nome = (s: string): string | undefined => primoPasso(leggiPoli(s))?.nome
    expect(nome('6x^3-12x^2+6x')).toBe('Raccoglimento totale')
    expect(nome('x^2-9')).toBe('Differenza di quadrati')
    expect(nome('x^3-8')).toBe('Somma o differenza di cubi')
    expect(nome('x^2-5x+6')).toBe('Trinomio di 2º grado')
    expect(nome('x^3+x^2-4x-4')).toBe('Raccoglimento parziale')
    expect(nome('x^3-6x^2+11x-6')).toBe('Ruffini')
  })
  it('dà sempre sei controlli, nell\'ordine fisso', () => {
    expect(passi(leggiPoli('x^2-5x+6')).map((s) => s.nome)).toEqual(['Raccoglimento totale', 'Differenza di quadrati', 'Somma o differenza di cubi', 'Trinomio di 2º grado', 'Raccoglimento parziale', 'Ruffini'])
  })
  it('motiva i controlli che non funzionano', () => {
    for (const s of passi(leggiPoli('x^2+1'))) if (!s.ok) expect(s.no.length).toBeGreaterThan(5)
  })
  it('scompone fino in fondo', () => {
    expect(scomposto('6x^3-12x^2+6x')).toBe('6x(x-1)^2')
    expect(scomposto('x^4-16')).toBe('(x+2)(x-2)(x^2+4)')
    expect(scomposto('x^2-5x+6')).toBe('(x-2)(x-3)')
    expect(scomposto('2x^2+5x+3')).toBe('(2x+3)(x+1)')
    expect(scomposto('x^3+x^2-4x-4')).toBe('(x+2)(x+1)(x-2)')
    expect(scomposto('x^3-6x^2+11x-6')).toBe('(x-1)(x-2)(x-3)')
    expect(scomposto('x^3-8')).toBe('(x-2)(x^2+2x+4)')
  })
  it('lascia com\'è ciò che non si scompone (con questi strumenti)', () => {
    expect(scomposto('x^2+1')).toBe('x^2+1')
    expect(primoPasso(leggiPoli('x^2+1'))).toBeNull()
    expect(scomposto('x+3')).toBe('x+3')
  })
  it('il prodotto dei fattori ridà il polinomio', () => {
    for (const s of ['6x^3-12x^2+6x', 'x^4-16', 'x^3-6x^2+11x-6', '2x^2+5x+3', 'x^3+x^2-4x-4', 'x^4-5x^2+4', '3x^2-12']) {
      const p = leggiPoli(s)
      const prod = scomponi(p).reduce((a, f) => {
        const r = new Array<number>(a.length + f.length - 1).fill(0)
        a.forEach((x, i) => f.forEach((y, j) => { r[i + j]! += x * y }))
        return r
      }, [1])
      expect(prod.map((c) => c + 0)).toEqual(p)
    }
  })
})

describe('disequazioni: linea dei segni e soluzione', () => {
  const sol = (s: string): string => leggiDisequazione(s).testo
  it('intere', () => {
    expect(sol('(x-1)(x+3) > 0')).toBe('x < −3  ∨  x > 1')
    expect(sol('x^2-5x+6 < 0')).toBe('2 < x < 3')
    expect(sol('x^2-5x+6 >= 0')).toBe('x ≤ 2  ∨  x ≥ 3')
  })
  it('fratte: il denominatore resta escluso', () => {
    expect(sol('(x^2-4)/(x-1) >= 0')).toBe('−2 ≤ x < 1  ∨  x ≥ 2')
    expect(sol('x/(x-1) <= 0')).toBe('0 ≤ x < 1')
  })
  it('casi limite', () => {
    expect(sol('x^2+1 > 0')).toBe('per ogni x')
    expect(sol('x^2+1 < 0')).toBe('nessuna soluzione')
    expect(sol('(x-2)^2 <= 0')).toBe('x = 2')
    expect(sol('(x-2)^2 > 0')).toBe('x < 2  ∨  x > 2')
    expect(sol('(x-2)^2 >= 0')).toBe('per ogni x')
  })
  it('la linea dei segni ha una riga per fattore e un intervallo in più dei punti', () => {
    const d = leggiDisequazione('(x^2-4)/(x-1) >= 0')
    expect(d.righe).toHaveLength(2)
    expect(d.fratta).toBe(true)
    expect(d.punti.map((p) => p.v)).toEqual([-2, 1, 2])
    expect(d.risultato).toHaveLength(4)
    expect(d.righe.every((r) => r.segni.length === 4)).toBe(true)
    expect(d.incluso).toEqual([true, false, true])
  })
  it('chiede di portare tutto a sinistra e rifiuta ciò che non sa leggere', () => {
    expect(() => leggiDisequazione('(x^2-4)/(x-1) > 1')).toThrow(/secondo membro/)
    expect(() => leggiDisequazione('x^2-4')).toThrow(/segno/)
    expect(() => leggiDisequazione('x^3-1 > 0')).toThrow(/2º grado/)
    expect(() => leggiDisequazione('(y-1) > 0')).toThrow(ErroreMat)
  })
  it('il segno del valore nel grafico concorda con la soluzione', () => {
    const d = leggiDisequazione('(x^2-4)/(x-1) >= 0')
    expect(valoreDisequazione(d, 3)).toBeGreaterThan(0)
    expect(valoreDisequazione(d, 0)).toBeGreaterThan(0)
    expect(valoreDisequazione(d, 1.5)).toBeLessThan(0)
  })
  it('spiega il perché del segno', () => {
    expect(perchéSegno(leggiDisequazione('x-1 > 0').righe[0]!)).toBe('(x−1) è positivo a destra di 1 (si annulla in 1).')
    expect(perchéSegno(leggiDisequazione('x^2+1 > 0').righe[0]!)).toContain('Δ < 0')
  })
  it('scrive i numeri', () => {
    expect(scriviNumero(-3)).toBe('−3')
    expect(scriviNumero(0.5)).toBe('1/2')
    expect(scriviNumero(-1.5)).toBe('−3/2')
  })
})
