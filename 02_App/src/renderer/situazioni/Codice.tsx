import { Fragment, type ReactNode } from 'react'
import type { SchedaRicetta } from '@shared/situazioni'

type Segnaposti = SchedaRicetta['segnaposto']

const KW = new Set(['add', 'set', 'remove', 'print', 'enable', 'disable', 'export', 'import', 'find', 'where', 'ping', 'save', 'load', 'install', 'reboot', 'upgrade', 'check-for-updates', 'follow', 'setup', 'detail', 'count', 'quit', 'ssh', 'scp', 'ipconfig'])

/** Testo semplice, con un punto dove andare a capo dopo = e , (il codice non scorre mai di lato). */
function piano(s: string): ReactNode {
  return s.split(/([=,])/).map((p, i) => (p === '=' || p === ',' ? <Fragment key={i}>{p}<wbr /></Fragment> : p))
}

export function Segnaposto({ nome, esempi, slots }: { nome: string; esempi: boolean; slots?: Segnaposti }): ReactNode {
  const s = slots?.[nome]
  if (esempi && s) return <span className="s-ph ex" title={`«${nome}»`}>{s.esempio}</span>
  return <span className="s-ph">«{nome}»</span>
}

function dentro(str: string, esempi: boolean, slots?: Segnaposti): ReactNode[] {
  return str.split(/«([A-Z0-9_]+)»/).map((p, i) => (i % 2 ? <Segnaposto key={i} nome={p} esempi={esempi} slots={slots} /> : p))
}

/** Una riga di codice con i colori: parole del comando, stringhe, numeri, segnaposto. */
export function Cod({ txt, esempi = false, slots }: { txt: string; esempi?: boolean; slots?: Segnaposti }): ReactNode {
  if (/^\s*#/.test(txt)) return <span className="s-cm">{dentro(txt, esempi, slots)}</span>
  const re = /«([A-Z0-9_]+)»|("[^"]*")|(\d+(?:\.\d+){0,3}(?:\/\d+)?)|([A-Za-z_][\w-]*)/g
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  let last = 0
  let k = 0
  while ((m = re.exec(txt))) {
    if (m.index > last) out.push(<Fragment key={k++}>{piano(txt.slice(last, m.index))}</Fragment>)
    if (m[1]) out.push(<Segnaposto key={k++} nome={m[1]} esempi={esempi} slots={slots} />)
    else if (m[2]) out.push(<span key={k++} className="s-st">{dentro(m[2], esempi, slots)}</span>)
    else if (m[3]) out.push(<span key={k++} className="s-nu">{m[3]}</span>)
    else out.push(KW.has(m[4]!) ? <span key={k++} className="s-kw">{m[4]}</span> : <Fragment key={k++}>{m[4]}</Fragment>)
    last = re.lastIndex
  }
  if (last < txt.length) out.push(<Fragment key={k++}>{piano(txt.slice(last))}</Fragment>)
  return out
}

/** Il testo da copiare: con i valori d'esempio al posto dei segnaposto, se richiesto. */
export function testoPuro(c: string, esempi: boolean, slots?: Segnaposti): string {
  return c.replace(/«([A-Z0-9_]+)»/g, (m, n: string) => (esempi && slots?.[n] ? slots[n]!.esempio : m))
}
