// I modelli della galleria «+ Nuovo»: cosa sono, a cosa servono, per quali materie sono consigliati e dove si possono creare.
// La galleria cresce un modello alla volta (specifiche/galleria_modelli.md). Tutti i modelli si possono sempre scegliere:
// la destinazione (la cartella dove nasce il file) si sceglie nella stessa finestra.
import type { NodoArg, TipoNodo } from '@shared/types'

export type IdModello = 'situazioni' | 'matematica' | 'appunti' | 'testo' | 'cartella' | 'materia'
/** Dove vive il nuovo file: in cima all'albero, in una cartella di studio (non Italiano), nella cartella di un autore. */
export type Dove = 'radice' | 'cartellaDiStudio' | 'autore'

export interface Modello {
  id: IdModello
  nome: string
  icona: 'mappa' | 'file' | 'testo' | 'cartella' | 'libro' | 'carte' | 'somma'
  /** il tipo di nodo che nasce (per il colore dell'icona, come nell'albero) */
  tipo: TipoNodo
  /** una riga corta per la lista */
  breve: string
  /** cosa è e per cosa serve */
  descrizione: string
  /** cosa viene creato davvero, in concreto */
  crea: string
  dove: Dove
  /** serve un nome? (il testo annotato ha il suo modulo di importazione) */
  conNome: boolean
  etichettaNome: string
  esempioNome: string
  /** per quali materie è consigliato (il primo segmento del percorso, in minuscolo) */
  consigliatoPer: (materia: string) => boolean
}

export const MODELLI: Modello[] = [
  {
    id: 'matematica',
    nome: 'Matematica',
    icona: 'somma',
    tipo: 'situazioni',
    breve: 'Riconosci cosa fare, formule e formulario',
    descrizione: 'Parti dall\'esercizio: cosa vedo, cosa faccio. Una mappa di regole con formula, esempi svolti ed errore tipico, il Formulario con tutte le formule in una pagina e il piano per gli esercizi.',
    crea: 'Una cartella «… per situazioni» con la mappa (indice.yaml) e una prima regola da compilare. Si apre in una scheda dell\'app.',
    dove: 'cartellaDiStudio',
    conNome: true,
    etichettaNome: 'Nome dell\'argomento',
    esempioNome: 'Scomposizione dei polinomi',
    consigliatoPer: (m) => m === 'matematica'
  },
  {
    id: 'situazioni',
    nome: 'Per situazioni',
    icona: 'carte',
    tipo: 'situazioni',
    breve: 'Mappa di situazioni con schede passo-passo',
    descrizione: 'Parti da quello che devi fare, non dal nome della funzione: una mappa ad albero di situazioni con schede passo-passo. Per tecnica, codice e configurazioni.',
    crea: 'Una cartella con la mappa (indice.yaml) e una prima scheda da compilare. Si apre in una scheda dell\'app.',
    dove: 'cartellaDiStudio',
    conNome: true,
    etichettaNome: 'Nome del documento',
    esempioNome: 'Git per situazioni',
    consigliatoPer: (m) => m !== 'italiano'
  },
  {
    id: 'appunti',
    nome: 'Appunti',
    icona: 'file',
    tipo: 'appunto',
    breve: 'Un file di testo con titoli, tabelle e codice',
    descrizione: 'Un file di testo con titoli, elenchi, tabelle e codice, con indice a lato. Per teoria, riassunti e tutto quello che si scrive di getto.',
    crea: 'Un file .md con il titolo già scritto. Si apre subito in modifica.',
    dove: 'cartellaDiStudio',
    conNome: true,
    etichettaNome: 'Nome del file (senza .md)',
    esempioNome: 'Protocollo I2C',
    consigliatoPer: (m) => m !== 'italiano'
  },
  {
    id: 'testo',
    nome: 'Testo annotato',
    icona: 'testo',
    tipo: 'testo',
    breve: 'Annotazioni, parafrasi ed esercizi',
    descrizione: 'Un testo letterario con annotazioni, parafrasi, esercizi e scheda riassuntiva. Per lo studio dei testi di italiano.',
    crea: 'Si apre l\'importazione del testo nell\'editor, per l\'autore che scegli.',
    dove: 'autore',
    conNome: false,
    etichettaNome: '',
    esempioNome: '',
    consigliatoPer: (m) => m === 'italiano'
  }
]

