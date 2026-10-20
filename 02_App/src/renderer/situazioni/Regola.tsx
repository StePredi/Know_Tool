import type { ReactNode } from 'react'
import type { SchedaRegola, Situazioni } from '@shared/situazioni'
import { useSit } from './stato'
import { Formula, Misto, TestoMat } from './Formula'

/** Corpo di una scheda «regola» (matematica): riconosci, formula, adattamenti, esempi, errore, confusioni, perché. */
export function Regola({ rel, dati, s }: { rel: string; dati: Situazioni; s: SchedaRegola }): ReactNode {
  const apri = (x: string): void => useSit.getState().imposta(rel, { scheda: x })
  const formule = Array.isArray(s.formula) ? s.formula : [s.formula]
  return (
    <>
      <h2 className="s-sec">Formula</h2>
      <div className="rg-for">{formule.map((f, i) => <div key={i}><Formula s={f} /></div>)}</div>
      {s.adatto.length > 0 && (
        <>
          <h2 className="s-sec">Come adattarla</h2>
          <ul className="rg-lista">{s.adatto.map((a, i) => <li key={i}><TestoMat s={a} /></li>)}</ul>
        </>
      )}
      {s.esempi.length > 0 && (
        <>
          <h2 className="s-sec">Esempi svolti</h2>
          {s.esempi.map((e, i) => (
            <div key={i} className="rg-es">
              <div className="rg-da"><Misto s={e.da} /></div>
              <ol>
                {e.passi.map((p, k) => typeof p === 'string'
                  ? <li key={k}><TestoMat s={p} /></li>
                  : (
                    <li key={k}>
                      <TestoMat s={p.dice} />
                      {(p.perche || p.scheda) && (
                        <small> — {p.perche ? <TestoMat s={p.perche} /> : null}{p.scheda && dati.schede[p.scheda] ? <> <button type="button" className="rg-l" onClick={() => apri(p.scheda!)}>{dati.schede[p.scheda]!.sigla}</button></> : null}</small>
                      )}
                    </li>
                  ))}
              </ol>
              <div className="rg-ris">= <Misto s={e.ris} /></div>
            </div>
          ))}
        </>
      )}
      {s.errore && (<><h2 className="s-sec">L'errore tipico</h2><p className="rg-err"><TestoMat s={s.errore} /></p></>)}
      {s.confondi.length > 0 && (
        <>
          <h2 className="s-sec">Da non confondere con</h2>
          <div className="rg-conf">
            {s.confondi.filter((c) => dati.schede[c.scheda]).map((c) => (
              <button key={c.scheda} type="button" className="s-chip" data-c={dati.indice.rami.find((r) => r.voci.some((v) => v.schede.includes(c.scheda)))?.colore} onClick={() => apri(c.scheda)}>
                <b>{dati.schede[c.scheda]!.sigla}</b><small><TestoMat s={c.differenza} /></small>
              </button>
            ))}
          </div>
        </>
      )}
      {s.perche && (<><h2 className="s-sec">Perché funziona</h2><p className="rg-per"><TestoMat s={s.perche} /></p></>)}
    </>
  )
}
