// Tipi condivisi tra processo principale e interfaccia.
// Nomi dei campi = nomi dei file (formato_studio_italiano.md), non quelli abbreviati della demo.

import type { Situazioni } from './situazioni'

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
  /** analisi del testo (di solito scritte dall'AI): testo libero, anche con elenchi */
  struttura: string
  contesto: string
  citazioni: string
  domande: string
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
    | 'struttura'
    | 'contesto'
    | 'citazioni'
    | 'domande'
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
  /** proposta di scheda scritta dall'AI, in attesa che lo studente la confermi */
  proposta: PropostaScheda | null
}

/** Una proposta di scheda riassuntiva (file `proposta_scheda.md` accanto al testo). */
export interface PropostaScheda {
  file: string
  generata: string
  /** id proposto per la scheda */
  scheda: string | null
  corsia: string | null
  data: string
  titolo_breve: string
  /** solo temi che esistono */
  temi: string[]
  sezioni: { riassunto: string; struttura: string; contesto: string; citazioni: string; domande: string }
  citazioniNonTrovate: string[]
  avvisi: string[]
  errore: string | null
}

export type SezioneProposta = 'riassunto' | 'struttura' | 'contesto' | 'citazioni' | 'domande' | 'temi'

export interface ApplicaProposta {
  sezioni: SezioneProposta[]
  /** serve solo se il testo non ha ancora una scheda */
  nuova?: { corsia: string; data: string; titolo_breve: string }
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
  applicaProposta(testoId: string, scelte: ApplicaProposta): Promise<{ modello: Modello; schedaId: string; creata: boolean }>
  scartaProposta(testoId: string): Promise<Modello>
  eliminaTema(id: string): Promise<{ modello: Modello; schedeToccate: number }>
  eliminaCorsia(id: string, verso: string | null): Promise<{ modello: Modello; schedeSpostate: number }>
  mostraCartella(): Promise<void>
  /** Home generale */
  albero(): Promise<NodoArg[]>
  /** una documentazione «Per situazioni»: indice, schede e progresso */
  leggiSituazioni(rel: string): Promise<Situazioni>
  /** segna o toglie «ripassata»; restituisce l'elenco aggiornato */
  segnaRipassata(rel: string, id: string, ripassata: boolean): Promise<string[]>
  /** un appunto .md della sessione di studio, con le immagini che cita (come data URL) */
  leggiAppunto(rel: string): Promise<Appunto>
  /** apre con l'app predefinita del sistema un file citato in un appunto (es. `fonti/x.pdf`) */
  apriFonte(dalAppunto: string, citato: string): Promise<void>
  /** apre con l'app predefinita del sistema un file dell'albero (pdf, pptx, immagine…) */
  apriFile(rel: string): Promise<void>
  /** il testo di un file modificabile (.md, .yaml) e la sua data di modifica */
  leggiSorgente(rel: string): Promise<SorgenteFile>
  /** salva con copia di sicurezza; se il file è cambiato sul disco risponde «conflitto» (a meno di `forza`) */
  salvaSorgente(rel: string, testo: string, mtimeAtteso: number, forza?: boolean): Promise<EsitoSalva>
  /** crea un file nuovo dentro 01_Argomenti (non sovrascrive) */
  creaFile(rel: string, testo: string): Promise<EsitoSalva>
  /** sposta un file in 99_Archivio/Archiviati (non cancella) e dice dove è finito */
  archiviaFile(rel: string): Promise<string>
  creaNodo(padre: string, nome: string): Promise<RisultatoNodo>
  /** nuovo appunto (.md) in una cartella di studio */
  creaAppunto(padre: string, nome: string): Promise<RisultatoNodo>
  /** nuovo documento «Per situazioni» (cartella con indice e una scheda) */
  creaSituazioni(padre: string, nome: string): Promise<RisultatoNodo>
  /** nuovo documento di matematica: un «Per situazioni» con una scheda «regola» da compilare */
  creaMatematica(padre: string, nome: string): Promise<RisultatoNodo>
  rinominaNodo(rel: string, nome: string): Promise<RisultatoNodo>
  archiviaNodo(rel: string): Promise<RisultatoNodo>
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

// ---- Home generale: l'albero di 01_Argomenti ----

export type TipoNodo = 'materia' | 'cartella' | 'autore' | 'mappa' | 'testo' | 'situazioni' | 'appunto' | 'file'

/** Una voce dell'albero. `rel` è il percorso dentro 01_Argomenti con "/" (per mappa e testo: quello dell'autore + "#mappa" o "/testi/<id>"). */
export interface NodoArg {
  rel: string
  tipo: TipoNodo
  nome: string
  /** cartelle da cui dipende l'app (italiano, autori, le cartelle degli autori): non si spostano né si archiviano */
  protetto: boolean
  puoRinominare: boolean
  puoArchiviare: boolean
  autoreId?: string
  testoId?: string
  /** riga di riepilogo: «12 testi», «105 schede», «Il colle…» */
  info: string
  /** ultima modifica in ms */
  modificato: number
  figli: NodoArg[]
}

export interface RisultatoNodo {
  albero: NodoArg[]
  /** rel del nodo creato o rinominato */
  rel?: string
}

/** Un file di appunti (.md) letto dal disco. */
export interface Appunto {
  rel: string
  /** il testo senza l'intestazione --- */
  testo: string
  /** le immagini citate nel testo: percorso come scritto → data URL */
  immagini: Record<string, string>
  /** le immagini citate che non si sono trovate */
  mancanti: string[]
  modificato: number
}

export interface SorgenteFile {
  rel: string
  testo: string
  mtime: number
}
export type EsitoSalva = { ok: true; mtime: number } | { ok: false; conflitto: true } | { ok: false; errori: string[] }
