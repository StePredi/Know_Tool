// Scheda «spiegazione»: la teoria senza codice, in testo normale con riquadri, tabelle e disegni
// (pile di livelli e flussi con frecce), nello stile delle slide del corso.
import { createContext, Fragment, useContext, useId, useState, type ReactNode } from 'react'
import type { BloccoSpieg, CartaSpieg, DisegnoSpieg, NodoFlusso, SchedaSpiegazione, StratoPila, Tono } from '@shared/situazioni'
import { Testo } from '../storia/Voce'

/** «Mettiti alla prova»: i pezzi da ricordare si coprono e si scoprono con un clic. */
const Prova = createContext<{ attiva: boolean; scoperti: Set<string>; scopri: (id: string) => void }>({ attiva: false, scoperti: new Set(), scopri: () => undefined })

function Cop({ children }: { children: ReactNode }): ReactNode {
  const id = useId()
  const { attiva, scoperti, scopri } = useContext(Prova)
  if (!attiva) return <>{children}</>
  const visto = scoperti.has(id)
  return (
    <span className={'s-lc' + (visto ? ' rev' : '')} onClick={() => !visto && scopri(id)} title={visto ? undefined : 'clicca per scoprire'}>
      {children}
    </span>
  )
}

/** Testo di un riquadro: la prima riga in evidenza, le altre (dopo un a capo) in piccolo. */
function Etichetta({ s }: { s: string }): ReactNode {
  const [prima, ...altre] = s.split('\n')
  return (
    <>
      <span className="sp-bx-t"><Testo s={prima ?? ''} /></span>
      {altre.map((a, i) => <small key={i}><Testo s={a} /></small>)}
    </>
  )
}

function Strato({ s }: { s: StratoPila }): ReactNode {
  const { testi, tono } = typeof s === 'string' || Array.isArray(s)
    ? { testi: ([] as string[]).concat(s), tono: 'chiaro' as Tono }
    : { testi: ([] as string[]).concat(s.testo), tono: s.tono }
  return (
    <div className="sp-st">
      {testi.map((t, i) => <div key={i} className={'sp-bx t-' + tono}><Cop><Etichetta s={t} /></Cop></div>)}
    </div>
  )
}

function Pile({ d }: { d: Extract<DisegnoSpieg, { modello: 'pile' }> }): ReactNode {
  return (
    <figure className="sp-fig">
      <div className="sp-pile" style={{ ['--n' as string]: d.colonne.length }}>
        {d.colonne.map((c, i) => {
          const strati = <div className="sp-strati">{c.strati.map((s, k) => <Strato key={k} s={s} />)}</div>
          return (
            <div key={i} className="sp-col">
              {c.titolo && <b className="sp-ct">{c.titolo}</b>}
              {c.cornice ? <div className="sp-cornice"><span>{c.cornice}</span>{strati}</div> : strati}
              {c.nota && <p className="sp-cn"><Testo s={c.nota} /></p>}
            </div>
          )
        })}
      </div>
      {d.nota && <figcaption><Testo s={d.nota} /></figcaption>}
    </figure>
  )
}

function Nodo({ n }: { n: NodoFlusso }): ReactNode {
  const o = typeof n === 'string' ? { nome: n, sotto: '', punti: [] as string[], tono: 'chiaro' as Tono } : n
  return (
    <div className={'sp-nodo t-' + o.tono}>
      <b><Testo s={o.nome} /></b>
      {o.sotto && <small><Testo s={o.sotto} /></small>}
      {o.punti.length > 0 && <ul>{o.punti.map((p, i) => <li key={i}><Testo s={p} /></li>)}</ul>}
    </div>
  )
}

function Freccia({ s }: { s: string }): ReactNode {
  return (
    <div className="sp-fr" aria-label={s ? `freccia: ${s}` : 'freccia'}>
      {s && <span>{s}</span>}
      <svg viewBox="0 0 40 14" aria-hidden><path d="M0 7h31" /><path d="M29 2l8 5-8 5z" /></svg>
    </div>
  )
}

