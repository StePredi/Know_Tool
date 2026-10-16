// Percorsi speciali di 01_Argomenti. I nomi delle cartelle hanno l'iniziale maiuscola (Italiano/Autori), ma si confrontano senza badare alle maiuscole.

export const ITALIANO = 'Italiano'
export const AUTORI = 'Italiano/Autori'

export const èItaliano = (rel: string): boolean => /^italiano(\/|$)/i.test(rel)
/** la cartella «Autori» stessa */
export const èCartellaAutori = (rel: string): boolean => /^italiano\/autori$/i.test(rel)
/** la cartella «Autori» o qualcosa al suo interno */
export const dentroAutori = (rel: string): boolean => /^italiano\/autori(\/|$)/i.test(rel)
/** una cartella di un autore: Italiano/Autori/<id> */
export const èCartellaAutore = (rel: string): boolean => /^italiano\/autori\/[^/]+$/i.test(rel)
/** il testo di un autore: Italiano/Autori/<id>/testi/<testo> */
export const èCartellaTesto = (rel: string): RegExpMatchArray | null => rel.match(/^(italiano\/autori\/[^/]+)\/testi\/([^/]+)$/i)
