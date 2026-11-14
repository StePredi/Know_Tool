import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { controllaEsercizi, controllaSituazioni, leggiEsercizi, leggiIndice, leggiSchedaSit, ordineSchede, type SchedaSit } from '../src/shared/situazioni'
import { leggiFormula, pezziTesto, testoSemplice } from '../src/shared/notazione'
import { compila, verificaEsempio } from '../src/shared/valuta'

const INDICE = `
modello: per_situazioni
titolo: Prova
centro: Prova
ingresso: Cosa vedo
guida: Qual è l'ultima operazione?
rami:
  - id: a
    nome: Passi
    colore: blue
    ordine: true
    voci:
      - schede: [prodotto, somma]
`
const PRODOTTO = `
id: prodotto
tipo: regola
titolo: Prodotto
sigla: Prodotto
vedo: Due fattori con la x.
formula: (f*g)' = f'*g + f*g'
esempi:
  - da: x^2*sin x
    passi: ["\`f = x^2\`", { dice: "derivo", perche: "regola", scheda: somma }]
    ris: 2x*sin x + x^2*cos x
    verifica: derivata
confondi:
  - { scheda: somma, differenza: il più si deriva a pezzi }
`
const SOMMA = `
id: somma
tipo: regola
titolo: Somma
sigla: Somma
frase: Un più in mezzo.
comando: f' + g'
formula: [(f+g)' = f' + g']
`

describe('scheda regola', () => {
  it('legge una regola: comando e frase vengono dai campi giusti', () => {
    const { scheda, errore } = leggiSchedaSit(PRODOTTO, 'prodotto.yaml')
    expect(errore).toBeUndefined()
    expect(scheda?.tipo).toBe('regola')
    if (scheda?.tipo !== 'regola') return
    expect(scheda.comando).toBe("(f*g)' = f'*g + f*g'")
    expect(scheda.frase).toBe('Due fattori con la x.')
    expect(scheda.esempi[0]!.passi).toHaveLength(2)
  })
  it('rifiuta una regola senza formula o con id sbagliato', () => {
    expect(leggiSchedaSit('id: x\ntipo: regola\ntitolo: X\nsigla: X\n', 'x.yaml').errore).toMatch(/formula/)
    expect(leggiSchedaSit(SOMMA, 'altro.yaml').errore).toMatch(/non corrisponde/)
  })
  it("l'indice accetta ingresso, guida e il ramo in ordine; lato è facoltativo", () => {
    const { indice, errore } = leggiIndice(INDICE)
    expect(errore).toBeUndefined()
    expect(indice!.ingresso).toBe('Cosa vedo')
    expect(indice!.rami[0]!.ordine).toBe(true)
    expect(indice!.rami[0]!.lato).toBe('R')
  })
  it('controlla i collegamenti di confondi e dei passi con scheda', () => {
    const indice = leggiIndice(INDICE).indice!
    const schede: Record<string, SchedaSit> = { prodotto: leggiSchedaSit(PRODOTTO, 'prodotto.yaml').scheda! }
    const av = controllaSituazioni(indice, schede)
    expect(av.join('\n')).toMatch(/«confondi» cita la scheda «somma»/)
    expect(av.join('\n')).toMatch(/un passo cita la scheda «somma»/)
    schede.somma = leggiSchedaSit(SOMMA, 'somma.yaml').scheda!
    expect(controllaSituazioni(indice, schede)).toEqual([])
    expect(ordineSchede(indice)).toEqual(['prodotto', 'somma'])
  })
  it('esercizi.yaml: il piano deve citare schede che esistono', () => {
    const { esercizi, errore } = leggiEsercizi('esercizi:\n  - testo: x^2*sin x\n    risultato: ok\n    piano:\n      - { scheda: prodotto, nota: due fattori }\n      - { scheda: manca }\n')
    expect(errore).toBeUndefined()
    const schede = { prodotto: leggiSchedaSit(PRODOTTO, 'prodotto.yaml').scheda! }
    expect(controllaEsercizi(esercizi!, schede)).toEqual(['Esercizio 1: il piano cita la scheda «manca» che non esiste.'])
    expect(leggiEsercizi('esercizi:\n  - testo: x\n    piano: []\n').errore).toMatch(/piano/)
  })
})

describe('notazione delle formule', () => {
  it('apici, pedici, frazioni e radici', () => {
    expect(leggiFormula('x^2')).toEqual([{ t: 'var', v: 'x' }, { t: 'sup', c: [{ t: 'txt', v: '2' }] }])
    expect(leggiFormula('frac(1|x)')).toEqual([{ t: 'frac', n: [{ t: 'txt', v: '1' }], d: [{ t: 'var', v: 'x' }] }])
    expect(leggiFormula('sqrt(x+1)')[0]).toMatchObject({ t: 'rad' })
    expect(leggiFormula('log_2(x)')[1]).toMatchObject({ t: 'sub' })
    expect(leggiFormula('e^(-x)')[1]).toMatchObject({ t: 'sup' })
  })
  it('lettere, funzioni, operatori e parentesi grandi', () => {
    const t = (f: string): string => leggiFormula(f).map((n) => n.t).join(' ')
    expect(t("f'*g")).toBe('var pr sp var')
    expect(t('2*x')).toBe('txt op var')
    expect(t('sin x')).toBe('fn sp var')
    expect(t('ln(x)')).toBe('fn par')
    expect(t('a + -b')).toBe('var op un var')
    expect(t('= -sin x')).toBe('op un fn sp var')
    expect(leggiFormula('(frac(f|g))')[0]).toMatchObject({ t: 'par', grande: true })
    expect(leggiFormula('(x+1)')[0]).toMatchObject({ t: 'par', grande: false })
  })
  it('simboli e testo con formule tra apici inversi', () => {
    expect(testoSemplice('Vale `x -> inf` e `a >= b`.')).toBe('Vale x→∞ e a≥b.')
    expect(pezziTesto('a `b` c').map((p) => p.formula)).toEqual([false, true, false])
    expect(testoSemplice('`frac(1|2*sqrt(x))`')).toBe('(1)/(2·√(x))')
  })
})

