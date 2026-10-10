import { useEffect, useMemo, useRef } from 'react'
import { calcolaMappa, AXIS, PADL } from '@shared/layout'
import { useColore, useStore } from '../store'
import { usaFiltro } from '../utili'

export const EVENTO_SENZA_DATA = 'kt-senza-data'

export function Mappa() {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const selId = useStore((s) => s.selId)
  const corsieSpente = useStore((s) => s.corsieSpente)
  const imposta = useStore((s) => s.imposta)
  const scuro = useStore((s) => s.scuro)
  const sobria = useStore((s) => s.sobria)
  const colore = useColore()
  const passa = usaFiltro()
  const scroller = useRef<HTMLDivElement>(null)

  const L = useMemo(
    () => calcolaMappa({ modello: m, indice: ix, corsieSpente, passa, selId, colore }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [m, ix, corsieSpente, passa, selId, scuro, sobria]
  )

  // salto alla zona «Senza data»
  useEffect(() => {
    const vai = (): void => scroller.current?.scrollTo({ left: Math.max(0, L.senzaData.x - 200), behavior: 'smooth' })
    window.addEventListener(EVENTO_SENZA_DATA, vai)
    return () => window.removeEventListener(EVENTO_SENZA_DATA, vai)
  }, [L.senzaData.x])

  // la scheda selezionata resta in vista
  useEffect(() => {
    if (!selId) return
    document.getElementById(`card-${selId}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selId])

  // trascinamento per spostarsi
  const pan = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)
  const giu = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('button')) return
    const el = scroller.current!
    pan.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop }
    const muovi = (ev: MouseEvent): void => {
      if (!pan.current) return
      el.scrollLeft = pan.current.sl - (ev.clientX - pan.current.x)
      el.scrollTop = pan.current.st - (ev.clientY - pan.current.y)
    }
    const su = (): void => {
      pan.current = null
      window.removeEventListener('mousemove', muovi)
      window.removeEventListener('mouseup', su)
    }
    window.addEventListener('mousemove', muovi)
    window.addEventListener('mouseup', su)
    imposta({ selId: null })
  }

  // frecce: scheda precedente / successiva fra quelle visibili
  const tasto = (e: React.KeyboardEvent): void => {
    const vis = ix.chron.filter((s) => passa(s) && !corsieSpente[s.corsia])
    const i = vis.findIndex((s) => s.id === selId)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const n = vis[i < 0 ? 0 : Math.min(vis.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))]
      if (n) {
        imposta({ selId: n.id })
        document.getElementById(`card-${n.id}`)?.focus()
      }
    } else if (e.key === 'Enter' && selId) imposta({ apertaId: selId })
    else if (e.key === 'Escape') imposta({ selId: null })
  }

  return (
    <div ref={scroller} onMouseDown={giu} onKeyDown={tasto} style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', background: 'var(--bg)' }}>
      <div style={{ position: 'relative', width: L.canvasW, height: L.canvasH }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 7, height: AXIS, background: 'var(--axis)', borderBottom: '1px solid var(--line)', width: L.canvasW }}>
          {L.ticks.map((t) => (
            <span key={t.label + t.x} style={{ position: 'absolute', top: 6, left: t.x, fontSize: 11, fontWeight: 700, color: 'var(--mute)', whiteSpace: 'nowrap' }}>{t.label}</span>
          ))}
          {L.breaks.map((b) => (
            <span key={b.x} title="Intervallo senza schede, compresso" style={{ position: 'absolute', top: 4, left: b.lx, fontSize: 11, fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{b.label}</span>
          ))}
          {L.senzaData.n > 0 && (
            <span style={{ position: 'absolute', top: 4, left: L.senzaData.x, fontSize: 11, fontWeight: 700, background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: 999, padding: '1px 9px', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              Senza data · {L.senzaData.n}
            </span>
          )}
        </div>

        {L.breaks.map((b) => (
          <div key={b.x} aria-hidden style={{ position: 'absolute', top: AXIS, left: b.x, width: b.w, bottom: 0, zIndex: 3, background: 'repeating-linear-gradient(135deg,var(--line2) 0 2px,transparent 2px 8px)', borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)' }} />
        ))}
        {L.senzaData.n > 0 && (
          <div aria-hidden style={{ position: 'absolute', top: AXIS, left: L.senzaData.x, width: L.senzaData.w, bottom: 0, zIndex: 2, background: 'color-mix(in oklab, var(--mute) 9%, transparent)', borderLeft: '2px dashed var(--line)' }} />
        )}

        {L.corsie.map((c, i) => (
          <div key={c.id} style={{ position: 'absolute', left: 0, top: c.top, height: c.h, width: L.canvasW, background: i % 2 ? 'transparent' : 'color-mix(in oklab, var(--surface2) 55%, transparent)', borderBottom: '2px solid var(--line)' }}>
            <div style={{ position: 'sticky', left: 0, top: 0, zIndex: 6, width: PADL - 10, height: '100%', background: 'var(--surface)', padding: '5px 8px 5px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, float: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface2)', borderRadius: 14, padding: '9px 11px' }}>
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: c.col, flex: 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{c.nome}</span>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--mute)', paddingLeft: 4 }}>{c.nSchede} schede</span>
            </div>
            {c.cards.map((k) => (
              <button
                key={k.id}
                id={`card-${k.id}`}
                type="button"
                className="card-mappa"
                aria-pressed={k.selezionata}
                onClick={() => imposta({ selId: k.id })}
                onDoubleClick={() => imposta({ apertaId: k.id })}
                style={{
                  left: k.left,
                  top: k.top,
                  width: k.w,
                  height: k.h,
                  opacity: k.visibile ? 1 : 0.2,
                  borderColor: k.collegata || k.selezionata ? k.col : 'var(--line)',
                  borderWidth: k.collegata ? 2 : 1
                }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6, background: k.col, color: 'var(--on)', padding: '3px 9px', fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ whiteSpace: 'nowrap' }}>{k.data}</span>
                  <span style={{ fontWeight: 700, opacity: 0.9 }}>{k.sigla}</span>
                </span>
                <span style={{ padding: '5px 9px', fontSize: 13, lineHeight: 1.25, fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1, minHeight: 0 }}>{k.titolo}</span>
              </button>
            ))}
          </div>
        ))}

        {L.gridlines.map((x) => (
          <div key={x} style={{ position: 'absolute', top: AXIS, left: x, width: 1, bottom: 0, background: 'var(--line2)' }} />
        ))}

        <svg width={L.canvasW} height={L.canvasH} style={{ position: 'absolute', left: 0, top: 0, zIndex: 4, pointerEvents: 'none', overflow: 'visible' }} aria-hidden>
          {L.edges.map((e, i) => (
            <path key={i} d={e.d} fill="none" stroke={e.col} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
          ))}
        </svg>
      </div>
    </div>
  )
}
