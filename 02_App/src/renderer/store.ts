import { create } from 'zustand'
import { coloreCorsia, costruisciIndice, type Indice } from '@shared/derivati'
import type { EventoModello, Modello, Scheda, SchedaPatch, StatoApp } from '@shared/types'

export type Vista = 'mappa' | 'lista' | 'confronti' | 'ripasso' | 'note' | 'testi' | 'percorso'
export type Popover = 'periodi' | 'temi' | 'corsie' | 'lettura' | null

interface Preferenze {
  scuro: boolean
  sobria: boolean
  font: 'atkinson' | 'lexend' | 'sistema'
  zoomUi: number
  zoomMappa: number
  intervallo: number
  ls: number
  vista: Vista
}

const PREF_DEFAULT: Preferenze = { scuro: false, sobria: false, font: 'atkinson', zoomUi: 1.15, zoomMappa: 1, intervallo: 15, ls: 150, vista: 'mappa' }

function leggiPref(): Preferenze {
  try {
    const t = localStorage.getItem('kt-pref')
    if (t) return { ...PREF_DEFAULT, ...(JSON.parse(t) as Partial<Preferenze>) }
  } catch {
    // niente memoria del browser: valgono i valori predefiniti
  }
  return PREF_DEFAULT
}

interface Store extends Preferenze {
  stato: StatoApp | null
  modello: Modello | null
  indice: Indice | null
  caricamento: boolean
  query: string
  periodi: number[]
  temi: string[]
  corsieSpente: Record<string, boolean>
  selId: string | null
  apertaId: string | null
  editando: boolean
  editId: string | null
  controlli: boolean
  popover: Popover
  toast: string | null
  auto: boolean
  applicazione: boolean

  init(): Promise<void>
  scegliRadice(): Promise<void>
  scegliAutore(id: string): Promise<void>
  applica(m: Modello): void
  applicaStato(s: StatoApp): void
  onEvento(e: EventoModello): void
  patchScheda(id: string, patch: SchedaPatch): Promise<void>
  imposta(p: Partial<Store>): void
  prefs(p: Partial<Preferenze>): void
  mostraToast(t: string | null): void
}

let timerToast: ReturnType<typeof setTimeout> | null = null

export const useStore = create<Store>((set, get) => ({
  ...leggiPref(),
  stato: null,
  modello: null,
  indice: null,
  caricamento: true,
  query: '',
  periodi: [],
  temi: [],
  corsieSpente: {},
  selId: null,
  apertaId: null,
  editando: false,
  editId: null,
  controlli: false,
  popover: null,
  toast: null,
  auto: false,
  applicazione: false,

  async init() {
    const s = await window.api.stato()
    get().applicaStato(s)
  },
  async scegliRadice() {
    get().applicaStato(await window.api.scegliRadice())
  },
  async scegliAutore(id) {
    get().applicaStato(await window.api.scegliAutore(id))
  },
  applica(m) {
    set((st) => {
      const indice = costruisciIndice(m)
      return {
        modello: m,
        indice,
        selId: st.selId && indice.byId.has(st.selId) ? st.selId : null,
        apertaId: st.apertaId && indice.byId.has(st.apertaId) ? st.apertaId : null,
        editId: st.editId && indice.byId.has(st.editId) ? st.editId : null
      }
    })
  },
  onEvento(e) {
    get().applica(e.modello)
    if (e.esterni.length) {
      const n = e.esterni.length
      get().mostraToast(
        n === 1
          ? `Aggiornato da fuori: ${e.esterni[0]!.replace(/^schede\//, '')}`
          : `Aggiornati da fuori ${n} file`
      )
    }
  },
  async patchScheda(id, patch) {
    try {
      get().applica(await window.api.aggiornaScheda(id, patch))
    } catch (e) {
      get().mostraToast((e as Error).message.replace(/^Error invoking remote method '[^']*': (Error: )?/, ''))
    }
  },
  imposta(p) {
    set(p)
  },
  prefs(p) {
    set(p)
    const { scuro, sobria, font, zoomUi, zoomMappa, intervallo, ls, vista } = get()
    try {
      localStorage.setItem('kt-pref', JSON.stringify({ scuro, sobria, font, zoomUi, zoomMappa, intervallo, ls, vista }))
    } catch {
      // vedi sopra
    }
  },
  mostraToast(t) {
    if (timerToast) clearTimeout(timerToast)
    set({ toast: t })
    if (t) timerToast = setTimeout(() => set({ toast: null }), 5000)
  },
  applicaStato(s: StatoApp) {
    set({ stato: s, caricamento: false })
    if (s.modello) get().applica(s.modello)
    else set({ modello: null, indice: null })
  }
}))

// ---- selettori comodi ----

export function useColore(): (corsiaId: string) => string {
  const m = useStore((s) => s.modello)
  const scuro = useStore((s) => s.scuro)
  const sobria = useStore((s) => s.sobria)
  return (id: string) => {
    const c = m?.autore.corsie.find((x) => x.id === id) ?? m?.autore.corsie[0]
    return coloreCorsia(c?.tonalita ?? 0, scuro, sobria)
  }
}

export function testoCerca(m: Modello, s: Scheda): string {
  const temi = s.temi.map((k) => m.temi.find((t) => t.id === k)?.nome ?? '').join(' ')
  return [s.titolo_breve, s.titolo, s.riassunto, s.dettagli.join(' '), s.attenzione, temi].join(' ').toLowerCase()
}
