import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SchedaConfronto, SchedaFigura, SchedaPrimaDopo, SchedaRegola, SchedaRicetta, SchedaSpiegazione, SchedaVoce, Situazioni } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { useStore } from '../store'
import { Cod, testoPuro } from './Codice'
import { codiceDaCopiare, righeCodice } from './righe'
import { DisegnoScheda } from './Figura'
import { Comando, TestoMat } from './Formula'
import { Regola } from './Regola'
import { Spiegazione } from './Spiegazione'
import { elementiDaCoprire } from '@shared/testoSpiegazione'
import { Confronto, Voce } from '../storia/Voce'
import { ModificaScheda } from './ModificaScheda'
import { useSit, VISTA0 } from './stato'
import type { InfoScheda } from './util'

interface Ctx {
  rel: string
  dati: Situazioni
  ordine: string[]
  info: Record<string, InfoScheda>
}

function copia(testo: string): void {
  const ok = (): void => useStore.getState().mostraToast('Copiato')
  const no = (): void => useStore.getState().mostraToast('Copia non riuscita')
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(testo).then(ok, no)
  else no()
}

function Testata({ ctx, id, tipo }: { ctx: Ctx; id: string; tipo: string }): ReactNode {
  const s = ctx.dati.schede[id]!
  const inf = ctx.info[id]!
  const r = ctx.dati.indice.rami[inf.bi]!
  const ricetta = s.tipo !== 'prima_dopo'
  const storia = s.tipo === 'voce' || s.tipo === 'confronto'
  return (
    <>
      <div className="s-bar">
        <button type="button" className="btn" onClick={() => useSit.getState().imposta(ctx.rel, { scheda: null })}>← Mappa</button>
        <span className="s-lvl">Livello {inf.bi + 1}: {r.nome}{inf.gruppo ? ` · ${inf.gruppo}` : ''}</span>
        <button type="button" className="btn m-vai" title="Modifica questa scheda" onClick={() => useSit.getState().imposta(ctx.rel, { modifica: true })}>
          <Icona nome="matita" size={14} /> Modifica
        </button>
      </div>
      <div className="s-head">
        <div>
          <div className="s-kind">{tipo}{s.tipo === 'voce' && s.svolta ? ' · punto di svolta' : ''}{s.fonte ? ` · ${s.fonte}` : ''}</div>
          <h1>{s.titolo}</h1>
          {storia ? null : s.tipo === 'regola' ? <span className="s-cn rg-cn"><Comando s={s} /></span> : <span className="s-cn">{s.comando}</span>}
        </div>
        {!storia && (
          <div className="s-when">
            <b>{s.tipo === 'regola' ? 'Cosa vedo' : ricetta ? 'Quando serve' : 'A cosa serve'}</b>
            <p>{s.tipo === 'prima_dopo' ? s.uso : s.tipo === 'regola' ? <TestoMat s={s.frase} /> : s.quando}</p>
          </div>
        )}
      </div>
    </>
  )
}

