import { create } from 'zustand'
import type { NodoArg } from '@shared/types'
import { useStore } from '../store'
import { useEditor } from '../editor/stato'

export interface SchedaApp {
  id: string
  tipo: 'home' | 'mappa' | 'testo' | 'situazioni' | 'appunto'
  /** per «situazioni»: la cartella del documento; per «appunto»: il file .md, dentro 01_Argomenti */
  rel?: string
  autoreId?: string
  testoId?: string
  titolo: string
}

export const HOME_ID = 'home'
const CHIAVE = 'kt-home'

interface Salvato {
  tabs: SchedaApp[]
  attiva: string
  alberoAperto: boolean
  espansi: Record<string, boolean>
  vista: 'griglia' | 'elenco'
  ordina: 'nome' | 'recente'
  preferiti: string[]
  recenti: { rel: string; t: number }[]
  percorso: string
}

const BASE: Salvato = {
  tabs: [{ id: HOME_ID, tipo: 'home', titolo: 'Home' }],
  attiva: HOME_ID,
  alberoAperto: true,
  espansi: { Italiano: true, 'Italiano/Autori': true },
  vista: 'griglia',
  ordina: 'nome',
  preferiti: [],
  recenti: [],
  percorso: ''
}

function leggi(): Salvato {
  try {
    const t = localStorage.getItem(CHIAVE)
    if (t) {
      const s = { ...BASE, ...(JSON.parse(t) as Partial<Salvato>) }
      if (!s.tabs.some((x) => x.id === HOME_ID)) s.tabs = [BASE.tabs[0]!, ...s.tabs]
      if (!s.tabs.some((x) => x.id === s.attiva)) s.attiva = HOME_ID
      return s
    }
  } catch {
    // niente memoria del browser: si riparte dalla Home
  }
  return BASE
}

interface Home extends Salvato {
  albero: NodoArg[]
  caricato: boolean
  sel: string | null
  query: string
  /** scheda per cui si sta ancora aprendo l'autore/testo: evita che le sincronizzazioni si rincorrano */
  occupato: boolean
  /** schede chiuse di recente, per riaprire l'ultima */
  chiuse: SchedaApp[]

  carica(): Promise<void>
  imposta(p: Partial<Home>): void
  attiva_(id: string): void
  apri(n: NodoArg): void
  chiudiScheda(id: string): void
  riapriScheda(): void
  muovi(da: string, a: string): void
  vai(rel: string): void
  preferito(rel: string): void
  commutaEspanso(rel: string): void
  sincronizzaEditor(autoreId: string, testoId: string | null): void
}

export function trova(albero: NodoArg[], rel: string): NodoArg | null {
  for (const n of albero) {
    if (n.rel === rel) return n
    const f = trova(n.figli, rel)
    if (f) return f
  }
  return null
}

export function tutti(albero: NodoArg[]): NodoArg[] {
  return albero.flatMap((n) => [n, ...tutti(n.figli)])
}

export function idScheda(n: { tipo: string; rel?: string; autoreId?: string; testoId?: string }): string {
  if (n.tipo === 'situazioni') return `sit:${n.rel}`
  if (n.tipo === 'appunto') return `app:${n.rel}`
  return n.tipo === 'testo' ? `testo:${n.autoreId}/${n.testoId}` : `mappa:${n.autoreId}`
}

/** I nodi che si aprono in una scheda (gli altri sono cartelle in cui si entra). */
export const èDocumento = (n: { tipo: string }): boolean => n.tipo === 'mappa' || n.tipo === 'testo' || n.tipo === 'situazioni' || n.tipo === 'appunto'

/** Percorso di cartelle per arrivare a un nodo: i suoi antenati, dalla materia in giù. */
export function antenati(rel: string): string[] {
  const p = rel.split('#')[0]!.split('/')
  return p.slice(0, -1).map((_, i) => p.slice(0, i + 1).join('/'))
}

