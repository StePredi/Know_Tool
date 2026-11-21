// Blocchi di una scheda «spiegazione»: funzioni pure usate dai moduli di modifica
// (aggiungere, spostare, eliminare un blocco; riassunto per l'elenco; controllo di un blocco).
// Un blocco è un oggetto con UNA sola chiave: titolo, testo, punti, carte, tabella, disegno, comandi, nota, trappola.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Blocco = Record<string, any>

export const TIPI_BLOCCO = ['titolo', 'testo', 'punti', 'carte', 'tabella', 'disegno', 'comandi', 'nota', 'trappola'] as const
export type TipoBlocco = (typeof TIPI_BLOCCO)[number]

export const NOME_BLOCCO: Record<TipoBlocco, string> = {
  titolo: 'Titolo', testo: 'Testo', punti: 'Punti', carte: 'Carte', tabella: 'Tabella',
  disegno: 'Disegno', comandi: 'Comandi', nota: 'Nota', trappola: 'Trappola'
}

/** Blocchi con un modulo a campi (passo 1); gli altri si modificano come testo YAML del solo blocco. */
export const BLOCCHI_SEMPLICI: readonly TipoBlocco[] = ['titolo', 'testo', 'punti', 'nota', 'trappola']

export function tipoBlocco(b: Blocco): TipoBlocco | null {
  const k = Object.keys(b ?? {})[0]
  return (TIPI_BLOCCO as readonly string[]).includes(k ?? '') ? (k as TipoBlocco) : null
}

/** Un blocco nuovo, con il minimo che lo schema accetta una volta compilato. */
export function nuovoBlocco(t: TipoBlocco): Blocco {
  switch (t) {
    case 'punti': return { punti: [''] }
    case 'carte': return { carte: [{ titolo: '', testo: '' }] }
    case 'tabella': return { tabella: { colonne: ['', ''], righe: [['', '']] } }
    case 'disegno': return { disegno: { modello: 'flusso', nodi: ['', ''], frecce: [''] } }
    case 'comandi': return { comandi: [{ codice: '', spiega: '' }] }
    default: return { [t]: '' }
  }
}

/** Inserisce dopo la posizione `dopo` (-1 = in cima); restituisce una copia e la posizione del nuovo blocco. */
export function aggiungiBlocco(blocchi: Blocco[], t: TipoBlocco, dopo: number): { blocchi: Blocco[]; pos: number } {
  const pos = Math.max(0, Math.min(blocchi.length, dopo + 1))
  const out = blocchi.slice()
  out.splice(pos, 0, nuovoBlocco(t))
  return { blocchi: out, pos }
}

export function spostaBlocco(blocchi: Blocco[], i: number, d: -1 | 1): { blocchi: Blocco[]; pos: number } {
  const j = i + d
  if (i < 0 || i >= blocchi.length || j < 0 || j >= blocchi.length) return { blocchi, pos: i }
  const out = blocchi.slice()
  ;[out[i], out[j]] = [out[j]!, out[i]!]
  return { blocchi: out, pos: j }
}

/** Toglie il blocco `i`; `pos` è il blocco da tenere selezionato dopo (-1 se non resta nessun blocco). */
export function eliminaBlocco(blocchi: Blocco[], i: number): { blocchi: Blocco[]; pos: number } {
  if (i < 0 || i >= blocchi.length) return { blocchi, pos: i }
  const out = blocchi.filter((_, k) => k !== i)
  return { blocchi: out, pos: Math.min(i, out.length - 1) }
}

const vuotoDeep = (v: unknown): boolean => {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.every(vuotoDeep)
  if (typeof v === 'object') return Object.entries(v as Record<string, unknown>).every(([k, x]) => k === 'modello' || vuotoDeep(x))
  return false
}

/** Vero se il blocco non contiene niente di scritto (si può eliminare senza chiedere). */
export function bloccoVuoto(b: Blocco): boolean {
  const t = tipoBlocco(b)
  return !t || vuotoDeep(b[t])
}

/** Una riga per l'elenco dei blocchi. */
export function riassuntoBlocco(b: Blocco): string {
  const t = tipoBlocco(b)
  if (!t) return '(blocco non riconosciuto)'
  const v = b[t]
  const n = (k: number, un: string, piu: string): string => `${k} ${k === 1 ? un : piu}`
  if (t === 'punti') return n((v as unknown[]).length, 'punto', 'punti')
  if (t === 'carte') return n((v as unknown[]).length, 'carta', 'carte')
  if (t === 'comandi') return n((v as unknown[]).length, 'comando', 'comandi')
  if (t === 'tabella') return `${(v?.colonne ?? []).length} colonne × ${(v?.righe ?? []).length} righe`
  if (t === 'disegno') return v?.modello === 'pile' ? `Pile: ${(v.colonne ?? []).length} colonne` : `Flusso: ${(v?.nodi ?? []).length} nodi`
  const s = String(v ?? '').replace(/\s+/g, ' ').trim()
  return s.length > 48 ? s.slice(0, 47) + '…' : s || '(vuoto)'
}

// ───────── Passo 2: moduli per carte, tabella, comandi e disegni ─────────

export const TONI_STRATO = ['chiaro', 'oro', 'colore', 'scuro'] as const
const SEP = ' | '

export interface StratoForm { testo: string; tono: string }

