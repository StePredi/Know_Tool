import { leggiDocMd, trovaSezione } from './scheda_md'
import type { PropostaScheda } from './types'

/** Le sezioni dell'analisi: chiave, titolo nel file. */
export const SEZIONI_ANALISI = [
  { k: 'riassunto', titolo: 'Riassunto' },
  { k: 'struttura', titolo: 'Struttura e metrica' },
  { k: 'contesto', titolo: 'Contesto' },
  { k: 'citazioni', titolo: 'Citazioni chiave' },
  { k: 'domande', titolo: 'Domande' }
] as const
export type ChiaveSezione = (typeof SEZIONI_ANALISI)[number]['k']

/** Per confrontare un brano con il testo: stesse parole, a prescindere da maiuscole, a capo, virgolette e barre fra i versi. */
export function normalizzaPerConfronto(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”«»"]/g, '')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Citazioni scritte come «…» in un elenco: ogni parte fra puntini di sospensione deve stare nel testo. */
export function citazioniNonTrovate(citazioni: string, corpo: string): string[] {
  const testo = normalizzaPerConfronto(corpo)
  const out: string[] = []
  for (const riga of citazioni.split('\n')) {
    const m = riga.match(/«([^»]+)»/)
    if (!m) continue
    const parti = m[1]!.split(/…|\.\.\./).map(normalizzaPerConfronto).filter(Boolean)
    if (parti.some((p) => !testo.includes(p))) out.push(m[1]!.trim())
  }
  return out
}

interface Contesto {
  temi: Set<string>
  corsie: Set<string>
  corpo: string
}

export function leggiProposta(testoId: string, md: string, ctx: Contesto): PropostaScheda {
  const file = `testi/${testoId}/proposta_scheda.md`
  const doc = leggiDocMd(md)
  const vuota: PropostaScheda = {
    file,
    generata: '',
    scheda: null,
    corsia: null,
    data: '',
    titolo_breve: '',
    temi: [],
    sezioni: { riassunto: '', struttura: '', contesto: '', citazioni: '', domande: '' },
    citazioniNonTrovate: [],
    avvisi: [],
    errore: null
  }
  if (doc.erroreYaml || !doc.haFrontmatter) {
    return { ...vuota, errore: `proposta_scheda.md non ha un frontmatter leggibile${doc.erroreYaml ? `: ${doc.erroreYaml}` : ''}.` }
  }
  const fm = doc.fm
  const s = (v: unknown): string => (v == null ? '' : String(v).trim())
  const avvisi: string[] = []
  const temiScritti = Array.isArray(fm.temi) ? fm.temi.map(String) : []
  const temi = temiScritti.filter((t) => ctx.temi.has(t))
  for (const t of temiScritti) if (!ctx.temi.has(t)) avvisi.push(`Il tema «${t}» non esiste in temi.md: non verrà usato.`)
  let corsia: string | null = s(fm.corsia) || null
  if (corsia && !ctx.corsie.has(corsia)) {
    avvisi.push(`La categoria «${corsia}» non esiste: la sceglierai tu.`)
    corsia = null
  }
  const sezioni = { ...vuota.sezioni }
  for (const { k, titolo } of SEZIONI_ANALISI) sezioni[k] = trovaSezione(doc, titolo)?.testo.trim() ?? ''
  if (!sezioni.riassunto) avvisi.push('La proposta non ha il riassunto.')
  const nonTrovate = citazioniNonTrovate(sezioni.citazioni, ctx.corpo)
  if (nonTrovate.length) avvisi.push(`${nonTrovate.length} citazion${nonTrovate.length === 1 ? 'e non è' : 'i non sono'} nel testo parola per parola: controllale prima di applicare.`)
  return {
    file,
    generata: s(fm.generata),
    scheda: s(fm.id) || null,
    corsia,
    data: s(fm.data),
    titolo_breve: s(fm.titolo_breve),
    temi,
    sezioni,
    citazioniNonTrovate: nonTrovate,
    avvisi,
    errore: null
  }
}
