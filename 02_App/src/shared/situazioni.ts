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

// Figura: lo schema di una scheda elettronica (pin sui due lati), cliccabile, con famiglie di funzioni da filtrare.
const pinDisegno = z.object({
  /** la scritta stampata sulla scheda: D34, TX0, 3V3 */
  etichetta: testo.min(1),
  gpio: testo.default(''),
  titolo: testo.default(''),
  famiglie: z.array(z.string()).default([]),
  funzioni: z.array(z.string()).default([]),
  spiega: z.array(testo).default([]),
  nota: testo.optional(),
  schede: z.array(z.string()).default([])
})
const famigliaDisegno = z.object({
  id: z.string().min(1),
  nome: testo.min(1),
  colore: z.enum(COLORI_RAMO),
  schede: z.array(z.string()).default([])
})
export const schemaDisegno = z.object({
  modello: z.literal('scheda_pin'),
  nome: testo.min(1),
  chip: testo.default(''),
  famiglie: z.array(famigliaDisegno).default([]),
  sinistra: z.array(pinDisegno).min(1),
  destra: z.array(pinDisegno).min(1),
  /** parti già presenti sulla scheda (LED, pulsanti…), mostrate sotto il disegno */
  componenti: z.array(z.object({ nome: testo.min(1), spiega: testo })).default([])
})
const figura = z.object({
  tipo: z.literal('figura'),
  ...comuni,
  quando: testo,
  disegno: schemaDisegno
})

// Regola di matematica (modello_matematica.md): riconosci, formula, adattamenti, esempi svolti, errore, confusioni.
const passoRegola = z.union([
  testo,
  /** passo con motivazione (dimostrazioni): dice = cosa affermo, perche = a parole, scheda = la regola che lo giustifica */
  z.object({ dice: testo.min(1), perche: testo.optional(), scheda: z.string().optional() })
])
export const VERIFICHE = ['derivata', 'scomposizione'] as const
const esempioRegola = z.object({
  da: testo.min(1),
  passi: z.array(passoRegola).default([]),
  ris: testo.min(1),
  /** come il test controlla l'esempio con i numeri; assente = nessun controllo automatico */
  verifica: z.enum(VERIFICHE).optional()
})
const formule = z.union([testo.min(1), z.array(testo.min(1)).min(1)])
const regola = z.object({
  tipo: z.literal('regola'),
  ...comuni,
  /** se manca si usa «vedo» */
  frase: testo.default(''),
  /** sulla foglia della mappa: se manca si usa la prima formula */
  comando: testo.default(''),
  /** cosa vedo nell'esercizio; facoltativo per le formule da ricordare */
  vedo: testo.optional(),
  formula: formule,
  adatto: z.array(testo).default([]),
  esempi: z.array(esempioRegola).default([]),
  errore: testo.optional(),
  confondi: z.array(z.object({ scheda: z.string(), differenza: testo })).default([]),
  perche: testo.optional()
})
export const schemaScheda = z.discriminatedUnion('tipo', [ricetta, primaDopo, figura, regola])

const voce = z.object({ gruppo: testo.optional(), schede: z.array(z.string()).min(1) })
const ramo = z.object({
  id: z.string().min(1),
  nome: testo.min(1),
  colore: z.enum(COLORI_RAMO),
  lato: z.enum(LATI).default('R'),
  /** true = i passi vanno fatti in ordine (pill numerate 1, 2, 3…) */
  ordine: z.boolean().default(false),
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
  /** matematica: come si riconosce l'esercizio (una frase) e la domanda da farsi */
  ingresso: testo.default(''),
  guida: testo.default(''),
  rami: z.array(ramo).min(1)
})