/** Un livello di una pila come lo mostra il modulo: il testo (riquadri affiancati separati da « | ») e il tono. */
export function stratoAForm(s: unknown): StratoForm {
  if (typeof s === 'string') return { testo: s, tono: 'chiaro' }
  if (Array.isArray(s)) return { testo: s.join(SEP), tono: 'chiaro' }
  const o = (s ?? {}) as { testo?: string | string[]; tono?: string }
  return { testo: Array.isArray(o.testo) ? o.testo.join(SEP) : (o.testo ?? ''), tono: o.tono ?? 'chiaro' }
}

/** Il contrario: la forma più corta che lo schema accetta (testo semplice, lista, o { testo, tono }). */
export function formAStrato(f: StratoForm): unknown {
  const v = f.testo.includes(SEP) ? f.testo.split(SEP) : f.testo
  return f.tono && f.tono !== 'chiaro' ? { testo: v, tono: f.tono } : v
}

const nonVuoti = (a: unknown): string[] => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x.trim() !== '') : [])
const senzaVuoti = (o: Record<string, unknown>): Blocco => {
  const out: Blocco = {}
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue
    out[k] = v
  }
  return out
}

/** Toglie i campi vuoti facoltativi e prende la forma più corta (si usa al salvataggio, non mentre si scrive). */
export function puliziaBlocco(b: Blocco): Blocco {
  const t = tipoBlocco(b)
  if (!t) return b
  const v = b[t]
  if (t === 'carte') {
    return { carte: (v as Blocco[]).map((c) => senzaVuoti({
      titolo: c.titolo ?? '', sotto: c.sotto, etichetta: c.etichetta, testo: c.testo, punti: nonVuoti(c.punti),
      numeri: ((c.numeri ?? []) as Blocco[]).filter((n) => String(n.valore ?? '').trim() !== '').map((n) => senzaVuoti({ valore: n.valore, cosa: n.cosa }))
    })).map((c) => ({ titolo: '', ...c })) }
  }
  if (t === 'disegno') {
    const d = v as Blocco
    if (d.modello === 'flusso') {
      const nodi = (d.nodi as unknown[]).map((n) => {
        if (typeof n === 'string') return n
        const o = n as Blocco
        const punti = nonVuoti(o.punti)
        const tono = o.tono && o.tono !== 'chiaro' ? o.tono : undefined
        return !o.sotto && !punti.length && !tono ? (o.nome ?? '') : senzaVuoti({ nome: o.nome ?? '', sotto: o.sotto, punti, tono })
      })
      const out: Blocco = { modello: 'flusso', nodi, frecce: d.frecce ?? [] }
      if (d.gruppo && d.gruppo.nome) out.gruppo = d.gruppo
      if (d.nota) out.nota = d.nota
      return { disegno: out }
    }
    const colonne = (d.colonne as Blocco[]).map((c) => {
      const o: Blocco = senzaVuoti({ titolo: c.titolo, cornice: c.cornice })
      o.strati = c.strati
      if (c.nota) o.nota = c.nota
      return o
    })
    return { disegno: senzaVuoti({ modello: 'pile', colonne, nota: d.nota }) }
  }
  return b
}

// Tabella: colonne e righe devono restare allineate.
type Tabella = { colonne: string[]; righe: string[][] }
const tab = (t: Tabella): Tabella => ({ colonne: t.colonne.slice(), righe: t.righe.map((r) => r.slice()) })
export function tabellaAggiungiColonna(t: Tabella): Tabella { const o = tab(t); o.colonne.push(''); o.righe.forEach((r) => r.push('')); return o }
export function tabellaTogliColonna(t: Tabella, i: number): Tabella {
  if (t.colonne.length <= 2 || i < 0 || i >= t.colonne.length) return t
  const o = tab(t); o.colonne.splice(i, 1); o.righe.forEach((r) => r.splice(i, 1)); return o
}
export function tabellaAggiungiRiga(t: Tabella): Tabella { const o = tab(t); o.righe.push(o.colonne.map(() => '')); return o }
export function tabellaTogliRiga(t: Tabella, i: number): Tabella {
  if (t.righe.length <= 1 || i < 0 || i >= t.righe.length) return t
  const o = tab(t); o.righe.splice(i, 1); return o
}
export function tabellaSpostaRiga(t: Tabella, i: number, d: -1 | 1): Tabella {
  const j = i + d
  if (i < 0 || j < 0 || i >= t.righe.length || j >= t.righe.length) return t
  const o = tab(t); [o.righe[i], o.righe[j]] = [o.righe[j]!, o.righe[i]!]; return o
}
/** Cambia una cella; se la riga è più corta delle colonne la completa. */
export function tabellaImposta(t: Tabella, r: number, c: number, v: string): Tabella {
  const o = tab(t)
  const riga = o.righe[r]
  if (!riga) return t
  while (riga.length < o.colonne.length) riga.push('')
  riga[c] = v
  return o
}

/** Il disegno di partenza per un modello, quando si cambia da pile a flusso e viceversa. */
export function disegnoNuovo(modello: 'pile' | 'flusso'): Blocco {
  return modello === 'pile'
    ? { modello: 'pile', colonne: [{ titolo: '', strati: [''] }] }
    : { modello: 'flusso', nodi: [{ nome: '' }, { nome: '' }], frecce: [''] }
}

/** Le frecce devono essere una per spazio fra i nodi: le accorcia o le completa. */
export function frecceAllineate(frecce: string[], nodi: number): string[] {
  const n = Math.max(nodi - 1, 0)
  return Array.from({ length: n }, (_, i) => frecce[i] ?? '')
}
