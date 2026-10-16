import { create } from 'zustand'
import type { Situazioni } from '@shared/situazioni'

/** Come è aperta una documentazione in una scheda dell'app: mappa o una scheda, e le opzioni di lettura. */
export interface VistaSit {
  scheda: string | null
  esempi: boolean
  prova: boolean
  evidenzia: boolean
  fuoco: number | null
  q: string
  /** come si vedono i rami: albero (mappa concettuale) o griglia di card */
  disp: 'albero' | 'griglia'
  /** rami e gruppi aperti nella mappa ad albero (chiavi di layout.ts) */
  aperti: string[]
  /** si sta modificando la scheda aperta */
  modifica: boolean
}
export const VISTA0: VistaSit = { scheda: null, esempi: false, prova: false, evidenzia: true, fuoco: null, q: '', disp: 'albero', aperti: [], modifica: false }

interface Sit {
  dati: Record<string, Situazioni>
  errori: Record<string, string>
  viste: Record<string, VistaSit>
  carica(rel: string): Promise<void>
  imposta(rel: string, p: Partial<VistaSit>): void
  ripassata(rel: string, id: string): Promise<void>
}

export const useSit = create<Sit>((set, get) => ({
  dati: {},
  errori: {},
  viste: {},
  async carica(rel) {
    try {
      const d = await window.api.leggiSituazioni(rel)
      set((s) => ({ dati: { ...s.dati, [rel]: d }, errori: { ...s.errori, [rel]: '' } }))
    } catch (e) {
      set((s) => ({ errori: { ...s.errori, [rel]: (e as Error).message } }))
    }
  },
  imposta(rel, p) {
    set((s) => ({ viste: { ...s.viste, [rel]: { ...(s.viste[rel] ?? VISTA0), ...p } } }))
  },
  async ripassata(rel, id) {
    const d = get().dati[rel]
    if (!d) return
    const era = d.ripassate.includes(id)
    const lista = await window.api.segnaRipassata(rel, id, !era)
    set((s) => ({ dati: { ...s.dati, [rel]: { ...s.dati[rel]!, ripassate: lista } } }))
  }
}))
