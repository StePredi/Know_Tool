import type { Situazioni } from '@shared/situazioni'
import { ordineSchede } from '@shared/situazioni'

export interface InfoScheda {
  /** posizione del ramo = livello (parte da 0) */
  bi: number
  gruppo: string | null
}

export function costruisciIndici(d: Situazioni): { ordine: string[]; info: Record<string, InfoScheda>; pagliaio: Record<string, string> } {
  const ordine = ordineSchede(d.indice).filter((id) => d.schede[id])
  const info: Record<string, InfoScheda> = {}
  d.indice.rami.forEach((r, bi) => r.voci.forEach((v) => v.schede.forEach((id) => (info[id] = { bi, gruppo: v.gruppo ?? null }))))
  const pagliaio: Record<string, string> = {}
  for (const id of ordine) {
    const s = d.schede[id]!
    const pin = s.tipo === 'figura' ? [...s.disegno.sinistra, ...s.disegno.destra].map((p) => [p.etichetta, p.gpio ? 'gpio' + p.gpio : '', ...p.funzioni].join(' ')).join(' ') : ''
    pagliaio[id] = norm([s.sigla, s.comando, s.titolo, s.parole, pin, d.indice.rami[info[id]!.bi]!.nome, info[id]!.gruppo ?? ''].join(' '))
  }
  return { ordine, info, pagliaio }
}

export const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function cerca(q: string, ordine: string[], pagliaio: Record<string, string>): string[] {
  const t = norm(q).split(/\s+/).filter(Boolean)
  if (!t.length) return []
  return ordine.filter((id) => t.every((x) => pagliaio[id]!.includes(x)))
}
