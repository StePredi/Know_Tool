import { useMemo } from 'react'
import { tokenizza, type Tokenizzato, daSistemare } from '@shared/testo'
import type { Annotazione, Evidenzia, Modello, Raccolta, Span, Testo, VoceScritta } from '@shared/types'
import { useStore } from '../store'
import { useEditor } from './stato'

export function useTesto(): { testo: Testo; tk: Tokenizzato; modello: Modello } | null {
  const modello = useStore((s) => s.modello)
  const id = useEditor((s) => s.testoId)
  const testo = modello?.testi.find((t) => t.id === id) ?? null
  const tk = useMemo(() => (testo ? tokenizza(testo.corpo, testo.layout) : null), [testo?.corpo, testo?.layout]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!modello || !testo || !tk) return null
  return { testo, tk, modello }
}

const agg = (m: Modello): void => useStore.getState().applica(m)
const errore = (e: unknown): void => useStore.getState().mostraToast((e as Error).message.replace(/^Error invoking remote method '[^']*': (Error: )?/, ''))

export async function salvaVoce(testoId: string, raccolta: Raccolta, voce: VoceScritta): Promise<string | null> {
  try {
    const r = await window.api.salvaVoce(testoId, raccolta, voce)
    agg(r.modello)
    return r.id
  } catch (e) {
    errore(e)
    return null
  }
}

export async function eliminaVoce(testoId: string, raccolta: Raccolta, id: string): Promise<void> {
  try {
    agg(await window.api.eliminaVoce(testoId, raccolta, id))
  } catch (e) {
    errore(e)
  }
}

export async function salvaRaccolta(testoId: string, raccolta: Raccolta, voci: VoceScritta[]): Promise<void> {
  try {
    agg(await window.api.salvaRaccolta(testoId, raccolta, voci))
  } catch (e) {
    errore(e)
  }
}

export const spanUguale = (a: Span | null, b: Span | null): boolean => !!a && !!b && a[0] === b[0] && a[1] === b[1]

/** L'annotazione che sta esattamente sul passo selezionato, se c'è. */
export function correnteDi(testo: Testo, sel: Span | null): Annotazione | null {
  if (!sel) return null
  return testo.annotazioni.find((a) => !daSistemare(a.stato) && spanUguale(a.span, sel)) ?? null
}

export const èVuota = (a: Annotazione): boolean =>
  !a.evidenzia && !a.figura && !a.parola_chiave && !a.flashcard && !a.sottolinea && !a.schede.length && !a.nota.trim()

type Marca = 'parola_chiave' | 'flashcard' | 'sottolinea'

/** Accende o spegne una marcatura sul passo selezionato; crea l'annotazione se serve e la toglie se resta vuota. */
export async function commutaMarca(
  testo: Testo,
  sel: Span,
  citato: string,
  cambio: { evidenzia: Evidenzia } | { marca: Marca }
): Promise<void> {
  const cur = correnteDi(testo, sel)
  const campi: Partial<Annotazione> =
    'evidenzia' in cambio
      ? { evidenzia: cur?.evidenzia === cambio.evidenzia ? null : cambio.evidenzia }
      : { [cambio.marca]: !cur?.[cambio.marca] }
  if (!cur) {
    await salvaVoce(testo.id, 'annotazioni', { span: sel, citato, evidenzia: null, figura: null, parola_chiave: false, sottolinea: false, nota: '', flashcard: false, schede: [], ...campi })
    return
  }
  const dopo = { ...cur, ...campi }
  if (èVuota(dopo)) await eliminaVoce(testo.id, 'annotazioni', cur.id)
  else await salvaVoce(testo.id, 'annotazioni', { id: cur.id, ...campi })
}

/** Crea (se manca) l'annotazione sul passo e scrive un campo: è ciò che succede quando si comincia a scrivere una nota. */
export async function scriviCampoAnnotazione(testo: Testo, sel: Span, citato: string, campi: Partial<Annotazione>): Promise<void> {
  const cur = correnteDi(testo, sel)
  if (cur) {
    const dopo = { ...cur, ...campi }
    if (èVuota(dopo)) await eliminaVoce(testo.id, 'annotazioni', cur.id)
    else await salvaVoce(testo.id, 'annotazioni', { id: cur.id, ...campi })
  } else {
    const nuova = { span: sel, citato, evidenzia: null, figura: null, parola_chiave: false, sottolinea: false, nota: '', flashcard: false, schede: [], ...campi }
    if (!èVuota(nuova as Annotazione)) await salvaVoce(testo.id, 'annotazioni', nuova)
  }
}
