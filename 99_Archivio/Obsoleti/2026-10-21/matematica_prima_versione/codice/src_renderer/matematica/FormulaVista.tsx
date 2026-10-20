import type { ReactNode } from 'react'
import { inTesto, leggiFormula, type Nodo } from './formula'

const resa = (nodi: Nodo[]): ReactNode[] =>
  nodi.map((n, i) => {
    switch (n.t) {
      case 'txt': return <span key={i}>{n.s}</span>
      case 'var': return <i key={i} className="fm-v">{n.s}</i>
      case 'fun': return <span key={i} className="fm-fn">{n.s}</span>
      case 'op': return <span key={i} className="fm-op">{n.s}</span>
      case 'apice': return <sup key={i} className="fm-sup">{resa(n.v)}</sup>
      case 'pedice': return <sub key={i} className="fm-sub">{resa(n.v)}</sub>
      case 'frazione': return (
        <span key={i} className="fm-fr">
          <span className="fm-n">{resa(n.n)}</span>
          <span className="fm-d">{resa(n.d)}</span>
        </span>
      )
      case 'radice': return (
        <span key={i} className="fm-rad">
          <span className="fm-rs">√</span>
          <span className="fm-rv">{resa(n.v)}</span>
        </span>
      )
    }
  })

/** Una formula scritta col testo normale (x^2, sqrt(x), (a)/(b), pi, >=…) disegnata in forma leggibile. */
export function Formula({ testo, grande }: { testo: string; grande?: boolean }): ReactNode {
  const nodi = leggiFormula(testo)
  return <span className={'fm' + (grande ? ' fm-g' : '')} role="img" aria-label={inTesto(nodi)}>{resa(nodi)}</span>
}
