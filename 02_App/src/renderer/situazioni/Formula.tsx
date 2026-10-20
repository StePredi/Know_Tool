import type { ReactNode } from 'react'
import { leggiFormula, pezziTesto, type NodoF } from '@shared/notazione'

function nodi(n: NodoF[]): ReactNode {
  return n.map((x, i) => {
    if (x.t === 'txt') return x.v
    if (x.t === 'var') return <i key={i} className={'mt-v' + ('fgh'.includes(x.v) ? ' mt-' + x.v : '')}>{x.v}</i>
    if (x.t === 'fn') return <span key={i} className="mt-fn">{x.v}</span>
    if (x.t === 'op') return <span key={i} className={x.v === '·' ? 'mt-op mt-dot' : 'mt-op'}>{x.v}</span>
    if (x.t === 'un') return <span key={i} className="mt-un">{x.v}</span>
    if (x.t === 'sp') return <span key={i} className="mt-sp" />
    if (x.t === 'pr') return <span key={i} className="mt-pr">′</span>
    if (x.t === 'par') return x.grande
      ? <span key={i} className="mt-bg"><span className="mt-bp">(</span>{nodi(x.c)}<span className="mt-bp">)</span></span>
      : <span key={i}>({nodi(x.c)})</span>
    if (x.t === 'sup') return <sup key={i}>{nodi(x.c)}</sup>
    if (x.t === 'sub') return <sub key={i}>{nodi(x.c)}</sub>
    if (x.t === 'rad') return <span key={i}>√<span className="mt-rd">{nodi(x.c)}</span></span>
    return <span key={i} className="mt-fr"><span className="mt-n">{nodi(x.n)}</span><span className="mt-d">{nodi(x.d)}</span></span>
  })
}

/** Una formula in notazione testuale (senza apici inversi). */
export function Formula({ s }: { s: string }): ReactNode {
  return <span className="mt">{nodi(leggiFormula(s))}</span>
}

/** Un testo con formule tra apici inversi. */
export function TestoMat({ s }: { s: string }): ReactNode {
  return pezziTesto(s).map((p, i) => (p.formula ? <Formula key={i} s={p.v} /> : p.v))
}

/** Il comando di una scheda: formula per le regole, testo semplice per le altre. */
export function Comando({ s }: { s: { tipo: string; comando: string } }): ReactNode {
  return s.tipo === 'regola' && /[=^_()'′\d·*+]|frac\(|sqrt\(|->/.test(s.comando) ? <Formula s={s.comando} /> : s.comando
}

/** Una formula intera oppure, se contiene apici inversi, un testo con formule. */
export function Misto({ s }: { s: string }): ReactNode {
  return s.includes('`') ? <TestoMat s={s} /> : <Formula s={s} />
}
