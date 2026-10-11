// I testi e l'editor: tokenizzazione, riaggancio, lettura dei file (testo.md + json) con validazione.
// Funzioni pure, come per le schede: nessuna eccezione sul contenuto, ogni problema diventa una voce in `problemi`.

import { leggiDocMd } from './scheda_md'
import type {
  Annotazione,
  Esercizio,
  Figura,
  Layout,
  Parafrasi,
  Passo,
  Problema,
  Span,
  StatoRiaggancio,
  Testo
} from './types'

// ---------- tokenizzazione ----------

/** Una parola è una sequenza di lettere; l'apostrofo lega le elisioni (quest'ermo = un token). Cifre e trattini non sono parole. */
const PAROLA = "\\p{L}+(?:['’]\\p{L}+)*"

export interface Token {
  index: number
  text: string
  blocco: number
  start: number
  end: number
}

export interface Blocco {
  index: number
  raw: string
  start: number
  end: number
  /** testo prima della prima parola (numeri, virgolette…) */
  pre: string
  /** indici dei token del blocco */
  da: number
  a: number
}

export interface Tokenizzato {
  blocchi: Blocco[]
  token: Token[]
}

/** Versi: un blocco per riga. Prosa: un blocco per paragrafo (righe vuote). Gli indici dei token non cambiano passando dall'uno all'altro. */
export function tokenizza(corpo: string, layout: Layout): Tokenizzato {
  const parti: { text: string; start: number }[] = []
  if (layout === 'prosa') {
    const re = /\n\s*\n/g
    let ultimo = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(corpo))) {
      parti.push({ text: corpo.slice(ultimo, m.index), start: ultimo })
      ultimo = m.index + m[0].length
    }
    parti.push({ text: corpo.slice(ultimo), start: ultimo })
  } else {
    let ultimo = 0
    for (const riga of corpo.split('\n')) {
      parti.push({ text: riga, start: ultimo })
      ultimo += riga.length + 1
    }
  }
  const blocchi: Blocco[] = []
  const token: Token[] = []
  for (const p of parti) {
    if (!p.text.trim()) continue
    const re = new RegExp(PAROLA, 'gu')
    const da = token.length
    let primo = -1
    let m: RegExpExecArray | null
    while ((m = re.exec(p.text))) {
      if (primo < 0) primo = m.index
      token.push({ index: token.length, text: m[0], blocco: blocchi.length, start: p.start + m.index, end: p.start + m.index + m[0].length })
    }
    blocchi.push({ index: blocchi.length, raw: p.text, start: p.start, end: p.start + p.text.length, pre: primo < 0 ? '' : p.text.slice(0, primo), da, a: token.length - 1 })
  }
  return { blocchi, token }
}

export function parole(s: string | null | undefined): string[] {
  return (s ?? '').match(new RegExp(PAROLA, 'gu')) ?? []
}

/** Le parole di uno span, come testo con gli spazi normalizzati (è il «citato»). */
export function citaDa(corpo: string, token: Token[], span: Span | null): string {
  if (!span || !token[span[0]] || !token[span[1]]) return ''
  return corpo.slice(token[span[0]]!.start, token[span[1]]!.end).replace(/\s+/g, ' ')
}

export function tutteOccorrenze(token: Token[], frase: string | null): Span[] {
  const w = parole(frase)
  if (!w.length) return []
  const out: Span[] = []
  for (let i = 0; i + w.length <= token.length; i++) {
    let ok = true
    for (let j = 0; j < w.length; j++) {
      if (token[i + j]!.text !== w[j]) {
        ok = false
        break
      }
    }
    if (ok) out.push([i, i + w.length - 1])
  }
  return out
}

export function trovaSpan(token: Token[], frase: string): Span | null {
  return tutteOccorrenze(token, frase)[0] ?? null
}

// ---------- riaggancio (decisioni_editor_testo.md §4) ----------