export const STRUTTURA: Modello[] = [
  {
    id: 'materia',
    nome: 'Materia',
    icona: 'libro',
    tipo: 'materia',
    breve: 'Una nuova materia in cima all\'albero',
    descrizione: 'Il contenitore di più argomenti, come Matematica o Telecomunicazioni.',
    crea: 'Una cartella in cima all\'albero.',
    dove: 'radice',
    conNome: true,
    etichettaNome: 'Nome della materia',
    esempioNome: 'Inglese',
    consigliatoPer: () => false
  },
  {
    id: 'cartella',
    nome: 'Cartella',
    icona: 'cartella',
    tipo: 'cartella',
    breve: 'Per raggruppare argomenti',
    descrizione: 'Una cartella per raggruppare argomenti o documenti dentro una materia.',
    crea: 'Una cartella vuota nel posto che scegli.',
    dove: 'cartellaDiStudio',
    conNome: true,
    etichettaNome: 'Nome della cartella',
    esempioNome: 'Reti',
    consigliatoPer: () => false
  }
]

export const TUTTI_I_MODELLI: Modello[] = [...MODELLI, ...STRUTTURA]

export interface Contesto {
  /** il nodo dove si è (cartella, materia, autore) o null alla Home */
  tipo: string | null
  rel: string
}

export const materiaDi = (rel: string): string => (rel.split('/')[0] ?? '').toLowerCase()

/** Questo nodo può contenere il nuovo file? */
export function accoglie(m: Modello, n: NodoArg): boolean {
  switch (m.dove) {
    case 'radice': return false
    case 'autore': return n.tipo === 'autore'
    case 'cartellaDiStudio': return (n.tipo === 'cartella' || n.tipo === 'materia') && materiaDi(n.rel) !== 'italiano'
  }
}

export interface Voce {
  n: NodoArg
  livello: number
  /** si può scegliere (le altre sono solo la strada per arrivarci) */
  ok: boolean
}

const contenitore = (t: TipoNodo): boolean => t === 'materia' || t === 'cartella' || t === 'autore'

/** Le cartelle dove il modello può nascere, in ordine d'albero, con le cartelle-strada che servono a raggiungerle. */
export function destinazioni(m: Modello, albero: NodoArg[]): Voce[] {
  if (m.dove === 'radice') return []
  const giro = (nodi: NodoArg[], livello: number): Voce[] =>
    nodi.filter((n) => contenitore(n.tipo)).flatMap((n) => {
      const sotto = giro(n.figli, livello + 1)
      const ok = accoglie(m, n)
      return ok || sotto.length ? [{ n, livello, ok }, ...sotto] : []
    })
  return giro(albero, 0)
}

/** Il rel dei nodi che contengono `rel` (senza `#mappa`), dal più vicino al più lontano. */
function strada(rel: string): string[] {
  const p = rel.split('#')[0]!.split('/')
  return p.map((_, i) => p.slice(0, p.length - i).join('/'))
}

/** Dove proporre di creare: la cartella in cui sei (o la più vicina che va bene); se c'è un solo posto possibile, quello. */
export function iniziale(c: Contesto, voci: Voce[]): string {
  const buone = voci.filter((v) => v.ok)
  if (c.rel) {
    for (const r of strada(c.rel)) if (buone.some((v) => v.n.rel === r)) return r
  }
  return buone.length === 1 ? buone[0]!.n.rel : ''
}

/** Filtra per ricerca (nome e descrizione) e divide i documenti in consigliati e tutti; la struttura segue la ricerca. */
export function ordina(c: Contesto, q: string): { consigliati: Modello[]; altri: Modello[]; struttura: Modello[] } {
  const t = q.trim().toLowerCase()
  const tocca = (m: Modello): boolean => !t || (m.nome + ' ' + m.breve + ' ' + m.descrizione).toLowerCase().includes(t)
  const visibili = MODELLI.filter(tocca)
  const mat = c.rel ? materiaDi(c.rel) : ''
  const consigliati = mat ? visibili.filter((m) => m.consigliatoPer(mat)) : []
  return { consigliati, altri: visibili.filter((m) => !consigliati.includes(m)), struttura: STRUTTURA.filter(tocca) }
}
