import { create } from 'zustand'
import type { Span } from '@shared/types'

export type Pannello = 'ann' | 'par' | 'es'

export interface Bozza {
  id: string
  testo: string
}

interface StatoEditor {
  /** testo aperto nell'editor; null = la Home */
  testoId: string | null
  sel: Span | null
  anchor: number | null
  testa: number | null
  dragging: boolean
  zoom: number
  numeri: boolean
  tab: Pannello
  leftPin: boolean
  rightOpen: boolean
  rightW: number
  resizing: boolean
  vw: number
  annVar: 'A' | 'B'
  figVar: 'A' | 'B'
  // finestre e popover
  helpOpen: boolean
  settingsOpen: boolean
  selettoreOpen: boolean
  annDet: string | null
  detEdit: boolean
  figOpen: boolean
  figQ: string
  figExp: string | null
  figPrev: string
  figTarget: string | null
  modOpen: boolean
  modBozza: string
  nuovoOpen: boolean
  elencoTesti: boolean
  riancoroInfo: { ok: number; ko: number } | null
  // testo vuoto
  incollaAperto: boolean
  bozza: string
  // esercizi
  esDet: string | null
  esEdit: string | null
  esTestoEdit: string | null
  esFiltro: 'tutti' | 'da_svolgere' | 'da_correggere' | 'corretta'
  esImportOpen: boolean
  esImportFase: 'incolla' | 'separa'
  esImportTesto: string
  esBozza: Bozza[]
  esCur: Record<string, number>
  imposta(p: Partial<StatoEditor>): void
  seleziona(a: number, b: number): void
}

let preferenze: Partial<StatoEditor> = {}
try {
  preferenze = JSON.parse(localStorage.getItem('kt-editor') ?? '{}') as Partial<StatoEditor>
} catch {
  // nessuna memoria: valori predefiniti
}

const vw0 = typeof window === 'undefined' ? 1440 : window.innerWidth

export const useEditor = create<StatoEditor>((set, get) => ({
  testoId: null,
  sel: null,
  anchor: null,
  testa: null,
  dragging: false,
  zoom: preferenze.zoom ?? 100,
  numeri: preferenze.numeri ?? true,
  tab: 'ann',
  leftPin: false,
  rightOpen: vw0 >= 1180,
  rightW: preferenze.rightW ?? 392,
  resizing: false,
  vw: vw0,
  annVar: preferenze.annVar ?? 'A',
  figVar: preferenze.figVar ?? 'A',
  helpOpen: false,
  settingsOpen: false,
  selettoreOpen: false,
  annDet: null,
  detEdit: false,
  figOpen: false,
  figQ: '',
  figExp: null,
  figPrev: 'metafora',
  figTarget: null,
  modOpen: false,
  modBozza: '',
  nuovoOpen: false,
  elencoTesti: false,
  riancoroInfo: null,
  incollaAperto: false,
  bozza: '',
  esDet: null,
  esEdit: null,
  esTestoEdit: null,
  esFiltro: 'tutti',
  esImportOpen: false,
  esImportFase: 'incolla',
  esImportTesto: '',
  esBozza: [],
  esCur: {},
  imposta(p) {
    set(p)
    const { zoom, numeri, rightW, annVar, figVar } = get()
    try {
      localStorage.setItem('kt-editor', JSON.stringify({ zoom, numeri, rightW, annVar, figVar }))
    } catch {
      // vedi sopra
    }
  },
  seleziona(a, b) {
    set({ sel: [Math.min(a, b), Math.max(a, b)], anchor: a, testa: b })
  }
}))

/** Larghezza massima del pannello destro: al testo restano sempre almeno 420 px. */
export const maxRightW = (vw: number, leftPin: boolean): number => Math.max(300, vw - (leftPin ? 290 : 92) - 16 - 420)
