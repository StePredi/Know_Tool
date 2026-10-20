// Polinomi in una variabile (x) con coefficienti interi: lettura da testo normale, scrittura, e la scomposizione
// come LISTA DI CONTROLLO IN ORDINE (si ferma al primo passo che funziona). Nessuna dipendenza da React.

/** Coefficienti dal grado 0 in su: x^2-5x+6 → [6, -5, 1]. */
export type Poli = number[]

/** Errore con un messaggio che si può mostrare così com'è. */
export class ErroreMat extends Error {
  constructor(public codice: 'lettura' | 'secondoMembro' | 'grado', messaggio: string) {
    super(messaggio)
    this.name = 'ErroreMat'
  }
}

export const mcd = (a: number, b: number): number => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}
/** Radice quadrata intera esatta, oppure -1. */
export const radiceEsatta = (n: number): number => {
  if (n < 0) return -1
  const r = Math.round(Math.sqrt(n))
  return r * r === n ? r : -1
}

export const pulisci = (p: Poli): Poli => {
  const r = p.slice()
  while (r.length > 1 && r[r.length - 1] === 0) r.pop()
  return r
}
export const grado = (p: Poli): number => p.length - 1
export const terminiNonNulli = (p: Poli): number => p.filter((c) => c !== 0).length
export const monomio = (c: number, g: number): Poli => [...new Array<number>(g).fill(0), c]
export const somma = (p: Poli, q: Poli): Poli => {
  const r: number[] = []
  for (let i = 0; i < Math.max(p.length, q.length); i++) r.push((p[i] ?? 0) + (q[i] ?? 0))
  return pulisci(r)
}
export const opposto = (p: Poli): Poli => p.map((c) => (c === 0 ? 0 : -c))
export const prodotto = (p: Poli, q: Poli): Poli => {
  const r = new Array<number>(p.length + q.length - 1).fill(0)
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j]! += a * b }))
  return pulisci(r)
}
export const valuta = (p: Poli, x: number): number => p.reduceRight((v, c) => v * x + c, 0)

/** Legge «x^3+x^2-4x-4», «2x^2+5x+3», «6x^3 - 12x^2 + 6x». Solo la variabile x. */
export function leggiPoli(testo: string): Poli {
  const s = testo.replace(/\s+/g, '').replace(/\*/g, '')
  if (!s) throw new ErroreMat('lettura', 'Scrivi un polinomio in x, per esempio x^2-5x+6.')
  const p: number[] = [0]
  for (const t of s.replace(/-/g, '+-').split('+').filter((x) => x !== '')) {
    const m = /^(-?)(\d*)(x?)(?:\^(\d+))?$/.exec(t)
    if (!m || (m[2] === '' && m[3] === '') || (m[4] && !m[3])) throw new ErroreMat('lettura', `Non capisco «${t}». Scrivi un polinomio in x, per esempio x^2-5x+6.`)
    let c = m[2] === '' ? 1 : parseInt(m[2]!, 10)
    if (m[1]) c = -c
    const g = m[3] ? (m[4] ? parseInt(m[4], 10) : 1) : 0
    if (g > 12) throw new ErroreMat('grado', 'Per ora arrivo al 12º grado.')
    while (p.length <= g) p.push(0)
    p[g]! += c
  }
  return pulisci(p)
}

/** Scrive il polinomio in testo normale: [-4,-4,1,1] → «x^3+x^2-4x-4». */
export function scriviPoli(p: Poli): string {
  let o = ''
  for (let d = p.length - 1; d >= 0; d--) {
    const c = p[d]!
    if (!c) continue
    const a = Math.abs(c)
    const corpo = d === 0 ? String(a) : (a === 1 ? '' : String(a)) + 'x' + (d > 1 ? '^' + d : '')
    o += (o === '' ? (c < 0 ? '-' : '') : c < 0 ? '-' : '+') + corpo
  }
  return o || '0'
}
/** Come scriviPoli, con le parentesi se i termini sono più d'uno. */
export const scriviFattore = (p: Poli): string => (terminiNonNulli(p) > 1 ? '(' + scriviPoli(p) + ')' : scriviPoli(p))

