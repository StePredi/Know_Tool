import type { Situazioni } from '@shared/situazioni'

export interface SezioneFormulario {
  id: string
  nome: string
  colore: string
  /** numero del ramo, partendo da 1 */
  n: number
  ids: string[]
}

/** I rami che hanno almeno una scheda da mostrare nel Formulario (tutte, oppure solo quelle trovate dalla ricerca). */
export function sezioniFormulario(dati: Situazioni, corrisp: Set<string> | null): SezioneFormulario[] {
  return dati.indice.rami
    .map((r, bi) => ({ id: r.id, nome: r.nome, colore: r.colore as string, n: bi + 1, ids: r.voci.flatMap((v) => v.schede).filter((id) => dati.schede[id] && (!corrisp || corrisp.has(id))) }))
    .filter((x) => x.ids.length > 0)
}

/** Il Formulario ha senso solo se c'è almeno una scheda «regola». */
export function haFormule(dati: Situazioni): boolean {
  return Object.values(dati.schede).some((s) => s.tipo === 'regola')
}