function Piede({ ctx, id }: { ctx: Ctx; id: string }): ReactNode {
  const s = ctx.dati.schede[id]!
  const esempi = useSit((x) => (x.viste[ctx.rel] ?? VISTA0).esempi)
  const i = ctx.ordine.indexOf(id)
  const pv = ctx.ordine[i - 1]
  const nx = ctx.ordine[i + 1]
  const apri = (x: string): void => useSit.getState().imposta(ctx.rel, { scheda: x })
  const fatta = ctx.dati.ripassate.includes(id)
  const slots = s.tipo === 'ricetta' ? s.segnaposto : undefined
  return (
    <>
      {s.varianti.length > 0 && (
        <>
          <h2 className="s-sec">Varianti</h2>
          <ul className="s-vars">
            {s.varianti.map((v, k) => <li key={k}><code><Cod txt={v.codice} esempi={esempi} slots={slots} /></code><span>{v.spiega}</span></li>)}
          </ul>
        </>
      )}
      <div className="s-nav">
        {pv ? <button type="button" onClick={() => apri(pv)}><small>← Precedente · livello {ctx.info[pv]!.bi + 1}</small><b>{ctx.dati.schede[pv]!.sigla}</b></button> : <span />}
        {nx ? <button type="button" className="nx" onClick={() => apri(nx)}><small>Successiva · livello {ctx.info[nx]!.bi + 1} →</small><b>{ctx.dati.schede[nx]!.sigla}</b></button> : <span />}
      </div>
      {s.vicine.length > 0 && (
        <>
          <h2 className="s-sec">Situazioni vicine</h2>
          <div className="s-rels">
            {s.vicine.filter((v) => ctx.dati.schede[v]).map((v) => (
              <button key={v} type="button" className="s-chip" data-c={ctx.dati.indice.rami[ctx.info[v]!.bi]!.colore} onClick={() => apri(v)}>
                {ctx.dati.schede[v]!.sigla}<small><Comando s={ctx.dati.schede[v]!} /></small>
              </button>
            ))}
          </div>
        </>
      )}
      {(s.tipo === 'voce' || s.tipo === 'confronto') && s.da.length > 0 && (
        <p className="vc-da">
          Dal libro: {s.da.map((d, i) => <code key={i}>{`${d.l} cap. ${d.c}${d.p ? ` par. ${d.p}` : ''}${d.dove ? ` (${d.dove})` : ''}`}</code>)}
          {s.parole ? <span className="vc-pc">parole chiave: {s.parole}</span> : null}
        </p>
      )}
      <div className="s-mark">
        <button
          type="button"
          className="btn"
          aria-pressed={fatta}
          onClick={() => {
            void useSit.getState().ripassata(ctx.rel, id).then(() => { if (!fatta) useStore.getState().mostraToast('Segnata come ripassata') })
          }}
        >
          {fatta ? '✓ Ripassata' : 'Segna come ripassata'}
        </button>
      </div>
    </>
  )
}

