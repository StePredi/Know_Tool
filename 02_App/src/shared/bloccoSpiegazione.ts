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
