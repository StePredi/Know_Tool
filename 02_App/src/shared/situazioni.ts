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

// Spiegazione: la teoria senza codice, scritta in testo normale con riquadri, tabelle e disegni
// (come nelle slide del corso). I disegni sono di due modelli soltanto:
//   pile   → livelli impilati (hardware, SO, hypervisor, layer…), una o più colonne affiancate
//   flusso → riquadri in fila collegati da frecce con un'etichetta (client → daemon → registry)
export const TONI = ['chiaro', 'oro', 'colore', 'scuro'] as const
export type Tono = (typeof TONI)[number]
const testiRiga = z.union([testo.min(1), z.array(testo.min(1)).min(1)])
/** un livello: un riquadro solo, più riquadri affiancati (lista), oppure { testo, tono } */
const strato = z.union([testiRiga, z.object({ testo: testiRiga, tono: z.enum(TONI).default('chiaro') })])
const colonnaPila = z.object({
  titolo: testo.default(''),
  /** riquadro tratteggiato attorno ai livelli, con questa etichetta (per esempio «Sistema host») */
  cornice: testo.optional(),
  /** dall'alto verso il basso, come si vedono nel disegno */
  strati: z.array(strato).min(1),
  nota: testo.default('')
})
const disegnoPile = z.object({ modello: z.literal('pile'), colonne: z.array(colonnaPila).min(1), nota: testo.default('') })
const nodoFlusso = z.union([
  testo.min(1),
  z.object({ nome: testo.min(1), sotto: testo.default(''), punti: z.array(testo).default([]), tono: z.enum(TONI).default('chiaro') })
])
const disegnoFlusso = z.object({
  modello: z.literal('flusso'),
  nodi: z.array(nodoFlusso).min(2),
  /** l'etichetta di ogni freccia, fra un nodo e il successivo ('' = freccia senza scritta) */
  frecce: z.array(testo).default([]),
  /** riquadro tratteggiato attorno ai nodi da…a (contati da 1) */
  gruppo: z.object({ nome: testo.min(1), da: z.number().int().positive(), a: z.number().int().positive() }).optional(),
  nota: testo.default('')
})
export const schemaDisegnoSpieg = z.discriminatedUnion('modello', [disegnoPile, disegnoFlusso])
const carta = z.object({
  titolo: testo.min(1),
  /** riga breve sotto il titolo, in corsivo colorato */
  sotto: testo.default(''),
  /** pillola accanto al titolo, per esempio «Consigliato» */
  etichetta: testo.default(''),
  testo: testo.default(''),
  punti: z.array(testo).default([]),
  numeri: z.array(z.object({ valore: testo.min(1), cosa: testo.default('') })).default([])
})
const blocco = z.union([
  z.strictObject({ titolo: testo.min(1) }),
  z.strictObject({ testo: testo.min(1) }),
  z.strictObject({ punti: z.array(testo.min(1)).min(1) }),
  z.strictObject({ carte: z.array(carta).min(1) }),
  z.strictObject({ tabella: z.object({ colonne: z.array(testo).min(2), righe: z.array(z.array(testo)).min(1) }) }),
  z.strictObject({ disegno: schemaDisegnoSpieg }),
  z.strictObject({ comandi: z.array(coppiaCodice).min(1) }),
  z.strictObject({ nota: testo.min(1) }),
  z.strictObject({ trappola: testo.min(1) })
])
const spiegazione = z.object({
  tipo: z.literal('spiegazione'),
  ...comuni,
  quando: testo,
  blocchi: z.array(blocco).min(1)
})
export type BloccoSpieg = z.infer<typeof blocco>
export type DisegnoSpieg = z.infer<typeof schemaDisegnoSpieg>
export type StratoPila = z.infer<typeof strato>
export type NodoFlusso = z.infer<typeof nodoFlusso>
export type CartaSpieg = z.infer<typeof carta>

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

// ── Storia (modello_storia.md) ────────────────────────────────────────────
// Due tipi nuovi: «voce» (evento, persona, concetto, processo) e «confronto».
// I cinque campi di contenuto sono quelli con cui il libro apre i capitoli:
// quando · dove · chi · cosa · perché è importante.
export const GENERI = ['evento', 'persona', 'concetto', 'processo'] as const
export type GenereVoce = (typeof GENERI)[number]
/** i modi in cui due voci si legano; li dichiara il libro a parole */
export const TIPI_LEGA = ['causa', 'conseguenza', 'prosegue', 'chiude', 'sincronia', 'esempio', 'giustifica', 'confronto', 'usa', 'prepara', 'deformato_in', 'formulato_da'] as const
export type TipoLega = (typeof TIPI_LEGA)[number]
export const ETICHETTA_LEGA: Record<TipoLega, string> = {
  causa: 'causa', conseguenza: 'conseguenza di', prosegue: 'prosegue in', chiude: 'chiude',
  sincronia: 'nello stesso periodo', esempio: 'per esempio', giustifica: 'giustifica',
  confronto: 'a confronto in', usa: 'si appoggia a', prepara: 'prepara',
  deformato_in: 'deformato in', formulato_da: 'formulato da'
}

