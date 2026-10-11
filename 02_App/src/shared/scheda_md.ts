// Lettura e scrittura dei file in Markdown con frontmatter (schede e simili).
// Principio: riscrivere un file non deve cambiare nulla di ciò che non si è toccato
// (campi sconosciuti, sezioni extra, ordine). Così le modifiche dell'AI e quelle dell'app convivono
// e i diff di git restano piccoli.

import YAML from 'yaml'
import type { SchedaPatch, Tabella } from './types'

export interface Sezione {
  titolo: string
  testo: string
}

export interface DocMd {
  haFrontmatter: boolean
  /** frontmatter grezzo, nell'ordine in cui è scritto */
  fm: Record<string, unknown>
  /** errore di YAML, se il frontmatter non si legge */
  erroreYaml: string | null
  /** testo fra il frontmatter e la prima sezione */
  preambolo: string
  sezioni: Sezione[]
}

/** Ordine canonico dei campi del frontmatter di una scheda; gli altri seguono nell'ordine originale. */
export const ORDINE_CAMPI_SCHEDA = [
  'id',
  'corsia',
  'data',
  'titolo_breve',
  'titolo',
  'temi',
  'collegamenti',
  'testi',
  'pagine',
  'fuori_dal_libro',
  'origine'
]

const ORDINE_SEZIONI = ['riassunto', 'dettagli', 'struttura e metrica', 'contesto', 'citazioni chiave', 'domande', 'attenzione', 'tabella']
const chiave = (t: string): string => t.trim().toLowerCase()

export function normalizzaFineRiga(testo: string): string {
  return testo.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
}

export function dividiFrontmatter(testo: string): { fm: string | null; corpo: string } {
  const t = normalizzaFineRiga(testo)
  if (!t.startsWith('---\n')) return { fm: null, corpo: t }
  const fine = t.indexOf('\n---', 3)
  if (fine < 0) return { fm: null, corpo: t }
  const dopo = t.slice(fine + 4)
  // la riga di chiusura deve finire lì
  if (dopo !== '' && !dopo.startsWith('\n')) return { fm: null, corpo: t }
  return { fm: t.slice(4, fine), corpo: dopo.replace(/^\n/, '') }
}

function righeVuoteAiCapi(righe: string[]): string[] {
  let a = 0
  let b = righe.length
  while (a < b && righe[a]!.trim() === '') a++
  while (b > a && righe[b - 1]!.trim() === '') b--
  return righe.slice(a, b)
}