export function riancora(
  span: Span | null,
  citato: string | null,
  tk: Tokenizzato,
  corpo: string
): { span: Span | null; stato: StatoRiaggancio } {
  if (!citato || !parole(citato).length) return { span, stato: 'ok' }
  const giusto =
    span != null &&
    span[0] >= 0 &&
    span[1] < tk.token.length &&
    span[0] <= span[1] &&
    parole(citaDa(corpo, tk.token, span)).join(' ') === parole(citato).join(' ')
  if (giusto) return { span, stato: 'ok' }
  const occ = tutteOccorrenze(tk.token, citato)
  if (occ.length === 1) return { span: occ[0]!, stato: 'riagganciata' }
  if (occ.length > 1) {
    if (span) {
      const d = occ.map((o) => Math.abs(o[0] - span[0]))
      const min = Math.min(...d)
      if (d.filter((x) => x === min).length === 1) return { span: occ[d.indexOf(min)]!, stato: 'riagganciata' }
    }
    return { span, stato: 'ambigua' }
  }
  return { span, stato: 'rotta' }
}

export const daSistemare = (s: StatoRiaggancio): boolean => s === 'rotta' || s === 'ambigua'

/** Una corsia per ogni annotazione che si sovrappone: serve per impilare le barre sotto le parole. */
export function corsieBarre(anns: Annotazione[]): Map<string, number> {
  const corsia = new Map<string, number>()
  const vive = anns
    .filter((a) => a.span && (a.evidenzia || a.sottolinea) && !daSistemare(a.stato))
    .sort((x, y) => x.span![0] - y.span![0] || y.span![1] - y.span![0] - (x.span![1] - x.span![0]))
  const fine: number[] = []
  for (const a of vive) {
    let k = 0
    while (fine[k] !== undefined && fine[k]! >= a.span![0]) k++
    fine[k] = a.span![1]
    corsia.set(a.id, k)
  }
  return corsia
}

// ---------- scrittura leggibile dei json ----------

/** JSON a due spazi, con gli intervalli [a, b] e le coppie {id, frase} su una riga: i diff di git restano piccoli. */
export function jsonLeggibile(v: unknown): string {
  return (
    JSON.stringify(v, null, 2)
      .replace(/\[\s+(-?\d+),\s+(-?\d+)\s+\]/g, '[$1, $2]')
      .replace(/\{\s+"id": ("(?:[^"\\]|\\.)*"),\s+"frase": ("(?:[^"\\]|\\.)*")\s+\}/g, '{ "id": $1, "frase": $2 }') + '\n'
  )
}

// ---------- lettura ----------

type Json = Record<string, unknown>
const èOggetto = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, def = ''): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : def)
const bool = (v: unknown): boolean => v === true
const spanValido = (v: unknown): Span | null =>
  Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= 0 && v[1] >= v[0] ? [v[0], v[1]] : null

function leggiJson(testo: string | undefined, file: string, problemi: Problema[]): Json[] {
  if (testo == null || !testo.trim()) return []
  try {
    const v = JSON.parse(testo) as unknown
    if (!Array.isArray(v)) {
      problemi.push({ gravita: 'errore', codice: 'json-non-valido', file, messaggio: `${file}: ci si aspetta un elenco.` })
      return []
    }
    const out: Json[] = []
    v.forEach((x, i) => {
      if (èOggetto(x)) out.push(x)
      else problemi.push({ gravita: 'errore', codice: 'voce-non-valida', file, messaggio: `${file}: la voce ${i + 1} non è un oggetto.` })
    })
    return out
  } catch (e) {
    problemi.push({ gravita: 'errore', codice: 'json-non-valido', file, messaggio: `${file} non si legge come JSON: ${(e as Error).message}` })
    return []
  }
}

export function leggiFigure(testo: string | undefined, problemi: Problema[]): Figura[] {
  const file = '../../_condiviso/figure_retoriche.json'
  return leggiJson(testo, file, problemi)
    .map((o): Figura | null => {
      const id = str(o.id)
      if (!id) return null
      const tipo = ['suono', 'ordine', 'significato', 'sintassi'].includes(str(o.tipo)) ? (str(o.tipo) as Figura['tipo']) : 'significato'
      return { id, nome: str(o.nome, id), tipo, descrizione: str(o.descrizione), esempio: str(o.esempio) }
    })
    .filter((f): f is Figura => f !== null)
}