function Ricetta({ ctx, s }: { ctx: Ctx; s: SchedaRicetta }): ReactNode {
  const v = useSit((x) => x.viste[ctx.rel] ?? VISTA0)
  const imposta = (p: Partial<typeof v>): void => useSit.getState().imposta(ctx.rel, p)
  const [hot, setHot] = useState<number | null>(null)
  const [flash, setFlash] = useState<number | null>(null)
  const [rev, setRev] = useState<Set<number>>(new Set())
  const nSlot = Object.keys(s.segnaposto).length

  // numerazione delle righe attraverso tutte le fasi
  const { fasi, trappole, nRighe } = useMemo(() => {
    let n = 0
    const trappole: { n: number; t: string }[] = []
    const fasi = s.fasi.map((f) => ({
      nome: f.nome,
      righe: f.righe.map((r) => {
        n++
        const sl = [...new Set((r.codice.match(/«[A-Z0-9_]+»/g) ?? []).map((x) => x.slice(1, -1)))]
        if (r.trappola) trappole.push({ n, t: r.trappola })
        return { n, r, sl, nota: !!(r.parti?.length || r.trappola || sl.length) }
      })
    }))
    return { fasi, trappole, nRighe: n }
  }, [s])

  const testoFase = (i: number): string => s.fasi[i]!.righe.map((r) => testoPuro(codiceDaCopiare(r.codice), v.esempi, s.segnaposto)).join('\n')
  const vai = (n: number): void => {
    document.getElementById(`L${n}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(n)
    setTimeout(() => setFlash(null), 1600)
  }
  const chiudiProva = (b: boolean): void => { setRev(new Set()); imposta({ prova: b }) }

  return (
    <div className={v.prova ? 's-quiz' : ''} onMouseOver={(e) => { const el = (e.target as HTMLElement).closest('[data-n]'); setHot(el ? Number(el.getAttribute('data-n')) : null) }} onMouseLeave={() => setHot(null)}>
      <Testata ctx={ctx} id={s.id} tipo="Ricetta" />
      <div className="s-sum">
        <span className="st"><b>{nRighe}</b> righe</span>
        <span className="st tp"><b>{trappole.length}</b> trappole</span>
        <span className="st"><b>{nSlot}</b> segnaposto</span>
        <div className="sp">
          {nSlot > 0 && <button type="button" className="btn" aria-pressed={v.esempi} onClick={() => imposta({ esempi: !v.esempi })}>Valori d'esempio</button>}
          <button type="button" className="btn" aria-pressed={v.prova} onClick={() => chiudiProva(!v.prova)}>Mettiti alla prova</button>
          <button type="button" className="btn" onClick={() => copia(s.fasi.map((_, i) => testoFase(i)).join('\n'))}>Copia tutto</button>
        </div>
      </div>
      {trappole.length > 0 && (
        <div className="s-trapbox">
          <h3>⚠ Trappole di questa scheda</h3>
          <ul>{trappole.map((t) => <li key={t.n}><button type="button" onClick={() => vai(t.n)}><b>Riga {t.n}:</b> {t.t}</button></li>)}</ul>
        </div>
      )}
      {fasi.map((f, pi) => {
        const note = f.righe.filter((x) => x.nota)
        return (
          <section key={pi} className="s-phase">
            <header>
              <span className="s-pn">{pi + 1}</span>
              <h3>{f.nome}</h3>
              <button type="button" className="btn" onClick={() => copia(testoFase(pi))}>Copia</button>
            </header>
            <div className={'s-pg' + (note.length ? '' : ' solo')}>
              <div className="s-code">
                {f.righe.map(({ n, r, nota }) => {
                  const { ind, righe } = righeCodice(r.codice)
                  const extra = (
                    <>
                      {r.commento && <span className="s-cm"> {ctx.dati.indice.prefissoCommento} {r.commento}</span>}
                      {nota && <span className={'s-mk' + (r.trappola ? ' tp' : '')}>{n}</span>}
                    </>
                  )
                  const codice = (t: string): ReactNode => (
                    <span className={'s-lc' + (rev.has(n) ? ' rev' : '')} onClick={() => v.prova && setRev((o) => new Set(o).add(n))}>
                      <Cod txt={t} esempi={v.esempi} slots={s.segnaposto} />
                    </span>
                  )
                  return (
                    <div key={n} id={`L${n}`} className={'s-ln' + (hot === n ? ' hl' : '') + (flash === n ? ' flash' : '')} data-n={n} style={{ ['--ind' as string]: ind }}>
                      <span className="no">{n}</span>
                      <span className="lt">
                        {righe.length > 1
                          ? righe.map((x, k) => <span key={k} className="s-bl" style={{ ['--rel' as string]: x.rel }}>{codice(x.t || ' ')}{k === righe.length - 1 && extra}</span>)
                          : <>{codice(righe[0]?.t ?? '')}{extra}</>}
                      </span>
                    </div>
                  )
                })}
              </div>
              {note.length > 0 && (
                <aside className="s-notes" aria-label="Note alle righe">
                  {note.map(({ n, r, sl }) => (
                    <div key={n} className={'s-note' + (r.trappola ? ' hastrap' : '') + (hot === n ? ' hl' : '')} data-n={n}>
                      <b className="s-nn">{n}</b>
                      <div>
                        {(r.parti ?? []).map((p, k) => <p key={k}><code>{p.voce}</code> — {p.spiega}</p>)}
                        {sl.filter((x) => s.segnaposto[x]).map((x) => (
                          <p key={x}><code className="phc">«{x}»</code> — {s.segnaposto[x]!.spiega} <span className="exv">(es. {s.segnaposto[x]!.esempio})</span></p>
                        ))}
                        {r.trappola && <p className="tr">⚠ {r.trappola}</p>}
                      </div>
                    </div>
                  ))}
                </aside>
              )}
            </div>
          </section>
        )
      })}
      <Piede ctx={ctx} id={s.id} />
    </div>
  )
}

function RigheConfronto({ src, cls, prova, rev, setRev, chiave }: { src: string; cls: 'del' | 'add'; prova: boolean; rev: Set<string>; setRev: (f: (o: Set<string>) => Set<string>) => void; chiave: string }): ReactNode {
  return (
    <div className="s-code">
      {src.split('\n').map((riga, i) => {
        const ind = riga.match(/^ */)![0].length
        const k = `${chiave}${i}`
        return (
          <div key={i} className="s-ln" style={{ ['--ind' as string]: ind }}>
            <span className="no">{i + 1}</span>
            <span className="lt">
              <span className={'s-lc' + (rev.has(k) ? ' rev' : '')} onClick={() => prova && setRev((o) => new Set(o).add(k))}>
                {riga.trim().split(/(⟦.*?⟧)/).map((p, j) => (p.startsWith('⟦') ? <span key={j} className={cls}><Cod txt={p.slice(1, -1)} /></span> : <Fragment key={j}><Cod txt={p} /></Fragment>))}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PrimaDopo({ ctx, s }: { ctx: Ctx; s: SchedaPrimaDopo }): ReactNode {
  const v = useSit((x) => x.viste[ctx.rel] ?? VISTA0)
  const imposta = (p: Partial<typeof v>): void => useSit.getState().imposta(ctx.rel, p)
  const [rev, setRev] = useState<Set<string>>(new Set())
  return (
    <div className={v.prova ? 's-quiz' : ''}>
      <Testata ctx={ctx} id={s.id} tipo="Prima e dopo" />
      <div className="s-sum">
        <span className="st">Confronta le due versioni</span>
        <div className="sp">
          <button type="button" className="btn" aria-pressed={v.evidenzia} onClick={() => imposta({ evidenzia: !v.evidenzia })}>Evidenzia cosa cambia</button>
          <button type="button" className="btn" aria-pressed={v.prova} onClick={() => { setRev(new Set()); imposta({ prova: !v.prova }) }}>Mettiti alla prova</button>
          <button type="button" className="btn" onClick={() => copia(s.dopo.replace(/[⟦⟧]/g, ''))}>Copia la versione pulita</button>
        </div>
      </div>
      <h2 className="s-sec" style={{ marginTop: 6 }}>Il confronto</h2>
      <div className={'s-cmp' + (v.evidenzia ? ' s-hi' : '')}>
        <div className="s-blk bad"><span className="s-lab">Quello che scrivi di solito</span><RigheConfronto src={s.prima} cls="del" prova={v.prova} rev={rev} setRev={setRev} chiave="p" /></div>
        <div className="s-blk good"><span className="s-lab">Versione pulita</span><RigheConfronto src={s.dopo} cls="add" prova={v.prova} rev={rev} setRev={setRev} chiave="d" /></div>
      </div>
      <div className="s-two">
        <div className="s-card"><h3>A cosa serve</h3><p>{s.uso}</p></div>
        <div className="s-card"><h3>Come riconoscerlo nei tuoi comandi</h3><p>{s.riconoscila}</p></div>
      </div>
      <h2 className="s-sec">La versione pulita, pezzo per pezzo</h2>
      <ul className="s-pieces">
        {s.parti.map((p, i) => <li key={i}><code>{p.voce}</code> — {p.spiega}</li>)}
        {s.trappola && <li className="tr">⚠ {s.trappola}</li>}
      </ul>
      <Piede ctx={ctx} id={s.id} />
    </div>
  )
}

function Figura({ ctx, s }: { ctx: Ctx; s: SchedaFigura }): ReactNode {
  return (
    <>
      <Testata ctx={ctx} id={s.id} tipo="Figura" />
      <DisegnoScheda
        d={s.disegno}
        corrente={s.id}
        schede={ctx.dati.schede}
        colore={(id) => ctx.dati.indice.rami[ctx.info[id]!.bi]!.colore}
        apri={(id) => useSit.getState().imposta(ctx.rel, { scheda: id })}
      />
      <Piede ctx={ctx} id={s.id} />
    </>
  )
}

function SpiegazioneScheda({ ctx, s }: { ctx: Ctx; s: SchedaSpiegazione }): ReactNode {
  const v = useSit((x) => x.viste[ctx.rel] ?? VISTA0)
  const n = elementiDaCoprire(s)
  return (
    <>
      <Testata ctx={ctx} id={s.id} tipo="Spiegazione" />
      {n > 0 && (
        <div className="s-sum">
          <span className="st">{v.prova ? <>Clicca sui pezzi sfocati per scoprirli: <b>{n}</b> da ricordare</> : <><b>{n}</b> pezzi da ricordare (numeri, tabelle, livelli dei disegni)</>}</span>
          <div className="sp">
            <button type="button" className="btn" aria-pressed={v.prova} onClick={() => useSit.getState().imposta(ctx.rel, { prova: !v.prova })}>Mettiti alla prova</button>
          </div>
        </div>
      )}
      {/* key: uscendo e rientrando dalla prova i pezzi tornano coperti */}
      <Spiegazione key={String(v.prova)} s={s} prova={v.prova} />
      <Piede ctx={ctx} id={s.id} />
    </>
  )
}

function RegolaScheda({ ctx, s }: { ctx: Ctx; s: SchedaRegola }): ReactNode {
  return (
    <>
      <Testata ctx={ctx} id={s.id} tipo="Regola" />
      <Regola rel={ctx.rel} dati={ctx.dati} s={s} />
      <Piede ctx={ctx} id={s.id} />
    </>
  )
}

function VoceScheda({ ctx, s }: { ctx: Ctx; s: SchedaVoce }): ReactNode {
  const colore = (id: string): string | undefined => (ctx.info[id] ? ctx.dati.indice.rami[ctx.info[id]!.bi]!.colore : undefined)
  return (
    <>
      <Testata ctx={ctx} id={s.id} tipo={s.genere[0]!.toUpperCase() + s.genere.slice(1)} />
      <Voce dati={ctx.dati} s={s} colore={colore} apri={(x) => useSit.getState().imposta(ctx.rel, { scheda: x })} />
      <Piede ctx={ctx} id={s.id} />
    </>
  )
}

function ConfrontoScheda({ ctx, s }: { ctx: Ctx; s: SchedaConfronto }): ReactNode {
  const colore = (id: string): string | undefined => (ctx.info[id] ? ctx.dati.indice.rami[ctx.info[id]!.bi]!.colore : undefined)
  return (
    <>
      <Testata ctx={ctx} id={s.id} tipo="Confronto" />
      <Confronto dati={ctx.dati} s={s} colore={colore} apri={(x) => useSit.getState().imposta(ctx.rel, { scheda: x })} />
      <Piede ctx={ctx} id={s.id} />
    </>
  )
}

export function SchedaVista({ ctx, id }: { ctx: Ctx; id: string }): ReactNode {
  const s = ctx.dati.schede[id]
  const ref = useRef<HTMLDivElement>(null)
  const modifica = useSit((x) => (x.viste[ctx.rel] ?? VISTA0).modifica)
  useEffect(() => { ref.current?.closest('.sit')?.scrollTo(0, 0) }, [id, modifica])
  if (!s) return <p>Questa scheda non c'è più.</p>
  if (modifica) return <div ref={ref}><ModificaScheda key={id} ctx={ctx} id={id} esci={() => useSit.getState().imposta(ctx.rel, { modifica: false })} /></div>
  const r = ctx.dati.indice.rami[ctx.info[id]!.bi]!
  return (
    <div ref={ref} data-c={r.colore}>
      {s.tipo === 'ricetta' ? <Ricetta key={id} ctx={ctx} s={s} />
        : s.tipo === 'figura' ? <Figura key={id} ctx={ctx} s={s} />
        : s.tipo === 'spiegazione' ? <SpiegazioneScheda key={id} ctx={ctx} s={s} />
        : s.tipo === 'regola' ? <RegolaScheda key={id} ctx={ctx} s={s} />
        : s.tipo === 'voce' ? <VoceScheda key={id} ctx={ctx} s={s} />
        : s.tipo === 'confronto' ? <ConfrontoScheda key={id} ctx={ctx} s={s} />
        : <PrimaDopo key={id} ctx={ctx} s={s} />}
    </div>
  )
}
