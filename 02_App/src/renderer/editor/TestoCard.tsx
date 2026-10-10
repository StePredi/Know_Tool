import { useEffect, useMemo } from 'react'
import { corsieBarre, daSistemare } from '@shared/testo'
import type { Annotazione, Esercizio, Evidenzia } from '@shared/types'
import { useEditor } from './stato'
import { statoEs, useTesto } from './dati'
import { larghezzaDx } from './Pannelli'

const HL: Record<Evidenzia, string> = { concetto: 'var(--hl-c)', definizione: 'var(--hl-d)', dubbio: 'var(--hl-u)' }
const STRONG: Record<Evidenzia, string> = { concetto: 'var(--hl-c2)', definizione: 'var(--hl-d2)', dubbio: 'var(--hl-u2)' }
const PRI: Record<Evidenzia, number> = { concetto: 1, definizione: 2, dubbio: 3 }
const MAXC = 3

interface Pittura {
  bg: string
  img: string
  size: string
  pos: string
  extra: number
  any: boolean
}

/** Il testo: parole selezionabili, evidenziazione continua, barre impilate per le sovrapposizioni. */
export function TestoCard() {
  const d = useTesto()
  const ed = useEditor()

  useEffect(() => {
    const su = (): void => {
      if (useEditor.getState().dragging) useEditor.setState({ dragging: false })
    }
    document.addEventListener('mouseup', su)
    return () => document.removeEventListener('mouseup', su)
  }, [])

  const calcolo = useMemo(() => {
    if (!d) return null
    const { testo, tk } = d
    const toks = tk.token
    const viva = (a: { span: [number, number] | null; stato: Annotazione['stato'] }): boolean => !!a.span && !daSistemare(a.stato) && a.span[1] < toks.length
    const anns = testo.annotazioni.filter(viva)
    const lane = corsieBarre(anns)
    const cov: Annotazione[][] = toks.map(() => [])
    const stile = toks.map(() => ({ wt: 400, dec: 'none' }))
    for (const a of anns) {
      for (let i = a.span![0]; i <= a.span![1] && i < toks.length; i++) {
        cov[i]!.push(a)
        if (a.parola_chiave) stile[i]!.wt = 700
        if (a.figura) stile[i]!.dec = 'underline wavy var(--ed)'
      }
    }
    const dipingi = (list: Annotazione[]): Pittura => {
      let band: Evidenzia | null = null
      for (const a of list) if (a.evidenzia && (!band || PRI[a.evidenzia] >= PRI[band])) band = a.evidenzia
      const bars: { k: number; c: string }[] = []
      let extra = 0
      for (const a of list) {
        const k = lane.get(a.id)
        if (k == null) continue
        if (k >= MAXC) {
          extra++
          continue
        }
        bars.push({ k, c: a.sottolinea ? 'var(--ink)' : STRONG[a.evidenzia!] })
      }
      bars.sort((x, y) => x.k - y.k)
      return {
        bg: band ? HL[band] : 'transparent',
        img: bars.length ? bars.map((b) => `linear-gradient(${b.c},${b.c})`).join(',') : 'none',
        size: bars.length ? bars.map(() => '100% 2.5px').join(',') : 'auto',
        pos: bars.length ? bars.map((b) => `left bottom ${b.k * 4.5}px`).join(',') : '0 0',
        extra,
        any: !!band || !!bars.length
      }
    }
    const tokPaint = cov.map(dipingi)
    const sepPaint = toks.map((t, i) => {
      const n = toks[i + 1]
      if (!n || n.blocco !== t.blocco) return null
      const comuni = cov[i]!.filter((a) => cov[i + 1]!.includes(a))
      return comuni.length ? dipingi(comuni) : null
    })
    const parTok = new Set<number>()
    for (const p of testo.parafrasi) if (viva(p)) for (let i = p.span![0]; i <= p.span![1]; i++) parTok.add(i)
    const esTok = new Map<number, Esercizio>()
    for (const e of testo.esercizi) for (const p of e.passi) if (viva(p)) for (let i = p.span![0]; i <= p.span![1]; i++) esTok.set(i, e)
    return { tokPaint, sepPaint, stile, parTok, esTok, cov }
  }, [d])

  if (!d || !calcolo) return null
  const { testo, tk } = d
  const toks = tk.token
  const sel = ed.sel
  const { tokPaint, sepPaint, stile, parTok, esTok, cov } = calcolo
  const zoomFs = +((19 * ed.zoom) / 100).toFixed(1)
  const numFs = +(12 * Math.max(0.9, ed.zoom / 100)).toFixed(1)
  const numW = ed.numeri ? 26 : 0
  const cardW = Math.round(760 * Math.max(1, ed.zoom / 100))
  const prosa = testo.layout === 'prosa'
  const mix = (c: string): string => `color-mix(in srgb, var(--focus) 26%, ${c === 'transparent' ? 'var(--surface)' : c})`

  const parola = (i: number): React.ReactNode => {
    const t = toks[i]!
    const inSel = !!sel && i >= sel[0] && i <= sel[1]
    const blk = tk.blocchi[t.blocco]!
    const next = toks[i + 1]
    let after = next && next.blocco === t.blocco ? testo.corpo.slice(t.end, next.start) : testo.corpo.slice(t.end, blk.end)
    if (prosa) after = after.replace(/\n/g, ' ')
    const p = tokPaint[i]!
    const sp = sepPaint[i]
    const spv = sepPaint[i - 1]
    const joinL = !!(spv && spv.any)
    const joinR = !!(sp && sp.any)
    const aInSel = !!(inSel && next && next.blocco === t.blocco && sel && i + 1 <= sel[1])
    const r1 = joinL ? '0' : '5px'
    const r2 = joinR ? '0' : '5px'
    return (
      <span key={i}>
        <span
          onMouseDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            const s = useEditor.getState()
            if (e.shiftKey && s.sel) {
              const an = s.anchor ?? s.sel[0]
              useEditor.setState({ sel: [Math.min(an, i), Math.max(an, i)], anchor: an, testa: i })
            } else {
              s.seleziona(i, i)
              useEditor.setState({ dragging: true })
            }
          }}
          onClick={() => {
            // un clic su una parola già annotata seleziona l'intero passo (il più stretto) e lo mostra nel pannello
            const s = useEditor.getState()
            if (s.anchor !== i || s.testa !== i) return
            const l = cov[i]!.slice().sort((a, b) => a.span![1] - a.span![0] - (b.span![1] - b.span![0]))
            if (l[0]) s.imposta({ sel: [l[0].span![0], l[0].span![1]], anchor: l[0].span![0], testa: l[0].span![1], tab: 'ann', rightOpen: true })
          }}
          onMouseEnter={() => {
            const s = useEditor.getState()
            if (s.dragging && s.anchor != null) useEditor.setState({ sel: [Math.min(s.anchor, i), Math.max(s.anchor, i)], testa: i })
          }}
          role="button"
          tabIndex={-1}
          aria-pressed={inSel}
          data-i={i}
          style={{
            cursor: 'text',
            fontSize: zoomFs,
            padding: '2px 0 6px',
            borderRadius: `${r1} ${r2} ${r2} ${r1}`,
            backgroundColor: inSel ? mix(p.bg) : p.bg,
            backgroundImage: p.img,
            backgroundSize: p.size,
            backgroundPosition: p.pos,
            backgroundRepeat: 'no-repeat',
            fontWeight: stile[i]!.wt,
            textDecoration: stile[i]!.dec,
            boxShadow: inSel ? `${sel![0] === i ? '-2px' : '0'} 0 0 0 var(--focus), ${sel![1] === i ? '2px' : '0'} 0 0 0 var(--focus)` : undefined,
            textDecorationThickness: 2,
            textUnderlineOffset: 7
          }}
        >
          {t.text}
        </span>
        {p.extra > 0 && (
          <span title={`${p.extra} ${p.extra === 1 ? 'altra annotazione su questa parola' : 'altre annotazioni su questa parola'}`} style={{ fontSize: 9, fontWeight: 700, color: 'var(--mute)', verticalAlign: 'super', padding: '0 1px', userSelect: 'none' }}>
            +{p.extra}
          </span>
        )}
        <span
          style={{
            whiteSpace: prosa ? 'pre-wrap' : 'pre',
            fontSize: zoomFs,
            padding: '2px 0 6px',
            backgroundColor: aInSel ? mix(sp ? sp.bg : 'transparent') : sp ? sp.bg : 'transparent',
            backgroundImage: sp ? sp.img : 'none',
            backgroundSize: sp ? sp.size : 'auto',
            backgroundPosition: sp ? sp.pos : '0 0',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {after}
        </span>
      </span>
    )
  }

  const corpoBlocco = (bi: number): React.ReactNode[] => {
    const b = tk.blocchi[bi]!
    const out: React.ReactNode[] = []
    if (b.da > b.a) out.push(<span key="v" style={{ fontSize: zoomFs, color: 'var(--mute)', userSelect: 'none' }}>{b.raw}</span>)
    else if (b.pre) out.push(<span key="pre" style={{ fontSize: zoomFs, whiteSpace: prosa ? 'pre-wrap' : 'pre', userSelect: 'none' }}>{b.pre}</span>)
    for (let i = b.da; i <= b.a; i++) out.push(parola(i))
    return out
  }

  const badge = (bc: string, bg: string, fg: string): React.CSSProperties => ({ flex: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${bc}`, background: bg, color: fg, borderRadius: 6, padding: '0 6px', fontSize: numFs, fontWeight: 700, cursor: 'pointer', lineHeight: 1.6, whiteSpace: 'nowrap' })

  return (
    <div data-textcard="1" className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: `24px ${ed.rightOpen ? larghezzaDx(ed.vw, ed.leftPin, ed.rightW) + 32 : 196}px 60px ${ed.leftPin ? 290 : 92}px`, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: cardW, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', padding: '30px 32px 34px', margin: '0 auto' }}>
        {!prosa ? (
          <div style={{ fontSize: zoomFs, lineHeight: 1.95, display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '100%' }}>
              {tk.blocchi.map((b, bi) => {
                const n = bi + 1
                const eq = (() => {
                  for (let i = b.da; i <= b.a; i++) if (esTok.has(i)) return esTok.get(i)!
                  return null
                })()
                const haPar = (() => {
                  for (let i = b.da; i <= b.a; i++) if (parTok.has(i)) return true
                  return false
                })()
                const st = eq ? statoEs(eq) : null
                return (
                  <div key={b.index} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <span aria-hidden style={{ flex: 'none', width: numW, textAlign: 'right', fontSize: numFs, fontWeight: 700, color: 'var(--mute)', userSelect: 'none' }}>{ed.numeri && (n === 1 || n % 5 === 0) ? n : ''}</span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 0, overflowWrap: 'anywhere' }}>{corpoBlocco(bi)}</div>
                    {eq && (
                      <button type="button" title={`Domanda ${eq.numero} su questo passo`} aria-label={`Domanda ${eq.numero} su questo passo`} onClick={() => ed.imposta({ tab: 'es', esDet: eq.id, esEdit: null })} style={badge(st === 'corretta' ? 'var(--par)' : st === 'da_correggere' ? 'var(--warn-line)' : 'var(--line)', st === 'corretta' ? 'var(--par-bg)' : st === 'da_correggere' ? 'var(--warn-bg)' : 'var(--surface2)', st === 'corretta' ? 'var(--par)' : st === 'da_correggere' ? 'var(--warn-ink)' : 'var(--mute)')}>
                        ?<span style={{ fontSize: numFs }}>{eq.numero}</span>
                      </button>
                    )}
                    {haPar && (
                      <button type="button" title="Questo verso ha una parafrasi collegata" aria-label="Vai alla parafrasi collegata" onClick={() => ed.imposta({ tab: 'par' })} style={badge('var(--par)', 'var(--par-bg)', 'var(--par)')}>¶</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: zoomFs, lineHeight: 1.95, maxWidth: '68ch', margin: '0 auto' }}>
            {tk.blocchi.map((b, bi) => (
              <p key={b.index} style={{ margin: '0 0 16px', fontSize: 0, overflowWrap: 'anywhere' }}>{corpoBlocco(bi)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
