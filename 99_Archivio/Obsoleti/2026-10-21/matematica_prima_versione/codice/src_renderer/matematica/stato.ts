import { create } from 'zustand'
import type { Matematica } from '@shared/matematica'

export type Pagina = 'regole' | 'calcolatore' | 'ripasso'

interface Mat {
  dati: Record<string, Matematica>
  errori: Record<string, string>
  carica(rel: string): Promise<void>
  ripassata(rel: string, id: string): Promise<void>
}

export const useMat = create<Mat>((set, get) => ({
  dati: {},
  errori: {},
  async carica(rel) {
    try {
      const d = await window.api.leggiMatematica(rel)
      set((s) => ({ dati: { ...s.dati, [rel]: d }, errori: { ...s.errori, [rel]: '' } }))
    } catch (e) {
      set((s) => ({ errori: { ...s.errori, [rel]: (e as Error).message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') } }))
    }
  },
  async ripassata(rel, id) {
    const d = get().dati[rel]
    if (!d) return
    const lista = await window.api.segnaRegolaRipassata(rel, id, !d.ripassate.includes(id))
    set((s) => ({ dati: { ...s.dati, [rel]: { ...s.dati[rel]!, ripassate: lista } } }))
  }
}))