function ancora(o: Json, tk: Tokenizzato, corpo: string): { span: Span | null; citato: string | null; stato: StatoRiaggancio; spanScritto: Span | null } {
  const spanScritto = spanValido(o.span)
  const citato = typeof o.citato === 'string' && o.citato.trim() ? o.citato : null
  const r = riancora(spanScritto, citato, tk, corpo)
  return { span: r.span, citato, stato: r.stato, spanScritto }
}

export interface FileTesto {
  id: string
  testo?: string
  annotazioni?: string
  parafrasi?: string
  esercizi?: string
  proposta?: string
}

export function leggiTesto(f: FileTesto, problemi: Problema[], figure: Set<string>): Testo | null {
  const file = `testi/${f.id}/testo.md`
  if (f.testo == null) {
    problemi.push({ gravita: 'errore', codice: 'testo-mancante', file, messaggio: `La cartella del testo «${f.id}» non ha testo.md.` })
    return null
  }
  const doc = leggiDocMd(f.testo)
  if (!doc.haFrontmatter || doc.erroreYaml) {
    problemi.push({ gravita: 'errore', codice: 'yaml', file, messaggio: `testo.md non ha un frontmatter leggibile${doc.erroreYaml ? `: ${doc.erroreYaml}` : ''}.` })
  }
  const fm = doc.fm
  if (fm.id != null && String(fm.id) !== f.id) {
    problemi.push({ gravita: 'errore', codice: 'id-diverso', file, messaggio: `L'id «${String(fm.id)}» è diverso dal nome della cartella «${f.id}».` })
  }
  let layout: Layout = 'verso'
  if (fm.layout === 'prosa') layout = 'prosa'
  else if (fm.layout != null && fm.layout !== 'verso') {
    problemi.push({ gravita: 'errore', codice: 'campo-non-valido', file, messaggio: `Campo «layout» non valido: «${String(fm.layout)}» (si scrive «verso» o «prosa»).` })
  }
  // il corpo è tutto ciò che segue il frontmatter: testo.md non ha sezioni «## », sono parte del testo
  const corpo = corpoDi(f.testo)
  const tk = tokenizza(corpo, layout)

  const annotazioni: Annotazione[] = leggiJson(f.annotazioni, `testi/${f.id}/annotazioni.json`, problemi).map((o, i) => {
    const ev = str(o.evidenzia)
    const schede = Array.isArray(o.schede)
      ? o.schede.map((s) => (typeof s === 'string' ? { id: s, frase: '' } : { id: str((s as Json)?.id), frase: str((s as Json)?.frase) })).filter((s) => s.id)
      : o.scheda
        ? [{ id: str(o.scheda), frase: '' }]
        : []
    return {
      id: str(o.id, `a${i + 1}`),
      ...ancora(o, tk, corpo),
      evidenzia: ev === 'concetto' || ev === 'definizione' || ev === 'dubbio' ? ev : null,
      figura: str(o.figura) || null,
      parola_chiave: bool(o.parola_chiave),
      sottolinea: bool(o.sottolinea),
      nota: str(o.nota),
      flashcard: bool(o.flashcard),
      schede
    }
  })
  const parafrasi: Parafrasi[] = leggiJson(f.parafrasi, `testi/${f.id}/parafrasi.json`, problemi)
    .map((o, i) => ({ id: str(o.id, `p${i + 1}`), ordine: typeof o.ordine === 'number' ? o.ordine : i + 1, ...ancora(o, tk, corpo), testo: str(o.testo) }))
    .sort((a, b) => a.ordine - b.ordine)
  const esercizi: Esercizio[] = leggiJson(f.esercizi, `testi/${f.id}/esercizi.json`, problemi)
    .map((o, i) => ({
      id: str(o.id, `e${i + 1}`),
      numero: typeof o.numero === 'number' ? o.numero : i + 1,
      testo: str(o.testo),
      risposta: str(o.risposta),
      correzione: str(o.correzione),
      fatta: bool(o.fatta),
      passi: (Array.isArray(o.passi) ? o.passi : []).filter(èOggetto).map((p): Passo => ({ ...ancora(p, tk, corpo), et: str(p.et) }))
    }))
    .sort((a, b) => a.numero - b.numero)

  for (const a of annotazioni) {
    if (a.figura && !figure.has(a.figura)) {
      problemi.push({ gravita: 'avviso', codice: 'figura-inesistente', file: `testi/${f.id}/annotazioni.json`, messaggio: `L'annotazione ${a.id} usa la figura «${a.figura}», che non è in figure_retoriche.json.` })
    }
  }
  return {
    id: f.id,
    titolo: str(fm.titolo, f.id),
    scheda: fm.scheda ? str(fm.scheda) : null,
    layout,
    fonte: str(fm.fonte, 'incolla'),
    anno: str(fm.anno),
    opera: str(fm.opera),
    corpo,
    file,
    annotazioni,
    parafrasi,
    esercizi,
    proposta: null
  }
}

