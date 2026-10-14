import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Situazioni } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { calcolaMappa } from './layout'
import { useSit, VISTA0 } from './stato'
import { cerca, type InfoScheda } from './util'

interface Ctx {
  rel: string
  dati: Situazioni
  ordine: string[]
  info: Record<string, InfoScheda>
  pagliaio: Record<string, string>
}

/** Posizione e zoom della mappa, per ritrovarla uguale quando si torna da una scheda. */
const VISTE = new Map<string, { z: number; l: number; t: number }>()
const ZMIN = 0.25
const ZMAX = 2

export function MappaSit({ ctx }: { ctx: Ctx }): ReactNode {
  const { rel, dati, ordine, info, pagliaio } = ctx
  const v = useSit((x) => x.viste[rel] ?? VISTA0)
  const imposta = (p: Partial<typeof v>): void => useSit.getState().imposta(rel, p)
  const [sel, setSel] = useState(0)
  const [pct, setPct] = useState(100)
  const vp = useRef<HTMLDivElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const sizer = useRef<HTMLDivElement>(null)
  const z = useRef(1)
  const mosso = useRef(false)

  const trovate = useMemo(() => cerca(v.q, ordine, pagliaio), [v.q, ordine, pagliaio])
  const corrispondenze = useMemo(() => (v.q.trim() ? new Set(trovate) : null), [v.q, trovate])
  const lay = useMemo(() => calcolaMappa(dati.indice, (id) => !!dati.schede[id]), [dati.indice, dati.schede])
  const idsRamo = useMemo(() => dati.indice.rami.map((r) => r.voci.flatMap((x) => x.schede)), [dati.indice])
  useEffect(() => setSel(0), [v.q])

  const applica = (): void => {
    if (!palco.current || !sizer.current) return
    palco.current.style.transform = `scale(${z.current})`
    sizer.current.style.width = `${Math.round(lay.W * z.current)}px`
    sizer.current.style.height = `${Math.round(lay.H * z.current)}px`
    setPct(Math.round(z.current * 100))
  }
  const ricorda = (): void => {
    if (vp.current) VISTE.set(rel, { z: z.current, l: vp.current.scrollLeft, t: vp.current.scrollTop })
  }
  const zoom = (nz: number, px?: number, py?: number): void => {
    const el = vp.current
    if (!el) return
    nz = Math.max(ZMIN, Math.min(ZMAX, nz))
    const cx = px ?? el.clientWidth / 2
    const cy = py ?? el.clientHeight / 2
    const ux = (el.scrollLeft + cx) / z.current
    const uy = (el.scrollTop + cy) / z.current
    z.current = nz
    applica()
    el.scrollLeft = ux * nz - cx
    el.scrollTop = uy * nz - cy
    ricorda()
  }
  const tutta = (): void => {
    const el = vp.current
    if (!el) return
    z.current = Math.max(ZMIN, Math.min(1.5, Math.min(el.clientWidth / lay.W, el.clientHeight / lay.H)))
    applica()
    el.scrollLeft = 0
    el.scrollTop = 0
    ricorda()
  }

  // vista iniziale: quella di prima, oppure centrata
  useLayoutEffect(() => {
    const el = vp.current
    if (!el) return
    const salvata = VISTE.get(rel)
    if (salvata) {
      z.current = salvata.z
      applica()
      el.scrollLeft = salvata.l
      el.scrollTop = salvata.t
    } else {
      z.current = Math.max(0.6, Math.min(1, el.clientWidth / lay.W))
      applica()
      el.scrollLeft = Math.max(0, (lay.W * z.current - el.clientWidth) / 2)
      el.scrollTop = Math.max(0, (lay.H * z.current - el.clientHeight) / 2)
      ricorda()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lay])

  // trascinamento con la mano, zoom con Ctrl+rotella e tasti + − 0
  useEffect(() => {
    const el = vp.current
    if (!el) return
    let drag: { x: number; y: number; l: number; t: number } | null = null
    const giu = (e: MouseEvent): void => {
      if (e.button !== 0) return
      drag = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop }
      mosso.current = false
    }
    const muovi = (e: MouseEvent): void => {
      if (!drag) return
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      if (!mosso.current && Math.abs(dx) + Math.abs(dy) > 5) { mosso.current = true; el.classList.add('drag') }
      if (mosso.current) { el.scrollLeft = drag.l - dx; el.scrollTop = drag.t - dy }
    }
    const su = (): void => {
      if (!drag) return
      drag = null
      el.classList.remove('drag')
      setTimeout(() => { mosso.current = false }, 0)
    }
    const rotella = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoom(z.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top)
    }
    const tasto = (e: KeyboardEvent): void => {
      const t = document.activeElement as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return
      if (e.ctrlKey || e.metaKey) return
      if (e.key === '+' || e.key === '=') zoom(z.current * 1.2)
      else if (e.key === '-') zoom(z.current / 1.2)
      else if (e.key === '0') zoom(1)
    }
    el.addEventListener('mousedown', giu)
    window.addEventListener('mousemove', muovi)
    window.addEventListener('mouseup', su)
    el.addEventListener('wheel', rotella, { passive: false })
    document.addEventListener('keydown', tasto)
    return () => {
      el.removeEventListener('mousedown', giu)
      window.removeEventListener('mousemove', muovi)
      window.removeEventListener('mouseup', su)
      el.removeEventListener('wheel', rotella)
      document.removeEventListener('keydown', tasto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lay])

  const apri = (id: string): void => imposta({ scheda: id, q: '' })
  const sfumato = (bi: number, ids?: string[]): boolean => {
    if (bi < 0) return false
    if (v.fuoco != null && bi !== v.fuoco) return true
    if (corrispondenze) return !(ids ?? idsRamo[bi]!).some((i) => corrispondenze.has(i))
    return false
  }

  return (
    <>
      <div className="s-top">
        <div>
          <h1>{dati.indice.titolo}</h1>
          {dati.indice.sottotitolo && <p>{dati.indice.sottotitolo}</p>}
        </div>
        <span className="s-count">Ripassate: <b>{dati.ripassate.length}</b> / {ordine.length}</span>
        <div className="s-search">
          <input
            id="s-q"
            className="inp big"
            type="search"
            autoComplete="off"
            placeholder="Cosa vuoi fare? Per esempio: client senza IP, bridge, NAT, backup…"
            aria-label="Cerca una situazione"
            value={v.q}
            onChange={(e) => imposta({ q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, Math.max(0, Math.min(trovate.length, 8) - 1))) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)) }
              else if (e.key === 'Enter' && trovate[sel]) apri(trovate[sel]!)
            }}
          />
          <span className="s-kbd" aria-hidden="true">/</span>
          {v.q.trim() && (
            <div className="s-res" role="listbox">
              {trovate.length === 0 ? (
                <div className="s-none">Nessuna situazione trovata.</div>
              ) : (
                trovate.slice(0, 8).map((id, i) => (
                  <button key={id} type="button" role="option" aria-selected={i === sel} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => apri(id)}>
                    <span className="rt">{dati.schede[id]!.sigla}</span>
                    <span className="rk">{dati.schede[id]!.comando}</span>
                    <span className="rb" data-c={dati.indice.rami[info[id]!.bi]!.colore}>{dati.indice.rami[info[id]!.bi]!.nome}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {dati.avvisi.length > 0 && (
        <details className="s-avv">
          <summary>{dati.avvisi.length} avvisi sui file di questa documentazione</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{dati.avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </details>
      )}
      <div className="s-vpw">
        <div className="s-vp" ref={vp} onScroll={ricorda}>
          <div ref={sizer} style={{ position: 'relative' }}>
            <div ref={palco} className="s-stage" style={{ width: lay.W, height: lay.H }}>
              <svg width={lay.W} height={lay.H} viewBox={`0 0 ${lay.W} ${lay.H}`} aria-hidden="true">
                {lay.link.map((l, i) => (
                  <path key={i} className={'s-lk' + (sfumato(l.bi) ? ' dim' : '')} data-c={dati.indice.rami[l.bi]!.colore} d={l.d} />
                ))}
              </svg>
              {lay.nodi.map((n, i) => {
                const st = { left: n.x, top: n.y, width: n.w, height: n.h }
                if (n.tipo === 'centro') {
                  return <div key={i} className="s-nd s-centro" style={st}><b>{dati.indice.centro}</b><span>{ordine.length} situazioni</span></div>
                }
                const r = dati.indice.rami[n.bi]!
                const dim = sfumato(n.bi, n.ids ?? (n.id ? [n.id] : undefined))
                if (n.tipo === 'ramo') {
                  return (
                    <button key={i} type="button" className={'s-nd s-ramo' + (dim ? ' dim' : '')} data-c={r.colore} style={st} aria-pressed={v.fuoco === n.bi} title={`Livello ${n.bi + 1}: ${r.nome}`} onClick={() => { if (!mosso.current) imposta({ fuoco: v.fuoco === n.bi ? null : n.bi }) }}>
                      <i>{n.bi + 1}</i><span>{r.nome}</span>
                    </button>
                  )
                }
                if (n.tipo === 'gruppo') return <div key={i} className={'s-nd s-gr' + (dim ? ' dim' : '')} data-c={r.colore} style={st}>{n.gruppo}</div>
                const s = dati.schede[n.id!]!
                const fatta = dati.ripassate.includes(n.id!)
                return (
                  <button key={i} type="button" className={'s-nd s-sc' + (dim ? ' dim' : '')} data-c={r.colore} style={st} title={s.titolo} onClick={() => { if (!mosso.current) apri(n.id!) }}>
                    <span className="lt">{s.sigla}</span>
                    {v.fuoco === n.bi ? <span className="lw">{s.frase}</span> : <span className="lk">{s.comando}</span>}
                    {fatta && <span className="ok" aria-label="ripassata"><Icona nome="spunta" size={11} /></span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="s-zoom" role="group" aria-label="Zoom della mappa">
          <button type="button" className="btn" aria-label="Riduci" onClick={() => zoom(z.current / 1.2)}>−</button>
          <button type="button" className="btn" style={{ minWidth: 60 }} title="Torna al 100%" onClick={() => zoom(1)}>{pct}%</button>
          <button type="button" className="btn" aria-label="Ingrandisci" onClick={() => zoom(z.current * 1.2)}>+</button>
          <button type="button" className="btn" onClick={tutta}>Tutta</button>
        </div>
      </div>
      <p className="s-hint">Clic su un ramo per metterlo a fuoco (<kbd>Esc</kbd> per tornare). Trascina per spostare la mappa; zoom con i pulsanti, <kbd>Ctrl</kbd> + rotella o <kbd>+</kbd> <kbd>−</kbd>. Il numero sul ramo è il livello: dal più semplice al più complesso. <kbd>/</kbd> per cercare.</p>
    </>
  )
}