export type Riga = z.infer<typeof riga>
export type Fase = z.infer<typeof fase>
export type SchedaRicetta = z.infer<typeof ricetta>
export type SchedaPrimaDopo = z.infer<typeof primaDopo>
export type SchedaFigura = z.infer<typeof figura>
export type DisegnoSit = z.infer<typeof schemaDisegno>
export type PinDisegno = z.infer<typeof pinDisegno>
export type SchedaRegola = z.infer<typeof regola>
export type EsempioRegola = z.infer<typeof esempioRegola>
export type PassoRegola = z.infer<typeof passoRegola>
export type SchedaSit = SchedaRicetta | SchedaPrimaDopo | SchedaFigura | SchedaRegola
export type RamoSit = z.infer<typeof ramo>
export type VoceRamo = z.infer<typeof voce>
export type IndiceSit = z.infer<typeof schemaIndice>

// esercizi.yaml: esercizi veri con il «piano» (le schede da usare, in ordine).
export const schemaEsercizi = z.object({
  esercizi: z.array(z.object({
    testo: testo.min(1),
    risultato: testo.default(''),
    piano: z.array(z.object({ scheda: z.string().min(1), nota: testo.default('') })).min(1)
  })).default([])
})
export type EserciziSit = z.infer<typeof schemaEsercizi>

export function leggiEsercizi(src: string): { esercizi?: EserciziSit; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `esercizi.yaml non si legge: ${(e as Error).message}` }
  }
  const r = schemaEsercizi.safeParse(dati)
  return r.success ? { esercizi: r.data } : { errore: `esercizi.yaml: ${messaggio(r.error)}` }
}

/** Tutto quello che serve per aprire una documentazione. */
export interface Situazioni {
  rel: string
  indice: IndiceSit
  schede: Record<string, SchedaSit>
  /** esercizi veri con il piano (solo matematica) */
  esercizi?: EserciziSit
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
  if (r.data.tipo === 'regola' && !r.data.frase) r.data.frase = r.data.vedo ?? ''
  if (r.data.tipo === 'regola' && !r.data.comando) r.data.comando = Array.isArray(r.data.formula) ? r.data.formula[0]! : r.data.formula
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
    if (s.tipo === 'figura') {
      const fam = new Set(s.disegno.famiglie.map((f) => f.id))
      for (const f of s.disegno.famiglie) for (const v of f.schede) if (!schede[v]) av.push(`«${s.id}»: la famiglia «${f.id}» cita la scheda «${v}» che non esiste.`)
      for (const p of [...s.disegno.sinistra, ...s.disegno.destra]) {
        for (const f of p.famiglie) if (!fam.has(f)) av.push(`«${s.id}»: il pin «${p.etichetta}» ha la famiglia «${f}» che non è dichiarata.`)
        for (const v of p.schede) if (!schede[v]) av.push(`«${s.id}»: il pin «${p.etichetta}» cita la scheda «${v}» che non esiste.`)
      }
    }
    if (s.tipo === 'regola') {
      for (const c of s.confondi) if (!schede[c.scheda]) av.push(`«${s.id}»: «confondi» cita la scheda «${c.scheda}» che non esiste.`)
      for (const e of s.esempi) for (const p of e.passi) if (typeof p !== 'string' && p.scheda && !schede[p.scheda]) av.push(`«${s.id}»: un passo cita la scheda «${p.scheda}» che non esiste.`)
    }
    if (s.tipo === 'ricetta') {
      const usati = new Set<string>()
      for (const f of s.fasi) for (const r of f.righe) for (const m of r.codice.matchAll(/«([A-Z0-9_]+)»/g)) usati.add(m[1]!)
      for (const u of usati) if (!s.segnaposto[u]) av.push(`«${s.id}»: il segnaposto «${u}» non è spiegato in segnaposto.`)
    }
  }
  return av
}

/** Controlli su esercizi.yaml: ogni passo del piano deve citare una scheda che esiste. */
export function controllaEsercizi(esercizi: EserciziSit, schede: Record<string, SchedaSit>): string[] {
  const av: string[] = []
  esercizi.esercizi.forEach((e, i) => {
    for (const p of e.piano) if (!schede[p.scheda]) av.push(`Esercizio ${i + 1}: il piano cita la scheda «${p.scheda}» che non esiste.`)
  })
  return av
}
