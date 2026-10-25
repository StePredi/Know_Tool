import { create } from 'zustand'
import type { DocumentoMateria, Libri } from '@shared/situazioni'

/** Le viste di un argomento di Storia, raggruppate per quello che servono. */
export type VistaStoria = 'mappa' | 'cronologia' | 'glossario' | 'persone' | 'svolte' | 'copertura'

export interface StatoStoria {
  scheda: string | null
  vista: VistaStoria
  /** nasconde alcuni campi e li fa scoprire con un clic */
  ripasso: boolean
  /** rami chiusi nella colonna di navigazione */
  chiusi: string[]
  /** riproduzione automatica: scorre le schede da sola */
  riproduci: boolean
  /** ogni quanti secondi passa alla successiva */
  passo: number
}
export const STORIA0: StatoStoria = { scheda: null, vista: 'mappa', ripasso: false, chiusi: [], riproduci: false, passo: 15 }
export const PASSI = [8, 15, 30, 60] as const

interface Storia {
  stati: Record<string, StatoStoria>
  materia: Record<string, { libri: Libri; documenti: DocumentoMateria[] }>
  imposta(rel: string, p: Partial<StatoStoria>): void
  caricaMateria(materia: string): Promise<void>
}

export const useStoria = create<Storia>((set, get) => ({
  stati: {},
  materia: {},
  imposta(rel, p) {
    set((s) => ({ stati: { ...s.stati, [rel]: { ...(s.stati[rel] ?? STORIA0), ...p } } }))
  },
  async caricaMateria(materia) {
    if (get().materia[materia]) return
    try {
      const d = await window.api.leggiMateriaStoria(materia)
      set((s) => ({ materia: { ...s.materia, [materia]: d } }))
    } catch {
      /* la copertura è facoltativa: se non si legge, la vista lo dice */
    }
  }
}))

/** Il primo anno che compare in «quando»; 9999 se non ce n'è. */
export function anno(q: string): number {
  const m = /\d{4}/.exec(q)
  return m ? Number(m[0]) : 9999
}

/** L'ordine in cui si leggono le schede, secondo la vista aperta:
 *  la mappa segue i rami, la cronologia segue gli anni (le voci senza data in fondo). */
export function ordineVista(dati: import('@shared/situazioni').Situazioni, vista: VistaStoria): string[] {
  const dentro = (id: string): boolean => !!dati.schede[id]
  if (vista !== 'cronologia') return dati.indice.rami.flatMap((r) => r.voci.flatMap((v) => v.schede)).filter(dentro)
  const voci = Object.values(dati.schede).filter((s) => s.tipo === 'voce')
  const con = voci.filter((s) => s.tipo === 'voce' && s.quando && anno(s.quando) < 9999)
  const senza = voci.filter((s) => s.tipo === 'voce' && (!s.quando || anno(s.quando) === 9999))
  con.sort((a, b) => anno(a.tipo === 'voce' ? a.quando : '') - anno(b.tipo === 'voce' ? b.quando : ''))
  return [...con, ...senza].map((s) => s.id)
}

