// Modello «Matematica»: una cartella con argomento.yaml (ordine delle regole, come si riconosce) e regole/<id>.yaml.
// Qui: i tipi, la lettura con zod e i controlli. Niente accesso ai file (sta in main/matematica.ts).
// Le formule sono testo normale tra apici inversi (`x^2-9`): la schermata le disegna in forma leggibile.

import YAML from 'yaml'
import { z } from 'zod'

const testo = z.string()
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id non valido (minuscole, numeri e trattini)')

/** Il «pezzo centrale» interattivo del riconoscitore: dipende dalla forma dell'argomento. */
export const MOTORI = ['scomposizione', 'disequazioni'] as const
export type Motore = (typeof MOTORI)[number]

export const schemaArgomento = z.object({
  modello: z.literal('matematica'),
  titolo: testo.min(1),
  /** una riga: a cosa serve questo argomento */
  introduzione: testo.default(''),
  /** il calcolatore interattivo (lista di controllo, linea dei segni…); senza, restano le schede */
  motore: z.enum(MOTORI).optional(),
  /** gli id delle regole nell'ordine in cui si provano / si studiano */
  ordine: z.array(id).default([]),
  /** esempi da provare con un clic nel calcolatore (testo normale) */
  esempi: z.array(testo).default([]),
  /** scritto da Claude e non ancora corretto da Ste */
  bozza: z.boolean().default(false)
})

const esempio = z.object({
  /** l'esercizio, in testo normale */
  da: testo.min(1),
  /** i passaggi (ogni riga può contenere formule tra `apici`) */
  passi: z.array(testo).default([]),
  /** il risultato finale, in testo normale */
  risultato: testo.default('')
})
const confondi = z.object({
  /** id di un'altra regola, oppure un nome libero */
  con: testo.min(1),
  differenza: testo.min(1)
})
/** Il disegno che accompagna una domanda di «Riconosci»: un vocabolario piccolo, così ogni domanda ha la sua immagine. */
export const schemaFigura = z.discriminatedUnion('tipo', [
  /** i pezzi (termini) separati dai loro segni */
  z.object({ tipo: z.literal('pezzi'), termini: z.array(testo).min(1), segni: z.array(testo).default([]) }),
  /** ogni termine come quadrato: con `lato` è un quadrato perfetto, con `n` (un numero) si disegna a quadratini, senza niente non lo è */
  z.object({
    tipo: z.literal('quadrati'),
    termini: z.array(z.object({ t: testo, lato: testo.optional(), n: z.number().int().positive().optional() })).min(1)
  }),
  /** il segno in mezzo: meno = si toglie un angolo, più = i quadrati restano attaccati */
  z.object({ tipo: z.literal('segno'), segno: z.enum(['+', '-']) }),
  /** ogni termine scritto come prodotto di fattori; i fattori in `comune` sono evidenziati (il raccoglimento) */
  z.object({
    tipo: z.literal('fattori'),
    termini: z.array(z.object({ t: testo, fattori: z.array(testo).min(1) })).min(1),
    comune: z.array(testo).default([])
  }),
  /** niente da disegnare: la domanda non si applica */
  z.object({ tipo: z.literal('nessuna'), testo: testo.default('') })
])
const domanda = z.object({
  titolo: testo.min(1),
  risposta: z.enum(['si', 'no', 'na']),
  figura: schemaFigura,
  /** una riga sotto il disegno */
  nota: testo.default('')
})
const esitoRiconosci = z.object({ ok: z.boolean(), testo: testo.min(1) })
/** Un'espressione da guardare con le domande del riconoscimento. */
const riconosciEsempio = z.object({
  da: testo.min(1),
  domande: z.array(domanda).min(1),
  esito: esitoRiconosci
})
const opzione = z.object({ testo: testo.min(1), giusta: z.boolean().default(false), perche: testo.min(1) })
const passoGuidato = z.object({
  domanda: testo.min(1),
  opzioni: z.array(opzione).min(2),
  /** cosa si legge dopo aver risposto giusto (testo con formule tra apici) */
  dopo: testo.min(1)
})
/** Un esercizio guidato: a ogni passo si sceglie la mossa, e se sbagli ti dice perché. */
const esercizio = z.object({ da: testo.min(1), passi: z.array(passoGuidato).min(1) })

