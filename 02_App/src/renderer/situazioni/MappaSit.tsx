import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Situazioni } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { calcolaMappa, chiaveGruppo, chiaveRamo, tutteLeChiavi } from './layout'
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

type Props = {
  ctx: Ctx
  v: ReturnType<typeof useSit.getState>['viste'][string]
  imposta: (p: Partial<Props['v']>) => void
  corrisp: Set<string> | null
  sfumato: (bi: number, ids?: string[]) => boolean
  apri: (id: string) => void
}

function Albero({ ctx, v, imposta, corrisp, sfumato, apri }: Props): ReactNode {
  const { rel, dati, ordine } = ctx
  const [pct, setPct] = useState(100)
  const vp = useRef<HTMLDivElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const sizer = useRef<HTMLDivElement>(null)
  const z = useRef(1)
  const mosso = useRef(false)
  const esiste = (id: string): boolean => !!dati.schede[id]
  // aperti davvero: quelli scelti, più (mentre si cerca o si mette a fuoco) i rami e i gruppi che servono
  const aperti = useMemo(() => {
    const set = new Set(v.aperti)
    dati.indice.rami.forEach((r, bi) => {
      if (v.fuoco === bi) {
        set.add(chiaveRamo(bi))
        r.voci.forEach((x) => x.gruppo && set.add(chiaveGruppo(bi, x.gruppo)))
      }
      if (corrisp) {
        const da = r.voci.filter((x) => x.schede.some((i) => corrisp.has(i)))
        if (da.length) set.add(chiaveRamo(bi))
        da.forEach((x) => x.gruppo && set.add(chiaveGruppo(bi, x.gruppo)))
      }
    })
    return set
  }, [v.aperti, v.fuoco, corrisp, dati.indice])
  const lay = useMemo(() => calcolaMappa(dati.indice, esiste, aperti), [dati.indice, dati.schede, aperti]) // eslint-disable-line react-hooks/exhaustive-deps
  const tutteChiavi = useMemo(() => tutteLeChiavi(dati.indice, esiste), [dati.indice, dati.schede]) // eslint-disable-line react-hooks/exhaustive-deps
  const mostra = useRef<{ k: string; bi: number; ids?: string[] } | null>(null)
  const commuta = (k: string, bi: number, ids?: string[]): void => {
    const apre = !v.aperti.includes(k)
    if (apre) mostra.current = { k, bi, ids }
    imposta({ aperti: apre ? [...v.aperti, k] : v.aperti.filter((x) => x !== k) })
  }
  const adatta = useRef(false)
  const prima = useRef<{ ox: number; oy: number } | null>(null)

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
  /** il nodo centrale al centro della finestra */
  const centra = (): void => {
    const el = vp.current
    if (!el) return
    el.scrollLeft = Math.max(0, (lay.W * z.current - el.clientWidth) / 2)
    el.scrollTop = Math.max(0, (lay.H * z.current - el.clientHeight) / 2)
  }
  const tutta = (): void => {
    const el = vp.current
    if (!el) return
    z.current = Math.max(ZMIN, Math.min(1.5, Math.min(el.clientWidth / lay.W, el.clientHeight / lay.H)))
    applica()
    centra()
    ricorda()
  }

  // vista iniziale: quella di prima, oppure centrata
  useLayoutEffect(() => {
    const el = vp.current
    if (!el) return
    const salvata = VISTE.get(rel)
    const p = prima.current
    prima.current = { ox: lay.ox, oy: lay.oy }
    const m = mostra.current
    mostra.current = null
    if (adatta.current) {
      adatta.current = false
      tutta()
    } else if (m) {
      // si è aperto un nodo: si porta in vista quello che è comparso (restringendo lo zoom solo se non ci sta)
      const ns = lay.nodi.filter((n) => n.bi === m.bi && (m.ids ? n.chiave === m.k || (!!n.id && m.ids.includes(n.id)) : true))
      if (ns.length) {
        const x0 = Math.min(...ns.map((n) => n.x)) - 50
        const x1 = Math.max(...ns.map((n) => n.x + n.w)) + 50
        const y0 = Math.min(...ns.map((n) => n.y)) - 50
        const y1 = Math.max(...ns.map((n) => n.y + n.h)) + 50
        z.current = Math.max(ZMIN, Math.min(z.current, el.clientWidth / (x1 - x0), el.clientHeight / (y1 - y0)))
        applica()
        el.scrollLeft = ((x0 + x1) / 2) * z.current - el.clientWidth / 2
        el.scrollTop = ((y0 + y1) / 2) * z.current - el.clientHeight / 2
        ricorda()
      }
    } else if (p && (p.ox !== lay.ox || p.oy !== lay.oy)) {
      // la mappa è cambiata (un nodo si è aperto o chiuso): resta ferma la parte che si stava guardando, rispetto al centro
      const dx = (el.scrollLeft + el.clientWidth / 2) / z.current - p.ox
      const dy = (el.scrollTop + el.clientHeight / 2) / z.current - p.oy
      applica()
      el.scrollLeft = (lay.ox + dx) * z.current - el.clientWidth / 2
      el.scrollTop = (lay.oy + dy) * z.current - el.clientHeight / 2
      ricorda()
    } else if (salvata) {
      z.current = salvata.z
      applica()
      el.scrollLeft = salvata.l
      el.scrollTop = salvata.t
    } else {
      z.current = Math.max(ZMIN, Math.min(1, el.clientWidth / lay.W, el.clientHeight / lay.H))
      applica()
      centra()
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

  return (
    <>
      <div className="s-vpw">
        <div className="s-vp" ref={vp} onScroll={ricorda}>
          <div ref={sizer} className="s-sizer">
            <div ref={palco} className="s-stage" style={{ width: lay.W, height: lay.H }}>
              <svg width={lay.W} height={lay.H} viewBox={`0 0 ${lay.W} ${lay.H}`} aria-hidden="true">
                <g transform={`translate(${lay.ox} ${lay.oy})`}>
                  {lay.link.map((l, i) => (
                    <path key={i} className={'s-lk' + (l.sottile ? ' thin' : '') + (l.bi < 0 ? ' neutro' : '') + (sfumato(l.bi) ? ' dim' : '')} data-c={l.bi < 0 ? undefined : dati.indice.rami[l.bi]!.colore} d={l.d} />
                  ))}
                </g>
              </svg>
              {lay.nodi.map((n, i) => {
                const st = { left: n.x, top: n.y, width: n.w, height: n.h }
                if (n.tipo === 'centro') {
                  return <div key={i} className="s-nd s-centro" style={st}><b>{dati.indice.centro}</b><span>{ordine.length} situazioni</span></div>
                }
                const r = dati.indice.rami[n.bi]!
                const dim = sfumato(n.bi, n.ids ?? (n.id ? [n.id] : undefined))
                if (n.tipo === 'ramo' || n.tipo === 'gruppo') {
                  const k = n.chiave!
                  const ramo = n.tipo === 'ramo'
                  return (
                    <button
                      key={i}
                      type="button"
                      className={'s-nd ' + (ramo ? 's-ramo' : 's-gr') + (dim ? ' dim' : '') + (n.aperto ? ' open' : '')}
                      data-c={r.colore}
                      style={st}
                      aria-expanded={n.aperto}
                      title={`${ramo ? `Livello ${n.bi + 1}: ${r.nome}` : n.gruppo}: doppio clic per ${n.aperto ? 'chiudere' : 'aprire'} (${n.n} situazioni)`}
                      onDoubleClick={() => { if (!mosso.current) commuta(k, n.bi, ramo ? undefined : n.ids) }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' && !n.aperto) { e.preventDefault(); commuta(k, n.bi, ramo ? undefined : n.ids) }
                        else if (e.key === 'ArrowLeft' && n.aperto) { e.preventDefault(); commuta(k, n.bi, ramo ? undefined : n.ids) }
                      }}
                    >
                      {ramo && <i>{n.bi + 1}</i>}
                      <span>{ramo ? r.nome : n.gruppo}</span>
                      <em className="s-ap" role="presentation" onClick={(e) => { e.stopPropagation(); if (!mosso.current) commuta(k, n.bi, ramo ? undefined : n.ids) }} onDoubleClick={(e) => e.stopPropagation()}>{n.aperto ? '−' : `+${n.n}`}</em>
                    </button>
                  )
                }
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
          <button type="button" className="btn" title="Apre tutti i rami e i gruppi" onClick={() => { adatta.current = true; imposta({ aperti: tutteChiavi }) }}>Apri tutto</button>
          <button type="button" className="btn" title="Chiude i rami: resta il centro con i suoi rami" onClick={() => { adatta.current = true; imposta({ aperti: [], fuoco: null }) }}>Chiudi tutto</button>
        </div>
      </div>
      <p className="s-hint"><b>Doppio clic</b> su un ramo o un gruppo per aprirlo o chiuderlo (o il <b>+</b> sul nodo). Trascina per spostare la mappa; zoom con i pulsanti, <kbd>Ctrl</kbd> + rotella o <kbd>+</kbd> <kbd>−</kbd>. Il numero sul ramo è il livello: dal più semplice al più complesso. <kbd>/</kbd> per cercare.</p>
    </>
  )
}

export function MappaSit({ ctx }: { ctx: Ctx }): ReactNode {
  const { rel, dati, ordine, info, pagliaio } = ctx
  const v = useSit((x) => x.viste[rel] ?? VISTA0)
  const imposta = (p: Partial<typeof v>): void => useSit.getState().imposta(rel, p)
  const [sel, setSel] = useState(0)
  const trovate = useMemo(() => cerca(v.q, ordine, pagliaio), [v.q, ordine, pagliaio])
  const corrispondenze = useMemo(() => (v.q.trim() ? new Set(trovate) : null), [v.q, trovate])
  const idsRamo = useMemo(() => dati.indice.rami.map((r) => r.voci.flatMap((x) => x.schede)), [dati.indice])
  useEffect(() => setSel(0), [v.q])
  const apri = (id: string): void => imposta({ scheda: id, q: '' })
  const sfumato = (bi: number, ids?: string[]): boolean => {
    if (bi < 0) return false
    if (v.fuoco != null && bi !== v.fuoco) return true
    if (corrispondenze) return !(ids ?? idsRamo[bi]!).some((i) => corrispondenze.has(i))
    return false
  }

  const props: Props = { ctx, v, imposta, corrisp: corrispondenze, sfumato, apri }

  return (
    <>
      <div className="s-top">
        <div>
          <h1>{dati.indice.titolo}</h1>
          {dati.indice.sottotitolo && <p>{dati.indice.sottotitolo}</p>}
        </div>
        <div className="s-tools">
          <div className="s-disp" role="group" aria-label="Disposizione">
            <button type="button" aria-pressed={v.disp === 'albero'} onClick={() => imposta({ disp: 'albero' })}>Albero</button>
            <button type="button" aria-pressed={v.disp === 'griglia'} onClick={() => imposta({ disp: 'griglia' })}>Griglia</button>
          </div>
          <span className="s-count">Ripassate: <b>{dati.ripassate.length}</b> / {ordine.length}</span>
        </div>
        <div className="s-search">
          <input
            id="s-q"
            className="inp big"
            type="search"
            autoComplete="off"
            placeholder={dati.indice.esempiRicerca ? `Cosa vuoi fare? Per esempio: ${dati.indice.esempiRicerca}…` : 'Cosa vuoi fare? Scrivi una situazione o un comando…'}
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
      {v.disp === 'albero' ? <Albero {...props} /> : <Griglia {...props} />}
    </>
  )
}

/** Disposizione a griglia: un riquadro per ramo, del colore del ramo, con dentro gli argomenti e le situazioni. */
function Griglia({ ctx, v, imposta, sfumato, apri }: Props): ReactNode {
  const { dati } = ctx
  return (
    <>
      <div className="s-gw">
        <div className="s-gg">
          {dati.indice.rami.map((r, bi) => {
            const ids = r.voci.flatMap((x) => x.schede).filter((id) => dati.schede[id])
            const fatte = ids.filter((id) => dati.ripassate.includes(id)).length
            const dim = sfumato(bi)
            return (
              <section key={r.id} className={'s-gc' + (dim ? ' dim' : '')} data-c={r.colore}>
                <button type="button" className="s-gh" aria-pressed={v.fuoco === bi} title="Metti a fuoco il ramo" onClick={() => imposta({ fuoco: v.fuoco === bi ? null : bi })}>
                  <i>{bi + 1}</i>
                  <span>{r.nome}</span>
                  <em>{fatte}/{ids.length}</em>
                </button>
                {r.voci.map((vc, k) => {
                  const lista = vc.schede.filter((id) => dati.schede[id])
                  if (!lista.length) return null
                  return (
                    <div key={k} className="s-gv">
                      {vc.gruppo && <div className="s-gt">{vc.gruppo}</div>}
                      {lista.map((id) => {
                        const sc = dati.schede[id]!
                        return (
                          <button key={id} type="button" className={'s-gl' + (sfumato(bi, [id]) ? ' dim' : '')} title={sc.titolo} onClick={() => apri(id)}>
                            <span className="lt">{sc.sigla}</span>
                            {v.fuoco === bi ? <span className="lw">{sc.frase}</span> : <span className="lk">{sc.comando}</span>}
                            {dati.ripassate.includes(id) && <span className="ok" aria-label="ripassata"><Icona nome="spunta" size={11} /></span>}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>
      </div>
      <p className="s-hint">Clic sul titolo di un riquadro per metterlo a fuoco (<kbd>Esc</kbd> per tornare). Il numero è il livello: dal più semplice al più complesso. <kbd>/</kbd> per cercare.</p>
    </>
  )
}
