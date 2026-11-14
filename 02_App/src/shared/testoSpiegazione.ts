// Tutto il testo di una scheda «spiegazione», in una riga: serve alla ricerca della mappa,
// che così trova anche le parole scritte nei blocchi (titoli, testo, punti, carte, tabelle, disegni).
import type { SchedaSpiegazione } from './situazioni'

export function testoSpiegazione(s: SchedaSpiegazione): string {
  const t: string[] = [s.quando]
  const liste = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(liste) : [])
  for (const b of s.blocchi) {
    if ('titolo' in b) t.push(b.titolo)
    else if ('testo' in b) t.push(b.testo)
    else if ('punti' in b) t.push(...b.punti)
    else if ('nota' in b) t.push(b.nota)
    else if ('trappola' in b) t.push(b.trappola)
    else if ('carte' in b) for (const c of b.carte) t.push(c.titolo, c.sotto, c.etichetta, c.testo, ...c.punti, ...c.numeri.flatMap((n) => [n.valore, n.cosa]))
    else if ('tabella' in b) t.push(...b.tabella.colonne, ...b.tabella.righe.flat())
    else if ('comandi' in b) t.push(...b.comandi.flatMap((c) => [c.codice, c.spiega]))
    else if ('disegno' in b) {
      const d = b.disegno
      if (d.modello === 'pile') {
        for (const c of d.colonne) t.push(c.titolo, c.cornice ?? '', c.nota, ...c.strati.flatMap((x) => (typeof x === 'string' || Array.isArray(x) ? liste(x) : liste(x.testo))))
      } else {
        for (const n of d.nodi) t.push(...(typeof n === 'string' ? [n] : [n.nome, n.sotto, ...n.punti]))
        t.push(...d.frecce, d.gruppo?.nome ?? '')
      }
      t.push(d.nota)
    }
  }
  // via i marcatori di grassetto/corsivo, che non sono parole
  return t.filter(Boolean).join(' ').replace(/\\?\*/g, '')
}

/**
 * Quanti pezzi si possono coprire in «Mettiti alla prova»: i numeri grandi delle carte, le celle della tabella
 * (tranne la prima colonna, che dice di cosa si parla) e i riquadri dei livelli nei disegni a pile.
 */
export function elementiDaCoprire(s: SchedaSpiegazione): number {
  let n = 0
  for (const b of s.blocchi) {
    if ('carte' in b) n += b.carte.reduce((a, c) => a + c.numeri.length, 0)
    else if ('tabella' in b) n += b.tabella.righe.reduce((a, r) => a + Math.max(0, r.length - 1), 0)
    else if ('disegno' in b && b.disegno.modello === 'pile') {
      for (const c of b.disegno.colonne) for (const x of c.strati) n += typeof x === 'string' ? 1 : Array.isArray(x) ? x.length : typeof x.testo === 'string' ? 1 : x.testo.length
    }
  }
  return n
}