export const useHome = create<Home>((set, get) => {
  const salva = (): void => {
    const { tabs, attiva, alberoAperto, espansi, vista, ordina, preferiti, recenti, percorso } = get()
    try {
      localStorage.setItem(CHIAVE, JSON.stringify({ tabs, attiva, alberoAperto, espansi, vista, ordina, preferiti, recenti, percorso }))
    } catch {
      // vedi sopra
    }
  }
  const aggiorna = (p: Partial<Home>): void => {
    set(p)
    salva()
  }
  return {
    ...leggi(),
    albero: [],
    caricato: false,
    sel: null,
    query: '',
    occupato: false,
    chiuse: [],

    async carica() {
      const albero = await window.api.albero()
      // via le schede di documenti che non esistono più (archiviati o spostati da fuori)
      const s = get()
      const tabs = s.tabs.filter((t) => {
        if (t.tipo === 'home') return true
        const autore = t.tipo === 'testo' || t.tipo === 'mappa' ? tutti(albero).find((n) => n.tipo === 'autore' && n.autoreId === t.autoreId) : undefined
        const rel = t.tipo === 'situazioni' || t.tipo === 'appunto' ? (t.rel ?? '') : !autore ? '' : t.tipo === 'testo' ? `${autore.rel}/testi/${t.testoId}` : `${autore.rel}#mappa`
        return !!trova(albero, rel)
      })
      const attiva = tabs.some((t) => t.id === s.attiva) ? s.attiva : HOME_ID
      const percorso = !s.percorso || trova(albero, s.percorso) ? s.percorso : ''
      aggiorna({ albero, caricato: true, tabs, attiva, percorso, preferiti: s.preferiti.filter((r) => trova(albero, r)), recenti: s.recenti.filter((r) => trova(albero, r.rel)), sel: s.sel && trova(albero, s.sel) ? s.sel : null })
    },
    imposta(p) {
      aggiorna(p)
    },
    attiva_(id) {
      if (get().tabs.some((t) => t.id === id)) aggiorna({ attiva: id })
    },
    apri(n) {
      const s = get()
      if (n.tipo === 'file') {
        // non è un documento dell'app: lo apre il sistema con il programma predefinito
        window.api.apriFile(n.rel).catch((e: unknown) => useStore.getState().mostraToast(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e)))
        return
      }
      const doc = èDocumento(n)
      const recenti = doc ? [{ rel: n.rel, t: Date.now() }, ...s.recenti.filter((r) => r.rel !== n.rel)].slice(0, 12) : s.recenti
      // l'albero si apre sul percorso del documento (e sul documento stesso, se contiene altro)
      const espansi = { ...s.espansi }
      for (const a of antenati(n.rel)) espansi[a] = true
      if (!doc) espansi[n.rel] = true
      if (doc) {
        const id = idScheda(n)
        const titolo = n.tipo === 'testo' ? n.nome : (s.albero && trova(s.albero, n.rel.split('#')[0]!)?.nome) || n.nome
        const tabs = s.tabs.some((t) => t.id === id) ? s.tabs : [...s.tabs, { id, tipo: n.tipo as SchedaApp['tipo'], rel: n.tipo === 'situazioni' || n.tipo === 'appunto' ? n.rel : undefined, autoreId: n.autoreId, testoId: n.testoId, titolo }]
        aggiorna({ tabs, attiva: id, recenti, espansi })
      } else {
        aggiorna({ percorso: n.rel, attiva: HOME_ID, sel: null, query: '', recenti, espansi })
      }
    },
    chiudiScheda(id) {
      if (id === HOME_ID) return
      const s = get()
      const i = s.tabs.findIndex((t) => t.id === id)
      if (i < 0) return
      const tabs = s.tabs.filter((t) => t.id !== id)
      const attiva = s.attiva === id ? (tabs[Math.min(i, tabs.length - 1)]?.id ?? HOME_ID) : s.attiva
      aggiorna({ tabs, attiva, chiuse: [s.tabs[i]!, ...s.chiuse].slice(0, 10) })
    },
    riapriScheda() {
      const s = get()
      const t = s.chiuse[0]
      if (!t) return
      const tabs = s.tabs.some((x) => x.id === t.id) ? s.tabs : [...s.tabs, t]
      aggiorna({ tabs, attiva: t.id, chiuse: s.chiuse.slice(1) })
    },
    muovi(da, a) {
      const s = get()
      if (da === a || da === HOME_ID) return
      const tabs = s.tabs.filter((t) => t.id !== da)
      const mosso = s.tabs.find((t) => t.id === da)
      const j = tabs.findIndex((t) => t.id === a)
      if (!mosso || j < 0) return
      const verso = s.tabs.findIndex((t) => t.id === da) < s.tabs.findIndex((t) => t.id === a) ? 1 : 0
      tabs.splice(j + verso, 0, mosso)
      aggiorna({ tabs })
    },
    vai(rel) {
      aggiorna({ percorso: rel, attiva: HOME_ID, sel: null, query: '' })
    },
    preferito(rel) {
      const p = get().preferiti
      aggiorna({ preferiti: p.includes(rel) ? p.filter((x) => x !== rel) : [...p, rel] })
    },
    commutaEspanso(rel) {
      const e = get().espansi
      aggiorna({ espansi: { ...e, [rel]: !e[rel] } })
    },
    /** Quando un testo si apre da altre vie (Nuovo testo, elenco testi, «Apri nell'editor») compare anche come scheda. */
    sincronizzaEditor(autoreId, testoId) {
      const s = get()
      if (s.occupato) return
      if (testoId) {
        const id = `testo:${autoreId}/${testoId}`
        if (s.attiva === id) return
        const m = useStore.getState().modello
        const titolo = m?.testi.find((t) => t.id === testoId)?.titolo ?? testoId
        const tabs = s.tabs.some((t) => t.id === id) ? s.tabs : [...s.tabs, { id, tipo: 'testo' as const, autoreId, testoId, titolo }]
        aggiorna({ tabs, attiva: id })
      } else {
        // l'editor si è chiuso con «Torna alla Home»: si va alla Home
        const att = s.tabs.find((t) => t.id === s.attiva)
        if (att?.tipo === 'testo') aggiorna({ attiva: HOME_ID })
      }
    }
  }
})

/** Mette l'app nello stato giusto per la scheda attiva: autore giusto, editor aperto o chiuso. */
export async function allineaVista(): Promise<void> {
  const h = useHome.getState()
  const t = h.tabs.find((x) => x.id === h.attiva) ?? h.tabs[0]!
  const ed = useEditor.getState()
  useHome.setState({ occupato: true })
  try {
    if (t.tipo === 'home' || t.tipo === 'situazioni' || t.tipo === 'appunto') {
      if (ed.testoId) ed.imposta({ testoId: null, sel: null, anchor: null, testa: null, selettoreOpen: false })
      return
    }
    const st = useStore.getState()
    if (st.stato?.autoreId !== t.autoreId && t.autoreId) {
      ed.imposta({ testoId: null })
      await st.scegliAutore(t.autoreId)
    }
    if (t.tipo === 'testo' && t.testoId) {
      if (useEditor.getState().testoId !== t.testoId) {
        useEditor.getState().imposta({ testoId: t.testoId, sel: null, anchor: null, testa: null, tab: 'ann', annDet: null, esDet: null })
      }
    } else if (useEditor.getState().testoId) {
      useEditor.getState().imposta({ testoId: null, sel: null, anchor: null, testa: null, selettoreOpen: false })
    }
  } finally {
    useHome.setState({ occupato: false })
  }
}