function Flusso({ d }: { d: Extract<DisegnoSpieg, { modello: 'flusso' }> }): ReactNode {
  const pezzi: ReactNode[] = []
  const nodo = (i: number): ReactNode => <Nodo key={'n' + i} n={d.nodi[i]!} />
  const freccia = (i: number): ReactNode => <Freccia key={'f' + i} s={d.frecce[i] ?? ''} />
  const g = d.gruppo
  for (let i = 0; i < d.nodi.length; i++) {
    if (g && i === g.da - 1) {
      const dentro: ReactNode[] = []
      for (let k = i; k < g.a; k++) {
        dentro.push(nodo(k))
        if (k < g.a - 1) dentro.push(freccia(k))
      }
      pezzi.push(<div key="g" className="sp-gruppo"><span>{g.nome}</span><div className="sp-riga">{dentro}</div></div>)
      i = g.a - 1
    } else pezzi.push(nodo(i))
    if (i < d.nodi.length - 1) pezzi.push(freccia(i))
  }
  return (
    <figure className="sp-fig">
      <div className="sp-flusso sp-riga">{pezzi}</div>
      {d.nota && <figcaption><Testo s={d.nota} /></figcaption>}
    </figure>
  )
}

function Carta({ c }: { c: CartaSpieg }): ReactNode {
  return (
    <div className="sp-carta">
      <h3>{c.titolo}{c.etichetta && <span className="sp-pill">{c.etichetta}</span>}</h3>
      {c.sotto && <p className="sp-sotto"><Testo s={c.sotto} /></p>}
      {c.testo && <p><Testo s={c.testo} /></p>}
      {c.numeri.map((n, i) => <div key={i} className="sp-num"><b><Cop>{n.valore}</Cop></b>{n.cosa && <small>{n.cosa}</small>}</div>)}
      {c.punti.length > 0 && <ul>{c.punti.map((p, i) => <li key={i}><Testo s={p} /></li>)}</ul>}
    </div>
  )
}

function Blocco({ b }: { b: BloccoSpieg }): ReactNode {
  if ('titolo' in b) return <h2 className="s-sec">{b.titolo}</h2>
  if ('testo' in b) return <p className="sp-p"><Testo s={b.testo} /></p>
  if ('punti' in b) return <ul className="sp-ul">{b.punti.map((p, i) => <li key={i}><Testo s={p} /></li>)}</ul>
  if ('carte' in b) return <div className="sp-carte">{b.carte.map((c, i) => <Carta key={i} c={c} />)}</div>
  if ('tabella' in b) {
    return (
      <div className="sp-tabw">
        <table className="sp-tab">
          <thead><tr>{b.tabella.colonne.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
          <tbody>{b.tabella.righe.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{k === 0 ? <Testo s={c} /> : <Cop><Testo s={c} /></Cop>}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }
  if ('disegno' in b) return b.disegno.modello === 'pile' ? <Pile d={b.disegno} /> : <Flusso d={b.disegno} />
  if ('comandi' in b) {
    return <ul className="s-vars sp-cmd">{b.comandi.map((c, i) => <li key={i}><code>{c.codice}</code><span>{c.spiega}</span></li>)}</ul>
  }
  if ('nota' in b) return <p className="sp-nota"><Testo s={b.nota} /></p>
  return <p className="sp-trap">⚠ <Testo s={b.trappola} /></p>
}

/** Il corpo della scheda (la testata e il piede sono quelli comuni). */
export function Spiegazione({ s, prova = false }: { s: SchedaSpiegazione; prova?: boolean }): ReactNode {
  const [scoperti, setScoperti] = useState<Set<string>>(new Set())
  return (
    <Prova.Provider value={{ attiva: prova, scoperti, scopri: (id) => setScoperti((o) => new Set(o).add(id)) }}>
      <div className={'sp' + (prova ? ' s-quiz' : '')}>{s.blocchi.map((b, i) => <Fragment key={i}><Blocco b={b} /></Fragment>)}</div>
    </Prova.Provider>
  )
}
