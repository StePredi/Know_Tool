import { describe, expect, it } from 'vitest'
import { idLibero, modelloScheda, slugId } from '../src/shared/modelloScheda'
import { leggiSchedaSit } from '../src/shared/situazioni'

describe('scheda nuova', () => {
  it('id dal titolo, libero', () => {
    expect(slugId('Così è già più facile!')).toBe('cosi-e-gia-piu-facile')
    expect(idLibero('Blink', ['blink', 'blink-2'])).toBe('blink-3')
    expect(slugId('???')).toBe('scheda')
  })
  it('i modelli sono schede valide', () => {
    for (const t of ['ricetta', 'prima_dopo', 'regola', 'spiegazione'] as const) {
      const r = leggiSchedaSit(modelloScheda(t, 'prova', 'Una prova'), 'prova.yaml')
      expect(r.errore).toBeUndefined()
      expect(r.scheda?.tipo).toBe(t)
    }
  })
})
