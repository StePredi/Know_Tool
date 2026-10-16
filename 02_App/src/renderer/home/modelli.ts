// I modelli della galleria «+ Nuovo»: cosa sono, a cosa servono, per quali materie sono consigliati e quando si possono creare.
// La galleria cresce un modello alla volta (specifiche/galleria_modelli.md).

export type IdModello = 'situazioni' | 'appunti' | 'testo' | 'mappa' | 'cartella' | 'materia'
export type Dove = 'qualsiasi' | 'cartellaDiStudio' | 'autore' | 'nessuno'

export interface Modello {
  id: IdModello
  nome: string
  icona: 'mappa' | 'file' | 'testo' | 'cartella' | 'libro' | 'figura'
  /** una riga: cosa è e per cosa serve */
  descrizione: string
  /** dove si può creare */
  dove: Dove
  /** perché non si può creare adesso (se `dove` non è soddisfatto) */
  serve: string
  /** per quali materie è consigliato (il primo segmento del percorso, in minuscolo) */
  consigliatoPer: (materia: string) => boolean
}

export const MODELLI: Modello[] = [
  {
    id: 'situazioni',
    nome: 'Per situazioni',
    icona: 'mappa',
    descrizione: 'Parti da quello che devi fare, non dal nome della funzione: una mappa ad albero di situazioni con schede passo-passo. Per tecnica, codice e configurazioni.',
    dove: 'cartellaDiStudio',
    serve: 'Entra prima in una cartella di studio (non in Italiano).',
    consigliatoPer: (m) => m !== 'italiano'
  },
  {
    id: 'appunti',
    nome: 'Appunti',
    icona: 'file',
    descrizione: 'Un file di testo con titoli, elenchi, tabelle e codice, con indice a lato. Per teoria, riassunti e tutto quello che si scrive di getto.',
    dove: 'cartellaDiStudio',
    serve: 'Entra prima in una cartella di studio (non in Italiano).',
    consigliatoPer: (m) => m !== 'italiano'
  },
  {
    id: 'testo',
    nome: 'Testo annotato',
    icona: 'testo',
    descrizione: 'Un testo letterario con annotazioni, parafrasi, esercizi e scheda riassuntiva. Per lo studio dei testi di italiano.',
    dove: 'autore',
    serve: 'Apri prima la cartella di un autore (in Italiano).',
    consigliatoPer: (m) => m === 'italiano'
  },
  {
    id: 'mappa',
    nome: 'Mappa cronologica',
    icona: 'figura',
    descrizione: 'La linea del tempo di un autore con le schede di vita e opere. Esiste già per ogni autore: si apre dalla sua cartella.',
    dove: 'nessuno',
    serve: 'Si apre dalla cartella dell\'autore; il «Nuovo autore» arriverà più avanti.',
    consigliatoPer: (m) => m === 'italiano'
  }
]

export const STRUTTURA: Modello[] = [
  { id: 'materia', nome: 'Materia', icona: 'libro', descrizione: 'Una nuova materia in cima all\'albero.', dove: 'qualsiasi', serve: '', consigliatoPer: () => false },
  { id: 'cartella', nome: 'Cartella', icona: 'cartella', descrizione: 'Una cartella per raggruppare argomenti.', dove: 'cartellaDiStudio', serve: 'Entra prima in una materia o in una cartella.', consigliatoPer: () => false }
]

export interface Contesto {
  /** il nodo dove si è (cartella, materia, autore) o null alla Home */
  tipo: string | null
  rel: string
}

export const materiaDi = (rel: string): string => (rel.split('/')[0] ?? '').toLowerCase()

export function disponibile(m: Modello, c: Contesto): boolean {
  switch (m.dove) {
    case 'qualsiasi': return true
    case 'nessuno': return false
    case 'autore': return c.tipo === 'autore'
    case 'cartellaDiStudio': return (c.tipo === 'cartella' || c.tipo === 'materia') && materiaDi(c.rel) !== 'italiano'
  }
}

/** Filtra per ricerca (nome e descrizione) e divide in consigliati e tutti. */
export function ordina(c: Contesto, q: string): { consigliati: Modello[]; altri: Modello[] } {
  const t = q.trim().toLowerCase()
  const visibili = MODELLI.filter((m) => !t || (m.nome + ' ' + m.descrizione).toLowerCase().includes(t))
  const mat = c.rel ? materiaDi(c.rel) : ''
  const consigliati = mat ? visibili.filter((m) => m.consigliatoPer(mat)) : []
  return { consigliati, altri: visibili.filter((m) => !consigliati.includes(m)) }
}