const dividiPerLineare = (p: Poli, r: number): Poli => {
  const q: number[] = []
  let c = 0
  for (let i = p.length - 1; i >= 1; i--) {
    c = p[i]! + c * r
    q.unshift(c)
  }
  return q
}
const frazione = (n: number, d: number): [number, number] => {
  const g = mcd(n, d) || 1
  n /= g
  d /= g
  return d < 0 ? [-n, -d] : [n, d]
}

export interface Passo {
  /** chiave stabile: è quella che una regola scrive in «controllo» */
  id: string
  /** nome del controllo, come lo si direbbe a voce */
  nome: string
  /** il controllo funziona? */
  ok: boolean
  /** se non funziona: perché */
  no: string
  /** se funziona: cosa si fa, in una riga */
  perche?: string
  /** se funziona: i fattori che escono */
  fattori?: Poli[]
}

/** Gli stessi sei controlli, sempre nello stesso ordine; il primo con ok=true è quello da fare. */
export function passi(p: Poli): Passo[] {
  const T: number[] = []
  p.forEach((c, d) => { if (c) T.push(d) })
  const n = T.length
  const hi = grado(p)
  const out: Passo[] = []

  // 1 · raccoglimento totale
  const g = p.reduce((a, c) => mcd(a, c), 0)
  const m = T[0] ?? 0
  const s1: Passo = { id: 'raccoglimento-totale', nome: 'Raccoglimento totale', ok: g > 1 || m > 0, no: 'nessun fattore comune a tutti i termini' }
  if (s1.ok) {
    const t = monomio(g, m)
    s1.fattori = [t, p.slice(m).map((c) => c / g)]
    s1.perche = 'comune: ' + scriviPoli(t)
  }
  out.push(s1)

  // 2 · differenza di quadrati
  const s2: Passo = { id: 'differenza-quadrati', nome: 'Differenza di quadrati', ok: false, no: 'servono 2 termini quadrati con segni opposti' }
  if (n === 2) {
    const a = T[1]!, b = T[0]!, ca = p[a]!, cb = p[b]!
    if (ca * cb < 0 && radiceEsatta(Math.abs(ca)) > 0 && radiceEsatta(Math.abs(cb)) > 0 && a % 2 === 0 && b % 2 === 0) {
      const pos = ca > 0 ? a : b, ng = ca > 0 ? b : a
      const A = monomio(radiceEsatta(p[pos]!), pos / 2), B = monomio(radiceEsatta(-p[ng]!), ng / 2)
      s2.ok = true
      s2.fattori = [somma(A, opposto(B)), somma(A, B)]
      s2.perche = 'A² − B² = (A − B)(A + B)'
    }
  }
  out.push(s2)

  // 3 · somma o differenza di cubi
  const s3: Passo = { id: 'somma-cubi', nome: 'Somma o differenza di cubi', ok: false, no: 'servono 2 termini che siano cubi' }
  if (n === 2) {
    const u = T[1]!, w = T[0]!
    const cu = Math.round(Math.cbrt(p[u]!)), cw = Math.round(Math.cbrt(p[w]!))
    if (cu ** 3 === p[u] && cw ** 3 === p[w] && u % 3 === 0 && w % 3 === 0) {
      const A = monomio(cu, u / 3), B = monomio(cw, w / 3)
      s3.ok = true
      s3.fattori = [somma(A, B), somma(somma(prodotto(A, A), opposto(prodotto(A, B))), prodotto(B, B))]
      s3.perche = 'A³ ± B³ = (A ± B)(A² ∓ AB + B²)'
    }
  }
  out.push(s3)

  // 4 · trinomio di 2º grado
  const s4: Passo = { id: 'trinomio', nome: 'Trinomio di 2º grado', ok: false, no: 'serve un trinomio di 2º grado con Δ quadrato perfetto' }
  if (n === 3 && hi === 2 && T[0] === 0 && T[1] === 1) {
    const A = p[2]!, B = p[1]!, C = p[0]!
    const D = B * B - 4 * A * C, r = radiceEsatta(D)
    if (r >= 0) {
      const f1 = frazione(-B + r, 2 * A), f2 = frazione(-B - r, 2 * A)
      s4.ok = true
      s4.fattori = [[A / (f1[1] * f2[1])], [-f1[0], f1[1]], [-f2[0], f2[1]]]
      s4.perche = D === 0 ? 'quadrato di binomio (Δ = 0)' : `radici razionali (Δ = ${D})`
    }
  }
  out.push(s4)

  // 5 · raccoglimento parziale (4 termini, a coppie)
  const s5: Passo = { id: 'raccoglimento-parziale', nome: 'Raccoglimento parziale', ok: false, no: 'servono 4 termini che si raggruppano a coppie' }
  if (n === 4) {
    const ms = T.slice().reverse().map((e) => monomio(p[e]!, e))
    const coppia = (a: Poli, b: Poli): [Poli, Poli] => {
      const s = somma(a, b)
      const gg = s.reduce((x, c) => mcd(x, c), 0)
      let mm = 0
      while (!s[mm]) mm++
      const sg = s[grado(s)]! < 0 ? -1 : 1
      return [monomio(gg * sg, mm), s.slice(mm).map((c) => c / (gg * sg))]
    }
    const G1 = coppia(ms[0]!, ms[1]!), G2 = coppia(ms[2]!, ms[3]!)
    if (scriviPoli(G1[1]) === scriviPoli(G2[1]) && grado(G1[1]) >= 1) {
      s5.ok = true
      s5.fattori = [G1[1], somma(G1[0], G2[0])]
      s5.perche = `raccolgo ${scriviFattore(G1[0])} e ${scriviFattore(G2[0])}: esce ${scriviFattore(G1[1])}`
    }
  }
  out.push(s5)

  // 6 · Ruffini (radici intere dividono il termine noto)
  const s6: Passo = { id: 'ruffini', nome: 'Ruffini', ok: false, no: 'nessuna radice intera trovata' }
  if (hi >= 3 && p[0] !== 0) {
    const c0 = Math.abs(p[0]!)
    for (let x = -c0; x <= c0; x++) {
      if (x !== 0 && c0 % Math.abs(x) === 0 && valuta(p, x) === 0) {
        s6.ok = true
        s6.fattori = [[-x, 1], dividiPerLineare(p, x)]
        s6.perche = `p(${x}) = 0, divido per (x ${x < 0 ? '+ ' : '− '}${Math.abs(x)})`
        break
      }
    }
  }
  out.push(s6)
  return out
}

