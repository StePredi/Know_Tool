import type { ReactNode } from 'react'
import { spezzaFormule } from '@shared/matematica'
import { Formula } from './FormulaVista'

/** Una frase con formule tra apici inversi: il testo resta testo, le formule diventano formule disegnate. */
export function TestoMat({ t }: { t: string }): ReactNode {
  return <>{spezzaFormule(t).map((p, i) => (p.formula ? <Formula key={i} testo={p.testo} /> : <span key={i}>{p.testo}</span>))}</>
}
