import { useMemo } from 'react'
import { citaDa, tokenizza, type Tokenizzato, daSistemare } from '@shared/testo'
import type { Annotazione, Esercizio, Evidenzia, Layout, Modello, Raccolta, Span, Testo, VoceScritta } from '@shared/types'
import { useStore } from '../store'
import { useEditor, type Bozza } from './stato'

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

// ------------------------------------------------------------------ aiuti per l'interfaccia


/** Una voce con l'ancora scrivibile: se è rotta si riporta lo span scritto nel file, così non si perde. */
export const scrivibile = <T extends { span: Span | null; spanScritto: Span | null }>(v: T): VoceScritta => ({ ...v, span: v.span ?? v.spanScritto }) as unknown as VoceScritta

export type StatoEs = 'da_svolgere' | 'da_correggere' | 'corretta'
export const statoEs = (e: Esercizio): StatoEs => (!e.risposta.trim() ? 'da_svolgere' : !e.correzione.trim() ? 'da_correggere' : 'corretta')

/** «v. 2», «vv. 4–6», «¶ 2» */
export function rigaDi(tk: Tokenizzato, layout: Layout, span: Span | null): string {
  if (!span || !tk.token[span[0]] || !tk.token[span[1]]) return '—'
  const i = tk.token[span[0]]!.blocco
  const j = tk.token[span[1]]!.blocco
  if (layout === 'prosa') return `¶ ${i + 1}`
  return j > i ? `vv. ${i + 1}–${j + 1}` : `v. ${i + 1}`
}

/** Modifica una annotazione esistente; se resta vuota la toglie. */
export async function modificaAnn(testo: Testo, id: string, campi: Partial<Annotazione>): Promise<void> {
  const cur = testo.annotazioni.find((a) => a.id === id)
  if (!cur) return
  if (èVuota({ ...cur, ...campi })) await eliminaVoce(testo.id, 'annotazioni', id)
  else await salvaVoce(testo.id, 'annotazioni', { id, ...campi })
}

/** Mette (o toglie, se è già quella) una figura sull'annotazione bersaglio o, in mancanza, sulla selezione. */
export async function applicaFigura(testo: Testo, tk: Tokenizzato, sel: Span | null, targetId: string | null, figura: string | null): Promise<void> {
  const target = (targetId ? testo.annotazioni.find((a) => a.id === targetId) : null) ?? correnteDi(testo, sel)
  if (target) {
    await modificaAnn(testo, target.id, { figura: target.figura === figura ? null : figura })
  } else if (sel && figura) {
    await scriviCampoAnnotazione(testo, sel, citaDa(testo.corpo, tk.token, sel), { figura })
  }
}

/** Divide un blocco incollato in domande (numerate, a paragrafi o una per riga). */
export function separaDomande(txt: string): Bozza[] {
  const src = (txt || '').replace(/\r/g, '')
  const righe = src.split('\n')
  const prima = (righe.find((r) => r.trim()) || '').trim()
  const numerata = righe.some((r) => /^\s*\d{1,2}\s*[).\]]\s+\S/.test(r)) || /^1\s+\S/.test(prima)
  const out: string[] = []
  if (numerata) {
    let corrente: string | null = null
    let atteso = 1
    for (const r of righe.map((x) => x.trim()).filter(Boolean)) {
      const m = r.match(/^(\d{1,2})\s*([).\]])?\s+(.*)$/)
      const n = m ? parseInt(m[1]!, 10) : 0
      const nuova = !!m && (m[2] ? n >= atteso : n === atteso)
      if (nuova && m) {
        if (corrente) out.push(corrente)
        corrente = m[3]!
        atteso = n + 1
      } else if (corrente) corrente += ' ' + r
      else corrente = r
    }
    if (corrente) out.push(corrente)
  } else if (/\n[ \t]*\n/.test(src)) {
    for (const b of src.split(/\n[ \t]*\n+/)) {
      const t = b.split('\n').map((r) => r.trim()).filter(Boolean).join(' ').trim()
      if (t) out.push(t)
    }
  } else {
    for (const r of righe.map((x) => x.trim()).filter(Boolean)) out.push(r)
  }
  return out.map((t, i) => ({ id: 'b' + i, testo: t }))
}