/** da dove viene: libro, capitolo, paragrafo. La fonte in chiaro si ricava da _libri.yaml. */
const riferimento = z.object({
  l: z.string().min(1),
  c: z.number().int().positive(),
  p: z.number().int().positive().optional(),
  /** «box «Ernst Haeckel»», «riquadro Punti di svolta» */
  dove: testo.default('')
})
const legame = z.object({
  scheda: z.string().min(1),
  /** se c'è, la scheda sta in un altro documento: si segnala, non si controlla */
  documento: z.string().optional(),
  tipo: z.enum(TIPI_LEGA),
  perche: testo.default('')
})
const comuniStoria = {
  id: comuni.id,
  titolo: testo.min(1),
  /** se manca si usa il titolo */
  sigla: testo.default(''),
  /** sulla foglia della mappa: se manca si usa «quando» */
  comando: testo.default(''),
  frase: testo.default(''),
  fonte: testo.default(''),
  parole: testo.default(''),
  varianti: z.array(coppiaCodice).default([]),
  vicine: z.array(z.string()).default([]),
  da: z.array(riferimento).default([])
}
const voceStoria = z.object({
  tipo: z.literal('voce'),
  ...comuniStoria,
  genere: z.enum(GENERI),
  quando: testo.default(''),
  dove: testo.default(''),
  chi: z.array(testo).default([]),
  cosa: testo.min(1),
  conta: testo.min(1),
  /** punto di svolta: qui la vicenda cambia direzione */
  svolta: z.boolean().default(false),
  svolgimento: z.array(z.object({ quando: testo.default(''), passo: testo.min(1) })).default([]),
  elementi: z.array(z.object({ nome: testo.min(1), spiega: testo.min(1) })).default([]),
  numeri: z.array(z.object({ cosa: testo.min(1), valore: testo.min(1) })).default([]),
  citazioni: z.array(z.object({ testo: testo.min(1), chi: testo.default(''), dove: testo.default('') })).default([]),
  storiografia: z.array(z.object({ autore: testo.min(1), titolo: testo.min(1), pagina: testo.default('') })).default([]),
  errore: testo.optional(),
  nota: testo.optional(),
  confondi: z.array(z.object({ scheda: z.string(), differenza: testo })).default([]),
  lega: z.array(legame).default([])
})
const confrontoStoria = z.object({
  tipo: z.literal('confronto'),
  ...comuniStoria,
  /** le stesse domande per tutti i casi */
  domande: z.array(testo.min(1)).min(2),
  casi: z.array(z.object({
    nome: testo.min(1),
    /** la voce di dettaglio, se esiste */
    scheda: z.string().optional(),
    risposte: z.array(testo).min(1)
  })).min(2)
})

export const schemaScheda = z.discriminatedUnion('tipo', [ricetta, primaDopo, figura, spiegazione, regola, voceStoria, confrontoStoria])