export function leggiDocMd(testo: string): DocMd {
  const { fm, corpo } = dividiFrontmatter(testo)
  let fmObj: Record<string, unknown> = {}
  let erroreYaml: string | null = null
  if (fm != null) {
    try {
      const v = YAML.parse(fm) as unknown
      if (v == null) fmObj = {}
      else if (typeof v === 'object' && !Array.isArray(v)) fmObj = v as Record<string, unknown>
      else erroreYaml = 'Il frontmatter non è un elenco di campi.'
    } catch (e) {
      erroreYaml = (e as Error).message.split('\n')[0] ?? 'YAML non valido'
    }
  }
  const righe = corpo.split('\n')
  const pre: string[] = []
  const sezioni: Sezione[] = []
  let cur: { titolo: string; righe: string[] } | null = null
  let fence = false
  for (const r of righe) {
    if (/^\s*(```|~~~)/.test(r)) fence = !fence
    const h = !fence ? r.match(/^##\s+(.+?)\s*$/) : null
    if (h && !r.startsWith('###')) {
      if (cur) sezioni.push({ titolo: cur.titolo, testo: righeVuoteAiCapi(cur.righe).join('\n') })
      cur = { titolo: h[1]!, righe: [] }
    } else if (cur) cur.righe.push(r)
    else pre.push(r)
  }
  if (cur) sezioni.push({ titolo: cur.titolo, testo: righeVuoteAiCapi(cur.righe).join('\n') })
  return {
    haFrontmatter: fm != null,
    fm: fmObj,
    erroreYaml,
    preambolo: righeVuoteAiCapi(pre).join('\n'),
    sezioni
  }
}

/** Frontmatter in YAML: elenchi di soli valori semplici su una riga; mappe brevi in una riga negli elenchi. */
export function yamlFrontmatter(obj: unknown, opzioni: { mappeInRiga?: boolean } = {}): string {
  const doc = new YAML.Document(obj)
  YAML.visit(doc, {
    Seq(_, node) {
      if (node.items.every((i) => YAML.isScalar(i))) node.flow = true
    },
    Map(_, node, path) {
      if (opzioni.mappeInRiga && YAML.isSeq(path[path.length - 1])) node.flow = true
    }
  })
  return YAML.stringify(doc, { lineWidth: 0, flowCollectionPadding: true }).trimEnd()
}

export function scriviDocMd(doc: DocMd, opzioni: { ordine?: string[]; mappeInRiga?: boolean } = {}): string {
  let fm = doc.fm
  if (opzioni.ordine) {
    const ord: Record<string, unknown> = {}
    for (const k of opzioni.ordine) if (k in fm) ord[k] = fm[k]
    for (const k of Object.keys(fm)) if (!(k in ord)) ord[k] = fm[k]
    fm = ord
  }
  const parti: string[] = []
  if (doc.haFrontmatter) {
    const y = Object.keys(fm).length ? yamlFrontmatter(fm, { mappeInRiga: !!opzioni.mappeInRiga }) : ''
    parti.push(y ? `---\n${y}\n---` : '---\n---')
  }
  if (doc.preambolo) parti.push(doc.preambolo)
  for (const s of doc.sezioni) parti.push(s.testo ? `## ${s.titolo}\n${s.testo}` : `## ${s.titolo}`)
  return parti.join('\n\n') + '\n'
}

// ---------- sezioni note ----------

export function trovaSezione(doc: DocMd, titolo: string): Sezione | undefined {
  return doc.sezioni.find((s) => chiave(s.titolo) === chiave(titolo))
}

/** Imposta (o toglie, con null) una sezione senza spostare le altre. */
export function impostaSezione(doc: DocMd, titolo: string, testo: string | null): void {
  const k = chiave(titolo)
  const i = doc.sezioni.findIndex((s) => chiave(s.titolo) === k)
  if (testo == null) {
    if (i >= 0) doc.sezioni.splice(i, 1)
    return
  }
  if (i >= 0) {
    doc.sezioni[i] = { titolo: doc.sezioni[i]!.titolo, testo }
    return
  }
  const rango = ORDINE_SEZIONI.indexOf(k)
  let pos = doc.sezioni.length
  if (rango >= 0) {
    const dopo = doc.sezioni.findIndex((s) => {
      const r = ORDINE_SEZIONI.indexOf(chiave(s.titolo))
      return r > rango
    })
    if (dopo >= 0) pos = dopo
  }
  doc.sezioni.splice(pos, 0, { titolo, testo })
}

export function leggiDettagli(testo: string): string[] {
  const out: string[] = []
  for (const r of testo.split('\n')) {
    const m = r.match(/^[-*]\s+(.*)$/)
    if (m) out.push(m[1]!)
    else if (r.trim() === '') continue
    else if (out.length) out[out.length - 1] += ' ' + r.trim() // riga di continuazione
    else out.push(r.trim())
  }
  return out
}

export function scriviDettagli(dettagli: string[]): string {
  return dettagli.map((d) => `- ${d}`).join('\n')
}

const cellaDa = (s: string): string => s.trim().replace(/\\\|/g, '|')
const cellaPer = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

function dividiRigaTabella(r: string): string[] {
  let t = r.trim()
  if (t.startsWith('|')) t = t.slice(1)
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1)
  const celle: string[] = []
  let cur = ''
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') {
      cur += '\\|'
      i++
    } else if (t[i] === '|') {
      celle.push(cellaDa(cur))
      cur = ''
    } else cur += t[i]
  }
  celle.push(cellaDa(cur))
  return celle
}

