// Interpretazione del campo libero `data` (formato_studio_italiano.md §4, "La data").
// Funzioni pure: stesse regole della demo della Home, con i messaggi d'errore del documento di formato.

export type KindData = 'none' | 'error' | 'year' | 'month' | 'day' | 'range' | 'free'

export interface DataInterpretata {
  /** posizione sull'asse in anni (1837.45 = giugno 1837); null = nessuna posizione (zona «Senza data») */
  num: number | null
  /** come si legge sulla card */
  label: string
  kind: KindData
  y?: number
  mo?: number
  d?: number
  /** messaggio leggibile se la data è impossibile; in quel caso num è null */
  err: string | null
  /** vero se la stessa scrittura si potrebbe leggere anche come mese (es. 1809-12: intervallo o dicembre 1809?) */
  ambigua?: boolean
}

export const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre'
]

export const pad2 = (n: number): string => (n < 10 ? '0' : '') + n

/** Mese o giorno fuori intervallo: restituisce un messaggio, mai undefined. */
export function dateErr(y: number, mo: number | null, d: number | null): string | null {
  if (mo != null && (!isFinite(mo) || mo < 1 || mo > 12)) {
    return `Mese non valido: ${mo}. Sono ammessi i valori da 1 a 12.`
  }
  if (d != null && mo != null) {
    const giorni = new Date(y, mo, 0).getDate()
    if (!isFinite(d) || d < 1 || d > giorni) {
      return `Giorno non valido: ${d} ${MESI[mo - 1]} ${y} ha ${giorni} giorni.`
    }
  }
  return null
}

function mkDate(d: number | null, mo: number, y: number, raw: string): DataInterpretata {
  const err = dateErr(y, mo, d)
  if (err) return { num: null, label: raw, kind: 'error', err, y, mo, ...(d != null ? { d } : {}) }
  if (d == null) return { num: y + (mo - 1) / 12, label: `${pad2(mo)}/${y}`, kind: 'month', y, mo, err: null }
  return {
    num: y + (mo - 1) / 12 + (d - 1) / 372,
    label: `${pad2(d)}/${pad2(mo)}/${y}`,
    kind: 'day',
    y,
    mo,
    d,
    err: null
  }
}

/** Riconosce gg/mm/aaaa, mm/aaaa, aaaa, ISO aaaa-mm-gg e aaaa-mm, intervalli e testo libero. */
export function parseData(raw: unknown): DataInterpretata {
  const s = String(raw == null ? '' : raw).trim()
  if (!s) return { num: null, label: 'senza data', kind: 'none', err: null }

  // Intervallo abbreviato (1819-20, 1816-18): il secondo numero si completa con il secolo del primo.
  // Vale solo se ne esce un anno successivo, così "1798-06" resta la data ISO giugno 1798.
  const ab = s.match(/^(\d{3,4})\s*[-–—]\s*(\d{1,2})$/)
  if (ab) {
    const ya = +ab[1]!
    const tail = ab[2]!.length === 1 ? '0' + ab[2] : ab[2]!
    const base = String(ya)
    const yb = +(base.slice(0, base.length - 2) + tail)
    if (yb > ya) {
      const mese = +ab[2]!
      return {
        num: ya,
        label: `${ya}–${yb}`,
        kind: 'range',
        y: ya,
        err: null,
        ...(mese >= 1 && mese <= 12 ? { ambigua: true } : {})
      }
    }
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/)
  if (iso) return mkDate(iso[3] == null ? null : +iso[3], +iso[2]!, +iso[1]!, s)

  const one = (seg: string): DataInterpretata => {
    const t = seg.trim()
    let m = t.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{3,4})$/)
    if (m) return mkDate(+m[1]!, +m[2]!, +m[3]!, t)
    m = t.match(/^(\d{1,2})[/.\-](\d{3,4})$/)
    if (m) return mkDate(null, +m[1]!, +m[2]!, t)
    m = t.match(/^(\d{3,4})$/)
    if (m) return { num: +m[1]!, label: m[1]!, kind: 'year', y: +m[1]!, err: null }
    m = t.match(/(\d{3,4})/)
    if (m) return { num: +m[1]!, label: t, kind: 'free', y: +m[1]!, err: null }
    return { num: null, label: t, kind: 'free', err: null }
  }

  const parts = s.split(/\s*(?:–|—|-->|→)\s*|\s+-\s+/)
  const segs = parts.length > 1 ? parts : s.split('-')
  if (segs.length === 2 && /\d/.test(segs[0]!) && /\d/.test(segs[1]!)) {
    const a = one(segs[0]!)
    const b = one(segs[1]!)
    if (a.err) return a
    if (b.err) return b
    if (a.num != null && b.num != null) {
      return { num: a.num, label: `${a.label} – ${b.label}`, kind: 'range', ...(a.y != null ? { y: a.y } : {}), err: null }
    }
  }
  return one(s)
}

/** Forma lunga, per la scheda aperta e l'anteprima: «14 giugno 1837». */
export function dataLunga(raw: unknown): string {
  const p = parseData(raw)
  if (p.kind === 'none') return 'senza data'
  if (p.err) return p.label
  if (p.kind === 'day') return `${p.d} ${MESI[p.mo! - 1]} ${p.y}`
  if (p.kind === 'month') return `${MESI[p.mo! - 1]} ${p.y}`
  return p.label
}

/** Forma compatta, per card e righe di lista. */
export function dataBreve(raw: unknown): string {
  const p = parseData(raw)
  if (p.kind === 'none') return 'senza data'
  if (p.err) return p.label + ' ⚠'
  return p.label
}

/**
 * Fine di periodo INCLUSIVA: restituisce il limite superiore esclusivo.
 * 1815 → 1816 · 06/1815 → fine giugno · 30/06/1815 → fine di quel giorno
 * 1815-1820 → fine 1820 (si legge l'ultimo segmento dell'intervallo).
 */
export function fineEsclusa(raw: unknown): { v: number | null; err: string | null } {
  const s = String(raw == null ? '' : raw).trim()
  if (!s) return { v: null, err: null }
  const p = parseData(s)
  if (p.err) return { v: null, err: p.err }
  if (p.kind === 'none') return { v: null, err: null }
  if (p.kind === 'range') {
    const ab = s.match(/^(\d{3,4})\s*[-–—]\s*(\d{1,2})$/)
    if (ab) {
      const base = String(+ab[1]!)
      const tail = ab[2]!.length === 1 ? '0' + ab[2] : ab[2]!
      return fineEsclusa(base.slice(0, base.length - 2) + tail)
    }
    const parts = s.split(/\s*(?:–|—|-->|→)\s*|\s+-\s+/)
    const segs = parts.length > 1 ? parts : s.split('-')
    return fineEsclusa(segs[segs.length - 1])
  }
  if (p.kind === 'month') return { v: p.y! + p.mo! / 12, err: null }
  if (p.kind === 'day') return { v: p.y! + (p.mo! - 1) / 12 + p.d! / 372, err: null }
  return { v: p.y != null ? p.y + 1 : null, err: null }
}

/** Messaggio leggibile se la fine di un periodo è scritta male o precede l'inizio. */
export function erroreFine(inizio: string, fine: string | undefined): string | null {
  if (!fine) return null
  const e = fineEsclusa(fine)
  if (e.err) return e.err
  if (e.v == null) return null
  const lo = parseData(inizio).num
  if (lo != null && e.v <= lo) return `La fine (${dataBreve(fine)}) è prima dell'inizio (${dataBreve(inizio)}).`
  return null
}
