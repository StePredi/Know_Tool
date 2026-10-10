import { Fragment, useEffect, useMemo, useRef } from 'react'
import { corsieBarre, daSistemare } from '@shared/testo'
import type { Annotazione, Evidenzia } from '@shared/types'
import { useEditor } from './stato'
import { useTesto } from './dati'

const PRIORITA: Evidenzia[] = ['dubbio', 'definizione', 'concetto']
const COLORE: Record<Evidenzia, string> = { concetto: 'var(--hl-concetto)', definizione: 'var(--hl-definizione)', dubbio: 'var(--hl-dubbio)' }
const BARRA: Record<Evidenzia, string> = { concetto: 'var(--hb-concetto)', definizione: 'var(--hb-definizione)', dubbio: 'var(--hb-dubbio)' }

/** Il testo: parole selezionabili, evidenziazione continua, barre impilate per le sovrapposizioni. */
export function TestoCard() {
  const dati = useTesto()
  const ed = useEditor()
  const trascina = useRef(false)
  const base = dati ? 20 * (ed.zoom / 100) : 20

  const calcolo = useMemo(() => {
    if (!dati) return null
    const vive = dati.testo.annotazioni.filter((a) => a.span && !daSistemare(a.stato))
    const corsia = corsieBarre(vive)
    const perToken: Annotazione[][] = dati.tk.token.map(() => [])
    for (const a of vive) for (let i = a.span![0]; i <= a.span![1] && i < perToken.length; i++) perToken[i]!.push(a)
    const dominante = perToken.map((l) => {
      for (const k of PRIORITA) {
        const t = l.find((a) => a.evidenzia === k)
        if (t) return t
      }
      return null
    })
    return { corsia, perToken, dominante }
  }, [dati])

  useEffect(() => {
    const su = (): void => {
      trascina.current = false
    }
    document.addEventListener('mouseup', su)
    return () => document.removeEventListener('mouseup', su)
  }, [])

  if (!dati || !calcolo) return null
  const { testo, tk } = dati
  const { token, blocchi } = tk
  const sel = ed.sel
  const dentro = (i: number): boolean => !!sel && i >= sel[0] && i <= sel[1]
  const conParafrasi = new Set(testo.parafrasi.filter((p) => p.span && !daSistemare(p.stato)).map((p) => tk.token[p.span![0]]?.blocco))

  const stileParola = (i: number, gap: boolean): React.CSSProperties => {
    // gap = lo spazio dopo la parola i: è evidenziato solo se anche la parola successiva appartiene allo stesso blocco di evidenziazione
    const d = calcolo.dominante[i]
    const prossimo = calcolo.dominante[i + 1]
    const bordo = gap ? d && prossimo === d && token[i + 1]?.blocco === token[i]!.blocco : !!d
    const prec = calcolo.dominante[i - 1]
    const inizio = !gap && d && !(prec === d && token[i - 1]?.blocco === token[i]!.blocco)
    const fine = !gap && d && !(prossimo === d && token[i + 1]?.blocco === token[i]!.blocco)
    const strati: string[] = []
    // barre: una per annotazione, impilate dal basso
    const barre = calcolo.perToken[i]!.filter((a) => a.evidenzia || a.sottolinea)
    let visibili = 0
    for (const a of barre) {
      const k = calcolo.corsia.get(a.id) ?? 0
      if (k > 2) continue
      if (gap) {
        const succ = calcolo.perToken[i + 1]
        if (!succ?.includes(a) || token[i + 1]?.blocco !== token[i]!.blocco) continue
      }
      const col = a.sottolinea ? 'var(--ink)' : BARRA[a.evidenzia!]
      strati.push(`linear-gradient(${col},${col}) 0 calc(100% - ${k * 4}px)/100% 3px no-repeat`)
      visibili++
    }
    void visibili
    const nelSel = gap ? dentro(i) && dentro(i + 1) : dentro(i)
    if (nelSel) strati.unshift('linear-gradient(color-mix(in oklab, var(--focus) 26%, transparent),color-mix(in oklab, var(--focus) 26%, transparent))')
    return {
      background: [...strati, bordo && d?.evidenzia ? `linear-gradient(${COLORE[d.evidenzia]},${COLORE[d.evidenzia]})` : ''].filter(Boolean).join(','),
      borderRadius: inizio && fine ? 5 : inizio ? '5px 0 0 5px' : fine ? '0 5px 5px 0' : 0,
      paddingBottom: 2,
      boxShadow: !gap && dentro(i) ? `${sel![0] === i ? '-2px' : '0'} 0 0 0 var(--focus), ${sel![1] === i ? '2px' : '0'} 0 0 0 var(--focus)` : undefined
    }
  }

  const giu = (i: number, shift: boolean): void => {
    trascina.current = true
    if (shift && ed.anchor != null) ed.seleziona(ed.anchor, i)
    else ed.seleziona(i, i)
  }
  const sopra = (i: number): void => {
    if (trascina.current && ed.anchor != null) ed.seleziona(ed.anchor, i)
  }
  const clic = (i: number): void => {
    // un clic su una parola già annotata seleziona l'intero passo (il più stretto) e lo mostra nel pannello
    if (ed.anchor !== i || ed.testa !== i) return
    const l = calcolo.perToken[i]!.slice().sort((a, b) => a.span![1] - a.span![0] - (b.span![1] - b.span![0]))
    if (l[0]) ed.imposta({ sel: [l[0].span![0], l[0].span![1]], pannello: 'ann' })
  }

  return (
    <article
      data-textcard
      aria-label="Testo"
      style={{ margin: '0 auto', width: 'fit-content', maxWidth: testo.layout === 'prosa' ? '68ch' : '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '44px 56px 52px 28px', fontSize: base, lineHeight: 1.85, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
    >
      {blocchi.map((b) => {
        const num = ed.numeri && testo.layout === 'verso' && (b.index === 0 || (b.index + 1) % 5 === 0)
        const pezzi: React.ReactNode[] = []
        if (b.pre) pezzi.push(<Fragment key="pre">{b.pre}</Fragment>)
        for (let i = b.da; i <= b.a; i++) {
          const t = token[i]!
          const dopo = testo.corpo.slice(t.end, i < b.a ? token[i + 1]!.start : b.end)
          pezzi.push(
            <span
              key={i}
              data-i={i}
              onMouseDown={(e) => {
                if (e.button === 0) giu(i, e.shiftKey)
              }}
              onMouseEnter={() => sopra(i)}
              onClick={() => clic(i)}
              style={{ ...stileParola(i, false), cursor: 'text' }}
            >
              {t.text}
            </span>
          )
          if (dopo) pezzi.push(<span key={`g${i}`} style={stileParola(i, true)}>{dopo}</span>)
        }
        return (
          <div key={b.index} data-blocco={b.index} style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: testo.layout === 'prosa' ? '1.1em' : 0, userSelect: 'none' }}>
            <span aria-hidden style={{ flex: 'none', width: 28, textAlign: 'right', fontSize: '0.62em', color: 'var(--mute)', fontWeight: 700, opacity: num ? 1 : 0 }}>{b.index + 1}</span>
            <span style={{ whiteSpace: testo.layout === 'prosa' ? 'normal' : 'pre-wrap' }}>{pezzi}</span>
            {conParafrasi.has(b.index) && (
              <button type="button" title="Questo passo ha una parafrasi" aria-label="Vai alla parafrasi" onClick={() => ed.imposta({ pannello: 'par', destraAperta: true })} style={{ flex: 'none', alignSelf: 'center', border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--mute)', borderRadius: 6, fontSize: 12, padding: '0 6px', cursor: 'pointer' }}>¶</button>
            )}
          </div>
        )
      })}
      {!blocchi.length && <p style={{ color: 'var(--mute)', fontSize: 15 }}>Il testo è vuoto. Usa «✎ Modifica testo» per incollarlo.</p>}
    </article>
  )
}