export const schemaRegola = z.object({
  id,
  nome: testo.min(1),
  /** come si riconosce: cosa si vede nell'esercizio */
  riconosci: testo.min(1),
  /** cosa si fa */
  fai: testo.min(1),
  /** la formula da ricordare, in testo normale */
  formula: testo.default(''),
  esempi: z.array(esempio).default([]),
  errore: testo.default(''),
  confondi: z.array(confondi).default([]),
  /** quale controllo del calcolatore è questa regola (es. «raccoglimento-totale») */
  controllo: testo.optional(),
  /** colore della regola (#rrggbb); se manca, ne viene scelto uno in base alla posizione */
  colore: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'colore non valido: usa #rrggbb').optional(),
  /** CAPISCI: la spiegazione da zero, un paragrafo per voce (formule tra apici) */
  capisci: z.array(testo).default([]),
  /** CAPISCI: il disegno animato (per ora solo «ricomposizione» = differenza di quadrati) */
  animazione: z.enum(['ricomposizione']).optional(),
  /** RICONOSCI: espressioni da provare, ognuna con le sue domande e i suoi disegni */
  riconosciEsempi: z.array(riconosciEsempio).default([]),
  /** FAI E PROVA: esercizi a scelta guidata */
  esercizi: z.array(esercizio).default([])
})

export type Argomento = z.infer<typeof schemaArgomento>
export type Regola = z.infer<typeof schemaRegola>
export type EsempioRegola = z.infer<typeof esempio>
export type Figura = z.infer<typeof schemaFigura>
export type DomandaRiconosci = z.infer<typeof domanda>
export type EsercizioGuidato = z.infer<typeof esercizio>

/** Tutto quello che serve per aprire un argomento. */
export interface Matematica {
  rel: string
  argomento: Argomento
  regole: Record<string, Regola>
  /** id delle regole segnate come ripassate */
  ripassate: string[]
  /** problemi trovati leggendo: non bloccano l'apertura */
  avvisi: string[]
}

const messaggio = (e: z.ZodError): string => e.issues.map((i) => `${i.path.join('.') || '(radice)'}: ${i.message}`).join('; ')

export function leggiArgomento(src: string): { argomento?: Argomento; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `argomento.yaml non si legge: ${(e as Error).message}` }
  }
  const r = schemaArgomento.safeParse(dati)
  return r.success ? { argomento: r.data } : { errore: `argomento.yaml: ${messaggio(r.error)}` }
}

export function leggiRegola(src: string, nomeFile: string): { regola?: Regola; errore?: string } {
  let dati: unknown
  try {
    dati = YAML.parse(src)
  } catch (e) {
    return { errore: `${nomeFile} non si legge: ${(e as Error).message}` }
  }
  const r = schemaRegola.safeParse(dati)
  if (!r.success) return { errore: `${nomeFile}: ${messaggio(r.error)}` }
  if (`${r.data.id}.yaml` !== nomeFile) return { errore: `${nomeFile}: l'id «${r.data.id}» non corrisponde al nome del file` }
  return { regola: r.data }
}

/** Collegamenti rotti: regole citate e assenti, regole non messe nell'ordine, «confondi con» verso regole che non esistono. */
export function controllaMatematica(a: Argomento, regole: Record<string, Regola>): string[] {
  const av: string[] = []
  const visti = new Set<string>()
  for (const i of a.ordine) {
    if (visti.has(i)) av.push(`La regola «${i}» compare due volte nell'ordine.`)
    visti.add(i)
    if (!regole[i]) av.push(`L'ordine cita «${i}» ma il file regole/${i}.yaml non c'è o non si legge.`)
  }
  for (const i of Object.keys(regole)) if (!visti.has(i)) av.push(`La regola «${i}» non è nell'ordine di argomento.yaml.`)
  return av
}

/** Pezzi di una frase: testo semplice e formule (tra apici inversi). */
export function spezzaFormule(s: string): { formula: boolean; testo: string }[] {
  const out: { formula: boolean; testo: string }[] = []
  s.split('`').forEach((p, i) => {
    if (p === '') return
    out.push({ formula: i % 2 === 1, testo: p })
  })
  return out
}
