import { useState, type ReactNode } from 'react'
import type { Situazioni } from '@shared/situazioni'
import { Comando, Formula, Misto, TestoMat } from './Formula'
import { sezioniFormulario } from './dati_formulario'

/** Tutte le formule di una documentazione di matematica in una pagina, raggruppate per ramo, da tenere accanto agli esercizi. */
export function Formulario({ dati, corrisp, apri }: { dati: Situazioni; corrisp: Set<string> | null; apri: (id: string) => void }): ReactNode {
  const [conVedo, setConVedo] = useState(false)
  const [aperte, setAperte] = useState<Set<string>>(new Set())
  const commuta = (id: string): void => setAperte((a) => { const n = new Set(a); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const rami = sezioniFormulario(dati, corrisp)
  return (
    <div className="fo">
      <div className="fo-bar">
        <div className="s-disp" role="group" aria-label="Quanto mostrare">
          <button type="button" aria-pressed={!conVedo} onClick={() => setConVedo(false)}>Solo formule</button>
          <button type="button" aria-pressed={conVedo} onClick={() => setConVedo(true)}>Con «cosa vedo»</button>
        </div>
        <button type="button" className="btn" onClick={() => window.print()}>Stampa</button>
      </div>
      {rami.length === 0 && <p className="fo-vuoto">Nessuna formula corrisponde alla ricerca.</p>}
      <div className="fo-wrap">
        {rami.map(({ id: rid, nome, colore, n, ids }) => (
          <section key={rid} className="fo-ramo" data-c={colore}>
            <h2><i>{n}</i>{nome}</h2>
            {ids.map((id) => {
              const s = dati.schede[id]!
              const aperta = aperte.has(id)
              const formule = s.tipo === 'regola' ? (Array.isArray(s.formula) ? s.formula : [s.formula]) : null
              return (
                <div key={id} className={'fo-r' + (aperta ? ' open' : '')}>
                  <button type="button" className="fo-b" aria-expanded={aperta} onClick={() => commuta(id)}>
                    <span className="fo-n">{s.sigla}</span>
                    <span className="fo-f">{formule ? formule.map((f, i) => <span key={i} className="fo-fl"><Formula s={f} /></span>) : <Comando s={s} />}</span>
                    {conVedo && s.tipo === 'regola' && s.vedo && <span className="fo-v"><TestoMat s={s.vedo} /></span>}
                  </button>
                  {aperta && (
                    <div className="fo-più">
                      {s.tipo === 'regola' && s.adatto.length > 0 && <ul>{s.adatto.map((a, i) => <li key={i}><TestoMat s={a} /></li>)}</ul>}
                      {s.tipo === 'regola' && s.esempi[0] && <div className="fo-ex">Es. <Misto s={s.esempi[0].da} /> → <Misto s={s.esempi[0].ris} /></div>}
                      {s.tipo === 'regola' && s.errore && <div className="fo-er">Errore: <TestoMat s={s.errore} /></div>}
                      <button type="button" className="btn" onClick={() => apri(id)}>Apri la scheda →</button>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
