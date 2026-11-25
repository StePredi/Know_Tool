// Confronti, ripasso e note di un autore di Italiano (cartelle confronti/, ripasso/, note/ accanto a schede/).
// Formato: specifiche/formato_studio_italiano.md §5. Qui solo lettura e controllo; non si scrivono dall'app.

import YAML from 'yaml'
import { z } from 'zod'

const schemaConfronto = z.object({
  id: z.string().min(1),
  titolo: z.string().min(1),
  domanda: z.string().optional(),
  colonne: z.array(z.string()).min(2),
  righe: z.array(z.array(z.string())),
  schede: z.array(z.string()).default([]),
  pagine: z.string().optional()
})

const schemaRipasso = z.object({
  categoria: z.string().min(1),
  domande: z.array(
    z.object({
      domanda: z.string().min(1),
      risposta: z.string().min(1),
      schede: z.array(z.string()).default([]),
      fuori_dal_libro: z.boolean().default(false)
    })
  )
})

const schemaTesto = z.object({
  id: z.string().min(1),
  titolo: z.string().min(1),
  scheda: z.string().optional(),
  versi: z.array(z.string()).default([]),
  metrica: z.string().optional(),
  analisi: z.array(z.string()).default([]),
  /** versi e metrica scritti da Claude, non dall'antologia: da confrontare */
  da_controllare: z.boolean().default(false)
})

const schemaPercorso = z.object({
  luoghi: z.array(z.object({ id: z.string(), nome: z.string(), lat: z.number(), lon: z.number(), lato: z.enum(['destra', 'sinistra']).default('destra'), dx: z.number().optional(), dy: z.number().optional() })),
  tappe: z.array(z.object({ luogo: z.string(), quando: z.string(), titolo: z.string(), schede: z.array(z.string()).default([]) }))
})

export type Confronto = z.infer<typeof schemaConfronto>
export type TestoChiave = z.infer<typeof schemaTesto>
export type Percorso = z.infer<typeof schemaPercorso>
export type Ripasso = z.infer<typeof schemaRipasso>
export interface Nota {
  id: string
  titolo: string
  /** righe di testo prima dell'elenco */
  intro: string
  voci: string[]
}
export interface ExtraAutore {
  confronti: Confronto[]
  ripasso: Ripasso[]
  note: Nota[]
  testiChiave: TestoChiave[]
  percorso: Percorso | null
  /** file che non si leggono: si mostrano, non fermano il resto */
  errori: string[]
}

/** Il testo tra i due «---» iniziali; null se manca. */
export function frontmatter(src: string): string | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src.replace(/^﻿/, ''))
  return m ? m[1]! : null
}

function leggiYaml<T>(src: string, schema: z.ZodType<T>): { ok: true; dati: T } | { ok: false; errore: string } {
  const fm = frontmatter(src)
  if (fm === null) return { ok: false, errore: 'manca il blocco iniziale tra --- e ---' }
  try {
    const r = schema.safeParse(YAML.parse(fm))
    if (r.success) return { ok: true, dati: r.data }
    const p = r.error.issues[0]
    return { ok: false, errore: `${p?.path.join('.') || 'file'}: ${p?.message ?? 'non valido'}` }
  } catch (e) {
    return { ok: false, errore: (e as Error).message.split('\n')[0] ?? 'YAML non valido' }
  }
}

export const leggiConfronto = (src: string) => {
  const r = leggiYaml(src, schemaConfronto)
  if (!r.ok) return r
  const n = r.dati.colonne.length
  const storta = r.dati.righe.findIndex((x) => x.length !== n)
  return storta >= 0 ? { ok: false as const, errore: `riga ${storta + 1} della tabella: ${r.dati.righe[storta]!.length} celle invece di ${n}` } : r
}
export const leggiTestoChiave = (src: string) => leggiYaml(src, schemaTesto)
export const leggiPercorso = (src: string) => {
  const r = leggiYaml(src, schemaPercorso)
  if (!r.ok) return r
  const ids = new Set(r.dati.luoghi.map((l) => l.id))
  const t = r.dati.tappe.find((x) => !ids.has(x.luogo))
  return t ? { ok: false as const, errore: `la tappa «${t.titolo}» usa un luogo che non c'è: ${t.luogo}` } : r
}
export const leggiRipasso = (src: string) => leggiYaml(src, schemaRipasso)

/** Una nota è un file markdown: titolo «# …», testo, elenco «- …». */
export function leggiNota(id: string, src: string): Nota {
  const righe = src.replace(/^﻿/, '').split(/\r?\n/)
  let titolo = id
  const intro: string[] = []
  const voci: string[] = []
  for (const r of righe) {
    if (/^#\s+/.test(r) && titolo === id) titolo = r.replace(/^#\s+/, '').trim()
    else if (/^\s*[-*]\s+/.test(r)) voci.push(r.replace(/^\s*[-*]\s+/, '').trim())
    else if (r.trim() && voci.length === 0) intro.push(r.trim())
    else if (r.trim() && voci.length > 0) voci[voci.length - 1] += ' ' + r.trim()
  }
  return { id, titolo, intro: intro.join(' '), voci }
}
