import { describe, expect, it } from 'vitest'
import { leggiConfronto, leggiNota, leggiRipasso } from '../src/shared/extraAutore'

const conf = `---
id: fasi
titolo: Le fasi
colonne: ["", A, B]
righe:
  - [Natura, x, y]
schede: [uno]
---
`

describe('extraAutore', () => {
  it('legge un confronto', () => {
    const r = leggiConfronto(conf)
    expect(r.ok && r.dati.righe[0]).toEqual(['Natura', 'x', 'y'])
  })
  it('segnala una riga con celle in più o in meno', () => {
    const r = leggiConfronto(conf.replace('[Natura, x, y]', '[Natura, x]'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errore).toMatch(/riga 1.*2 celle invece di 3/)
  })
  it('segnala il blocco iniziale mancante', () => {
    expect(leggiConfronto('niente').ok).toBe(false)
  })
  it('legge il ripasso e mette fuori_dal_libro a false se manca', () => {
    const r = leggiRipasso('---\ncategoria: Vita\ndomande:\n  - { domanda: D, risposta: R, schede: [a] }\n---\n')
    expect(r.ok && r.dati.domande[0]!.fuori_dal_libro).toBe(false)
  })
  it('legge una nota: titolo, introduzione e voci anche su più righe', () => {
    const n = leggiNota('trappole', '# Trappole\n\nNon sono errori.\n\n- **A**: uno\n  continua\n- B\n')
    expect(n).toEqual({ id: 'trappole', titolo: 'Trappole', intro: 'Non sono errori.', voci: ['**A**: uno continua', 'B'] })
  })
})

describe('testi chiave e percorso', () => {
  it('legge un testo chiave', async () => {
    const { leggiTestoChiave } = await import('../src/shared/extraAutore')
    const r = leggiTestoChiave('---\nid: inf\ntitolo: L\'infinito\nversi: [a, b]\nanalisi: [x]\n---\n')
    expect(r.ok && r.dati.da_controllare).toBe(false)
  })
  it('il percorso rifiuta una tappa con un luogo inesistente', async () => {
    const { leggiPercorso } = await import('../src/shared/extraAutore')
    const base = '---\nluoghi:\n  - { id: a, nome: A, lat: 43, lon: 13 }\ntappe:\n  - { luogo: b, quando: "1798", titolo: T }\n---\n'
    const r = leggiPercorso(base)
    expect(r.ok).toBe(false)
    expect(leggiPercorso(base.replace('luogo: b', 'luogo: a')).ok).toBe(true)
  })
})
