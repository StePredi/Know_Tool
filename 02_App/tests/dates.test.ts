import { describe, expect, it } from 'vitest'
import { dataBreve, dataLunga, erroreFine, fineEsclusa, parseData } from '../src/shared/dates'

describe('parseData', () => {
  it('vuoto → senza data', () => {
    expect(parseData('').kind).toBe('none')
    expect(parseData(undefined).num).toBeNull()
  })
  it('anno, mese, giorno', () => {
    expect(parseData('1837').num).toBe(1837)
    expect(parseData('06/1837')).toMatchObject({ kind: 'month', label: '06/1837' })
    expect(parseData('14/06/1837')).toMatchObject({ kind: 'day', label: '14/06/1837' })
    expect(dataLunga('14/06/1837')).toBe('14 giugno 1837')
    expect(dataLunga('06/1837')).toBe('giugno 1837')
  })
  it('ISO', () => {
    expect(parseData('1837-06-14').kind).toBe('day')
    expect(parseData('1798-06')).toMatchObject({ kind: 'month', mo: 6 })
  })
  it('intervalli, anche abbreviati', () => {
    expect(parseData('1819-20')).toMatchObject({ kind: 'range', label: '1819–1820', num: 1819 })
    expect(parseData('1816-18').label).toBe('1816–1818')
    expect(parseData('1816 – 1818').kind).toBe('range')
  })
  it('1809-12 è ambigua (intervallo o dicembre?) ma non è un errore', () => {
    const p = parseData('1809-12')
    expect(p.ambigua).toBe(true)
    expect(p.err).toBeNull()
  })
  it('date impossibili: segnalate, non corrette', () => {
    const g = parseData('30/02/1830')
    expect(g.err).toBe('Giorno non valido: 30 febbraio 1830 ha 28 giorni.')
    expect(g.num).toBeNull()
    expect(parseData('13/1830').err).toMatch(/Mese non valido/)
    expect(dataBreve('30/02/1830')).toContain('⚠')
  })
  it('testo libero con un anno dentro mantiene la posizione', () => {
    expect(parseData('Fine Settecento').num).toBeNull()
    expect(parseData('circa 1820')).toMatchObject({ kind: 'free', num: 1820 })
  })
})

describe('fine periodo inclusiva', () => {
  it('anno → fine anno', () => expect(fineEsclusa('1815').v).toBe(1816))
  it('mese → fine mese', () => expect(fineEsclusa('06/1815').v).toBeCloseTo(1815.5, 5))
  it('intervallo → ultimo segmento', () => {
    expect(fineEsclusa('1815-1820').v).toBe(1821)
    expect(fineEsclusa('1815-20').v).toBe(1821)
  })
  it('fine prima dell\'inizio', () => {
    expect(erroreFine('1820', '1815')).toMatch(/prima dell'inizio/)
    expect(erroreFine('1815', '1820')).toBeNull()
  })
})
