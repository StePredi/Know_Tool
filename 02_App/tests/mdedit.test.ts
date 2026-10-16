import { describe, expect, it } from 'vitest'
import { applica } from '../src/shared/mdedit'

describe('barra di formattazione', () => {
  it('grassetto avvolge e poi toglie', () => {
    const r = applica({ testo: 'ciao mondo', a: 5, b: 10 }, 'grassetto')
    expect(r.testo).toBe('ciao **mondo**')
    expect(applica(r, 'grassetto').testo).toBe('ciao mondo')
  })
  it('senza selezione inserisce un segnaposto selezionato', () => {
    const r = applica({ testo: '', a: 0, b: 0 }, 'corsivo')
    expect(r.testo).toBe('*corsivo*')
    expect(r.testo.slice(r.a, r.b)).toBe('corsivo')
  })
  it('titolo su più righe e toggle', () => {
    const r = applica({ testo: 'a\nb', a: 0, b: 3 }, 'h2')
    expect(r.testo).toBe('## a\n## b')
    expect(applica(r, 'h2').testo).toBe('a\nb')
    expect(applica({ testo: '# x', a: 0, b: 0 }, 'h3').testo).toBe('### x')
  })
  it('elenchi puntati e numerati', () => {
    expect(applica({ testo: 'a\nb', a: 0, b: 3 }, 'elenco').testo).toBe('- a\n- b')
    expect(applica({ testo: 'a\nb', a: 0, b: 3 }, 'numerato').testo).toBe('1. a\n2. b')
    expect(applica({ testo: '- a\n- b', a: 0, b: 7 }, 'elenco').testo).toBe('a\nb')
  })
  it('citazione, blocco di codice, link, tabella', () => {
    expect(applica({ testo: 'x', a: 0, b: 1 }, 'citazione').testo).toBe('> x')
    expect(applica({ testo: 'x', a: 0, b: 1 }, 'blocco').testo).toBe('```\nx\n```\n')
    const l = applica({ testo: 'sito', a: 0, b: 4 }, 'link')
    expect(l.testo).toBe('[sito](indirizzo)')
    expect(l.testo.slice(l.a, l.b)).toBe('indirizzo')
    expect(applica({ testo: '', a: 0, b: 0 }, 'tabella').testo).toContain('| --- | --- |')
  })
})
