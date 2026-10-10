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

export interface Modello {
  autore: Autore
  temi: Tema[]
  glossario: VoceGlossario[]
  schede: Scheda[]
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
  duplicaScheda(id: string): Promise<{ id: string; modello: Modello }>
  aggiornaAutore(patch: AutorePatch): Promise<Modello>
  aggiornaTemi(temi: Tema[]): Promise<Modello>
  mostraCartella(): Promise<void>
  /** zoom di tutta l'interfaccia (1 = 100%) */
  zoom(fattore: number): void
  onModello(cb: (e: EventoModello) => void): () => void
}
