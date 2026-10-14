// Modello «Per situazioni»: una cartella con indice.yaml (rami e ordine) e schede/<id>.yaml.
// Qui: i tipi, la lettura con zod e i controlli. Niente accesso ai file (sta in main/situazioni.ts).

import YAML from 'yaml'
import { z } from 'zod'

export const COLORI_RAMO = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'violet', 'pink', 'slate'] as const
export type ColoreRamo = (typeof COLORI_RAMO)[number]
export const LATI = ['L', 'R', 'T', 'B'] as const

const testo = z.string()
const coppiaVoce = z.object({ voce: testo, spiega: testo })
const coppiaCodice = z.object({ codice: testo, spiega: testo })

const riga = z.object({
  codice: testo,
  commento: testo.optional(),
  parti: z.array(coppiaVoce).optional(),
  trappola: testo.optional()
})
const fase = z.object({ nome: testo, righe: z.array(riga).min(1) })
const segnaposto = z.record(z.string(), z.object({ esempio: testo, spiega: testo }))

const comuni = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id non valido (minuscole, numeri e trattini)'),
  titolo: testo.min(1),
  sigla: testo.min(1),
  comando: testo.min(1),
  frase: testo,
  fonte: testo.default(''),
  parole: testo.default(''),
  varianti: z.array(coppiaCodice).default([]),
  vicine: z.array(z.string()).default([])
}

const ricetta = z.object({
  tipo: z.literal('ricetta'),
  ...comuni,
  quando: testo,
  fasi: z.array(fase).min(1),
  segnaposto: segnaposto.default({})
})
const primaDopo = z.object({
  tipo: z.literal('prima_dopo'),
  ...comuni,
  prima: testo,
  dopo: testo,
  uso: testo,
  riconoscila: testo,
  parti: z.array(coppiaVoce).default([]),
  trappola: testo.optional()
})
export const schemaScheda = z.discriminatedUnion('tipo', [ricetta, primaDopo])

const voce = z.object({ gruppo: testo.optional(), schede: z.array(z.string()).min(1) })
const ramo = z.object({
  id: z.string().min(1),
  nome: testo.min(1),
  colore: z.enum(COLORI_RAMO),
  lato: z.enum(LATI),
  voci: z.array(voce).min(1)
})
export const schemaIndice = z.object({
  modello: z.literal('per_situazioni'),
  titolo: testo.min(1),
  centro: testo.min(1),
  sottotitolo: testo.default(''),
  /** come si introduce un commento accanto al codice: «#» (shell, Python, MikroTik) o «//» (C, C++) */
  prefissoCommento: testo.default('#'),
  /** esempi mostrati nella casella di ricerca, per esempio «client senza IP, bridge, NAT» */
  esempiRicerca: testo.default(''),
  rami: z.array(ramo).min(1)
})

export type Riga = z.infer<typeof riga>
export type Fase = z.infer<typeof fase>
export type SchedaRicetta = z.infer<typeof ricetta>
export type SchedaPrimaDopo = z.infer<typeof primaDopo>
export type SchedaSit = SchedaRicetta | SchedaPrimaDopo
export type RamoSit = z.infer<typeof ramo>
export type VoceRamo = z.infer<typeof voce>
export type IndiceSit = z.infer<typeof schemaIndice>

/** Tutto quello che serve per aprire una documentazione. */
export interface Situazioni {
  rel: string
  indice: IndiceSit
  schede: Record<string, SchedaSit>
  /** id delle schede segnate come ripassate */
  ripassate: string[]
  /** problemi trovati leggendo (file che non si leggono, collegamenti rotti…): non bloccano l'apertura */
  avvisi: string[]
}

function messaggio(e: z.ZodError): string {
  return e.issues.map((i) => `${i.path.join('.') || '(radice)'}: ${i.message}`).join('; ')
}

export function leggiIndice(src: string): { indice?: IndiceSit; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `indice.yaml non si legge: ${(e as Error).message}` }
  }
  const r = schemaIndice.safeParse(dati)
  return r.success ? { indice: r.data } : { errore: `indice.yaml: ${messaggio(r.error)}` }
}

export function leggiSchedaSit(src: string, nomeFile: string): { scheda?: SchedaSit; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `${nomeFile} non si legge: ${(e as Error).message}` }
  }
  const r = schemaScheda.safeParse(dati)
  if (!r.success) return { errore: `${nomeFile}: ${messaggio(r.error)}` }
  if (`${r.data.id}.yaml` !== nomeFile) return { errore: `${nomeFile}: l'id «${r.data.id}» non corrisponde al nome del file` }
  return { scheda: r.data }
}

/** Gli id delle schede nell'ordine dell'indice (la sequenza di «Precedente / Successiva»). */
export function ordineSchede(indice: IndiceSit): string[] {
  return indice.rami.flatMap((r) => r.voci.flatMap((v) => v.schede))
}

/** Controlli sui collegamenti: schede citate ma assenti, schede non messe in nessun ramo, segnaposto non dichiarati. */
export function controllaSituazioni(indice: IndiceSit, schede: Record<string, SchedaSit>): string[] {
  const av: string[] = []
  const ordine = ordineSchede(indice)
  const visti = new Set<string>()
  for (const id of ordine) {
    if (visti.has(id)) av.push(`La scheda «${id}» compare due volte nell'indice.`)
    visti.add(id)
    if (!schede[id]) av.push(`L'indice cita «${id}» ma il file schede/${id}.yaml non c'è o non si legge.`)
  }
  for (const id of Object.keys(schede)) if (!visti.has(id)) av.push(`La scheda «${id}» non è in nessun ramo dell'indice.`)
  for (const s of Object.values(schede)) {
    for (const v of s.vicine) if (!schede[v]) av.push(`«${s.id}»: la scheda vicina «${v}» non esiste.`)
    if (s.tipo === 'ricetta') {
      const usati = new Set<string>()
      for (const f of s.fasi) for (const r of f.righe) for (const m of r.codice.matchAll(/«([A-Z0-9_]+)»/g)) usati.add(m[1]!)
      for (const u of usati) if (!s.segnaposto[u]) av.push(`«${s.id}»: il segnaposto «${u}» non è spiegato in segnaposto.`)
    }
  }
  return av
}