const voce = z.object({ gruppo: testo.optional(), schede: z.array(z.string()).min(1) })
const ramo = z.object({
  id: z.string().min(1),
  nome: testo.min(1),
  colore: z.enum(COLORI_RAMO),
  lato: z.enum(LATI).default('R'),
  /** true = i passi vanno fatti in ordine (pill numerate 1, 2, 3…) */
  ordine: z.boolean().default(false),
  /** storia: gli anni coperti dal ramo, accanto al nome */
  quando: testo.default(''),
  voci: z.array(voce).min(1)
})
export const schemaIndice = z.object({
  modello: z.literal('per_situazioni'),
  /** con quale schermata si apre: la mappa a rami (default) o la vista di Storia */
  vista: z.enum(['situazioni', 'storia']).default('situazioni'),
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
export type SchedaSpiegazione = z.infer<typeof spiegazione>
export type DisegnoSit = z.infer<typeof schemaDisegno>
export type PinDisegno = z.infer<typeof pinDisegno>
export type SchedaRegola = z.infer<typeof regola>
export type EsempioRegola = z.infer<typeof esempioRegola>
export type PassoRegola = z.infer<typeof passoRegola>
export type SchedaVoce = z.infer<typeof voceStoria>
export type SchedaConfronto = z.infer<typeof confrontoStoria>
export type Legame = z.infer<typeof legame>
export type Riferimento = z.infer<typeof riferimento>
export type SchedaSit = SchedaRicetta | SchedaPrimaDopo | SchedaFigura | SchedaSpiegazione | SchedaRegola | SchedaVoce | SchedaConfronto
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
  /** i libri della materia (solo per i documenti di Storia): servono per la fonte in chiaro */
  libri?: Libri
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
  if (r.data.tipo === 'voce' || r.data.tipo === 'confronto') {
    if (!r.data.sigla) r.data.sigla = r.data.titolo
    if (r.data.tipo === 'voce') {
      if (!r.data.comando) r.data.comando = r.data.quando
      if (!r.data.frase) r.data.frase = r.data.cosa
    } else if (!r.data.frase) r.data.frase = r.data.domande.join(' · ')
  }
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
    if (s.tipo === 'voce') {
      for (const c of s.confondi) if (!schede[c.scheda]) av.push(`«${s.id}»: «confondi» cita la scheda «${c.scheda}» che non esiste.`)
      for (const g of s.lega) {
        if (g.documento) continue // un collegamento verso un altro documento si segnala solo quando quel documento c'è
        if (!schede[g.scheda]) av.push(`«${s.id}»: il collegamento «${ETICHETTA_LEGA[g.tipo]}» cita la scheda «${g.scheda}» che non esiste.`)
      }
    }
    if (s.tipo === 'confronto') {
      for (const c of s.casi) {
        if (c.risposte.length !== s.domande.length) av.push(`«${s.id}»: il caso «${c.nome}» ha ${c.risposte.length} risposte ma le domande sono ${s.domande.length}.`)
        if (c.scheda && !schede[c.scheda]) av.push(`«${s.id}»: il caso «${c.nome}» cita la scheda «${c.scheda}» che non esiste.`)
      }
    }
    if (s.tipo === 'spiegazione') {
      s.blocchi.forEach((b, i) => {
        if ('tabella' in b) b.tabella.righe.forEach((r, k) => { if (r.length !== b.tabella.colonne.length) av.push(`«${s.id}»: la tabella del blocco ${i + 1}, riga ${k + 1}, ha ${r.length} celle ma le colonne sono ${b.tabella.colonne.length}.`) })
        if ('disegno' in b && b.disegno.modello === 'flusso') {
          const d = b.disegno
          if (d.frecce.length > d.nodi.length - 1) av.push(`«${s.id}»: il flusso del blocco ${i + 1} ha più frecce (${d.frecce.length}) che spazi fra i nodi (${d.nodi.length - 1}).`)
          if (d.gruppo && (d.gruppo.da > d.gruppo.a || d.gruppo.a > d.nodi.length)) av.push(`«${s.id}»: il gruppo del flusso nel blocco ${i + 1} va da ${d.gruppo.da} a ${d.gruppo.a}, ma i nodi sono ${d.nodi.length}.`)
        }
      })
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

// ── _libri.yaml: i libri della materia ────────────────────────────────────
// Si scrive una volta, dall'indice del libro. Serve per due cose: la fonte in
// chiaro di ogni scheda e la vista «Copertura del libro».
const paragrafoLibro = z.object({ n: z.number().int().positive(), titolo: testo.min(1), pp: testo.default('') })
const capitoloLibro = z.object({ n: z.number().int().positive(), titolo: testo.min(1), pp: testo.default(''), paragrafi: z.array(paragrafoLibro).default([]) })
export const schemaLibri = z.object({
  libri: z.record(z.string(), z.object({ titolo: testo.min(1), capitoli: z.array(capitoloLibro).default([]) }))
})
export type Libri = z.infer<typeof schemaLibri>['libri']
export type CapitoloLibro = z.infer<typeof capitoloLibro>

export function leggiLibri(src: string): { libri?: Libri; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `_libri.yaml non si legge: ${(e as Error).message}` }
  }
  const r = schemaLibri.safeParse(dati)
  return r.success ? { libri: r.data.libri } : { errore: `_libri.yaml: ${messaggio(r.error)}` }
}

/** «Q cap. 2 par. 5 — L'Impero austro-ungarico», ricavato dai libri della materia. */
export function fonteInChiaro(d: Riferimento, libri?: Libri): string {
  let s = `${d.l} cap. ${d.c}`
  if (d.p) s += ` par. ${d.p}`
  const cap = libri?.[d.l]?.capitoli.find((c) => c.n === d.c)
  const par = d.p ? cap?.paragrafi.find((x) => x.n === d.p) : undefined
  const titolo = par?.titolo ?? (d.p ? undefined : cap?.titolo)
  if (titolo) s += ` — ${titolo}`
  if (d.dove) s += ` (${d.dove})`
  return s
}

/** Una riga della vista «Copertura del libro»: un paragrafo e le schede che lo coprono. */
export interface RigaCopertura {
  libro: string
  capitolo: number
  titoloCapitolo: string
  paragrafo: number
  titolo: string
  schede: { rel: string; documento: string; id: string; titolo: string }[]
}
export interface DocumentoMateria {
  rel: string
  titolo: string
  schede: { id: string; titolo: string; da: Riferimento[] }[]
}

export function copertura(libri: Libri, documenti: DocumentoMateria[]): RigaCopertura[] {
  const righe: RigaCopertura[] = []
  for (const [sigla, libro] of Object.entries(libri)) {
    for (const cap of libro.capitoli) {
      for (const par of cap.paragrafi) {
        const schede = documenti.flatMap((d) =>
          d.schede.filter((s) => s.da.some((x) => x.l === sigla && x.c === cap.n && x.p === par.n))
            .map((s) => ({ rel: d.rel, documento: d.titolo, id: s.id, titolo: s.titolo }))
        )
        righe.push({ libro: libro.titolo, capitolo: cap.n, titoloCapitolo: cap.titolo, paragrafo: par.n, titolo: par.titolo, schede })
      }
    }
  }
  return righe
}

