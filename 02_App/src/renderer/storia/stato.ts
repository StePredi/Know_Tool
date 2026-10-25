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
}
export const STORIA0: StatoStoria = { scheda: null, vista: 'mappa', ripasso: false, chiusi: [] }

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
