import { describe, expect, it } from 'vitest'
import { leggiRegola } from '../src/shared/matematica'

const base = `id: prova
nome: Prova
riconosci: Due termini.
fai: Fai qualcosa.
`
const regola = (extra: string) => leggiRegola(base + extra, 'prova.yaml')

describe('regola nel nuovo formato (fasi e figure)', () => {
  it('senza campi nuovi resta valida e con valori vuoti', () => {
    const r = regola('').regola!
    expect(r.capisci).toEqual([])
    expect(r.riconosciEsempi).toEqual([])
    expect(r.esercizi).toEqual([])
    expect(r.colore).toBeUndefined()
  })

  it('legge capisci, animazione, colore, esempi di riconoscimento ed esercizi', () => {
    const r = regola(`colore: "#5b5bd6"
animazione: ricomposizione
capisci:
  - Un paragrafo.
riconosciEsempi:
  - da: x^2-9
    domande:
      - titolo: Quanti pezzi?
        risposta: si
        figura: { tipo: pezzi, termini: [x^2, "9"], segni: ["-"] }
      - titolo: Sono quadrati?
        risposta: si
        figura: { tipo: quadrati, termini: [{ t: x^2, lato: x }, { t: "9", n: 9 }] }
      - titolo: Segno?
        risposta: si
        figura: { tipo: segno, segno: "-" }
    esito: { ok: true, testo: Va bene. }
esercizi:
  - da: x^2-9
    passi:
      - domanda: Chi sono A e B?
        opzioni:
          - { testo: A = x, B = 3, giusta: true, perche: Sono le radici. }
          - { testo: A = x^2, B = 9, perche: Sono i termini. }
        dopo: "\`(x-3)(x+3)\`"
`)
    expect(r.errore).toBeUndefined()
    const x = r.regola!
    expect(x.animazione).toBe('ricomposizione')
    expect(x.riconosciEsempi[0]!.domande).toHaveLength(3)
    expect(x.esercizi[0]!.passi[0]!.opzioni[1]!.giusta).toBe(false)
  })

  it('legge la figura «fattori» con i fattori comuni', () => {
    const r = regola(`riconosciEsempi:
  - da: 4x^2+6x
    domande:
      - titolo: Cosa compare in tutti?
        risposta: si
        figura:
          tipo: fattori
          termini:
            - { t: 4x^2, fattori: ["2", "2", x, x] }
            - { t: 6x, fattori: ["2", "3", x] }
          comune: ["2", x]
    esito: { ok: true, testo: Raccogli 2x. }
`)
    expect(r.errore).toBeUndefined()
    const f = r.regola!.riconosciEsempi[0]!.domande[0]!.figura
    expect(f.tipo).toBe('fattori')
    if (f.tipo === 'fattori') expect(f.comune).toEqual(['2', 'x'])
  })

  it('rifiuta colore non valido, figura sconosciuta e domande senza risposta valida', () => {
    expect(regola('colore: rosso\n').errore).toMatch(/colore/)
    const dom = (fig: string, risp = 'si') => `riconosciEsempi:
  - da: x
    domande:
      - { titolo: T, risposta: ${risp}, figura: ${fig} }
    esito: { ok: true, testo: ok }
`
    expect(regola(dom('{ tipo: cerchio }')).errore).toBeTruthy()
    expect(regola(dom('{ tipo: segno, segno: "-" }', 'forse')).errore).toBeTruthy()
  })

  it('un passo guidato vuole almeno due opzioni', () => {
    const r = regola(`esercizi:
  - da: x
    passi:
      - domanda: D
        opzioni: [{ testo: unica, giusta: true, perche: boh }]
        dopo: ok
`)
    expect(r.errore).toBeTruthy()
  })
})
