// Scheda nuova «Per situazioni»: un modello valido da compilare e un id libero ricavato dal titolo.
import YAML from 'yaml'

export type TipoNuova = 'ricetta' | 'prima_dopo' | 'regola' | 'spiegazione'

export function slugId(titolo: string): string {
  return titolo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/g, '') || 'scheda'
}

export function idLibero(titolo: string, esistenti: Iterable<string>): string {
  const usati = new Set(esistenti)
  const base = slugId(titolo)
  let id = base
  for (let n = 2; usati.has(id); n++) id = `${base}-${n}`
  return id
}

export function modelloScheda(tipo: TipoNuova, id: string, titolo: string): string {
  const comuni = { id, titolo, sigla: titolo.length > 28 ? titolo.slice(0, 27).trimEnd() + '…' : titolo, comando: 'comando', frase: 'Quando ti serve' }
  const o =
    tipo === 'ricetta'
      ? { tipo, ...comuni, quando: 'Quando usarla', fasi: [{ nome: 'Passo 1', righe: [{ codice: 'codice', commento: 'Cosa fa' }] }] }
      : tipo === 'spiegazione'
        ? {
            tipo,
            ...comuni,
            comando: titolo,
            frase: 'Cosa spiega',
            quando: 'Quando serve capirla',
            blocchi: [
              { titolo: 'Titolo della sezione' },
              { testo: 'Testo normale. Con **grassetto** per i termini chiave e *corsivo* per le parole straniere.' },
              { disegno: { modello: 'pile', colonne: [{ titolo: 'Titolo della colonna', strati: ['Livello in alto', 'Livello in basso'] }] } }
            ]
          }
      : tipo === 'regola'
        ? { tipo, id, titolo, sigla: comuni.sigla, vedo: 'Cosa vedo nell\'esercizio', formula: 'f(x) = x', adatto: [], esempi: [], errore: 'L\'errore tipico', confondi: [], perche: 'Perché funziona' }
        : { tipo, ...comuni, prima: 'Com\'era prima', dopo: 'Com\'è dopo', uso: 'A cosa serve', riconoscila: 'Come riconoscerla' }
  return YAML.stringify(o, { lineWidth: 0 })
}