describe('controllo numerico degli esempi', () => {
  it('derivate giuste passano, sbagliate no', () => {
    expect(verificaEsempio('derivata', 'x^2*sin x', '2x*sin x + x^2*cos x')).toBeNull()
    expect(verificaEsempio('derivata', 'x^2*sin x', '2x*cos x')).toMatch(/dovrebbe venire/)
    expect(verificaEsempio('derivata', 'sqrt(x)', 'frac(1|2*sqrt(x))')).toBeNull()
    expect(verificaEsempio('derivata', 'log_2(x)', 'frac(1|x*ln(2))')).toBeNull()
    expect(verificaEsempio('derivata', '2*tan x', 'frac(2|cos^2 x)')).toBeNull()
  })
  it('scomposizione: stessi valori', () => {
    expect(verificaEsempio('scomposizione', 'x^4-16', '(x-2)(x+2)(x^2+4)')).toBeNull()
    expect(verificaEsempio('scomposizione', 'x^2+9', '(x+3)^2')).toMatch(/dovrebbe venire/)
  })
  it('formule che non si leggono danno un messaggio', () => {
    expect(() => compila('x +')).toThrow()
    expect(verificaEsempio('derivata', 'x$', '1')).toMatch(/non riesco a leggere/)
  })
})

// Tutti i documenti di matematica veri: ogni cartella «… per situazioni» dentro 01_Argomenti/Matematica.
// Chi scrive un nuovo argomento lo trova controllato qui, senza toccare il test.
const radiceMat = resolve(__dirname, '../../01_Argomenti/Matematica')
function documentiMat(): string[] {
  if (!existsSync(radiceMat)) return []
  const out: string[] = []
  // a qualsiasi profondità (Matematica/<Arg>/<doc>, Matematica/Biennio/<Arg>/<doc>, …)
  const cerca = (d: string, livello: number): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (!e.isDirectory() || livello > 4) continue
      const p = join(d, e.name)
      if (existsSync(join(p, 'indice.yaml'))) out.push(p)
      else cerca(p, livello + 1)
    }
  }
  cerca(radiceMat, 1)
  return out
}

describe.each(documentiMat().map((d) => [d.split(/[\\/]/).slice(-3).join('/'), d] as const))('documento di matematica: %s', (_nome, dir) => {
  const { indice, errore } = leggiIndice(readFileSync(join(dir, 'indice.yaml'), 'utf8'))
  const schede: Record<string, SchedaSit> = {}
  const errori: string[] = []
  for (const n of readdirSync(join(dir, 'schede'))) {
    const r = leggiSchedaSit(readFileSync(join(dir, 'schede', n), 'utf8'), n)
    if (r.scheda) schede[r.scheda.id] = r.scheda
    else errori.push(r.errore ?? n)
  }
  it('indice e schede si leggono, senza avvisi sui collegamenti', () => {
    expect(errore).toBeUndefined()
    expect(errori).toEqual([])
    expect(controllaSituazioni(indice!, schede)).toEqual([])
  })
  it('esercizi.yaml (se c\'è) cita schede che esistono', () => {
    const f = join(dir, 'esercizi.yaml')
    if (!existsSync(f)) return
    const e = leggiEsercizi(readFileSync(f, 'utf8'))
    expect(e.errore).toBeUndefined()
    expect(controllaEsercizi(e.esercizi!, schede)).toEqual([])
  })
  it('ogni esempio con «verifica» torna con i numeri', () => {
    const male: string[] = []
    for (const s of Object.values(schede)) {
      if (s.tipo !== 'regola') continue
      for (const e of s.esempi) {
        if (!e.verifica) continue
        const r = verificaEsempio(e.verifica, e.da, e.ris)
        if (r) male.push(`${s.id}: ${e.da} → ${e.ris}: ${r}`)
      }
    }
    expect(male).toEqual([])
  })
  it('le formule di ogni scheda si leggono', () => {
    for (const s of Object.values(schede)) {
      if (s.tipo !== 'regola') continue
      for (const f of Array.isArray(s.formula) ? s.formula : [s.formula]) expect(leggiFormula(f).length).toBeGreaterThan(0)
    }
  })
})

const derivate = join(radiceMat, 'Derivate', 'Derivate per situazioni')
describe.skipIf(!existsSync(derivate))('Derivate per situazioni: contenuto di riferimento', () => {
  it('22 schede, 10 esercizi e più di 20 esempi controllati con i numeri', () => {
    const schede = readdirSync(join(derivate, 'schede'))
    expect(schede).toHaveLength(22)
    expect(leggiEsercizi(readFileSync(join(derivate, 'esercizi.yaml'), 'utf8')).esercizi!.esercizi).toHaveLength(10)
    let n = 0
    for (const f of schede) {
      const s = leggiSchedaSit(readFileSync(join(derivate, 'schede', f), 'utf8'), f).scheda!
      if (s.tipo === 'regola') n += s.esempi.filter((e) => e.verifica).length
    }
    expect(n).toBeGreaterThan(20)
  })
})
