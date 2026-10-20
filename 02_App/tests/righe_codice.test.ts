import { describe, expect, it } from 'vitest'
import { codiceDaCopiare, righeCodice } from '../src/renderer/situazioni/righe'

describe('righe di codice di una scheda', () => {
  it('una riga sola: rientro e testo', () => {
    expect(righeCodice('    return x')).toEqual({ ind: 4, righe: [{ rel: 0, t: 'return x' }] })
    expect(righeCodice('ip address print')).toEqual({ ind: 0, righe: [{ rel: 0, t: 'ip address print' }] })
  })

  it('un blocco su più righe: il margine è quello comune, il resto è relativo', () => {
    const r = righeCodice('    if a:\n        b()\n    c()')
    expect(r.ind).toBe(4)
    expect(r.righe.map((x) => x.rel)).toEqual([0, 4, 0])
    expect(r.righe.map((x) => x.t)).toEqual(['if a:', 'b()', 'c()'])
  })

  it('righe vuote nel blocco non rompono il rientro comune', () => {
    const r = righeCodice('  a\n\n  b')
    expect(r.ind).toBe(2)
    expect(r.righe.map((x) => x.rel)).toEqual([0, 0, 0])
  })

  it('la copia tiene il rientro a sinistra e toglie solo la destra', () => {
    expect(codiceDaCopiare('    return x   ')).toBe('    return x')
    expect(codiceDaCopiare('\n  a\n    b  ')).toBe('  a\n    b')
  })
})
