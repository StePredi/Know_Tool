import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dentroFascia, fascePeriodi } from '@shared/derivati'
import { testoCerca, useStore } from './store'
import type { Scheda } from '@shared/types'

/** Grassetto **così** e corsivo *così*, nient'altro: niente HTML dai file. */
export function Md({ testo }: { testo: string }): ReactNode {
  const parti = testo.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parti.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <i key={i}>{p.slice(1, -1)}</i>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  )
}

/** Funzione che dice se una scheda passa ricerca, periodi e temi attivi. */
export function usaFiltro(): (s: Scheda) => boolean {
  const m = useStore((s) => s.modello)
  const ix = useStore((s) => s.indice)
  const query = useStore((s) => s.query)
  const periodi = useStore((s) => s.periodi)
  const temi = useStore((s) => s.temi)
  return useMemo(() => {
    if (!m || !ix) return () => true
    const parole = query.toLowerCase().split(/\s+/).filter(Boolean)
    const fasce = fascePeriodi(m.autore.periodi).filter((f) => periodi.includes(f.indice))
    const testi = new Map<string, string>()
    return (s: Scheda): boolean => {
      if (parole.length) {
        let t = testi.get(s.id)
        if (t == null) testi.set(s.id, (t = testoCerca(m, s)))
        if (!parole.every((w) => t!.includes(w))) return false
      }
      if (fasce.length) {
        const v = ix.num(s)
        if (!fasce.some((f) => dentroFascia(v, f))) return false
      }
      if (temi.length && !temi.some((k) => s.temi.includes(k))) return false
      return true
    }
  }, [m, ix, query, periodi, temi])
}

/**
 * Campo con scrittura immediata: tiene una copia locale, salva dopo una breve pausa
 * e subito quando si lascia il campo. Mentre ha il focus non viene sovrascritto da fuori.
 */
export function usaBozza(valore: string, salva: (v: string) => void, ritardo = 300) {
  const [locale, setLocale] = useState(valore)
  const focus = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimo = useRef(valore)
  const daSalvare = useRef<string | null>(null)
  const salvaRef = useRef(salva)
  salvaRef.current = salva

  useEffect(() => {
    ultimo.current = valore
    if (!focus.current && daSalvare.current == null) setLocale(valore)
  }, [valore])

  const invia = (): void => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (daSalvare.current != null) {
      const v = daSalvare.current
      daSalvare.current = null
      if (v !== ultimo.current) salvaRef.current(v)
    }
  }
  useEffect(() => invia, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    value: locale,
    onChange: (v: string): void => {
      setLocale(v)
      daSalvare.current = v
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(invia, ritardo)
    },
    onFocus: (): void => {
      focus.current = true
    },
    onBlur: (): void => {
      focus.current = false
      invia()
    }
  }
}

export function Campo(props: {
  valore: string
  salva: (v: string) => void
  multi?: boolean
  rows?: number
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  label?: string
  invalido?: boolean
  refEl?: React.Ref<HTMLInputElement & HTMLTextAreaElement>
}): ReactNode {
  const b = usaBozza(props.valore, props.salva)
  const comuni = {
    value: b.value,
    onFocus: b.onFocus,
    onBlur: b.onBlur,
    placeholder: props.placeholder,
    'aria-label': props.label,
    'aria-invalid': props.invalido || undefined,
    className: props.className,
    style: props.style
  }
  return props.multi ? (
    <textarea {...comuni} rows={props.rows ?? 4} onChange={(e) => b.onChange(e.target.value)} />
  ) : (
    <input
      {...comuni}
      ref={props.refEl as React.Ref<HTMLInputElement>}
      onChange={(e) => b.onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}

export const slug = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'nuovo'