/** Tabella: righe introduttive (testo libero) seguite da una tabella GFM. */
export function leggiTabella(testo: string): Tabella {
  const righe = testo.split('\n')
  const primaTabella = righe.findIndex((r) => r.trim().startsWith('|'))
  if (primaTabella < 0) return { intro: righe.join('\n').trim(), colonne: [], righe: [] }
  const intro = righe.slice(0, primaTabella).join('\n').trim()
  const tab = righe.slice(primaTabella).filter((r) => r.trim().startsWith('|'))
  const colonne = tab.length ? dividiRigaTabella(tab[0]!) : []
  const corpo = tab.slice(1).filter((r) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(r.trim()))
  return { intro, colonne, righe: corpo.map(dividiRigaTabella) }
}

export function scriviTabella(t: Tabella): string {
  const out: string[] = []
  if (t.intro.trim()) out.push(t.intro.trim(), '')
  if (t.colonne.length) {
    out.push('| ' + t.colonne.map(cellaPer).join(' | ') + ' |')
    out.push('|' + t.colonne.map(() => '---').join('|') + '|')
    for (const r of t.righe) out.push('| ' + r.map(cellaPer).join(' | ') + ' |')
  }
  return out.join('\n')
}

// ---------- applicare una modifica ----------

const vuoto = (v: unknown): boolean => v == null || v === '' || (Array.isArray(v) && v.length === 0)

/** Applica solo i campi presenti nella modifica; tutto il resto del file resta com'è. */
export function applicaPatchScheda(doc: DocMd, patch: SchedaPatch): void {
  const fm = doc.fm
  const imposta = (k: string, v: unknown, obbligatorio = false): void => {
    if (!obbligatorio && vuoto(v)) delete fm[k]
    else fm[k] = v
  }
  if (patch.corsia !== undefined) imposta('corsia', patch.corsia, true)
  if (patch.data !== undefined) imposta('data', patch.data, true)
  if (patch.titolo_breve !== undefined) imposta('titolo_breve', patch.titolo_breve, true)
  if (patch.titolo !== undefined) {
    const breve = patch.titolo_breve ?? String(fm.titolo_breve ?? '')
    imposta('titolo', patch.titolo === breve ? '' : patch.titolo)
  }
  if (patch.temi !== undefined) imposta('temi', patch.temi)
  if (patch.collegamenti !== undefined) imposta('collegamenti', patch.collegamenti)
  if (patch.pagine !== undefined) imposta('pagine', patch.pagine)
  if (patch.fuori_dal_libro !== undefined) imposta('fuori_dal_libro', patch.fuori_dal_libro, true)

  if (patch.riassunto !== undefined) impostaSezione(doc, 'Riassunto', patch.riassunto.trim())
  if (patch.dettagli !== undefined) impostaSezione(doc, 'Dettagli', scriviDettagli(patch.dettagli.filter((d) => d.trim())))
  if (patch.attenzione !== undefined) impostaSezione(doc, 'Attenzione', patch.attenzione.trim() ? patch.attenzione.trim() : null)
  const libera = (titolo: string, v: string | undefined): void => {
    if (v !== undefined) impostaSezione(doc, titolo, v.trim() ? v.trim() : null)
  }
  libera('Struttura e metrica', patch.struttura)
  libera('Contesto', patch.contesto)
  libera('Citazioni chiave', patch.citazioni)
  libera('Domande', patch.domande)
  if (patch.tabella !== undefined) {
    const t = patch.tabella
    impostaSezione(doc, 'Tabella', t && (t.colonne.length || t.intro.trim()) ? scriviTabella(t) : null)
  }
}
