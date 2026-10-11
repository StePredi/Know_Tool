// Tipi condivisi tra processo principale e interfaccia.
// Nomi dei campi = nomi dei file (formato_studio_italiano.md), non quelli abbreviati della demo.

export type Gravita = 'errore' | 'avviso'

export interface Problema {
  gravita: Gravita
  /** codice breve, utile per filtrare e per i test */
  codice: string
  /** percorso relativo alla cartella dell'autore, es. "schede/fuga.md" */
  file: string
  messaggio: string
  /** id della scheda coinvolta, se c'è */
  scheda?: string
}

export interface Corsia {
  id: string
  nome: string
  sigla: string
  tonalita: number
}

export interface Periodo {
  nome: string
  data: string
  /** fine inclusiva, facoltativa */
  fine?: string
}

export interface Tema {
  id: string
  nome: string
  colore?: string
}

export interface Tabella {
  /** riga introduttiva (può essere vuota) */
  intro: string
  colonne: string[]
  righe: string[][]
}

export interface Scheda {
  id: string
  corsia: string
  data: string
  titolo_breve: string
  titolo: string
  temi: string[]
  /** collegamenti scritti in QUESTA scheda (un lato solo) */
  collegamenti: string[]
  testi: string[]
  pagine: string
  fuori_dal_libro: boolean
  riassunto: string
  dettagli: string[]
  attenzione: string
  tabella: Tabella | null
  /** percorso relativo del file */
  file: string
}

/** Campi modificabili di una scheda: la scrittura applica solo questi, il resto del file resta com'è. */
export type SchedaPatch = Partial<
  Pick<
    Scheda,
    | 'corsia'
    | 'data'
    | 'titolo_breve'
    | 'titolo'
    | 'temi'
    | 'collegamenti'
    | 'pagine'
    | 'fuori_dal_libro'
    | 'riassunto'
    | 'dettagli'
    | 'attenzione'
    | 'tabella'
  >
>

export interface VoceGlossario {
  termine: string
  definizione: string
  schede: string[]
}

export interface Autore {
  id: string
  nome: string
  nascita: number | null
  morte: number | null
  corsie: Corsia[]
  periodi: Periodo[]
}

// ---------- testi e editor ----------

export type Layout = 'verso' | 'prosa'
export type Evidenzia = 'concetto' | 'definizione' | 'dubbio'
export type StatoRiaggancio = 'ok' | 'riagganciata' | 'ambigua' | 'rotta'
export type Span = [number, number]
export type TipoFigura = 'suono' | 'ordine' | 'significato' | 'sintassi'

export interface Figura {
  id: string
  nome: string
  tipo: TipoFigura
  descrizione: string
  esempio: string
}

/** Un punto del testo: `span` è quello valido adesso (dopo l'eventuale riaggancio), `spanScritto` quello che c'è nel file. */
export interface Ancora {
  span: Span | null
  citato: string | null
  /** calcolato a ogni lettura, mai scritto */
  stato: StatoRiaggancio
  spanScritto: Span | null
}

export interface SchedaCitata {
  id: string
  frase: string
}

export interface Annotazione extends Ancora {
  id: string
  evidenzia: Evidenzia | null
  figura: string | null
  parola_chiave: boolean
  sottolinea: boolean
  nota: string
  flashcard: boolean
  schede: SchedaCitata[]
}

export interface Parafrasi extends Ancora {
  id: string
  ordine: number
  testo: string
}

export interface Passo extends Ancora {
  /** etichetta breve scritta a mano, es. «v. 1-4» */
  et: string
}

export interface Esercizio {
  id: string
  numero: number
  testo: string
  risposta: string
  correzione: string
  fatta: boolean
  passi: Passo[]
}

export interface Testo {
  id: string
  titolo: string
  /** scheda-opera che lo contiene (ponte verso la mappa) */
  scheda: string | null
  layout: Layout
  fonte: string
  anno: string
  opera: string
  corpo: string
  /** percorso relativo del testo.md */
  file: string
  annotazioni: Annotazione[]
  parafrasi: Parafrasi[]
  esercizi: Esercizio[]
}

export type Raccolta = 'annotazioni' | 'parafrasi' | 'esercizi'

/** Come si scrive una voce: i campi calcolati (stato, spanScritto) non ci sono. */
export type VoceScritta = Record<string, unknown> & { id?: string }

export interface NuovoTesto {
  titolo: string
  anno?: string
  opera?: string
  layout: Layout
  corpo: string
  scheda?: string | null
}

export interface EsitoRiaggancio {
  riagganciate: number
  daSistemare: number
}

export interface Modello {
  autore: Autore
  temi: Tema[]
  glossario: VoceGlossario[]
  schede: Scheda[]
  testi: Testo[]
  figure: Figura[]
  problemi: Problema[]
}

export interface AutorePatch {
  nome?: string
  corsie?: Corsia[]
  periodi?: Periodo[]
}

export interface StatoApp {
  radice: string | null
  autori: { id: string; nome: string }[]
  autoreId: string | null
  modello: Modello | null
  /** errore bloccante (cartella non valida, autore illeggibile…): l'app lo mostra e non si rompe */
  errore: string | null
}

export interface EventoModello {
  modello: Modello
  /** file cambiati dall'esterno (AI, editor di testo…) dall'ultimo evento; vuoto se è una nostra scrittura */
  esterni: string[]
}

export interface NuovaScheda {
  corsia?: string
  data?: string
  titolo_breve?: string
}

export interface Api {
  stato(): Promise<StatoApp>
  scegliRadice(): Promise<StatoApp>
  scegliAutore(id: string): Promise<StatoApp>
  aggiornaScheda(id: string, patch: SchedaPatch): Promise<Modello>
  creaScheda(nuova: NuovaScheda): Promise<{ id: string; modello: Modello }>
  eliminaScheda(id: string): Promise<{ modello: Modello; archiviata: string; collegamentiTolti: number; vociTolte: number }>
  duplicaScheda(id: string): Promise<{ id: string; modello: Modello }>
  aggiornaAutore(patch: AutorePatch): Promise<Modello>
  aggiornaTemi(temi: Tema[]): Promise<Modello>
  eliminaTema(id: string): Promise<{ modello: Modello; schedeToccate: number }>
  eliminaCorsia(id: string, verso: string | null): Promise<{ modello: Modello; schedeSpostate: number }>
  mostraCartella(): Promise<void>
  /** testi: ogni scrittura restituisce il modello aggiornato */
  creaTesto(nuovo: NuovoTesto): Promise<{ id: string; modello: Modello }>
  eliminaTesto(id: string): Promise<{ modello: Modello; archiviato: string }>
  aggiornaTesto(id: string, patch: { layout?: Layout; titolo?: string; anno?: string; opera?: string; scheda?: string | null }): Promise<Modello>
  /** sostituisce il corpo del testo e riaggancia annotazioni, parafrasi e passi degli esercizi */
  modificaCorpo(id: string, corpo: string): Promise<{ modello: Modello; esito: EsitoRiaggancio }>
  salvaVoce(testoId: string, raccolta: Raccolta, voce: VoceScritta): Promise<{ id: string; modello: Modello }>
  eliminaVoce(testoId: string, raccolta: Raccolta, id: string): Promise<Modello>
  /** scrive l'intera raccolta (importazione domande, rinumerazione, riordino) */
  salvaRaccolta(testoId: string, raccolta: Raccolta, voci: VoceScritta[]): Promise<Modello>
  /** zoom di tutta l'interfaccia (1 = 100%) */
  zoom(fattore: number): void
  onModello(cb: (e: EventoModello) => void): () => void
}
