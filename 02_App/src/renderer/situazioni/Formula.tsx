import type { ReactNode } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { aLatex } from '@shared/latex'
import { pezziTesto } from '@shared/notazione'

const memoria = new Map<string, string>()

/** HTML di KaTeX per una formula in notazione Know_Tool (con memoria, così non si ricalcola a ogni disegno). */
function html(s: string): string {
  let h = memoria.get(s)
  if (h === undefined) {
    h = katex.renderToString(aLatex(s), { throwOnError: false, output: 'html', strict: 'ignore', trust: (c) => c.command === '\\htmlClass' })
    memoria.set(s, h)
  }
  return h
}

/** Una formula in notazione testuale (senza apici inversi). */
export function Formula({ s }: { s: string }): ReactNode {
  return <span className="mt" dangerouslySetInnerHTML={{ __html: html(s) }} />
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
