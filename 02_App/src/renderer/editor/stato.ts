import { create } from 'zustand'
import type { Span } from '@shared/types'

export type Pannello = 'ann' | 'par' | 'es'

interface StatoEditor {
  /** testo aperto nell'editor; null = la Home */
  testoId: string | null
  sel: Span | null
  anchor: number | null
  testa: number | null
  zoom: number
  numeri: boolean
  pannello: Pannello
  sinistraAperta: boolean
  destraAperta: boolean
  larghezzaDestra: number
  larghezza: number
  annDet: string | null
  modifica: boolean
  elencoTesti: boolean
  modificaTesto: boolean
  nuovoTesto: boolean
  importa: boolean
  aiuto: boolean
  riepilogo: { riagganciate: number; daSistemare: number } | null
  esercizioAperto: string | null
  imposta(p: Partial<StatoEditor>): void
  seleziona(a: number, b: number): void
}

let preferenze: Partial<StatoEditor> = {}
try {
  preferenze = JSON.parse(localStorage.getItem('kt-editor') ?? '{}') as Partial<StatoEditor>
} catch {
  // nessuna memoria: valori predefiniti
}

export const useEditor = create<StatoEditor>((set, get) => ({
  testoId: null,
  sel: null,
  anchor: null,
  testa: null,
  zoom: preferenze.zoom ?? 100,
  numeri: preferenze.numeri ?? true,
  pannello: 'ann',
  sinistraAperta: false,
  destraAperta: true,
  larghezzaDestra: preferenze.larghezzaDestra ?? 420,
  larghezza: typeof window === 'undefined' ? 1400 : window.innerWidth,
  annDet: null,
  modifica: false,
  elencoTesti: false,
  modificaTesto: false,
  nuovoTesto: false,
  importa: false,
  aiuto: false,
  riepilogo: null,
  esercizioAperto: null,
  imposta(p) {
    set(p)
    const { zoom, numeri, larghezzaDestra } = get()
    try {
      localStorage.setItem('kt-editor', JSON.stringify({ zoom, numeri, larghezzaDestra }))
    } catch {
      // vedi sopra
    }
  },
  seleziona(a, b) {
    set({ sel: [Math.min(a, b), Math.max(a, b)], anchor: a, testa: b })
  }
}))