/** Il testo vero e proprio: tutto dopo il frontmatter, senza le righe vuote ai capi. */
export function corpoDi(testoFile: string): string {
  const t = testoFile.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  if (!t.startsWith('---\n')) return t.replace(/^\n+|\s+$/g, '')
  const fine = t.indexOf('\n---', 3)
  if (fine < 0) return t.replace(/^\n+|\s+$/g, '')
  return t.slice(fine + 4).replace(/^\s*\n/, '').replace(/\s+$/, '')
}

/** Segnala i punti del testo da rivedere, dopo la lettura. */
export function controllaTesti(testi: Testo[], idSchede: Set<string>, problemi: Problema[]): void {
  for (const t of testi) {
    if (t.scheda && !idSchede.has(t.scheda)) {
      problemi.push({ gravita: 'errore', codice: 'scheda-inesistente', file: t.file, messaggio: `Il testo punta alla scheda «${t.scheda}», che non esiste.` })
    }
    const tutte: { dove: string; a: { stato: StatoRiaggancio; citato: string | null } }[] = [
      ...t.annotazioni.map((a) => ({ dove: `annotazione ${a.id}`, a })),
      ...t.parafrasi.map((a) => ({ dove: `parafrasi ${a.id}`, a })),
      ...t.esercizi.flatMap((e) => e.passi.map((a, i) => ({ dove: `esercizio ${e.numero}, passo ${i + 1}`, a })))
    ]
    for (const { dove, a } of tutte) {
      if (daSistemare(a.stato)) {
        problemi.push({
          gravita: 'avviso',
          codice: 'da-riagganciare',
          file: `testi/${t.id}`,
          messaggio: `«${t.titolo}»: ${dove} non si trova più nel testo (${a.stato === 'ambigua' ? 'ci sono più punti possibili' : 'le parole citate non ci sono più'}): «${a.citato ?? ''}».`
        })
      } else if (a.stato === 'riagganciata') {
        problemi.push({ gravita: 'avviso', codice: 'riagganciata', file: `testi/${t.id}`, messaggio: `«${t.titolo}»: ${dove} è stata riagganciata da sola dopo una modifica del testo: conferma dall'editor.` })
      }
    }
    for (const a of t.annotazioni) {
      for (const s of a.schede) {
        if (!idSchede.has(s.id) && !s.id.includes('/')) {
          problemi.push({ gravita: 'avviso', codice: 'scheda-inesistente', file: `testi/${t.id}/annotazioni.json`, messaggio: `L'annotazione ${a.id} cita la scheda «${s.id}», che non esiste.` })
        }
      }
    }
  }
}

export const slug = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'testo'

/** «v. 8», «vv. 4–6» per i versi; «§ 2» per la prosa. */
export function etichettaPosizione(tk: Tokenizzato, span: Span | null, layout: Layout): string {
  if (!span || !tk.token[span[0]] || !tk.token[span[1]]) return '—'
  const a = tk.token[span[0]]!.blocco + 1
  const b = tk.token[span[1]]!.blocco + 1
  const sigla = layout === 'verso' ? (a === b ? 'v.' : 'vv.') : '§'
  return a === b ? `${sigla} ${a}` : `${sigla} ${a}–${b}`
}
