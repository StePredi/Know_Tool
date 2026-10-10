import { citaDa, tokenizza, type Tokenizzato } from '@shared/testo'
import type { Layout, Span, Testo } from '@shared/types'
import { useStore } from '../store'
import { useEditor } from './stato'
import { commutaMarca, salvaVoce } from './dati'

let cache: { c: string; l: Layout; t: Tokenizzato } | null = null
export function tokCache(c: string, l: Layout): Tokenizzato {
  if (!cache || cache.c !== c || cache.l !== l) cache = { c, l, t: tokenizza(c, l) }
  return cache.t
}

/** Il testo aperto e la selezione, letti fuori da React (tastiera, azioni). */
export function contesto(): { testo: Testo; tk: Tokenizzato; sel: Span | null } | null {
  const id = useEditor.getState().testoId
  const testo = useStore.getState().modello?.testi.find((t) => t.id === id)
  if (!testo) return null
  return { testo, tk: tokCache(testo.corpo, testo.layout), sel: useEditor.getState().sel }
}

export function toggleHl(k: 'concetto' | 'definizione' | 'dubbio'): void {
  const c = contesto()
  if (!c?.sel) return
  void commutaMarca(c.testo, c.sel, citaDa(c.testo.corpo, c.tk.token, c.sel), { evidenzia: k })
}

export function toggleFlag(f: 'parola_chiave' | 'flashcard' | 'sottolinea'): void {
  const c = contesto()
  if (!c?.sel) return
  void commutaMarca(c.testo, c.sel, citaDa(c.testo.corpo, c.tk.token, c.sel), { marca: f })
}

export async function nuovaParafrasi(): Promise<void> {
  const c = contesto()
  if (!c?.sel) return
  await salvaVoce(c.testo.id, 'parafrasi', { span: c.sel, citato: citaDa(c.testo.corpo, c.tk.token, c.sel), testo: '' })
  useEditor.getState().imposta({ tab: 'par' })
}

export async function nuovaParafrasiLibera(): Promise<void> {
  const c = contesto()
  if (!c) return
  await salvaVoce(c.testo.id, 'parafrasi', { span: null, citato: '', testo: '' })
  useEditor.getState().imposta({ tab: 'par' })
}

export async function nuovaDomanda(): Promise<void> {
  const c = contesto()
  if (!c?.sel) return
  const id = await salvaVoce(c.testo.id, 'esercizi', { testo: '', risposta: '', correzione: '', fatta: false, passi: [{ span: c.sel, citato: citaDa(c.testo.corpo, c.tk.token, c.sel), et: '' }] })
  useEditor.getState().imposta({ tab: 'es', esFiltro: 'tutti', esEdit: id })
}
