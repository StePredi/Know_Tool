import type { ReactNode } from 'react'
import type { SchedaVoce, Situazioni } from '@shared/situazioni'
import { copertura as calcolaCopertura } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { Testo } from './Voce'
import { useStoria } from './stato'

/** Glossario, «Chi è chi», Svolte: elenchi ricavati dalle schede, non file. */
export function Elenco({ dati, vista, apri }: { dati: Situazioni; vista: 'glossario' | 'persone' | 'svolte'; apri: (id: string) => void }): ReactNode {
  const voci = Object.values(dati.schede).filter((s): s is SchedaVoce => s.tipo === 'voce')
  const conf = {
    glossario: { titolo: 'Glossario', sotto: 'Ricavato: tutte le voci di genere «concetto».', filtro: (s: SchedaVoce) => s.genere === 'concetto', testo: (s: SchedaVoce) => s.cosa },
    persone: { titolo: 'Chi è chi', sotto: 'Ricavato: tutte le voci di genere «persona».', filtro: (s: SchedaVoce) => s.genere === 'persona', testo: (s: SchedaVoce) => s.cosa },
    svolte: { titolo: 'Svolte', sotto: 'Ricavate: le voci segnate come punto di svolta.', filtro: (s: SchedaVoce) => s.svolta, testo: (s: SchedaVoce) => s.conta }
  }[vista]
  const scelte = voci.filter(conf.filtro)
  const ramoDi = (id: string): string | undefined => dati.indice.rami.find((x) => x.voci.some((v) => v.schede.includes(id)))?.colore
  return (
    <div className="st-vista">
      <h1>{conf.titolo}</h1>
      <p className="st-sotto">{conf.sotto}</p>
      {scelte.length === 0 ? (
        <p className="st-vuoto">Nessuna voce di questo tipo in questo argomento.</p>
      ) : (
        <div className="st-elenco">
          {scelte.map((s) => (
            <button key={s.id} type="button" className="st-card" data-c={ramoDi(s.id)} onClick={() => apri(s.id)}>
              <b>{s.titolo}</b>
              <span><Testo s={conf.testo(s)} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Copertura del libro: vista di materia, dice quali paragrafi nessuna scheda copre. */
export function Copertura({ dati, vaiA }: { dati: Situazioni; vaiA: (rel: string, id: string) => void }): ReactNode {
  const materia = dati.rel.split('/').filter(Boolean)[0] ?? ''
  const m = useStoria((s) => s.materia[materia])
  if (!m) return <div className="st-vista"><h1>Copertura del libro</h1><p className="st-sotto">Leggo i documenti della materia…</p></div>
  const righe = calcolaCopertura(m.libri, m.documenti)
  if (righe.length === 0)
    return (
      <div className="st-vista">
        <h1>Copertura del libro</h1>
        <p className="st-sotto">Per vedere la copertura serve il file <code>01_Argomenti/{materia}/_libri.yaml</code> con i capitoli e i paragrafi dei libri.</p>
      </div>
    )
  const coperti = righe.filter((r) => r.schede.length > 0).length
  const pc = Math.round((coperti / righe.length) * 100)
  const perLibro = new Map<string, typeof righe>()
  for (const r of righe) perLibro.set(r.libro, [...(perLibro.get(r.libro) ?? []), r])

  return (
    <div className="st-vista">
      <h1>Copertura del libro</h1>
      <p className="st-sotto">Di tutta la materia {materia}, non di un argomento solo. In rosso i paragrafi che nessuna scheda copre: lì il libro dice cose che nel tool non ci sono.</p>
      <div className="st-cop-tot">
        <b>{coperti} paragrafi su {righe.length} hanno almeno una scheda ({pc}%)</b>
        <div className="st-barra"><div style={{ width: `${pc}%` }} /></div>
      </div>
      {[...perLibro.entries()].map(([libro, rs]) => (
        <section key={libro}>
          <h2 className="st-libro">{libro}</h2>
          {rs.map((r, i) => {
            const nuovoCap = i === 0 || rs[i - 1]!.capitolo !== r.capitolo
            return (
              <div key={`${r.capitolo}-${r.paragrafo}`}>
                {nuovoCap && <div className="st-cap">Cap. {r.capitolo} — {r.titoloCapitolo}</div>}
                <div className={'st-par' + (r.schede.length ? '' : ' scoperto')}>
                  <span className="st-par-n">{r.paragrafo}.</span>
                  <span className="st-par-t">{r.titolo}</span>
                  <span className="st-par-d">
                    {r.schede.length === 0 ? (
                      <span className="st-nessuna"><Icona nome="avviso" size={13} /> nessuna scheda</span>
                    ) : (
                      [...new Set(r.schede.map((x) => x.documento))].map((doc) => {
                        const prima = r.schede.find((x) => x.documento === doc)!
                        const n = r.schede.filter((x) => x.documento === doc).length
                        return (
                          <button key={doc} type="button" className="st-pill ok" onClick={() => vaiA(prima.rel, prima.id)}>
                            {n} in «{doc}»
                          </button>
                        )
                      })
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