/** Il passo da fare adesso, o null se il polinomio non si scompone con questi strumenti. */
export const primoPasso = (p: Poli): Passo | null => (grado(p) <= 1 || terminiNonNulli(p) === 1 ? null : passi(p).find((s) => s.ok) ?? null)

/** Scompone fino in fondo, ripetendo i controlli sui fattori. */
export function scomponi(p: Poli): Poli[] {
  const s = primoPasso(p)
  return s ? s.fattori!.flatMap(scomponi) : [p]
}

/** «2(x-1)^2(x+3)»: costanti moltiplicate insieme, fattori uguali in potenza. */
export function scriviScomposto(fattori: Poli[]): string {
  let k = 1
  const gruppi = new Map<string, { f: Poli; e: number }>()
  for (const f of fattori) {
    if (grado(f) === 0) { k *= f[0]!; continue }
    const chiave = scriviPoli(f)
    const g = gruppi.get(chiave)
    if (g) g.e++
    else gruppi.set(chiave, { f, e: 1 })
  }
  // ordine di lettura: prima i fattori di 1º grado dalla radice più piccola, poi quelli di grado maggiore
  const chiave = (f: Poli): number => (grado(f) === 1 ? -f[0]! / f[1]! : Infinity)
  const lista = [...gruppi.values()].sort((a, b) => grado(a.f) - grado(b.f) || chiave(a.f) - chiave(b.f))
  // un solo fattore, senza costanti né potenze: niente parentesi inutili
  if (k === 1 && lista.length === 1 && lista[0]!.e === 1) return scriviPoli(lista[0]!.f)
  let o = k === 1 ? '' : k === -1 ? '-' : String(k)
  for (const { f, e } of lista) o += scriviFattore(f) + (e > 1 ? '^' + e : '')
  return o || '1'
}
